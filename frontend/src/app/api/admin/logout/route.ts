// File: app/api/admin/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deactivateSession } from "@/db/queries";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("admin-token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "No active session found",
        },
        { status: 401 }
      );
    }

    // Verify and decode token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const adminId = payload.adminId as number;

    // Get client metadata
    const userAgent = request.headers.get("user-agent") || undefined;
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwarded?.split(",")[0] || realIp || "unknown";

    // Deactivate session in database
    await deactivateSession(token);

    // Clear cookie
    (await cookieStore).delete("admin-token");

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    // Clear cookie even if there's an error
    const cookieStore = cookies();
    (await cookieStore).delete("admin-token");

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  }
}
