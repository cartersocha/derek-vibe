import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./lib/auth/session";

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

  // Optimize: Only check session once for both protected routes and login redirect
  if (isProtectedRoute || pathname === "/login") {
    const session = await getIronSession<SessionData>(
      request,
      NextResponse.next(),
      sessionOptions
    );

    if (isProtectedRoute && !session.isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname === "/login" && session.isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
