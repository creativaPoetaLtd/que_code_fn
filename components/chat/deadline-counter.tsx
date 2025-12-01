"use client"

import { Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DeadlineCounterProps {
    expirationDate?: string
    className?: string
}

export default function DeadlineCounter({ 
    expirationDate, 
    className = "" 
}: DeadlineCounterProps) {
    if (!expirationDate) return null

    const calculateDaysLeft = (dateString: string): number => {
        const deadline = new Date(dateString)
        const now = new Date()
        const timeDiff = deadline.getTime() - now.getTime()
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
        return daysLeft
    }

    const formatDeadline = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    const daysLeft = calculateDaysLeft(expirationDate)
    const formattedDate = formatDeadline(expirationDate)

    const getDeadlineStatus = () => {
        if (daysLeft < 0) {
            return {
                text: "Expired",
                variant: "destructive" as const,
                icon: Clock
            }
        } else if (daysLeft === 0) {
            return {
                text: "Today",
                variant: "destructive" as const,
                icon: Clock
            }
        } else if (daysLeft === 1) {
            return {
                text: "1 day left",
                variant: "default" as const,
                icon: Clock
            }
        } else if (daysLeft <= 7) {
            return {
                text: `${daysLeft} days left`,
                variant: "default" as const,
                icon: Clock
            }
        } else {
            return {
                text: `${daysLeft} days left`,
                variant: "secondary" as const,
                icon: Calendar
            }
        }
    }

    const status = getDeadlineStatus()
    const StatusIcon = status.icon

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-1" />
                <span>Deadline: {formattedDate}</span>
            </div>
            <Badge variant={status.variant} className="flex items-center gap-1">
                <StatusIcon size={12} />
                {status.text}
            </Badge>
        </div>
    )
}
