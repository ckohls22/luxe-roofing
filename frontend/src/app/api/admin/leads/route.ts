// app/api/forms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllForms } from "@/db/queries";
import { z } from "zod"; // For input validation

// Input validation schema
const QuerySchema = z.object({
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().max(100).optional(), // Limit max items
  sortBy: z.enum(["createdAt", "firstName", "lastName"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get URL search params
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const validatedParams = QuerySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    });

    if (!validatedParams.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validatedParams.error.issues,
        },
        { status: 400 }
      );
    }

    // Get forms with pagination
    const result = await getAllForms(validatedParams.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}
