"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface AmountInputProps {
    amount: string;
    setAmount: (value: string) => void;
    balance: number | null;
    currency?: string;
}

const AmountInput = ({ amount, setAmount, balance, currency = "RWF" }: AmountInputProps) => {
    const quickAmounts = [500, 1000, 5000, 10000];
    const [isFocused, setIsFocused] = useState(true);

    const handleAmountChange = (val: string) => {
        // Only allow numbers and one decimal point
        if (/^\d*\.?\d*$/.test(val)) {
            setAmount(val);
        }
    };

    return (
        <div className="bg-white dark:bg-darkBg-card rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-darkBorder-light mb-8 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider">Enter Amount</p>

            <div className="flex items-center justify-center gap-2 mb-2 relative">
                <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">{currency}</span>
                <input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="0"
                    className="bg-transparent text-5xl sm:text-6xl font-black text-gray-900 dark:text-white w-full max-w-[200px] text-center focus:outline-none placeholder-gray-200 dark:placeholder-gray-800"
                    style={{ caretColor: 'transparent' }}
                    autoFocus
                />
                {isFocused && (
                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-brand-green dark:bg-brand-gold animate-pulse pointer-events-none" 
                         style={{ marginLeft: amount ? `${(amount.length * 1.8)}rem` : '0.8rem' }}></div>
                )}
            </div>

            <div className="mb-10">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Available: <span className="font-semibold text-gray-900 dark:text-white">{currency} {balance?.toLocaleString() || "0"}</span>
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickAmounts.map((q) => (
                    <button
                        key={q}
                        onClick={() => setAmount(q.toString())}
                        className={cn(
                            "py-3 px-4 rounded-xl border border-gray-200 dark:border-darkBorder-light text-sm font-semibold transition-all",
                            amount === q.toString()
                                ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main border-transparent shadow-md scale-105"
                                : "bg-gray-50 dark:bg-darkBg-main text-gray-700 dark:text-gray-300 hover:border-brand-green dark:hover:border-brand-gold"
                        )}
                    >
                        +{q.toLocaleString()}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AmountInput;
