"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, CheckCircle2, Circle, HeartHandshake, Loader2 } from "lucide-react"
import PinEntry from "@/components/transfer/PinEntry"
import { PinSetupModal } from "@/components/PinSetupModal"
import TopUpModal from "@/components/Wallet/TopUpModal"
import NpoRequestCard from "@/components/plans/NpoRequestCard"
import { FeatureValue, HIGHLIGHT_FEATURES, formatLimit, formatPrice } from "@/components/plans/planDisplay"
import { useUserInfo } from "@/hooks/use-user-info"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/currency"
import { onWalletUpdated } from "@/utils/walletEvents"
import { getEntityBalance, getPinStatus } from "@/helpers/api"
import { useChangeMyPlanMutation, useGetMyPlanQuery, useGetPlansQuery } from "@/states/planSlice"
import type { AccountTier, TierDefinition } from "@/types/plan.types"

/**
 * "Choose your plan" - shown once, right after a new account verifies its email and logs
 * in (the OTP page sends new signups here through the login returnUrl). Everyone already
 * starts on the free default plan, so every path out of this page - including "Skip" -
 * leaves a working account; paid plans need a PIN and enough wallet balance first.
 */

const primaryButton =
    "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"

const StepRow = ({ done, title, children }: { done: boolean; title: string; children?: React.ReactNode }) => (
    <div className="flex gap-3">
        {done ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
        ) : (
            <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-300 dark:text-gray-600" />
        )}
        <div className="flex-1 space-y-2">
            <p className={cn("text-sm font-medium", done ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white")}>
                {title}
            </p>
            {!done && children}
        </div>
    </div>
)

const UserPlanOnboarding = ({ userId, goHome }: { userId: string; goHome: () => void }) => {
    const { data: catalogue, isLoading } = useGetPlansQuery()
    const [changePlan, { isLoading: paying }] = useChangeMyPlanMutation()

    const [step, setStep] = useState<"choose" | "pay" | "done">("choose")
    const [selected, setSelected] = useState<AccountTier>("STARTER")
    const [hasPin, setHasPin] = useState<boolean | null>(null)
    const [balance, setBalance] = useState<number | null>(null)
    const [showPinSetup, setShowPinSetup] = useState(false)
    const [showTopUp, setShowTopUp] = useState(false)
    const [pin, setPin] = useState("")
    const [showPin, setShowPin] = useState(false)
    const [payError, setPayError] = useState("")

    const tiers = useMemo(
        () => (catalogue?.tiers ?? []).filter((t) => catalogue?.selfServiceTiers.includes(t.tier)),
        [catalogue]
    )
    const selectedTier = tiers.find((t) => t.tier === selected)
    const price = selectedTier?.priceRwf ?? 0

    const refreshPin = useCallback(async () => {
        try {
            const res = await getPinStatus()
            setHasPin(!!res?.data?.hasPinSet)
        } catch {
            setHasPin(false)
        }
    }, [])

    const refreshBalance = useCallback(async () => {
        try {
            const res = await getEntityBalance(userId, "user")
            setBalance(Number(res?.data?.availableBalance ?? 0))
        } catch {
            setBalance(0)
        }
    }, [userId])

    useEffect(() => {
        if (step !== "pay") return
        refreshPin()
        refreshBalance()
        return onWalletUpdated(refreshBalance)
    }, [step, refreshPin, refreshBalance])

    const continueWithSelection = () => {
        if (price > 0) {
            setPin("")
            setPayError("")
            setStep("pay")
        } else {
            goHome()
        }
    }

    const handlePay = async () => {
        if (pin.length !== 4) {
            setPayError("Enter your 4-digit PIN")
            return
        }
        setPayError("")
        try {
            await changePlan({ tier: selected, pin }).unwrap()
            setStep("done")
        } catch (err: any) {
            setPayError(err?.data?.message || "Payment failed. Please try again.")
            setPin("")
        }
    }

    if (isLoading || !catalogue) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    if (step === "done") {
        return (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">You&apos;re on {selectedTier?.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    It renews every 30 days from your wallet. You can change or cancel it anytime in Settings → Plan.
                </p>
                <Button className={cn("mt-2", primaryButton)} onClick={goHome}>
                    Go to my wallet
                </Button>
            </div>
        )
    }

    if (step === "pay" && selectedTier) {
        const pinReady = hasPin === true
        const fundsReady = balance != null && balance >= price
        const shortfall = balance == null ? price : Math.max(0, price - balance)

        return (
            <div className="mx-auto max-w-lg">
                <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
                    <CardHeader>
                        <CardTitle className="dark:text-white">
                            {selectedTier.name} · {formatPrice(selectedTier.priceRwf)}
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Paid from your QC wallet now, then every 30 days. Cancel anytime.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <StepRow done={pinReady} title="Set your transaction PIN">
                            <Button size="sm" variant="outline" onClick={() => setShowPinSetup(true)} disabled={hasPin === null}>
                                Set up PIN
                            </Button>
                        </StepRow>

                        <StepRow
                            done={fundsReady}
                            title={
                                fundsReady
                                    ? `Wallet balance: ${formatCurrency(balance ?? 0)}`
                                    : `Add ${formatCurrency(shortfall)} to your wallet`
                            }
                        >
                            <Button size="sm" variant="outline" onClick={() => setShowTopUp(true)}>
                                Top up
                            </Button>
                        </StepRow>

                        <StepRow done={false} title={`Pay ${formatCurrency(price)}`}>
                            {pinReady && fundsReady ? (
                                <>
                                    <PinEntry pin={pin} setPin={setPin} showPin={showPin} setShowPin={setShowPin} error={payError} />
                                    <Button className={cn("w-full", primaryButton)} onClick={handlePay} disabled={paying || pin.length !== 4}>
                                        {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Pay {formatCurrency(price)}
                                    </Button>
                                </>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Finish the steps above first.</p>
                            )}
                        </StepRow>
                    </CardContent>
                </Card>

                <div className="mt-4 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep("choose")} disabled={paying}>
                        Back
                    </Button>
                    <Button variant="ghost" onClick={goHome} disabled={paying}>
                        Stay on Starter for now
                    </Button>
                </div>

                <PinSetupModal open={showPinSetup} onOpenChange={setShowPinSetup} onSuccess={refreshPin} />
                <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} />
            </div>
        )
    }

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {tiers.map((tier: TierDefinition) => {
                    const isSelected = tier.tier === selected
                    return (
                        <button
                            key={tier.tier}
                            type="button"
                            onClick={() => setSelected(tier.tier)}
                            className={cn(
                                "flex flex-col rounded-xl border-2 bg-white p-4 text-left transition-colors dark:bg-darkBg-card",
                                isSelected
                                    ? "border-brand-green dark:border-brand-gold"
                                    : "border-gray-200 hover:border-gray-300 dark:border-darkBorder-light"
                            )}
                            aria-pressed={isSelected}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">{tier.name}</span>
                                {tier.tier === "STARTER" && <Badge variant="outline">Default</Badge>}
                            </div>
                            <span className="mt-1 text-xl font-bold text-[#00313A] dark:text-white">{formatPrice(tier.priceRwf)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Send up to {formatLimit(tier.dailyTransferLimit)}</span>
                            <ul className="mt-3 space-y-1.5">
                                {HIGHLIGHT_FEATURES.map((key) => (
                                    <li key={key} className="flex items-center justify-between gap-2 text-xs">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {catalogue.features.find((f) => f.key === key)?.label}
                                        </span>
                                        <FeatureValue access={tier.features[key]} />
                                    </li>
                                ))}
                            </ul>
                        </button>
                    )
                })}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button variant="ghost" onClick={goHome}>
                    Skip for now
                </Button>
                <Button className={primaryButton} onClick={continueWithSelection}>
                    Continue with {selectedTier?.name}
                    {price > 0 ? ` · ${formatPrice(selectedTier?.priceRwf ?? null)}` : ""}
                </Button>
            </div>
            <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                You can change your plan anytime in Settings → Plan.
            </p>
        </>
    )
}

const OrganizationPlanOnboarding = ({ goHome }: { goHome: () => void }) => {
    const { data: myPlan, isLoading } = useGetMyPlanQuery()
    const [choice, setChoice] = useState<"BUSINESS" | "NPO">("BUSINESS")

    if (isLoading || !myPlan) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    const options = [
        {
            key: "BUSINESS" as const,
            icon: Building2,
            title: "Business",
            description:
                "For companies, shops, churches and schools: create actions (tickets, offerings, services), set prices, store tickets on QR codes. Pricing is agreed with QC.",
        },
        {
            key: "NPO" as const,
            icon: HeartHandshake,
            title: "Non-profit (NPO)",
            description: "Free for charities and associations, including tagged donations for your causes. QC reviews each request.",
        },
    ]

    return (
        <div className="mx-auto max-w-2xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                {options.map(({ key, icon: Icon, title, description }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setChoice(key)}
                        aria-pressed={choice === key}
                        className={cn(
                            "rounded-xl border-2 bg-white p-4 text-left transition-colors dark:bg-darkBg-card",
                            choice === key
                                ? "border-brand-green dark:border-brand-gold"
                                : "border-gray-200 hover:border-gray-300 dark:border-darkBorder-light"
                        )}
                    >
                        <Icon className="h-6 w-6 text-brand-green dark:text-brand-gold" />
                        <p className="mt-2 font-semibold text-gray-900 dark:text-white">{title}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
                    </button>
                ))}
            </div>

            {choice === "NPO" && <NpoRequestCard plan={myPlan} />}

            <div className="flex justify-end">
                <Button className={primaryButton} onClick={goHome}>
                    {choice === "NPO" && myPlan.npoRequest ? "Done" : choice === "NPO" ? "Skip for now" : "Continue as Business"}
                </Button>
            </div>
        </div>
    )
}

export default function ChoosePlanPage() {
    const router = useRouter()
    const { userId, accountType, isAuthenticated } = useUserInfo()

    useEffect(() => {
        if (!isAuthenticated) router.replace(`/auth/login?returnUrl=${encodeURIComponent("/onboarding/plan")}`)
    }, [isAuthenticated, router])

    const goHome = useCallback(() => router.replace(`/home/${userId}`), [router, userId])

    if (!isAuthenticated || !userId) return null

    const isOrganization = accountType === "organization"

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-darkBg-main">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                        {isOrganization ? "What kind of organization are you?" : "Choose your plan"}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {isOrganization
                            ? "Your account starts as Business. Non-profits can ask QC for the free NPO account."
                            : "Start free with Starter, or pick a plan with higher limits and free extras."}
                    </p>
                </div>

                {isOrganization ? (
                    <OrganizationPlanOnboarding goHome={goHome} />
                ) : (
                    <UserPlanOnboarding userId={userId} goHome={goHome} />
                )}
            </div>
        </main>
    )
}
