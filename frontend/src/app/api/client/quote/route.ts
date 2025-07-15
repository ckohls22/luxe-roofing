// /app/api/quote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle"; // your drizzle instance
import {
  forms,
  addresses,
  roofPolygons,
  materials,
  suppliers,
} from "@/db/schema";
import { eq } from "drizzle-orm";

// ------------------------------------------------------------
// Helper: calculate price range
// ------------------------------------------------------------
function calculatePriceRange(
  areaSqft: number,
  basePricePerSqft: number,
  wasteFactor = 1.15, // 15 % waste
  laborFactor = 1.4 // 40 % labor
) {
  const materialCost = areaSqft * basePricePerSqft * wasteFactor;
  const totalCost = materialCost * laborFactor;
  return {
    materialCost: +materialCost.toFixed(2),
    totalCost: +totalCost.toFixed(2),
  };
}

// ------------------------------------------------------------
// POST handler
// ------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formId, supplierId, materialId } = body;

    // 1. Form
    const [formRow] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);
    if (!formRow)
      return NextResponse.json({ error: "Form not found" }, { status: 404 });

    // 2. Address
    const [addrRow] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.formId, formId))
      .limit(1);

    // 3. Roof polygons
    const [roofRow] = await db
      .select()
      .from(roofPolygons)
      .where(eq(roofPolygons.formId, formId))
      .limit(1);
    if (!roofRow)
      return NextResponse.json({ error: "Roof data missing" }, { status: 400 });

    // 4. Material & Supplier
    const [matRow] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);
    if (!matRow)
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );

    const [supRow] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    // 5. Price calculation
    const basePrice = parseFloat(matRow.price || "0");
    const { materialCost, totalCost } = calculatePriceRange(
      +roofRow.totalAreaSqft,
      basePrice
    );

    // 6. Compose quote
    const quote = {
      customer: {
        firstName: formRow.firstName,
        lastName: formRow.lastName,
        email: formRow.email,
        phone: formRow.phone,
      },
      address: addrRow?.formattedAddress,
      roof: {
        type: formRow.roofType,
        areaSqft: +roofRow.totalAreaSqft,
        areaSqm: +roofRow.totalAreaSqm,
        polygons: roofRow.polygons,
      },
      supplier: {
        id: supRow?.id,
        name: supRow?.name,
        logoUrl: supRow?.logoUrl,
        phone: supRow?.phone,
        email: supRow?.email,
      },
      material: {
        id: matRow.id,
        type: matRow.type,
        warranty: matRow.warranty,
        topFeatures: matRow.topFeatures,
        image: matRow.materialImage,
        basePricePerSqft: basePrice,
      },
      pricing: {
        materialCost,
        estimatedTotal: totalCost,
        currency: "USD",
      },
    };

    return NextResponse.json(quote);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
