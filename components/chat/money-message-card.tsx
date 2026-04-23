"use client";

import React from "react";
import {
    Download, CheckCircle, ArrowRight, Heart, TrendingUp,
    Lock, Pencil, X, CircleDollarSign, Clock, Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDownloadTransactionReceiptMutation } from "@/states/chatSlice";
import { declinePaymentRequest, acceptPaymentRequest } from "@/helpers/api";
import { getCurrentUserId } from "@/utils/tokenUtils";
import { toast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MoneyTransferData {
    type: 'money_transfer' | 'group_donation';
    amount: number;
    currency: string;
    senderName: string;
    recipientName: string;
    note?: string;
    transactionId: string;
    referenceId: string;
    timestamp: string;
    receiptUrl?: string;
    receiptFileName?: string;
    groupId?: string;
    groupName?: string;
}

interface MoneyRequestData {
    type: 'money_request';
    requestId: string;
    amount: number;
    currency: string;
    note?: string;
    status: 'pending' | 'paid' | 'cancelled' | 'expired';
    allowEditAmount?: boolean;
    senderId?: string;
    recipientId?: string;
    senderName?: string;
    recipientName?: string;
    timestamp: string;
}

interface MoneyMessageCardProps {
    data: MoneyTransferData | MoneyRequestData;
    isMe: boolean;
    chatId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = 'RWF') {
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function fmtTime(ts: string) {
    return new Date(ts).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ─── Money Request Card ────────────────────────────────────────────────────────

function MoneyRequestCard({ data, isMe, chatId }: { data: MoneyRequestData; isMe: boolean; chatId?: string }) {
    const currentUserId = getCurrentUserId();

    // Local state
    const [status, setStatus] = React.useState(data.status);
    const [step, setStep] = React.useState<'idle' | 'amount' | 'pin'>('idle');
    const [customAmount, setCustomAmount] = React.useState(String(data.amount));
    const [pin, setPin] = React.useState('');
    const [isDeclining, setIsDeclining] = React.useState(false);
    const [isAccepting, setIsAccepting] = React.useState(false);

    // Sync status from parent when content prop changes (socket update)
    React.useEffect(() => { setStatus(data.status); }, [data.status]);

    const isRecipient = Boolean(data.recipientId && currentUserId && data.recipientId === currentUserId);
    const canAct = isRecipient && status === 'pending';
    const isPending = status === 'pending';
    const isPaid = status === 'paid';
    const isCancelled = status === 'cancelled' || status === 'expired';

    // ── Status pill ────────────────────────────────────────────────────────────
    const statusPill = () => {
        if (isPaid) return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                <CheckCircle className="w-2.5 h-2.5" /> Paid
            </span>
        );
        if (isCancelled) return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <Ban className="w-2.5 h-2.5" /> {status === 'expired' ? 'Expired' : 'Declined'}
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <Clock className="w-2.5 h-2.5" /> Pending
            </span>
        );
    };

    // ── Accept handler ─────────────────────────────────────────────────────────
    const onAcceptStart = () => {
        if (data.allowEditAmount) {
            setCustomAmount(String(data.amount));
            setStep('amount');
        } else {
            setStep('pin');
        }
        setPin('');
    };

    const onNextFromAmount = () => {
        const val = Number(customAmount);
        if (!val || val <= 0) {
            toast({ title: 'Invalid amount', description: 'Please enter a valid amount.', variant: 'destructive' });
            return;
        }
        setStep('pin');
        setPin('');
    };

    const onConfirmPay = async () => {
        if (!pin || pin.length !== 4) {
            toast({ title: 'Enter PIN', description: 'Please enter your 4-digit PIN.', variant: 'destructive' });
            return;
        }
        try {
            setIsAccepting(true);
            const payAmount = data.allowEditAmount ? Number(customAmount) : undefined;
            const res: any = await acceptPaymentRequest(data.requestId, pin, chatId, payAmount);
            const payload = res?.data ?? res;
            if (payload?.success) {
                setStatus('paid');
                setStep('idle');
                toast({ title: 'Payment sent', description: `You paid ${fmt(payAmount ?? data.amount, data.currency)} successfully.` });
            } else {
                toast({ title: 'Payment failed', description: payload?.message || 'Could not process payment.', variant: 'destructive' });
                setPin('');
            }
        } catch (err: any) {
            toast({
                title: 'Payment failed',
                description: err?.response?.data?.message || 'Could not process payment.',
                variant: 'destructive',
            });
            setPin('');
        } finally {
            setIsAccepting(false);
        }
    };

    const onDecline = async () => {
        try {
            setIsDeclining(true);
            const res: any = await declinePaymentRequest(data.requestId, chatId);
            const payload = res?.data ?? res;
            if (payload?.success) {
                setStatus('cancelled');
                setStep('idle');
                toast({ title: 'Request declined' });
            } else {
                toast({ title: 'Could not decline', description: payload?.message, variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Could not decline', description: err?.response?.data?.message, variant: 'destructive' });
        } finally {
            setIsDeclining(false);
        }
    };

    const onCancel = () => { setStep('idle'); setPin(''); };

    // ── Card shell classes ─────────────────────────────────────────────────────
    const shell = `
        w-[260px] rounded-2xl overflow-hidden shadow-sm border
        ${isPaid
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
            : isCancelled
                ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700'
                : isMe
                    ? 'bg-white dark:bg-darkBg-card border-brand-green/20 dark:border-brand-gold/20'
                    : 'bg-white dark:bg-darkBg-card border-gray-100 dark:border-darkBorder-light'
        }
    `.trim();

    // ── Top accent strip color ─────────────────────────────────────────────────
    const stripColor = isPaid
        ? 'bg-green-500'
        : isCancelled
            ? 'bg-gray-400'
            : 'bg-brand-green dark:bg-brand-gold';

    return (
        <div className={shell}>
            {/* Accent strip */}
            <div className={`h-1 w-full ${stripColor}`} />

            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-1.5">
                    <CircleDollarSign className={`w-3.5 h-3.5 ${isPaid ? 'text-green-600' : isCancelled ? 'text-gray-400' : 'text-brand-green dark:text-brand-gold'}`} />
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Money Request
                    </span>
                </div>
                {statusPill()}
            </div>

            {/* Amount */}
            <div className="px-3 py-2 text-center">
                <p className={`text-2xl font-bold tracking-tight ${isPaid ? 'text-green-600 dark:text-green-400' : isCancelled ? 'text-gray-400' : 'text-brand-green dark:text-brand-gold'}`}>
                    {fmt(data.amount, data.currency)}
                </p>
                {data.allowEditAmount && isPending && (
                    <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        <Pencil className="w-2.5 h-2.5" /> Amount negotiable
                    </span>
                )}
            </div>

            {/* From → To */}
            {(data.senderName || data.recipientName) && (
                <div className="flex items-center gap-1 px-3 pb-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase">From</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{data.senderName || 'Sender'}</p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase">To</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{data.recipientName || 'Recipient'}</p>
                    </div>
                </div>
            )}

            {/* Note */}
            {data.note && (
                <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400">
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 italic line-clamp-2">"{data.note}"</p>
                </div>
            )}

            {/* ── Action area (recipient + pending only) ── */}
            {canAct && (
                <div className="px-3 pb-3 space-y-2">
                    <div className="h-px bg-gray-100 dark:bg-darkBorder-light" />

                    {/* Idle: show Decline + Accept */}
                    {step === 'idle' && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onDecline}
                                disabled={isDeclining || isAccepting}
                                className="flex-1 h-8 text-xs"
                            >
                                {isDeclining ? <span className="animate-pulse">…</span> : <>
                                    <X className="w-3 h-3 mr-1" /> Decline
                                </>}
                            </Button>
                            <Button
                                size="sm"
                                onClick={onAcceptStart}
                                disabled={isDeclining}
                                className="flex-1 h-8 text-xs bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white"
                            >
                                Pay Request
                            </Button>
                        </div>
                    )}

                    {/* Amount edit step (allowEditAmount only) */}
                    {step === 'amount' && (
                        <div className="space-y-2">
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Enter amount to pay</p>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">RWF</span>
                                <Input
                                    type="number"
                                    min={1}
                                    value={customAmount}
                                    onChange={e => setCustomAmount(e.target.value)}
                                    className="pl-9 h-8 text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={onCancel} className="flex-1 h-8 text-xs">Cancel</Button>
                                <Button
                                    size="sm"
                                    onClick={onNextFromAmount}
                                    className="flex-1 h-8 text-xs bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* PIN step */}
                    {step === 'pin' && (
                        <div className="space-y-2">
                            {data.allowEditAmount && (
                                <p className="text-[11px] text-center text-gray-500">
                                    Paying <span className="font-bold text-brand-green dark:text-brand-gold">{fmt(Number(customAmount), data.currency)}</span>
                                </p>
                            )}
                            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light">
                                <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="4-digit PIN"
                                    value={pin}
                                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="border-0 bg-transparent p-0 h-auto text-center text-base tracking-widest focus-visible:ring-0 focus-visible:ring-offset-0"
                                    autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter' && pin.length === 4) onConfirmPay(); }}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={onCancel} disabled={isAccepting} className="flex-1 h-8 text-xs">Cancel</Button>
                                <Button
                                    size="sm"
                                    onClick={onConfirmPay}
                                    disabled={isAccepting || pin.length !== 4}
                                    className="flex-1 h-8 text-xs bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white"
                                >
                                    {isAccepting ? <span className="animate-pulse">Paying…</span> : 'Confirm'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Timestamp */}
            <p className="text-[10px] text-gray-300 dark:text-gray-600 text-right px-3 pb-2">
                {fmtTime(data.timestamp)}
            </p>
        </div>
    );
}

// ─── Money Transfer Card ───────────────────────────────────────────────────────

function MoneyTransferCard({ data, isMe }: { data: MoneyTransferData; isMe: boolean }) {
    const [downloadReceipt, { isLoading }] = useDownloadTransactionReceiptMutation();
    const isGroupDonation = data.type === 'group_donation';

    const handleDownload = async () => {
        try {
            const result = await downloadReceipt({ transactionId: data.transactionId }).unwrap();
            const blob = result as Blob;
            if (blob.size === 0) { alert('Received empty file'); return; }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.receiptFileName || `receipt_${data.referenceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            alert(err?.status === 401 ? 'Authentication failed.' : 'Failed to download receipt.');
        }
    };

    const accentColor = isGroupDonation
        ? 'bg-blue-500'
        : 'bg-brand-green dark:bg-brand-gold';

    const shell = `
        w-[260px] rounded-2xl overflow-hidden shadow-sm border
        ${isGroupDonation
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30'
            : isMe
                ? 'bg-white dark:bg-darkBg-card border-brand-green/20 dark:border-brand-gold/20'
                : 'bg-white dark:bg-darkBg-card border-gray-100 dark:border-darkBorder-light'
        }
    `.trim();

    return (
        <div className={shell}>
            {/* Accent strip */}
            <div className={`h-1 w-full ${accentColor}`} />

            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-1.5">
                    {isGroupDonation
                        ? <Heart className="w-3.5 h-3.5 text-blue-500 fill-current" />
                        : <CircleDollarSign className="w-3.5 h-3.5 text-brand-green dark:text-brand-gold" />
                    }
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {isGroupDonation ? 'Donation' : 'Money Sent'}
                    </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                    <CheckCircle className="w-2.5 h-2.5" /> Completed
                </span>
            </div>

            {/* Group badge */}
            {isGroupDonation && data.groupName && (
                <div className="mx-3 mb-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-100/60 dark:bg-blue-900/30">
                    <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">{data.groupName}</p>
                </div>
            )}

            {/* Amount */}
            <div className="px-3 py-2 text-center">
                <p className={`text-2xl font-bold tracking-tight ${isGroupDonation ? 'text-blue-600 dark:text-blue-300' : 'text-brand-green dark:text-brand-gold'}`}>
                    {fmt(data.amount, data.currency)}
                </p>
            </div>

            {/* From → To */}
            <div className="flex items-center gap-1 px-3 pb-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase">From</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{data.senderName}</p>
                </div>
                <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase">To</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{data.recipientName}</p>
                </div>
            </div>

            {/* Note */}
            {data.note && (
                <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400">
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 italic line-clamp-2">"{data.note}"</p>
                </div>
            )}

            {/* Ref + Download */}
            <div className="px-3 pb-3 space-y-2">
                <div className="h-px bg-gray-100 dark:bg-darkBorder-light" />
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono truncate max-w-[140px]">{data.referenceId}</span>
                    <span className="text-[10px] text-gray-400">{fmtTime(data.timestamp)}</span>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    disabled={isLoading}
                    className={`w-full h-8 text-xs ${isGroupDonation
                        ? 'border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400'
                        : 'border-brand-green/30 text-brand-green hover:bg-brand-green/5 dark:border-brand-gold/30 dark:text-brand-gold'
                    }`}
                >
                    <Download className="w-3 h-3 mr-1.5" />
                    {isLoading ? 'Downloading…' : 'Download Receipt'}
                </Button>
            </div>
        </div>
    );
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export const MoneyMessageCard: React.FC<MoneyMessageCardProps> = ({ data, isMe, chatId }) => {
    if (data.type === 'money_request') {
        return <MoneyRequestCard data={data as MoneyRequestData} isMe={isMe} chatId={chatId} />;
    }
    return <MoneyTransferCard data={data as MoneyTransferData} isMe={isMe} />;
};
