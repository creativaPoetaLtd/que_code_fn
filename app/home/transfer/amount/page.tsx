"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useAuthToken } from "@/hooks/use-auth-token";
import {
    getEntityBalance,
    checkUserPinStatus,
    getTransactionCategories,
    getUserWallet,
    getWalletRestrictions,
    transferMoney,
    getPaymentRequestById,
} from "@/helpers/api";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import { Header } from "@/components/Header";
import RecipientHeader from "@/components/transfer/RecipientHeader";
import AmountInput from "@/components/transfer/AmountInput";
import CategorySelector from "@/components/transfer/CategorySelector";
import PinEntry from "@/components/transfer/PinEntry";
import RequestContextBanner from "@/components/transfer/RequestContextBanner";
import TransferSummaryCard from "@/components/transfer/TransferSummaryCard";
import StepIndicator from "@/components/transfer/StepIndicator";
import RequestLoadingSkeleton from "@/components/transfer/RequestLoadingSkeleton";
import { PinSetupModal } from "@/components/PinSetupModal";
import { Loader2, AlertCircle, ScanLine } from "lucide-react";
import { isTokenExpired, getUserIdFromToken } from "@/utils/jwtUtils";

interface Recipient {
    id: string;
    name: string;
    phone: string;
    avatar: string;
    type?: "user" | "organization";
}

interface RequestMeta {
    note: string | null;
    allowEditAmount: boolean;
    amount: number;
    currency: string;
}

const AmountPageInner = () => {
    const router = useRouter();
    const { isExpanded } = useSidebar();
    const { getToken } = useAuthToken();
    const searchParams = useSearchParams();
    const requestId = searchParams.get("requestId");

    const [step, setStep] = useState(1);
    const [recipient, setRecipient] = useState<Recipient | null>(null);
    const [requestMeta, setRequestMeta] = useState<RequestMeta | null>(null);
    const [amount, setAmount] = useState("");
    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);

    const [currentBalance, setCurrentBalance] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(true);

    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [applyConstraints, setApplyConstraints] = useState(false);

    const [isOrganization, setIsOrganization] = useState(false);
    const [organizationCategory, setOrganizationCategory] = useState<any>(null);
    const [userRestrictions, setUserRestrictions] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [fetchingRequest, setFetchingRequest] = useState(false);
    const [error, setError] = useState("");
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [hasPinSet, setHasPinSet] = useState<boolean | null>(null);

    // ── Data loading ──────────────────────────────────────────────
    useEffect(() => {
        const storedRecipient = sessionStorage.getItem("selectedRecipient");
        if (storedRecipient) {
            const data = JSON.parse(storedRecipient);
            setRecipient(data);
            setIsOrganization(data.type === "organization");
        } else if (!requestId) {
            router.push("/home/transfer");
        }

        const checkPin = async () => {
            const token = getToken();
            if (token) {
                try {
                    const response: any = await checkUserPinStatus();
                    const pinStatus = response?.hasPinSet || false;
                    setHasPinSet(pinStatus);
                    if (!pinStatus) setShowPinSetup(true);
                } catch {
                    // PIN check failed silently
                }
            }
        };
        checkPin();

        const initialAmount = sessionStorage.getItem("initialAmount");
        if (initialAmount) {
            setAmount(initialAmount);
            sessionStorage.removeItem("initialAmount");
        }

        if (requestId) {
            const fetchRequestData = async () => {
                setFetchingRequest(true);
                try {
                    const res: any = await getPaymentRequestById(requestId);
                    const payload = res?.data ?? res;

                    if (payload?.success) {
                        const request = payload.data;

                        const recipientData: Recipient = {
                            id: request.sender.id,
                            name: `${request.sender.firstName} ${request.sender.lastName}`,
                            phone: request.sender.phone || "",
                            avatar: request.sender.profile?.profileImage || "",
                            type: "user",
                        };
                        setRecipient(recipientData);
                        setAmount(request.amount?.toString() || "");
                        setRequestMeta({
                            note: request.note || null,
                            allowEditAmount: request.allowEditAmount,
                            amount: request.amount,
                            currency: request.currency || "RWF",
                        });
                    } else {
                        setError(payload?.message || "Failed to load payment request details");
                    }
                } catch {
                    setError("Failed to load payment request details");
                } finally {
                    setFetchingRequest(false);
                }
            };
            fetchRequestData();
        }
    }, [router, getToken, requestId]);

    useEffect(() => {
        const fetchData = async () => {
            const token = getToken();
            if (!token || isTokenExpired(token)) return;
            const userId = getUserIdFromToken(token);
            if (!userId) return;

            setBalanceLoading(true);
            try {
                const balRes = await getEntityBalance(userId, "user").catch(() =>
                    getEntityBalance(userId, "organization")
                );
                if (balRes.success) setCurrentBalance(Number(balRes.data.balance));

                const catRes: any = await getTransactionCategories();
                if (catRes.data?.success) setCategories(catRes.data.data);

                if (isOrganization && recipient) {
                    const orgRes = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${recipient.id}/category`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ).then((r) => r.json());
                    if (orgRes.success) setOrganizationCategory(orgRes.data);

                    const restrictionRes: any = await getWalletRestrictions(userId);
                    if (restrictionRes.data?.success)
                        setUserRestrictions(restrictionRes.data.data || []);
                }
            } catch {
                // Balance/category load failed silently
            } finally {
                setBalanceLoading(false);
            }
        };
        fetchData();
    }, [getToken, isOrganization, recipient]);

    // ── Handlers ──────────────────────────────────────────────────
    const handleContinue = () => {
        const numAmount = parseFloat(amount);
        if (!amount || isNaN(numAmount) || numAmount < 100) {
            setError("Minimum amount is RWF 100");
            return;
        }
        if (currentBalance !== null && numAmount > currentBalance) {
            setError("Insufficient balance");
            return;
        }
        setError("");
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
            const token = getToken();
            const senderId = getUserIdFromToken(token || "");

            let senderUserId: string | undefined;
            let senderOrganizationId: string | undefined;

            try {
                await getUserWallet(senderId!);
                senderUserId = senderId || undefined;
            } catch {
                senderOrganizationId = senderId || undefined;
            }

            const params: any = {
                amount: parseFloat(amount),
                pin,
                description: "Payment",
                categoryId: applyConstraints
                    ? selectedCategory?.id
                    : isOrganization
                    ? organizationCategory?.id
                    : undefined,
                applyConstraints: isOrganization ? false : applyConstraints,
                senderUserId,
                senderOrganizationId,
                paymentRequestId: requestId || undefined,
            };

            if (isOrganization) {
                params.receiverOrganizationId = recipient?.id;
            } else {
                params.receiverUserId = recipient?.id;
            }

            const result = await transferMoney(params);

            if (result.success) {
                sessionStorage.setItem("transferResult", JSON.stringify(result));
                router.push("/home/transfer/success");
            } else {
                setError(result.message || "Transfer failed");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during transfer");
        } finally {
            setLoading(false);
        }
    };

    // ── Loading state ─────────────────────────────────────────────
    if (fetchingRequest && !recipient) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
                <Navigation />
                <main
                    className={cn(
                        "flex-1 flex flex-col p-4 sm:p-6 lg:p-8 transition-all duration-300",
                        isExpanded ? "lg:ml-64" : "lg:ml-20"
                    )}
                >
                    <div className="flex-1 overflow-y-auto pb-28 sm:pb-24 lg:pb-8">
                        <Header />
                        <div className="max-w-2xl mx-auto mt-4 mb-4 flex items-center gap-2 text-brand-green dark:text-brand-gold">
                            <ScanLine size={16} />
                            <span className="text-sm font-medium">Loading payment request from QR...</span>
                        </div>
                        <RequestLoadingSkeleton />
                    </div>
                </main>
            </div>
        );
    }

    // ── Error / no-recipient state ────────────────────────────────
    if (!recipient) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
                <Navigation />
                <main
                    className={cn(
                        "flex-1 flex flex-col p-4 sm:p-6 lg:p-8 transition-all duration-300",
                        isExpanded ? "lg:ml-64" : "lg:ml-20"
                    )}
                >
                    <div className="flex-1 overflow-y-auto pb-28 sm:pb-24 lg:pb-8">
                        <Header />
                        <div className="max-w-2xl mx-auto mt-8 rounded-3xl border border-red-200 dark:border-red-900/30 bg-white dark:bg-darkBg-card p-8 text-center">
                            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="text-red-500" size={26} />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Couldn't load request
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-400 mb-6">
                                {error || "No request details found. The link may be invalid or expired."}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                {requestId && (
                                    <button
                                        onClick={() => router.push("/home/scan")}
                                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder-light text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition"
                                    >
                                        Back to Scanner
                                    </button>
                                )}
                                <button
                                    onClick={() => router.push("/home/requests")}
                                    className="px-4 py-2.5 rounded-xl bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-sm font-semibold hover:opacity-90 transition"
                                >
                                    View Requests
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────
    const isQRFlow = !!requestId && !!requestMeta;
    const allowEditAmount = requestMeta ? requestMeta.allowEditAmount : true;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
            <Navigation hideBottomNav />
            <main className={cn(
                "flex-1 flex flex-col p-4 sm:p-6 lg:p-8 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 overflow-y-auto pb-4 sm:pb-6 lg:pb-8">
                    <Header showBackButton />

                    <div className="max-w-2xl mx-auto mt-6">
                        {/* Step indicator */}
                        <StepIndicator currentStep={step} />

                        {/* QR context banner (only for QR flow) */}
                        {isQRFlow && step === 1 && (
                            <RequestContextBanner
                                requesterName={recipient.name}
                                requesterAvatar={recipient.avatar}
                                amount={requestMeta.amount}
                                currency={requestMeta.currency}
                                note={requestMeta.note}
                                allowEditAmount={requestMeta.allowEditAmount}
                            />
                        )}

                        {/* Standard recipient header (non-QR flow, or step 2) */}
                        {!isQRFlow && (
                            <RecipientHeader
                                recipient={recipient}
                                onBack={() =>
                                    step === 1
                                        ? router.push("/home/transfer")
                                        : setStep(1)
                                }
                            />
                        )}

                        {step === 1 ? (
                            <div className="animate-fadeIn">
                                <AmountInput
                                    amount={amount}
                                    setAmount={setAmount}
                                    balance={currentBalance}
                                    readOnly={!allowEditAmount}
                                />

                                {/* Category selector — hidden for simple QR flows */}
                                {!isQRFlow && (
                                    <CategorySelector
                                        categories={categories}
                                        selectedCategoryId={selectedCategory?.id}
                                        onSelect={setSelectedCategory}
                                        applyConstraints={applyConstraints}
                                        setApplyConstraints={setApplyConstraints}
                                        isOrganization={isOrganization}
                                        organizationCategory={organizationCategory}
                                        userRestrictions={userRestrictions}
                                    />
                                )}

                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl mb-6 text-red-600 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleContinue}
                                    className="w-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    Continue to PIN
                                </button>

                                {isQRFlow && (
                                    <button
                                        onClick={() => router.push("/home/scan")}
                                        className="w-full mt-3 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-center"
                                    >
                                        Cancel — go back to scanner
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="animate-fadeIn">
                                {/* Summary card above PIN */}
                                <TransferSummaryCard
                                    recipientName={recipient.name}
                                    recipientAvatar={recipient.avatar}
                                    amount={amount}
                                    currency={requestMeta?.currency || "RWF"}
                                />

                                <PinEntry
                                    pin={pin}
                                    setPin={setPin}
                                    showPin={showPin}
                                    setShowPin={setShowPin}
                                    error={error}
                                />

                                <button
                                    disabled={loading || pin.length < 4}
                                    onClick={handleConfirm}
                                    className="w-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        "Confirm Transfer"
                                    )}
                                </button>

                                <button
                                    onClick={() => { setStep(1); setPin(""); setError(""); }}
                                    className="w-full mt-4 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <PinSetupModal
                open={showPinSetup}
                onOpenChange={setShowPinSetup}
                onSuccess={() => setHasPinSet(true)}
            />
        </div>
    );
};

export default function AmountPage() {
    return <Suspense><AmountPageInner /></Suspense>;
}
