"use client";
import React, { useEffect, useState } from "react";
import AccountInfo from "./AccountInfo";
import { Header } from "./Header";
import { WalletHero } from "./Dashboard/WalletHero";
import { RecentMessages } from "./RecentMessages";
import { RecentTransactions } from "./RecentTransactions";
import { useParams, useRouter } from 'next/navigation';
import RecentActions from "./RecentActions";
import Navigation from "./Navigation";
import { useAuthToken } from '@/hooks/use-auth-token';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

export const HomePageLayout = () => {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuthToken();
    const { isExpanded } = useSidebar();
    const [userId, setUserId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [redirectAttempts, setRedirectAttempts] = useState(0);

    useEffect(() => {
        const getUserId = () => {
            // Prevent multiple redirects and limit attempts
            if (isRedirecting || redirectAttempts >= 3) return;

            try {
                const authToken = getToken();

                if (!authToken) {
                    // No token, redirect to login
                    router.push('/auth/login');
                    return;
                }

                // Decode token to get logged-in user's ID
                let loggedInUserId: string | null = null;
                try {
                    const base64Url = authToken.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(atob(base64));
                    loggedInUserId = payload?.userId || payload?.id || payload?.sub;
                } catch (error) {
                    console.error('HomePageLayout - Error decoding token:', error);
                    setError('Invalid authentication token. Please log in again.');
                    setTimeout(() => {
                        router.push('/auth/login');
                    }, 2000);
                    return;
                }

                if (!loggedInUserId) {
                    setError('User ID not found in token. Please log in again.');
                    setTimeout(() => {
                        router.push('/auth/login');
                    }, 2000);
                    return;
                }

                // Get userId from URL params
                const urlUserId = params.userId as string;

                // If no userId in URL, redirect to logged-in user's home page
                if (!urlUserId || urlUserId === 'undefined') {
                    setIsRedirecting(true);
                    setRedirectAttempts(prev => prev + 1);
                    router.replace(`/home/${loggedInUserId}`);

                    // Add fallback redirect
                    setTimeout(() => {
                        if (window.location.pathname !== `/home/${loggedInUserId}`) {
                            window.location.href = `/home/${loggedInUserId}`;
                        }
                    }, 3000);
                    return;
                }

                // Check if URL userId matches logged-in user's ID
                if (urlUserId !== loggedInUserId) {
                    // Redirect to logged-in user's home page
                    setIsRedirecting(true);
                    setRedirectAttempts(prev => prev + 1);
                    router.replace(`/home/${loggedInUserId}`);

                    // Add fallback redirect
                    setTimeout(() => {
                        if (window.location.pathname !== `/home/${loggedInUserId}`) {
                            window.location.href = `/home/${loggedInUserId}`;
                        }
                    }, 3000);
                    return;
                }

                // User is authorized to access this page
                setUserId(loggedInUserId);
                setLoading(false);
                setIsRedirecting(false);

            } catch (error) {
                console.error('HomePageLayout - Error in getUserId:', error);
                setError('An error occurred while loading user data.');
                setTimeout(() => {
                    router.push('/auth/login');
                }, 2000);
            }
        };

        // Add a small delay to ensure the component is fully mounted
        const timer = setTimeout(getUserId, 100);

        return () => clearTimeout(timer);
    }, [params, router, isRedirecting, redirectAttempts, getToken]);

    // If too many redirect attempts, show error and manual redirect button
    if (redirectAttempts >= 3) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 dark:text-red-400 mb-4 font-medium">Redirect failed</div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Unable to automatically redirect to your home page.</p>
                        <button
                            onClick={() => {
                                const authToken = getToken();
                                if (authToken) {
                                    try {
                                        const base64Url = authToken.split('.')[1];
                                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                                        const payload = JSON.parse(atob(base64));
                                        const loggedInUserId = payload?.userId || payload?.id || payload?.sub;
                                        if (loggedInUserId) {
                                            window.location.href = `/home/${loggedInUserId}`;
                                        } else {
                                            router.push('/auth/login');
                                        }
                                    } catch (error) {
                                        router.push('/auth/login');
                                    }
                                } else {
                                    router.push('/auth/login');
                                }
                            }}
                            className="px-4 py-2 bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main rounded hover:opacity-90 transition font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading state while determining userId or redirecting
    if (loading || isRedirecting) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green dark:border-brand-gold mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">
                            {isRedirecting ? 'Redirecting to your home page...' : 'Loading...'}
                        </p>
                        {isRedirecting && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Please wait...</p>
                        )}
                        {redirectAttempts > 0 && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-600">Attempt {redirectAttempts + 1}/3</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 dark:text-red-400 mb-4 font-medium">{error}</div>
                        <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
            {/* Renders the desktop sidebar and the mobile bottom bar — one copy covers both */}
            <Navigation />

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col p-3 sm:p-4 lg:p-6 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                {/* Capped so the dashboard stops stretching on wide monitors — unbounded,
                    the hero pushed the balance and the actions to opposite edges with
                    a thousand pixels of nothing between them. No effect below 1440px. */}
                <div className="w-full max-w-[1440px] mx-auto flex-1 overflow-y-auto pb-24 lg:pb-4">
                    {/* Header */}
                    <div className="mb-3">
                        <Header />
                    </div>

                    {/* Balance and the four primary actions, full width */}
                    <WalletHero userId={userId} />

                    {/*
                      Activity takes two thirds; the QR and messages are utilities,
                      so they sit in a narrower rail rather than splitting the page
                      down the middle with a full-size QR at the top left.
                    */}
                    <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
                        <div className="space-y-4 lg:col-span-2">
                            <RecentTransactions />
                            <RecentActions userId={userId} />
                        </div>
                        <div className="space-y-4">
                            <AccountInfo userId={userId} variant="compact" />
                            <RecentMessages />
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
};