"use client"

import { Progress } from "@/components/ui/progress"
import { DollarSign } from "lucide-react"

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

    return (
        <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold flex items-center">
                    <DollarSign size={16} className="mr-1 text-gray-600" />
                    Fundraising Progress
                </span>
                <span className="text-sm font-medium">
                    {progressPercentage}%
                </span>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-2" />
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                    ${currentAmount.toLocaleString()}
                </span>
                <span className="text-gray-500">
                    of ${targetAmount.toLocaleString()}
                </span>
            </div>
        </div>
    )
}
