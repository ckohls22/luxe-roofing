import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { quotes } from '@/db/schema';
import { and, count, sql } from 'drizzle-orm';
import {
  
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
    
    // Handle page and limit parameters safely, ensuring they're always valid numbers
    let page = 1;
    if (searchParams.get('page')) {
      const parsedPage = parseInt(searchParams.get('page') || '1', 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }
    
    let limit = 10;
    if (searchParams.get('limit')) {
      const parsedLimit = parseInt(searchParams.get('limit') || '10', 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
        // Allow higher limits (up to 1000) for dashboard components
        if (limit > 1000) limit = 1000;
      }
    }
    
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const materialId = searchParams.get('materialId');
    const formId = searchParams.get('formId');
    const minCost = searchParams.get('minCost') ? parseFloat(searchParams.get('minCost')!) : undefined;
    const maxCost = searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost')!) : undefined;

    // Define the type to match getQuotesWithFilters parameter
    type QuoteFilters = {
      status?: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
      supplierId?: string;
      materialId?: string;
      formId?: string;
      minCost?: number;
      maxCost?: number;
      page?: number;
      limit?: number;
    };
    
    // Build filters object
    const filters: QuoteFilters = { page, limit };
    // Type guard for status to ensure it matches expected values
    if (status) {
      const validStatuses = ["draft", "sent", "viewed", "accepted", "rejected", "expired"];
      if (validStatuses.includes(status)) {
        filters.status = status as "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
      }
    }
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
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { success: false, message: error || 'Failed to fetch quotes' },
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
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { success: false, message: error || 'Failed to create quote' },
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
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { success: false, message: error || 'Failed to update quote' },
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
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { success: false, message: error || 'Failed to delete quote' },
      { status: 500 }
    );
  }
}
