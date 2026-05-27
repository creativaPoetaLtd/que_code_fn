import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJWT, isTokenExpired } from "@/utils/jwtUtils";
import {
    clearAllTokens,
    getRefreshToken,
    getStoredAccessToken,
    getValidToken,
    refreshAccessToken,
    storeAccessToken,
} from "@/utils/tokenUtils";

const TOKEN_KEY = "token";

export const useAuthToken = (enableAutoRedirect: boolean = true) => {
    const router = useRouter();
    const isRedirectingRef = useRef(false);
    const [token, setTokenState] = useState<string | null>(null);

    const syncTokenState = useCallback(async (allowRefresh: boolean = false) => {
        if (typeof window === "undefined") return null;

        const validToken = getValidToken();
        if (validToken) {
            setTokenState((current) => (current === validToken ? current : validToken));
            return validToken;
        }

        if (allowRefresh && getRefreshToken()) {
            const refreshedToken = await refreshAccessToken();
            setTokenState(refreshedToken ?? null);
            return refreshedToken ?? null;
        }

        setTokenState(null);
        return null;
    }, []);

    const getToken = useCallback(() => {
        return token;
    }, [token]);

    const setToken = useCallback((token: string, expiryDays: number = 1) => {
        if (typeof window === "undefined") return false;

        const payload = decodeJWT(token);
        if (!payload) {
            return false;
        }

        storeAccessToken(token, expiryDays);
        setTokenState(token);
        return true;
    }, []);

    const removeToken = useCallback(() => {
        if (typeof window !== "undefined") {
            clearAllTokens();
            setTokenState(null);
        }
    }, []);

    const isTokenValid = useCallback(() => {
        return getToken() !== null;
    }, [getToken]);

    const redirectToLogin = useCallback(() => {
        if (isRedirectingRef.current) return;

        isRedirectingRef.current = true;

        removeToken();
        router.push("/auth/login");

        setTimeout(() => {
            isRedirectingRef.current = false;
        }, 1000);
    }, [router, removeToken]);

    const recoverOrRedirect = useCallback(async () => {
        if (!enableAutoRedirect || typeof window === "undefined") return;

        const storedToken = getStoredAccessToken();
        if (storedToken && !isTokenExpired(storedToken)) {
            setTokenState((current) => (current === storedToken ? current : storedToken));
            return;
        }

        if (getRefreshToken()) {
            const refreshedToken = await refreshAccessToken();
            if (refreshedToken) {
                setTokenState(refreshedToken);
                return;
            }
        }

        setTokenState(null);

        if (storedToken || localStorage.getItem(TOKEN_KEY)) {
            redirectToLogin();
        }
    }, [enableAutoRedirect, redirectToLogin]);

    const checkTokenExpiration = useCallback(() => {
        void recoverOrRedirect();
    }, [recoverOrRedirect]);

    const cleanupExpiredTokens = useCallback(() => {
        void recoverOrRedirect();
    }, [recoverOrRedirect]);

    const forceValidateToken = useCallback(() => {
        if (typeof window === "undefined") return false;

        const validToken = getValidToken();
        if (validToken) {
            setTokenState((current) => (current === validToken ? current : validToken));
            return true;
        }

        if (getRefreshToken()) {
            void refreshAccessToken().then((refreshedToken) => {
                setTokenState(refreshedToken ?? null);
            });
            return false;
        }

        setTokenState(null);

        if (enableAutoRedirect) {
            redirectToLogin();
        }
        return false;
    }, [enableAutoRedirect, redirectToLogin]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        void syncTokenState(true);

        const handleAuthTokenChange = () => {
            void syncTokenState();
        };

        window.addEventListener("authTokenChanged", handleAuthTokenChange as EventListener);

        return () => {
            window.removeEventListener("authTokenChanged", handleAuthTokenChange as EventListener);
        };
    }, [syncTokenState]);

    useEffect(() => {
        if (!enableAutoRedirect || typeof window === "undefined") return;

        checkTokenExpiration();
        const interval = setInterval(checkTokenExpiration, 30000);

        const handleFocus = () => checkTokenExpiration();
        const handleVisibilityChange = () => {
            if (!document.hidden) checkTokenExpiration();
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [enableAutoRedirect, checkTokenExpiration]);

    const getUserId = useCallback((): string | null => {
        const token = getToken();
        if (!token) return null;

        try {
            const decoded = decodeJWT(token);
            if (!decoded) return null;
            return (decoded as any).id || (decoded as any).userId || null;
        } catch {
            return null;
        }
    }, [getToken]);

    return {
        getToken,
        setToken,
        removeToken,
        isTokenValid,
        cleanupExpiredTokens,
        checkTokenExpiration,
        redirectToLogin,
        forceValidateToken,
        getUserId,
    };
};
