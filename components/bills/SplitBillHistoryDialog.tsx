"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { X, Users, HandCoins } from "lucide-react"
import { format } from "date-fns"
import { CoveredShare, SplitBillGroup } from "@/types/dashboard"

interface SplitBillRow {
    splitBill?: SplitBillGroup
    coveredShare?: CoveredShare
    currency?: string
    createdAt: string
}

const fmt = (n: number) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const fmtDate = (value: string) => {
    try {
        return format(new Date(value), "MMM dd, yyyy 'at' hh:mm a")
    } catch {
        return value
    }
}

/** History rows that come from a split bill: the grouped payment or a covered share. */
export const isSplitBillRow = (tx: { splitBill?: unknown; coveredShare?: unknown }) => Boolean(tx.splitBill || tx.coveredShare)

/** Title, subtitle and signed amount for a split-bill history row, or null for any other row. */
export const splitBillRowInfo = (tx: SplitBillRow) => {
    if (tx.coveredShare) {
        const c = tx.coveredShare
        return {
            title: `Share covered by ${c.coveredByName || "someone"}`,
            subtitle: `Split · ${c.title}`,
            amount: c.amount,
            // Paid from someone else's wallet: no effect on this balance, so no +/-.
            sign: "" as const,
        }
    }
    if (tx.splitBill) {
        const g = tx.splitBill
        return {
            title: `Payment for ${g.title}`,
            subtitle: `Split · ${g.paymentsCount} ${g.paymentsCount === 1 ? "person" : "people"} paid`,
            amount: g.receivedAmount,
            sign: "+" as const,
        }
    }
    return null
}

interface SplitBillHistoryDialogProps {
    transaction: SplitBillRow
    onClose: () => void
}

export default function SplitBillHistoryDialog({ transaction, onClose }: SplitBillHistoryDialogProps) {
    const router = useRouter()
    const { splitBill, coveredShare } = transaction
    const currency = splitBill?.currency || transaction.currency || "RWF"

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div
                className="bg-white dark:bg-darkBg-main w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-end p-4">
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-gray-100 dark:bg-darkBg-card text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {splitBill && (
                    <>
                        <div className="px-6 pb-5 text-center border-b border-gray-100 dark:border-darkBorder-light">
                            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Payment for {splitBill.title}</p>
                            <p className="text-3xl font-bold text-brand-green dark:text-brand-gold mt-1">
                                +{currency} {fmt(splitBill.receivedAmount)}
                            </p>
                            {splitBill.receivedAmount < splitBill.totalAmount && splitBill.status === "open" && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    of {currency} {fmt(splitBill.totalAmount)} so far
                                </p>
                            )}
                        </div>
                        <div className="px-6 py-4 max-h-72 overflow-y-auto">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                Paid by {splitBill.paymentsCount} {splitBill.paymentsCount === 1 ? "person" : "people"}
                            </p>
                            <ul className="space-y-3">
                                {splitBill.payments.map((p) => (
                                    <li key={p.transactionId} className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {p.covered ? p.paidByName || "Someone" : p.payerName || "Someone"}
                                            </p>
                                            <p className="text-[11px] text-gray-400">
                                                {p.covered && p.payerName ? `Covering ${p.payerName} · ` : ""}
                                                {fmtDate(p.paidAt)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-green-600 dark:text-green-400 shrink-0">
                                            +{currency} {fmt(p.amount)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}

                {coveredShare && (
                    <div className="px-6 pb-6 text-center">
                        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 dark:bg-darkBg-card text-gray-600 dark:text-gray-300 flex items-center justify-center">
                            <HandCoins className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {coveredShare.coveredByName || "Someone"} covered your share of &quot;{coveredShare.title}&quot;
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {currency} {fmt(coveredShare.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fmtDate(transaction.createdAt)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                            They paid it from their wallet, so your balance didn&apos;t change. If they asked to be paid back,
                            you&apos;ll find it in your requests.
                        </p>
                        <button
                            onClick={() => router.push(`/home/bills/${coveredShare.billId}`)}
                            className="w-full mt-5 bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-semibold py-3 rounded-2xl hover:opacity-90 transition-all"
                        >
                            View split
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
