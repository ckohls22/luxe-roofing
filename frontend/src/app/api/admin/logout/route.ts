// File: app/api/admin/auth/logout/route.ts
import { NextResponse } from "next/server";
import { deactivateSession } from "@/db/queries";

import { cookies } from "next/headers";

export async function POST() {
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

    await deactivateSession(token);

    (await cookieStore).delete("admin-token");

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    const cookieStore = cookies();
    (await cookieStore).delete("admin-token");

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  }
}
