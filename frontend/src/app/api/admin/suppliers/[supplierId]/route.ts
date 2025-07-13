import { NextRequest, NextResponse } from "next/server";
import { getSupplierById, getSupplierByIdWithMaterials } from "@/db/queries";
import { request } from "http";

export async function GET(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  try {
    const suppliers = await getSupplierByIdWithMaterials(params.supplierId);
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}
