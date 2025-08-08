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
    console.log('Fetching roof polygons for formId:', formId);

    // Fetch roof polygons for the specified form
    const result = await db
      .select()
      .from(roofPolygons)
      .where(eq(roofPolygons.formId, formId))
      .limit(1);

    console.log('Database result:', result);

    // If no polygons found
    if (!result || result.length === 0) {
      console.log('No roof polygons found for formId:', formId);
      return NextResponse.json({ polygons: [] });
    }

    const polygonData = result[0].polygons;
    console.log('Raw polygon data from DB:', polygonData);
    console.log('Polygon data type:', typeof polygonData);

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
