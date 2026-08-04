"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useAccent } from "@/hooks/use-accent";
import { getScheduledBatchById, cancelScheduledBatch } from "@/helpers/api";
import { Header } from "@/components/Header";
import Navigation from "@/components/Navigation";
import { BackButton } from "@/components/shared/BackButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CalendarClock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ScheduledTransferRow {
    id: string;
    amount: number;
    currency: string;
    status: string;
    scheduledFor: string;
    receiverUser?: { id: string; firstName: string; lastName: string } | null;
    receiverOrganization?: { id: string; name: string } | null;
}

interface BatchDetail {
    id: string;
    status: "completed" | "partial" | "failed";
    recipientCount: number;
    successCount: number;
    failureCount: number;
    totalRequestedAmount: number;
    currency: string;
    createdAt: string;
    scheduledTransfers: ScheduledTransferRow[];
    failures: Array<{
        receiverUserId?: string | null;
        receiverOrganizationId?: string | null;
        receiverWalletId?: string | null;
        amount: number;
        reason: string;
    }>;
}

const statusStyles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    held: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    executing: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    paused: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    failed: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-darkBg-interactive dark:text-gray-300 dark:border-darkBorder-light",
};

const ScheduledBatchDetailPage = () => {
    const { isExpanded } = useSidebar();
    const accent = useAccent();
    const params = useParams();
    const batchId = params?.id as string;

    const [batch, setBatch] = useState<BatchDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);

    const loadBatch = async () => {
        setIsLoading(true);
        try {
            const res = await getScheduledBatchById(batchId);
            if (res.success) setBatch(res.data);
        } catch (error) {
            console.error("Failed to load scheduled batch:", error);
            toast({ title: "Error", description: "Failed to load scheduled batch", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (batchId) loadBatch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [batchId]);

    const handleCancelAll = async () => {
        setIsCancelling(true);
        try {
            const res = await cancelScheduledBatch(batchId);
            if (res.success) {
                toast({ title: "Cancelled", description: res.message });
                await loadBatch();
            } else {
                toast({ title: "Cancel failed", description: res.message, variant: "destructive" });
            }
        } catch (error: any) {
            toast({
                title: "Cancel failed",
                description: error?.response?.data?.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const canCancelAny = batch?.scheduledTransfers.some((st) =>
        ["scheduled", "held", "paused"].includes(st.status)
    );

    return (
        <div className={`flex min-h-screen bg-gray-50 ${accent.darkBgPage}`}>
            <Navigation />
            <div className={cn("flex-1 transition-all duration-300", isExpanded ? "lg:ml-64" : "lg:ml-20")}>
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <Header />
                </div>

                <div className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-6">
                            <BackButton className="mb-4" />
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${accent.lightIconBg} rounded-lg ${accent.lightIconColor}`}>
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Batch</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                                        Multiple recipients, one schedule
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 bg-gray-200 dark:bg-darkBg-card animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : !batch ? (
                            <div className="text-center py-12 bg-white dark:bg-darkBg-card rounded-xl border border-dashed border-gray-200 dark:border-darkBorder-light">
                                <p className="text-gray-500 dark:text-gray-400">Scheduled batch not found</p>
                            </div>
                        ) : (
                            <>
                                <Card className="p-5 mb-6 border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] uppercase font-bold px-1.5 py-0", statusStyles[batch.status])}
                                                >
                                                    {batch.status}
                                                </Badge>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {batch.successCount} of {batch.recipientCount} scheduled
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                RWF {batch.totalRequestedAmount.toLocaleString()}
                                            </p>
                                        </div>
                                        {canCancelAny && (
                                            <Button
                                                variant="outline"
                                                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                disabled={isCancelling}
                                                onClick={handleCancelAll}
                                            >
                                                {isCancelling ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                                                Cancel all
                                            </Button>
                                        )}
                                    </div>
                                </Card>

                                <div className="space-y-2 mb-6">
                                    {batch.scheduledTransfers.map((st) => (
                                        <Card
                                            key={st.id}
                                            className="p-4 flex items-center justify-between gap-3 border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {st.receiverUser
                                                        ? `${st.receiverUser.firstName} ${st.receiverUser.lastName}`
                                                        : st.receiverOrganization?.name || "Recipient"}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <CalendarClock size={11} /> {new Date(st.scheduledFor).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                    {st.amount.toLocaleString()} {st.currency}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] uppercase font-bold px-1.5 py-0", statusStyles[st.status])}
                                                >
                                                    {st.status}
                                                </Badge>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {batch.failures.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Could not be scheduled
                                        </h3>
                                        <div className="space-y-2">
                                            {batch.failures.map((f, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3 p-3.5 rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10"
                                                >
                                                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-red-600 dark:text-red-400">{f.reason}</p>
                                                    </div>
                                                    <span className="font-bold text-sm text-red-400 dark:text-red-400/70 line-through">
                                                        RWF {f.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduledBatchDetailPage;
