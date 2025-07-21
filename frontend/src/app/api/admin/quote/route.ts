import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { quotes, forms, materials, suppliers } from '@/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import {
  getQuotes,
  getQuoteWithDetails,
  updateQuote,
  deleteQuote,
  getQuotesWithFilters,
} from '@/db/quotesQueries';

/**
 * GET /api/admin/quote
 * Retrieves quotes with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const materialId = searchParams.get('materialId');
    const formId = searchParams.get('formId');
    const minCost = searchParams.get('minCost') ? parseFloat(searchParams.get('minCost')!) : undefined;
    const maxCost = searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost')!) : undefined;

    // Build filters object
    const filters: any = { page, limit };
    if (status) filters.status = status;
    if (supplierId) filters.supplierId = supplierId;
    if (materialId) filters.materialId = materialId;
    if (formId) filters.formId = formId;
    if (minCost !== undefined) filters.minCost = minCost;
    if (maxCost !== undefined) filters.maxCost = maxCost;

    // Get quotes with filters and pagination
    const result = await getQuotesWithFilters(filters);

    // Enhance the result with customer names and material/supplier details
    const enhancedData = await Promise.all(
      result.data.map(async (quote) => {
        const details = await getQuoteWithDetails(quote.id);
        return {
          ...quote,
          customerName: details?.form ? `${details.form.firstName} ${details.form.lastName}` : 'Unknown',
          customerEmail: details?.form?.email || 'Unknown',
          materialType: details?.material?.type || 'Unknown',
          supplierName: details?.supplier?.name || 'Unknown',
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enhancedData,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/quote
 * Creates a new quote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract required fields
    const { formId, materialId, supplierId, materialCost, status } = body;

    // Validate required fields
    if (!formId || !materialId || !supplierId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a unique quote number (YYYY-sequential number)
    const year = new Date().getFullYear();
    const quoteCountResult = await db
      .select({ count: count() })
      .from(quotes)
      .where(
        and(
          sql`EXTRACT(YEAR FROM ${quotes.createdAt}) = ${year}`
        )
      );
    const quoteCount = quoteCountResult[0].count;
    const quoteNumber = `QTE-${year}-${String(quoteCount + 1).padStart(3, '0')}`;

    // Create the new quote
    const [newQuote] = await db
      .insert(quotes)
      .values({
        formId,
        materialId,
        supplierId,
        materialCost: materialCost || '0.00',
        status: status || 'draft',
        quoteNumber,
      })
      .returning();

    return NextResponse.json({
      success: true,
      quote: newQuote,
    });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create quote' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/quote/:id
 * Updates a quote
 */
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update the quote
    const updatedQuote = await updateQuote(id, body);

    if (!updatedQuote) {
      return NextResponse.json(
        { success: false, message: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
    });
  } catch (error: any) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update quote' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/quote/:id
 * Deletes a quote
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Delete the quote
    const deletedQuote = await deleteQuote(id);

    if (!deletedQuote) {
      return NextResponse.json(
        { success: false, message: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete quote' },
      { status: 500 }
    );
  }
}
