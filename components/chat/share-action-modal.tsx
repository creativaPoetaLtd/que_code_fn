'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    Calendar,
    Check,
    Loader2,
    Search,
    Send,
    Share2,
    Ticket,
    TriangleAlert,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useUserInfo } from '@/hooks/use-user-info';
import {
    getOrganizationActions,
    getUserQrObjects,
    shareActionToChat,
    transferActionPurchase,
} from '@/helpers/api';
import type { Conversation } from '@/types/chat.types';

/** A ticket the signed-in user owns and can hand to someone else */
interface TransferableTicket {
    qrObjectId: string;
    purchaseId: string;
    actionId?: string;
    ownerId?: string;
    name: string;
    subActionName?: string;
    coverImage?: string;
    quantity?: number;
    validUntil?: string | null;
}

/** An action that can be shared as a card + link in the chat */
interface ShareableAction {
    actionId: string;
    ownerId?: string;
    name: string;
    actionType?: string;
    coverImage?: string;
    shortDescription?: string;
    price?: number;
    currency?: string;
    startsAt?: string | null;
    endsAt?: string | null;
}

type Mode = 'transfer' | 'share';

interface ShareActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation | null;
    /** 'transfer' hands a ticket over, 'share' posts an action card. Fixed by the caller. */
    mode: Mode;
}

const nameOf = (user: any) =>
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Unknown';

const fmtDate = (value?: string | null) =>
    value
        ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

/** Small square preview — falls back to a tinted icon when the action has no cover */
const Thumb: React.FC<{ src?: string; icon: React.ReactNode }> = ({ src, icon }) => (
    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-darkBg-interactive text-gray-400">
        {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : icon}
    </div>
);

export default function ShareActionModal({ isOpen, onClose, conversation, mode }: ShareActionModalProps) {
    const { userId: currentUserId, accountType } = useUserInfo();

    const isOrganization = accountType === 'organization';
    const isGroupChat = Boolean(conversation?.isGroup);
    // Ownership can only move to one person, so transfers are for direct chats between people
    const canTransfer = !isGroupChat && !isOrganization;
    // Asked to transfer where ownership cannot move — explain instead of showing an empty list
    const transferUnavailable = mode === 'transfer' && !canTransfer;

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [tickets, setTickets] = useState<TransferableTicket[]>([]);
    const [actions, setActions] = useState<ShareableAction[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const me = useMemo(
        () => conversation?.participants?.find(p => p.userId === currentUserId)?.user,
        [conversation, currentUserId]
    );
    const recipient = useMemo(
        () => conversation?.participants?.find(p => p.userId !== currentUserId),
        [conversation, currentUserId]
    );
    const recipientName = isGroupChat
        ? conversation?.name || 'this group'
        : recipient
            ? nameOf(recipient.user)
            : conversation?.name || 'them';

    const reset = useCallback(() => {
        setSearch('');
        setSelectedTicketId(null);
        setSelectedActionId(null);
        setNote('');
        setSubmitting(false);
    }, []);

    const handleClose = () => {
        if (submitting) return;
        reset();
        onClose();
    };

    // Load what this account can offer: an organization shares its published actions,
    // a person shares (or hands over) the tickets they hold.
    useEffect(() => {
        if (!isOpen || !currentUserId || transferUnavailable) return;

        let cancelled = false;
        setLoading(true);
        setLoadError(null);

        (async () => {
            try {
                if (isOrganization) {
                    const res = await getOrganizationActions(currentUserId, { status: 'published' });
                    const list = res.data?.data ?? res.data ?? [];
                    if (cancelled) return;
                    setTickets([]);
                    setActions(
                        (Array.isArray(list) ? list : []).map((a: any): ShareableAction => ({
                            actionId: a.id,
                            ownerId: a.organizationId || currentUserId,
                            name: a.name || 'Untitled action',
                            actionType: a.type,
                            coverImage: a.coverImage || undefined,
                            shortDescription: a.shortDescription || undefined,
                            price: a.pricing?.amount,
                            currency: a.currency,
                            startsAt: a.availability?.startsAt ?? null,
                            endsAt: a.availability?.endsAt ?? null,
                        }))
                    );
                    return;
                }

                const res = await getUserQrObjects(currentUserId);
                const list = Array.isArray(res.data?.data) ? res.data.data : [];
                if (cancelled) return;

                const owned: TransferableTicket[] = list
                    .filter((qr: any) => qr.status === 'valid' && qr.actionPurchaseId)
                    .map((qr: any) => ({
                        qrObjectId: qr.id,
                        purchaseId: qr.actionPurchaseId,
                        actionId: qr.actionId || qr.metadata?.actionId,
                        ownerId: qr.organizationId || qr.metadata?.organizationId,
                        name: qr.metadata?.actionName || 'Ticket',
                        subActionName: qr.metadata?.subActionName,
                        coverImage: qr.coverImage || qr.metadata?.coverImage,
                        quantity: qr.metadata?.quantity,
                        validUntil: qr.validUntil ?? null,
                    }));
                setTickets(owned);

                // The actions behind those tickets are what a person can point others to
                const seen = new Set<string>();
                setActions(
                    owned.reduce<ShareableAction[]>((acc, ticket) => {
                        if (!ticket.actionId || seen.has(ticket.actionId)) return acc;
                        seen.add(ticket.actionId);
                        acc.push({
                            actionId: ticket.actionId,
                            ownerId: ticket.ownerId,
                            name: ticket.name,
                            coverImage: ticket.coverImage,
                        });
                        return acc;
                    }, [])
                );
            } catch (err: any) {
                if (!cancelled) {
                    setLoadError(
                        err?.response?.data?.message || 'Could not load your actions. Please try again.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen, currentUserId, isOrganization, transferUnavailable]);

    const query = search.trim().toLowerCase();
    const visibleTickets = useMemo(
        () => (query ? tickets.filter(t => t.name.toLowerCase().includes(query)) : tickets),
        [tickets, query]
    );
    const visibleActions = useMemo(
        () => (query ? actions.filter(a => a.name.toLowerCase().includes(query)) : actions),
        [actions, query]
    );

    const selectedTicket = tickets.find(t => t.qrObjectId === selectedTicketId) || null;
    const selectedAction = actions.find(a => a.actionId === selectedActionId) || null;

    /** Hand a ticket over. The server posts the card so both sides see the same message. */
    const handleTransfer = async () => {
        if (!selectedTicket || !conversation?.id || !recipient || !currentUserId) return;

        setSubmitting(true);
        try {
            await transferActionPurchase(selectedTicket.purchaseId, recipient.userId, {
                chatId: conversation.id,
                note: note.trim() || undefined,
            });

            toast({
                title: 'Ticket sent',
                description: `"${selectedTicket.name}" now belongs to ${recipientName}.`,
            });
            reset();
            onClose();
        } catch (err: any) {
            toast({
                title: 'Transfer failed',
                description:
                    err?.response?.data?.message || err?.message || 'Could not transfer the ticket.',
                variant: 'destructive',
            });
            setSubmitting(false);
        }
    };

    /** Share an action as a card — nothing changes hands */
    const handleShare = async () => {
        if (!selectedAction || !conversation?.id || !currentUserId) return;

        setSubmitting(true);
        try {
            await shareActionToChat(
                selectedAction.actionId,
                conversation.id,
                note.trim() || undefined
            );

            toast({
                title: 'Action shared',
                description: `"${selectedAction.name}" was shared in this chat.`,
            });
            reset();
            onClose();
        } catch (err: any) {
            toast({
                title: 'Could not share',
                description: err?.response?.data?.message || err?.message || 'Please try again.',
                variant: 'destructive',
            });
            setSubmitting(false);
        }
    };

    const rowClass = (active: boolean) =>
        `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
            active
                ? 'border-brand-green dark:border-brand-gold bg-brand-green/5 dark:bg-brand-gold/5'
                : 'border-gray-100 dark:border-darkBorder-light hover:border-gray-300 dark:hover:border-gray-600'
        }`;

    const emptyList = (message: string) => (
        <div className="text-center py-8">
            <Ticket className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );

    const isTransfer = mode === 'transfer';
    const canSubmit = isTransfer ? Boolean(selectedTicket && recipient) : Boolean(selectedAction);

    return (
        <Dialog open={isOpen} onOpenChange={next => { if (!next) handleClose(); }}>
            <DialogContent className="bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-2xl w-[calc(100vw-2rem)] max-w-md p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <div className="flex items-center gap-2">
                        {isTransfer ? (
                            <Ticket className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                        ) : (
                            <Share2 className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                        )}
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                            {isTransfer ? 'Send a ticket' : 'Share an action'}
                        </p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                        {isTransfer
                            ? `Hand one of your tickets to ${recipientName}.`
                            : `Share an action ${recipientName} can open.`}
                    </p>
                </div>

                {transferUnavailable ? (
                    <div className="p-5 space-y-4">
                        <div className="rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 px-3 py-3 flex items-start gap-2">
                            <TriangleAlert className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                            <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                {isOrganization
                                    ? 'Organisation accounts cannot hand tickets over. Share an action instead.'
                                    : 'A ticket can only move to one person, so transfers work in direct chats. Share the action with the group instead.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                <div className="p-5 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={mode === 'transfer' ? 'Search your tickets...' : 'Search actions...'}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-brand-green dark:focus:border-brand-gold transition-colors"
                        />
                    </div>

                    {/* List */}
                    <div className="max-h-56 overflow-y-auto -mx-1 px-1 space-y-1.5">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                            </div>
                        ) : loadError ? (
                            <p className="text-center text-sm text-red-500 py-8">{loadError}</p>
                        ) : mode === 'transfer' ? (
                            visibleTickets.length === 0 ? (
                                emptyList(
                                    search
                                        ? 'No tickets match your search.'
                                        : 'You have no transferable tickets right now.'
                                )
                            ) : (
                                visibleTickets.map(ticket => {
                                    const active = selectedTicketId === ticket.qrObjectId;
                                    const validUntil = fmtDate(ticket.validUntil);
                                    return (
                                        <button
                                            key={ticket.qrObjectId}
                                            type="button"
                                            onClick={() => setSelectedTicketId(active ? null : ticket.qrObjectId)}
                                            className={rowClass(active)}
                                        >
                                            <Thumb src={ticket.coverImage} icon={<Ticket className="w-5 h-5" />} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                    {ticket.name}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {[
                                                        ticket.subActionName,
                                                        ticket.quantity ? `x${ticket.quantity}` : null,
                                                        validUntil ? `until ${validUntil}` : null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ') || 'Valid ticket'}
                                                </p>
                                            </div>
                                            {active && (
                                                <span className="w-5 h-5 rounded-full bg-brand-green dark:bg-brand-gold flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )
                        ) : visibleActions.length === 0 ? (
                            emptyList(
                                search
                                    ? 'No actions match your search.'
                                    : isOrganization
                                        ? 'You have no published actions to share yet.'
                                        : 'No actions to share yet — buy or save one first.'
                            )
                        ) : (
                            visibleActions.map(action => {
                                const active = selectedActionId === action.actionId;
                                const starts = fmtDate(action.startsAt);
                                return (
                                    <button
                                        key={action.actionId}
                                        type="button"
                                        onClick={() => setSelectedActionId(active ? null : action.actionId)}
                                        className={rowClass(active)}
                                    >
                                        <Thumb src={action.coverImage} icon={<Calendar className="w-5 h-5" />} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {action.name}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {[action.actionType, starts].filter(Boolean).join(' · ') ||
                                                    action.shortDescription ||
                                                    'Action'}
                                            </p>
                                        </div>
                                        {active && (
                                            <span className="w-5 h-5 rounded-full bg-brand-green dark:bg-brand-gold flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Optional note that travels with the card */}
                    {canSubmit && (
                        <input
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Add a note (optional)"
                            maxLength={120}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-brand-green dark:focus:border-brand-gold transition-colors"
                        />
                    )}

                    {/* What actually happens on send */}
                    {mode === 'transfer' && selectedTicket && (
                        <div className="rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 px-3 py-2.5 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                                <span className="truncate">{nameOf(me)}</span>
                                <ArrowRight className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <span className="truncate">{recipientName}</span>
                            </div>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                                <TriangleAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                Ownership moves immediately — only {recipientName} can send it back.
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-darkBg-interactive disabled:opacity-40 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={mode === 'transfer' ? handleTransfer : handleShare}
                            disabled={!canSubmit || submitting}
                            className="flex-1 py-2.5 rounded-xl bg-brand-green dark:bg-brand-gold hover:opacity-90 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {submitting
                                ? mode === 'transfer' ? 'Transferring...' : 'Sharing...'
                                : mode === 'transfer' ? 'Transfer & send' : 'Share in chat'}
                        </button>
                    </div>
                </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
