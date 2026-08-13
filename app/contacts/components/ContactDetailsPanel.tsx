import React, { useState, useEffect, useRef } from "react";
import { Contact, useToggleContactFavoriteMutation } from "@/states/contactSlice";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Send, Archive, Star, ArrowUpRight, ArrowDownLeft, Edit, MessageCircle, User, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getContactTransactionStats, getTransactionHistory } from "@/helpers/api";
import { useUserInfo } from "@/hooks/use-user-info";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useToast } from "@/hooks/use-toast";
import { ManageTagsDialog } from "./ManageTagsDialog";

interface ContactDetailsPanelProps {
    contact: Contact | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ContactDetailsPanel({ contact, isOpen, onClose }: ContactDetailsPanelProps) {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const { userId } = useUserInfo();
    const authHook = useAuthToken();
    const token = authHook.getToken();
    const router = useRouter();
    const { toast } = useToast();
    const [stats, setStats] = useState<{ totalSent: number; totalReceived: number }>({
        totalSent: 0,
        totalReceived: 0
    });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [toggleFavorite] = useToggleContactFavoriteMutation();
    const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);

    useEffect(() => {
        if (contact && userId && isOpen) {
            // Fetch stats
            getContactTransactionStats(userId as string, contact.otherUser.id)
                .then((data) => {
                    if (data && data.success) {
                        setStats(data.data);
                    }
                })
                .catch(err => console.error("Failed to fetch contact stats", err));

            // Fetch history
            getTransactionHistory(userId as string, { contactId: contact.otherUser.id, limit: 5 })
                .then((data) => {
                    if (data && data.success) {
                        setTransactions(data.data.transactions);
                    }
                })
                .catch(err => console.error("Failed to fetch contact history", err));
        }
    }, [contact, userId, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (panelRef.current && target && !panelRef.current.contains(target)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isOpen, onClose]);

    if (!contact) return null;

    const handleSend = () => {
        // Save recipient to session storage as expected by the transfer flow
        const recipient = {
            id: contact.otherUser.id,
            name: `${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
            phone: contact.otherUser.phone,
            avatar: contact.otherUser.profile?.profileImage || "",
            type: 'user'
        };
        sessionStorage.setItem('selectedRecipient', JSON.stringify(recipient));
        router.push('/home/transfer/amount');
    };

    const handleRequest = () => {
        const recipientId = encodeURIComponent(contact.otherUser.id);
        const recipientName = encodeURIComponent(`${contact.otherUser.firstName} ${contact.otherUser.lastName}`.trim());
        const recipientAvatar = encodeURIComponent(contact.otherUser.profile?.profileImage || "");
        router.push(`/home/request?recipientId=${recipientId}&recipientName=${recipientName}&recipientAvatar=${recipientAvatar}`);
    };

    const handleMessage = () => {
        router.push('/chat');
    };

    const handleViewProfile = () => {
        router.push(`/profile/${contact.otherUser.id}`);
    };

    const handleOpenTransaction = (transactionId: string) => {
        onClose();
        router.push(`/transactions?transactionId=${transactionId}`);
    };

    const handleToggleFavorite = async () => {
        try {
            await toggleFavorite({ contactId: contact.id, token: token || "" }).unwrap();
            toast({
                title: "Success",
                description: contact.isFavorite ? "Removed from favorites" : "Added to favorites",
            });
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            toast({
                title: "Error",
                description: "Failed to update favorite status",
                variant: "destructive",
            });
        }
    };

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close contact details"
                    className="fixed inset-0 z-[100] bg-black/30"
                    onClick={onClose}
                />
            )}
            <div
                ref={panelRef}
                className={cn(
                    "fixed inset-y-0 right-0 w-96 max-w-[95vw] bg-white dark:bg-darkBg-card shadow-2xl transform transition-transform duration-300 ease-in-out z-[110] border-l border-gray-200 dark:border-darkBorder-light",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-darkBorder-light">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Details</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-darkBg-hover rounded-full">
                            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </Button>
                    </div>

                    {/* Profile Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-darkBg-card">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="relative mb-4">
                                <button
                                    type="button"
                                    onClick={handleViewProfile}
                                    aria-label={`Open ${contact.otherUser.firstName} ${contact.otherUser.lastName} profile`}
                                >
                                    <UserAvatar
                                        profileImage={contact.otherUser.profile?.profileImage}
                                        firstName={contact.otherUser.firstName}
                                        lastName={contact.otherUser.lastName}
                                        className="h-24 w-24 ring-4 ring-gray-50 dark:ring-darkBg-main bg-white dark:bg-darkBg-secondary"
                                    />
                                </button>
                                <button
                                    onClick={handleToggleFavorite}
                                    className="absolute bottom-0 right-0 bg-white dark:bg-darkBg-card rounded-full p-1.5 shadow-sm border border-gray-100 dark:border-darkBorder-light hover:bg-gray-50 dark:hover:bg-darkBg-hover transition-colors"
                                    title={contact.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                    <Star className={cn("h-4 w-4", contact.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-400 dark:text-gray-500")} />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {contact.otherUser.firstName} {contact.otherUser.lastName}
                            </h3>

                            <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
                                <Badge variant={contact.status === 'active' ? 'default' : 'destructive'} className="uppercase tracking-wider text-[10px]">
                                    {contact.status}
                                </Badge>
                                {contact.tags?.map(tag => (
                                    <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-200 border border-transparent dark:border-darkBorder-light/60">
                                        {tag}
                                    </Badge>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsManageTagsOpen(true)}
                                    className="h-5 w-5 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-darkBg-hover"
                                    title="Manage tags"
                                >
                                    <Edit className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 w-full mb-8">
                                <Button
                                    onClick={handleRequest}
                                    variant="outline"
                                    className="w-full bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-none gap-1 px-2"
                                >
                                    <DollarSign className="h-4 w-4" />
                                    Request
                                </Button>
                                <Button
                                    onClick={handleSend}
                                    className="w-full bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main gap-1 shadow-sm px-2"
                                >
                                    <Send className="h-4 w-4" />
                                    Send
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleViewProfile}
                                    className="w-full gap-1 px-2"
                                >
                                    <User className="h-4 w-4" />
                                    Profile
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Information</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-darkBorder-light">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Friends since</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Stats */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Financial Overview</h4>
                                <div className="bg-gray-50 dark:bg-darkBg-main rounded-lg p-4 border border-gray-100 dark:border-darkBorder-light mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Sent</span>
                                        <span className="font-semibold text-gray-900 dark:text-white font-mono">
                                            RWF {stats.totalSent.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Received</span>
                                        <span className="font-semibold text-gray-900 dark:text-white font-mono">
                                            RWF {stats.totalReceived.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction History */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent Transactions</h4>
                                <div className="space-y-3">
                                    {transactions.length > 0 ? (
                                        transactions.map((txn: any) => (
                                            <button
                                                type="button"
                                                key={txn.id}
                                                onClick={() => handleOpenTransaction(txn.id)}
                                                className="w-full text-left flex items-center justify-between p-3 bg-gray-50 dark:bg-darkBg-main rounded-lg border border-gray-100 dark:border-darkBorder-light hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "p-2 rounded-full",
                                                        txn.senderWallet?.userId === userId
                                                            ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                                            : "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                                    )}>
                                                        {txn.senderWallet?.userId === userId ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {txn.description || (txn.senderWallet?.userId === userId ? 'Sent' : 'Received')}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {format(new Date(txn.createdAt), 'MMM d, h:mm a')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-semibold font-mono",
                                                    txn.senderWallet?.userId === userId
                                                        ? "text-gray-900 dark:text-white"
                                                        : "text-brand-green dark:text-brand-gold"
                                                )}>
                                                    {txn.senderWallet?.userId === userId ? '-' : '+'}RWF {parseFloat(txn.amount).toLocaleString()}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                            No transactions found.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-card">
                        <Button variant="ghost" className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 justify-start px-4">
                            <Archive className="h-4 w-4 mr-3" />
                            Archive / Block Contact
                        </Button>
                    </div>
                </div>
            </div>

            <ManageTagsDialog
                contact={contact}
                open={isManageTagsOpen}
                onOpenChange={setIsManageTagsOpen}
            />
        </>
    );
}
