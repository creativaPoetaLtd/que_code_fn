"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { AlertCircle, BellRing, HandCoins, Loader2, Plus } from "lucide-react"
import { useAuthToken } from "@/hooks/use-auth-token"
import {
    PaymentRequestTab,
    cancelPaymentRequest,
    declinePaymentRequest,
    getPaymentRequestsTab,
    remindPaymentRequest,
} from "@/helpers/api"
import { Header } from "@/components/Header"
import Navigation from "@/components/Navigation"
import { useSidebar } from "@/context/SidebarContext"
import { cn } from "@/lib/utils"
import { BackButton } from "@/components/shared/BackButton"
import { Card } from "@/components/ui/card"
import { UserAvatar } from "@/components/UserAvatar"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { PaymentRequest } from "@/types/dashboard"
import { toast } from "@/hooks/use-toast"
import { useAccent } from "@/hooks/use-accent"
import socketService from "@/services/socketService"
import {
    EMPTY_STATES,
    STATUS_BADGES,
    TABS,
    dateLabel,
    expiryHint,
    formatAmount,
    nextReminderAt,
    otherParty,
    remindedAgo,
    timeLabel,
} from "@/components/requests/requestHelpers"

const PAGE_SIZE = 10

type Confirm = { kind: "decline" | "cancel"; request: PaymentRequest } | null

const buttonBase =
    "inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green dark:focus-visible:ring-brand-gold"
const secondary = `${buttonBase} border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-darkBorder-medium dark:bg-darkBg-card dark:text-white dark:hover:bg-white/5`
const primary = `${buttonBase} bg-[#0A7A16] text-white hover:bg-[#086512] dark:bg-brand-gold dark:text-[#00313A] dark:hover:bg-brand-goldHover`

const errorMessage = (err: unknown, fallback: string) =>
    (axios.isAxiosError(err) && (err.response?.data as { message?: string } | undefined)?.message) || fallback

export default function RequestsPage() {
    const { isExpanded } = useSidebar()
    const { getUserId } = useAuthToken()
    const viewerId = getUserId()
    const router = useRouter()
    const accent = useAccent()

    const [tab, setTab] = useState<PaymentRequestTab>("to_pay")
    const [page, setPage] = useState(1)
    const [requests, setRequests] = useState<PaymentRequest[]>([])
    const [counts, setCounts] = useState({ toPay: 0, requested: 0 })
    const [totals, setTotals] = useState({ toPay: 0, requested: 0 })
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadToken, setReloadToken] = useState(0)
    const [busyId, setBusyId] = useState<string | null>(null)
    const [confirm, setConfirm] = useState<Confirm>(null)

    const reload = useCallback(() => setReloadToken((n) => n + 1), [])

    useEffect(() => {
        // The token loads after mount; useAuthToken redirects to login if there is none.
        if (!viewerId) return
        const controller = new AbortController()
        setLoading(true)
        setError(null)
        getPaymentRequestsTab(tab, page, PAGE_SIZE, { signal: controller.signal })
            .then((res) => {
                setRequests(res?.data || [])
                setCounts(res?.counts || { toPay: 0, requested: 0 })
                setTotals(res?.totals || { toPay: 0, requested: 0 })
                setTotalPages(Math.max(1, Number(res?.pagination?.totalPages) || 1))
            })
            .catch((err) => {
                if (axios.isCancel(err)) return
                console.error("Failed to load payment requests:", err)
                setError("We couldn’t load your requests.")
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [viewerId, tab, page, reloadToken])

    // A request paid, declined or cancelled anywhere (chat, another device) refreshes the list.
    useEffect(() => {
        const handleUpdate = () => reload()
        socketService.onPaymentRequestUpdated(handleUpdate)
        return () => socketService.offPaymentRequestUpdated(handleUpdate)
    }, [reload])

    const switchTab = (next: PaymentRequestTab) => {
        setTab(next)
        setPage(1)
    }

    const runConfirmed = async () => {
        if (!confirm) return
        const { kind, request } = confirm
        setConfirm(null)
        setBusyId(request.id)
        try {
            const res: any = kind === "decline" ? await declinePaymentRequest(request.id) : await cancelPaymentRequest(request.id)
            const payload = res?.data ?? res
            if (!payload?.success) throw new Error(payload?.message)
            toast({ title: kind === "decline" ? "Request declined" : "Request cancelled" })
            reload()
        } catch (err) {
            toast({
                title: kind === "decline" ? "Couldn’t decline" : "Couldn’t cancel",
                description: errorMessage(err, "Please try again."),
                variant: "destructive",
            })
            reload()
        } finally {
            setBusyId(null)
        }
    }

    const remind = async (request: PaymentRequest) => {
        setBusyId(request.id)
        try {
            const res = await remindPaymentRequest(request.id)
            const lastRemindedAt = res.data?.data?.lastRemindedAt ?? new Date().toISOString()
            setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, lastRemindedAt } : r)))
            toast({ title: "Reminder sent", description: `${otherParty(request, viewerId).name} will get a notification.` })
        } catch (err) {
            toast({ title: "Couldn’t send reminder", description: errorMessage(err, "Please try again."), variant: "destructive" })
        } finally {
            setBusyId(null)
        }
    }

    const pay = (request: PaymentRequest) => router.push(`/home/transfer/amount?requestId=${request.id}`)

    /** Pay / Decline, Cancel / Remind, or a link to the payment, depending on the tab. */
    const actions = (request: PaymentRequest, size: "sm" | "lg") => {
        const h = size === "lg" ? "h-11 flex-1" : "h-8 px-3"
        const busy = busyId === request.id
        if (tab === "to_pay") {
            return (
                <>
                    <button type="button" className={cn(secondary, h)} disabled={busy} onClick={() => setConfirm({ kind: "decline", request })}>
                        Decline
                    </button>
                    <button type="button" className={cn(primary, h)} disabled={busy} onClick={() => pay(request)}>
                        {size === "lg" && !request.allowEditAmount ? `Pay ${formatAmount(request.amount, request.currency)}` : "Pay"}
                    </button>
                </>
            )
        }
        if (tab === "requested") {
            const next = nextReminderAt(request)
            const hours = next ? Math.ceil((next.getTime() - Date.now()) / 3_600_000) : 0
            return (
                <>
                    <button type="button" className={cn(secondary, h)} disabled={busy} onClick={() => setConfirm({ kind: "cancel", request })}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={cn(secondary, h)}
                        disabled={busy || !!next}
                        title={next ? `You can remind them again in ${hours} hour${hours === 1 ? "" : "s"}` : undefined}
                        onClick={() => remind(request)}
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />} Remind
                    </button>
                </>
            )
        }
        return null
    }

    /** Small grey line under the name: who reminded whom, or that the amount can change. */
    const personHint = (request: PaymentRequest) => {
        const ago = remindedAgo(request)
        if (tab === "to_pay" && ago) return `Reminded you ${ago}`
        if (tab === "requested" && ago) return `Reminded ${ago}`
        return null
    }

    const amountHints = (request: PaymentRequest) => (
        <>
            {tab === "to_pay" && request.allowEditAmount && (
                <div className="text-xs text-gray-500 dark:text-gray-400">You can change the amount</div>
            )}
            {expiryHint(request) && (
                <span className="mt-0.5 inline-block rounded px-1.5 py-px text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    {expiryHint(request)}
                </span>
            )}
            {tab === "history" && request.status === "paid" && request.transactionId && (
                <Link href={`/transactions?transactionId=${request.transactionId}`} className="block text-xs font-medium text-[#0A7A16] hover:underline dark:text-brand-gold">
                    View payment
                </Link>
            )}
        </>
    )

    const waitingCount = tab === "to_pay" ? counts.toPay : counts.requested
    const waitingTotal = tab === "to_pay" ? totals.toPay : totals.requested
    const summary =
        tab === "history" || waitingCount === 0
            ? null
            : tab === "to_pay"
              ? `${waitingCount} ${waitingCount === 1 ? "person is" : "people are"} waiting on you`
              : `You're waiting on ${waitingCount} ${waitingCount === 1 ? "person" : "people"}`

    const th = "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
    const td = "px-4 py-3 align-middle"

    return (
        <div className={`flex min-h-screen bg-gray-50 ${accent.darkBgPage}`}>
            <Navigation />

            <div className={cn("flex-1 min-w-0 transition-all duration-300", isExpanded ? "lg:ml-64" : "lg:ml-20")}>
                <div className="px-4 lg:px-6 pt-3 lg:pt-5">
                    <Header />
                </div>

                <div className="px-4 lg:px-6 pt-3 pb-24 lg:pb-8">
                    <div className="max-w-5xl mx-auto space-y-3">
                        {/* Title row */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <BackButton label="" className="px-2" />
                                <h1 className="truncate text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Requests</h1>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href="/home/bills" className="hidden sm:inline text-[13px] font-medium text-[#0A7A16] hover:underline dark:text-brand-gold">
                                    Split payments
                                </Link>
                                <Link href="/home/request" className={cn(primary, "h-9 px-3")}>
                                    <Plus className="h-4 w-4" />
                                    <span className="sm:hidden">New</span>
                                    <span className="hidden sm:inline">New request</span>
                                </Link>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div role="tablist" aria-label="Requests" className="flex sm:inline-flex gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-white/5">
                            {TABS.map((t) => {
                                const count = t.id === "to_pay" ? counts.toPay : t.id === "requested" ? counts.requested : 0
                                const on = tab === t.id
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={on}
                                        onClick={() => switchTab(t.id)}
                                        className={cn(
                                            "flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-md px-3 h-8 text-[13px] font-medium transition-colors",
                                            on ? "bg-white text-gray-900 shadow-sm dark:bg-darkBg-card dark:text-white" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                                        )}
                                    >
                                        {t.label}
                                        {count > 0 && (
                                            <span
                                                className={cn(
                                                    "flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                                                    t.id === "to_pay" ? "bg-[#0A7A16] text-white dark:bg-brand-gold dark:text-[#00313A]" : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300",
                                                )}
                                            >
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {summary && (
                            <p className="text-xs md:text-[13px] text-gray-600 dark:text-gray-400" aria-live="polite">
                                {summary} · <b className="font-semibold text-gray-900 dark:text-white">{formatAmount(waitingTotal)}</b>
                                {waitingCount > 0 && <span className="hidden sm:inline"> in total</span>}
                            </p>
                        )}

                        <Card className="overflow-hidden border border-gray-200 bg-white p-0 dark:border-darkBorder-light dark:bg-darkBg-card">
                            {loading && requests.length === 0 ? (
                                <div aria-hidden="true">
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 first:border-t-0 dark:border-darkBorder-light">
                                            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3.5 w-36 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                                                <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                                            </div>
                                            <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                                    <AlertCircle className="h-6 w-6 text-gray-400" />
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Something went wrong</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
                                    <button type="button" onClick={reload} className={cn(secondary, "mt-2 h-9 px-3")}>Try again</button>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                                    <HandCoins className="h-6 w-6 text-gray-400" />
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{EMPTY_STATES[tab].title}</p>
                                    <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">{EMPTY_STATES[tab].body}</p>
                                    {tab !== "history" && (
                                        <Link href="/home/request" className={cn(secondary, "mt-2 h-9 px-3")}>New request</Link>
                                    )}
                                </div>
                            ) : (
                                <div aria-busy={loading}>
                                    {/* Desktop: a real table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full min-w-[680px] text-sm">
                                            <thead className="border-b border-gray-200 bg-gray-50 dark:border-darkBorder-light dark:bg-white/[0.03]">
                                                <tr>
                                                    <th scope="col" className={cn(th, "w-36")}>Date</th>
                                                    <th scope="col" className={th}>{tab === "to_pay" ? "From" : tab === "requested" ? "To" : "Person"}</th>
                                                    <th scope="col" className={th}>Note</th>
                                                    {tab === "history" && <th scope="col" className={cn(th, "w-28")}>Status</th>}
                                                    <th scope="col" className={cn(th, "w-40 text-right")}>Amount</th>
                                                    {tab !== "history" && <th scope="col" className={cn(th, "w-48 text-right")}>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {requests.map((request) => {
                                                    const party = otherParty(request, viewerId)
                                                    const hint = personHint(request)
                                                    const badge = STATUS_BADGES[request.status]
                                                    return (
                                                        <tr key={request.id} className="border-t border-gray-100 first:border-t-0 dark:border-darkBorder-light">
                                                            <td className={cn(td, "whitespace-nowrap")}>
                                                                <div className="text-gray-900 dark:text-gray-100">{dateLabel(request.createdAt)}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{timeLabel(request.createdAt)}</div>
                                                            </td>
                                                            <td className={td}>
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    <UserAvatar profileImage={party.photo} firstName={party.person?.firstName} lastName={party.person?.lastName} disableClick className="h-9 w-9 shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <div className="truncate font-medium text-gray-900 dark:text-white">{party.name}</div>
                                                                        {tab === "history" && <div className="text-xs text-gray-500 dark:text-gray-400">{party.direction === "From" ? "Asked you" : "You asked"}</div>}
                                                                        {hint && <div className="text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className={cn(td, "max-w-[260px] truncate text-gray-600 dark:text-gray-300")}>{request.note || <span className="text-gray-400">—</span>}</td>
                                                            {tab === "history" && (
                                                                <td className={td}>
                                                                    <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-semibold", badge.className)}>{badge.label}</span>
                                                                </td>
                                                            )}
                                                            <td className={cn(td, "text-right whitespace-nowrap")}>
                                                                <div className="font-semibold text-gray-900 dark:text-white">{formatAmount(request.amount, request.currency)}</div>
                                                                {amountHints(request)}
                                                            </td>
                                                            {tab !== "history" && (
                                                                <td className={cn(td, "text-right")}>
                                                                    <div className="inline-flex gap-1.5">{actions(request, "sm")}</div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Phone: compact rows with full-width buttons */}
                                    <div className="md:hidden">
                                        {requests.map((request) => {
                                            const party = otherParty(request, viewerId)
                                            const hint = personHint(request)
                                            const badge = STATUS_BADGES[request.status]
                                            const sub = [request.note, `${dateLabel(request.createdAt).replace(/, \d{4}$/, "")} ${timeLabel(request.createdAt)}`].filter(Boolean).join(" · ")
                                            return (
                                                <div key={request.id} className="border-t border-gray-100 px-3.5 py-3 first:border-t-0 dark:border-darkBorder-light">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar profileImage={party.photo} firstName={party.person?.firstName} lastName={party.person?.lastName} disableClick className="h-9 w-9 shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                                {tab === "history" && <span className="font-normal text-gray-500 dark:text-gray-400">{party.direction} </span>}
                                                                {party.name}
                                                            </div>
                                                            <div className="truncate text-xs text-gray-500 dark:text-gray-400">{sub}</div>
                                                            {hint && <div className="text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <div className="whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{formatAmount(request.amount, request.currency)}</div>
                                                            {tab === "history" && (
                                                                <span className={cn("mt-0.5 inline-block rounded px-1.5 py-px text-[11px] font-semibold", badge.className)}>{badge.label}</span>
                                                            )}
                                                            {amountHints(request)}
                                                        </div>
                                                    </div>
                                                    {tab !== "history" && <div className="mt-2.5 flex gap-2">{actions(request, "lg")}</div>}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-2.5 dark:border-darkBorder-light">
                                            <span className="text-[13px] text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
                                            <div className="flex gap-1.5">
                                                <button type="button" className={cn(secondary, "h-8 px-3")} disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button>
                                                <button type="button" className={cn(secondary, "h-8 px-3")} disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>Next</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

                        {tab === "requested" && requests.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Requests expire after 30 days if they aren’t paid. You can send one reminder a day.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirm?.kind === "decline" ? "Decline this request?" : "Cancel this request?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm &&
                                (confirm.kind === "decline"
                                    ? `${otherParty(confirm.request, viewerId).name} asked you for ${formatAmount(confirm.request.amount, confirm.request.currency)}. They'll be told you declined.`
                                    : `${otherParty(confirm.request, viewerId).name} won't be able to pay ${formatAmount(confirm.request.amount, confirm.request.currency)} anymore. They'll be told you cancelled it.`)}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={runConfirmed} className="bg-red-600 text-white hover:bg-red-700">
                            {confirm?.kind === "decline" ? "Decline" : "Cancel request"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
