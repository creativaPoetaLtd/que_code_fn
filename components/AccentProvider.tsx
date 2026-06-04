"use client";

import { useEffect } from "react";
import { useAccent } from "@/hooks/use-accent";

export default function AccentProvider() {
    const accent = useAccent();

    useEffect(() => {
        const el = document.documentElement;
        if (accent.isOrg) {
            el.classList.add("accent-org");
        } else {
            el.classList.remove("accent-org");
        }
    }, [accent.isOrg]);

    return null;
}
