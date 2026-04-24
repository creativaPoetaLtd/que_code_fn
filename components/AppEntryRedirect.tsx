"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getValidToken, refreshAccessToken } from "@/utils/tokenUtils";
import {
    getHomePathFromToken,
    hasVisitedSite,
    isStandaloneMode,
    markSiteVisited,
} from "@/utils/appEntry";

export default function AppEntryRedirect() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        const resolveEntry = async () => {
            const standalone = isStandaloneMode();
            const knownBrowser = hasVisitedSite();
            const token = getValidToken() || (await refreshAccessToken());

            if (cancelled) return;

            if (token) {
                markSiteVisited();
                router.replace(getHomePathFromToken(token));
                return;
            }

            if (standalone) {
                markSiteVisited();
                router.replace("/auth/login");
                return;
            }

            if (!knownBrowser) {
                markSiteVisited();
                router.replace("/qc");
                return;
            }

            markSiteVisited();
            router.replace("/auth/login");
        };

        void resolveEntry();

        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#020f08] px-6 text-center text-white">
            <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
                    QiewCode
                </p>
                <p className="mt-4 text-lg text-white/80">Opening your workspace...</p>
            </div>
        </div>
    );
}
