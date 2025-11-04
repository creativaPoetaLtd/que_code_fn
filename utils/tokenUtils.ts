import { isTokenExpired } from './jwtUtils';

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
            clearAllTokens();
            return null;
        }
        const token = cookieData.value;
        return token && !isTokenExpired(token) ? token : null;
    } catch {
        clearAllTokens();
        return null;
    }
};

export const parseTokenFromStorage = (raw: string | null): string | null => {
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        return data.value || data;
    } catch {
        return raw;
    }
};

export const validateToken = (token: string | null, expires?: number): string | null => {
    if (!token) return null;
    if (expires && Date.now() > expires) {
        clearAllTokens();
        return null;
    }
    if (isTokenExpired(token)) {
        clearAllTokens();
        return null;
    }
    return token;
};

export const getTokenFromStorage = (): string | null => {
    for (const storage of [sessionStorage, localStorage]) {
        try {
            const stored = storage.getItem('token');
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

    const cookieValue = readCookie('token');
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
            document.cookie = `token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}${domain ? `;domain=${domain}` : ''};`;
            document.cookie = `token_expires=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}${domain ? `;domain=${domain}` : ''};`;
        });
    });

    sessionStorage.removeItem('token');
    localStorage.removeItem('token');

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