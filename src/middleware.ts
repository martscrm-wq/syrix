import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect API routes
  if (pathname.startsWith("/api/")) {
    // Public API endpoints
    if (pathname === "/api/auth/login" || pathname === "/api/auth/dev-login") {
      return NextResponse.next();
    }

    const session = request.cookies.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح به - يرجى تسجيل الدخول" },
        { status: 401 }
      );
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const session = request.cookies.get("session")?.value;

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect logged-in users from login page
  if (pathname === "/login") {
    const session = request.cookies.get("session")?.value;
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/login"],
};
