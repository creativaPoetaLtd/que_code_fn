"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, X, ArrowRight, Send, Wallet, AlertCircle, Loader2, Lock, CalendarClock } from "lucide-react"
import type { Conversation } from "@/types"
import { toast } from "@/hooks/use-toast"
import Input from "../ui/Input-ant"
import { useSendMoneyInChatMutation, useGetUserWalletBalanceQuery } from "@/states/chatSlice"
import { useCreateEscrowMutation } from "@/states/escrowSlice"
import { useChat } from "@/context/ChatContext"
import { useAuthToken } from "@/hooks/use-auth-token"
import { PinSetupModal } from "@/components/PinSetupModal"
import SchedulePicker, { ScheduleState, defaultScheduleState } from "@/components/transfer/SchedulePicker"
import { scheduleTransfer } from "@/helpers/api"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatCurrency } from "@/utils/currency"

type SendMode = "now" | "hold" | "schedule"

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
    const [createEscrow, { isLoading: escrowLoading }] = useCreateEscrowMutation()
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
    const [mode, setMode] = useState<SendMode>("now")
    const [releaseMode, setReleaseMode] = useState<"manual" | "auto_timeout">("manual")
    const [autoReleaseDays, setAutoReleaseDays] = useState<number>(3)
    const [schedule, setSchedule] = useState<ScheduleState>(defaultScheduleState)
    const [notifyRecipientNow, setNotifyRecipientNow] = useState<boolean>(false)
    const [scheduling, setScheduling] = useState<boolean>(false)

    const submitting = loading || escrowLoading || scheduling
    // currentConversation is typed as the legacy Group|Contact union, but callers actually pass
    // the richer chat object (cast `as any` at the call site) - participants lives there at runtime.
    const payeeUserId = (currentConversation as any)?.participants?.find((p: { userId: string }) => p.userId !== userId)?.userId

    // Derived from `mode` so handleSubmit's existing branching (which reads these two
    // flags) doesn't need to change - the tabs are just a cleaner way to set them.
    const holdUntilConfirmed = mode === "hold"

    const handleModeChange = (next: SendMode) => {
        setMode(next)
        setSchedule((prev) => ({ ...prev, enabled: next === "schedule" }))
    }

    const walletBalance = walletData?.data?.balance || null
    const loadingBalance = !walletData && isOpen

    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setAmount(0)
            setNote("")
            setPin("")
            setAnimateAmount(false)
            setMode("now")
            setReleaseMode("manual")
            setAutoReleaseDays(3)
            setSchedule(defaultScheduleState)
            setNotifyRecipientNow(false)
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
                    description: `You only have ${formatCurrency(walletBalance)} in your wallet`,
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

        if (holdUntilConfirmed && !payeeUserId) {
            toast({
                title: "Error",
                description: "Escrow holds are only available in direct chats right now",
                variant: "destructive",
            })
            return
        }

        try {
            if (schedule.enabled && payeeUserId) {
                setScheduling(true)
                const scheduledDateTime = new Date(`${schedule.date}T${schedule.time}`)
                const recurrence = schedule.recurrence.frequency !== "none"
                    ? {
                        frequency: schedule.recurrence.frequency,
                        interval: schedule.recurrence.interval,
                        ...(schedule.recurrence.endMode === "date" && schedule.recurrence.endDate
                            ? { endDate: schedule.recurrence.endDate }
                            : {}),
                        ...(schedule.recurrence.endMode === "count"
                            ? { maxOccurrences: schedule.recurrence.maxOccurrences }
                            : {}),
                    }
                    : undefined

                const result = await scheduleTransfer({
                    receiverUserId: payeeUserId,
                    amount,
                    description: note,
                    pin,
                    scheduledFor: scheduledDateTime.toISOString(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    recurrence,
                    notifyRecipientNow,
                })

                if (result.success) {
                    toast({
                        title: "Payment Scheduled",
                        description: result.message || `${formatCurrency(amount)} will be sent to ${currentConversation?.name} on ${scheduledDateTime.toLocaleDateString()}`,
                    })

                    refetchBalance()
                    onClose()
                }
            } else if (holdUntilConfirmed && payeeUserId) {
                const autoReleaseAt = releaseMode === "auto_timeout"
                    ? new Date(Date.now() + autoReleaseDays * 24 * 60 * 60 * 1000).toISOString()
                    : undefined

                const result = await createEscrow({
                    chatId,
                    payeeUserId,
                    amount,
                    description: note,
                    releaseMode,
                    autoReleaseAt,
                    pin,
                }).unwrap()

                if (result.success) {
                    toast({
                        title: "Funds Held in Escrow",
                        description: result.message || `${formatCurrency(amount)} is held until you release it to ${currentConversation?.name}`,
                    })

                    if (result.chatMessage && addMessage) {
                        addMessage(result.chatMessage)
                    }

                    if (refreshMessages) {
                        refreshMessages(String(chatId))
                    }

                    refetchBalance()
                    onClose()
                }
            } else {
                const result = await sendMoney({
                    chatId,
                    data: { amount, pin, note }
                }).unwrap()

                if (result.success) {
                    const actionText = currentConversation?.isGroup ? 'donated' : 'sent';
                    toast({
                        title: currentConversation?.isGroup ? "Donation Sent Successfully!" : "Money Sent Successfully!",
                        description: result.message || `${formatCurrency(amount)} ${actionText} to ${currentConversation?.name}`,
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
            }
        } catch (error: any) {
            const errorData = error?.data || error?.response?.data || {}

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
            setScheduling(false)
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
                <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">
                    {currentConversation?.isGroup ? 'How much do you want to donate?' : 'How much do you want to send?'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    {currentConversation?.isGroup
                        ? 'Enter the amount you want to contribute'
                        : 'Enter the amount you want to transfer'}
                </p>
            </div>

            {/* Wallet Balance Display */}
            {loadingBalance ? (
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading balance...</span>
                </div>
            ) : walletBalance !== null ? (
                <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-brand-green/10 dark:bg-brand-gold/10 rounded-lg">
                    <Wallet className="h-4 w-4 text-brand-green dark:text-brand-gold" />
                    <span className="text-sm font-medium text-brand-green dark:text-brand-gold">
                        Available: {formatCurrency(walletBalance)}
                    </span>
                </div>
            ) : null}

            <div
                className={`relative mt-4 mb-6 transition-all duration-500 transform ${animateAmount ? "scale-110 opacity-100" : "scale-95 opacity-0"}`}
            >
                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">RWF</span>
                </div>
                <Input
                    type="number"
                    min={0}
                    step={1}
                    className="pl-14 text-2xl font-bold rounded-lg h-16 w-56"
                    value={amount === 0 ? "" : amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="0"
                />
            </div>

            {walletBalance !== null && amount > walletBalance && (
                <div className="flex items-center gap-2 text-sm text-red-600 mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <span>Amount exceeds available balance</span>
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-4">
                {[1000, 2000, 5000, 10000, 20000, 50000].map((quickAmount) => (
                    <Button
                        key={quickAmount}
                        variant={amount === quickAmount ? "outline" : "secondary"}
                        className={`transition-all ${amount === quickAmount ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}
                        onClick={() => setAmount(quickAmount)}
                        disabled={walletBalance !== null && quickAmount > walletBalance}
                    >
                        {formatCurrency(quickAmount)}
                    </Button>
                ))}
            </div>

            {!currentConversation?.isGroup && payeeUserId && (
                <div className="w-full mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <Tabs value={mode} onValueChange={(v) => handleModeChange(v as SendMode)}>
                        <TabsList className="w-full grid grid-cols-3 h-auto bg-gray-100 dark:bg-darkBg-interactive border-gray-200 dark:border-darkBorder-light">
                            <TabsTrigger
                                value="now"
                                className="whitespace-normal text-center leading-tight text-xs sm:text-sm px-1.5 py-2 sm:px-3 text-gray-600 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-card"
                            >
                                Send now
                            </TabsTrigger>
                            <TabsTrigger
                                value="hold"
                                className="whitespace-normal text-center leading-tight text-xs sm:text-sm px-1.5 py-2 sm:px-3 text-gray-600 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-card"
                            >
                                <span className="sm:hidden">Hold</span>
                                <span className="hidden sm:inline">Hold until confirmed</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="schedule"
                                className="whitespace-normal text-center leading-tight text-xs sm:text-sm px-1.5 py-2 sm:px-3 text-gray-600 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-card"
                            >
                                <span className="sm:hidden">Schedule</span>
                                <span className="hidden sm:inline">Schedule for later</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="hold" className="space-y-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Money leaves your spendable balance now but only reaches {currentConversation?.name || "the recipient"} when you release it.
                            </p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        name="releaseMode"
                                        checked={releaseMode === "manual"}
                                        onChange={() => setReleaseMode("manual")}
                                    />
                                    Release manually, whenever I confirm
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        name="releaseMode"
                                        checked={releaseMode === "auto_timeout"}
                                        onChange={() => setReleaseMode("auto_timeout")}
                                    />
                                    Auto-release after
                                    <Input
                                        type="number"
                                        min={1}
                                        max={90}
                                        value={autoReleaseDays}
                                        onChange={(e) => setAutoReleaseDays(Number(e.target.value))}
                                        onFocus={() => setReleaseMode("auto_timeout")}
                                        className="w-16 h-8 text-center"
                                    />
                                    days
                                </label>
                            </div>
                        </TabsContent>

                        <TabsContent value="schedule" className="space-y-3">
                            <SchedulePicker
                                schedule={schedule}
                                onChange={setSchedule}
                                minDate={new Date().toISOString().split("T")[0]}
                                hideModeToggle
                            />
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={notifyRecipientNow}
                                    onChange={(e) => setNotifyRecipientNow(e.target.checked)}
                                />
                                Let {currentConversation?.name || "them"} know now, before it sends
                            </label>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    )

    const renderStep2 = () => (
        <div className="flex flex-col py-4">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Review and verify</h3>
                <p className="text-gray-500 dark:text-gray-400">Confirm the details and enter your PIN</p>
            </div>

            {holdUntilConfirmed && payeeUserId && (
                <div className="flex items-start gap-2 mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
                    <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                        This will be held in escrow, not sent right away.{" "}
                        {releaseMode === "auto_timeout"
                            ? `It auto-releases in ${autoReleaseDays} day${autoReleaseDays === 1 ? "" : "s"} unless you cancel or dispute it first.`
                            : "You'll need to release it manually once you're satisfied."}
                    </span>
                </div>
            )}

            <div className="bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-4 mb-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600 dark:text-gray-400">From</span>
                    <span className="font-medium text-gray-900 dark:text-white">Your Account</span>
                </div>
                <div className="flex justify-center my-3">
                    <ArrowRight size={24} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600 dark:text-gray-400">To</span>
                    <div className="flex items-center gap-2">
                        {currentConversation?.avatar && (
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={currentConversation.avatar} />
                                <AvatarFallback>{currentConversation.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">{currentConversation?.name || "Recipient"}</span>
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Amount</span>
                        <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white text-right break-words">{formatCurrency(amount)}</span>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Enter your PIN to confirm</p>
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
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Add a note (optional)</p>
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
                <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center">
                            <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full mr-3">
                                <DollarSign size={20} className="text-brand-green dark:text-brand-gold" />
                            </div>
                            <DialogTitle className="text-gray-900 dark:text-white text-xl font-semibold">{currentConversation?.isGroup ? 'Donate to Group' : 'Send Money'}</DialogTitle>
                        </div>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                            {currentConversation?.isGroup ? 'Contribute to group fundraising' : 'Transfer money to recipient'}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}

                    <DialogFooter className="flex justify-between">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 1 || submitting}
                            className={step === 1 ? "opacity-0" : "opacity-100 transition-opacity"}
                        >
                            Back
                        </Button>

                        {step < 2 ? (
                            <Button
                                onClick={handleNext}
                                disabled={amount <= 0 || (walletBalance !== null && amount > walletBalance)}
                                className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={pin.length !== 4 || submitting}
                                className="flex items-center bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : schedule.enabled && payeeUserId ? (
                                    <>
                                        <CalendarClock size={16} className="mr-1" />
                                        Schedule
                                    </>
                                ) : holdUntilConfirmed && payeeUserId ? (
                                    <>
                                        <Lock size={16} className="mr-1" />
                                        Hold Funds
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} className="mr-1" />
                                        {currentConversation?.isGroup ? 'Donate' : 'Send Money'}
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
