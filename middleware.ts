import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request to track performance metrics
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Track request for performance monitoring
  // Note: The actual tracking happens in the performance API endpoint
  // This middleware just adds metadata that could be useful

  // Add performance headers
  response.headers.set('X-Request-Time', Date.now().toString());

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
