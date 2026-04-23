"use client";

import React, { useRef, useEffect } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AmountInputProps {
    amount: string;
    setAmount: (value: string) => void;
    balance: number | null;
    currency?: string;
    readOnly?: boolean;
}

const quickAmounts = [500, 1000, 5000, 10000];

const getFontSize = (digits: number) => {
    if (digits <= 4) return "text-6xl";
    if (digits <= 7) return "text-5xl";
    return "text-4xl";
};

const AmountInput = ({
    amount,
    setAmount,
    balance,
    currency = "RWF",
    readOnly = false,
}: AmountInputProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!readOnly && inputRef.current) {
            inputRef.current.focus();
        }
    }, [readOnly]);

    const handleAmountChange = (val: string) => {
        if (readOnly) return;
        if (/^\d*\.?\d*$/.test(val)) {
            setAmount(val);
        }
    };

    const numericAmount = parseFloat(amount) || 0;
    const balancePercent =
        balance && numericAmount > 0
            ? Math.min((numericAmount / balance) * 100, 100)
            : 0;
    const isOverBalance = balance !== null && numericAmount > balance;
    const digitCount = amount.replace(".", "").length;

    return (
        <div className="bg-white dark:bg-darkBg-card rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder-light mb-6 overflow-hidden">
            {/* Amount entry area */}
            <div className="px-8 pt-7 pb-5 text-center">
                {/* Currency badge */}
                <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-darkBg-interactive px-3 py-1 rounded-full mb-4">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                        {currency}
                    </span>
                </div>

                {/* Amount field */}
                {readOnly ? (
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span
                            className={cn(
                                "font-black text-gray-900 dark:text-white tracking-tight leading-none",
                                getFontSize(digitCount || 1)
                            )}
                        >
                            {numericAmount.toLocaleString()}
                        </span>
                    </div>
                ) : (
                    <div className="relative flex items-baseline justify-center mb-2">
                        <input
                            ref={inputRef}
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="0"
                            className={cn(
                                "bg-transparent font-black text-gray-900 dark:text-white tracking-tight leading-none text-center w-full focus:outline-none placeholder-gray-200 dark:placeholder-gray-700",
                                getFontSize(digitCount || 1),
                                isOverBalance && "text-red-500 dark:text-red-400"
                            )}
                            style={{ caretColor: "var(--brand-green, #00874A)" }}
                            autoComplete="off"
                        />
                    </div>
                )}

                {/* Balance info */}
                <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Available:</span>
                    <span
                        className={cn(
                            "text-xs font-semibold",
                            isOverBalance
                                ? "text-red-500 dark:text-red-400"
                                : "text-gray-700 dark:text-gray-300"
                        )}
                    >
                        {currency} {balance?.toLocaleString() ?? "—"}
                    </span>
                </div>
            </div>

            {/* Balance usage bar */}
            <div className="px-8 pb-2">
                <div className="w-full h-1.5 bg-gray-100 dark:bg-darkBg-interactive rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isOverBalance
                                ? "bg-red-400"
                                : balancePercent > 80
                                ? "bg-amber-400"
                                : "bg-brand-green dark:bg-brand-gold"
                        )}
                        style={{ width: `${balancePercent}%` }}
                    />
                </div>
                {isOverBalance && (
                    <p className="text-[11px] text-red-500 text-center mt-1.5 font-medium">
                        Exceeds available balance
                    </p>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-darkBorder-light mx-4" />

            {/* Quick amounts or locked notice */}
            <div className="px-6 py-4">
                {readOnly ? (
                    <div className="flex items-center justify-center gap-2 py-1 text-gray-500 dark:text-gray-400">
                        <Lock size={13} />
                        <span className="text-xs font-medium">Amount set by requester — cannot be changed</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2">
                        {quickAmounts.map((q) => (
                            <button
                                key={q}
                                onClick={() => setAmount(q.toString())}
                                className={cn(
                                    "py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all",
                                    amount === q.toString()
                                        ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main border-transparent shadow-md scale-105"
                                        : "bg-gray-50 dark:bg-darkBg-main text-gray-600 dark:text-gray-400 border-gray-200 dark:border-darkBorder-light hover:border-brand-green/50 dark:hover:border-brand-gold/50 hover:text-brand-green dark:hover:text-brand-gold"
                                )}
                            >
                                {q >= 1000 ? `${q / 1000}K` : q}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AmountInput;
