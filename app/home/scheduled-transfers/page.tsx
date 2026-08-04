"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSidebar } from "@/context/SidebarContext"
import { useAccent } from "@/hooks/use-accent"
import { useAuthToken } from "@/hooks/use-auth-token"
import { getUserIdFromToken } from "@/utils/jwtUtils"
import {
    getScheduledTransfers,
    cancelScheduledTransfer,
    pauseScheduledTransfer,
    resumeScheduledTransfer,
    skipNextScheduledOccurrence,
} from "@/helpers/api"
import { Header } from "@/components/Header"
import Navigation from "@/components/Navigation"
import { BackButton } from "@/components/shared/BackButton"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    CalendarClock,
    Repeat,
    Pause,
    Play,
    SkipForward,
    X,
    AlertTriangle,
    CheckCircle2,
    Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface ScheduledTransferItem {
    id: string
    amount: number
    currency: string
    status: "scheduled" | "held" | "executing" | "completed" | "failed" | "cancelled" | "paused"
    scheduledFor: string
    recurrenceRule: { frequency: string; interval: number; endDate?: string; maxOccurrences?: number } | null
    occurrenceCount: number
    lastFailureReason?: string | null
    createdByUserId: string
    scheduledBatchId?: string | null
    receiverUser?: { id: string; firstName: string; lastName: string } | null
    receiverOrganization?: { id: string; name: string } | null
    senderUser?: { id: string; firstName: string; lastName: string } | null
    senderOrganization?: { id: string; name: string } | null
}

const UPCOMING_STATUSES = "scheduled,held,executing,paused"
const HISTORY_STATUSES = "completed,failed,cancelled"

const statusStyles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    held: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    executing: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    paused: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    failed: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-darkBg-interactive dark:text-gray-300 dark:border-darkBorder-light",
}

const statusLabels: Record<string, string> = {
    scheduled: "Awaiting funds",
    held: "Funds reserved",
    executing: "Sending",
    paused: "Paused",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
}

const getPartyName = (item: ScheduledTransferItem, side: "sender" | "receiver"): string => {
    if (side === "sender") {
        if (item.senderUser) return `${item.senderUser.firstName} ${item.senderUser.lastName}`
        if (item.senderOrganization) return item.senderOrganization.name
        return "You"
    }
    if (item.receiverUser) return `${item.receiverUser.firstName} ${item.receiverUser.lastName}`
    if (item.receiverOrganization) return item.receiverOrganization.name
    return "Recipient"
}

const ScheduledTransfersPageInner = () => {
    const { isExpanded } = useSidebar()
    const accent = useAccent()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { getToken } = useAuthToken()

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [upcoming, setUpcoming] = useState<ScheduledTransferItem[]>([])
    const [history, setHistory] = useState<ScheduledTransferItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [upcomingRes, historyRes] = await Promise.all([
                getScheduledTransfers({ status: UPCOMING_STATUSES, direction: "all" }),
                getScheduledTransfers({ status: HISTORY_STATUSES, direction: "all" }),
            ])
            if (upcomingRes.success) setUpcoming(upcomingRes.data)
            if (historyRes.success) setHistory(historyRes.data)
        } catch (error) {
            console.error("Failed to load scheduled transfers:", error)
            toast({ title: "Error", description: "Failed to load scheduled transfers", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const token = getToken()
        if (token) setCurrentUserId(getUserIdFromToken(token))

        loadData()

        if (searchParams.get("created") === "1") {
            toast({ title: "Transfer scheduled", description: "Funds have been reserved for your scheduled transfer." })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const runAction = async (id: string, action: () => Promise<any>, successTitle: string) => {
        setProcessingId(id)
        try {
            const res = await action()
            if (res.success) {
                toast({ title: successTitle })
                await loadData()
            } else {
                toast({ title: "Action failed", description: res.message, variant: "destructive" })
            }
        } catch (error: any) {
            toast({
                title: "Action failed",
                description: error?.response?.data?.message || "Something went wrong",
                variant: "destructive",
            })
        } finally {
            setProcessingId(null)
        }
    }

    const ScheduleCard = ({ item }: { item: ScheduledTransferItem }) => {
        const isRecurring = !!item.recurrenceRule
        const isOwner = item.createdByUserId === currentUserId
        const canManage = isOwner && ["scheduled", "held", "paused"].includes(item.status)

        return (
            <Card className="p-4 mb-3 border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {isOwner ? `To ${getPartyName(item, "receiver")}` : `From ${getPartyName(item, "sender")}`}
                            </p>
                            <Badge
                                variant="outline"
                                className={cn("text-[10px] uppercase font-bold px-1.5 py-0", statusStyles[item.status])}
                            >
                                {statusLabels[item.status] || item.status}
                            </Badge>
                            {isRecurring && (
                                <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase font-bold px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1"
                                >
                                    <Repeat size={10} /> {item.recurrenceRule?.frequency}
                                </Badge>
                            )}
                            {item.scheduledBatchId && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/home/scheduled-transfers/batches/${item.scheduledBatchId}`)
                                    }}
                                    className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    <Users size={10} /> Part of batch
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <CalendarClock size={12} />
                            {new Date(item.scheduledFor).toLocaleString()}
                        </p>

                        {item.lastFailureReason && !["completed", "cancelled"].includes(item.status) && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                                <AlertTriangle size={11} /> {item.lastFailureReason}
                            </p>
                        )}

                        {isRecurring && item.occurrenceCount > 0 && (
                            <p className="text-[11px] text-gray-400 mt-1">{item.occurrenceCount} sent so far</p>
                        )}
                    </div>

                    <div className="text-right flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {item.amount.toLocaleString()} {item.currency}
                        </div>

                        {canManage && (
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {item.status === "paused" ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8"
                                        disabled={processingId === item.id}
                                        onClick={() => runAction(item.id, () => resumeScheduledTransfer(item.id), "Resumed")}
                                    >
                                        <Play size={13} className="mr-1" /> Resume
                                    </Button>
                                ) : (
                                    isRecurring && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8"
                                                disabled={processingId === item.id}
                                                onClick={() => runAction(item.id, () => pauseScheduledTransfer(item.id), "Paused")}
                                            >
                                                <Pause size={13} className="mr-1" /> Pause
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8"
                                                disabled={processingId === item.id}
                                                onClick={() =>
                                                    runAction(item.id, () => skipNextScheduledOccurrence(item.id), "Occurrence skipped")
                                                }
                                            >
                                                <SkipForward size={13} className="mr-1" /> Skip next
                                            </Button>
                                        </>
                                    )
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    disabled={processingId === item.id}
                                    onClick={() => runAction(item.id, () => cancelScheduledTransfer(item.id), "Cancelled")}
                                >
                                    <X size={13} className="mr-1" /> Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        )
    }

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
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 ${accent.lightIconBg} rounded-lg ${accent.lightIconColor}`}>
                                        <CalendarClock size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Transfers</h1>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                                            Money set to send later
                                        </p>
                                    </div>
                                </div>
                                <Button className={`${accent.solidDark} text-white`} onClick={() => router.push("/home/transfer")}>
                                    Schedule new
                                </Button>
                            </div>
                        </div>

                        <Tabs defaultValue="upcoming" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-darkBg-card p-1">
                                <TabsTrigger
                                    value="upcoming"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-interactive data-[state=active]:shadow-sm"
                                >
                                    Upcoming ({upcoming.length})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="history"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-interactive data-[state=active]:shadow-sm"
                                >
                                    History ({history.length})
                                </TabsTrigger>
                            </TabsList>

                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-24 bg-gray-200 dark:bg-darkBg-card animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <TabsContent value="upcoming" className="mt-0">
                                        {upcoming.length === 0 ? (
                                            <div className="text-center py-12 bg-white dark:bg-darkBg-card rounded-xl border border-dashed border-gray-200 dark:border-darkBorder-light">
                                                <CalendarClock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                                <p className="text-gray-500 dark:text-gray-400">No upcoming scheduled transfers</p>
                                            </div>
                                        ) : (
                                            upcoming.map((item) => <ScheduleCard key={item.id} item={item} />)
                                        )}
                                    </TabsContent>

                                    <TabsContent value="history" className="mt-0">
                                        {history.length === 0 ? (
                                            <div className="text-center py-12 bg-white dark:bg-darkBg-card rounded-xl border border-dashed border-gray-200 dark:border-darkBorder-light">
                                                <CheckCircle2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                                <p className="text-gray-500 dark:text-gray-400">No past scheduled transfers yet</p>
                                            </div>
                                        ) : (
                                            history.map((item) => <ScheduleCard key={item.id} item={item} />)
                                        )}
                                    </TabsContent>
                                </>
                            )}
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ScheduledTransfersPage() {
    return (
        <Suspense>
            <ScheduledTransfersPageInner />
        </Suspense>
    )
}
