"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { useNotifications } from "@/context/NotificationContext"
import { useGetPendingInvitationsUnifiedQuery } from "@/states/contactSlice"
import { useAuthToken } from "@/hooks/use-auth-token"
import NotificationCenter from "./NotificationCenter"

const NotificationBell: React.FC = () => {
    const { unreadCount } = useNotifications()
    const { getToken } = useAuthToken()
    const token = getToken()
    const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)

    // Get pending contact requests count to include in notification count
    const { data: pendingContactRequests } = useGetPendingInvitationsUnifiedQuery({
        token: token!,
        page: 1,
        limit: 20
    }, { skip: !token })

    // Combine notification count with pending contact requests
    const contactRequestsCount = pendingContactRequests?.invitations?.length || 0
    const totalUnreadCount = unreadCount + contactRequestsCount

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="relative text-[#00313A] dark:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive"
                onClick={() => setIsNotificationCenterOpen(true)}
            >
                <Bell className="h-5 w-5" />
                {totalUnreadCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </Badge>
                )}
            </Button>

            <NotificationCenter
                isOpen={isNotificationCenterOpen}
                onClose={() => setIsNotificationCenterOpen(false)}
            />
        </>
    )
}

export default NotificationBell