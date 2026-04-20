"use client";

import { useEffect } from "react";
import {
    getRefreshToken,
    getStoredAccessToken,
    getValidToken,
    parseTokenPayload,
    refreshAccessToken,
} from "@/utils/tokenUtils";

const REFRESH_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

const shouldRefreshAccessToken = () => {
    if (!getRefreshToken()) return false;

    const validToken = getValidToken();
    if (!validToken) return true;

    const payload = parseTokenPayload(validToken);
    if (!payload?.exp) return false;

    return payload.exp * 1000 - Date.now() < REFRESH_BEFORE_EXPIRY_MS;
};

const refreshIfNeeded = () => {
    if (!shouldRefreshAccessToken()) return;
    void refreshAccessToken();
};

export default function AuthSessionManager() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        if (getRefreshToken() && !getStoredAccessToken()) {
            void refreshAccessToken();
        } else {
            refreshIfNeeded();
        }

        const interval = window.setInterval(refreshIfNeeded, REFRESH_CHECK_INTERVAL_MS);

        const handleResume = () => refreshIfNeeded();
        const handleVisibilityChange = () => {
            if (!document.hidden) refreshIfNeeded();
        };

        window.addEventListener("focus", handleResume);
        window.addEventListener("online", handleResume);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", handleResume);
            window.removeEventListener("online", handleResume);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return null;
}
