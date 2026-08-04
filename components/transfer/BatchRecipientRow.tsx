"use client";

import React from "react";
import { Check } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

export interface BatchContact {
    id: string;
    name: string;
    phone: string;
    avatar: string | null;
}

interface BatchRecipientRowProps {
    contact: BatchContact;
    isSelected: boolean;
    amount: string;
    onToggle: () => void;
    onAmountChange: (value: string) => void;
}

const BatchRecipientRow = ({ contact, isSelected, amount, onToggle, onAmountChange }: BatchRecipientRowProps) => {
    const nameParts = contact.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return (
        <div
            className={cn(
                "w-full rounded-2xl border transition-all overflow-hidden",
                isSelected
                    ? "border-brand-green dark:border-brand-gold bg-brand-green/5 dark:bg-brand-gold/5"
                    : "border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card"
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors"
            >
                <div
                    className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected
                            ? "bg-brand-green dark:bg-brand-gold border-brand-green dark:border-brand-gold"
                            : "border-gray-300 dark:border-darkBorder-medium"
                    )}
                >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white dark:text-darkBg-main" />}
                </div>

                <UserAvatar
                    profileImage={contact.avatar}
                    firstName={firstName}
                    lastName={lastName}
                    className="w-11 h-11 flex-shrink-0"
                    userType="user"
                />

                <div className="flex-1 text-left min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{contact.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{contact.phone}</p>
                </div>
            </button>

            {isSelected && (
                <div className="px-4 pb-4 pl-13 animate-fadeIn">
                    <div className="relative ml-9">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 dark:text-gray-500">
                            RWF
                        </span>
                        <input
                            type="number"
                            inputMode="decimal"
                            min={1}
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => onAmountChange(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full pl-14 pr-4 py-2.5 bg-white dark:bg-darkBg-main rounded-xl border border-gray-200 dark:border-darkBorder-light focus:border-brand-green dark:focus:border-brand-gold focus:ring-2 focus:ring-green-100 dark:focus:ring-brand-gold/10 transition-all text-gray-900 dark:text-white font-semibold"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchRecipientRow;
