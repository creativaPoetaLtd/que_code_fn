"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
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
import { Receipt, Loader2, CheckCircle, Clock, Ban, Bell, HandCoins, Repeat, XCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuthToken } from "@/hooks/use-auth-token"
import { getCurrentUserId } from "@/utils/tokenUtils"
import { useGetAcceptedContactsQuery } from "@/states/contactSlice"
import {
    useGetBillByIdQuery,
    usePayBillShareMutation,
    useDeclineBillShareMutation,
    useCoverBillShareMutation,
    useReassignBillShareMutation,
    useCloseBillShareMutation,
    useRemindBillShareMutation,
    useCancelBillMutation,
} from "@/states/billSlice"
import socketService from "@/services/socketService"
import { useAccent } from "@/hooks/use-accent"
import SharePinDialog from "@/components/bills/SharePinDialog"

interface BillShare {
    id: string
    payerId: string
    payerName: string
    amount: number
    status: "pending" | "paid" | "covered" | "declined" | "closed" | "cancelled"
    paidByUserId: string | null
    paidByName: string | null
    declineNote: string | null
}

// Surfaces follow the app's dark tokens (same as Money Requests) instead of the neutral shadcn defaults.
const CARD = "bg-white dark:bg-darkBg-card border-gray-100 dark:border-darkBorder-light"
const OUTLINE_BTN = "border-gray-200 dark:border-darkBorder-light bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive"

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 })
const isOpenShare = (status: string) => status === "pending" || status === "declined"

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    pending: { label: "Waiting", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
    paid: { label: "Paid", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
    covered: { label: "Covered", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    declined: { label: "Declined", className: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" },
    closed: { label: "Settled outside app", className: "bg-gray-100 text-gray-500 dark:bg-darkBg-interactive dark:text-gray-300" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 dark:bg-darkBg-interactive dark:text-gray-300" },
}

const StatusPill = ({ status }: { status: string }) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.pending
    return (
        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.className}`}>
            {style.label}
        </span>
    )
}

type ConfirmState = { type: "close"; share: BillShare } | { type: "cancel" } | null

export default function BillDetail({ billId }: { billId: string }) {
    const router = useRouter()
    const { getToken } = useAuthToken()
    const token = getToken()
    const myId = getCurrentUserId()
    const accent = useAccent()

    const { data: resp, isLoading, isError, refetch } = useGetBillByIdQuery(billId)
    const [payShare] = usePayBillShareMutation()
    const [declineShare, { isLoading: declining }] = useDeclineBillShareMutation()
    const [coverShare] = useCoverBillShareMutation()
    const [reassignShare, { isLoading: reassigning }] = useReassignBillShareMutation()
    const [closeShare, { isLoading: closing }] = useCloseBillShareMutation()
    const [remindShare] = useRemindBillShareMutation()
    const [cancelBill, { isLoading: cancelling }] = useCancelBillMutation()

    const [payOpen, setPayOpen] = useState(false)
    const [coverTarget, setCoverTarget] = useState<BillShare | null>(null)
    const [askReimbursement, setAskReimbursement] = useState(true)
    const [declineOpen, setDeclineOpen] = useState(false)
    const [declineNote, setDeclineNote] = useState("")
    const [reassignTarget, setReassignTarget] = useState<BillShare | null>(null)
    const [confirm, setConfirm] = useState<ConfirmState>(null)

    const { data: contactsData } = useGetAcceptedContactsQuery(token!, { skip: !token || !reassignTarget })

    useEffect(() => {
        const onUpdate = (data: { billId: string }) => {
            if (data.billId === billId) refetch()
        }
        socketService.onBillUpdated(onUpdate)
        return () => socketService.offBillUpdated(onUpdate)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [billId])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    const bill = resp?.data
    if (isError || !bill) {
        return (
            <div className="text-center py-16">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This split isn&apos;t available anymore.</p>
                <Button variant="outline" className={OUTLINE_BTN} onClick={() => router.push("/home/bills")}>Back to splits</Button>
            </div>
        )
    }

    const shares: BillShare[] = bill.shares
    const isOrganizer = bill.role === "organizer"
    const billOpen = bill.status === "open"
    const myShare = shares.find((s) => s.id === bill.myShareId) || null
    const recipientIsMe = bill.recipient?.type === "user" && bill.recipient.id === myId
    const pct = bill.totalAmount > 0 ? Math.min(100, (bill.paidInAmount / bill.totalAmount) * 100) : 0

    const canCover = (share: BillShare) =>
        billOpen && isOpenShare(share.status) && share.payerId !== myId && !recipientIsMe

    const takeAction = async (label: string, work: () => Promise<any>) => {
        try {
            await work()
            toast({ title: label })
        } catch (err: any) {
            toast({ title: "Could not do that", description: err?.data?.message || "Something went wrong", variant: "destructive" })
        }
    }

    const existingPayerIds = new Set(shares.map((s) => s.payerId))
    const reassignCandidates = (contactsData?.contacts || [])
        .map((c: any) => ({
            id: c.otherUser.id,
            name: `${c.otherUser.firstName} ${c.otherUser.lastName}`,
            avatar: c.otherUser.avatar,
        }))
        .filter((c: any) => !existingPayerIds.has(c.id) && !(bill.recipient?.type === "user" && bill.recipient.id === c.id))

    return (
        <>
            <div className="mb-6 flex items-center gap-3">
                <div className={`p-2 ${accent.lightIconBg} rounded-lg ${accent.lightIconColor}`}>
                    <Receipt size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{bill.title}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        To <span className="font-semibold">{bill.recipient?.name ?? "recipient"}</span>
                        {bill.recipient?.type === "organization" && " (business)"} · organized by{" "}
                        {isOrganizer ? "you" : bill.organizer.name}
                    </p>
                </div>
            </div>

            {bill.note && <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">&quot;{bill.note}&quot;</p>}

            <Card className={`p-5 mb-4 ${CARD}`}>
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Paid in the app</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {fmt(bill.paidInAmount)} <span className="text-base font-medium text-gray-500">of {fmt(bill.totalAmount)} {bill.currency}</span>
                        </p>
                    </div>
                    {bill.status === "completed" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" /> Settled
                        </span>
                    )}
                    {bill.status === "cancelled" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                            <Ban className="w-4 h-4" /> Cancelled
                        </span>
                    )}
                </div>
                <Progress value={pct} className="h-2 dark:bg-darkBg-interactive" />
                {bill.status === "completed" && bill.paidInAmount < bill.totalAmount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The remaining {fmt(bill.totalAmount - bill.paidInAmount)} {bill.currency} was settled outside the app.
                    </p>
                )}
            </Card>

            {myShare && billOpen && isOpenShare(myShare.status) && (
                <Card className="p-5 mb-4 bg-white dark:bg-darkBg-card border-brand-green/30 dark:border-brand-gold/30">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your share</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {fmt(myShare.amount)} {bill.currency}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Goes straight to {bill.recipient?.name}. Nothing passes through {isOrganizer ? "anyone else" : bill.organizer.name}.
                    </p>
                    <div className="flex gap-2">
                        {myShare.status === "pending" && (
                            <Button variant="outline" className={`flex-1 ${OUTLINE_BTN}`} onClick={() => setDeclineOpen(true)}>
                                Decline
                            </Button>
                        )}
                        <Button
                            className="flex-1 bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                            onClick={() => setPayOpen(true)}
                        >
                            Pay {fmt(myShare.amount)}
                        </Button>
                    </div>
                    {myShare.status === "declined" && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-2">You declined this. You can still pay it until it is resolved.</p>
                    )}
                </Card>
            )}

            <div className="space-y-2 mb-6">
                {shares.map((share) => (
                    <Card key={share.id} className={`p-3 ${CARD}`}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {share.payerId === myId ? "You" : share.payerName}
                                </p>
                                {share.status === "covered" && share.paidByName && (
                                    <p className="text-[11px] text-blue-600 dark:text-blue-400">covered by {share.paidByUserId === myId ? "you" : share.paidByName}</p>
                                )}
                                {share.status === "declined" && share.declineNote && (
                                    <p className="text-[11px] text-red-500 dark:text-red-400 italic">&quot;{share.declineNote}&quot;</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {fmt(share.amount)} {bill.currency}
                                </span>
                                <StatusPill status={share.status} />
                            </div>
                        </div>

                        {billOpen && isOpenShare(share.status) && (canCover(share) || isOrganizer) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {canCover(share) && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className={`h-7 text-xs ${OUTLINE_BTN}`}
                                        onClick={() => { setAskReimbursement(true); setCoverTarget(share) }}
                                    >
                                        <HandCoins className="w-3 h-3 mr-1" /> Cover
                                    </Button>
                                )}
                                {isOrganizer && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={`h-7 text-xs ${OUTLINE_BTN}`}
                                            onClick={() =>
                                                takeAction("Reminder sent", () =>
                                                    remindShare({ billId, shareId: share.id }).unwrap()
                                                )
                                            }
                                        >
                                            <Bell className="w-3 h-3 mr-1" /> Remind
                                        </Button>
                                        <Button size="sm" variant="outline" className={`h-7 text-xs ${OUTLINE_BTN}`} onClick={() => setReassignTarget(share)}>
                                            <Repeat className="w-3 h-3 mr-1" /> Reassign
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={`h-7 text-xs ${OUTLINE_BTN}`}
                                            onClick={() => setConfirm({ type: "close", share })}
                                        >
                                            <CheckCircle className="w-3 h-3 mr-1" /> Settled outside
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {bill.canCancel && (
                <Button variant="outline" className="w-full border-red-200 dark:border-red-900/50 bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setConfirm({ type: "cancel" })}>
                    <XCircle className="w-4 h-4 mr-2" /> Cancel this split
                </Button>
            )}
            {isOrganizer && billOpen && !bill.canCancel && (
                <p className="text-xs text-center text-gray-400">
                    Some shares are already paid, so this split can&apos;t be cancelled. Mark the rest as settled outside the app to close it.
                </p>
            )}

            {/* Pay my own share */}
            {myShare && (
                <SharePinDialog
                    isOpen={payOpen}
                    onClose={() => setPayOpen(false)}
                    title="Pay your share"
                    description={`${fmt(myShare.amount)} ${bill.currency} goes straight to ${bill.recipient?.name}.`}
                    confirmLabel="Pay"
                    onConfirm={async (pin) => {
                        await payShare({ billId, shareId: myShare.id, pin }).unwrap()
                        toast({ title: "Share paid" })
                    }}
                />
            )}

            {/* Cover someone else's share */}
            {coverTarget && (
                <SharePinDialog
                    isOpen={!!coverTarget}
                    onClose={() => setCoverTarget(null)}
                    title={`Cover ${coverTarget.payerName}'s share`}
                    description={`You'll pay ${fmt(coverTarget.amount)} ${bill.currency} to ${bill.recipient?.name} so the bill can be settled.`}
                    confirmLabel="Cover"
                    onConfirm={async (pin) => {
                        await coverShare({
                            billId,
                            shareId: coverTarget.id,
                            pin,
                            requestReimbursement: askReimbursement,
                        }).unwrap()
                        toast({
                            title: "Share covered",
                            description: askReimbursement ? `${coverTarget.payerName} was asked to pay you back.` : undefined,
                        })
                    }}
                >
                    <label className="flex items-center gap-3 py-1 cursor-pointer">
                        <Checkbox checked={askReimbursement} onCheckedChange={(v) => setAskReimbursement(Boolean(v))} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Ask {coverTarget.payerName} to pay me back
                        </span>
                    </label>
                </SharePinDialog>
            )}

            {/* Decline my share */}
            <Dialog open={declineOpen} onOpenChange={(open) => !open && setDeclineOpen(false)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light">
                    <DialogHeader>
                        <DialogTitle>Decline your share?</DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                            {bill.organizer.name} will be told, so it can be sorted out. You can still pay it later.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Reason (optional), e.g. already paid cash"
                        maxLength={200}
                        value={declineNote}
                        onChange={(e) => setDeclineNote(e.target.value)}
                    />
                    <DialogFooter className="flex justify-between">
                        <Button variant="ghost" className="dark:text-gray-300 dark:hover:bg-darkBg-interactive" onClick={() => setDeclineOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={declining}
                            onClick={async () => {
                                if (!myShare) return
                                await takeAction("Share declined", () =>
                                    declineShare({ billId, shareId: myShare.id, note: declineNote.trim() || undefined }).unwrap()
                                )
                                setDeclineOpen(false)
                                setDeclineNote("")
                            }}
                        >
                            {declining && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Decline
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reassign a share */}
            <Dialog open={!!reassignTarget} onOpenChange={(open) => !open && setReassignTarget(null)}>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light">
                    <DialogHeader>
                        <DialogTitle>Reassign this share</DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                            Give {reassignTarget?.payerName}&apos;s {reassignTarget ? fmt(reassignTarget.amount) : ""} {bill.currency} share to
                            someone else. The amount stays the same.
                        </DialogDescription>
                    </DialogHeader>
                    {reassignCandidates.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No other contacts available.</p>
                    ) : (
                        <div className="space-y-1">
                            {reassignCandidates.map((c: any) => (
                                <button
                                    key={c.id}
                                    disabled={reassigning}
                                    onClick={async () => {
                                        if (!reassignTarget) return
                                        await takeAction(`Reassigned to ${c.name}`, () =>
                                            reassignShare({ billId, shareId: reassignTarget.id, newPayerId: c.id }).unwrap()
                                        )
                                        setReassignTarget(null)
                                    }}
                                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-darkBg-interactive text-left"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={c.avatar || "/placeholder.svg"} alt={c.name} />
                                        <AvatarFallback className="text-xs">{c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirm: settled outside the app / cancel the split */}
            <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
                <AlertDialogContent className="max-w-md bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm?.type === "cancel" ? "Cancel this split?" : "Mark as settled outside the app?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {confirm?.type === "cancel"
                                ? "Everyone with an unpaid share will be told. Nothing has been paid yet, so no money moves."
                                : confirm
                                    ? `${confirm.share.payerName}'s ${fmt(confirm.share.amount)} ${bill.currency} share stops counting toward what's collected in the app. Only do this if it was settled some other way, like cash.`
                                    : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel
                            disabled={closing || cancelling}
                            className="border-gray-200 dark:border-darkBorder-light bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
                        >
                            Back
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={closing || cancelling}
                            className={
                                confirm?.type === "cancel"
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                            }
                            onClick={async (e) => {
                                e.preventDefault()
                                if (!confirm) return
                                if (confirm.type === "cancel") {
                                    await takeAction("Split cancelled", () => cancelBill(billId).unwrap())
                                } else {
                                    await takeAction("Marked as settled outside the app", () =>
                                        closeShare({ billId, shareId: confirm.share.id }).unwrap()
                                    )
                                }
                                setConfirm(null)
                            }}
                        >
                            {(closing || cancelling) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {confirm?.type === "cancel" ? "Cancel split" : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
