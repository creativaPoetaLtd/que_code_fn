import { useCallback } from "react";

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

export const useAuthToken = () => {
    const getToken = useCallback(() => {
        if (typeof window !== 'undefined') {
            return getCookie(TOKEN_KEY);
        }
        return null;
    }, []);

    const setToken = useCallback((token: string, expiryDays: number = 7) => {
        if (typeof window !== 'undefined') {
            setCookie(TOKEN_KEY, token, expiryDays);
        }
    }, []);

    const removeToken = useCallback(() => {
        if (typeof window !== 'undefined') {
            deleteCookie(TOKEN_KEY);
            deleteCookie(`${TOKEN_KEY}_expires`);
        }
    }, []);

    const isTokenValid = useCallback(() => {
        return getToken() !== null;
    }, [getToken]);

    const cleanupExpiredTokens = useCallback(() => {
        if (typeof window !== 'undefined') {
            getToken();
        }
    }, [getToken]);

    return {
        getToken,
        setToken,
        removeToken,
        isTokenValid,
        cleanupExpiredTokens
    };
};