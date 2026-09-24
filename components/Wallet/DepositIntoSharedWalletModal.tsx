"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import PinEntry from "@/components/transfer/PinEntry"
import { PinSetupModal } from "@/components/PinSetupModal"
import { useDepositIntoSharedWalletMutation } from "@/states/sharedWalletSlice"

interface DepositIntoSharedWalletModalProps {
    isOpen: boolean
    onClose: () => void
    sharedWalletId: string
    walletName: string
    currency: string
}

export default function DepositIntoSharedWalletModal({
    isOpen,
    onClose,
    sharedWalletId,
    walletName,
    currency,
}: DepositIntoSharedWalletModalProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [amount, setAmount] = useState<string>("")
    const [note, setNote] = useState<string>("")
    const [pin, setPin] = useState("")
    const [showPin, setShowPin] = useState(false)
    const [pinError, setPinError] = useState<string>("")
    const [showPinSetup, setShowPinSetup] = useState(false)

    const [deposit, { isLoading: depositing }] = useDepositIntoSharedWalletMutation()

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
    const canProceedToPin = !isNaN(parsedAmount) && parsedAmount > 0

    const handleSubmit = async () => {
        if (pin.length !== 4) {
            setPinError("Enter your 4-digit PIN")
            return
        }
        setPinError("")

        try {
            await deposit({ sharedWalletId, amount: parsedAmount, pin, note: note || undefined }).unwrap()
            toast({ title: "Deposit complete", description: `${parsedAmount.toLocaleString()} ${currency} added to ${walletName}.` })
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
        toast({ title: "PIN Setup Complete", description: "You can now deposit." })
        setShowPinSetup(false)
    }

    return (
        <>
            <PinSetupModal open={showPinSetup} onOpenChange={setShowPinSetup} onSuccess={handlePinSetupSuccess} />

            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Deposit into {walletName}</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                            Money moves from your personal wallet immediately - no approval needed to add funds.
                        </DialogDescription>
                    </DialogHeader>

                    {step === 1 ? (
                        <div className="py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                <Input
                                    type="number"
                                    min={0}
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
                                <Button variant="ghost" onClick={() => setStep(1)} disabled={depositing}>Back</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={depositing || pin.length !== 4}
                                    className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                                >
                                    {depositing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Deposit
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
