import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Allow access to the landing page and static assets
  if (
    path === "/" ||
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  // Redirect all other routes to the landing page
  return NextResponse.redirect(new URL("/", request.url));
}

// Configure the middleware to run on all routes
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
