import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./lib/auth/session";
import { setCacheHeaders } from "./lib/edge-cache";

const protectedRoutes = [
  "/dashboard",
  "/campaigns",
  "/sessions",
  "/characters",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Optimize: Only check session for protected routes
  if (isProtectedRoute) {
    const session = await getIronSession<SessionData>(
      request,
      NextResponse.next(),
      sessionOptions
    );

    if (!session.isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } else if (pathname === "/login" && request.method === "GET") {
    // Only check session for GET requests to login (not POST submissions)
    // This prevents session checks during login form submissions
    const session = await getIronSession<SessionData>(
      request,
      NextResponse.next(),
      sessionOptions
    );

    if (session.isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next();
  
  // Add pathname header for layout detection
  response.headers.set('x-pathname', pathname);
  
  // Add edge caching headers for static routes
  if (pathname === '/login') {
    setCacheHeaders(response, 'login');
  } else if (pathname.startsWith('/_next/static/')) {
    setCacheHeaders(response, 'static');
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
