import React from 'react';
import { extractMoneyTransferData } from '@/utils/messageUtils';
import { DollarSign, Download } from 'lucide-react';

interface MoneyMessageProps {
    content: string;
    isMe: boolean;
}

export const MoneyMessage: React.FC<MoneyMessageProps> = ({ content, isMe }) => {
    const data = extractMoneyTransferData(content);

    if (!data) {
        return <div className="text-sm">Money transfer</div>;
    }

    return (
        <div className={`rounded-lg p-4 ${isMe ? 'bg-green-100' : 'bg-blue-50'} border ${isMe ? 'border-green-200' : 'border-blue-200'}`}>
            <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${isMe ? 'bg-green-200' : 'bg-blue-200'}`}>
                    <DollarSign className={`w-5 h-5 ${isMe ? 'text-green-700' : 'text-blue-700'}`} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">Money Transfer</span>
                        <span className="text-lg font-bold text-gray-900">
                            {data.currency} {data.amount.toLocaleString()}
                        </span>
                    </div>

                    {data.note && (
                        <p className="text-sm text-gray-600 mb-2">
                            {data.note}
                        </p>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                        {data.senderName && (
                            <div>From: <span className="font-medium">{data.senderName}</span></div>
                        )}
                        {data.recipientName && (
                            <div>To: <span className="font-medium">{data.recipientName}</span></div>
                        )}
                        {data.transactionId && (
                            <div className="font-mono">
                                ID: {data.transactionId.substring(0, 8)}...
                            </div>
                        )}
                    </div>

                    {data.receiptUrl && (
                        <a
                            href={data.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-3 inline-flex items-center space-x-2 text-sm font-medium ${isMe ? 'text-green-700 hover:text-green-800' : 'text-blue-700 hover:text-blue-800'
                                }`}
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
