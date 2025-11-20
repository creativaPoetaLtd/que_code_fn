"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, X, ArrowRight, Send, Wallet, AlertCircle, Loader2 } from "lucide-react"
import type { Conversation } from "@/types"
import { toast } from "@/hooks/use-toast"
import Input from "../ui/Input-ant"
import { useSendMoneyInChatMutation, useGetUserWalletBalanceQuery } from "@/states/chatSlice"
import { useChat } from "@/context/ChatContext"
import { useAuthToken } from "@/hooks/use-auth-token"
import { PinSetupModal } from "@/components/PinSetupModal"

interface SendMoneyModalProps {
    isOpen: boolean
    onClose: () => void
    recipient?: string
    currentConversation?: Conversation
}

export default function SendMoneyModal({ isOpen, onClose, recipient = "", currentConversation }: SendMoneyModalProps) {
    const { addMessage, refreshMessages, activeChat } = useChat()
    const { getUserId } = useAuthToken(false)
    const userId = getUserId()

    const [sendMoney, { isLoading: loading }] = useSendMoneyInChatMutation()
    const { data: walletData, refetch: refetchBalance } = useGetUserWalletBalanceQuery(
        { userId: userId || '' },
        { skip: !userId || !isOpen }
    )

    const [amount, setAmount] = useState<number>(0)
    const [note, setNote] = useState<string>("")
    const [step, setStep] = useState<number>(1)
    const [animateAmount, setAnimateAmount] = useState<boolean>(false)
    const [pin, setPin] = useState<string>("")
    const [showPinSetup, setShowPinSetup] = useState<boolean>(false)

    const walletBalance = walletData?.data?.balance || null
    const loadingBalance = !walletData && isOpen

    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setAmount(0)
            setNote("")
            setPin("")
            setAnimateAmount(false)
            if (userId) {
                refetchBalance()
            }
        }
    }, [isOpen, userId, refetchBalance])

    // Animation trigger for amount input
    useEffect(() => {
        if (step === 1 && isOpen) {
            setTimeout(() => setAnimateAmount(true), 300)
        }
    }, [step, isOpen])

    const handleNext = () => {
        if (step === 1 && amount > 0) {
            if (walletBalance !== null && amount > walletBalance) {
                toast({
                    title: "Insufficient Balance",
                    description: `You only have $${walletBalance.toFixed(2)} in your wallet`,
                    variant: "destructive",
                })
                return
            }
            setStep(2)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleSubmit = async () => {
        if (!pin || pin.length !== 4) {
            toast({
                title: "Error",
                description: "Please enter your 4-digit PIN",
                variant: "destructive",
            })
            return
        }

        if (!currentConversation?.id && !activeChat) {
            toast({
                title: "Error",
                description: "No active chat selected",
                variant: "destructive",
            })
            return
        }

        const chatId = currentConversation?.id || activeChat!

        try {
            const result = await sendMoney({
                chatId,
                data: { amount, pin, note }
            }).unwrap()

            if (result.success) {
                toast({
                    title: "Money Sent Successfully!",
                    description: result.message || `$${amount.toFixed(2)} sent to ${currentConversation?.name}`,
                })

                if (result.data?.message && addMessage) {
                    addMessage(result.data.message)
                }

                if (refreshMessages) {
                    refreshMessages(String(chatId))
                }

                refetchBalance()

                onClose()
            }
        } catch (error: any) {
            const errorData = error?.data || {}

            if (errorData.requiresPinSetup) {
                setShowPinSetup(true)
                toast({
                    title: "PIN Setup Required",
                    description: errorData.message || "Please set up your transaction PIN first",
                    variant: "destructive",
                })
            } else if (errorData.lockedUntil) {
                toast({
                    title: "Account Locked",
                    description: errorData.message || `Too many failed attempts. Try again in ${errorData.remainingMinutes} minutes`,
                    variant: "destructive",
                })
            } else if (errorData.attemptsRemaining !== undefined) {
                toast({
                    title: "Invalid PIN",
                    description: errorData.message || `${errorData.attemptsRemaining} attempts remaining`,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Transfer Failed",
                    description: errorData.message || "Failed to send money",
                    variant: "destructive",
                })
            }
        } finally {
            setPin("")
        }
    }

    const handlePinSetupSuccess = () => {
        toast({
            title: "PIN Setup Complete",
            description: "Your transaction PIN has been set up successfully. You can now send money.",
        })
        setShowPinSetup(false)
    }

    const renderStep1 = () => (
        <div className="flex flex-col items-center py-6">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">How much do you want to send?</h3>
                <p className="text-gray-500">Enter the amount you want to transfer</p>
            </div>

            {/* Wallet Balance Display */}
            {loadingBalance ? (
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading balance...</span>
                </div>
            ) : walletBalance !== null ? (
                <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-blue-50 rounded-lg">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                        Available: ${walletBalance.toFixed(2)}
                    </span>
                </div>
            ) : null}

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

            {walletBalance !== null && amount > walletBalance && (
                <div className="flex items-center gap-2 text-sm text-red-600 mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <span>Amount exceeds available balance</span>
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-4">
                {[10, 25, 50, 100, 200, 500].map((quickAmount) => (
                    <Button
                        key={quickAmount}
                        variant={amount === quickAmount ? "outline" : "secondary"}
                        className={`transition-all ${amount === quickAmount ? "bg-green-50 border-green-500 text-green-600" : "text-gray-700"}`}
                        onClick={() => setAmount(quickAmount)}
                        disabled={walletBalance !== null && quickAmount > walletBalance}
                    >
                        ${quickAmount}
                    </Button>
                ))}
            </div>
        </div>
    )

    const renderStep2 = () => (
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
                <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">To</span>
                    <div className="flex items-center gap-2">
                        {currentConversation?.avatar && (
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={currentConversation.avatar} />
                                <AvatarFallback>{currentConversation.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        )}
                        <span className="font-medium">{currentConversation?.name || "Recipient"}</span>
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Amount</span>
                        <span className="text-2xl font-bold text-gray-800">${amount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm font-medium mb-2 text-gray-700">Enter your PIN to confirm</p>
                <div className="flex justify-center">
                    <Input
                        type="password"
                        maxLength={4}
                        placeholder="• • • •"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-32 text-center text-xl tracking-widest"
                        autoFocus
                    />
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm font-medium mb-2 text-gray-700">Add a note (optional)</p>
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
        <>
            <PinSetupModal
                open={showPinSetup}
                onOpenChange={setShowPinSetup}
                onSuccess={handlePinSetupSuccess}
            />

            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center">
                            <div className="bg-green-100 p-2 rounded-full mr-3">
                                <DollarSign size={20} className="text-green-600" />
                            </div>
                            <DialogTitle>Send Money</DialogTitle>
                        </div>
                    </DialogHeader>

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}

                    <DialogFooter className="flex justify-between">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 1 || loading}
                            className={step === 1 ? "opacity-0" : "opacity-100 transition-opacity"}
                        >
                            Back
                        </Button>

                        {step < 2 ? (
                            <Button
                                onClick={handleNext}
                                disabled={amount <= 0 || (walletBalance !== null && amount > walletBalance)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={pin.length !== 4 || loading}
                                className="bg-green-600 hover:bg-green-700 flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} className="mr-1" />
                                        Send Money
                                    </>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
