import { io, type Socket } from "socket.io-client"

class SocketService {
    private socket: Socket | null = null
    private userId: string | null = null
    private connectionCount: number = 0

    connect(userId: string, token?: string) {
        this.connectionCount++

        if (this.socket?.connected) {
            console.log(`Socket already connected. Connection count: ${this.connectionCount}`)
            return this.socket
        }

        this.userId = userId
        console.log(`Creating new socket connection. Connection count: ${this.connectionCount}`)

        const finalToken = token || localStorage.getItem('token');

        this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
            transports: ["websocket", "polling"],
            autoConnect: true,
            auth: {
                token: finalToken
            }
        })

        this.socket.on("connect", () => {
            console.log("Connected to chat server")
            // User is automatically joined to their chats on connection
        })

        this.socket.on("disconnect", () => {
            console.log("Disconnected from socket server")
        })

        this.socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error)
            // If authentication error, clear token and redirect to login
            if (error.message.includes('Authentication error')) {
                localStorage.removeItem('token');
                window.location.href = '/auth/login';
            }
        })

        return this.socket
    }

    disconnect() {
        this.connectionCount = Math.max(0, this.connectionCount - 1)
        console.log(`Disconnect requested. Connection count: ${this.connectionCount}`)

        // Only actually disconnect when no contexts are using the socket
        if (this.connectionCount === 0 && this.socket) {
            console.log("Actually disconnecting socket")
            this.socket.disconnect()
            this.socket = null
            this.userId = null
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

    // Chat message methods
    joinChat(chatId: string) {
        if (this.socket) {
            this.socket.emit("join_chat", { chatId })
        }
    }

    leaveChat(chatId: string) {
        if (this.socket) {
            this.socket.emit("leave_chat", { chatId })
        }
    }

    sendMessage(chatId: string, content: string, messageType: "text" | "image" | "file" | "money" = "text", transactionId?: string) {
        if (this.socket) {
            if (this.socket.connected) {
                this.socket.emit("send_message", {
                    chatId,
                    content,
                    messageType,
                    transactionId
                })
            } else {
                console.error('Socket exists but is not connected. Attempting to reconnect...');
                // Try to reconnect and then send
                this.socket.connect();
                setTimeout(() => {
                    if (this.socket?.connected) {
                        console.log('Reconnected, sending message');
                        this.socket.emit("send_message", {
                            chatId,
                            content,
                            messageType,
                            transactionId
                        })
                    } else {
                        console.error('Failed to reconnect socket');
                    }
                }, 1000);
            }
        } else {
            console.error('No socket available to send message');
        }
    }

    markMessageRead(chatId: string, messageId: string) {
        if (this.socket) {
            this.socket.emit("mark_message_read", { chatId, messageId })
        }
    }

    startTyping(chatId: string) {
        if (this.socket) {
            this.socket.emit("typing_start", { chatId })
        }
    }

    stopTyping(chatId: string) {
        if (this.socket) {
            this.socket.emit("typing_stop", { chatId })
        }
    }

    // Listen for chat events
    onNewMessage(callback: (message: any) => void) {
        if (this.socket) {
            this.socket.on("new_message", callback)
        }
    }

    offNewMessage(callback?: (message: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("new_message", callback)
            } else {
                this.socket.off("new_message")
            }
        }
    }

    onMessageRead(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("message_read", callback)
        }
    }

    offMessageRead(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("message_read", callback)
            } else {
                this.socket.off("message_read")
            }
        }
    }

    onUserTyping(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("user_typing", callback)
        }
    }

    offUserTyping(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("user_typing", callback)
            } else {
                this.socket.off("user_typing")
            }
        }
    }

    onUserStatusChanged(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("user_status_changed", callback)
        }
    }

    offUserStatusChanged(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("user_status_changed", callback)
            } else {
                this.socket.off("user_status_changed")
            }
        }
    }

    onOnlineUsers(callback: (users: any[]) => void) {
        if (this.socket) {
            this.socket.on("online_users", callback)
        }
    }

    offOnlineUsers(callback?: (users: any[]) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("online_users", callback)
            } else {
                this.socket.off("online_users")
            }
        }
    }

    // Enhanced chat management methods
    createGroupChat(participantIds: string[], groupName?: string) {
        if (this.socket) {
            this.socket.emit("create_group_chat", { participantIds, groupName })
        }
    }

    deleteChat(chatId: string) {
        if (this.socket) {
            this.socket.emit("delete_chat", { chatId })
        }
    }

    initializeEncryption(password?: string) {
        if (this.socket) {
            this.socket.emit("initialize_encryption", { password })
        }
    }

    getChatParticipantsStatus(chatId: string) {
        if (this.socket) {
            this.socket.emit("get_chat_participants_status", { chatId })
        }
    }

    getOnlineUsers() {
        if (this.socket) {
            this.socket.emit("get_online_users")
        }
    }

    // Enhanced event listeners
    onMessageDelivered(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("message_delivered", callback)
        }
    }

    offMessageDelivered(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("message_delivered", callback)
            } else {
                this.socket.off("message_delivered")
            }
        }
    }

    onMessagesRead(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("messages_read", callback)
        }
    }

    offMessagesRead(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("messages_read", callback)
            } else {
                this.socket.off("messages_read")
            }
        }
    }

    onChatDeleted(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("chat_deleted", callback)
        }
    }

    offChatDeleted(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("chat_deleted", callback)
            } else {
                this.socket.off("chat_deleted")
            }
        }
    }

    onNewGroupChat(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("new_group_chat", callback)
        }
    }

    offNewGroupChat(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("new_group_chat", callback)
            } else {
                this.socket.off("new_group_chat")
            }
        }
    }

    onGroupChatCreated(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("group_chat_created", callback)
        }
    }

    offGroupChatCreated(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("group_chat_created", callback)
            } else {
                this.socket.off("group_chat_created")
            }
        }
    }

    onEncryptionInitialized(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("encryption_initialized", callback)
        }
    }

    offEncryptionInitialized(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("encryption_initialized", callback)
            } else {
                this.socket.off("encryption_initialized")
            }
        }
    }

    onChatParticipantsStatus(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("chat_participants_status", callback)
        }
    }

    offChatParticipantsStatus(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("chat_participants_status", callback)
            } else {
                this.socket.off("chat_participants_status")
            }
        }
    }

    onJoinedChat(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("joined_chat", callback)
        }
    }

    offJoinedChat(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("joined_chat", callback)
            } else {
                this.socket.off("joined_chat")
            }
        }
    }

    onLeftChat(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("left_chat", callback)
        }
    }

    offLeftChat(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("left_chat", callback)
            } else {
                this.socket.off("left_chat")
            }
        }
    }

    onError(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("error", callback)
        }
    }

    offError(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("error", callback)
            } else {
                this.socket.off("error")
            }
        }
    }

    // Listen for money received events
    onMoneyReceived(callback: (data: { amount: number; from: string; transactionId: string; chatId: string }) => void) {
        if (this.socket) {
            this.socket.on("money_received", callback)
        }
    }

    offMoneyReceived(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("money_received", callback)
            } else {
                this.socket.off("money_received")
            }
        }
    }

    // Listen for group donation events
    onGroupDonation(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on("group_donation_received", callback)
        }
    }

    offGroupDonation(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("group_donation_received", callback)
            } else {
                this.socket.off("group_donation_received")
            }
        }
    }

    // Listen for fundraising progress updates
    onFundraisingProgress(callback: (data: {
        groupId: string;
        groupName: string;
        currentAmount: number;
        targetAmount: number;
        progress: number;
        donorName: string;
        donationAmount: number;
    }) => void) {
        if (this.socket) {
            this.socket.on("fundraising_progress_update", callback)
        }
    }

    offFundraisingProgress(callback?: (data: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("fundraising_progress_update", callback)
            } else {
                this.socket.off("fundraising_progress_update")
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
