"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import PinEntry from "@/components/transfer/PinEntry"
import { PinSetupModal } from "@/components/PinSetupModal"
import {
    useWithdrawFromSharedWalletMutation,
    useProposeSharedWalletWithdrawalMutation,
} from "@/states/sharedWalletSlice"

interface WithdrawFromSharedWalletModalProps {
    isOpen: boolean
    onClose: () => void
    sharedWalletId: string
    walletName: string
    balance: number
    currency: string
    withdrawalPolicy: 'free' | 'approval'
}

export default function WithdrawFromSharedWalletModal({
    isOpen,
    onClose,
    sharedWalletId,
    walletName,
    balance,
    currency,
    withdrawalPolicy,
}: WithdrawFromSharedWalletModalProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [amount, setAmount] = useState<string>("")
    const [note, setNote] = useState<string>("")
    const [pin, setPin] = useState("")
    const [showPin, setShowPin] = useState(false)
    const [pinError, setPinError] = useState<string>("")
    const [showPinSetup, setShowPinSetup] = useState(false)

    const [withdrawFree, { isLoading: withdrawing }] = useWithdrawFromSharedWalletMutation()
    const [proposeWithdrawal, { isLoading: proposing }] = useProposeSharedWalletWithdrawalMutation()
    const submitting = withdrawing || proposing

    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setAmount("")
            setNote("")
            setPin("")
            setPinError("")
        }
    }, [isOpen])

    const parsedAmount = parseFloat(amount)
    const canProceedToPin = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= balance

    const handleSubmit = async () => {
        if (pin.length !== 4) {
            setPinError("Enter your 4-digit PIN")
            return
        }
        setPinError("")

        try {
            if (withdrawalPolicy === "free") {
                await withdrawFree({ sharedWalletId, amount: parsedAmount, pin, note: note || undefined }).unwrap()
                toast({ title: "Withdrawal complete", description: `RWF ${parsedAmount.toLocaleString()} moved to your wallet.` })
            } else {
                await proposeWithdrawal({ sharedWalletId, amount: parsedAmount, pin, note: note || undefined }).unwrap()
                toast({ title: "Withdrawal requested", description: "Waiting for another member to approve." })
            }
            onClose()
        } catch (error: any) {
            const errorData = error?.data || {}
            if (errorData.requiresPinSetup) {
                setShowPinSetup(true)
                toast({
                    title: "PIN Setup Required",
                    description: errorData.message || "Please set up your transaction PIN first",
                    variant: "destructive",
                })
            } else {
                setPinError(errorData.message || "Something went wrong")
            }
            setPin("")
        }
    }

    const handlePinSetupSuccess = () => {
        toast({ title: "PIN Setup Complete", description: "You can now withdraw." })
        setShowPinSetup(false)
    }

    return (
        <>
            <PinSetupModal open={showPinSetup} onOpenChange={setShowPinSetup} onSuccess={handlePinSetupSuccess} />

            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Withdraw from {walletName}</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                            {withdrawalPolicy === "free"
                                ? "Money moves to your personal wallet immediately."
                                : "This will post a request in the chat — a majority of other members must approve before money moves."}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 1 ? (
                        <div className="py-4 space-y-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Available: {balance.toLocaleString()} {currency}
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={balance}
                                    step={0.01}
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
                                <Input
                                    placeholder="What's this for?"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="py-2">
                            <PinEntry pin={pin} setPin={setPin} showPin={showPin} setShowPin={setShowPin} error={pinError} />
                        </div>
                    )}

                    <DialogFooter className="flex justify-between">
                        {step === 1 ? (
                            <>
                                <Button variant="outline" onClick={onClose}>Cancel</Button>
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!canProceedToPin}
                                    className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                                >
                                    Next
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={() => setStep(1)} disabled={submitting}>Back</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting || pin.length !== 4}
                                    className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                                >
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    {withdrawalPolicy === "free" ? "Withdraw" : "Request Withdrawal"}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
