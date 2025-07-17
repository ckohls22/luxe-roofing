import { NextResponse } from "next/server";
import { getAllSuppliersWithMaterials } from "@/db/queries";

export async function GET() {
  try {
    const suppliers = await getAllSuppliersWithMaterials();
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}
