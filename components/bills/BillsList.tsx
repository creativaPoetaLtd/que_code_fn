"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Receipt, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useGetMyBillsQuery } from "@/states/billSlice"
import { useAccent } from "@/hooks/use-accent"
import socketService from "@/services/socketService"

interface BillSummary {
    id: string
    title: string
    status: "open" | "completed" | "cancelled"
    currency: string
    totalAmount: number
    paidInAmount: number
    recipient: { id: string; name: string; type: string } | null
    organizer: { id: string; name: string }
    role: "organizer" | "payer"
    sharesCount: number
    myShare: { id: string; amount: number; status: string } | null
    createdAt: string
}

type Filter = "all" | "organized" | "owe"

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 })

const BILL_STATUS: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
    completed: { label: "Settled", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 dark:bg-darkBg-interactive dark:text-gray-300" },
}

const SHARE_LABEL: Record<string, string> = {
    pending: "waiting for you",
    declined: "declined",
    paid: "paid",
    covered: "covered",
    closed: "settled outside the app",
    cancelled: "cancelled",
}

export default function BillsList() {
    const router = useRouter()
    const { data, isLoading, refetch } = useGetMyBillsQuery(undefined)
    const [filter, setFilter] = useState<Filter>("all")
    const accent = useAccent()

    useEffect(() => {
        const onUpdate = () => refetch()
        socketService.onBillUpdated(onUpdate)
        return () => socketService.offBillUpdated(onUpdate)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const bills: BillSummary[] = data?.data ?? []
    const visible = bills.filter((b) => {
        if (filter === "organized") return b.role === "organizer"
        if (filter === "owe") {
            return b.status === "open" && !!b.myShare && (b.myShare.status === "pending" || b.myShare.status === "declined")
        }
        return true
    })

    const filters: { key: Filter; label: string }[] = [
        { key: "all", label: "All" },
        { key: "organized", label: "I organized" },
        { key: "owe", label: "I owe" },
    ]

    return (
        <>
            <div className="mb-6 flex items-center gap-3">
                <div className={`p-2 ${accent.lightIconBg} rounded-lg ${accent.lightIconColor}`}>
                    <Receipt size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Split payments</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Start one from Send Money by turning on &quot;Split this payment&quot;.
                    </p>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                {filters.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                            filter === f.key
                                ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                                : "bg-gray-100 dark:bg-darkBg-card text-gray-600 dark:text-gray-300 border border-transparent dark:border-darkBorder-light"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            ) : visible.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-darkBg-card rounded-xl border border-dashed border-gray-200 dark:border-darkBorder-light">
                    <Receipt size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Nothing here yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map((b) => {
                        const pct = b.totalAmount > 0 ? Math.min(100, (b.paidInAmount / b.totalAmount) * 100) : 0
                        const status = BILL_STATUS[b.status]
                        return (
                            <Card
                                key={b.id}
                                onClick={() => router.push(`/home/bills/${b.id}`)}
                                className="p-4 cursor-pointer hover:shadow-md transition-all border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card dark:hover:bg-darkBg-interactive"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{b.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            To {b.recipient?.name ?? "recipient"} · {b.role === "organizer" ? "you organized" : `by ${b.organizer.name}`}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.className}`}>
                                        {status.label}
                                    </span>
                                </div>
                                <Progress value={pct} className="h-1.5 mb-1.5 dark:bg-darkBg-interactive" />
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>
                                        {fmt(b.paidInAmount)} of {fmt(b.totalAmount)} {b.currency} paid
                                    </span>
                                    {b.myShare && (
                                        <span className="font-medium">
                                            Your share {fmt(b.myShare.amount)} · {SHARE_LABEL[b.myShare.status] || b.myShare.status}
                                        </span>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </>
    )
}
