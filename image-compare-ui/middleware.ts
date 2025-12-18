import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicPaths = ['/login'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // Get auth data from cookie/header (we'll check localStorage on client side)
    // For middleware, we can check if there's a token in cookies if we decide to use them
    // For now, we'll just redirect to /login for protected routes
    // and let the client-side handle the actual auth check via localStorage

    // Allow public paths
    if (isPublicPath) {
        return NextResponse.next();
    }

    // For API routes, allow them to handle their own auth
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // For static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Protected routes - we'll handle auth check on client side
    // This middleware just ensures the flow is correct
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
