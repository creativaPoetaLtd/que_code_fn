"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import baseUrl from "@/helpers/baseUrl";
import { performClientLogout } from "@/utils/logout";
import {
    clearAllTokens,
    getRefreshToken,
    getStoredAccessToken,
    getStoredUserInfo,
    getValidToken,
    parseTokenPayload,
    refreshAccessToken,
    storeAccessToken,
} from "@/utils/tokenUtils";

const LAST_ACTIVITY_KEY = "qc:lastActivityAt";
const LOCKED_KEY = "qc:appLocked";
const LOCK_TIMEOUT_MINUTES = Number(
    process.env.NEXT_PUBLIC_APP_LOCK_TIMEOUT_MINUTES || 15,
);
const LOCK_TIMEOUT_MS = Math.max(1, LOCK_TIMEOUT_MINUTES) * 60 * 1000;
const PROTECTED_PREFIXES = [
    "/chat",
    "/contacts",
    "/groups",
    "/home",
    "/profile",
    "/settings",
    "/statistics",
    "/transactions",
    "/wallet",
];
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"];

const isProtectedPath = (pathname: string) =>
    PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

const markActivity = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
};

const getDisplayName = () => {
    const token = getStoredAccessToken() || getValidToken();
    const payload = token ? parseTokenPayload(token) : null;
    const storedUserInfo = getStoredUserInfo();
    return (
        payload?.name ||
        payload?.email ||
        payload?.firstName ||
        storedUserInfo?.name ||
        storedUserInfo?.email ||
        "your account"
    );
};

export default function AppLockGate() {
    const pathname = usePathname() || "";
    const router = useRouter();
    const dispatch = useDispatch();
    const [locked, setLocked] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState("your account");
    const protectedPath = isProtectedPath(pathname);

    const evaluateLock = useCallback(() => {
        if (!protectedPath || !getRefreshToken()) {
            setLocked(false);
            return;
        }

        setDisplayName(getDisplayName());

        const forcedLocked = localStorage.getItem(LOCKED_KEY) === "1";
        const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
        const isIdle = Boolean(lastActivity) && Date.now() - lastActivity > LOCK_TIMEOUT_MS;

        if (forcedLocked || isIdle) {
            localStorage.setItem(LOCKED_KEY, "1");
            setLocked(true);
            return;
        }

        if (!lastActivity) {
            markActivity();
        }

        setLocked(false);
    }, [protectedPath]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        evaluateLock();
    }, [evaluateLock, pathname]);

    useEffect(() => {
        if (typeof window === "undefined" || !protectedPath || locked) return;

        const handleActivity = () => markActivity();
        const handleResume = () => evaluateLock();
        const interval = window.setInterval(evaluateLock, 30 * 1000);

        ACTIVITY_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleActivity, { passive: true });
        });
        window.addEventListener("focus", handleResume);
        document.addEventListener("visibilitychange", handleResume);

        return () => {
            window.clearInterval(interval);
            ACTIVITY_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleActivity);
            });
            window.removeEventListener("focus", handleResume);
            document.removeEventListener("visibilitychange", handleResume);
        };
    }, [evaluateLock, locked, protectedPath]);

    const unlock = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const refreshToken = getRefreshToken();
        if (!refreshToken || !baseUrl) {
            clearAllTokens();
            router.replace("/auth/login");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${baseUrl}/auth/unlock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken, password }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data?.token) {
                setError(data?.message || "Incorrect password. Please try again.");
                return;
            }

            storeAccessToken(data.token);
            localStorage.removeItem(LOCKED_KEY);
            markActivity();
            setPassword("");
            setLocked(false);
        } catch {
            setError("Unable to unlock right now. Check your connection and retry.");
        } finally {
            setLoading(false);
        }
    };

    const changeAccount = async () => {
        setLoading(true);
        try {
            const token = getValidToken() || (await refreshAccessToken());
            await performClientLogout({
                token,
                removeToken: clearAllTokens,
                dispatch,
            });
        } finally {
            localStorage.removeItem(LOCKED_KEY);
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            setLoading(false);
            router.replace("/auth/login");
        }
    };

    if (!protectedPath || !locked) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-[#020f08]/95 px-4 backdrop-blur-md">
            <form
                onSubmit={unlock}
                className="w-full max-w-md rounded-3xl border border-white/10 bg-[#07190f] p-8 text-white shadow-2xl"
            >
                <div className="mb-6">
                    <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
                        QiewCode locked
                    </p>
                    <h1 className="mt-3 text-2xl font-semibold">
                        Welcome back, {displayName}
                    </h1>
                    <p className="mt-2 text-sm text-white/65">
                        Enter your account password to continue.
                    </p>
                </div>

                <label className="mb-2 block text-sm font-medium text-white/80">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoFocus
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]"
                    placeholder="Enter your password"
                />

                {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

                <button
                    type="submit"
                    disabled={loading || !password}
                    className="mt-6 w-full rounded-xl bg-[#D4AF37] px-4 py-3 font-semibold text-[#07190f] transition hover:bg-[#f1cf55] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Unlocking..." : "Unlock"}
                </button>

                <div className="mt-5 flex items-center justify-between text-sm">
                    <a href="/auth/forgot-password" className="text-[#D4AF37] hover:underline">
                        Forgot password?
                    </a>
                    <button
                        type="button"
                        onClick={changeAccount}
                        className="text-white/70 hover:text-white hover:underline"
                    >
                        Change account
                    </button>
                </div>
            </form>
        </div>
    );
}
