"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users, Loader2, CalendarClock, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuthToken } from "@/hooks/use-auth-token"
import { useGetAcceptedContactsQuery } from "@/states/contactSlice"
import { useGetUserWalletBalanceQuery } from "@/states/chatSlice"
import { createBatchTransfer, createScheduledBatchTransfer } from "@/helpers/api"
import BatchRecipientRow, { BatchContact } from "@/components/transfer/BatchRecipientRow"
import BatchResultsList, { BatchResultEntry } from "@/components/transfer/BatchResultsList"
import PinEntry from "@/components/transfer/PinEntry"
import SchedulePicker, { ScheduleState, defaultScheduleState } from "@/components/transfer/SchedulePicker"
import { PinSetupModal } from "@/components/PinSetupModal"
import { formatCurrency } from "@/utils/currency"

interface SendMoneyBatchModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function SendMoneyBatchModal({ isOpen, onClose }: SendMoneyBatchModalProps) {
    const { getToken, getUserId } = useAuthToken(false)
    const token = getToken()
    const userId = getUserId()

    const { data: contactsData, isLoading: loadingContacts } = useGetAcceptedContactsQuery(token || "", {
        skip: !token || !isOpen,
    })
    const { data: walletData, refetch: refetchBalance } = useGetUserWalletBalanceQuery(
        { userId: userId || "" },
        { skip: !userId || !isOpen }
    )

    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [amounts, setAmounts] = useState<Record<string, string>>({})
    const [schedule, setSchedule] = useState<ScheduleState>(defaultScheduleState)
    const [notifyRecipientNow, setNotifyRecipientNow] = useState<boolean>(false)
    const [pin, setPin] = useState("")
    const [showPin, setShowPin] = useState(false)
    const [pinError, setPinError] = useState<string>("")
    const [submitting, setSubmitting] = useState(false)
    const [showPinSetup, setShowPinSetup] = useState(false)
    const [results, setResults] = useState<BatchResultEntry[]>([])

    const walletBalance = walletData?.data?.balance ?? null

    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setSelectedIds(new Set())
            setAmounts({})
            setSchedule(defaultScheduleState)
            setNotifyRecipientNow(false)
            setPin("")
            setPinError("")
            setResults([])
            if (userId) refetchBalance()
        }
    }, [isOpen, userId, refetchBalance])

    const contacts: BatchContact[] = useMemo(
        () =>
            (contactsData?.contacts || []).map((c) => ({
                id: c.otherUser.id,
                name: `${c.otherUser.firstName} ${c.otherUser.lastName}`.trim(),
                phone: c.otherUser.phone || "",
                avatar: c.otherUser.profile?.profileImage || null,
            })),
        [contactsData]
    )

    const contactsById = useMemo(() => {
        const map: Record<string, BatchContact> = {}
        for (const c of contacts) map[c.id] = c
        return map
    }, [contacts])

    const toggleRecipient = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const totalAmount = Array.from(selectedIds).reduce((sum, id) => sum + (parseFloat(amounts[id]) || 0), 0)

    const canProceedToPin =
        selectedIds.size > 0 &&
        Array.from(selectedIds).every((id) => parseFloat(amounts[id]) > 0) &&
        (walletBalance === null || totalAmount <= walletBalance) &&
        (!schedule.enabled || (schedule.date && schedule.time))

    const buildRecurrence = () =>
        schedule.recurrence.frequency !== "none"
            ? {
                frequency: schedule.recurrence.frequency,
                interval: schedule.recurrence.interval,
                ...(schedule.recurrence.endMode === "date" && schedule.recurrence.endDate
                    ? { endDate: schedule.recurrence.endDate }
                    : {}),
                ...(schedule.recurrence.endMode === "count" ? { maxOccurrences: schedule.recurrence.maxOccurrences } : {}),
            }
            : undefined

    const handleSubmit = async () => {
        if (pin.length !== 4) {
            setPinError("Enter your 4-digit PIN")
            return
        }

        const recipients = Array.from(selectedIds).map((id) => ({
            receiverUserId: id,
            amount: parseFloat(amounts[id]),
        }))

        setSubmitting(true)
        setPinError("")

        try {
            let result: any
            if (schedule.enabled) {
                const scheduledDateTime = new Date(`${schedule.date}T${schedule.time}`)
                result = await createScheduledBatchTransfer({
                    senderUserId: userId || undefined,
                    recipients,
                    pin,
                    scheduledFor: scheduledDateTime.toISOString(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    recurrence: buildRecurrence(),
                    notifyRecipientNow,
                })
            } else {
                result = await createBatchTransfer({ senderUserId: userId || undefined, recipients, pin })
            }

            if (result.success) {
                setResults(result.data.results || [])
                setStep(3)
                refetchBalance()
            }
        } catch (error: any) {
            const errorData = error?.response?.data || {}
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

    const handlePinSetupSuccess = () => {
        toast({ title: "PIN Setup Complete", description: "You can now send money." })
        setShowPinSetup(false)
    }

    const renderRecipients = () => (
        <div className="flex flex-col py-2">
            <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Send to multiple people</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Pick recipients and set an amount for each
                </p>
            </div>

            {walletBalance !== null && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-4 py-2 mb-3 bg-brand-green/10 dark:bg-brand-gold/10 rounded-lg text-sm">
                    <span className="text-brand-green dark:text-brand-gold font-medium">Available: {formatCurrency(walletBalance)}</span>
                    <span className="text-gray-600 dark:text-gray-300">Selected total: {formatCurrency(totalAmount)}</span>
                </div>
            )}

            {walletBalance !== null && totalAmount > walletBalance && (
                <div className="flex items-center gap-2 text-sm text-red-600 mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <span>Total exceeds available balance</span>
                </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {loadingContacts ? (
                    <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading contacts...
                    </div>
                ) : contacts.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">No contacts yet to send money to.</p>
                ) : (
                    contacts.map((contact) => (
                        <BatchRecipientRow
                            key={contact.id}
                            contact={contact}
                            isSelected={selectedIds.has(contact.id)}
                            amount={amounts[contact.id] || ""}
                            onToggle={() => toggleRecipient(contact.id)}
                            onAmountChange={(value) => setAmounts((prev) => ({ ...prev, [contact.id]: value }))}
                        />
                    ))
                )}
            </div>

            <div className="w-full mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center gap-1.5 font-medium text-sm text-gray-900 dark:text-white mb-2">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Schedule for later
                </div>
                <SchedulePicker
                    schedule={schedule}
                    onChange={setSchedule}
                    minDate={new Date().toISOString().split("T")[0]}
                />
                {schedule.enabled && (
                    <label className="flex items-center gap-2 mt-3 text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={notifyRecipientNow}
                            onChange={(e) => setNotifyRecipientNow(e.target.checked)}
                        />
                        Let each recipient know now, before it sends
                    </label>
                )}
            </div>
        </div>
    )

    const renderPin = () => (
        <div className="flex flex-col py-2">
            <PinEntry pin={pin} setPin={setPin} showPin={showPin} setShowPin={setShowPin} error={pinError} />
        </div>
    )

    const renderResults = () => (
        <div className="flex flex-col py-2">
            <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {schedule.enabled ? "Scheduled" : "Sent"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {results.filter((r) => r.status === "success").length} of {results.length} succeeded
                </p>
            </div>
            <div className="max-h-72 overflow-y-auto">
                <BatchResultsList results={results} contactsById={contactsById} />
            </div>
        </div>
    )

    return (
        <>
            <PinSetupModal open={showPinSetup} onOpenChange={setShowPinSetup} onSuccess={handlePinSetupSuccess} />

            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center">
                            <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full mr-3">
                                <Users size={20} className="text-brand-green dark:text-brand-gold" />
                            </div>
                            <DialogTitle className="text-gray-900 dark:text-white text-xl font-semibold">
                                Send to Multiple
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                            Send money to several people in one go
                        </DialogDescription>
                    </DialogHeader>

                    {step === 1 && renderRecipients()}
                    {step === 2 && renderPin()}
                    {step === 3 && renderResults()}

                    <DialogFooter className="flex justify-between">
                        {step === 3 ? (
                            <Button onClick={onClose} className="w-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main">
                                Done
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(step === 2 ? 1 : 1)}
                                    disabled={step === 1 || submitting}
                                    className={step === 1 ? "opacity-0" : "opacity-100"}
                                >
                                    Back
                                </Button>
                                {step === 1 ? (
                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!canProceedToPin}
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
                                        ) : schedule.enabled ? (
                                            "Schedule"
                                        ) : (
                                            "Confirm"
                                        )}
                                    </Button>
                                )}
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
