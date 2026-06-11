import { isTokenExpired } from './jwtUtils';
import baseUrl from '@/helpers/baseUrl';

const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_INFO_KEY = 'authUserInfo';
const DEFAULT_REFRESH_DAYS = 180;

let refreshPromise: Promise<string | null> | null = null;

const wait = (ms: number) =>
    new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
    });

export const readCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`));
    return match ? match.split('=')[1] : null;
};

export const parseTokenFromCookie = (cookieValue: string): string | null => {
    try {
        const cookieData = JSON.parse(cookieValue);
        if (cookieData.expires && Date.now() > cookieData.expires) {
            return null;
        }
        const token = cookieData.value;
        return token && !isTokenExpired(token) ? token : null;
    } catch {
        return null;
    }
};

export const parseTokenFromStorage = (raw: string | null): string | null => {
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        if (data.expires && Date.now() > data.expires) {
            return null;
        }
        return data.value || data;
    } catch {
        return raw;
    }
};

export const validateToken = (token: string | null, expires?: number): string | null => {
    if (!token) return null;
    if (expires && Date.now() > expires) {
        return null;
    }
    if (isTokenExpired(token)) {
        return null;
    }
    return token;
};

export const getTokenFromStorage = (): string | null => {
    if (typeof window === 'undefined') return null;
    for (const storage of [sessionStorage, localStorage]) {
        try {
            const stored = storage.getItem(ACCESS_TOKEN_KEY);
            if (stored) {
                const token = parseTokenFromStorage(stored);
                if (token && !isTokenExpired(token)) return token;
            }
        } catch {
            continue;
        }
    }
    return null;
};

export const getValidToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    const cookieValue = readCookie(ACCESS_TOKEN_KEY);
    if (cookieValue) {
        try {
            const cookieData = JSON.parse(cookieValue);
            const token = validateToken(cookieData.value, cookieData.expires);
            if (token) return token;
        } catch {
            const token = validateToken(parseTokenFromStorage(cookieValue));
            if (token) return token;
        }
    }

    return getTokenFromStorage();
};

export const getStoredAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    const cookieValue = readCookie(ACCESS_TOKEN_KEY);
    if (cookieValue) {
        try {
            const cookieData = JSON.parse(cookieValue);
            return cookieData.value || cookieData;
        } catch {
            return parseTokenFromStorage(cookieValue);
        }
    }

    return parseTokenFromStorage(localStorage.getItem(ACCESS_TOKEN_KEY));
};

const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookieData = {
        value,
        expires: expires.getTime(),
    };
    const secure = window.location.protocol === 'https:' ? ';Secure' : '';

    document.cookie = `${name}=${JSON.stringify(cookieData)};expires=${expires.toUTCString()};path=/;SameSite=Strict${secure}`;
};

const getCookieToken = (name: string): string | null => {
    const cookieValue = readCookie(name);
    if (!cookieValue) return null;

    try {
        const cookieData = JSON.parse(cookieValue);
        if (cookieData.expires && Date.now() > cookieData.expires) {
            return null;
        }
        return cookieData.value || null;
    } catch {
        return parseTokenFromStorage(cookieValue);
    }
};

export const storeAccessToken = (token: string, days: number = 1) => {
    if (typeof window === 'undefined') return;
    const expires = Date.now() + days * 24 * 60 * 60 * 1000;
    setCookie(ACCESS_TOKEN_KEY, token, days);
    localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify({ value: token, expires }));

    const payload = parseTokenPayload(token);
    if (payload) {
        localStorage.setItem(
            USER_INFO_KEY,
            JSON.stringify({
                id: payload.id || payload.userId || payload.sub || null,
                name: payload.name || null,
                email: payload.email || null,
                accountType: payload.accountType || null,
            }),
        );
    }

    window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { token } }));
};

export const storeRefreshToken = (
    refreshToken: string,
    days: number = DEFAULT_REFRESH_DAYS,
) => {
    if (typeof window === 'undefined') return;
    const expires = Date.now() + days * 24 * 60 * 60 * 1000;
    setCookie(REFRESH_TOKEN_KEY, refreshToken, days);
    localStorage.setItem(REFRESH_TOKEN_KEY, JSON.stringify({ value: refreshToken, expires }));
};

export const storeAuthTokens = ({
    token,
    refreshToken,
    refreshExpiresAt,
}: {
    token: string;
    refreshToken?: string | null;
    refreshExpiresAt?: string | Date | null;
}) => {
    storeAccessToken(token);

    if (refreshToken) {
        const refreshDays = refreshExpiresAt
            ? Math.max(
                1,
                Math.ceil(
                    (new Date(refreshExpiresAt).getTime() - Date.now()) /
                    (24 * 60 * 60 * 1000),
                ),
            )
            : DEFAULT_REFRESH_DAYS;
        storeRefreshToken(refreshToken, refreshDays);
    }
};

export const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    const cookieToken = getCookieToken(REFRESH_TOKEN_KEY);
    if (cookieToken) return cookieToken;

    return parseTokenFromStorage(localStorage.getItem(REFRESH_TOKEN_KEY));
};

export const hasRefreshToken = () => Boolean(getRefreshToken());

export const getStoredUserInfo = (): {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    accountType?: string | null;
} | null => {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(USER_INFO_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const refreshAccessToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken || !baseUrl) {
            return null;
        }

        try {
            const response = await fetch(`${baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            if (!data?.token) {
                return null;
            }

            storeAuthTokens({
                token: data.token,
                refreshToken: data.refreshToken,
                refreshExpiresAt: data.refreshExpiresAt,
            });

            return data.token as string;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

export const restorePersistentSession = async ({
    attempts = 3,
    retryDelayMs = 1500,
}: {
    attempts?: number;
    retryDelayMs?: number;
} = {}): Promise<string | null> => {
    if (typeof window === 'undefined' || !getRefreshToken()) {
        return null;
    }

    const validToken = getValidToken();
    if (validToken) {
        return validToken;
    }

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
            return refreshedToken;
        }

        if (attempt < attempts - 1) {
            const multiplier = navigator.onLine === false ? 2 : 1;
            await wait(retryDelayMs * multiplier * (attempt + 1));
        }
    }

    return null;
};

export const parseTokenPayload = (token: string) => {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
};

export const getCurrentUserId = (): string | null => {
    const token = getValidToken();
    if (!token) return null;

    const payload = parseTokenPayload(token);
    const userId = payload?.userId || payload?.id || payload?.sub;
    return userId === 'undefined' ? null : userId;
};

export const getCurrentUserInfo = (): {
    userId: string | null;
    organizationId: string | null;
    accountType: 'user' | 'organization' | 'unknown'
} => {
    const token = getValidToken();
    if (!token) return { userId: null, organizationId: null, accountType: 'unknown' };

    const payload = parseTokenPayload(token);
    if (!payload) return { userId: null, organizationId: null, accountType: 'unknown' };

    return extractUserInfo(payload);
};

type UserInfo = {
    userId: string | null;
    organizationId: string | null;
    accountType: 'user' | 'organization' | 'unknown';
};

const extractUserInfo = (payload: any): UserInfo => {
    const getId = (p: any): string | null => {
        if (!p) return null;
        return p.id ?? p.userId ?? p.sub ?? null;
    };

    const getOrgId = (p: any): string | null => {
        if (!p) return null;
        return p.organizationId ?? p.orgId ?? p.organization_id ?? null;
    };

    const normalizeAccountType = (raw: any, orgId: string | null): 'user' | 'organization' | 'unknown' => {
        if (raw === 'organization' || raw === 'user') return raw;
        return orgId ? 'organization' : 'user';
    };

    const id = getId(payload);
    const orgId = getOrgId(payload);
    const rawAccountType = payload && payload.accountType;
    const accountType: 'user' | 'organization' | 'unknown' = normalizeAccountType(rawAccountType, orgId);

    if (accountType === 'organization') {
        return { userId: null, organizationId: orgId ?? id, accountType };
    }

    return { userId: id, organizationId: null, accountType };
};

export const clearAllTokens = () => {
    if (typeof window === 'undefined') return;

    const domains = ['', `.${window.location.hostname}`];
    const paths = ['/', ''];

    domains.forEach(domain => {
        paths.forEach(path => {
            document.cookie = `${ACCESS_TOKEN_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}${domain ? `;domain=${domain}` : ''};`;
            document.cookie = `${ACCESS_TOKEN_KEY}_expires=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}${domain ? `;domain=${domain}` : ''};`;
            document.cookie = `${REFRESH_TOKEN_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}${domain ? `;domain=${domain}` : ''};`;
            document.cookie = `${REFRESH_TOKEN_KEY}_expires=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}${domain ? `;domain=${domain}` : ''};`;
        });
    });

    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { token: null } }));

};

export const redirectToLogin = (returnUrl?: string) => {
    if (typeof window === 'undefined') return;

    const currentUrl = returnUrl || (window.location.pathname + window.location.search);
    const loginUrl = `/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`;

    window.location.href = loginUrl;
};

export const handleTokenExpiration = (returnUrl?: string) => {
    clearAllTokens();
    redirectToLogin(returnUrl);
};
