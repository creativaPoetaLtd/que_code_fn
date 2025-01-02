"use client";
import React from "react";
import { Share2, Copy, Send, CreditCard } from "lucide-react";

export const AccountInfo = () => {
    return (
        <div className="p-5">
            {/* Greeting and User Name */}
            <div className="mb-6">
                <p className="text-md font-medium text-[#00313A]">Good morning 👋</p>
                <h3 className="text-2xl font-bold text-[#00313A]">Raisa Adriana</h3>
            </div>

            <div className="flex justify-center">
                {/* QR Code Section */}
                <div className="bg-[#EEF4FF] p-4 rounded-lg inline-block">
                    <img
                        src="/Images/qr-code.png"
                        alt="QR Code"
                        className="w-full max-w-[200px] mx-auto"
                    />
                </div>
            </div>
            <div className="flex items-center justify-center mt-4 space-x-4">
                <p className="text-md text-gray-600 px-4 py-2 bg-[#EEF4FF]">
                    <a
                        href="https://qiewcode.com/abc"
                        className="text-[#00313A] hover:underline"
                    >
                        https://qiewcode.com/abc
                    </a>
                </p>
                {/* Share Button */}
                <button
                    className="flex items-center justify-center w-10 h-10 bg-[#EEF4FF] rounded-full hover:bg-gray-200 transition"
                    aria-label="Share"
                >
                    <Share2 size={24} color="#00B512" />
                </button>
                {/* Copy Button */}
                <button
                    className="flex items-center justify-center w-10 h-10 bg-[#EEF4FF] rounded-full hover:bg-gray-200 transition"
                    aria-label="Copy"
                >
                    <Copy size={24} color="#00B512" />
                </button>
            </div>
            {/* QR Code URL */}



            {/* Action Buttons */}
            <div className="flex justify-center mt-4 space-x-8">
                {/* Send Button */}
                <button className="flex flex-col items-center">
                    <span className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                        <Send size={24} className="text-green-600" />
                    </span>
                    <span className="text-sm font-medium text-gray-700">Send</span>
                </button>

                {/* Top Up Button */}
                <button className="flex flex-col items-center">
                    <span className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                        <CreditCard size={24} className="text-green-600" />
                    </span>
                    <span className="text-sm font-medium text-gray-700">Top Up</span>
                </button>
            </div>
        </div>
    );
};
