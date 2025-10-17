import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from './lib/auth/session'

const protectedRoutes = ['/dashboard', '/campaigns', '/sessions', '/characters']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    const response = NextResponse.next()
    const session = await getIronSession<SessionData>(request, response, sessionOptions)

    if (!session.isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect authenticated users away from login page
  if (pathname === '/login') {
    const response = NextResponse.next()
    const session = await getIronSession<SessionData>(request, response, sessionOptions)

    if (session.isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
