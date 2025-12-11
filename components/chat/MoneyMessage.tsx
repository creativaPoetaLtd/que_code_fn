import React from 'react';
import { extractMoneyTransferData } from '@/utils/messageUtils';
import { DollarSign, Download, Heart, TrendingUp } from 'lucide-react';

interface MoneyMessageProps {
    content: string;
    isMe: boolean;
}

export const MoneyMessage: React.FC<MoneyMessageProps> = ({ content, isMe }) => {
    const data = extractMoneyTransferData(content);

    if (!data) {
        return <div className="text-sm">Money transfer</div>;
    }

    const isGroupDonation = data.type === 'group_donation';
    const iconColor = isGroupDonation ? 'text-blue-700' : (isMe ? 'text-green-700' : 'text-blue-700');
    const bgColor = isGroupDonation ? 'bg-blue-50' : (isMe ? 'bg-green-100' : 'bg-blue-50');
    const borderColor = isGroupDonation ? 'border-blue-200' : (isMe ? 'border-green-200' : 'border-blue-200');
    const iconBg = isGroupDonation ? 'bg-blue-200' : (isMe ? 'bg-green-200' : 'bg-blue-200');
    const linkColor = isGroupDonation ? 'text-blue-700 hover:text-blue-800' : (isMe ? 'text-green-700 hover:text-green-800' : 'text-blue-700 hover:text-blue-800');

    return (
        <div className={`rounded-lg p-4 ${bgColor} border ${borderColor} max-w-md`}>
            <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${iconBg}`}>
                    {isGroupDonation ? (
                        <Heart className={`w-5 h-5 ${iconColor} fill-current`} />
                    ) : (
                        <DollarSign className={`w-5 h-5 ${iconColor}`} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">
                            {isGroupDonation ? 'Group Donation' : 'Money Transfer'}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                            {new Intl.NumberFormat('en-RW', { 
                                style: 'currency', 
                                currency: data.currency,
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(data.amount)}
                        </span>
                    </div>

                    {isGroupDonation && data.groupName && (
                        <div className="mb-2 px-2 py-1 bg-blue-100 rounded-md inline-block">
                            <div className="flex items-center gap-1 text-xs font-medium text-blue-900">
                                <TrendingUp size={12} />
                                <span>{data.groupName}</span>
                            </div>
                        </div>
                    )}

                    {data.note && (
                        <p className="text-sm text-gray-700 mb-2 italic">
                            "{data.note}"
                        </p>
                    )}

                    <div className="text-xs text-gray-600 space-y-1 mt-2">
                        {data.senderName && (
                            <div className="flex items-start">
                                <span className="text-gray-500 min-w-[50px]">From:</span>
                                <span className="font-medium flex-1">{data.senderName}</span>
                            </div>
                        )}
                        {data.recipientName && (
                            <div className="flex items-start">
                                <span className="text-gray-500 min-w-[50px]">{isGroupDonation ? 'To:' : 'To:'}</span>
                                <span className="font-medium flex-1">{data.recipientName}</span>
                            </div>
                        )}
                        {data.transactionId && (
                            <div className="flex items-start">
                                <span className="text-gray-500 min-w-[50px]">ID:</span>
                                <span className="font-mono text-[10px] flex-1 break-all">
                                    {data.transactionId.substring(0, 16)}...
                                </span>
                            </div>
                        )}
                    </div>

                    {data.receiptUrl && (
                        <a
                            href={data.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className={`mt-3 inline-flex items-center space-x-2 text-sm font-medium ${linkColor} transition-colors`}
                        >
                            <Download className="w-4 h-4" />
                            <span>Download Receipt</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};
