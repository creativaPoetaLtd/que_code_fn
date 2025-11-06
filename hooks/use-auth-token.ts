import { useCallback, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { decodeJWT, isTokenExpired } from '@/utils/jwtUtils';
import { clearAllTokens } from '@/utils/tokenUtils';

const setCookie = (name: string, value: string, days: number = 1) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookieData = {
        value,
        expires: expires.getTime()
    };

    document.cookie = `${name}=${JSON.stringify(cookieData)};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure=${window.location.protocol === 'https:'}`;
};

const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            try {
                const cookieValue = c.substring(nameEQ.length, c.length);
                const cookieData = JSON.parse(cookieValue);
                if (cookieData.expires && new Date().getTime() > cookieData.expires) {
                    deleteCookie(name);
                    return null;
                }

                return cookieData.value;
            } catch (error) {
                deleteCookie(name);
                return null;
            }
        }
    }
    return null;
};

const deleteCookie = (name: string) => {
    const domains = ['', `.${window.location.hostname}`];
    const paths = ['/', ''];

    domains.forEach(domain => {
        paths.forEach(path => {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}${domain ? `;domain=${domain}` : ''};`;
        });
    });
};

const setCookieSimple = (name: string, value: string, days: number = 1) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure=${window.location.protocol === 'https:'}`;

    document.cookie = `${name}_expires=${expires.getTime()};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure=${window.location.protocol === 'https:'}`;
};

const getCookieSimple = (name: string): string | null => {
    if (typeof document === 'undefined') return null;

    const expiresValue = getRawCookie(`${name}_expires`);
    if (expiresValue && new Date().getTime() > parseInt(expiresValue)) {
        deleteCookie(name);
        deleteCookie(`${name}_expires`);
        return null;
    }

    return getRawCookie(name);
};

const getRawCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

const TOKEN_KEY = 'token';

export const useAuthToken = (enableAutoRedirect: boolean = true) => {
    const router = useRouter();
    const isRedirectingRef = useRef(false);

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;

        const token = getCookie(TOKEN_KEY);
        if (!token) return null;

        // Validate JWT token
        if (isTokenExpired(token)) {
            clearAllTokens();
            return null;
        }

        return token;
    }, []);

    const setToken = useCallback((token: string, expiryDays: number = 7) => {
        if (typeof window === 'undefined') return false;

        const payload = decodeJWT(token);
        if (!payload) {
            return false;
        }

        setCookie(TOKEN_KEY, token, expiryDays);
        return true;
    }, []);

    const removeToken = useCallback(() => {
        if (typeof window !== 'undefined') {
            clearAllTokens();
        }
    }, []);

    const isTokenValid = useCallback(() => {
        return getToken() !== null;
    }, [getToken]);

    const redirectToLogin = useCallback(() => {
        if (isRedirectingRef.current) return;

        isRedirectingRef.current = true;

        removeToken();
        router.push('/auth/login');

        setTimeout(() => {
            isRedirectingRef.current = false;
        }, 1000);
    }, [router, removeToken]);

    const checkTokenExpiration = useCallback(() => {
        if (!enableAutoRedirect || typeof window === 'undefined') return;

        const token = getCookie(TOKEN_KEY);
        if (token && isTokenExpired(token)) {
            redirectToLogin();
        }
    }, [enableAutoRedirect, redirectToLogin]);

    const cleanupExpiredTokens = useCallback(() => {
        if (typeof window === 'undefined') return;

        const token = getCookie(TOKEN_KEY);
        if (token && isTokenExpired(token)) {
            removeToken();
            if (enableAutoRedirect) {
                redirectToLogin();
            }
        }
    }, [removeToken, enableAutoRedirect, redirectToLogin]);

    const forceValidateToken = useCallback(() => {
        if (typeof window === 'undefined') return false;

        const token = getCookie(TOKEN_KEY);
        if (!token) return false;

        if (isTokenExpired(token)) {
            removeToken();
            if (enableAutoRedirect) {
                redirectToLogin();
            }
            return false;
        }

        return true;
    }, [removeToken, enableAutoRedirect, redirectToLogin]);

    // Auto-check on mount and setup interval
    useEffect(() => {
        if (!enableAutoRedirect || typeof window === 'undefined') return;

        checkTokenExpiration();
        const interval = setInterval(checkTokenExpiration, 30000);

        const handleFocus = () => checkTokenExpiration();
        const handleVisibilityChange = () => {
            if (!document.hidden) checkTokenExpiration();
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enableAutoRedirect, checkTokenExpiration]);

    return {
        getToken,
        setToken,
        removeToken,
        isTokenValid,
        cleanupExpiredTokens,
        checkTokenExpiration,
        redirectToLogin,
        forceValidateToken
    };
};