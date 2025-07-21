import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { forms, materials, roofPolygons, suppliers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createQuoteWithNumber } from '@/db/quotesQueries';
import { RoofPolygon } from '@/types';

// Define a slope factor mapping for pricing calculations
const SLOPE_FACTOR: Record<string, number> = {
  'Flat': 0.4,      // Lowest factor for flat roofs (easiest to work on)
  'Shallow': 0.6,   // Slightly more difficult
  'Medium': 0.8,    // Moderate difficulty
  'Steep': 1.0      // Highest factor for steep roofs (most difficult)
};

// Default factor if slope is not specified or recognized
const DEFAULT_SLOPE_FACTOR = 0.7;

/**
 * POST /api/client/quote
 * 
 * Creates a new quote based on form, material, and supplier data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formId, materialId, supplierId } = body;
    
    // Input validation
    if (!formId || !materialId || !supplierId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: formId, materialId, supplierId' }, 
        { status: 400 }
      );
    }

    // Fetch required data from the database
    // 1. Get material information for pricing
    const materialData = await db.query.materials.findFirst({
      where: eq(materials.id, materialId),
    });
    
    if (!materialData) {
      return NextResponse.json(
        { success: false, message: 'Material not found' },
        { status: 404 }
      );
    }

    // 2. Get supplier information
    const supplierData = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, supplierId),
    });
    
    if (!supplierData) {
      return NextResponse.json(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      );
    }

    // 3. Get form information to verify the form exists
    const formData = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
    });
    
    if (!formData) {
      return NextResponse.json(
        { success: false, message: 'Form not found' },
        { status: 404 }
      );
    }

    // 4. Get roof polygon data to calculate area and determine the slope
    const roofData = await db.query.roofPolygons.findFirst({
      where: eq(roofPolygons.formId, formId),
    });
    
    if (!roofData) {
      return NextResponse.json(
        { success: false, message: 'Roof data not found for this form' },
        { status: 404 }
      );
    }

    // Parse the JSONB polygon data
    const polygons = roofData.polygons as RoofPolygon[];
    if (!Array.isArray(polygons) || polygons.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid roof polygon data' },
        { status: 400 }
      );
    }

    // Calculate total area and apply slope factors for pricing
    let totalCost = 0;
    let totalArea = 0;

    for (const polygon of polygons) {
      // Extract area and slope from the polygon
      const area = polygon.area?.squareFeet || 0;
      const slope = polygon.slope || 'Medium';
      
      // Get the slope factor (defaulting if not found)
      const slopeFactor = SLOPE_FACTOR[slope] || DEFAULT_SLOPE_FACTOR;
      
      // Calculate cost for this polygon
      // Base price is extracted from material price (stored as string, e.g. "$10/sqft")
      const basePriceMatch = materialData.price?.match(/\$(\d+(\.\d+)?)/i);
      const basePrice = basePriceMatch ? parseFloat(basePriceMatch[1]) : 5; // Default to $5 if not found
      
      const polygonCost = area * basePrice * slopeFactor;
      
      totalCost += polygonCost;
      totalArea += area;
    }

    // Round the cost to 2 decimal places and convert to string
    const materialCost = totalCost.toFixed(2);

    // Create the quote using the createQuoteWithNumber function which automatically
    // generates a unique quote number
    const quote = await createQuoteWithNumber({
      formId,
      materialId,
      supplierId,
      materialCost,
      status: 'draft'
    });

    return NextResponse.json({
      success: true,
      quote,
      details: {
        totalArea: totalArea.toFixed(2),
        supplierName: supplierData.name,
        materialType: materialData.type,
      }
    });

  } catch (error: any) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create quote' },
      { status: 500 }
    );
  }
}
