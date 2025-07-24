// app/api/admin/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllForms } from "@/db/queries";
import { z } from "zod"; // For input validation

// Input validation schema with safe defaults
const QuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().min(1).max(1000).optional().default(10),
  sortBy: z.enum(["createdAt", "firstName", "lastName"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export async function GET(request: NextRequest) {
  try {
    // Get URL search params
    const searchParams = request.nextUrl.searchParams;

    // Prepare query parameters with defaults for missing values
    const queryParams = {
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    // Parse and validate with defaults
    const validatedParams = QuerySchema.safeParse(queryParams);

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

    // Return the structure as expected by the client
    return NextResponse.json({
      success: true,
      forms: result.forms, // Keep the 'forms' property as expected by clients
      data: result.forms,  // Also include 'data' for newer components
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}
