import React from "react";
import { Transaction } from "@/types/dashboard";
import { X, CheckCircle, Clock, AlertCircle, Share2, Download, RefreshCcw, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { format } from "date-fns";

interface TransactionDetailsModalProps {
    transaction: Transaction;
    currentUserId: string | null;
    onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
    transaction,
    currentUserId,
    onClose,
}) => {
    const router = useRouter();
    if (!transaction) return null;

    const isOutgoing = transaction.senderWallet?.userId === currentUserId;
    const amount = Number(transaction.amount) || 0;

    // Get recipient/sender name
    let counterpartyName = "Transaction";
    let isToOrganization = false;
    let counterpartyProfileImage: string | undefined = undefined;

    if (isOutgoing) {
        if (transaction.receiverWallet?.organization?.name) {
            counterpartyName = transaction.receiverWallet.organization.name;
            isToOrganization = true;
            counterpartyProfileImage = transaction.receiverWallet.organization.profile?.profileImage;
        } else if (transaction.receiverWallet?.user?.firstName || transaction.receiverWallet?.user?.lastName) {
            counterpartyName = `${transaction.receiverWallet.user.firstName || ""} ${transaction.receiverWallet.user.lastName || ""}`.trim();
            counterpartyProfileImage = transaction.receiverWallet.user.profile?.profileImage;
        } else if (transaction.description) {
            counterpartyName = transaction.description;
        } else {
            counterpartyName = "Money Sent";
        }
    } else {
        if (transaction.senderWallet?.organization?.name) {
            counterpartyName = transaction.senderWallet.organization.name;
            isToOrganization = true;
            counterpartyProfileImage = transaction.senderWallet.organization.profile?.profileImage;
        } else if (transaction.senderWallet?.user?.firstName || transaction.senderWallet?.user?.lastName) {
            counterpartyName = `${transaction.senderWallet.user.firstName || ""} ${transaction.senderWallet.user.lastName || ""}`.trim();
            counterpartyProfileImage = transaction.senderWallet.user.profile?.profileImage;
        } else if (transaction.description) {
            counterpartyName = transaction.description;
        } else {
            counterpartyName = "Money Received";
        }
    }

    const status = transaction.status || "completed";

    const getStatusIcon = () => {
        switch (status) {
            case "pending":
                return <Clock size={16} className="text-yellow-500" />;
            case "failed":
                return <AlertCircle size={16} className="text-red-500" />;
            default:
                return <CheckCircle size={16} className="text-brand-green dark:text-brand-gold" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case "pending":
                return "Pending";
            case "failed":
                return "Failed";
            default:
                return "Completed";
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a");
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="bg-white dark:bg-darkBg-main w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Close Button */}
                <div className="flex justify-end p-4">
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-gray-100 dark:bg-darkBg-card text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Amount & Status */}
                <div className="px-6 pb-6 text-center border-b border-gray-100 dark:border-darkBorder-light">
                    <div className="flex items-center justify-center gap-1.5 mb-3">
                        {getStatusIcon()}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {getStatusText()}
                        </span>
                    </div>

                    <h2
                        className={`text-4xl font-bold mb-2 ${isOutgoing ? "text-gray-900 dark:text-white" : "text-brand-green dark:text-brand-gold"
                            }`}
                    >
                        {isOutgoing ? "-" : "+"}RWF {amount.toLocaleString()}
                    </h2>
                </div>

                {/* Counterparty & Details */}
                <div className="p-6">
                    <div className="flex flex-col items-center mb-6">
                        <UserAvatar
                            profileImage={counterpartyProfileImage}
                            firstName={counterpartyName.split(" ")[0]}
                            lastName={counterpartyName.split(" ")[1] || ""}
                            className="w-16 h-16 mb-3 ring-4 ring-gray-50 dark:ring-darkBg-interactive"
                            userType={isToOrganization ? "organization" : "user"}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                            {isOutgoing ? "Sent to" : "Received from"}
                        </p>
                        <p className="text-lg font-bold text-[#00313A] dark:text-white text-center">
                            {counterpartyName}
                        </p>
                    </div>

                    {/* Details List */}
                    <div className="space-y-4 bg-gray-50 dark:bg-darkBg-interactive rounded-2xl p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(transaction.createdAt)}
                            </span>
                        </div>

                        {transaction.referenceId && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Reference ID</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white font-mono break-all text-right max-w-[60%]">
                                    {transaction.referenceId}
                                </span>
                            </div>
                        )}

                        {transaction.description && (
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-gray-500 dark:text-gray-400 min-w-16">Note</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white text-right break-words pl-4">
                                    "{transaction.description}"
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 pb-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                const counterpartyId = isOutgoing ? transaction.receiverWallet?.userId : transaction.senderWallet?.userId;
                                const recipientData = {
                                    id: counterpartyId,
                                    name: counterpartyName,
                                    phone: '',
                                    avatar: counterpartyProfileImage || '',
                                    type: isToOrganization ? 'organization' : 'user'
                                };
                                sessionStorage.setItem('selectedRecipient', JSON.stringify(recipientData));
                                sessionStorage.setItem('initialAmount', transaction.amount.toString());
                                router.push('/home/transfer/amount');
                                onClose();
                            }}
                            className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                        >
                            <RefreshCcw size={18} />
                            Resend
                        </button>
                        <button
                            onClick={() => {
                                const counterpartyId = isOutgoing ? transaction.receiverWallet?.userId : transaction.senderWallet?.userId;
                                router.push(`/chat?userId=${counterpartyId}`);
                                onClose();
                            }}
                            className="flex items-center justify-center gap-2 py-2.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl font-medium hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors"
                        >
                            <MessageCircle size={18} />
                            Chat
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'Transaction Receipt',
                                        text: `Transaction of RWF ${amount.toLocaleString()} ${isOutgoing ? 'to' : 'from'} ${counterpartyName}`,
                                        url: window.location.href
                                    }).catch(console.error);
                                } else {
                                    navigator.clipboard.writeText(`Transaction: RWF ${amount.toLocaleString()} | Ref: ${transaction.referenceId}`);
                                    alert('Transaction details copied to clipboard');
                                }
                            }}
                            className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-darkBg-interactive text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-darkBg-card transition-colors"
                        >
                            <Share2 size={18} />
                            Share
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-darkBg-interactive text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-darkBg-card transition-colors"
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 mt-2 bg-brand-green dark:bg-brand-gold text-white dark:text-[#00313A] rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
