"use client";

import React from "react";
import { Eye, EyeOff, Lock, Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinEntryProps {
    pin: string;
    setPin: (value: string) => void;
    showPin: boolean;
    setShowPin: (show: boolean) => void;
    error?: string;
}

const PinEntry = ({ pin, setPin, showPin, setShowPin, error }: PinEntryProps) => {
    const maxLength = 4;
    const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];

    const handleKeyPress = (num: string) => {
        if (num === "DEL") {
            setPin(pin.slice(0, -1));
        } else if (num && pin.length < maxLength) {
            setPin(pin + num);
        }
    };

    return (
        <div className="bg-white dark:bg-darkBg-card rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-darkBorder-light mb-8 text-center animate-fadeIn">
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-brand-green/10 dark:bg-brand-gold/10 rounded-2xl flex items-center justify-center">
                    <Lock className="w-8 h-8 text-brand-green dark:text-brand-gold" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Security Check</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                Please enter your secure 4-digit PIN to authorize this transfer.
            </p>

            {/* PIN Display Containers */}
            <div className="flex justify-center gap-4 mb-8 h-12 items-center">
                {[...Array(maxLength)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-center justify-center transition-all duration-300 border-2",
                            i < pin.length
                                ? "bg-brand-green dark:bg-brand-gold border-transparent scale-110 shadow-lg"
                                : "bg-gray-50 dark:bg-darkBg-main border-gray-100 dark:border-darkBorder-light",
                            showPin
                                ? "w-10 h-12 rounded-2xl"
                                : i < pin.length
                                    ? "w-4 h-4 rounded-full"
                                    : "w-4 h-4 rounded-full"
                        )}
                    >
                        {showPin && i < pin.length && (
                            <span className="text-white dark:text-darkBg-main font-black text-xl animate-scaleIn">
                                {pin[i]}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <p className="text-sm text-red-500 mb-6 bg-red-50 dark:bg-red-900/10 p-2 rounded-xl border border-red-100 dark:border-red-900/20">
                    {error}
                </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                {numbers.map((n, i) => (
                    <button
                        key={i}
                        disabled={!n && n !== "0"}
                        onClick={() => handleKeyPress(n)}
                        className={cn(
                            "h-16 rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-95",
                            !n ? "pointer-events-none" : "bg-gray-50 dark:bg-darkBg-main text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive"
                        )}
                    >
                        {n === "DEL" ? <Delete className="w-6 h-6" /> : n}
                    </button>
                ))}
            </div>

            <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="mt-8 text-xs font-semibold text-gray-500 hover:text-brand-green dark:hover:text-brand-gold flex items-center justify-center gap-2 mx-auto"
            >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPin ? "Hide PIN" : "Show PIN"}
            </button>
        </div>
    );
};

export default PinEntry;
