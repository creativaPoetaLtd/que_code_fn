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
    const token = request.cookies.get('token');
    const isAuthenticated = !!token;

    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(route.endsWith('/') ? route : route + '/')
    );

    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

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