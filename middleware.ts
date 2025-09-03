import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
    '/chat',
    '/profile',
    '/settings',
    '/statistics',
    '/home',
    '/groups/',
    '/contacts/',
];

const authRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/signup',
    '/login',
    '/register',
    '/signup',
];

export function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    
    // Check for token in cookies (for SSR) and Authorization header (for client-side)
    const token = request.cookies.get('token') || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    const isAuthenticated = !!token;

    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(route.endsWith('/') ? route : route + '/')
    );

    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Special handling for home routes with userId
    if (pathname.startsWith('/home/') && pathname !== '/home') {
        // Extract userId from pathname (e.g., /home/123 -> 123)
        const pathParts = pathname.split('/');
        const urlUserId = pathParts[2]; // Get the userId part
        
        if (!isAuthenticated) {
            // No token, redirect to login
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/auth/login';
            loginUrl.searchParams.set('returnUrl', pathname + request.nextUrl.search);
            return NextResponse.redirect(loginUrl);
        }

        // If authenticated, let the client-side component handle the userId validation
        // This ensures the user can only access their own home page
        return NextResponse.next();
    }

    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/auth/login';
        loginUrl.searchParams.set('returnUrl', pathname + request.nextUrl.search);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthRoute && isAuthenticated) {
        const returnUrl = searchParams.get('returnUrl');

        if (returnUrl) {
            if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
                const redirectUrl = request.nextUrl.clone();
                redirectUrl.pathname = returnUrl.split('?')[0];
                redirectUrl.search = returnUrl.includes('?') ? returnUrl.split('?')[1] : '';
                return NextResponse.redirect(redirectUrl);
            }
        }

        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = '/home';
        homeUrl.searchParams.delete('returnUrl');
        return NextResponse.redirect(homeUrl);
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/chat/:path*',
        '/profile/:path*',
        '/settings/:path*',
        '/statistics/:path*',
        '/home/:path*',
        '/groups/:path*',
        '/contacts/:path*',
        '/auth/login',
        '/auth/register',
        '/auth/signup',
        '/login',
        '/register',
        '/signup',
    ],
};