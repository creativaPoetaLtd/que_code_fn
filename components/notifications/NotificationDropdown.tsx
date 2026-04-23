"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Bell, Check, Users, UserPlus, MessageCircle, X, RefreshCw, Wifi, WifiOff, HandCoins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "@/states/notificationSlice"
import { formatDistanceToNow } from "date-fns"
import { useRespondToJoinRequestMutation, useRespondToGroupInvitationMutation } from "@/states/groupSlice"
import { useAuthToken } from "@/hooks/use-auth-token"
import { toast } from "@/hooks/use-toast"
import type { Notification } from "@/types/notification.types"
import { useRouter } from "next/navigation"

const NotificationDropdown: React.FC = () => {
    const router = useRouter()
    const { getToken } = useAuthToken()
    const token = getToken() ?? ""

    // Get notifications from Redux slice instead of context
    const {
        data: notificationData,
        isLoading,
        isError,
        refetch: refreshNotifications,
        isFetching
    } = useGetNotificationsQuery(
        { token },
        {
            skip: !token,
            pollingInterval: 30000, // Poll every 30 seconds for updates
            refetchOnFocus: true,
            refetchOnReconnect: true,
        }
    )

    const [markNotificationRead] = useMarkNotificationReadMutation()
    const [respondToJoinRequest] = useRespondToJoinRequestMutation()
    const [respondToGroupInvitation] = useRespondToGroupInvitationMutation()
    const [isOpen, setIsOpen] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Extract notifications and unread count from API response
    const notifications = notificationData?.notifications || []
    const unreadCount = notificationData?.unreadCount || 0

    // Simple connection status - true if we have a valid token and no error
    const isConnected = !!token && !isError

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationRead({ notificationId, token }).unwrap()

            // Optionally refresh notifications to get updated state
            refreshNotifications()

            toast({
                title: "Success",
                description: "Notification marked as read",
            })
        } catch (error) {
            console.error("Failed to mark notification as read:", error)
            toast({
                title: "Error",
                description: "Failed to mark notification as read",
                variant: "destructive",
            })
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            await refreshNotifications().unwrap()
            toast({
                title: "Refreshed",
                description: "Notifications updated",
            })
        } catch (error) {
            console.error("Failed to refresh notifications:", error)
            toast({
                title: "Error",
                description: "Failed to refresh notifications",
                variant: "destructive",
            })
        } finally {
            setIsRefreshing(false)
        }
    }

    const getNotificationIcon = (type: string) => {
        const lowerType = type.toLowerCase()
        switch (lowerType) {
            case "group_invitation":
                return <Users size={16} className="text-blue-600" />
            case "contact_request":
                return <UserPlus size={16} className="text-green-600" />
            case "message":
                return <MessageCircle size={16} className="text-purple-600" />
            case "group_join_request":
                return <Users size={16} className="text-orange-600" />
            case "group_join_approved":
                return <Check size={16} className="text-green-600" />
            case "group_join_rejected":
                return <X size={16} className="text-red-600" />
            case "group_created":
                return <Users size={16} className="text-green-600" />
            case "payment_request_received":
                return <HandCoins size={16} className="text-green-600" />
            default:
                return <Bell size={16} className="text-gray-600" />
        }
    }

    const handleJoinRequestAction = async (notificationId: string, actionUrl: string) => {
        try {
            const url = new URL(actionUrl)
            const pathSegments = url.pathname.split("/")
            const groupId = pathSegments[pathSegments.indexOf("groups") + 1]
            const requestId = pathSegments[pathSegments.indexOf("requests") + 1]
            const action = url.searchParams.get("action")

            if (!groupId || !requestId || !action) {
                throw new Error("Invalid action URL for join request.")
            }

            await respondToJoinRequest({
                groupId,
                requestId,
                action: action as "approve" | "reject",
                token,
            }).unwrap()

            // Mark notification as read and refresh
            await handleMarkAsRead(notificationId)

            toast({
                title: "Action Successful",
                description: `Group join request ${action === "approve" ? "approved" : "rejected"}.`,
            })
        } catch (error: any) {
            console.error("Failed to perform join request action:", error)
            toast({
                title: "Error",
                description: error?.data?.message || error?.message || "Failed to perform action.",
                variant: "destructive",
            })
        }
    }

    const handleGroupInvitationAction = async (notificationId: string, actionUrl: string) => {
        try {
            const url = new URL(actionUrl)
            const membershipId = url.searchParams.get("membershipId")
            const action = url.searchParams.get("action")

            if (!membershipId || !action) {
                throw new Error("Invalid action URL for group invitation.")
            }

            await respondToGroupInvitation({
                membershipId,
                responseData: { action: action as "accept" | "reject" },
                token,
            }).unwrap()

            // Mark notification as read and refresh
            await handleMarkAsRead(notificationId)

            toast({
                title: "Action Successful",
                description: `Group invitation ${action === "accept" ? "accepted" : "rejected"}.`,
            })
        } catch (error: any) {
            console.error("Failed to perform invitation action:", error)
            toast({
                title: "Error",
                description: error?.data?.message || error?.message || "Failed to perform action.",
                variant: "destructive",
            })
        }
    }

    const handleNotificationAction = async (notificationId: string, actionUrl: string, notificationType: string) => {
        const lowerType = notificationType.toLowerCase()

        if (lowerType === "group_join_request") {
            await handleJoinRequestAction(notificationId, actionUrl)
        } else if (lowerType === "group_invitation") {
            await handleGroupInvitationAction(notificationId, actionUrl)
        } else if (lowerType === "payment_request_received") {
            // Simply mark as read and navigate
            await handleMarkAsRead(notificationId)
            router.push(actionUrl)
        }
    }

    const shouldShowActions = (notification: Notification) => {
        const type = notification.type.toLowerCase()
        return (
            !notification.isRead &&
            notification.data?.actions &&
            (type === "group_join_request" || type === "group_invitation" || type === "payment_request_received")
        )
    }

    const getActionButtonStyle = (actionType: string, notificationType: string) => {
        const isApprove = actionType === "approve" || actionType === "accept"
        const baseClasses = "h-7 text-xs"

        if (isApprove) {
            return `${baseClasses} bg-green-600 hover:bg-green-700 text-white`
        } else {
            return `${baseClasses} bg-red-50 text-red-700 hover:bg-red-100 border border-red-200`
        }
    }

    const getActionLabel = (actionType: string) => {
        switch (actionType) {
            case "approve":
                return "Approve"
            case "reject":
                return "Reject"
            case "accept":
                return "Accept"
            case "decline":
                return "Decline"
            default:
                return actionType.charAt(0).toUpperCase() + actionType.slice(1)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                    {/* Connection status indicator */}
                    <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isConnected ? "bg-green-500" : "bg-red-500"
                            }`}
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">Notifications</h3>
                            {isConnected ? (
                                <Wifi size={16} className="text-green-600" />
                            ) : (
                                <WifiOff size={16} className="text-red-600" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {unreadCount} new
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing || isFetching}
                                className="h-8 w-8 p-0"
                                title="Refresh notifications"
                            >
                                <RefreshCw size={14} className={(isRefreshing || isFetching) ? "animate-spin" : ""} />
                            </Button>
                        </div>
                    </div>
                    {!isConnected && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            {isError ? "Failed to load notifications" : "Token not available"}
                        </div>
                    )}
                </div>
                <ScrollArea className="max-h-96">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <RefreshCw size={40} className="mx-auto mb-2 text-gray-400 animate-spin" />
                            <p className="text-gray-500">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell size={40} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-500">No notifications yet</p>
                            <p className="text-sm text-gray-400">We'll notify you when something happens</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.slice(0, 10).map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`relative p-4 hover:bg-gray-50 transition-colors border-l-4 ${!notification.isRead ? "bg-blue-50/50 border-l-blue-500" : "border-l-transparent"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p
                                                            className={`font-medium text-sm ${notification.isRead ? "text-gray-700" : "text-gray-900"
                                                                }`}
                                                        >
                                                            {notification.title}
                                                        </p>
                                                        {!notification.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                                                    </div>
                                                    <p className={`text-sm mt-1 ${notification.isRead ? "text-gray-500" : "text-gray-700"}`}>
                                                        {notification.data?.message || notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                                            addSuffix: true,
                                                        })}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="ml-2 h-6 w-6 p-0 hover:bg-blue-100"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={12} />
                                                    </Button>
                                                )}
                                            </div>
                                            {shouldShowActions(notification) && (
                                                <div className="flex gap-2 mt-3">
                                                    {notification.data?.actions?.map((action) => (
                                                        <Button
                                                            key={action.type}
                                                            variant={action.type === "approve" || action.type === "accept" ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleNotificationAction(notification.id, action.url, notification.type)
                                                            }}
                                                            className={getActionButtonStyle(action.type, notification.type)}
                                                        >
                                                            {getActionLabel(action.type)}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200">
                        <Button
                            variant="ghost"
                            className="w-full text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => {
                                setIsOpen(false)
                                router.push('/contacts?tab=sent')
                            }}
                        >
                            View all notifications
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default NotificationDropdown