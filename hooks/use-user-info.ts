"use client"

import { useMemo } from "react"
import { useAuthToken } from "./use-auth-token"
import { decodeJWT, isTokenExpired } from "@/utils/jwtUtils"

export const useUserInfo = () => {
    const { getToken } = useAuthToken()

    const userInfo = useMemo(() => {
        const token = getToken()

        if (!token || isTokenExpired(token)) {
            return {
                userId: null,
                email: null,
                accountType: null,
                isAuthenticated: false,
                isTokenExpired: true,
            }
        }

        const payload = decodeJWT(token)

        if (!payload) {
            return {
                userId: null,
                email: null,
                accountType: null,
                isAuthenticated: false,
                isTokenExpired: true,
            }
        }

        return {
            userId: payload.id,
            email: payload.email,
            accountType: payload.accountType,
            isAuthenticated: true,
            isTokenExpired: false,
        }
    }, [getToken])

    return userInfo
}
