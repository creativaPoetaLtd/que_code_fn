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
            console.log("Received group invitation:", invitation)

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
            console.log("Received contact request:", request)

            const notification: Notification = {
                id: `contact-request-${Date.now()}`,
                type: "contact_request",
                title: "New Contact Request",
                message: `${request.senderName} wants to connect with you`,
                data: request,
                isRead: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            addNotification(notification)

            toast({
                title: "New Contact Request",
                description: `${request.senderName} wants to connect with you`,
                duration: 7000,
            })
        },
        [addNotification],
    )

    // Handle group join approved notifications
    const handleGroupJoinApproved = useCallback(
        (data: any) => {
            console.log("Received group join approved:", data)
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
            console.log("Received group join rejected:", data)
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

    useEffect(() => {
        const token = getToken()

        if (token && !isTokenExpired(token)) {
            // Extract user ID from JWT token
            const userId = getUserIdFromToken(token)

            if (userId) {
                console.log("Connecting to socket with user ID:", userId)

                // Connect to socket
                const socket = socketService.connect(userId)

                socket.on("connect", () => {
                    setIsConnected(true)
                    console.log("Socket connected for notifications")
                })

                socket.on("disconnect", () => {
                    setIsConnected(false)
                    console.log("Socket disconnected")
                })

                socket.on("connect_error", (error) => {
                    console.error("Socket connection error:", error)
                    setIsConnected(false)
                })

                // Set up event listeners
                socketService.onNotification(handleNotification)
                socketService.onGroupInvitation(handleGroupInvitation)
                socketService.onContactRequest(handleContactRequest)
                socket.on("groupJoinApproved", handleGroupJoinApproved) // New listener
                socket.on("groupJoinRejected", handleGroupJoinRejected) // New listener

                return () => {
                    // Clean up listeners
                    socketService.offNotification(handleNotification)
                    socketService.offGroupInvitation(handleGroupInvitation)
                    socketService.offContactRequest(handleContactRequest)
                    socket.off("groupJoinApproved", handleGroupJoinApproved) // Clean up
                    socket.off("groupJoinRejected", handleGroupJoinRejected) // Clean up
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
    ])

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        clearNotifications,
        isConnected,
    }

    return React.createElement(
        NotificationContext.Provider,
        { value },
        children
    )
}
