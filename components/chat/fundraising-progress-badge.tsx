'use client';

import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

interface FundraisingProgressBadgeProps {
    currentAmount: number;
    targetAmount: number;
}

export default function FundraisingProgressBadge({ 
    currentAmount, 
    targetAmount 
}: FundraisingProgressBadgeProps) {
    const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
    
    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return amount.toFixed(0);
    };

    return (
        <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-darkBg-card rounded-md border border-gray-200 dark:border-darkBorder-light">
            <TrendingUp size={12} className="text-brand-green dark:text-brand-gold shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-16 sm:w-20">
                    <Progress value={progress} className="h-1.5" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatCurrency(currentAmount)} / {formatCurrency(targetAmount)} RWF
                </span>
            </div>
        </div>
    );
}
