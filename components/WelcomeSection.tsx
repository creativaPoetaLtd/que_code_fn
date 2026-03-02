"use client";
import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import baseUrl from "@/helpers/baseUrl";
import { getEntityBalance } from '@/helpers/api';
import { useAuthToken } from "@/hooks/use-auth-token";

interface WelcomeSectionProps {
    userId: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userId }) => {
    const [userName, setUserName] = useState<string>("User");
    const [balance, setBalance] = useState<number | null>(null);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const { getToken } = useAuthToken();

    // Fetch user name
    useEffect(() => {
        if (!userId) return;
        const fetchUser = async () => {
            try {
                const authToken = getToken();
                const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
                const res = await axios.get(`${baseUrl}/users/${userId}`, { headers });
                const data = res.data;
                setUserName(data.firstName || data.name || "User");
            } catch (err) {
                console.error("Error fetching user:", err);
            }
        };
        fetchUser();
    }, [userId, getToken]);

    // Fetch wallet balance
    useEffect(() => {
        if (!userId) return;
        const fetchBalance = async () => {
            setBalanceLoading(true);
            setBalanceError(null);
            try {
                let response;
                try {
                    response = await getEntityBalance(userId, 'user');
                } catch (userError) {
                    response = await getEntityBalance(userId, 'organization');
                }

                if (response.success && response.data) {
                    setBalance(Number(response.data.balance));
                } else {
                    setBalanceError('Unable to fetch balance');
                }
            } catch (err) {
                setBalanceError('Could not fetch balance');
            } finally {
                setBalanceLoading(false);
            }
        };
        fetchBalance();
    }, [userId]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const getFormattedDate = () => {
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return `Today – ${today.toLocaleDateString('en-US', options)}`;
    };

    const toggleBalanceVisibility = () => {
        setIsBalanceVisible(!isBalanceVisible);
    };

    return (
        <div className="bg-white dark:bg-darkBg-card rounded-2xl px-6 py-2 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light mb-6 mt-2">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[#00313A] dark:text-white mb-1">
                        {getGreeting()}, <span className="text-brand-green dark:text-brand-gold">{userName}</span>
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Welcome back! Here's a quick overview of your QiewCode wallet.
                    </p>

                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Balance</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-2xl font-bold text-[#00313A] dark:text-white">
                                {balanceLoading
                                    ? 'Loading...'
                                    : balanceError
                                        ? balanceError
                                        : isBalanceVisible
                                            ? `RWF ${balance?.toLocaleString()}`
                                            : '••••••••••'}
                            </h2>
                            <span className="h-6 w-6 flex items-center justify-center">
                                <button
                                    onClick={toggleBalanceVisibility}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition rounded-full hover:bg-gray-100 dark:hover:bg-darkBg-interactive flex items-center justify-center p-1"
                                    aria-label={isBalanceVisible ? "Hide Balance" : "Show Balance"}
                                >
                                    {isBalanceVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getFormattedDate()}</p>
                </div>
            </div>
        </div>
    );
};
