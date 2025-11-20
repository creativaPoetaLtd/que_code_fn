"use client";

import React from "react";
import { Download, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDownloadTransactionReceiptMutation } from "@/states/chatSlice";

interface MoneyTransferData {
    type: 'money_transfer';
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
}

interface MoneyMessageCardProps {
    data: MoneyTransferData;
    isMe: boolean;
}

export const MoneyMessageCard: React.FC<MoneyMessageCardProps> = ({ data, isMe }) => {
    const [downloadReceipt, { isLoading }] = useDownloadTransactionReceiptMutation();

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDownloadReceipt = async () => {
        try {
            const result = await downloadReceipt({
                transactionId: data.transactionId
            }).unwrap();

            const blob = result as Blob;

            if (blob.size === 0) {
                alert('Received empty receipt file');
                return;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.receiptFileName || `receipt_${data.referenceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            if (error?.status === 401 || error?.status === 403) {
                alert('Authentication failed. Please log in again.');
            } else {
                alert('Failed to download receipt. Please try again.');
            }
        }
    };

    return (
        <Card className={`max-w-md ${isMe ? 'ml-auto bg-blue-50 border-blue-200' : 'mr-auto bg-white'}`}>
            <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                {data.currency === 'USD' ? 'USD' : data.currency}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Money Transfer</p>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                            </Badge>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Amount Section */}
                <div className="text-center py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Amount Transferred</p>
                    <p className="text-3xl font-bold text-green-600">
                        {data.currency} {formatAmount(data.amount, data.currency)}
                    </p>
                </div>

                {/* Transaction Details */}
                <div className="space-y-2 text-sm">
                    {/* From/To */}
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">From</p>
                            <p className="font-semibold text-gray-700 truncate">{data.senderName}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">To</p>
                            <p className="font-semibold text-gray-700 truncate">{data.recipientName}</p>
                        </div>
                    </div>

                    {/* Reference Number */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Reference</span>
                        <span className="font-mono text-xs font-semibold text-gray-800">{data.referenceId}</span>
                    </div>

                    {/* Transaction ID */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Transaction ID</span>
                        <span className="font-mono text-xs text-gray-500 truncate max-w-[180px]" title={data.transactionId}>
                            {data.transactionId.substring(0, 16)}...
                        </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Date & Time</span>
                        <span className="text-xs text-gray-700">{formatDate(data.timestamp)}</span>
                    </div>

                    {/* Note */}
                    {data.note && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Note</p>
                                <p className="text-sm text-gray-700 italic bg-amber-50 p-2 rounded border-l-2 border-amber-400">
                                    &quot;{data.note}&quot;
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <Separator />

                {/* Download Receipt Button */}
                <Button
                    onClick={handleDownloadReceipt}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 font-semibold disabled:opacity-50"
                >
                    <Download className="w-4 h-4 mr-2" />
                    {isLoading ? 'Downloading...' : 'Download Receipt (PDF)'}
                </Button>

                {/* Footer */}
                <p className="text-xs text-center text-gray-400 pt-1">
                    This is an official payment confirmation
                </p>
            </CardContent>
        </Card>
    );
};
