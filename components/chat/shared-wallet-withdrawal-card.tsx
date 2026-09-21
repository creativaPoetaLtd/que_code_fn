"use client";

import React from "react";
import { WalletCards, CheckCircle, Ban, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/utils/tokenUtils";
import {
    useGetSharedWalletWithdrawalByIdQuery,
    useApproveSharedWalletWithdrawalMutation,
    useDeclineSharedWalletWithdrawalMutation,
    useCancelSharedWalletWithdrawalMutation,
} from "@/states/sharedWalletSlice";
import { toast } from "@/hooks/use-toast";
import { PinSetupModal } from "@/components/PinSetupModal";

interface SharedWalletWithdrawalMessageData {
    type: "shared_wallet_withdrawal_request";
    withdrawalId: string;
    sharedWalletId: string;
    groupId?: string | null;
    amount: number;
    currency: string;
    requesterId: string;
    requesterName: string;
    note?: string;
    timestamp: string;
}

interface SharedWalletWithdrawalCardProps {
    data: SharedWalletWithdrawalMessageData;
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

export const SharedWalletWithdrawalCard: React.FC<SharedWalletWithdrawalCardProps> = ({ data, isMe, chatId }) => {
    const currentUserId = getCurrentUserId();

    // Polls while mounted so a vote cast by another member shows up here without a refresh.
    const { data: withdrawalResp } = useGetSharedWalletWithdrawalByIdQuery(
        { sharedWalletId: data.sharedWalletId, withdrawalId: data.withdrawalId },
        { pollingInterval: 15000 }
    );
    const withdrawal = withdrawalResp?.data;

    const [approveWithdrawal, { isLoading: approving }] = useApproveSharedWalletWithdrawalMutation();
    const [declineWithdrawal, { isLoading: declining }] = useDeclineSharedWalletWithdrawalMutation();
    const [cancelWithdrawal, { isLoading: cancelling }] = useCancelSharedWalletWithdrawalMutation();

    const [showPinForm, setShowPinForm] = React.useState(false);
    const [pin, setPin] = React.useState("");
    const [showPinSetup, setShowPinSetup] = React.useState(false);

    const status: string = withdrawal?.status || "pending";
    const approveCount: number = withdrawal?.approveCount ?? 0;
    const declineCount: number = withdrawal?.declineCount ?? 0;
    const requiredApprovals: number = withdrawal?.requiredApprovals ?? 1;
    const requestedByUserId: string | undefined = withdrawal?.requestedByUserId;
    const votes: Array<{ userId: string; decision: "approve" | "decline" }> = withdrawal?.votes || [];

    const isRequester = Boolean(requestedByUserId && currentUserId && requestedByUserId === currentUserId);
    const myVote = votes.find((v) => v.userId === currentUserId)?.decision;
    const isPending = status === "pending";
    const canVote = isPending && !isRequester && !myVote;
    const canCancel = isPending && isRequester;

    const handleApprove = async () => {
        if (pin.length !== 4) {
            toast({ title: "Enter PIN", description: "Please enter your 4-digit PIN.", variant: "destructive" });
            return;
        }
        try {
            await approveWithdrawal({ sharedWalletId: data.sharedWalletId, withdrawalId: data.withdrawalId, pin, chatId }).unwrap();
            toast({ title: "Vote recorded", description: "Your approval has been recorded." });
            setShowPinForm(false);
            setPin("");
        } catch (err: any) {
            const errorData = err?.data || {};
            if (errorData.requiresPinSetup) {
                setShowPinSetup(true);
                toast({ title: "PIN Setup Required", description: errorData.message || "Please set up your transaction PIN first", variant: "destructive" });
            } else {
                toast({ title: "Could not approve", description: errorData.message || "Something went wrong", variant: "destructive" });
            }
            setPin("");
        }
    };

    const handlePinSetupSuccess = () => {
        toast({ title: "PIN Setup Complete", description: "You can now approve this request." });
        setShowPinSetup(false);
        setShowPinForm(true);
    };

    const handleDecline = async () => {
        try {
            await declineWithdrawal({ sharedWalletId: data.sharedWalletId, withdrawalId: data.withdrawalId, chatId }).unwrap();
            toast({ title: "Vote recorded", description: "Your decline has been recorded." });
        } catch (err: any) {
            toast({ title: "Could not decline", description: err?.data?.message || "Something went wrong", variant: "destructive" });
        }
    };

    const handleCancel = async () => {
        try {
            await cancelWithdrawal({ sharedWalletId: data.sharedWalletId, withdrawalId: data.withdrawalId, chatId }).unwrap();
            toast({ title: "Request cancelled" });
        } catch (err: any) {
            toast({ title: "Could not cancel", description: err?.data?.message || "Something went wrong", variant: "destructive" });
        }
    };

    const statusPill = () => {
        if (status === "approved") return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                <CheckCircle className="w-2.5 h-2.5" /> Approved
            </span>
        );
        if (status === "declined") return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <Ban className="w-2.5 h-2.5" /> Declined
            </span>
        );
        if (status === "cancelled") return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <Ban className="w-2.5 h-2.5" /> Cancelled
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <Clock className="w-2.5 h-2.5" /> {approveCount}/{requiredApprovals} approved
            </span>
        );
    };

    const shell = `
        w-[260px] rounded-2xl overflow-hidden shadow-sm border
        ${status === "approved"
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
            : status === "declined" || status === "cancelled"
                ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700'
                : isMe
                    ? 'bg-white dark:bg-darkBg-card border-brand-green/20 dark:border-brand-gold/20'
                    : 'bg-white dark:bg-darkBg-card border-gray-100 dark:border-darkBorder-light'
        }
    `.trim();

    const stripColor = status === "approved"
        ? 'bg-green-500'
        : status === "declined" || status === "cancelled"
            ? 'bg-gray-400'
            : 'bg-amber-500';

    return (
        <>
        <PinSetupModal open={showPinSetup} onOpenChange={setShowPinSetup} onSuccess={handlePinSetupSuccess} />
        <div className={shell}>
            <div className={`h-1 w-full ${stripColor}`} />

            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-1.5">
                    <WalletCards className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Withdrawal Request
                    </span>
                </div>
                {statusPill()}
            </div>

            <div className="px-3 py-2 text-center">
                <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                    {fmt(data.amount, data.currency)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Requested by {data.requesterName}
                </p>
            </div>

            {data.note && (
                <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400">
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 italic line-clamp-2">&quot;{data.note}&quot;</p>
                </div>
            )}

            {status === "declined" && (
                <p className="px-3 pb-1 text-[11px] text-gray-500 text-center">
                    A majority could no longer approve this request
                </p>
            )}

            {(canVote || canCancel) && (
                <div className="px-3 pb-3 space-y-2">
                    <div className="h-px bg-gray-100 dark:bg-darkBorder-light" />

                    {canVote && !showPinForm && (
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleDecline} disabled={declining || approving} className="flex-1 h-8 text-xs">
                                {declining ? <span className="animate-pulse">…</span> : 'Decline'}
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setShowPinForm(true)}
                                disabled={declining}
                                className="flex-1 h-8 text-xs bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white"
                            >
                                Approve
                            </Button>
                        </div>
                    )}

                    {canVote && showPinForm && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light">
                                <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="4-digit PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="border-0 bg-transparent p-0 h-auto text-center text-base tracking-widest focus-visible:ring-0 focus-visible:ring-offset-0"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter' && pin.length === 4) handleApprove(); }}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setShowPinForm(false); setPin(""); }} disabled={approving} className="flex-1 h-8 text-xs">
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleApprove}
                                    disabled={approving || pin.length !== 4}
                                    className="flex-1 h-8 text-xs bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white"
                                >
                                    {approving ? <span className="animate-pulse">…</span> : 'Confirm'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {canCancel && (
                        <Button size="sm" variant="outline" onClick={handleCancel} disabled={cancelling} className="w-full h-8 text-xs">
                            {cancelling ? <span className="animate-pulse">…</span> : 'Cancel request'}
                        </Button>
                    )}
                </div>
            )}

            <p className="text-[10px] text-gray-300 dark:text-gray-600 text-right px-3 pb-2">
                {fmtTime(data.timestamp)}
            </p>
        </div>
        </>
    );
};
