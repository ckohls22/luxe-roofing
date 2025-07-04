// File: app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, createAdminSession } from "@/db/queries";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// JWT secret
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input data",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, password } = validationResult.data;

    // Get client metadata
    const userAgent = request.headers.get("user-agent") || undefined;
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwarded?.split(",")[0] || realIp || "unknown";

    // Authenticate admin
    const admin = await authenticateAdmin(username, password);

    if (!admin) {
      // Log failed login attempt (you might want to implement this)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password",
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // Calculate expiration date (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store session in database
    await createAdminSession(admin.id, token, expiresAt, {
      userAgent,
      ipAddress,
    });

    // Set HTTP-only cookie
    const cookieStore = cookies();
    (await cookieStore).set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          avatar: admin.avatar,
          status: admin.status,
        },
        token, // Optional: include token in response for client-side storage
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
