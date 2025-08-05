export interface NotificationAction {
    type: string
    label: string
    url: string
}

export interface Notification {
    id: string
    type: string
    title: string
    message?: string // Optional message field
    data?: {
        groupId?: string
        groupName?: string
        requestId?: string
        userId?: string
        userName?: string
        message?: string
        actions?: NotificationAction[] // Add this line
        // Add other potential data fields as needed
    }
    isRead: boolean
    createdAt: string
    updatedAt: string
}

export interface NotificationResponse {
    notifications: Notification[]
    unreadCount: number
}

export interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    addNotification: (notification: Notification) => void
    markAsRead: (notificationId: string) => void
    clearNotifications: () => void
    isConnected: boolean
}
