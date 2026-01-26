"use client";

import React from "react";
import { ArrowLeft, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RecipientHeaderProps {
    recipient: {
        name: string;
        phone: string;
        avatar: string;
        username?: string;
    };
    onBack: () => void;
}

const RecipientHeader = ({ recipient, onBack }: RecipientHeaderProps) => {
    return (
        <div className="flex items-center gap-4 mb-8 bg-white dark:bg-darkBg-card p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder-light">
            <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-darkBg-interactive rounded-full transition text-gray-700 dark:text-gray-300"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm">
                <Avatar className="w-full h-full">
                    <AvatarImage src={recipient.avatar} alt={recipient.name} />
                    <AvatarFallback className="bg-gray-50 dark:bg-darkBg-main">
                        <User className="w-6 h-6 text-gray-400" />
                    </AvatarFallback>
                </Avatar>
            </div>

            <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                    {recipient.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {recipient.phone}
                </p>
            </div>

            <div className="px-3 py-1 bg-green-100 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold text-[10px] font-bold rounded-full uppercase tracking-wider">
                Recipient
            </div>
        </div>
    );
};

export default RecipientHeader;
