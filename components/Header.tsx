"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, User, Wifi, WifiOff, MessageCircle, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import baseUrl from "@/helpers/baseUrl";
import { getUserBalance, getEntityBalance } from '@/helpers/api';
import { UserAvatar } from "@/components/UserAvatar";
import { useNotifications } from "@/context/NotificationContext";
import { useChat } from "@/context/ChatContext";
import NotificationBell from "./notifications/NotificationBell";
import { useAuthToken } from "@/hooks/use-auth-token";
import { Button } from "./ui/button";
import { useTheme } from "@/context/ThemeContext";
import { socketService } from "@/services/socketService";
import { apiSlice } from "@/states/apiSlice";
import { useDispatch } from "react-redux";


export const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [userName, setUserName] = useState<{ firstName: string; lastName: string } | null>(null);
    const [userId, setUserId] = useState<string>("");
    const [balance, setBalance] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [balanceError, setBalanceError] = useState<string | null>(null);

    const router = useRouter();
    const notifications = useNotifications();
    const { getToken, removeToken } = useAuthToken();
    const { theme, toggleTheme } = useTheme();
    const dispatch = useDispatch();

    // Try to get chat context, but don't fail if it's not available
    let chat;
    try {
        chat = useChat();
    } catch (error) {
        // ChatContext is not available on this page
        chat = null;
    }

    // Use chat connection status if available, otherwise use notifications
    const isConnected = chat?.isConnected ?? notifications.isConnected;

    // Fetch userId from token and then fetch user profile
    React.useEffect(() => {
        const authToken = getToken();
        if (authToken) {
            try {
                const base64Url = authToken.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const payload = JSON.parse(atob(base64));
                const id = payload?.userId || payload?.id || payload?.sub;
                if (id) setUserId(id);
            } catch (e) {
                throw new Error("Invalid token");
            }
        }
    }, [getToken]);

    // Fetch user profile
    React.useEffect(() => {
        if (!userId) return;
        const fetchUser = async () => {
            try {
                const authToken = getToken();
                const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
                // Try user endpoint first, then organization endpoint
                const userUrl = `${baseUrl}/users/${userId}`;
                const organizationUrl = `${baseUrl}/organizations/${userId}`;

                const [userRes, organizationRes] = await Promise.allSettled([
                    axios.get(userUrl, { headers }),
                    axios.get(organizationUrl, { headers }),
                ]);

                // Check if user data was successful
                if (userRes.status === 'fulfilled') {
                    const data = userRes.value.data;
                    setProfileImage(data.profile?.profileImage || null);
                    setUserName({ firstName: data.firstName, lastName: data.lastName });
                } else if (organizationRes.status === 'fulfilled') {
                    // If user failed but organization succeeded, use organization data
                    const data = organizationRes.value.data;
                    setProfileImage(data.profile?.profileImage || null);
                    setUserName({ firstName: data.name, lastName: '' });
                } else {
                    // Both failed, but don't throw - just leave profileImage as null
                    setProfileImage(null);
                }
            } catch (err) {
                // Don't throw error, just set profileImage to null
                setProfileImage(null);
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
                // First try as user
                let response;
                try {
                    response = await getEntityBalance(userId, 'user');
                } catch (userError) {
                    response = await getEntityBalance(userId, 'organization');
                }

                if (response.success && response.data) {
                    setBalance(Number(response.data.balance));
                } else {
                    setBalanceError('Invalid balance data received');
                }
            } catch (err) {
                setBalanceError('Could not fetch balance');
            } finally {
                setBalanceLoading(false);
            }
        };
        fetchBalance();
    }, [userId]);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleBalanceVisibility = () => {
        setIsBalanceVisible(!isBalanceVisible);
    };

    const handleLogout = () => {
        setIsDropdownOpen(false);

        try {
            // 1. Clear authentication tokens
            removeToken();

            // 2. Clear chat state if available
            if (chat?.clearChatState) {
                chat.clearChatState();
            }

            // 3. Clear notification state if available
            if (notifications?.clearNotificationState) {
                notifications.clearNotificationState();
            }

            // 4. Force disconnect socket
            socketService.forceDisconnect();

            // 5. Clear Redux RTK Query cache
            dispatch(apiSlice.util.resetApiState());

            // 6. Clear sessionStorage
            sessionStorage.clear();

            // 7. Clear localStorage (preserve theme and sidebar)
            const preservedItems = {
                theme: localStorage.getItem('theme'),
                sidebarExpanded: localStorage.getItem('sidebarExpanded'),
            };

            localStorage.clear();

            if (preservedItems.theme) {
                localStorage.setItem('theme', preservedItems.theme);
            }
            if (preservedItems.sidebarExpanded) {
                localStorage.setItem('sidebarExpanded', preservedItems.sidebarExpanded);
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }

        // 8. Force hard redirect to home (bypasses middleware returnUrl)
        window.location.replace("/");
    };

    const handleNavigation = (path: string) => {
        setIsDropdownOpen(false);
        router.push(path);
    };

    return (
        <div className="flex justify-between items-center px-3 sm:px-4 py-3 sm:py-4 min-h-16 sm:min-h-18 bg-white dark:bg-transparent">
            {/* Left Section: Title */}
            <div className="flex items-center justify-start">
                <Link href="/">
                    <h2 className="text-sm sm:text-md lg:text-2xl font-bold text-[#00313A] dark:text-white leading-tight whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity">
                        QiewCode
                    </h2>
                </Link>
            </div>

            {/* Right Section: Connection Status, Notification & User Profile */}
            <div className="flex items-center justify-end gap-1 sm:gap-2">
                {/* Connection Status Indicator */}
                <div className="hidden sm:flex items-center justify-center gap-1">
                    {isConnected ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                            <Wifi size={16} />
                            <span className="text-xs hidden sm:inline">Connected</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1 text-red-600">
                            <WifiOff size={16} />
                            <span className="text-xs hidden sm:inline">Offline</span>
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="text-[#00313A] dark:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive h-8 w-8 sm:h-10 sm:w-10 p-1 sm:p-2"
                >
                    {theme === 'dark' ? <Sun size={18} className="sm:size-5" /> : <Moon size={18} className="sm:size-5" />}
                </Button>

                {/* Notification Dropdown */}
                <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center">
                    <NotificationBell />
                </div>

                {/* Message Icon */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/chat')}
                    aria-label="Go to Chat"
                    className="text-[#00313A] dark:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive h-8 w-8 sm:h-10 sm:w-10 p-1 sm:p-2"
                >
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>

                {/* User Profile with Dropdown */}
                <div className="relative flex items-center">
                    {/* Profile Picture */}
                    <button
                        className="rounded-full flex items-center justify-center flex-shrink-0 focus:outline-none"
                        onClick={toggleDropdown}
                        aria-label="User Profile"
                    >
                        <UserAvatar
                            profileImage={profileImage}
                            firstName={userName?.firstName}
                            lastName={userName?.lastName}
                            className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-gray-300 hover:border-gray-400"
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-md shadow-lg z-10 overflow-hidden">
                            <ul className="text-sm text-gray-700 dark:text-gray-300">
                                <li>
                                    <button
                                        onClick={() => handleNavigation('/profile')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors"
                                    >
                                        Profile
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => handleNavigation('/settings')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors"
                                    >
                                        Settings
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => handleNavigation('/notifications')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors"
                                    >
                                        Notifications
                                    </button>
                                </li>
                                <li className="border-t border-gray-100 dark:border-darkBorder-light">
                                    <button
                                        onClick={() => handleNavigation('/logout')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-darkBg-overlay transition-colors text-red-500"
                                    >
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};