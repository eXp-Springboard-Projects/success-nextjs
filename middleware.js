import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin')) {
    // Allow access to login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Temporarily disabled for development - ENABLE THIS BEFORE PRODUCTION!
    // Check for authentication
    /*
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If not authenticated, redirect to login
    if (!token) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    */

    // Optional: Role-based access control
    // Uncomment to restrict certain routes to specific roles
    /*
    const adminOnlyRoutes = ['/admin/users', '/admin/settings'];
    if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
      if (token.role !== 'SUPER_ADMIN' && token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
    */
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
