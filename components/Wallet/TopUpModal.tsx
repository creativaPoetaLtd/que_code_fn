"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, FlaskConical, Loader2, Smartphone, XCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/currency"
import { notifyWalletUpdated } from "@/utils/walletEvents"
import {
    useCreateTopUpMutation,
    useGetTopUpOptionsQuery,
    useGetTopUpQuery,
    useSimulateTopUpMutation,
} from "@/states/topUpSlice"
import type { TopUpProviderKey } from "@/types/topUp.types"

interface TopUpModalProps {
    isOpen: boolean
    onClose: () => void
    /** Pre-fills the mobile money number (the account's own phone). */
    defaultPhone?: string
}

const QUICK_AMOUNTS = [1000, 5000, 10000, 20000]
const POLL_INTERVAL_MS = 2000

// Rwandan prefixes per network - the backend rejects a number on the wrong network.
const NETWORK_PREFIXES: Record<TopUpProviderKey, string[]> = {
    mtn_momo: ["078", "079"],
    airtel_money: ["072", "073"],
}

const NETWORK_STYLES: Record<TopUpProviderKey, string> = {
    mtn_momo: "border-yellow-400 bg-yellow-50 dark:bg-yellow-400/10",
    airtel_money: "border-red-500 bg-red-50 dark:bg-red-500/10",
}

/** 07XXXXXXXX from any of 07…, 2507…, +2507… (spaces / dashes ignored), or null. */
const toLocalPhone = (raw: string): string | null => {
    const digits = raw.replace(/[\s-]/g, "").replace(/^\+/, "")
    if (/^07\d{8}$/.test(digits)) return digits
    if (/^2507\d{8}$/.test(digits)) return `0${digits.slice(3)}`
    return null
}

const networkFor = (localPhone: string | null): TopUpProviderKey | null => {
    if (!localPhone) return null
    const match = (Object.keys(NETWORK_PREFIXES) as TopUpProviderKey[]).find((key) =>
        NETWORK_PREFIXES[key].some((prefix) => localPhone.startsWith(prefix))
    )
    return match ?? null
}

export default function TopUpModal({ isOpen, onClose, defaultPhone }: TopUpModalProps) {
    const [amount, setAmount] = useState("")
    const [phone, setPhone] = useState("")
    const [note, setNote] = useState("")
    const [provider, setProvider] = useState<TopUpProviderKey>("mtn_momo")
    const [formError, setFormError] = useState("")
    const [topUpId, setTopUpId] = useState<string | null>(null)

    const { data: options, isLoading: optionsLoading } = useGetTopUpOptionsQuery(undefined, { skip: !isOpen })
    const [createTopUp, { isLoading: creating }] = useCreateTopUpMutation()
    const [simulateTopUp, { isLoading: simulating }] = useSimulateTopUpMutation()

    // Poll while the payer hasn't answered; stop once the top-up is settled.
    const [pollMs, setPollMs] = useState(POLL_INTERVAL_MS)
    const { data: topUp } = useGetTopUpQuery(topUpId as string, {
        skip: !topUpId,
        pollingInterval: pollMs,
    })
    const status = topUp?.status ?? (topUpId ? "pending" : null)
    useEffect(() => {
        setPollMs(status && status !== "pending" ? 0 : POLL_INTERVAL_MS)
    }, [status])

    useEffect(() => {
        if (!isOpen) return
        setAmount("")
        setNote("")
        setFormError("")
        setTopUpId(null)
        const local = defaultPhone ? toLocalPhone(defaultPhone) : null
        setPhone(local ?? "")
        setProvider(networkFor(local) ?? "mtn_momo")
    }, [isOpen, defaultPhone])

    // Refresh balances once the money has landed.
    useEffect(() => {
        if (status === "successful") notifyWalletUpdated()
    }, [status])

    const localPhone = toLocalPhone(phone)
    const phoneNetwork = networkFor(localPhone)
    const parsedAmount = Number(amount)
    const minAmount = options?.minAmount ?? 100
    const maxAmount = options?.maxAmount ?? 2000000
    const providerOption = options?.providers.find((p) => p.key === provider)
    const anyProviderAvailable = !!options?.providers.some((p) => p.available)

    const validationError = useMemo(() => {
        if (!amount) return ""
        if (!Number.isInteger(parsedAmount) || parsedAmount < minAmount || parsedAmount > maxAmount) {
            return `Enter a whole amount between ${formatCurrency(minAmount)} and ${formatCurrency(maxAmount)}`
        }
        if (phone && !localPhone) return "Enter a Rwandan mobile number (07XXXXXXXX)"
        if (localPhone && phoneNetwork !== provider) {
            return `${localPhone} is not ${provider === "mtn_momo" ? "an MTN" : "an Airtel"} number`
        }
        return ""
    }, [amount, parsedAmount, minAmount, maxAmount, phone, localPhone, phoneNetwork, provider])

    const canSubmit = !!amount && !!localPhone && !validationError && !!providerOption?.available && !creating

    const handlePhoneChange = (value: string) => {
        setPhone(value)
        const network = networkFor(toLocalPhone(value))
        if (network) setProvider(network)
    }

    const handleSubmit = async () => {
        if (!canSubmit || !localPhone) return
        setFormError("")
        try {
            const res = await createTopUp({
                amount: parsedAmount,
                provider,
                phoneNumber: localPhone,
                note: note.trim() || undefined,
            }).unwrap()
            setTopUpId(res.data.id)
        } catch (error: any) {
            setFormError(error?.data?.message || "Could not start the top-up. Please try again.")
        }
    }

    const handleSimulate = async (outcome: "successful" | "failed") => {
        if (!topUpId) return
        try {
            await simulateTopUp({ id: topUpId, outcome }).unwrap()
        } catch (error: any) {
            toast({ title: "Simulation failed", description: error?.data?.message, variant: "destructive" })
        }
    }

    const resetToForm = () => {
        setTopUpId(null)
        setFormError("")
    }

    const networkName = provider === "mtn_momo" ? "MTN MoMo" : "Airtel Money"

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Top up your wallet
                        {options?.simulation && (
                            <Badge variant="outline" className="gap-1 border-amber-400 text-amber-600 dark:text-amber-400">
                                <FlaskConical className="h-3 w-3" /> Simulation
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                        Add money from your mobile money account.
                    </DialogDescription>
                </DialogHeader>

                {/* Form */}
                {!topUpId && (
                    <div className="py-2 space-y-4">
                        {optionsLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : !anyProviderAvailable ? (
                            <p className="rounded-lg bg-gray-50 dark:bg-darkBg-main p-4 text-sm text-gray-600 dark:text-gray-400">
                                Top-up isn&apos;t available yet. Please check back soon.
                            </p>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Network</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {options!.providers.map((option) => (
                                            <button
                                                key={option.key}
                                                type="button"
                                                disabled={!option.available}
                                                onClick={() => setProvider(option.key)}
                                                className={cn(
                                                    "rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-40",
                                                    provider === option.key
                                                        ? NETWORK_STYLES[option.key]
                                                        : "border-gray-200 dark:border-darkBorder-light hover:border-gray-300"
                                                )}
                                            >
                                                {option.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile money number</label>
                                    <Input
                                        type="tel"
                                        inputMode="tel"
                                        placeholder="07X XXX XXXX"
                                        value={phone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (RWF)</label>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={minAmount}
                                        max={maxAmount}
                                        step={1}
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {QUICK_AMOUNTS.map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setAmount(String(value))}
                                                className="rounded-full border border-gray-200 dark:border-darkBorder-light px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:border-brand-green dark:hover:border-brand-gold"
                                            >
                                                {value.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
                                    <Input
                                        placeholder="e.g. Pocket money"
                                        maxLength={250}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>

                                {options?.simulation && (
                                    <p className="rounded-lg bg-amber-50 dark:bg-amber-400/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                                        Simulation mode: no real money moves. Numbers ending in <b>0000</b> are declined,{" "}
                                        <b>1111</b> have no funds, <b>9999</b> never answer; any other number succeeds.
                                    </p>
                                )}

                                {(validationError || formError) && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{validationError || formError}</p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Waiting for the payer */}
                {topUpId && status === "pending" && (
                    <div className="py-6 flex flex-col items-center text-center gap-3">
                        <div className="relative">
                            <Smartphone className="h-12 w-12 text-brand-green dark:text-brand-gold" />
                            <Loader2 className="absolute -right-2 -bottom-1 h-5 w-5 animate-spin text-gray-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Approve the payment on your phone</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {networkName} will ask {topUp?.phoneNumber ? `+${topUp.phoneNumber}` : "you"} to confirm{" "}
                                {formatCurrency(topUp?.amount ?? parsedAmount)} with your PIN.
                            </p>
                        </div>
                        {topUp?.simulated && (
                            <div className="mt-2 w-full rounded-lg border border-dashed border-amber-400 p-3">
                                <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">Simulation: answer as the payer</p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        disabled={simulating}
                                        onClick={() => handleSimulate("successful")}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        disabled={simulating}
                                        onClick={() => handleSimulate("failed")}
                                    >
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Result */}
                {topUp && status === "successful" && (
                    <div className="py-6 flex flex-col items-center text-center gap-2">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                        <p className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(topUp.amount)} added to your wallet
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">From {topUp.providerName}</p>
                    </div>
                )}
                {topUp && (status === "failed" || status === "expired") && (
                    <div className="py-6 flex flex-col items-center text-center gap-2">
                        <XCircle className="h-12 w-12 text-red-500" />
                        <p className="font-medium text-gray-900 dark:text-white">Top-up {status === "expired" ? "timed out" : "failed"}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{topUp.failureReason}</p>
                    </div>
                )}

                <DialogFooter className="flex justify-between gap-2">
                    {!topUpId ? (
                        <>
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                            >
                                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Top up {amount && !validationError ? formatCurrency(parsedAmount) : ""}
                            </Button>
                        </>
                    ) : status === "pending" ? (
                        <Button variant="outline" className="w-full" onClick={onClose}>
                            Close (we&apos;ll notify you)
                        </Button>
                    ) : status === "successful" ? (
                        <Button
                            className="w-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                            onClick={onClose}
                        >
                            Done
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onClose}>Close</Button>
                            <Button onClick={resetToForm}>Try again</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
