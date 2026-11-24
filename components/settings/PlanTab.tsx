"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import PinEntry from "@/components/transfer/PinEntry"
import { toast } from "@/hooks/use-toast"
import { useUserInfo } from "@/hooks/use-user-info"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/currency"
import { notifyWalletUpdated } from "@/utils/walletEvents"
import NpoRequestCard from "@/components/plans/NpoRequestCard"
import {
    useCancelMyPlanMutation,
    useChangeMyPlanMutation,
    useGetMyPlanQuery,
    useGetPlansQuery,
} from "@/states/planSlice"
import type { MyPlan, TierDefinition } from "@/types/plan.types"
import {
    FeatureValue,
    HIGHLIGHT_FEATURES,
    SUPPORT_LABELS,
    formatDate,
    formatLimit,
    formatPrice,
} from "@/components/plans/planDisplay"

/** "Renews on…", "Switches to … on …", "Payment overdue…" for the current subscription. */
const SubscriptionStatus = ({ plan, tierNames }: { plan: MyPlan; tierNames: Record<string, string> }) => {
    const sub = plan.subscription
    if (!sub) return null
    if (sub.status === "past_due") {
        return (
            <p className="text-sm text-red-600 dark:text-red-400">
                Renewal payment failed. Add money to your wallet to keep {plan.name} - it will retry automatically.
            </p>
        )
    }
    if (sub.pendingTier) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Switches to {tierNames[sub.pendingTier] ?? sub.pendingTier} on {formatDate(sub.currentPeriodEnd)}.
            </p>
        )
    }
    if (!sub.autoRenew) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Cancelled - stays active until {formatDate(sub.currentPeriodEnd)}.
            </p>
        )
    }
    return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
            Renews on {formatDate(sub.currentPeriodEnd)} for {formatCurrency(Number(sub.priceRwf))}, paid from your wallet.
        </p>
    )
}

export const PlanTab: React.FC = () => {
    const { accountType } = useUserInfo()
    const isOrganization = accountType === "organization"

    const { data: catalogue, isLoading: catalogueLoading } = useGetPlansQuery()
    const { data: myPlan, isLoading: planLoading, isError: planError } = useGetMyPlanQuery()
    const [changePlan, { isLoading: changing }] = useChangeMyPlanMutation()
    const [cancelPlan, { isLoading: cancelling }] = useCancelMyPlanMutation()

    const [targetTier, setTargetTier] = useState<TierDefinition | null>(null)
    const [pin, setPin] = useState("")
    const [showPin, setShowPin] = useState(false)
    const [pinError, setPinError] = useState("")

    const tierNames = useMemo(
        () => Object.fromEntries((catalogue?.tiers ?? []).map((t) => [t.tier, t.name])),
        [catalogue]
    )

    // Users see the plans they can buy; organizations see the organization plans (set by QC).
    const visibleTiers = useMemo(() => {
        if (!catalogue) return []
        return catalogue.tiers.filter((t) =>
            isOrganization ? t.accountKind === "organization" : catalogue.selfServiceTiers.includes(t.tier)
        )
    }, [catalogue, isOrganization])

    if (catalogueLoading || planLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    if (planError || !myPlan || !catalogue) {
        return <p className="py-8 text-center text-sm text-gray-500">Could not load your plan. Please try again later.</p>
    }

    const currentPrice = myPlan.priceRwf ?? 0
    const targetPrice = targetTier?.priceRwf ?? 0
    const needsPin = targetPrice > 0
    const isDowngrade = !!targetTier && targetPrice < currentPrice && !!myPlan.subscription

    const limitPercent =
        myPlan.dailyTransferLimit && myPlan.dailyTransferLimit > 0
            ? Math.min(100, (myPlan.usedToday / myPlan.dailyTransferLimit) * 100)
            : 0

    const openChange = (tier: TierDefinition) => {
        setTargetTier(tier)
        setPin("")
        setPinError("")
    }

    const confirmChange = async () => {
        if (!targetTier) return
        if (needsPin && pin.length !== 4) {
            setPinError("Enter your 4-digit PIN")
            return
        }
        try {
            const res = await changePlan({ tier: targetTier.tier, pin: needsPin ? pin : undefined }).unwrap()
            toast({ title: "Plan updated", description: res.message })
            if (res.data.chargedRwf > 0) notifyWalletUpdated()
            setTargetTier(null)
        } catch (error: any) {
            setPinError(error?.data?.message || "Could not change your plan")
            setPin("")
        }
    }

    const handleCancel = async () => {
        try {
            const res = await cancelPlan().unwrap()
            toast({ title: "Auto-renewal cancelled", description: res.message })
        } catch (error: any) {
            toast({ title: "Could not cancel", description: error?.data?.message, variant: "destructive" })
        }
    }

    const tierButtonLabel = (tier: TierDefinition) => {
        if (tier.tier === myPlan.tier) return "Current plan"
        if (myPlan.subscription?.pendingTier === tier.tier) return "Scheduled"
        return (tier.priceRwf ?? 0) > currentPrice ? "Upgrade" : "Switch"
    }

    return (
        <div className="space-y-6">
            {/* Current plan */}
            <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <CardTitle className="dark:text-white">{myPlan.name}</CardTitle>
                            <CardDescription className="dark:text-gray-400">
                                Your account type · {formatPrice(myPlan.priceRwf)}
                            </CardDescription>
                        </div>
                        <Badge variant={myPlan.subscription?.status === "past_due" ? "destructive" : "default"}>
                            {myPlan.subscription?.status === "past_due" ? "Payment overdue" : "Active"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <SubscriptionStatus plan={myPlan} tierNames={tierNames} />

                    <div>
                        <div className="mb-2 flex items-baseline justify-between text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Sent today</span>
                            <span className="text-gray-500 dark:text-gray-400">
                                {formatCurrency(myPlan.usedToday)}
                                {myPlan.dailyTransferLimit != null && ` of ${formatCurrency(myPlan.dailyTransferLimit)}`}
                            </span>
                        </div>
                        {myPlan.dailyTransferLimit != null ? (
                            <>
                                <Progress value={limitPercent} />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {formatCurrency(myPlan.remainingToday ?? 0)} left today · resets at midnight
                                </p>
                            </>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">No daily limit on your account.</p>
                        )}
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="text-gray-400">Currencies: </span>
                            {myPlan.currencies.join(", ")}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <span className="text-gray-400">Support: </span>
                            {SUPPORT_LABELS[myPlan.support]}
                        </p>
                    </div>

                    {myPlan.subscription?.autoRenew && !myPlan.subscription.pendingTier && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="dark:border-darkBorder-light dark:text-gray-300"
                        >
                            {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Cancel auto-renewal
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Plans */}
            <div>
                <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                    {isOrganization ? "Organization plans" : "Plans"}
                </h2>
                {isOrganization && (
                    <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                        Organization account types are set by QC. Contact support to change yours.
                    </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleTiers.map((tier) => {
                        const isCurrent = tier.tier === myPlan.tier
                        return (
                            <Card
                                key={tier.tier}
                                className={cn(
                                    "flex flex-col dark:bg-darkBg-card dark:border-darkBorder-light",
                                    isCurrent && "border-2 border-brand-green dark:border-brand-gold"
                                )}
                            >
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base dark:text-white">{tier.name}</CardTitle>
                                    <p className="text-xl font-bold text-[#00313A] dark:text-white">{formatPrice(tier.priceRwf)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Send up to {formatLimit(tier.dailyTransferLimit)}
                                    </p>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col gap-3">
                                    <ul className="flex-1 space-y-1.5">
                                        {HIGHLIGHT_FEATURES.map((key) => (
                                            <li key={key} className="flex items-center justify-between gap-2 text-xs">
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    {catalogue.features.find((f) => f.key === key)?.label}
                                                </span>
                                                <FeatureValue access={tier.features[key]} />
                                            </li>
                                        ))}
                                    </ul>
                                    {!isOrganization && (
                                        <Button
                                            size="sm"
                                            disabled={isCurrent || myPlan.subscription?.pendingTier === tier.tier}
                                            onClick={() => openChange(tier)}
                                            className={cn(
                                                !isCurrent &&
                                                    "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                                            )}
                                            variant={isCurrent ? "outline" : "default"}
                                        >
                                            {tierButtonLabel(tier)}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {isOrganization && <NpoRequestCard plan={myPlan} />}

            {/* Full comparison */}
            <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
                <CardHeader>
                    <CardTitle className="dark:text-white">Compare features</CardTitle>
                    {!catalogue.feesEnabled && (
                        <CardDescription className="dark:text-gray-400">
                            Per-use fees are listed for reference and aren&apos;t being charged yet.
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-darkBorder-light">
                                    <th className="py-2 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">Feature</th>
                                    {visibleTiers.map((tier) => (
                                        <th
                                            key={tier.tier}
                                            className={cn(
                                                "px-2 py-2 text-center font-medium",
                                                tier.tier === myPlan.tier
                                                    ? "text-brand-green dark:text-brand-gold"
                                                    : "text-gray-700 dark:text-gray-300"
                                            )}
                                        >
                                            {tier.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-50 dark:border-darkBorder-light/50">
                                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">Daily transfer limit</td>
                                    {visibleTiers.map((tier) => (
                                        <td key={tier.tier} className="px-2 py-2 text-center text-xs text-gray-600 dark:text-gray-300">
                                            {tier.dailyTransferLimit == null ? "On demand" : formatCurrency(tier.dailyTransferLimit)}
                                        </td>
                                    ))}
                                </tr>
                                {catalogue.features.map(({ key, label }) => (
                                    <tr key={key} className="border-b border-gray-50 dark:border-darkBorder-light/50">
                                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{label}</td>
                                        {visibleTiers.map((tier) => (
                                            <td key={tier.tier} className="px-2 py-2">
                                                <div className="flex justify-center">
                                                    <FeatureValue access={tier.features[key]} />
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Confirm plan change */}
            <Dialog open={!!targetTier} onOpenChange={(open) => !open && setTargetTier(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Switch to {targetTier?.name}</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                            {isDowngrade
                                ? `You keep ${myPlan.name} until ${formatDate(myPlan.subscription!.currentPeriodEnd)}, then switch to ${targetTier?.name}. Nothing is charged now.`
                                : needsPin
                                    ? `${formatCurrency(targetPrice)} will be paid from your wallet now, then every 30 days. You can cancel anytime.`
                                    : `Your account switches to ${targetTier?.name}.`}
                        </DialogDescription>
                    </DialogHeader>

                    {needsPin ? (
                        <PinEntry pin={pin} setPin={setPin} showPin={showPin} setShowPin={setShowPin} error={pinError} />
                    ) : (
                        pinError && <p className="text-sm text-red-600 dark:text-red-400">{pinError}</p>
                    )}

                    <DialogFooter className="flex justify-between gap-2">
                        <Button variant="ghost" onClick={() => setTargetTier(null)} disabled={changing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmChange}
                            disabled={changing || (needsPin && pin.length !== 4)}
                            className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                        >
                            {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isDowngrade ? "Schedule switch" : needsPin ? `Pay ${formatCurrency(targetPrice)}` : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default PlanTab
