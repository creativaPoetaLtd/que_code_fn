"use client";

import React from "react";
import { Send, Building2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDistanceToNow } from "date-fns";

export interface RecentSend {
    receiverId: string;
    receiverType: 'user' | 'organization' | 'wallet';
    receiverName: string;
    receiverPhone: string | null;
    receiverEmail: string | null;
    receiverProfileImage?: string | null;
    lastTransactionId: string;
    lastTransactionDate: string;
    lastTransactionAmount: number;
    lastTransactionDescription: string | null;
    lastTransactionType: string;
}

interface RecentSendItemProps {
    recipient: RecentSend;
    onSelect: (recipient: RecentSend) => void;
}

const RecentSendItem = ({ recipient, onSelect }: RecentSendItemProps) => {
    const isOrganization = recipient.receiverType === 'organization';
    const nameParts = recipient.receiverName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Format the relative time
    const timeAgo = formatDistanceToNow(new Date(recipient.lastTransactionDate), { addSuffix: true });

    // Format the amount
    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(recipient.lastTransactionAmount);

    return (
        <button
            onClick={() => onSelect(recipient)}
            className="w-full bg-white dark:bg-darkBg-card p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-darkBorder-light group flex items-center gap-4"
        >
            {/* Avatar */}
            <UserAvatar
                profileImage={recipient.receiverProfileImage}
                firstName={firstName}
                lastName={lastName}
                className="w-12 h-12 flex-shrink-0"
                userType={isOrganization ? 'organization' : 'user'}
            />

            {/* Name and Last Transaction Info */}
            <div className="flex-1 text-left min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors truncate">
                    {recipient.receiverName}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="truncate">RWF {formattedAmount}</span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="truncate">{timeAgo}</span>
                </div>
            </div>

            {/* Send Icon */}
            <div className="w-10 h-10 bg-gray-50 dark:bg-darkBg-main rounded-xl flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-brand-gold/10 transition-colors flex-shrink-0">
                <Send className="w-5 h-5 text-gray-400 group-hover:text-brand-green dark:group-hover:text-brand-gold" />
            </div>
        </button>
    );
};

export default RecentSendItem;
