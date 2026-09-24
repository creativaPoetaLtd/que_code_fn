"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
    WalletCards, Lock, ArrowUpFromLine, ArrowDownToLine, MessageCircle,
    Loader2, CheckCircle, Ban, Clock, Users, UserMinus, UserPlus, LogOut, Crown, Trash2,
} from "lucide-react"
import { useAccent } from "@/hooks/use-accent"
import { toast } from "@/hooks/use-toast"
import { getCurrentUserId } from "@/utils/tokenUtils"
import { PinSetupModal } from "@/components/PinSetupModal"
import {
    useGetSharedWalletByIdQuery,
    useGetSharedWalletActivityQuery,
    useGetSharedWalletMembersQuery,
    useGetSharedWalletPendingMembersQuery,
    useRemoveSharedWalletMemberMutation,
    useLeaveSharedWalletMutation,
    useTransferSharedWalletOwnershipMutation,
    useDeleteSharedWalletMutation,
    useApproveSharedWalletWithdrawalMutation,
    useDeclineSharedWalletWithdrawalMutation,
    useCancelSharedWalletWithdrawalMutation,
    useTightenSharedWalletPolicyMutation,
    useGetPendingSharedWalletPolicyChangeQuery,
    useProposeSharedWalletPolicyChangeMutation,
    useApproveSharedWalletPolicyChangeMutation,
    useDeclineSharedWalletPolicyChangeMutation,
    useCancelSharedWalletPolicyChangeMutation,
} from "@/states/sharedWalletSlice"
import socketService from "@/services/socketService"
import WithdrawFromSharedWalletModal from "@/components/Wallet/WithdrawFromSharedWalletModal"
import DepositIntoSharedWalletModal from "@/components/Wallet/DepositIntoSharedWalletModal"
import AddSharedWalletMemberModal from "@/components/Wallet/AddSharedWalletMemberModal"

function fmtDate(ts: string) {
    return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function PendingWithdrawalRow({ sharedWalletId, entry, onChanged }: { sharedWalletId: string; entry: any; onChanged: () => void }) {
    const currentUserId = getCurrentUserId()
    const isRequester = entry.requestedByUserId === currentUserId
    const [showPin, setShowPin] = useState(false)
    const [pin, setPin] = useState("")
    const [showPinSetup, setShowPinSetup] = useState(false)

    const [approve, { isLoading: approving }] = useApproveSharedWalletWithdrawalMutation()
    const [decline, { isLoading: declining }] = useDeclineSharedWalletWithdrawalMutation()
    const [cancel, { isLoading: cancelling }] = useCancelSharedWalletWithdrawalMutation()

    const handleApprove = async () => {
        if (pin.length !== 4) return
        try {
            await approve({ sharedWalletId, withdrawalId: entry.id, pin }).unwrap()
            toast({ title: "Vote recorded" })
            setShowPin(false)
            setPin("")
            onChanged()
        } catch (err: any) {
            const errorData = err?.data || {}
            if (errorData.requiresPinSetup) {
                setShowPinSetup(true)
                toast({ title: "PIN Setup Required", description: errorData.message || "Please set up your transaction PIN first", variant: "destructive" })
            } else {
                toast({ title: "Could not approve", description: errorData.message, variant: "destructive" })
            }
            setPin("")
        }
    }

    const handlePinSetupSuccess = () => {
        toast({ title: "PIN Setup Complete", description: "You can now approve this request." })
        setShowPinSetup(false)
        setShowPin(true)
    }

    const handleDecline = async () => {
        try {
            await decline({ sharedWalletId, withdrawalId: entry.id }).unwrap()
            toast({ title: "Vote recorded" })
            onChanged()
        } catch (err: any) {
            toast({ title: "Could not decline", description: err?.data?.message, variant: "destructive" })
        }
    }

    const handleCancel = async () => {
        try {
            await cancel({ sharedWalletId, withdrawalId: entry.id }).unwrap()
            toast({ title: "Request cancelled" })
            onChanged()
        } catch (err: any) {
            toast({ title: "Could not cancel", description: err?.data?.message, variant: "destructive" })
        }
    }

    return (
        <>
            <PinSetupModal open={showPinSetup} onOpenChange={setShowPinSetup} onSuccess={handlePinSetupSuccess} />
            <Card className="p-3 space-y-2 border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{entry.approveCount}/{entry.requiredApprovals} approved</span>
                    </div>
                    <span className="text-sm font-bold">{entry.amount.toLocaleString()} {entry.currency}</span>
                </div>
                <p className="text-[11px] text-gray-500">
                    Requested by {isRequester ? "you" : (entry.requestedByName || "a member")}
                </p>
                {entry.note && <p className="text-xs text-gray-500 italic">&quot;{entry.note}&quot;</p>}
                {!isRequester && !showPin && (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={handleDecline} disabled={declining}>
                            Decline
                        </Button>
                        <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => setShowPin(true)}>
                            Approve
                        </Button>
                    </div>
                )}
                {!isRequester && showPin && (
                    <div className="flex gap-2 items-center">
                        <Input
                            type="password" inputMode="numeric" maxLength={4} placeholder="PIN"
                            value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                            className="h-8 text-center"
                        />
                        <Button size="sm" className="h-8 text-xs" onClick={handleApprove} disabled={approving || pin.length !== 4}>
                            {approving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                        </Button>
                    </div>
                )}
                {isRequester && (
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={handleCancel} disabled={cancelling}>
                        Cancel request
                    </Button>
                )}
            </Card>
        </>
    )
}

function PendingPolicyChangeRow({ sharedWalletId, policyChange, onChanged }: { sharedWalletId: string; policyChange: any; onChanged: () => void }) {
    const currentUserId = getCurrentUserId()
    const isProposer = policyChange.proposedByUserId === currentUserId

    const [approve, { isLoading: approving }] = useApproveSharedWalletPolicyChangeMutation()
    const [decline, { isLoading: declining }] = useDeclineSharedWalletPolicyChangeMutation()
    const [cancel, { isLoading: cancelling }] = useCancelSharedWalletPolicyChangeMutation()

    const handleApprove = async () => {
        try {
            await approve({ sharedWalletId, policyChangeId: policyChange.id }).unwrap()
            toast({ title: "Vote recorded" })
            onChanged()
        } catch (err: any) {
            toast({ title: "Could not approve", description: err?.data?.message, variant: "destructive" })
        }
    }

    const handleDecline = async () => {
        try {
            await decline({ sharedWalletId, policyChangeId: policyChange.id }).unwrap()
            toast({ title: "Vote recorded" })
            onChanged()
        } catch (err: any) {
            toast({ title: "Could not decline", description: err?.data?.message, variant: "destructive" })
        }
    }

    const handleCancel = async () => {
        try {
            await cancel({ sharedWalletId, policyChangeId: policyChange.id }).unwrap()
            toast({ title: "Proposal cancelled" })
            onChanged()
        } catch (err: any) {
            toast({ title: "Could not cancel", description: err?.data?.message, variant: "destructive" })
        }
    }

    return (
        <Card className="p-3 space-y-2 border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{policyChange.approveCount}/{policyChange.requiredApprovals} approved</span>
                </div>
                <span className="text-xs font-semibold">Switch to free withdrawals</span>
            </div>
            <p className="text-[11px] text-gray-500">
                Proposed by {isProposer ? "you" : "a member"}
            </p>
            {!isProposer && (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={handleDecline} disabled={declining}>
                        Decline
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleApprove} disabled={approving}>
                        Approve
                    </Button>
                </div>
            )}
            {isProposer && (
                <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={handleCancel} disabled={cancelling}>
                    Cancel proposal
                </Button>
            )}
        </Card>
    )
}

export default function SharedWalletDetail({ sharedWalletId }: { sharedWalletId: string }) {
    const router = useRouter()
    const accent = useAccent()
    const currentUserId = getCurrentUserId()

    const { data: walletResp, isLoading, refetch } = useGetSharedWalletByIdQuery(sharedWalletId)
    const { data: activityResp, refetch: refetchActivity } = useGetSharedWalletActivityQuery(sharedWalletId)
    const { data: membersResp, refetch: refetchMembers } = useGetSharedWalletMembersQuery(sharedWalletId)
    const [removeMember] = useRemoveSharedWalletMemberMutation()
    const [leaveWallet, { isLoading: leaving }] = useLeaveSharedWalletMutation()
    const [transferOwnership, { isLoading: transferring }] = useTransferSharedWalletOwnershipMutation()
    const [deleteWallet, { isLoading: deleting }] = useDeleteSharedWalletMutation()
    const [tightenPolicy, { isLoading: tightening }] = useTightenSharedWalletPolicyMutation()
    const [proposePolicyChange, { isLoading: proposingPolicyChange }] = useProposeSharedWalletPolicyChangeMutation()
    const { data: policyChangeResp, refetch: refetchPolicyChange } = useGetPendingSharedWalletPolicyChangeQuery(sharedWalletId)

    const [showWithdraw, setShowWithdraw] = useState(false)
    const [showDeposit, setShowDeposit] = useState(false)
    const [showAddMember, setShowAddMember] = useState(false)
    const [removeTarget, setRemoveTarget] = useState<{ userId: string; userName: string } | null>(null)
    const [removingMember, setRemovingMember] = useState(false)
    const [transferTarget, setTransferTarget] = useState<{ userId: string; userName: string } | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const wallet = walletResp?.data
    const activity: any[] = activityResp?.data ?? []
    const members: any[] = membersResp?.data ?? []
    const myMembership = members.find((m) => m.userId === currentUserId)
    const canManageMembers = myMembership?.role === "owner" || myMembership?.role === "admin"
    const isOwner = myMembership?.role === "owner"
    const pendingPolicyChange = policyChangeResp?.data ?? null

    const { data: pendingMembersResp } = useGetSharedWalletPendingMembersQuery(sharedWalletId, {
        skip: !canManageMembers || !!wallet?.groupId,
    })
    const pendingMembers: any[] = pendingMembersResp?.data ?? []
    const [cancelInvite, { isLoading: cancellingInvite }] = useRemoveSharedWalletMemberMutation()

    useEffect(() => {
        const onBalance = (data: { sharedWalletId: string }) => {
            if (data.sharedWalletId === sharedWalletId) {
                refetch()
                refetchActivity()
            }
        }
        const onWithdrawal = (data: { sharedWalletId: string }) => {
            if (data.sharedWalletId === sharedWalletId) refetchActivity()
        }
        const onPolicyChange = (data: { sharedWalletId: string }) => {
            if (data.sharedWalletId === sharedWalletId) {
                refetch()
                refetchPolicyChange()
            }
        }
        socketService.onSharedWalletBalanceUpdate(onBalance)
        socketService.onSharedWalletWithdrawalUpdated(onWithdrawal)
        socketService.onSharedWalletPolicyChangeUpdated(onPolicyChange)
        return () => {
            socketService.offSharedWalletBalanceUpdate(onBalance)
            socketService.offSharedWalletWithdrawalUpdated(onWithdrawal)
            socketService.offSharedWalletPolicyChangeUpdated(onPolicyChange)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sharedWalletId])

    if (isLoading || !wallet) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    const handleLeave = async () => {
        try {
            await leaveWallet(sharedWalletId).unwrap()
            toast({ title: "Left the shared wallet" })
            router.push("/wallet/" + currentUserId)
        } catch (err: any) {
            toast({ title: "Could not leave", description: err?.data?.message, variant: "destructive" })
        }
    }

    const handleConfirmRemove = async () => {
        if (!removeTarget) return
        setRemovingMember(true)
        try {
            await removeMember({ sharedWalletId, userId: removeTarget.userId }).unwrap()
            toast({ title: "Member removed" })
            setRemoveTarget(null)
        } catch (err: any) {
            toast({ title: "Could not remove member", description: err?.data?.message, variant: "destructive" })
        } finally {
            setRemovingMember(false)
        }
    }

    const handleCancelInvite = async (userId: string) => {
        try {
            await cancelInvite({ sharedWalletId, userId }).unwrap()
            toast({ title: "Invitation cancelled" })
        } catch (err: any) {
            toast({ title: "Could not cancel invitation", description: err?.data?.message, variant: "destructive" })
        }
    }

    const handleConfirmTransfer = async () => {
        if (!transferTarget) return
        try {
            await transferOwnership({ sharedWalletId, newOwnerUserId: transferTarget.userId }).unwrap()
            toast({ title: `${transferTarget.userName} is now the owner` })
            setTransferTarget(null)
            refetchMembers()
        } catch (err: any) {
            toast({ title: "Could not transfer ownership", description: err?.data?.message, variant: "destructive" })
        }
    }

    const handleTightenPolicy = async () => {
        try {
            await tightenPolicy(sharedWalletId).unwrap()
            toast({ title: "Withdrawal policy updated", description: "Withdrawals now require approval" })
            refetch()
        } catch (err: any) {
            toast({ title: "Could not update policy", description: err?.data?.message, variant: "destructive" })
        }
    }

    const handleProposePolicyChange = async () => {
        try {
            await proposePolicyChange(sharedWalletId).unwrap()
            toast({ title: "Policy change proposed" })
            refetchPolicyChange()
        } catch (err: any) {
            toast({ title: "Could not propose policy change", description: err?.data?.message, variant: "destructive" })
        }
    }

    const handleConfirmDelete = async () => {
        try {
            await deleteWallet(sharedWalletId).unwrap()
            toast({ title: "Shared wallet deleted" })
            router.push("/wallet/" + currentUserId)
        } catch (err: any) {
            toast({ title: "Could not delete wallet", description: err?.data?.message, variant: "destructive" })
            setShowDeleteConfirm(false)
        }
    }

    return (
        <>
            <div className="mb-6 flex items-center gap-3">
                <div className={`p-2 ${accent.lightIconBg} rounded-lg ${accent.lightIconColor}`}>
                    <WalletCards size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{wallet.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{wallet.memberCount} {wallet.memberCount === 1 ? "member" : "members"}</Badge>
                        {wallet.withdrawalPolicy === "approval" && (
                            <Badge variant="secondary" className="gap-1"><Lock className="w-3 h-3" /> Approval required</Badge>
                        )}
                    </div>
                </div>
            </div>

            <Card className="p-5 mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Balance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {wallet.balance.toLocaleString()} {wallet.currency}
                </p>
                <div className="flex gap-2 mt-4">
                    <Button className="flex-1" variant="outline" onClick={() => setShowDeposit(true)}>
                        <ArrowDownToLine className="w-4 h-4 mr-2" /> Deposit
                    </Button>
                    <Button className={`flex-1 ${accent.solidDark} text-white`} onClick={() => setShowWithdraw(true)}>
                        <ArrowUpFromLine className="w-4 h-4 mr-2" /> Withdraw
                    </Button>
                </div>
                {wallet.groupId && (
                    <Button variant="ghost" className="w-full mt-2 text-xs" onClick={() => router.push("/chat")}>
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Open {wallet.groupName || "group"} chat
                    </Button>
                )}
                {!wallet.groupId && wallet.withdrawalPolicy === "free" && canManageMembers && (
                    <Button variant="ghost" className="w-full mt-2 text-xs" onClick={handleTightenPolicy} disabled={tightening}>
                        <Lock className="w-3.5 h-3.5 mr-1.5" /> Require approval for withdrawals
                    </Button>
                )}
                {!wallet.groupId && wallet.withdrawalPolicy === "approval" && !pendingPolicyChange && myMembership && (
                    <Button variant="ghost" className="w-full mt-2 text-xs" onClick={handleProposePolicyChange} disabled={proposingPolicyChange}>
                        Request free withdrawals
                    </Button>
                )}
            </Card>

            <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 dark:bg-darkBg-card p-1">
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="space-y-2 mt-0">
                    {pendingPolicyChange && (
                        <PendingPolicyChangeRow
                            sharedWalletId={sharedWalletId}
                            policyChange={pendingPolicyChange}
                            onChanged={() => { refetchPolicyChange(); refetch(); }}
                        />
                    )}
                    {activity.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No activity yet.</p>
                    ) : (
                        activity.map((entry) =>
                            entry.kind === "withdrawal_request" ? (
                                <PendingWithdrawalRow
                                    key={entry.id}
                                    sharedWalletId={sharedWalletId}
                                    entry={entry}
                                    onChanged={() => { refetchActivity(); refetch(); }}
                                />
                            ) : (
                                <Card key={entry.id} className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {entry.type === "deposit" ? (
                                            <ArrowDownToLine className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <ArrowUpFromLine className="w-4 h-4 text-gray-500" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">
                                                {entry.personName
                                                    ? `${entry.type === "deposit" ? "Deposited by" : "Withdrawn by"} ${entry.personName}`
                                                    : entry.description || (entry.type === "deposit" ? "Deposit" : "Withdrawal")}
                                            </p>
                                            <p className="text-[11px] text-gray-400">{fmtDate(entry.createdAt)}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-semibold ${entry.type === "deposit" ? "text-green-600" : "text-gray-700 dark:text-gray-300"}`}>
                                        {entry.type === "deposit" ? "+" : "-"}{entry.amount.toLocaleString()} {entry.currency}
                                    </span>
                                </Card>
                            )
                        )
                    )}
                </TabsContent>

                <TabsContent value="members" className="space-y-2 mt-0">
                    {!wallet.groupId && canManageMembers && (
                        <Button variant="outline" className="w-full mb-2" onClick={() => setShowAddMember(true)}>
                            <UserPlus className="w-4 h-4 mr-2" /> Add members
                        </Button>
                    )}
                    {!wallet.groupId && canManageMembers && pendingMembers.length > 0 && (
                        <div className="mb-2">
                            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5 px-1">
                                Invited, awaiting response
                            </p>
                            <div className="space-y-1.5">
                                {pendingMembers.map((m) => (
                                    <Card key={m.userId} className="p-3 flex items-center justify-between bg-gray-50 dark:bg-white/[0.02]">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{m.userName}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs text-red-500 hover:text-red-600"
                                            onClick={() => handleCancelInvite(m.userId)}
                                            disabled={cancellingInvite}
                                        >
                                            Cancel
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                    {members.map((m) => (
                        <Card key={m.userId} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">{m.userName}</p>
                                    <p className="text-[11px] text-gray-400 capitalize">{m.role}</p>
                                </div>
                            </div>
                            {!wallet.groupId && m.role !== "owner" && m.userId !== currentUserId && (
                                <div className="flex items-center gap-1">
                                    {isOwner && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            title="Make owner"
                                            onClick={() => setTransferTarget({ userId: m.userId, userName: m.userName })}
                                        >
                                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                                        </Button>
                                    )}
                                    {canManageMembers && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => setRemoveTarget({ userId: m.userId, userName: m.userName })}
                                        >
                                            <UserMinus className="w-3.5 h-3.5 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                    {!wallet.groupId && myMembership && myMembership.role !== "owner" && (
                        <Button variant="outline" className="w-full mt-2 text-red-600" onClick={handleLeave} disabled={leaving}>
                            <LogOut className="w-4 h-4 mr-2" /> Leave shared wallet
                        </Button>
                    )}
                    {!wallet.groupId && isOwner && (
                        <Button
                            variant="outline"
                            className="w-full mt-2 text-red-600"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={wallet.balance !== 0}
                            title={wallet.balance !== 0 ? "Withdraw the remaining balance before deleting" : undefined}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete wallet
                        </Button>
                    )}
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <UserMinus size={20} className="text-red-600 dark:text-red-400" />
                            </div>
                            <AlertDialogTitle className="text-xl">Remove member</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            Remove <span className="font-medium">{removeTarget?.userName}</span> from &quot;{wallet.name}&quot;?
                            They&apos;ll lose access to this wallet immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel disabled={removingMember}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleConfirmRemove(); }}
                            disabled={removingMember}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {removingMember ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!transferTarget} onOpenChange={(open) => !open && setTransferTarget(null)}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                <Crown size={20} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <AlertDialogTitle className="text-xl">Transfer ownership</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            Make <span className="font-medium">{transferTarget?.userName}</span> the owner of &quot;{wallet.name}&quot;?
                            You&apos;ll become an admin and lose owner-only controls.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel disabled={transferring}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleConfirmTransfer(); }}
                            disabled={transferring}
                        >
                            {transferring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Transfer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                            </div>
                            <AlertDialogTitle className="text-xl">Delete wallet</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            Permanently delete &quot;{wallet.name}&quot;? All members will lose access. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AddSharedWalletMemberModal
                isOpen={showAddMember}
                onClose={() => setShowAddMember(false)}
                sharedWalletId={sharedWalletId}
                existingMemberIds={members.map((m) => m.userId)}
            />

            <WithdrawFromSharedWalletModal
                isOpen={showWithdraw}
                onClose={() => setShowWithdraw(false)}
                sharedWalletId={sharedWalletId}
                walletName={wallet.name}
                balance={wallet.balance}
                currency={wallet.currency}
                withdrawalPolicy={wallet.withdrawalPolicy}
            />
            <DepositIntoSharedWalletModal
                isOpen={showDeposit}
                onClose={() => setShowDeposit(false)}
                sharedWalletId={sharedWalletId}
                walletName={wallet.name}
                currency={wallet.currency}
            />
        </>
    )
}
