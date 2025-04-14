import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Simpler middleware implementation to avoid redirect loops
export function middleware(request: NextRequest) {
  // Skip auth API routes to avoid redirect loops
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('next-auth.session-token') || 
                request.cookies.get('__Secure-next-auth.session-token');

  const isAuth = !!token;
  // Check if this is an auth page (login, register, password reset)
  const isAuthPage = 
    request.nextUrl.pathname === '/sign-in' || 
    request.nextUrl.pathname === '/sign-up' || 
    request.nextUrl.pathname === '/reset-password' ||
    request.nextUrl.pathname.startsWith('/reset-password/');
  
  // Redirect authenticated users from auth pages to dashboard
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users from protected pages to login
  if (!isAuthPage && !isAuth && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

// Specify which routes this middleware applies to
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/sign-in',
    '/sign-up',
    '/reset-password',
    '/reset-password/:token*'
  ],
};
