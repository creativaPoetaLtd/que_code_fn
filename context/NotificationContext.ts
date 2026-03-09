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
    const [authToken, setAuthToken] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // Monitor token changes to trigger reconnection
    useEffect(() => {
        const token = getToken()
        const userId = token ? getUserIdFromToken(token) : null
        
        // If userId changes (different user logged in), clear all notifications
        if (currentUserId && userId && currentUserId !== userId) {
            console.log('Different user detected, clearing notification state')
            setNotifications([])
            setUnreadCount(0)
            setIsConnected(false)
        }
        
        setAuthToken(token)
        setCurrentUserId(userId)

        // Listen for token changes via custom event
        const handleAuthTokenChange = (event: CustomEvent) => {
            const newToken = getToken()
            const newUserId = newToken ? getUserIdFromToken(newToken) : null
            
            // If user changed, clear notifications
            if (currentUserId && newUserId && currentUserId !== newUserId) {
                console.log('User changed via token event, clearing notification state')
                setNotifications([])
                setUnreadCount(0)
                setIsConnected(false)
            }
            
            setAuthToken(newToken)
            setCurrentUserId(newUserId)
        }

        window.addEventListener('authTokenChanged', handleAuthTokenChange as EventListener)

        return () => {
            window.removeEventListener('authTokenChanged', handleAuthTokenChange as EventListener)
        }
    }, [getToken, currentUserId])

    const addNotification = useCallback((notification: Notification) => {
        setNotifications((prev) => {
            // Check for duplicate by ID or by matching type + data combination
            const isDuplicate = prev.some(n => 
                n.id === notification.id || 
                (n.type === notification.type && 
                 n.data?.groupId === notification.data?.groupId &&
                 n.data?.userId === notification.data?.userId &&
                 // Check if created within last 5 seconds to avoid duplicates from multiple socket events
                 Math.abs(new Date(n.createdAt).getTime() - new Date(notification.createdAt).getTime()) < 5000)
            )
            if (isDuplicate) {
                return prev
            }
            // Increment unread count only for new notifications
            if (!notification.isRead) {
                setUnreadCount((prevCount) => prevCount + 1)
            }
            return [notification, ...prev]
        })
    }, [])

    const markAsRead = useCallback((notificationId: string) => {
        setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
    }, [])

    const clearNotifications = useCallback(() => {
        setNotifications([])
        setUnreadCount(0)
    }, [])

    const clearNotificationState = useCallback(() => {
        // Disconnect notification listeners
        const socket = socketService.getSocket();
        if (socket) {
            socketService.offNotification();
        }
        
        // Clear all state
        setNotifications([]);
        setUnreadCount(0);
        setIsConnected(false);
        setAuthToken(null);
    }, []);

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

    // Handle real-time notifications from generic 'notification' socket event
    const handleNotification = useCallback(
        (notification: any) => {
            const formattedNotification: Notification = {
                id: notification.id || `notification-${Date.now()}`,
                type: notification.type,
                title: notification.title || notification.data?.title || 'Notification',
                message: notification.message || notification.data?.message || '',
                data: notification.data,
                isRead: notification.isRead || false,
                createdAt: notification.createdAt || new Date().toISOString(),
                updatedAt: notification.updatedAt || new Date().toISOString(),
            }
            addNotification(formattedNotification)
            
            // Only show toast for certain notification types (not for every chat message)
            const shouldShowToast = !formattedNotification.type.startsWith('CHAT_MESSAGE_') || 
                                   formattedNotification.type === 'CHAT_MESSAGE_MONEY';
            
            if (shouldShowToast) {
                toast({
                    title: formattedNotification.title,
                    description: formattedNotification.message || formattedNotification.data?.message,
                    duration: 5000,
                })
            }
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
        if (authToken && !isTokenExpired(authToken)) {
            // Extract user ID from JWT token
            const userId = getUserIdFromToken(authToken)

            if (userId) {
                // Get existing socket connection (managed by ChatContext)
                const socket = socketService.getSocket()

                if (socket) {
                    // Listen to connection status from existing socket
                    const handleConnect = () => setIsConnected(true)
                    const handleDisconnect = () => setIsConnected(false)
                    const handleConnectError = () => setIsConnected(false)

                    socket.on("connect", handleConnect)
                    socket.on("disconnect", handleDisconnect)
                    socket.on("connect_error", handleConnectError)

                    // Set up event listeners for notifications - only use the generic notification handler
                    // since backend emits all notifications via "notification" event
                    socketService.onNotification(handleNotification)

                    // Update connection status based on current state
                    setIsConnected(socket.connected)

                    return () => {
                        // Clean up listeners only
                        socket.off("connect", handleConnect)
                        socket.off("disconnect", handleDisconnect)
                        socket.off("connect_error", handleConnectError)
                        socketService.offNotification(handleNotification)
                        setIsConnected(false)
                        if (reconnectTimeoutRef.current) {
                            clearTimeout(reconnectTimeoutRef.current)
                        }
                    }
                } else {
                    console.warn("No socket connection available for notifications")
                    setIsConnected(false)
                }
            } else {
                console.warn("Could not extract user ID from token")
                setIsConnected(false)
            }
        } else {
            console.warn("No valid token found")
            setIsConnected(false)
        }
    }, [authToken, handleNotification])

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        clearNotifications,
        removeNotification,
        removeContactRequestNotification,
        isConnected,
        clearNotificationState,
    }

    return React.createElement(
        NotificationContext.Provider,
        { value },
        children
    )
}
