import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getDepartmentFromPath } from '@/lib/auth/departmentAccess';
import { isPremiumRoute } from '@/lib/access-control';

/**
 * Next.js Middleware for:
 * 1. Route protection (admin/dashboard)
 * 2. Premium content access control
 * 3. WordPress URL redirects
 */

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // AUTHENTICATION & AUTHORIZATION
  const protectedRoutes = ['/admin', '/dashboard'];
  const publicAuthRoutes = ['/admin/login', '/login', '/register', '/forgot-password'];

  // Check if route requires premium access (magazine, courses, etc.)
  const requiresPremiumAccess = isPremiumRoute(pathname);

  if (requiresPremiumAccess) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Premium routes require login
      if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if user has premium access
      // This is a lightweight check - detailed validation happens on the page
      const isPaidMember = token.membershipTier && token.membershipTier !== 'FREE' && token.membershipTier !== 'free';

      if (!isPaidMember) {
        // Redirect free users to upgrade page
        const upgradeUrl = new URL('/subscribe', request.url);
        upgradeUrl.searchParams.set('required', 'true');
        upgradeUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(upgradeUrl);
      }
    } catch (error) {
      console.error('Middleware premium access error:', error);
      return NextResponse.redirect(new URL('/subscribe', request.url));
    }
  }

  // Check if route is protected (but exclude public auth routes)
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) &&
                           !publicAuthRoutes.some(route => pathname === route);

  if (isProtectedRoute) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Not authenticated - redirect to login
      if (!token) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check department access for department-specific routes
      const department = getDepartmentFromPath(pathname);
      if (department) {
        // We'll check department access via API route
        // Pass the department in the request headers for the page to verify
        const response = NextResponse.next();
        response.headers.set('x-required-department', department);
        return response;
      }

    } catch (error) {
      console.error('Middleware auth error:', error);
      // On auth error, redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  try {
    // Check database for redirect rule
    const redirectUrl = await checkDatabaseRedirect(pathname);

    if (redirectUrl) {
      // Preserve query parameters
      const url = new URL(redirectUrl, request.url);
      if (search) {
        url.search = search;
      }

      // Log redirect
      console.log(`Redirecting: ${pathname} → ${url.pathname}`);

      // Increment hit counter (fire and forget)
      incrementRedirectHit(pathname).catch(console.error);

      return NextResponse.redirect(url, 301);
    }

    // Common WordPress URL patterns to redirect
    // These handle common WordPress URL structures without hitting the database
    const quickRedirects = getQuickRedirects(pathname);
    if (quickRedirects) {
      const url = request.nextUrl.clone();
      url.pathname = quickRedirects;
      if (search) {
        url.search = search;
      }

      console.log(`Quick redirect: ${pathname} → ${url.pathname}`);
      return NextResponse.redirect(url, 301);
    }

    // Handle trailing slashes
    if (pathname !== '/' && pathname.endsWith('/')) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(0, -1);
      return NextResponse.redirect(url, 301);
    }

  } catch (error) {
    console.error('Middleware redirect error:', error);
    // Continue normally on error
  }

  return NextResponse.next();
}

/**
 * Quick pattern-based redirects for common WordPress URL structures
 */
function getQuickRedirects(pathname: string): string | null {
  // /category/slug/ → /category/slug
  if (pathname.match(/^\/category\/[^\/]+\/$/)) {
    return pathname.slice(0, -1);
  }

  // /tag/slug/ → /tag/slug
  if (pathname.match(/^\/tag\/[^\/]+\/$/)) {
    return pathname.slice(0, -1);
  }

  // /author/slug/ → /author/slug
  if (pathname.match(/^\/author\/[^\/]+\/$/)) {
    return pathname.slice(0, -1);
  }

  // /YYYY/MM/DD/post-slug/ → /blog/post-slug
  const datePostMatch = pathname.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([^\/]+)\/?$/);
  if (datePostMatch) {
    return `/blog/${datePostMatch[4]}`;
  }

  // /blog/YYYY/MM/DD/post-slug/ → /blog/post-slug
  const blogDateMatch = pathname.match(/^\/blog\/(\d{4})\/(\d{2})\/(\d{2})\/([^\/]+)\/?$/);
  if (blogDateMatch) {
    return `/blog/${blogDateMatch[4]}`;
  }

  // /page/2/ → /page/2
  if (pathname.match(/^\/page\/\d+\/$/)) {
    return pathname.slice(0, -1);
  }

  return null;
}

/**
 * Check database for custom redirect rules
 * This would query your URLRedirect table in production
 */
async function checkDatabaseRedirect(pathname: string): Promise<string | null> {
  // In a real implementation, this would query your database
  // For now, we return null to skip database lookups
  // You can enable this when you have URL redirects in your database

  /*
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/redirects/check?path=${encodeURIComponent(pathname)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      return data.newUrl || null;
    }
  } catch (error) {
    console.error('Database redirect check failed:', error);
  }
  */

  return null;
}

/**
 * Increment hit counter for redirect (analytics)
 */
async function incrementRedirectHit(pathname: string): Promise<void> {
  // Fire and forget - don't block the redirect
  /*
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/redirects/hit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldUrl: pathname })
    });
  } catch (error) {
    // Silent fail - don't block redirect
  }
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (all API routes including auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - auth pages (login, register, forgot-password)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password|admin/login|admin/change-password|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp)$).*)',
  ],
};
