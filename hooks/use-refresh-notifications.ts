"use client"

import { useCallback } from "react"
import { useGetNotificationsQuery } from "@/states/notificationSlice"
import { useAuthToken } from "./use-auth-token"

export const useRefreshNotifications = () => {
    const { getToken } = useAuthToken()
    const token = getToken()
    const { refetch } = useGetNotificationsQuery(
        { token: token || "" }, // Pass token to the query
        { skip: !token }, // Skip if no token is available
    )

    const refreshNotifications = useCallback(() => {
        if (token) {
            refetch()
        }
    }, [refetch, token])

    return refreshNotifications
}
