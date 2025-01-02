"use client";
import React, { useState } from "react";
import { Bell, Eye, EyeOff, User } from "lucide-react";
import Image from "next/image";

export const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);

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
                        <Image
                            src="/Images/Profile.png"
                            alt="Phone and Card"
                            className="h-full"
                            width={130}
                            height={130}
                        />
                        {/* <User size={24} className="text-gray-600" /> */}
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <ul className="text-sm text-gray-700">
                                <li>
                                    <a
                                        href="#profile"
                                        className="block px-4 py-2 hover:bg-gray-100"
                                    >
                                        Profile
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#settings"
                                        className="block px-4 py-2 hover:bg-gray-100"
                                    >
                                        Settings
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#logout"
                                        className="block px-4 py-2 hover:bg-gray-100 text-red-500"
                                    >
                                        Logout
                                    </a>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
