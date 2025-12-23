"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp } from "lucide-react"

interface GroupProgressBarProps {
    currentAmount: number
    targetAmount: number
    className?: string
}

export default function GroupProgressBar({ 
    currentAmount, 
    targetAmount, 
    className = "" 
}: GroupProgressBarProps) {
    const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
    const progressPercentage = Math.min(Math.round(progress), 100)
    const [animatedProgress, setAnimatedProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    // Smooth progress animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progressPercentage)
            if (progressPercentage >= 100 && !isComplete) {
                setIsComplete(true)
            }
        }, 100)
        return () => clearTimeout(timer)
    }, [progressPercentage, isComplete])

    return (
        <div className={`bg-gray-50 dark:bg-darkBg-card border border-gray-100 dark:border-darkBorder-light p-4 rounded-lg ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold flex items-center">
                    <DollarSign size={16} className="mr-1 text-gray-600" />
                    Fundraising Progress
                </span>
                <span className={`text-sm font-medium flex items-center gap-1 ${isComplete ? 'text-green-600' : ''}`}>
                    {isComplete && <TrendingUp size={14} className="text-green-600" />}
                    {animatedProgress}%
                </span>
            </div>
            <Progress 
                value={animatedProgress} 
                className={`h-2 mb-2 transition-all duration-500 ease-out ${isComplete ? 'bg-brand-green/10 dark:bg-brand-gold/10' : 'bg-gray-100 dark:bg-darkBg-interactive'}`} 
            />
            <div className="flex justify-between items-center text-sm">
                <span className={`font-medium transition-colors ${isComplete ? 'text-green-600' : 'text-gray-700'}`}>
                    {new Intl.NumberFormat('en-RW', { 
                        style: 'currency', 
                        currency: 'RWF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(currentAmount)}
                </span>
                <span className="text-gray-500">
                    of {new Intl.NumberFormat('en-RW', { 
                        style: 'currency', 
                        currency: 'RWF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(targetAmount)}
                </span>
            </div>
            {isComplete && (
                <div className="mt-2 text-xs font-medium text-green-600 text-center animate-pulse">
                    🎉 Target Reached!
                </div>
            )}
        </div>
    )
}
