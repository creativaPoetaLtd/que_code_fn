import { JWTPayload } from "@/types/jwt.types"

export const decodeJWT = (token: string): JWTPayload | null => {
    try {
        // Split the token into parts
        const parts = token.split(".")
        if (parts.length !== 3) {
            return null
        }

        // Decode the payload (second part)
        const payload = parts[1]

        // Add padding if needed for base64 decoding
        const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4)

        // Decode from base64
        const decodedPayload = atob(paddedPayload.replace(/-/g, "+").replace(/_/g, "/"))

        // Parse JSON
        const parsedPayload: JWTPayload = JSON.parse(decodedPayload)

        return parsedPayload
    } catch (error) {
        console.error("Error decoding JWT:", error)
        return null
    }
}

export const getUserIdFromToken = (token: string): string | null => {
    const payload = decodeJWT(token)
    return payload?.id || null
}

export const isTokenExpired = (token: string): boolean => {
    const payload = decodeJWT(token)
    if (!payload) return true

    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
}
