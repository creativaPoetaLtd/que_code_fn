"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getValidToken, refreshAccessToken } from "@/utils/tokenUtils";
import {
    getHomePathFromToken,
    isStandaloneMode,
    markSiteVisited,
} from "@/utils/appEntry";

export default function MarketingPageShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [canRenderLanding, setCanRenderLanding] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const resolveAccess = async () => {
            const standalone = isStandaloneMode();
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

            markSiteVisited();
            setCanRenderLanding(true);
        };

        void resolveAccess();

        return () => {
            cancelled = true;
        };
    }, [router]);

    if (!canRenderLanding) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#020f08] px-6 text-center text-white">
                <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
                        QiewCode
                    </p>
                    <p className="mt-4 text-lg text-white/80">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
