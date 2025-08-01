import {
  getSupplierByIdWithMaterials,
  supplierUpdateSchema,
  updateSupplierById,
} from "@/db/queries";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  const { supplierId } = await params;
  try {
    const supplier = await getSupplierByIdWithMaterials(supplierId);
    return NextResponse.json({ supplier });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  const { supplierId } = await params;
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const installation = formData.get("installation") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    // Create update data object without logoUrl initially
    const updateData = {
      name,
      description,
      installation,
      phone,
      email,
    };

    // Only handle logoUrl if a new file is actually uploaded
    const logoFile = formData.get("logoFile") as File;
    if (logoFile && logoFile.size > 0) {
      const logoUrl = await uploadToCloudinary(logoFile);
      Object.assign(updateData, { logoUrl });
    }

    // Validate the update data
    const validatedData = supplierUpdateSchema.parse(updateData);

    const updated = await updateSupplierById(supplierId, validatedData);

    if (!updated) {
      return new Response(JSON.stringify({ error: "Supplier not found" }), {
        status: 404,
      });
    }

    return Response.json(updated);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}
