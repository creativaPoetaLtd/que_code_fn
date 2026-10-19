/**
 * The surface every panel on the dashboard sits on.
 *
 * Each section used to carry its own copy of this class list, which is how they
 * drifted apart — and all of them had a hover shadow on a panel that is not
 * clickable. One constant keeps them honest.
 */
export const DASHBOARD_SURFACE =
    "rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-darkBorder-light dark:bg-darkBg-card";

/** Section heading, shared by every dashboard panel */
export const DASHBOARD_CARD_TITLE =
    "truncate text-sm font-semibold text-[#00313A] dark:text-white";

/** The "View all" affordance in a panel header */
export const DASHBOARD_CARD_LINK =
    "text-xs font-semibold text-brand-green transition-opacity hover:opacity-70 dark:text-brand-gold";

/** Header row of a dashboard panel */
export const DASHBOARD_CARD_HEADER =
    "flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-darkBorder-light";
