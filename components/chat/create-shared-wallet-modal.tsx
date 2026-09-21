"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "../ui/label"
import { WalletCards, Users, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useCreateGroupMutation } from "@/states/groupSlice"
import { useGetAcceptedContactsQuery } from "@/states/contactSlice"
import PinEntry from "@/components/transfer/PinEntry"
import { PinSetupModal } from "@/components/PinSetupModal"

interface CreateSharedWalletModalProps {
    isOpen: boolean
    onClose: () => void
    token: string | null
}

interface Contact {
    id: string
    otherUser: {
        id: string
        firstName: string
        lastName: string
        email: string
        avatar?: string
    }
}

type WithdrawalPolicy = "free" | "approval"

export default function CreateSharedWalletModal({ isOpen, onClose, token }: CreateSharedWalletModalProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [walletName, setWalletName] = useState<string>("")
    const [selectedContacts, setSelectedContacts] = useState<string[]>([])
    const [withdrawalPolicy, setWithdrawalPolicy] = useState<WithdrawalPolicy>("approval")
    const [pin, setPin] = useState("")
    const [showPin, setShowPin] = useState(false)
    const [pinError, setPinError] = useState<string>("")
    const [showPinSetup, setShowPinSetup] = useState(false)

    const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation()
    const { data: contactsData, isLoading: isLoadingContacts } = useGetAcceptedContactsQuery(token!, {
        skip: !token || !isOpen,
    })

    const contacts: Contact[] = contactsData?.contacts || []

    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setWalletName("")
            setSelectedContacts([])
            setWithdrawalPolicy("approval")
            setPin("")
            setPinError("")
        }
    }, [isOpen])

    const toggleContact = (userId: string) => {
        setSelectedContacts((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        )
    }

    const canProceedToPin = walletName.trim().length >= 2 && selectedContacts.length >= 1

    const handleClose = () => {
        onClose()
    }

    const handleSubmit = async () => {
        if (pin.length !== 4) {
            setPinError("Enter your 4-digit PIN")
            return
        }
        if (!token) {
            toast({ title: "Error", description: "You must be logged in to create a shared wallet", variant: "destructive" })
            return
        }

        setPinError("")

        try {
            const result = await createGroup({
                groupData: {
                    name: walletName.trim(),
                    privacyType: "private",
                    hasFundraising: false,
                    hasSharedWallet: true,
                    withdrawalPolicy,
                    memberIds: selectedContacts,
                    pin,
                },
                token,
            }).unwrap()

            toast({ title: "Shared wallet created", description: result.message || `${walletName.trim()} is ready — RWF 0 to start.` })
            handleClose()
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
                setPinError(errorData.message || "Failed to create shared wallet")
            }
            setPin("")
        }
    }

    const handlePinSetupSuccess = () => {
        toast({ title: "PIN Setup Complete", description: "You can now create a shared wallet." })
        setShowPinSetup(false)
    }

    return (
        <>
            <PinSetupModal open={showPinSetup} onOpenChange={setShowPinSetup} onSuccess={handlePinSetupSuccess} />

            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center">
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full mr-3">
                                <WalletCards size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <DialogTitle>Create Shared Wallet</DialogTitle>
                        </div>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                            A wallet 2 or more people can put money into and take it out of
                        </DialogDescription>
                    </DialogHeader>

                    {step === 1 ? (
                        <div className="py-4 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Wallet Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    placeholder="e.g. Rent, Trip Fund, Family Wallet"
                                    value={walletName}
                                    onChange={(e) => setWalletName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Withdrawal Policy
                                </label>
                                <RadioGroup value={withdrawalPolicy} onValueChange={(value: WithdrawalPolicy) => setWithdrawalPolicy(value)}>
                                    <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="free" id="policy-free" className="mt-0.5" />
                                        <Label htmlFor="policy-free" className="text-sm">
                                            <span className="font-medium">Anyone can withdraw freely</span>
                                            <span className="text-gray-500 block text-xs">Any member can take money out immediately, no approval needed</span>
                                        </Label>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="approval" id="policy-approval" className="mt-0.5" />
                                        <Label htmlFor="policy-approval" className="text-sm">
                                            <span className="font-medium">Withdrawals need another member's approval</span>
                                            <span className="text-gray-500 block text-xs">A majority of the other members must approve before money moves</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                                <p className="text-xs text-gray-400">This can&apos;t be changed after the wallet is created.</p>
                            </div>

                            <div>
                                <Separator className="my-4" />
                                <div className="flex items-center mb-2">
                                    <Users size={16} className="mr-2" />
                                    <span className="font-medium text-sm">Members ({selectedContacts.length} selected)</span>
                                </div>

                                {isLoadingContacts ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Loading contacts...
                                    </div>
                                ) : contacts.length === 0 ? (
                                    <div className="text-center py-4 text-sm text-gray-500">No contacts available. Add some contacts first.</div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                                        {contacts.map((contact) => (
                                            <div key={contact.id} className="flex items-center py-2">
                                                <Checkbox
                                                    id={`shared-wallet-contact-${contact.id}`}
                                                    checked={selectedContacts.includes(contact.otherUser.id)}
                                                    onCheckedChange={() => toggleContact(contact.otherUser.id)}
                                                    className="mr-2"
                                                />
                                                <label
                                                    htmlFor={`shared-wallet-contact-${contact.id}`}
                                                    className="flex items-center cursor-pointer flex-1"
                                                    onClick={() => toggleContact(contact.otherUser.id)}
                                                >
                                                    <Avatar className="h-8 w-8 mr-2">
                                                        <AvatarImage
                                                            src={contact.otherUser.avatar || "/placeholder.svg"}
                                                            alt={`${contact.otherUser.firstName} ${contact.otherUser.lastName}`}
                                                        />
                                                        <AvatarFallback>
                                                            {(contact.otherUser.firstName || '').charAt(0).toUpperCase()}
                                                            {(contact.otherUser.lastName || '').charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <span className="font-medium text-sm">
                                                            {contact.otherUser.firstName} {contact.otherUser.lastName}
                                                        </span>
                                                        <div className="text-xs text-gray-500">{contact.otherUser.email}</div>
                                                    </div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                <Button variant="outline" onClick={handleClose}>Cancel</Button>
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
                                <Button variant="ghost" onClick={() => setStep(1)} disabled={isCreating}>Back</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isCreating || pin.length !== 4}
                                    className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                                >
                                    {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Create Shared Wallet
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
