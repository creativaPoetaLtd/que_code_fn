"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Share2, Home, Download } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import { Header } from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SuccessPage = () => {
    const router = useRouter();
    const { isExpanded } = useSidebar();
    const [transferResult, setTransferResult] = useState<any>(null);
    const [recipient, setRecipient] = useState<any>(null);

    useEffect(() => {
        const storedResult = sessionStorage.getItem('transferResult');
        const storedRecipient = sessionStorage.getItem('selectedRecipient');

        if (storedResult) {
            try {
                setTransferResult(JSON.parse(storedResult));
                if (storedRecipient) setRecipient(JSON.parse(storedRecipient));
            } catch (error) {
                console.error('Error parsing data:', error);
                router.push('/home');
            }
        } else {
            router.push('/home');
        }
    }, [router]);

    if (!transferResult) {
        return (
            <div className="min-h-screen bg-white dark:bg-transparent flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    const data = transferResult.data;
    const amount = data.amount || 0;
    const transactionId = data.transactionId || "N/A";
    const sourceLabel = data.senderSubActionId ? 'Sub-Action Wallet' : 'Wallet';
    const destinationLabel = (data.receiverWalletId || data.resolvedReceiverWalletId) ? 'Wallet' : 'Account';
    const date = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    return (
        <div className="flex min-h-screen bg-white dark:bg-transparent">
            <Navigation hideBottomNav />

            <div className={cn(
                "flex-1 flex flex-col transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <Header />

                <main className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md w-full animate-fadeIn">
                        <div className="bg-white dark:bg-darkBg-card rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-darkBorder-light">

                            {/* Success Icon */}
                            <div className="flex justify-center mb-8">
                                <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center">
                                    <Check className="w-10 h-10 text-brand-green" strokeWidth={3} />
                                </div>
                            </div>

                            {/* Minimal Amount Display */}
                            <div className="text-center mb-12">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Sent Successfully</p>
                                <h1 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    RWF {amount.toLocaleString()}
                                </h1>
                            </div>

                            {/* Essential Details */}
                            <div className="space-y-6 mb-12 px-2">
                                <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-darkBorder-light">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={recipient?.avatar || "/Images/Profile.png"} />
                                            <AvatarFallback className="bg-gray-100 text-brand-green font-bold text-lg">
                                                {recipient?.name?.[0] || 'R'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Recipient</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {recipient?.name || 'User'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wider">Transaction ID</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono uppercase tracking-tight">
                                            {transactionId.substring(0, 10)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wider">Date</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {date}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mt-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wider">Source</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {sourceLabel}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wider">Destination</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {destinationLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => router.push('/home')}
                                    className="w-full h-14 bg-brand-green dark:bg-yellow-500 text-white font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Home className="w-5 h-5" />
                                    Return Home
                                </button>

                                <div className="flex gap-4">
                                    <button className="flex-1 h-12 bg-white dark:bg-darkBg-card border border-gray-100 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-all flex items-center justify-center gap-2 text-sm shadow-sm active:scale-95">
                                        <Download className="w-4 h-4" />
                                        Receipt
                                    </button>
                                    <button className="flex-1 h-12 bg-white dark:bg-darkBg-card border border-gray-100 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-all flex items-center justify-center gap-2 text-sm shadow-sm active:scale-95">
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SuccessPage;
