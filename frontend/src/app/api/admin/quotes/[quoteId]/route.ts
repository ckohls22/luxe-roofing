import { getQuoteWithDetails } from "@/db/quotesQueries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;

    // Fetch quote with detailed information
    const quoteDetails = await getQuoteWithDetails(quoteId);

    if (!quoteDetails) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({ quote: quoteDetails });
  } catch (error) {
    console.error("Error fetching quote details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch quote details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
