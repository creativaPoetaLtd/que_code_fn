"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Download, Eye, EyeOff, Plus, QrCode, Send } from "lucide-react";
import baseUrl from "@/helpers/baseUrl";
import { getEntityBalance } from "@/helpers/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { DASHBOARD_SURFACE } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface WalletHeroProps {
    userId: string;
}

const ACTIONS = [
    { label: "Send", icon: Send, href: "/home/transfer" },
    { label: "Request", icon: Download, href: "/home/request" },
    { label: "Scan QR", icon: QrCode, href: "/home/scan" },
    { label: "Top up", icon: Plus, href: null },
] as const;

/**
 * The balance and the four things you came here to do, in one block at the top.
 * Previously the balance was a line inside a greeting card and the actions were
 * buried under a full-size QR code, so the page's primary job sat below its least
 * urgent one.
 */
export const WalletHero: React.FC<WalletHeroProps> = ({ userId }) => {
    const router = useRouter();
    const { getToken } = useAuthToken();
    const [userName, setUserName] = useState<string>("");
    const [balance, setBalance] = useState<number | null>(null);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [balanceError, setBalanceError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        const fetchUser = async () => {
            try {
                const authToken = getToken();
                const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
                const res = await axios.get(`${baseUrl}/users/${userId}`, { headers });
                if (cancelled) return;
                setUserName(res.data?.firstName || res.data?.name || "");
            } catch {
                // A missing first name just means a shorter greeting
            }
        };

        fetchUser();
        return () => {
            cancelled = true;
        };
    }, [userId, getToken]);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        const fetchBalance = async () => {
            setBalanceLoading(true);
            setBalanceError(null);
            try {
                let response;
                try {
                    response = await getEntityBalance(userId, "user");
                } catch {
                    response = await getEntityBalance(userId, "organization");
                }
                if (cancelled) return;
                if (response.success && response.data) {
                    setBalance(Number(response.data.availableBalance));
                } else {
                    setBalanceError("Unable to fetch balance");
                }
            } catch {
                if (!cancelled) setBalanceError("Could not fetch balance");
            } finally {
                if (!cancelled) setBalanceLoading(false);
            }
        };

        fetchBalance();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const greeting = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    })();

    return (
        <section className={cn(DASHBOARD_SURFACE, "p-4 sm:p-5")}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                {/* Balance */}
                <div className="min-w-0">
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {greeting}
                        {userName && (
                            <>
                                , <span className="font-semibold text-brand-green dark:text-brand-gold">{userName}</span>
                            </>
                        )}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                        <h1 className="truncate text-3xl font-bold leading-tight text-[#00313A] dark:text-white">
                            {balanceLoading
                                ? "—"
                                : balanceError
                                    ? balanceError
                                    : isBalanceVisible
                                        ? `RWF ${balance?.toLocaleString() ?? 0}`
                                        : "••••••"}
                        </h1>
                        <button
                            type="button"
                            onClick={() => setIsBalanceVisible(v => !v)}
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-darkBg-interactive dark:hover:text-gray-300"
                            aria-label={isBalanceVisible ? "Hide balance" : "Show balance"}
                        >
                            {isBalanceVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Available balance
                    </p>
                </div>

                {/* Primary actions — the four things this page exists for */}
                <div className="grid flex-shrink-0 grid-cols-4 gap-2 sm:w-auto">
                    {ACTIONS.map(({ label, icon: Icon, href }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => href && router.push(href)}
                            className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 px-1.5 py-2.5 transition-colors hover:border-brand-green hover:bg-brand-green/5 dark:border-darkBorder-light dark:hover:border-brand-gold dark:hover:bg-brand-gold/5 sm:px-3 sm:min-w-[76px]"
                        >
                            <Icon size={20} className="text-brand-green dark:text-brand-gold" />
                            <span className="whitespace-nowrap text-[10px] font-medium text-gray-700 dark:text-gray-300 sm:text-[11px]">
                                {label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WalletHero;
