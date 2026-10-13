"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import PinEntry from "@/components/transfer/PinEntry"
import { PinSetupModal } from "@/components/PinSetupModal"

interface SharePinDialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description: string
    confirmLabel: string
    /** Extra options shown above the PIN pad (e.g. the "ask them to pay me back" checkbox). */
    children?: React.ReactNode
    /** Should reject with the RTK error so a missing PIN can open the setup modal. */
    onConfirm: (pin: string) => Promise<void>
}

export default function SharePinDialog({
    isOpen,
    onClose,
    title,
    description,
    confirmLabel,
    children,
    onConfirm,
}: SharePinDialogProps) {
    const [pin, setPin] = useState("")
    const [showPin, setShowPin] = useState(false)
    const [pinError, setPinError] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [showPinSetup, setShowPinSetup] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setPin("")
            setPinError("")
        }
    }, [isOpen])

    const handleConfirm = async () => {
        if (pin.length !== 4) {
            setPinError("Enter your 4-digit PIN")
            return
        }
        setPinError("")
        setSubmitting(true)
        try {
            await onConfirm(pin)
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
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <PinSetupModal
                open={showPinSetup}
                onOpenChange={setShowPinSetup}
                onSuccess={() => {
                    toast({ title: "PIN Setup Complete", description: "Enter your PIN to continue." })
                    setShowPinSetup(false)
                }}
            />

            <Dialog open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    {children}

                    <PinEntry pin={pin} setPin={setPin} showPin={showPin} setShowPin={setShowPin} error={pinError} />

                    <DialogFooter className="flex justify-between">
                        <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={submitting || pin.length !== 4}
                            className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                        >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {confirmLabel}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
