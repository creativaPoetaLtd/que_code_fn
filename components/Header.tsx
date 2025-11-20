"use client";
import React, { useEffect, useState } from "react";
import { Eye, EyeOff, User, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import baseUrl from "@/helpers/baseUrl";
import { getUserBalance, getEntityBalance } from '@/helpers/api';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/context/NotificationContext";
import NotificationBell from "./notifications/NotificationBell";
import { useAuthToken } from "@/hooks/use-auth-token";


export const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>("");
    const [balance, setBalance] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [balanceError, setBalanceError] = useState<string | null>(null);

    const router = useRouter();
    const { isConnected } = useNotifications();
    const { getToken } = useAuthToken();

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
                    setProfileImage(data.profileImage || null);
                } else if (organizationRes.status === 'fulfilled') {
                    // If user failed but organization succeeded, use organization data
                    const data = organizationRes.value.data;
                    setProfileImage(data.profileImage || null);
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

    const handleNavigation = (path: string) => {
        setIsDropdownOpen(false);
        router.push(path);
    };

    return (
        <div className="flex justify-between items-center px-4 py-2">
            {/* Left Section: Amount */}
            <div className="flex items-center space-x-2">
                <h2 className="text-md lg:text-2xl font-bold text-[#00313A]">
                    {balanceLoading
                        ? 'Loading...'
                        : balanceError
                            ? balanceError
                            : isBalanceVisible
                                ? `RWF ${balance?.toLocaleString()}`
                                : '••••••••••'}
                </h2>
                <button
                    onClick={toggleBalanceVisibility}
                    className="text-gray-600 hover:text-gray-800 transition"
                    aria-label={isBalanceVisible ? "Hide Balance" : "Show Balance"}
                >
                    {isBalanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            {/* Right Section: Connection Status, Notification & User Profile */}
            <div className="flex items-center space-x-4">
                {/* Connection Status Indicator */}
                <div className="flex items-center space-x-1">
                    {isConnected ? (
                        <div className="flex items-center space-x-1 text-green-600">
                            <Wifi size={16} />
                            <span className="text-xs hidden sm:inline">Connected</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                            <WifiOff size={16} />
                            <span className="text-xs hidden sm:inline">Offline</span>
                        </div>
                    )}
                </div>

                {/* Notification Dropdown */}
                <NotificationBell />

                {/* User Profile with Dropdown */}
                <div className="relative">
                    {/* Profile Picture */}
                    <button
                        className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center"
                        onClick={toggleDropdown}
                        aria-label="User Profile"
                    >
                        {profileImage ? (
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={profileImage} alt="User profile" />
                                <AvatarFallback>
                                    <User size={24} className="text-gray-600" />
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <Image
                                src="/Images/Profile.png"
                                alt="Profile"
                                className="h-full"
                                width={40}
                                height={40}
                            />
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <ul className="text-sm text-gray-700">
                                <li>
                                    <button
                                        onClick={() => handleNavigation('/profile')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        Profile
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => handleNavigation('/settings')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        Settings
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => handleNavigation('/notifications')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        Notifications
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => handleNavigation('/logout')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
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