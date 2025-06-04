import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Allow access to all routes
  return NextResponse.next();
}

// Configure the middleware to run on all routes
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
