import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createQuoteWithNumber,
  getQuotesWithFilters,
  getQuoteStats,
} from "@/db/quotesQueries";
import { calculateQuotePrice } from "@/utils/price-calculator";

const createQuoteSchema = z.object({
  formId: z.string().uuid(),
  materialId: z.string().uuid(),
  supplierId: z.string().uuid(),
  roofArea: z.number().positive(),
  slope: z.enum(["flat", "shallow", "medium", "steep"]),
  materialCostPerUnit: z.number().positive(),
  status: z
    .enum(["draft", "sent", "viewed", "accepted", "rejected", "expired"])
    .optional(),
});

const getQuotesSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  status: z
    .enum(["draft", "sent", "viewed", "accepted", "rejected", "expired"])
    .optional(),
  supplierId: z.string().uuid().optional(),
  materialId: z.string().uuid().optional(),
  formId: z.string().uuid().optional(),
  minCost: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  maxCost: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
});

// GET /api/quotes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    // Special endpoint for stats
    if (queryParams.stats === "true") {
      const stats = await getQuoteStats();
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    const validatedParams = getQuotesSchema.parse(queryParams);
    const quotes = await getQuotesWithFilters(validatedParams);

    return NextResponse.json({
      success: true,
      data: quotes.data,
      pagination: quotes.pagination,
    });
  } catch (error) {
    console.error("Error fetching quotes:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST /api/quotes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createQuoteSchema.parse(body);

    // Calculate the material cost based on slope formula
    const calculatedPrice = calculateQuotePrice({
      roofArea: validatedData.roofArea,
      slope: validatedData.slope,
      materialCostPerUnit: validatedData.materialCostPerUnit,
    });

    const quote = await createQuoteWithNumber({
      formId: validatedData.formId,
      materialId: validatedData.materialId,
      supplierId: validatedData.supplierId,
      materialCost: calculatedPrice.toString(),
      status: validatedData.status || "draft",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...quote,
          calculatedPrice,
          roofArea: validatedData.roofArea,
          slope: validatedData.slope,
          materialCostPerUnit: validatedData.materialCostPerUnit,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating quote:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
