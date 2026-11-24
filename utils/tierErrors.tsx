import React from "react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { formatCurrency } from "@/utils/currency";

// Error codes the backend returns when an account type blocks a money action.
export type TierErrorCode = "UPGRADE_REQUIRED" | "DAILY_LIMIT_EXCEEDED";

export interface TierError {
    code: TierErrorCode;
    message: string;
    currentTier?: string;
    requiredTiers?: string[];
    onDemand?: boolean;
    dailyLimit?: number;
    usedToday?: number;
    remainingToday?: number;
}

export const PLAN_SETTINGS_URL = "/settings?tab=plan";

/** The tier error in an axios error (`err.response.data`) or RTK Query error (`err.data`). */
export const getTierError = (error: any): TierError | null => {
    const body = error?.response?.data ?? error?.data ?? error;
    if (body?.code === "UPGRADE_REQUIRED" || body?.code === "DAILY_LIMIT_EXCEEDED") return body as TierError;
    return null;
};

/** One line for the user, e.g. under a form. */
export const describeTierError = (error: TierError): string => {
    if (error.code === "DAILY_LIMIT_EXCEEDED" && error.remainingToday != null) {
        return error.remainingToday > 0
            ? `You've reached today's limit. You can still send ${formatCurrency(error.remainingToday)} today.`
            : "You've reached today's transfer limit. It resets at midnight.";
    }
    return error.message;
};

/**
 * Shows a toast with a "See plans" action when `error` is an account type error.
 * Returns true if it was one, so callers can skip their generic error handling.
 */
export const notifyTierError = (error: any, navigate?: (url: string) => void): boolean => {
    const tierError = getTierError(error);
    if (!tierError) return false;

    const goToPlans = () => (navigate ? navigate(PLAN_SETTINGS_URL) : window.location.assign(PLAN_SETTINGS_URL));
    toast({
        title: tierError.code === "DAILY_LIMIT_EXCEEDED" ? "Daily limit reached" : "Upgrade required",
        description: describeTierError(tierError),
        variant: "destructive",
        action: tierError.onDemand ? undefined : (
            <ToastAction altText="See plans" onClick={goToPlans}>
                See plans
            </ToastAction>
        ),
    });
    return true;
};
