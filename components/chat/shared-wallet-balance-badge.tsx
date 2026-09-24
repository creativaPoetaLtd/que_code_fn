'use client';

import { WalletCards } from "lucide-react";

interface SharedWalletBalanceBadgeProps {
    balance: number;
    currency?: string;
}

export default function SharedWalletBalanceBadge({
    balance,
    currency = "RWF",
}: SharedWalletBalanceBadgeProps) {
    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return amount.toFixed(0);
    };

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800/30">
            <WalletCards size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                {formatCurrency(balance)} {currency}
            </span>
        </div>
    );
}
