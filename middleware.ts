import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    isProtected: boolean;
    isAuthRoute: boolean;
    isPublicInvitation: boolean;
}

function decodeTokenPayload(token: string): any | null {
    try {
        const [, payload] = token.split('.');
        const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
        const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}


function isTokenExpired(token: string): boolean {
    const payload = decodeTokenPayload(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
}

function extractTokenFromCookie(value: string): string | null {
    try {
        const cookieData = JSON.parse(value);
        if (cookieData.expires && Date.now() > cookieData.expires) return null;
        return cookieData.value || cookieData;
    } catch {
        return value;
    }
}

function getToken(request: NextRequest): string | null {
    const cookie = request.cookies.get('token');
    if (cookie) return extractTokenFromCookie(cookie.value);
    const authHeader = request.headers.get('authorization');
    return authHeader ? authHeader.replace('Bearer ', '') : null;
}

const protectedRoutes = [
    '/chat',
    '/profile',
    '/settings',
    '/statistics',
    '/home',
    '/groups/',
    '/contacts/',
];

const publicInvitationRoutes = [
    '/groups/respond',
    '/contacts/invitation',
];

const authRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/signup',
    '/login',
    '/register',
    '/signup',
];

function isProtectedRoute(path: string): boolean {
    return protectedRoutes.some(route =>
        path === route || path.startsWith(route.endsWith('/') ? route : route + '/')
    );
}

function isPublicInvitationRoute(path: string): boolean {
    return publicInvitationRoutes.some(route => path.startsWith(route));
}

function isAuthRoute(path: string): boolean {
    return authRoutes.some(route => path.startsWith(route));
}

function redirectToLogin(request: NextRequest): NextResponse {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
}

function redirectToHome(request: NextRequest): NextResponse {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/home';
    homeUrl.searchParams.delete('returnUrl');
    return NextResponse.redirect(homeUrl);
}

function redirectToReturnUrl(request: NextRequest, returnUrl: string): NextResponse | null {
    try {
        // Decode the URL in case it's encoded
        const decodedUrl = decodeURIComponent(returnUrl);

        // Handle relative URLs
        if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
            const redirectUrl = request.nextUrl.clone();
            const [path, query] = decodedUrl.split('?');
            redirectUrl.pathname = path;
            redirectUrl.search = query || '';
            return NextResponse.redirect(redirectUrl);
        }

        // Handle absolute URLs that match our domain
        if (decodedUrl.startsWith('http')) {
            const url = new URL(decodedUrl);
            const currentHost = request.nextUrl.host;

            // Only redirect to same domain for security
            if (url.host === currentHost) {
                const redirectUrl = request.nextUrl.clone();
                redirectUrl.pathname = url.pathname;
                redirectUrl.search = url.search;
                return NextResponse.redirect(redirectUrl);
            }
        }
    } catch (error) {
        // If URL parsing fails, return null
        console.error('Error parsing returnUrl:', error);
    }

    return null;
}

function getAuthState(request: NextRequest): AuthState {
    const token = getToken(request);
    const isAuthenticated = token ? !isTokenExpired(token) : false;
    const { pathname } = request.nextUrl;

    // Explicitly add /home as a protected route along with its subpaths
    const isProtected = isProtectedRoute(pathname) || pathname === '/home';

    const state = {
        token,
        isAuthenticated,
        isProtected,
        isAuthRoute: isAuthRoute(pathname),
        isPublicInvitation: isPublicInvitationRoute(pathname),
    };
    return state;
}

function handleExpiredToken(request: NextRequest): NextResponse {
    const response = redirectToLogin(request);
    response.cookies.set('token', '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    return response;
}

function handleAuthenticatedAuthRoute(request: NextRequest): NextResponse {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    const redirect = returnUrl ? redirectToReturnUrl(request, returnUrl) : null;
    return redirect || redirectToHome(request);
}

export function middleware(request: NextRequest) {
    const state = getAuthState(request);
    const { pathname } = request.nextUrl;

    // Allow public access to invitation routes
    if (state.isPublicInvitation) {
        return NextResponse.next();
    }

    if (state.token && isTokenExpired(state.token)) {
        return handleExpiredToken(request);
    }

    if (state.isProtected && !state.isAuthenticated) {
        return redirectToLogin(request);
    }

    if (state.isAuthRoute && state.isAuthenticated) {
        return handleAuthenticatedAuthRoute(request);
    }

    // Redirect authenticated users from landing page or /home to the user dashboard
    if ((pathname === '/' || pathname === '/home') && state.isAuthenticated && state.token) {
        const payload = decodeTokenPayload(state.token);
        const userId = payload?.userId || payload?.id || payload?.sub;
        if (userId) {
            const userHomeUrl = request.nextUrl.clone();
            userHomeUrl.pathname = `/home/${userId}`;
            userHomeUrl.searchParams.delete('returnUrl');
            return NextResponse.redirect(userHomeUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
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