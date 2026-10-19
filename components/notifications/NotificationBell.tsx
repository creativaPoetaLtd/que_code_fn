"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { useNotifications } from "@/context/NotificationContext"
import NotificationCenter from "./NotificationCenter"

const NotificationBell: React.FC = () => {
    const { unreadCount } = useNotifications()
    const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)

    // unreadCount already reflects every pending contact/group-join request - each one
    // has its own CONTACT_REQUEST_RECEIVED / GROUP_JOIN_REQUEST notification row. This
    // used to also add the separately-fetched pending-request list lengths on top,
    // double counting the same items and inflating the badge past what was actually
    // unread (see NotificationCenter's own title badge, which uses unreadCount alone -
    // the two badges disagreeing was itself a symptom of this bug).

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="relative text-[#00313A] dark:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive"
                onClick={() => setIsNotificationCenterOpen(true)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
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