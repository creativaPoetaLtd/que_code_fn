"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, X, ArrowRight, Send, Search } from "lucide-react"
import type { Conversation, ContactOption } from "@/types"
import { toast } from "@/hooks/use-toast"
import Input from "../ui/Input-ant"

interface SendMoneyModalProps {
    isOpen: boolean
    onClose: () => void
    recipient?: string
    currentConversation?: Conversation
}

export default function SendMoneyModal({ isOpen, onClose, recipient = "", currentConversation }: SendMoneyModalProps) {
    // State for form fields
    const [amount, setAmount] = useState<number>(0)
    const [selectedRecipient, setSelectedRecipient] = useState<string>(recipient)
    const [note, setNote] = useState<string>("")
    const [step, setStep] = useState<number>(1)
    const [searching, setSearching] = useState<boolean>(false)
    const [animateAmount, setAnimateAmount] = useState<boolean>(false)
    const [pin, setPin] = useState<string>("")

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setAnimateAmount(false)
            setSelectedRecipient(recipient)
        }
    }, [isOpen, recipient])

    // Animation trigger for amount input
    useEffect(() => {
        if (step === 1 && isOpen) {
            setTimeout(() => setAnimateAmount(true), 300)
        }
    }, [step, isOpen])

    // Mock contacts data - filter based on current conversation
    const getContacts = (): ContactOption[] => {
        // If we're in a one-on-one chat, only show that person
        if (currentConversation && !currentConversation.isGroup) {
            return [
                {
                    id: currentConversation.id,
                    name: currentConversation.name,
                    avatar: currentConversation.avatar,
                    recent: true,
                },
            ]
        }

        // Otherwise show all contacts
        return [
            { id: 1, name: "Alex Johnson", avatar: "A", recent: true },
            { id: 2, name: "Maya Rodriguez", avatar: "M", recent: true },
            { id: 3, name: "Sam Taylor", avatar: "S", recent: true },
            { id: 4, name: "Jordan Lee", avatar: "J", recent: false },
        ]
    }

    const contacts = getContacts()
    const recentContacts = contacts.filter((contact) => contact.recent)

    const handleSearch = (value: string) => {
        setSearching(value.length > 0)
        // In a real app, you would search contacts here
    }

    const handleNext = () => {
        if (step === 1 && amount > 0) {
            setStep(2)
        } else if (step === 2 && selectedRecipient) {
            setStep(3)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleSubmit = () => {
        if (!pin || pin.length !== 4) {
            toast({
                title: "Error",
                description: "Please enter your 4-digit PIN",
                variant: "destructive",
            })
            return
        }

        toast({
            title: "Money sent",
            description: `${amount.toFixed(2)} sent to ${selectedRecipient}`,
        })
        onClose()
    }

    const renderStep1 = () => (
        <div className="flex flex-col items-center py-6">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">How much do you want to send?</h3>
                <p className="text-gray-500">Enter the amount you want to transfer</p>
            </div>

            <div
                className={`relative mt-4 mb-6 transition-all duration-500 transform ${animateAmount ? "scale-110 opacity-100" : "scale-95 opacity-0"}`}
            >
                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <DollarSign size={20} className="text-gray-500" />
                </div>
                <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="pl-10 text-2xl font-bold rounded-lg h-16 w-48"
                    value={amount === 0 ? "" : amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="0.00"
                />
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4">
                {[10, 25, 50, 100, 200, 500].map((quickAmount) => (
                    <Button
                        key={quickAmount}
                        variant={amount === quickAmount ? "outline" : "secondary"}
                        className={`transition-all ${amount === quickAmount ? "bg-green-50 border-green-500 text-green-600" : "text-gray-700"}`}
                        onClick={() => setAmount(quickAmount)}
                    >
                        ${quickAmount}
                    </Button>
                ))}
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="flex flex-col py-4">
            <div className="text-center mb-4">
                <h3 className="text-xl font-semibold mb-1">Who are you sending to?</h3>
                <p className="text-gray-500">Select or search for a recipient</p>
            </div>

            {/* Only show search if we're not in a one-on-one chat */}
            {currentConversation && !currentConversation.isGroup ? (
                <div className="flex items-center justify-center mb-6">
                    <p className="text-gray-500">Sending money to:</p>
                </div>
            ) : (
                <div className="relative mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                        <Input
                            placeholder="Search name or email"
                            className="pl-10 py-2 rounded-lg"
                            onChange={(e) => {
                                handleSearch(e.target.value)
                                setSelectedRecipient(e.target.value)
                            }}
                            value={selectedRecipient}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-2 mb-6 animate-fadeIn">
                {recentContacts.map((contact) => (
                    <div
                        key={contact.id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${selectedRecipient === contact.name ? "bg-green-50 border-green-500" : "border border-gray-200"}`}
                        onClick={() => setSelectedRecipient(contact.name)}
                    >
                        {typeof contact.avatar === "string" && contact.avatar.length === 1 ? (
                            <Avatar className="mr-3">
                                <AvatarFallback>{contact.avatar}</AvatarFallback>
                            </Avatar>
                        ) : (
                            <Avatar className="mr-3">
                                <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                                <AvatarFallback>{(contact.name || 'C').charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        )}
                        <span className="font-medium">{contact.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="flex flex-col py-4">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">Review and verify</h3>
                <p className="text-gray-500">Confirm the details and enter your PIN</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">From</span>
                    <span className="font-medium">Your Account</span>
                </div>
                <div className="flex justify-center my-3">
                    <ArrowRight size={24} className="text-gray-500" />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">To</span>
                    <span className="font-medium">{selectedRecipient || "No recipient selected"}</span>
                </div>
            </div>

            <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-800">${amount.toFixed(2)}</div>
            </div>

            <div className="mb-4">
                <p className="text-sm font-medium mb-1 text-gray-700">Enter your PIN to confirm</p>
                <div className="flex justify-center">
                    <Input
                        type="password"
                        maxLength={4}
                        placeholder="• • • •"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-32 text-center text-xl tracking-widest"
                    />
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm font-medium mb-1 text-gray-700">Add a note (optional)</p>
                <Input
                    placeholder="What's this payment for?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full"
                />
            </div>
        </div>
    )

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="bg-green-100 p-2 rounded-full mr-3">
                                <DollarSign size={20} className="text-green-600" />
                            </div>
                            <DialogTitle>Send Money</DialogTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
                            <X size={18} />
                        </Button>
                    </div>
                </DialogHeader>

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                <DialogFooter className="flex justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1}
                        className={step === 1 ? "opacity-0" : "opacity-100 transition-opacity"}
                    >
                        Back
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={(step === 1 && amount <= 0) || (step === 2 && !selectedRecipient)}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={pin.length !== 4}
                            className="bg-green-600 hover:bg-green-700 flex items-center"
                        >
                            <Send size={16} className="mr-1" />
                            Send Money
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
