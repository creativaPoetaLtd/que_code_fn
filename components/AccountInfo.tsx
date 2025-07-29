"use client";
import React from "react";
import { useRouter } from 'next/navigation';
import { Share2, Copy, Send, CreditCard } from "lucide-react";

export const AccountInfo = () => {
    const router = useRouter();
    
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
            {/* Greeting and User Name Section */}
            <div className="mb-6 sm:mb-8">
                <p className="text-sm sm:text-md font-medium text-[#00313A]">Good morning 👋</p>
                <h3 className="text-xl sm:text-2xl font-bold text-[#00313A] mt-1">Raisa Adriana</h3>
                
                {/* Balance Display */}
                <div className="mt-4 p-4 bg-gradient-to-r from-[#00313A] to-[#00252e] rounded-lg">
                    <p className="text-sm text-gray-300 mb-1">Available Balance</p>
                    <h4 className="text-2xl font-bold text-white">RWF 30,000</h4>
                    <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-green-400">+12.5% this month</span>
                    </div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="max-w-md mx-auto">
                {/* QR Code Container */}
                <div className="flex justify-center mb-4">
                    <div className="bg-[#EEF4FF] p-3 sm:p-4 rounded-lg">
                        <img
                            src="/Images/qr-code.png"
                            alt="QR Code"
                            className="w-32 sm:w-40 md:w-48 h-auto object-contain"
                        />
                    </div>
                </div>

                {/* URL and Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-4">
                    {/* URL Display */}
                    <div className="w-full sm:w-auto">
                        <p className="text-sm md:text-md text-gray-600 px-3 py-2 bg-[#EEF4FF] rounded-lg truncate max-w-[280px] sm:max-w-none">
                            <a
                                href="https://qiewcode.com/abc"
                                className="text-[#00313A] hover:underline"
                            >
                                https://qiewcode.com/abc
                            </a>
                        </p>
                    </div>

                    {/* Share and Copy Buttons */}
                    <div className="flex gap-3">
                        <button
                            className="flex items-center justify-center w-10 h-10 bg-[#EEF4FF] rounded-full hover:bg-gray-200 transition"
                            aria-label="Share"
                        >
                            <Share2 size={20} color="#00B512" />
                        </button>
                        <button
                            className="flex items-center justify-center w-10 h-10 bg-[#EEF4FF] rounded-full hover:bg-gray-200 transition"
                            aria-label="Copy"
                        >
                            <Copy size={20} color="#00B512" />
                        </button>
                    </div>
                </div>

                {/* Send and Top Up Buttons */}
                <div className="flex justify-center gap-8 sm:gap-12 mt-6 sm:mt-8">
                    <button 
                    onClick={() => router.push('/home/transfer')}
                    className="flex flex-col items-center group"
                    >
                        <span className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                            <Send size={24} className="text-green-600" />
                        </span>
                        <span className="text-sm font-medium text-gray-700">Send</span>
                    </button>

                    <button className="flex flex-col items-center group">
                        <span className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                            <CreditCard size={24} className="text-green-600" />
                        </span>
                        <span className="text-sm font-medium text-gray-700">Top Up</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountInfo;