"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    getValidToken,
    parseTokenPayload,
    refreshAccessToken,
} from "@/utils/tokenUtils";

type StandaloneNavigator = Navigator & {
    standalone?: boolean;
};

const isStandaloneMode = () => {
    if (typeof window === "undefined") return false;

    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((window.navigator as StandaloneNavigator).standalone)
    );
};

const getHomePathFromToken = (token: string) => {
    const payload = parseTokenPayload(token);
    const userId = payload?.userId || payload?.id || payload?.sub;
    return userId ? `/home/${userId}` : "/home";
};

export default function PWAStandaloneRedirect() {
    const router = useRouter();

    useEffect(() => {
        if (!isStandaloneMode()) return;

        let cancelled = false;

        const redirect = async () => {
            const token = getValidToken() || (await refreshAccessToken());

            if (cancelled) return;

            if (token) {
                router.replace(getHomePathFromToken(token));
                return;
            }

            router.replace("/auth/login");
        };

        void redirect();

        return () => {
            cancelled = true;
        };
    }, [router]);

    return null;
}
