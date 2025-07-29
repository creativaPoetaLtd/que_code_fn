"use client";
import React, { useState } from "react";
import { Bell, Eye, EyeOff, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import baseUrl from "@/helpers/baseUrl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>("");
    const router = useRouter();

    // Fetch userId from token and then fetch user profile
    React.useEffect(() => {
        const authToken = localStorage.getItem("authToken");
        if (authToken) {
            try {
                const base64Url = authToken.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const payload = JSON.parse(atob(base64));
                const id = payload?.userId || payload?.id || payload?.sub;
                if (id) setUserId(id);
            } catch (e) {
                // ignore
            }
        }
    }, []);

    React.useEffect(() => {
        if (!userId) return;
        const fetchUser = async () => {
            try {
                const authToken = localStorage.getItem("authToken");
                const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
                const res = await axios.get(`${baseUrl}/users/${userId}`, { headers });
                const data = res.data;
                setProfileImage(data.profileImage || null);
            } catch (err) {
                // ignore
            }
        };
        fetchUser();
    }, [userId]);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleBalanceVisibility = () => {
        setIsBalanceVisible(!isBalanceVisible);
    };

    return (
        <div className="flex justify-between items-center px-4 py-2">
            {/* Left Section: Amount */}
            <div className="flex items-center space-x-2">
                <h2 className="text-md lg:text-2xl font-bold text-[#00313A]">
                    {isBalanceVisible ? "RWF 200,000" : "•••••••••"}
                </h2>
                <button
                    onClick={toggleBalanceVisibility}
                    className="text-gray-600 hover:text-gray-800 transition"
                    aria-label={isBalanceVisible ? "Hide Balance" : "Show Balance"}
                >
                    {isBalanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            {/* Right Section: Notification & User Profile */}
            <div className="flex items-center space-x-4">
                {/* Notification Button */}
                <button
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                </button>

                {/* User Profile with Dropdown */}
                <div className="relative">
                    {/* Profile Picture */}
                    <button
                        className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center"
                        onClick={toggleDropdown}
                        aria-label="User Profile"
                    >
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={profileImage || undefined} alt="User profile" />
                            <AvatarFallback>
                                <User size={24} className="text-gray-600" />
                            </AvatarFallback>
                        </Avatar>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <ul className="text-sm text-gray-700">
                                <li>
                                    <button
                                        onClick={() => router.push('/profile')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        Profile
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => router.push('/settings')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        Settings
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => router.push('/logout')}
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
