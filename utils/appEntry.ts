import { parseTokenPayload } from "@/utils/tokenUtils";

const SITE_VISITED_KEY = "qc:siteVisited";

type StandaloneNavigator = Navigator & {
    standalone?: boolean;
};

export const hasVisitedSite = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SITE_VISITED_KEY) === "1";
};

export const markSiteVisited = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SITE_VISITED_KEY, "1");
};

export const isStandaloneMode = () => {
    if (typeof window === "undefined") return false;

    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((window.navigator as StandaloneNavigator).standalone)
    );
};

export const getHomePathFromToken = (token: string) => {
    const payload = parseTokenPayload(token);
    const userId = payload?.userId || payload?.id || payload?.sub;
    return userId ? `/home/${userId}` : "/home";
};
