"use client";

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { BatchContact } from "./BatchRecipientRow";

export interface BatchResultEntry {
    receiverUserId?: string | null;
    receiverOrganizationId?: string | null;
    receiverWalletId?: string | null;
    amount: number;
    status: "success" | "failed";
    transactionId?: string;
    reason?: string;
}

interface BatchResultsListProps {
    results: BatchResultEntry[];
    contactsById: Record<string, BatchContact>;
}

const BatchResultsList = ({ results, contactsById }: BatchResultsListProps) => {
    return (
        <div className="space-y-2">
            {results.map((result, index) => {
                const contact = result.receiverUserId ? contactsById[result.receiverUserId] : undefined;
                const nameParts = (contact?.name || "Recipient").split(" ");
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ") || "";

                return (
                    <div
                        key={`${result.receiverUserId || result.receiverWalletId}-${index}`}
                        className={cn(
                            "flex items-center gap-3 p-3.5 rounded-2xl border",
                            result.status === "success"
                                ? "border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card"
                                : "border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10"
                        )}
                    >
                        <UserAvatar
                            profileImage={contact?.avatar || null}
                            firstName={firstName}
                            lastName={lastName}
                            className="w-10 h-10 flex-shrink-0"
                            userType="user"
                        />

                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {contact?.name || "Recipient"}
                            </p>
                            {result.status === "failed" && (
                                <p className="text-xs text-red-500 dark:text-red-400 truncate">{result.reason}</p>
                            )}
                        </div>

                        <div className="text-right flex-shrink-0">
                            <p
                                className={cn(
                                    "font-bold text-sm",
                                    result.status === "success"
                                        ? "text-gray-900 dark:text-white"
                                        : "text-red-400 dark:text-red-400/70 line-through"
                                )}
                            >
                                RWF {result.amount.toLocaleString()}
                            </p>
                        </div>

                        {result.status === "success" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default BatchResultsList;
