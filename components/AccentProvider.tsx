"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function readIsOrg(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const raw = localStorage.getItem("token");
        if (!raw) return false;
        let p: any;
        try { p = JSON.parse(raw); } catch { p = raw; }
        const token = p?.value || p;
        if (!token || typeof token !== "string") return false;
        const parts = token.split(".");
        if (parts.length !== 3) return false;
        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        return payload?.accountType === "organization";
    } catch {
        return false;
    }
}

export default function AccentProvider() {
    const pathname = usePathname();

    useEffect(() => {
        const el = document.documentElement;
        if (readIsOrg()) {
            el.classList.add("accent-org");
        } else {
            el.classList.remove("accent-org");
        }
    }, [pathname]);

    return null;
}
