import { io, type Socket } from "socket.io-client"

class SocketService {
    private socket: Socket | null = null
    private userId: string | null = null

    connect(userId: string) {
        if (this.socket?.connected) {
            return this.socket
        }

        this.userId = userId
        this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
            transports: ["websocket"],
            autoConnect: true,
        })

        this.socket.on("connect", () => {
            this.socket?.emit("join", userId)
        })

        this.socket.on("disconnect", () => {
            console.log("Disconnected from socket server")
        })

        this.socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error)
        })

        return this.socket
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }
    }

    // Listen for real-time notifications
    onNotification(callback: (notification: any) => void) {
        if (this.socket) {
            this.socket.on("notification", callback)
        }
    }

    // Remove notification listener
    offNotification(callback?: (notification: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("notification", callback)
            } else {
                this.socket.off("notification")
            }
        }
    }

    // Listen for group invitations
    onGroupInvitation(callback: (invitation: any) => void) {
        if (this.socket) {
            this.socket.on("groupInvitation", callback)
        }
    }

    offGroupInvitation(callback?: (invitation: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("groupInvitation", callback)
            } else {
                this.socket.off("groupInvitation")
            }
        }
    }

    // Listen for contact requests
    onContactRequest(callback: (request: any) => void) {
        if (this.socket) {
            this.socket.on("contactRequest", callback)
        }
    }

    offContactRequest(callback?: (request: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("contactRequest", callback)
            } else {
                this.socket.off("contactRequest")
            }
        }
    }

    getSocket() {
        return this.socket
    }

    isConnected() {
        return this.socket?.connected || false
    }
}

export const socketService = new SocketService()
export default socketService
