import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { roofPolygons } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;

    // Fetch roof polygons for the specified form
    const result = await db
      .select()
      .from(roofPolygons)
      .where(eq(roofPolygons.formId, formId))
      .limit(1);

    // If no polygons found
    if (!result || result.length === 0) {
      return NextResponse.json({ polygons: [] });
    }

    const polygonData = result[0].polygons;

    // Return the roof polygons array
    return NextResponse.json({ polygons: polygonData });
  } catch (error) {
    console.error("Error fetching roof polygons:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch roof polygons",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
