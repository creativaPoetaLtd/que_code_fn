"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useAuthToken } from "@/hooks/use-auth-token";
import {
    getEntityBalance,
    checkUserPinStatus,
    getTransactionCategories,
    getUserWallet,
    getWalletRestrictions,
    transferMoney
} from "@/helpers/api";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import { Header } from "@/components/Header";
import RecipientHeader from "@/components/transfer/RecipientHeader";
import AmountInput from "@/components/transfer/AmountInput";
import CategorySelector from "@/components/transfer/CategorySelector";
import PinEntry from "@/components/transfer/PinEntry";
import { PinSetupModal } from "@/components/PinSetupModal";
import { Loader2 } from "lucide-react";
import { isTokenExpired, getUserIdFromToken } from "@/utils/jwtUtils";

interface Recipient {
    id: string;
    name: string;
    phone: string;
    avatar: string;
    type?: 'user' | 'organization';
}

const AmountPage = () => {
    const router = useRouter();
    const { isExpanded } = useSidebar();
    const { getToken } = useAuthToken();

    const [step, setStep] = useState(1); // 1: Amount, 2: PIN
    const [recipient, setRecipient] = useState<Recipient | null>(null);
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
    const [error, setError] = useState("");
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [hasPinSet, setHasPinSet] = useState<boolean | null>(null);

    // Load recipient from session storage
    useEffect(() => {
        const storedRecipient = sessionStorage.getItem('selectedRecipient');
        if (storedRecipient) {
            const data = JSON.parse(storedRecipient);
            setRecipient(data);
            setIsOrganization(data.type === 'organization');
        } else {
            router.push('/home/transfer');
        }

        // Check PIN status
        const checkPin = async () => {
            const token = getToken();
            if (token) {
                try {
                    const response: any = await checkUserPinStatus();
                    const pinStatus = response?.hasPinSet || false;
                    setHasPinSet(pinStatus);
                    if (!pinStatus) {
                        setShowPinSetup(true);
                    }
                } catch (error) {
                    console.error('Error checking PIN status:', error);
                }
            }
        };
        checkPin();
    }, [router, getToken]);

    // Fetch balance and categories
    useEffect(() => {
        const fetchData = async () => {
            const token = getToken();
            if (!token || isTokenExpired(token)) return;
            const userId = getUserIdFromToken(token);
            if (!userId) return;

            setBalanceLoading(true);
            try {
                // Balance
                const balRes = await getEntityBalance(userId, 'user').catch(() => getEntityBalance(userId, 'organization'));
                if (balRes.success) setCurrentBalance(Number(balRes.data.balance));

                // Categories
                const catRes: any = await getTransactionCategories();
                if (catRes.data?.success) setCategories(catRes.data.data);

                if (isOrganization && recipient) {
                    // Logic from original AmountPage
                    const orgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${recipient.id}/category`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(r => r.json());
                    if (orgRes.success) {
                        setOrganizationCategory(orgRes.data);
                        // Do not automatically set category as selected for orgs, 
                        // as the backend handles it based on recipient org id usually,
                        // but orgRes.data gives us the category for info display
                    }

                    // Fetch user restrictions for mixed funds warning
                    const restrictionRes: any = await getWalletRestrictions(userId);
                    if (restrictionRes.data?.success) {
                        setUserRestrictions(restrictionRes.data.data || []);
                    }
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setBalanceLoading(false);
            }
        };
        fetchData();
    }, [getToken, isOrganization, recipient]);

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

            // Logic from original AmountPage: determine sender type
            // Note: In original, they use currentUserInfo.accountType. 
            // Here we'll try to determine it dynamically or based on common patterns.
            let senderUserId: string | undefined;
            let senderOrganizationId: string | undefined;

            // Simple check: try to fetch user wallet first, if it fails, it might be an org
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
                categoryId: applyConstraints ? selectedCategory?.id : (isOrganization ? organizationCategory?.id : undefined),
                applyConstraints: isOrganization ? false : applyConstraints,
                senderUserId,
                senderOrganizationId
            };

            if (isOrganization) {
                params.receiverOrganizationId = recipient?.id;
            } else {
                params.receiverUserId = recipient?.id;
            }

            const result = await transferMoney(params);

            if (result.success) {
                sessionStorage.setItem('transferResult', JSON.stringify(result));
                router.push('/home/transfer/success');
            } else {
                setError(result.message || "Transfer failed");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during transfer");
        } finally {
            setLoading(false);
        }
    };

    if (!recipient) return null;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
            <Navigation hideBottomNav />
            <main className={cn(
                "flex-1 flex flex-col p-4 sm:p-6 lg:p-8 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 overflow-y-auto pb-4 sm:pb-6 lg:pb-8">
                    <Header showBackButton />

                    <div className="max-w-2xl mx-auto mt-8">
                        <RecipientHeader
                            recipient={recipient}
                            onBack={() => step === 1 ? router.push('/home/transfer') : setStep(1)}
                        />

                        {step === 1 ? (
                            <div className="animate-fadeIn">
                                <AmountInput
                                    amount={amount}
                                    setAmount={setAmount}
                                    balance={currentBalance}
                                />

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
                            </div>
                        ) : (
                            <div className="animate-fadeIn">
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
                                    {loading ? <Loader2 className="animate-spin" /> : "Confirm Transfer"}
                                </button>

                                <button
                                    onClick={() => setStep(1)}
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

export default AmountPage;
