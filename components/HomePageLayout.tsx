"use client";
import React, { useEffect, useState } from "react";
import AccountInfo from "./AccountInfo";
import { Header } from "./Header";
import { RecentMessages } from "./RecentMessages";
import { RecentTransactions } from "./RecentTransactions";
import { useParams, useRouter } from 'next/navigation';
import RecentActions from "./RecentActions";
import Navigation from "./Navigation";

export const HomePageLayout = () => {
    const params = useParams();
    const router = useRouter();
    const [userId, setUserId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const getUserId = () => {
            try {
                // First try to get from URL params
                let currentUserId = params.userId as string;
                // If userId is not in URL params or is undefined, try to get it from token
                if (!currentUserId || currentUserId === 'undefined') {
                    const authToken = localStorage.getItem('authToken');

                    if (authToken) {
                        try {
                            const base64Url = authToken.split('.')[1];
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                            const payload = JSON.parse(atob(base64));
                            currentUserId = payload?.userId || payload?.id || payload?.sub;
                            // If we got userId from token but URL doesn't have it, redirect to proper URL
                            if (currentUserId && (window.location.pathname === '/home/' || window.location.pathname === '/home')) {
                                router.replace(`/home/${currentUserId}`);
                                return;
                            }
                        } catch (error) {
                            console.error('HomePageLayout - Error decoding token:', error);
                            setError('Invalid authentication token. Please log in again.');
                            setTimeout(() => {
                                localStorage.removeItem('authToken');
                                router.push('/auth/login');
                            }, 2000);
                            return;
                        }
                    } else {
                        router.push('/auth/login');
                        return;
                    }
                }
                if (!currentUserId) {
                    setError('User ID not found. Please log in again.');
                    setTimeout(() => {
                        localStorage.removeItem('authToken');
                        router.push('/auth/login');
                    }, 2000);
                    return;
                }

                setUserId(currentUserId);
                setLoading(false);

            } catch (error) {
                console.error('HomePageLayout - Error in getUserId:', error);
                setError('An error occurred while loading user data.');
                setTimeout(() => {
                    localStorage.removeItem('authToken');
                    router.push('/auth/login');
                }, 2000);
            }
        };

        getUserId();
    }, [params, router]);

    // Show loading state while determining userId
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">{error}</div>
                        <p className="text-gray-600">Redirecting to login...</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-8 lg:ml-20 transition-all duration-300">
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    {/* Header */}
                    <Header />

                    {/* Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <div className="space-y-4">
                            <AccountInfo userId={userId} />
                            <RecentActions />
                        </div>
                        <div className="space-y-8">
                            <RecentTransactions />
                            <RecentMessages />
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Navigation for small devices */}
            <div className="lg:hidden">
                <Navigation />
            </div>
        </div>
    );
};