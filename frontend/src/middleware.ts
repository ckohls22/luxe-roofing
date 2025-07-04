import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if accessing admin routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin-token")?.value;

    // If no token and not on login page, redirect to login
    if (!token && pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // If token exists, verify it
    if (token) {
      const payload = await verifyToken(token);

      // If token is invalid and not on login page, redirect to login
      if (!payload && pathname !== "/admin/login") {
        const response = NextResponse.redirect(
          new URL("/admin/login", request.url)
        );
        response.cookies.delete("admin-token");
        return response;
      }

      // If valid token and on login page, redirect to dashboard
      if (payload && pathname === "/admin/login") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }

      // If accessing /admin root, redirect to dashboard
      if (payload && pathname === "/admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
