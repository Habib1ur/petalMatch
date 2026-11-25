import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "petalmatch_session";

/**
 * Next.js 16 Proxy:
 * - Protects /dashboard/* optimistically by checking for the session cookie
 *   (full cryptographic/DB session verification happens in Server Components & API routes).
 * - Adds security headers across responses.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const hasSessionCookie = Boolean(
      request.cookies.get(SESSION_COOKIE_NAME)?.value
    );
    if (!hasSessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/m/:path*", "/api/:path*"],
};
