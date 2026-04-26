"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TransferSummaryCardProps {
    recipientName: string;
    recipientAvatar?: string;
    amount: string;
    currency?: string;
}

const TransferSummaryCard = ({
    recipientName,
    recipientAvatar,
    amount,
    currency = "RWF",
}: TransferSummaryCardProps) => {
    const initials = recipientName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const formatted = parseFloat(amount)
        ? parseFloat(amount).toLocaleString()
        : amount;

    return (
        <div className="bg-gray-50 dark:bg-darkBg-interactive rounded-2xl px-5 py-4 mb-6 flex items-center gap-4 border border-gray-100 dark:border-darkBorder-light">
            {/* Sender dot */}
            <div className="w-9 h-9 rounded-full bg-brand-green/10 dark:bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-brand-green dark:bg-brand-gold" />
            </div>

            <ArrowRight size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />

            {/* Recipient */}
            <Avatar className="w-9 h-9 flex-shrink-0 border-2 border-white dark:border-darkBg-card shadow-sm">
                <AvatarImage src={recipientAvatar} alt={recipientName} />
                <AvatarFallback className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-xs font-bold">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Sending to</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{recipientName}</p>
            </div>

            <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">{currency}</p>
                <p className="font-black text-gray-900 dark:text-white text-lg leading-tight">{formatted}</p>
            </div>
        </div>
    );
};

export default TransferSummaryCard;
