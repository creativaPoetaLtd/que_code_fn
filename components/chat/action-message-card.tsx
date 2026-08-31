"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, CheckCircle2, ExternalLink, Ticket, Wallet } from "lucide-react";
import { getCurrentUserId } from "@/utils/tokenUtils";

export interface ActionTransferData {
    type: "action_transfer";
    purchaseId: string;
    qrObjectId?: string;
    actionId?: string;
    ownerId?: string;
    actionName: string;
    subActionName?: string;
    coverImage?: string;
    quantity?: number;
    validUntil?: string | null;
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    note?: string;
    timestamp: string;
}

export interface ActionShareData {
    type: "action_share";
    actionId: string;
    ownerId: string;
    actionName: string;
    actionType?: string;
    coverImage?: string;
    shortDescription?: string;
    price?: number;
    currency?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    note?: string;
    sharedById: string;
    sharedByName?: string;
    timestamp: string;
}

export type ActionMessageData = ActionTransferData | ActionShareData;

interface ActionMessageCardProps {
    data: ActionMessageData;
    isMe: boolean;
}

function fmtTime(ts: string) {
    return new Date(ts).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function fmtDate(value?: string | null) {
    return value
        ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;
}

function fmtMoney(amount: number, currency = "RWF") {
    return new Intl.NumberFormat("en-RW", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Renders the two things a chat can carry about an action: a handover, or a pointer to it. */
export const ActionMessageCard: React.FC<ActionMessageCardProps> = ({ data, isMe }) => {
    const router = useRouter();
    const currentUserId = getCurrentUserId();

    const isTransfer = data.type === "action_transfer";
    const cover = data.coverImage;

    const banner = cover ? (
        <div className="h-24 w-full bg-gray-100 dark:bg-darkBg-interactive">
            <img src={cover} alt="" className="h-full w-full object-cover" />
        </div>
    ) : null;

    const footer = (
        <p className="text-[10px] text-gray-300 dark:text-gray-600 text-right px-3 pb-2">
            {fmtTime(data.timestamp)}
        </p>
    );

    if (isTransfer) {
        const transfer = data as ActionTransferData;
        const isReceiver = Boolean(currentUserId && currentUserId === transfer.toId);
        const validUntil = fmtDate(transfer.validUntil);

        return (
            <div className="w-[260px] rounded-2xl overflow-hidden shadow-sm border bg-white dark:bg-darkBg-card border-violet-200 dark:border-violet-800/40">
                <div className="h-1 w-full bg-violet-500" />

                <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                    <div className="flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Ticket transfer
                        </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Transferred
                    </span>
                </div>

                {banner}

                <div className="px-3 pt-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                        {transfer.actionName}
                    </p>
                    {(transfer.subActionName || transfer.quantity || validUntil) && (
                        <p className="text-[11px] text-gray-400 truncate">
                            {[
                                transfer.subActionName,
                                transfer.quantity ? `x${transfer.quantity}` : null,
                                validUntil ? `until ${validUntil}` : null,
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                    )}
                </div>

                {/* Who handed what to whom — the whole point of the card */}
                <div className="flex items-center gap-1 px-3 py-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase">From</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                            {currentUserId === transfer.fromId ? "You" : transfer.fromName}
                        </p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase">To</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                            {isReceiver ? "You" : transfer.toName}
                        </p>
                    </div>
                </div>

                {transfer.note && (
                    <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 border-l-2 border-violet-400">
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 italic line-clamp-2">
                            &quot;{transfer.note}&quot;
                        </p>
                    </div>
                )}

                <div className="px-3 pb-3">
                    {isReceiver ? (
                        <button
                            type="button"
                            onClick={() => router.push(`/action/${transfer.toId}`)}
                            className="w-full h-8 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <Wallet className="w-3 h-3" /> Open in my tickets
                        </button>
                    ) : (
                        <p className="text-[11px] text-center text-gray-400">
                            {transfer.toName} owns this ticket now
                        </p>
                    )}
                </div>

                {footer}
            </div>
        );
    }

    const share = data as ActionShareData;
    const starts = fmtDate(share.startsAt);
    const ends = fmtDate(share.endsAt);
    const when = starts && ends && starts !== ends ? `${starts} – ${ends}` : starts || ends;

    return (
        <div
            className={`w-[260px] rounded-2xl overflow-hidden shadow-sm border bg-white dark:bg-darkBg-card ${
                isMe
                    ? "border-brand-green/20 dark:border-brand-gold/20"
                    : "border-gray-100 dark:border-darkBorder-light"
            }`}
        >
            <div className="h-1 w-full bg-brand-green dark:bg-brand-gold" />

            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-green dark:text-brand-gold" />
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {share.actionType ? `Shared ${share.actionType}` : "Shared action"}
                    </span>
                </div>
            </div>

            {banner}

            <div className="px-3 pt-2 pb-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                    {share.actionName}
                </p>
                {share.shortDescription && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                        {share.shortDescription}
                    </p>
                )}
                {(when || typeof share.price === "number") && (
                    <p className="text-[11px] text-gray-400 mt-1 truncate">
                        {[when, typeof share.price === "number" ? fmtMoney(share.price, share.currency) : null]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>
                )}
            </div>

            {share.note && (
                <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-darkBg-interactive border-l-2 border-brand-green dark:border-brand-gold">
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 italic line-clamp-2">
                        &quot;{share.note}&quot;
                    </p>
                </div>
            )}

            <div className="px-3 pb-3 pt-1">
                <button
                    type="button"
                    onClick={() => router.push(`/welcome/${share.ownerId}/action/${share.actionId}`)}
                    className="w-full h-8 rounded-lg bg-brand-green dark:bg-brand-gold hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity"
                >
                    <ExternalLink className="w-3 h-3" /> Open action
                </button>
            </div>

            {footer}
        </div>
    );
};

export default ActionMessageCard;
