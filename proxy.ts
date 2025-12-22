import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16+ Proxy for authentication and route protection
 * 
 * This proxy:
 * 1. Protects all /admin routes (except /admin/login)
 * 2. Enforces role-based access for sensitive admin routes
 * 3. Redirects unauthenticated users to login
 * 
 * Note: In Next.js 16+, middleware.ts was renamed to proxy.ts
 * and the export function must be named 'proxy' not 'middleware'
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin')) {
    // Allow access to login page without authentication
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for authentication token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If not authenticated, redirect to login with callback URL
    if (!token) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Role-based access control for sensitive routes
    // Only SUPER_ADMIN and ADMIN can access these routes
    const adminOnlyRoutes = ['/admin/users', '/admin/settings', '/admin/super', '/admin/staff'];
    if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
      if (token.role !== 'SUPER_ADMIN' && token.role !== 'ADMIN') {
        // Redirect non-admins to main admin dashboard
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Match all /admin routes
    '/admin/:path*',
  ],
};

