"use client";

import React from "react";
import { Lock, CheckCircle, Undo2, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/utils/tokenUtils";
import {
    useGetEscrowByIdQuery,
    useReleaseEscrowMutation,
    useRefundEscrowMutation,
    useDisputeEscrowMutation,
} from "@/states/escrowSlice";
import { toast } from "@/hooks/use-toast";

interface EscrowMessageData {
    type: "escrow";
    escrowId: string;
    amount: number;
    currency: string;
    payerName: string;
    payeeName: string;
    description?: string;
    releaseMode: "manual" | "auto_timeout";
    autoReleaseAt?: string | null;
    timestamp: string;
}

interface EscrowMessageCardProps {
    data: EscrowMessageData;
    isMe: boolean;
    chatId?: string;
}

function fmt(amount: number, currency = "RWF") {
    return new Intl.NumberFormat("en-RW", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function fmtTime(ts: string) {
    return new Date(ts).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export const EscrowMessageCard: React.FC<EscrowMessageCardProps> = ({ data, isMe, chatId }) => {
    const currentUserId = getCurrentUserId();

    // Polls while mounted so a release/refund/dispute made by the other party (or the
    // auto-release cron) shows up here without needing a page refresh.
    const { data: escrowResp } = useGetEscrowByIdQuery({ escrowId: data.escrowId }, { pollingInterval: 15000 });
    const escrow = escrowResp?.data;

    const [releaseEscrow, { isLoading: releasing }] = useReleaseEscrowMutation();
    const [refundEscrow, { isLoading: refunding }] = useRefundEscrowMutation();
    const [disputeEscrow, { isLoading: disputing }] = useDisputeEscrowMutation();

    const [showDisputeForm, setShowDisputeForm] = React.useState(false);
    const [disputeReason, setDisputeReason] = React.useState("");

    const status: string = escrow?.status || "held";
    const isPayer = Boolean(escrow?.payerUserId && currentUserId && escrow.payerUserId === currentUserId);
    const isPayee = Boolean(escrow?.payeeUserId && currentUserId && escrow.payeeUserId === currentUserId);
    const isHeld = status === "held";

    const handleRelease = async () => {
        try {
            await releaseEscrow({ escrowId: data.escrowId, chatId }).unwrap();
            toast({ title: "Funds released", description: `${fmt(data.amount, data.currency)} sent to ${data.payeeName}` });
        } catch (err: any) {
            toast({ title: "Could not release", description: err?.data?.message || "Something went wrong", variant: "destructive" });
        }
    };

    const handleRefund = async () => {
        try {
            await refundEscrow({ escrowId: data.escrowId, chatId }).unwrap();
            toast({ title: "Escrow cancelled", description: `${fmt(data.amount, data.currency)} returned to your balance` });
        } catch (err: any) {
            toast({ title: "Could not cancel", description: err?.data?.message || "Something went wrong", variant: "destructive" });
        }
    };

    const handleDispute = async () => {
        if (!disputeReason.trim()) {
            toast({ title: "Reason required", description: "Please explain the issue", variant: "destructive" });
            return;
        }
        try {
            await disputeEscrow({ escrowId: data.escrowId, chatId, reason: disputeReason }).unwrap();
            toast({ title: "Dispute raised", description: "An admin will review this escrow" });
            setShowDisputeForm(false);
        } catch (err: any) {
            toast({ title: "Could not raise dispute", description: err?.data?.message || "Something went wrong", variant: "destructive" });
        }
    };

    const statusPill = () => {
        if (status === "released") return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                <CheckCircle className="w-2.5 h-2.5" /> Released
            </span>
        );
        if (status === "refunded") return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <Undo2 className="w-2.5 h-2.5" /> Refunded
            </span>
        );
        if (status === "disputed") return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                <AlertTriangle className="w-2.5 h-2.5" /> Disputed
            </span>
        );
        if (status === "cancelled" || status === "expired") return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <Undo2 className="w-2.5 h-2.5" /> {status === "expired" ? "Expired" : "Cancelled"}
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <Lock className="w-2.5 h-2.5" /> Held
            </span>
        );
    };

    const shell = `
        w-[260px] rounded-2xl overflow-hidden shadow-sm border
        ${status === "released"
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
            : status === "disputed"
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
                : status === "refunded" || status === "cancelled" || status === "expired"
                    ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700'
                    : isMe
                        ? 'bg-white dark:bg-darkBg-card border-brand-green/20 dark:border-brand-gold/20'
                        : 'bg-white dark:bg-darkBg-card border-gray-100 dark:border-darkBorder-light'
        }
    `.trim();

    const stripColor = status === "released"
        ? 'bg-green-500'
        : status === "disputed"
            ? 'bg-red-500'
            : status === "refunded" || status === "cancelled" || status === "expired"
                ? 'bg-gray-400'
                : 'bg-brand-green dark:bg-brand-gold';

    return (
        <div className={shell}>
            <div className={`h-1 w-full ${stripColor}`} />

            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-brand-green dark:text-brand-gold" />
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Escrow
                    </span>
                </div>
                {statusPill()}
            </div>

            <div className="px-3 py-2 text-center">
                <p className="text-2xl font-bold tracking-tight text-brand-green dark:text-brand-gold">
                    {fmt(data.amount, data.currency)}
                </p>
            </div>

            <div className="flex items-center gap-1 px-3 pb-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase">From</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{data.payerName}</p>
                </div>
                <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase">To</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{data.payeeName}</p>
                </div>
            </div>

            {data.description && (
                <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400">
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 italic line-clamp-2">&quot;{data.description}&quot;</p>
                </div>
            )}

            {isHeld && data.releaseMode === "auto_timeout" && data.autoReleaseAt && (
                <p className="px-3 pb-1 text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Auto-releases {new Date(data.autoReleaseAt).toLocaleDateString()}
                </p>
            )}

            {escrow?.status === "disputed" && escrow?.disputeReason && (
                <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-2 border-red-400">
                    <p className="text-[11px] text-red-700 dark:text-red-300">Dispute: {escrow.disputeReason}</p>
                </div>
            )}

            {isHeld && (isPayer || isPayee) && (
                <div className="px-3 pb-3 space-y-2">
                    <div className="h-px bg-gray-100 dark:bg-darkBorder-light" />

                    {!showDisputeForm ? (
                        <>
                            {isPayer && (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={handleRefund} disabled={releasing || refunding} className="flex-1 h-8 text-xs">
                                        {refunding ? <span className="animate-pulse">…</span> : 'Cancel'}
                                    </Button>
                                    <Button size="sm" onClick={handleRelease} disabled={releasing || refunding} className="flex-1 h-8 text-xs bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white">
                                        {releasing ? <span className="animate-pulse">…</span> : 'Release'}
                                    </Button>
                                </div>
                            )}
                            {isPayee && (
                                <p className="text-[11px] text-gray-500 text-center">Waiting for {data.payerName} to release</p>
                            )}
                            <button
                                onClick={() => setShowDisputeForm(true)}
                                className="w-full text-[11px] text-red-500 hover:text-red-600 text-center"
                            >
                                Raise a dispute
                            </button>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <Input
                                placeholder="What's wrong?"
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                className="h-8 text-xs"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setShowDisputeForm(false)} disabled={disputing} className="flex-1 h-8 text-xs">Cancel</Button>
                                <Button size="sm" onClick={handleDispute} disabled={disputing} className="flex-1 h-8 text-xs bg-red-500 hover:bg-red-600 text-white">
                                    {disputing ? <span className="animate-pulse">…</span> : 'Submit'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <p className="text-[10px] text-gray-300 dark:text-gray-600 text-right px-3 pb-2">
                {fmtTime(data.timestamp)}
            </p>
        </div>
    );
};
