"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

interface BalanceCardProps {
    balance: number | null;
    currency?: string;
    percentageChange?: number;
    isLoading?: boolean;
}

const BalanceCard = ({
    balance,
    currency = "RWF",
    percentageChange = 12.5,
    isLoading = false,
}: BalanceCardProps) => {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00313A] to-[#00252e] dark:bg-darkBg-card dark:from-transparent dark:to-transparent p-6 shadow-lg border border-transparent dark:border-darkBorder-light">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />
                <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/10" />
            </div>

            <div className="relative z-10">
                <p className="text-sm text-white/80 mb-2">Available Balance</p>

                {isLoading ? (
                    <div className="h-10 w-40 bg-white/20 rounded-lg animate-pulse" />
                ) : (
                    <h2 className="text-3xl font-bold text-white tracking-wide">
                        {currency} {balance?.toLocaleString() || "0"}
                    </h2>
                )}

                {percentageChange !== undefined && (
                    <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 bg-emerald-500 rounded-full">
                        <TrendingUp className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs font-medium text-white">
                            +{percentageChange}% this month
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BalanceCard;
