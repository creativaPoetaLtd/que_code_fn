"use client";

import { useEffect, useState } from "react";

/**
 * Mirrors Tailwind's `lg` breakpoint (1024px) so JS-driven layout decisions (e.g.
 * which card a section mounts inside) stay in sync with `lg:` CSS classes elsewhere
 * on the same page. Defaults to false (desktop) until the first effect runs, since
 * there's no viewport to measure on the server.
 */
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia("(max-width: 1023px)");
        const update = () => setIsMobile(mql.matches);

        update();
        mql.addEventListener("change", update);
        return () => mql.removeEventListener("change", update);
    }, []);

    return isMobile;
}
