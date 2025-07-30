// app/api/submit-form/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createFormSubmission } from "@/db/queries";

import { createOrUpdateHubSpotContact } from "@/lib/hubspot/hubspot";
import { GHLContact } from "@/lib/ghl/ghl.types";
import { GHLService } from "@/lib/ghl/ghl-service";

// Define base schemas
// const searchAddressSchema = z.object({
//   address: z.string().min(1, "Address is required"),
//   coordinates: z.tuple([z.number(), z.number()]),
//   placeId: z.string().min(1, "Place ID is required"),
// });

// const roofAreaSchema = z.object({
//   squareMeters: z.number(),
//   squareFeet: z.number(),
//   formatted: z.string(),
// });

// Define the main submission payload schema

// Updated roof polygon schema with better coordinate handling
// const roofPolygonSchema = z.object({
//   id: z.union([z.string(), z.number()]),
//   coordinates: z.array(z.tuple([z.number(), z.number()])),
//   area: roofAreaSchema,
//   label: z.string(),
//   centerPoint: z.tuple([z.number(), z.number()]),
//   slope: z.string().optional(),
// });

// const roofTypeSchema = z.enum(["residential", "industrial", "commercial"]);

// Updated main submission schema
// const submissionPayloadSchema = z.object({
//   firstName: z.string().min(2, "First name must be at least 2 characters"),
//   lastName: z.string().min(2, "Last name must be at least 2 characters"),
//   email: z.string().email("Please enter a valid email address"),
//   phone: z.string().min(10, "Phone number must be at least 10 digits"),
//   address: searchAddressSchema,
//   roofPolygons: z.array(roofPolygonSchema),
//   roofType: z.enum(["residential", "industrial", "commercial"]),
//   captchaToken: z.string().min(1, "Captcha token is required"),
// });

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().min(10),
  captchaToken: z.string(),
  address: z.object({
    address: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
    placeId: z.string(),
  }),
  roofType: z.enum(["residential", "commercial", "industrial"]),
  roofPolygons: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      label: z.string(),
      slope: z.string().optional(),
      coordinates: z.array(z.tuple([z.number(), z.number()])),
      centerPoint: z.tuple([z.number(), z.number()]),
      area: z.object({
        squareMeters: z.number(),
        squareFeet: z.number(),
        formatted: z.string(),
      }),
    })
  ),
});

// hCaptcha verification function
async function verifyCaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  try {
    // "/siteverify" API endpoint.
    const formData = new FormData();
    formData.append("secret", process.env.TURNSTILE_SECRET_KEY!);
    formData.append("response", token);
    formData.append("remoteip", ip);
    const idempotencyKey = crypto.randomUUID();
    formData.append("idempotency_key", idempotencyKey);
    console.log("Verifying captcha:", { token, ip, idempotencyKey });

    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const firstResult = await fetch(url, {
      body: formData,
      method: "POST",
    });

    const data = await firstResult.json();
    return data.success === true;
  } catch (error) {
    console.error("Captcha verification failed:", error);
    return false;
  }
}

// Rate limiting helper (simple in-memory store)
const submissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // Max 5 submissions per 15 minutes per IP

  if (!submissions.has(ip)) {
    submissions.set(ip, []);
  }

  const ipSubmissions = submissions.get(ip)!;

  // Remove old submissions outside the window
  const recentSubmissions = ipSubmissions.filter(
    (time) => now - time < windowMs
  );
  submissions.set(ip, recentSubmissions);

  return recentSubmissions.length >= maxRequests;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") || // Cloudflare
      request.headers.get("x-client-ip") ||
      "unknown";

    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many submissions. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Add debug logging
    // console.log("Received payload:", JSON.stringify(body, null, 2));

    // Validate with the updated schema
    const validationResult = formSchema.safeParse(body);

    if (!validationResult.success) {
      // Detailed error logging
      console.log(
        "Full validation errors:",
        JSON.stringify(validationResult.error.format(), null, 2)
      );
      // console.log('Received data sample:', JSON.stringify({
      //   roofPolygons: body.roofPolygons?.slice(0, 1) // Show first polygon for debugging
      // }, null, 2));

      return NextResponse.json(
        {
          success: false,
          message: "Invalid form data",
          errors: validationResult.error.flatten(),
          receivedData: body, // Include received data in development
        },
        { status: 400 }
      );
    }

    const payload = validationResult.data;

    // Verify captcha
    const isCaptchaValid = await verifyCaptcha(payload.captchaToken, ip);

    if (!isCaptchaValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Captcha verification failed. Please try again.",
        },
        { status: 400 }
      );
    }

    // Prepare data for database insertion
    const submissionData = {
      form: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        roofType: payload.roofType,
        captchaToken: payload.captchaToken,
      },
      addresses: [
        {
          formattedAddress: payload.address.address,
          lat: payload.address.coordinates[0].toString(),
          lng: payload.address.coordinates[1].toString(),
          placeId: payload.address.placeId,
        },
      ],
      roofPolygons: payload.roofPolygons.map((polygon) => {
        return {
          ...polygon,
          id: String(polygon.id),
        };
      }),
    };

    // Insert into database

    const result = await createFormSubmission(submissionData);
    // const result = {
    //   form: {
    //     id: "mock-id", // Replace with actual ID from database
    //     createdAt: new Date().toISOString(), // Replace with actual timestamp
    //     ...submissionData.form,
    //   },
    // };

    // Send to HubSpot (don't fail the entire request if this fails)

    const contactData: GHLContact = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      address1: payload.address.address,
    };

    const ghlService = new GHLService();
    console.log(
      await ghlService.processContactSubmission(
        contactData,
        process.env.GHL_FORM_ID!
      )
    );

    // Record successful submission for rate limiting
    const now = Date.now();
    if (!submissions.has(ip)) {
      submissions.set(ip, []);
    }
    submissions.get(ip)!.push(now);

    // Log successful submission (you might want to use a proper logger)
    console.log(`Form submission successful: ${result.form.id} from ${ip}`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      data: {
        submissionId: result.form.id,
        createdAt: result.form.createdAt,
      },
    });
  } catch (error) {
    console.error("Form submission error:", error);

    // Check if it's a database error
    if (error instanceof Error) {
      // Handle specific database errors
      if (error.message.includes("duplicate key")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This address has already been submitted. Please contact support if you need to update your submission.",
          },
          { status: 409 }
        );
      }

      if (error.message.includes("connection")) {
        return NextResponse.json(
          {
            success: false,
            message: "Database connection error. Please try again later.",
          },
          { status: 503 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}
