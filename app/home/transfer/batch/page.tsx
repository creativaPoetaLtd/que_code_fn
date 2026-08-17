"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Users, CalendarClock } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useAccent } from "@/hooks/use-accent";
import { useGetAcceptedContactsQuery } from "@/states/contactSlice";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import { Header } from "@/components/Header";
import StepIndicator from "@/components/transfer/StepIndicator";
import PinEntry from "@/components/transfer/PinEntry";
import SchedulePicker, { ScheduleState, defaultScheduleState } from "@/components/transfer/SchedulePicker";
import { PinSetupModal } from "@/components/PinSetupModal";
import BatchRecipientRow, { BatchContact } from "@/components/transfer/BatchRecipientRow";
import BatchResultsList, { BatchResultEntry } from "@/components/transfer/BatchResultsList";
import {
    checkUserPinStatus,
    createBatchTransfer,
    createScheduledBatchTransfer,
    getEntityBalance,
    getUserWallet,
} from "@/helpers/api";
import { isTokenExpired, getUserIdFromToken } from "@/utils/jwtUtils";

const getApiErrorMessage = (err: any): string =>
    err?.response?.data?.message || err?.message || "An error occurred while sending the batch";

const BatchTransferPage = () => {
    const router = useRouter();
    const { isExpanded } = useSidebar();
    const { getToken } = useAuthToken();
    const accent = useAccent();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [amounts, setAmounts] = useState<Record<string, string>>({});
    const [splitTotal, setSplitTotal] = useState("");
    const [schedule, setSchedule] = useState<ScheduleState>(defaultScheduleState);

    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [hasPinSet, setHasPinSet] = useState<boolean | null>(null);

    const [currentBalance, setCurrentBalance] = useState<number | null>(null);
    const [idempotencyKey, setIdempotencyKey] = useState("");

    const [results, setResults] = useState<BatchResultEntry[]>([]);
    const [resultSummary, setResultSummary] = useState<{
        successCount: number;
        failureCount: number;
        totalSent: number;
        scheduled: boolean;
        scheduledFor?: string;
        batchId?: string;
    } | null>(null);

    const token = getToken();
    const { data: contactsData, isLoading: isContactsLoading } = useGetAcceptedContactsQuery(token || "", {
        skip: !token,
    });

    const contacts: BatchContact[] = useMemo(() => {
        if (!contactsData?.contacts) return [];
        return contactsData.contacts.map((contact: any) => ({
            id: contact.otherUser.id,
            name: `${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
            phone: contact.otherUser.phone || "",
            avatar: contact.otherUser.profile?.profileImage || null,
        }));
    }, [contactsData]);

    const contactsById = useMemo(() => {
        const map: Record<string, BatchContact> = {};
        contacts.forEach((c) => (map[c.id] = c));
        return map;
    }, [contacts]);

    const filteredContacts = contacts.filter(
        (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
    );

    useEffect(() => {
        const checkPin = async () => {
            const authToken = getToken();
            if (!authToken) return;
            try {
                const response: any = await checkUserPinStatus();
                const pinStatus = response?.data?.data?.hasPinSet || false;
                setHasPinSet(pinStatus);
                if (!pinStatus) setShowPinSetup(true);
            } catch {
                // silent
            }
        };
        checkPin();

        const fetchBalance = async () => {
            const authToken = getToken();
            if (!authToken || isTokenExpired(authToken)) return;
            const userId = getUserIdFromToken(authToken);
            if (!userId) return;
            try {
                const res = await getEntityBalance(userId, "user").catch(() => getEntityBalance(userId, "organization"));
                if (res.success) setCurrentBalance(Number(res.data.availableBalance));
            } catch {
                // silent
            }
        };
        fetchBalance();
    }, [getToken]);

    const toggleContact = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                setAmounts((a) => {
                    const copy = { ...a };
                    delete copy[id];
                    return copy;
                });
            } else {
                next.add(id);
            }
            return next;
        });
        setError("");
    };

    const setAmountFor = (id: string, value: string) => {
        setAmounts((prev) => ({ ...prev, [id]: value }));
        setError("");
    };

    const selectedContacts = contacts.filter((c) => selectedIds.has(c.id));
    const total = selectedContacts.reduce((sum, c) => sum + (parseFloat(amounts[c.id]) || 0), 0);

    const handleSplitEvenly = () => {
        const totalNum = parseFloat(splitTotal);
        if (!totalNum || totalNum <= 0 || selectedContacts.length === 0) return;
        const share = (totalNum / selectedContacts.length).toFixed(2);
        const next: Record<string, string> = { ...amounts };
        selectedContacts.forEach((c) => (next[c.id] = share));
        setAmounts(next);
    };

    const handleContinue = () => {
        if (selectedContacts.length === 0) {
            setError("Select at least one person to send to");
            return;
        }
        for (const c of selectedContacts) {
            const amt = parseFloat(amounts[c.id]);
            if (!amt || amt <= 0) {
                setError(`Enter an amount for ${c.name}`);
                return;
            }
        }
        if (currentBalance !== null && total > currentBalance) {
            setError("Total exceeds your available balance");
            return;
        }

        if (schedule.enabled) {
            if (!schedule.date || !schedule.time) {
                setError("Please choose a date and time for this batch");
                return;
            }
            const scheduledDateTime = new Date(`${schedule.date}T${schedule.time}`);
            const minAllowed = new Date(Date.now() + 5 * 60000);
            if (isNaN(scheduledDateTime.getTime()) || scheduledDateTime < minAllowed) {
                setError("Scheduled time must be at least 5 minutes from now");
                return;
            }
            if (
                schedule.recurrence.frequency !== "none" &&
                schedule.recurrence.endMode === "date" &&
                !schedule.recurrence.endDate
            ) {
                setError("Please choose an end date for the recurring batch");
                return;
            }
        }

        setError("");
        setIdempotencyKey(`batch-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        setStep(2);
    };

    const handleConfirm = async () => {
        if (pin.length < 4) {
            setError("Please enter your 4-digit PIN");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const authToken = getToken();
            const rawUserId = getUserIdFromToken(authToken || "");
            if (!rawUserId) {
                throw new Error("Unable to identify sender");
            }

            let senderUserId: string | undefined;
            let senderOrganizationId: string | undefined;
            try {
                await getUserWallet(rawUserId);
                senderUserId = rawUserId;
            } catch {
                senderOrganizationId = rawUserId;
            }

            const recipients = selectedContacts.map((c) => ({
                receiverUserId: c.id,
                amount: parseFloat(amounts[c.id]),
            }));

            if (schedule.enabled) {
                const scheduledDateTime = new Date(`${schedule.date}T${schedule.time}`);

                let recurrence: any = undefined;
                if (schedule.recurrence.frequency !== "none") {
                    recurrence = {
                        frequency: schedule.recurrence.frequency,
                        interval: schedule.recurrence.interval || 1,
                    };
                    if (schedule.recurrence.endMode === "date" && schedule.recurrence.endDate) {
                        recurrence.endDate = new Date(schedule.recurrence.endDate).toISOString();
                    } else if (schedule.recurrence.endMode === "count") {
                        recurrence.maxOccurrences = schedule.recurrence.maxOccurrences;
                    }
                }

                const result = await createScheduledBatchTransfer({
                    senderUserId,
                    senderOrganizationId,
                    recipients,
                    pin,
                    description: "Batch transfer",
                    scheduledFor: scheduledDateTime.toISOString(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    recurrence,
                });

                if (result.success) {
                    setResults(result.data.results);
                    setResultSummary({
                        successCount: result.data.successCount,
                        failureCount: result.data.failureCount,
                        totalSent: result.data.totalRequestedAmount,
                        scheduled: true,
                        scheduledFor: result.data.scheduledFor,
                        batchId: result.data.batchId,
                    });
                    setStep(3);
                } else {
                    setError(result.message || "Failed to schedule batch");
                }
                return;
            }

            const result = await createBatchTransfer({
                senderUserId,
                senderOrganizationId,
                recipients,
                pin,
                description: "Batch transfer",
                idempotencyKey,
            });

            if (result.success) {
                setResults(result.data.results);
                setResultSummary({
                    successCount: result.data.successCount,
                    failureCount: result.data.failureCount,
                    totalSent: result.data.totalSentAmount,
                    scheduled: false,
                });
                setStep(3);
            } else {
                setError(result.message || "Batch transfer failed");
            }
        } catch (err: any) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex flex-col min-h-screen bg-white ${accent.darkBgPage}`}>
            <Navigation hideBottomNav />
            <main
                className={cn(
                    "flex-1 flex flex-col p-4 sm:p-6 lg:p-8 transition-all duration-300",
                    isExpanded ? "lg:ml-64" : "lg:ml-20"
                )}
            >
                <div className="flex-1 overflow-y-auto pb-4 sm:pb-6 lg:pb-8">
                    <Header showBackButton />

                    <div className="max-w-2xl mx-auto mt-6">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => (step === 1 ? router.push("/home/transfer") : setStep((step - 1) as 1 | 2))}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-darkBg-interactive rounded-full transition text-gray-700 dark:text-gray-300"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                                Send to Multiple People
                            </h1>
                        </div>

                        <StepIndicator currentStep={step} />

                        {step === 1 && (
                            <div className="animate-fadeIn">
                                {currentBalance !== null && (
                                    <div className="bg-white dark:bg-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light px-6 py-4 mb-4 flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Your balance</span>
                                        <span
                                            className={cn(
                                                "font-bold text-sm",
                                                total > currentBalance
                                                    ? "text-red-500 dark:text-red-400"
                                                    : "text-gray-900 dark:text-white"
                                            )}
                                        >
                                            RWF {currentBalance.toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                <SchedulePicker
                                    schedule={schedule}
                                    onChange={setSchedule}
                                    minDate={new Date().toISOString().slice(0, 10)}
                                />

                                {selectedContacts.length > 1 && (
                                    <div className="bg-white dark:bg-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4 mb-4">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                            Split a total evenly (optional)
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Total amount"
                                                value={splitTotal}
                                                onChange={(e) => setSplitTotal(e.target.value)}
                                                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-darkBg-main rounded-xl border border-gray-200 dark:border-darkBorder-light text-gray-900 dark:text-white text-sm"
                                            />
                                            <button
                                                onClick={handleSplitEvenly}
                                                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-darkBg-interactive text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-darkBg-hover transition-colors whitespace-nowrap"
                                            >
                                                Split evenly
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search contacts"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-darkBg-main rounded-xl border border-gray-200 dark:border-darkBorder-light text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                </div>

                                <div className="space-y-2 max-h-[420px] overflow-y-auto mb-4">
                                    {isContactsLoading ? (
                                        <div className="py-10 text-center text-gray-500">Loading contacts...</div>
                                    ) : filteredContacts.length > 0 ? (
                                        filteredContacts.map((contact) => (
                                            <BatchRecipientRow
                                                key={contact.id}
                                                contact={contact}
                                                isSelected={selectedIds.has(contact.id)}
                                                amount={amounts[contact.id] || ""}
                                                onToggle={() => toggleContact(contact.id)}
                                                onAmountChange={(value) => setAmountFor(contact.id, value)}
                                            />
                                        ))
                                    ) : (
                                        <div className="py-10 text-center text-gray-500">No contacts found.</div>
                                    )}
                                </div>

                                {selectedContacts.length > 0 && (
                                    <div className="bg-brand-green/5 dark:bg-brand-gold/5 border border-brand-green/20 dark:border-brand-gold/20 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <Users className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                                            {selectedContacts.length} {selectedContacts.length === 1 ? "person" : "people"} selected
                                        </div>
                                        <span className="font-bold text-brand-green dark:text-brand-gold">
                                            RWF {total.toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl mb-6 text-red-600 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleContinue}
                                    className="w-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all"
                                >
                                    Continue to PIN
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fadeIn">
                                <div className="bg-white dark:bg-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-5 mb-6">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        Sending to {selectedContacts.length} {selectedContacts.length === 1 ? "person" : "people"}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">Total</span>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            RWF {total.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {schedule.enabled && schedule.date && schedule.time && (
                                    <div className="flex items-start gap-2.5 mb-6 p-4 bg-brand-green/5 dark:bg-brand-gold/5 border border-brand-green/20 dark:border-brand-gold/20 rounded-2xl">
                                        <CalendarClock className="w-4 h-4 text-brand-green dark:text-brand-gold flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold text-brand-green dark:text-brand-gold">Scheduled</span>{" "}
                                            for {new Date(`${schedule.date}T${schedule.time}`).toLocaleString()}
                                            {schedule.recurrence.frequency !== "none" && `, repeating ${schedule.recurrence.frequency}`}.
                                            Funds will be reserved from your balance now.
                                        </p>
                                    </div>
                                )}

                                <PinEntry pin={pin} setPin={setPin} showPin={showPin} setShowPin={setShowPin} error={error} />

                                <button
                                    disabled={loading || pin.length < 4}
                                    onClick={handleConfirm}
                                    className="w-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : schedule.enabled ? (
                                        `Confirm Schedule for ${selectedContacts.length}`
                                    ) : (
                                        `Confirm & Send to ${selectedContacts.length}`
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setPin("");
                                        setError("");
                                    }}
                                    className="w-full mt-4 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        )}

                        {step === 3 && resultSummary && (
                            <div className="animate-fadeIn">
                                <div
                                    className={cn(
                                        "rounded-2xl border p-6 mb-6 text-center",
                                        resultSummary.failureCount === 0
                                            ? "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10"
                                            : resultSummary.successCount === 0
                                            ? "border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10"
                                            : "border-amber-100 dark:border-amber-900/20 bg-amber-50/50 dark:bg-amber-900/10"
                                    )}
                                >
                                    {resultSummary.scheduled ? (
                                        resultSummary.failureCount === 0 ? (
                                            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                Scheduled RWF {resultSummary.totalSent.toLocaleString()} for all {resultSummary.successCount}{" "}
                                                {resultSummary.successCount === 1 ? "person" : "people"}
                                                {resultSummary.scheduledFor && ` on ${new Date(resultSummary.scheduledFor).toLocaleString()}`}
                                            </p>
                                        ) : (
                                            <p className="font-semibold text-amber-700 dark:text-amber-400">
                                                Scheduled for {resultSummary.successCount} of{" "}
                                                {resultSummary.successCount + resultSummary.failureCount} people —{" "}
                                                {resultSummary.failureCount} could not be scheduled
                                            </p>
                                        )
                                    ) : resultSummary.failureCount === 0 ? (
                                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                            Sent RWF {resultSummary.totalSent.toLocaleString()} to all {resultSummary.successCount}{" "}
                                            {resultSummary.successCount === 1 ? "person" : "people"}
                                        </p>
                                    ) : (
                                        <p className="font-semibold text-amber-700 dark:text-amber-400">
                                            Sent to {resultSummary.successCount} of {resultSummary.successCount + resultSummary.failureCount}{" "}
                                            people — {resultSummary.failureCount} failed
                                        </p>
                                    )}
                                </div>

                                <BatchResultsList results={results} contactsById={contactsById} />

                                <button
                                    onClick={() =>
                                        router.push(
                                            resultSummary.scheduled
                                                ? `/home/scheduled-transfers/batches/${resultSummary.batchId}`
                                                : "/home/transfer"
                                        )
                                    }
                                    className="w-full mt-6 bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all"
                                >
                                    {resultSummary.scheduled ? "View Scheduled Batch" : "Done"}
                                </button>
                            </div>
                        )}

                        {!isContactsLoading && contacts.length === 0 && step === 1 && (
                            <div className="mt-4 flex items-start gap-2.5 p-4 bg-gray-50 dark:bg-darkBg-interactive rounded-2xl text-sm text-gray-500 dark:text-gray-400">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                Add some contacts first from the main transfer page before sending to multiple people.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <PinSetupModal open={showPinSetup} onOpenChange={setShowPinSetup} onSuccess={() => setHasPinSet(true)} />
        </div>
    );
};

export default BatchTransferPage;
