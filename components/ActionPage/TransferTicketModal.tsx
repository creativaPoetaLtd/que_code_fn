'use client';

import React, { useMemo, useState } from 'react';
import { Check, Loader2, Search, Send, UserRound, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useGetAcceptedContactsQuery } from '@/states/contactSlice';
import { transferActionPurchase } from '@/helpers/api';
import { toast } from '@/hooks/use-toast';

interface TransferTicketModalProps {
    open: boolean;
    onClose: () => void;
    /** The purchase to transfer (from the QR object's actionPurchaseId) */
    purchaseId: string;
    ticketName: string;
    senderId: string;
    onTransferred: () => void;
}

interface ContactUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile?: { profileImage?: string };
}

const fullName = (u: ContactUser) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
const initials = (u: ContactUser) =>
    `${(u.firstName || u.email || '?')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase();

const TransferTicketModal: React.FC<TransferTicketModalProps> = ({
    open,
    onClose,
    purchaseId,
    ticketName,
    senderId,
    onTransferred,
}) => {
    const { getToken } = useAuthToken();
    const token = getToken();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<ContactUser | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { data, isLoading, error } = useGetAcceptedContactsQuery(token as string, {
        skip: !token || !open,
    });

    const contacts: ContactUser[] = useMemo(() => {
        const list = (data?.contacts || [])
            .map((c: any) => c.otherUser)
            .filter((u: ContactUser | undefined): u is ContactUser => Boolean(u?.id));
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(
            (u) => fullName(u).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
        );
    }, [data, search]);

    const handleClose = () => {
        setSearch('');
        setSelected(null);
        setSubmitting(false);
        onClose();
    };

    const handleTransfer = async () => {
        if (!selected) return;
        try {
            setSubmitting(true);
            await transferActionPurchase(purchaseId, selected.id, senderId);
            toast({
                title: 'Ticket transferred',
                description: `"${ticketName}" is now owned by ${fullName(selected)}.`,
            });
            onTransferred();
            handleClose();
        } catch (err: any) {
            toast({
                title: 'Transfer failed',
                description: err?.response?.data?.message || err?.message || 'Could not transfer the ticket.',
                variant: 'destructive',
            });
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
            <DialogContent className="bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-2xl w-[calc(100vw-2rem)] max-w-md p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-[#00B512]" />
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Transfer ticket</p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                        Send <span className="font-semibold text-gray-700 dark:text-gray-200">{ticketName}</span> to a contact
                    </p>
                </div>

                <div className="p-5 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#00B512] transition-colors"
                        />
                    </div>

                    {/* Contact list */}
                    <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-1.5">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                            </div>
                        ) : error ? (
                            <p className="text-center text-sm text-red-500 py-8">Could not load your contacts.</p>
                        ) : contacts.length === 0 ? (
                            <div className="text-center py-8">
                                <UserRound className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {search ? 'No contacts match your search.' : 'You have no contacts to transfer to yet.'}
                                </p>
                            </div>
                        ) : (
                            contacts.map((u) => {
                                const isSelected = selected?.id === u.id;
                                return (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => setSelected(isSelected ? null : u)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                                            isSelected
                                                ? 'border-[#00B512] bg-[#00B512]/5'
                                                : 'border-gray-100 dark:border-darkBorder-light hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-darkBg-interactive overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {u.profile?.profileImage ? (
                                                <img src={u.profile.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-300">{initials(u)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fullName(u)}</p>
                                            {u.email && <p className="text-xs text-gray-400 truncate">{u.email}</p>}
                                        </div>
                                        {isSelected && (
                                            <span className="w-5 h-5 rounded-full bg-[#00B512] flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {selected && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg px-3 py-2">
                            Ownership moves immediately and cannot be undone — {fullName(selected)} will need to transfer it back.
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleTransfer}
                            disabled={!selected || submitting}
                            className="flex-1 py-2.5 rounded-xl bg-[#00B512] hover:bg-[#00a010] disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {submitting ? 'Transferring...' : 'Transfer'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TransferTicketModal;
