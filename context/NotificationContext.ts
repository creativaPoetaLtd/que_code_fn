"use client"

import React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { socketService } from "@/services/socketService"
import { useAuthToken } from "@/hooks/use-auth-token"
import { getUserIdFromToken, isTokenExpired } from "@/utils/jwtUtils"
import { toast } from "@/hooks/use-toast"
import type { Notification, NotificationContextType } from "@/types/notification.types"

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider")
    }
    return context
}

interface NotificationProviderProps {
    children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isConnected, setIsConnected] = useState(false)
    const { getToken } = useAuthToken()
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const addNotification = useCallback((notification: Notification) => {
        setNotifications((prev) => [notification, ...prev])
        if (!notification.isRead) {
            setUnreadCount((prev) => prev + 1)
        }
    }, [])

    const markAsRead = useCallback((notificationId: string) => {
        setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
    }, [])

    const clearNotifications = useCallback(() => {
        setNotifications([])
        setUnreadCount(0)
    }, [])

    const removeNotification = useCallback((notificationId: string) => {
        setNotifications((prev) => {
            const notification = prev.find(n => n.id === notificationId)
            const newNotifications = prev.filter(n => n.id !== notificationId)

            // Decrease unread count if the removed notification was unread
            if (notification && !notification.isRead) {
                setUnreadCount((prevCount) => Math.max(0, prevCount - 1))
            }

            return newNotifications
        })
    }, [])

    const removeContactRequestNotification = useCallback((userId: string) => {
        setNotifications((prev) => {
            const updatedNotifications = prev.filter(n => {
                // Remove contact request notifications from this specific user
                const isContactRequest = n.type === 'CONTACT_REQUEST_RECEIVED' || n.type === 'contact_request'
                const isFromUser = n.data?.userId === userId

                if (isContactRequest && isFromUser) {
                    // Decrease unread count if the notification was unread
                    if (!n.isRead) {
                        setUnreadCount((prevCount) => Math.max(0, prevCount - 1))
                    }
                    return false // Remove this notification
                }
                return true // Keep other notifications
            })

            return updatedNotifications
        })
    }, [])

    // Handle real-time notifications
    const handleNotification = useCallback(
        (notification: any) => {
            const formattedNotification: Notification = {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.data.message,
                data: notification.data, // Ensure data is passed
                isRead: notification.isRead || false,
                createdAt: notification.createdAt || new Date().toISOString(),
                updatedAt: notification.updatedAt || new Date().toISOString(),
            }
            addNotification(formattedNotification)
            toast({
                title: formattedNotification.title,
                description: formattedNotification.data?.message,
                duration: 5000,
            })
        },
        [addNotification],
    )

    // Handle group invitations
    const handleGroupInvitation = useCallback(
        (invitation: any) => {

            const notification: Notification = {
                id: `group-invite-${Date.now()}`,
                type: "group_invitation",
                title: "Group Invitation",
                message: `You've been invited to join "${invitation.groupName}"`,
                data: invitation,
                isRead: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            addNotification(notification)

            toast({
                title: "Group Invitation",
                description: `You've been invited to join "${invitation.groupName}"`,
                duration: 7000,
            })
        },
        [addNotification],
    )

    // Handle contact requests
    const handleContactRequest = useCallback(
        (request: any) => {

            const notification: Notification = {
                id: request.id || `contact-request-${Date.now()}`,
                type: request.type || "contact_request",
                title: request.data?.title || "New Contact Request",
                message: request.data?.message || `${request.senderName || request.data?.userName} wants to connect with you`,
                data: {
                    ...request.data,
                    userId: request.data?.userId,
                    userName: request.data?.userName,
                    userEmail: request.data?.userEmail,
                    url: request.data?.url,
                    actions: request.data?.actions || []
                },
                isRead: false,
                createdAt: request.createdAt || new Date().toISOString(),
                updatedAt: request.updatedAt || new Date().toISOString(),
            }

            addNotification(notification)

            toast({
                title: notification.title,
                description: notification.message,
                duration: 7000,
            })
        },
        [addNotification],
    )

    // Handle group join approved notifications
    const handleGroupJoinApproved = useCallback(
        (data: any) => {
            const notification: Notification = {
                id: data.id || `group-join-approved-${Date.now()}`,
                type: "group_join_approved",
                title: "Group Join Approved!",
                message: `Your request to join "${data.groupName}" has been approved by ${data.userName}.`,
                data: data,
                isRead: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            addNotification(notification)
            toast({
                title: "Group Join Approved",
                description: `You can now chat in "${data.groupName}"!`,
                duration: 7000,
            })
        },
        [addNotification],
    )

    // Handle group join rejected notifications
    const handleGroupJoinRejected = useCallback(
        (data: any) => {
            const notification: Notification = {
                id: data.id || `group-join-rejected-${Date.now()}`,
                type: "group_join_rejected",
                title: "Group Join Rejected",
                message: `Your request to join "${data.groupName}" has been declined by ${data.userName}.`,
                data: data,
                isRead: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            addNotification(notification)
            toast({
                title: "Group Join Rejected",
                description: `Your request to join "${data.groupName}" was declined.`,
                variant: "destructive",
                duration: 7000,
            })
        },
        [addNotification],
    )

    // Handle group join request notifications (for admins)
    const handleGroupJoinRequest = useCallback(
        (data: any) => {
            const notification: Notification = {
                id: data.id || `group-join-request-${Date.now()}`,
                type: "group_join_request",
                title: "New Group Join Request",
                message: `${data.userName} wants to join "${data.groupName}"`,
                data: {
                    ...data,
                    actions: [
                        { type: "approve", label: "Approve", url: `/groups/${data.groupId}/requests` },
                        { type: "reject", label: "Reject", url: `/groups/${data.groupId}/requests` }
                    ]
                },
                isRead: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            addNotification(notification)
            toast({
                title: "New Group Join Request",
                description: `${data.userName} wants to join "${data.groupName}"`,
                duration: 7000,
            })
        },
        [addNotification],
    )

    // Handle group created notifications
    const handleGroupCreated = useCallback(
        (data: any) => {
            const notification: Notification = {
                id: data.id || `group-created-${Date.now()}`,
                type: "group_created",
                title: "Group Created Successfully!",
                message: `Your group "${data.groupName}" has been created successfully.`,
                data: data,
                isRead: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            addNotification(notification)
            toast({
                title: "Group Created",
                description: `"${data.groupName}" is ready! Start inviting members.`,
                duration: 5000,
            })
        },
        [addNotification],
    )

    useEffect(() => {
        const token = getToken()

        if (token && !isTokenExpired(token)) {
            // Extract user ID from JWT token
            const userId = getUserIdFromToken(token)

            if (userId) {

                // Connect to socket
                const socket = socketService.connect(userId)

                socket.on("connect", () => {
                    setIsConnected(true)
                })

                socket.on("disconnect", () => {
                    setIsConnected(false)
                })

                socket.on("connect_error", (error) => {
                    setIsConnected(false)
                })

                // Set up event listeners
                socketService.onNotification(handleNotification)
                socketService.onGroupInvitation(handleGroupInvitation)
                socketService.onContactRequest(handleContactRequest)
                socket.on("CONTACT_REQUEST_RECEIVED", handleContactRequest) // Add specific handler for contact requests
                socket.on("groupJoinApproved", handleGroupJoinApproved) // New listener
                socket.on("groupJoinRejected", handleGroupJoinRejected) // New listener
                socket.on("groupJoinRequest", handleGroupJoinRequest) // New listener for join requests
                socket.on("groupCreated", handleGroupCreated) // New listener for group creation

                return () => {
                    // Clean up listeners
                    socketService.offNotification(handleNotification)
                    socketService.offGroupInvitation(handleGroupInvitation)
                    socketService.offContactRequest(handleContactRequest)
                    socket.off("CONTACT_REQUEST_RECEIVED", handleContactRequest) // Clean up contact request handler
                    socket.off("groupJoinApproved", handleGroupJoinApproved) // Clean up
                    socket.off("groupJoinRejected", handleGroupJoinRejected) // Clean up
                    socket.off("groupJoinRequest", handleGroupJoinRequest) // Clean up
                    socket.off("groupCreated", handleGroupCreated) // Clean up
                    socketService.disconnect()
                    setIsConnected(false)
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current)
                    }
                }
            } else {
                console.warn("Could not extract user ID from token")
            }
        } else {
            console.warn("No valid token found, not connecting to socket")
            // Disconnect if token is invalid or expired
            socketService.disconnect()
            setIsConnected(false)
        }
    }, [
        getToken,
        handleNotification,
        handleGroupInvitation,
        handleContactRequest,
        handleGroupJoinApproved,
        handleGroupJoinRejected,
        handleGroupJoinRequest,
        handleGroupCreated,
    ])

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        clearNotifications,
        removeNotification,
        removeContactRequestNotification,
        isConnected,
    }

    return React.createElement(
        NotificationContext.Provider,
        { value },
        children
    )
}
