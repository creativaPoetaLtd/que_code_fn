"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
    currentStep: number; // 1 or 2
}

const steps = ["Review", "Confirm", "Done"];

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
    return (
        <div className="flex items-center justify-center gap-0 mb-6 select-none">
            {steps.map((label, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isActive = stepNumber === currentStep;

                return (
                    <React.Fragment key={label}>
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                    isCompleted
                                        ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                                        : isActive
                                        ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main ring-4 ring-brand-green/20 dark:ring-brand-gold/20"
                                        : "bg-gray-100 dark:bg-darkBg-interactive text-gray-400 dark:text-gray-500"
                                )}
                            >
                                {isCompleted ? <Check size={13} /> : stepNumber}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] font-medium mt-1 transition-colors",
                                    isActive
                                        ? "text-brand-green dark:text-brand-gold"
                                        : isCompleted
                                        ? "text-gray-500 dark:text-gray-400"
                                        : "text-gray-300 dark:text-gray-600"
                                )}
                            >
                                {label}
                            </span>
                        </div>

                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "h-px w-12 mb-4 mx-1 transition-colors duration-300",
                                    stepNumber < currentStep
                                        ? "bg-brand-green dark:bg-brand-gold"
                                        : "bg-gray-200 dark:bg-darkBg-interactive"
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default StepIndicator;
