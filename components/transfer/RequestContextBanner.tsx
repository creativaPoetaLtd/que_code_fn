"use client";

import React from "react";
import { Lock, Pencil, QrCode } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RequestContextBannerProps {
    requesterName: string;
    requesterAvatar?: string;
    amount: number;
    currency?: string;
    note?: string | null;
    allowEditAmount: boolean;
}

const RequestContextBanner = ({
    requesterName,
    requesterAvatar,
    amount,
    currency = "RWF",
    note,
    allowEditAmount,
}: RequestContextBannerProps) => {
    const initials = requesterName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="relative overflow-hidden rounded-3xl mb-6 border border-brand-green/20 dark:border-brand-gold/20 bg-gradient-to-br from-brand-green/5 via-white to-brand-green/10 dark:from-brand-gold/10 dark:via-darkBg-card dark:to-brand-gold/5 shadow-sm">
            {/* Top label */}
            <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <div className="flex items-center gap-1.5 bg-brand-green/10 dark:bg-brand-gold/10 px-2.5 py-1 rounded-full">
                    <QrCode size={11} className="text-brand-green dark:text-brand-gold" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green dark:text-brand-gold">
                        Payment Request
                    </span>
                </div>

                {allowEditAmount ? (
                    <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full">
                        <Pencil size={10} />
                        <span className="text-[10px] font-semibold">Amount adjustable</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-darkBg-interactive px-2.5 py-1 rounded-full">
                        <Lock size={10} />
                        <span className="text-[10px] font-semibold">Amount fixed</span>
                    </div>
                )}
            </div>

            {/* Main content */}
            <div className="flex flex-col items-center text-center px-5 py-5">
                <Avatar className="w-16 h-16 border-4 border-white dark:border-darkBg-card shadow-md mb-3">
                    <AvatarImage src={requesterAvatar} alt={requesterName} />
                    <AvatarFallback className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold text-lg">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{requesterName}</span>
                    {" "}is requesting
                </p>

                <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    <span className="text-xl font-bold text-gray-400 dark:text-gray-500 mr-1">{currency}</span>
                    {amount.toLocaleString()}
                </p>

                {note && (
                    <div className="mt-3 px-4 py-2 bg-white/70 dark:bg-darkBg-main/50 rounded-xl border border-gray-100 dark:border-darkBorder-light max-w-xs">
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{note}"</p>
                    </div>
                )}
            </div>

            {/* Decorative ring */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full border-[20px] border-brand-green/5 dark:border-brand-gold/5 pointer-events-none" />
            <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full border-[16px] border-brand-green/5 dark:border-brand-gold/5 pointer-events-none" />
        </div>
    );
};

export default RequestContextBanner;
