"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import Input from "../ui/Input-ant"
import { Button } from "@/components/ui/button"
import { DollarSign, Loader2, Pencil, Lock, QrCode } from "lucide-react"
import type { Conversation } from "@/types/chat.types"
import { toast } from "@/hooks/use-toast"
import { useAuthToken } from "@/hooks/use-auth-token"
import { getCurrentUserId } from "@/utils/tokenUtils"
import { useSendMessageMutation } from "@/states/chatSlice"
import axios from "axios"
import baseUrl from "@/helpers/baseUrl"
import RequestQRModal from "@/components/payments/RequestQRModal"

interface RequestMoneyModalProps {
    isOpen: boolean
    onClose: () => void
    conversation?: Conversation
}

export default function RequestMoneyModal({ isOpen, onClose, conversation }: RequestMoneyModalProps) {
    const { getToken } = useAuthToken()
    const currentUserId = getCurrentUserId()
    const [sendMessageHttp] = useSendMessageMutation()

    const [amount, setAmount] = useState<string>("")
    const [note, setNote] = useState<string>("")
    const [allowEditAmount, setAllowEditAmount] = useState(false)
    const [recipientId, setRecipientId] = useState<string>("")
    const [recipientName, setRecipientName] = useState<string>("Recipient")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [createdRequestId, setCreatedRequestId] = useState<string | null>(null)
    const [showQRModal, setShowQRModal] = useState(false)

    useEffect(() => {
        if (!isOpen || !conversation || conversation.isGroup) return

        const otherParticipant = (conversation.participants || []).find((p: any) => {
            const id = p?.userId || p?.user?.id || p?.id
            return id && id !== currentUserId
        }) as any

        const user = otherParticipant?.user || otherParticipant
        const id = otherParticipant?.userId || user?.id || ""
        const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Recipient"

        setRecipientId(id)
        setRecipientName(name)
    }, [isOpen, conversation, currentUserId])

    useEffect(() => {
        if (isOpen) {
            setAmount("")
            setNote("")
            setAllowEditAmount(false)
            setCreatedRequestId(null)
            setShowQRModal(false)
        }
    }, [isOpen])

    const handleSubmit = async () => {
        if (!conversation?.id) {
            toast({
                title: "Error",
                description: "No active conversation found",
                variant: "destructive",
            })
            return
        }

        if (conversation.isGroup) {
            toast({
                title: "Not supported yet",
                description: "Request Money currently works in direct chats only.",
                variant: "destructive",
            })
            return
        }

        if (!amount || !recipientId) {
            toast({
                title: "Error",
                description: "Please enter an amount",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        try {
            const authToken = getToken()
            const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {}

            const amountVal = Number(amount)

            // Step 1: Create the PaymentRequest record
            const requestResponse = await axios.post(`${baseUrl}/transactions/request`, {
                recipientId,
                amount: amountVal,
                note,
                allowEditAmount,
                currency: "RWF"
            }, { headers })

            const responseData = requestResponse?.data?.data || requestResponse?.data
            const requestId = responseData?.id

            if (!requestId) {
                throw new Error("Failed to get request ID from server")
            }

            // Step 2: Send the money request as a chat message via HTTP (reliable, no socket dependency)
            const chatPayload = {
                type: "money_request",
                requestId,
                amount: amountVal,
                currency: "RWF",
                note: note || "",
                status: "pending",
                allowEditAmount,
                senderId: currentUserId,
                recipientId,
                recipientName,
                timestamp: new Date().toISOString()
            }

            await sendMessageHttp({
                chatId: conversation.id,
                content: JSON.stringify(chatPayload),
                messageType: "money"
            }).unwrap()

            setCreatedRequestId(requestId)
            toast({
                title: "Money requested",
                description: `Request sent to ${recipientName}.`,
            })
        } catch (error: any) {
            console.error("Request error:", error)
            toast({
                title: "Request failed",
                description: error.response?.data?.message || error?.data?.message || "There was an error sending the request.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
    <>
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && !createdRequestId && onClose()}>
            <DialogContent className="sm:max-w-md dark:bg-darkBg-card dark:border-darkBorder-light">
                <DialogHeader>
                    <div className="flex items-center">
                        <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full mr-3">
                            <DollarSign size={20} className="text-brand-green dark:text-brand-gold" />
                        </div>
                        <DialogTitle className="text-gray-900 dark:text-white text-xl font-semibold">Request Money</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                        {conversation ? "Request payment from chat participants." : "Select a contact to request payment from."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">Amount</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">RWF</span>
                            </div>
                            <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                className="pl-12 dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">Recipient</label>
                        <div className="rounded-xl border border-gray-100 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-overlay p-3">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{recipientName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Direct chat request</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">Note (Optional)</label>
                        <Input
                            placeholder="What's this request for?"
                            className="dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setAllowEditAmount(v => !v)}
                        disabled={isSubmitting}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                            allowEditAmount
                                ? 'bg-brand-green/10 dark:bg-brand-gold/10 border-brand-green/30 dark:border-brand-gold/30'
                                : 'bg-gray-50 dark:bg-darkBg-interactive border-gray-200 dark:border-darkBorder-light'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {allowEditAmount
                                ? <Pencil size={15} className="text-brand-green dark:text-brand-gold" />
                                : <Lock size={15} className="text-gray-400" />
                            }
                            <div className="text-left">
                                <p className={`text-sm font-medium ${allowEditAmount ? 'text-brand-green dark:text-brand-gold' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {allowEditAmount ? 'Amount is negotiable' : 'Amount is fixed'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {allowEditAmount ? 'Receiver can pay a different amount' : 'Receiver must pay exactly this amount'}
                                </p>
                            </div>
                        </div>
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${allowEditAmount ? 'bg-brand-green dark:bg-brand-gold' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowEditAmount ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                    </button>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                    {createdRequestId ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                            >
                                Done
                            </Button>
                            <Button
                                onClick={() => setShowQRModal(true)}
                                className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                            >
                                <QrCode className="mr-2 h-4 w-4" />
                                Share QR
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!amount || !recipientId || isSubmitting}
                                className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main min-w-[120px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Request"
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {createdRequestId && (
            <RequestQRModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                requestId={createdRequestId}
            />
        )}
    </>
    )
}
