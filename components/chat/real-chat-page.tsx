'use client'

import { Layout } from "antd"
import { useEffect, useState } from "react"
import ChatArea from "@/components/chat/chat-area"
import ConversationListLayout from "@/components/chat/conversation-list-layout"
import Navigation from "@/components/Navigation"
import { useAuthToken } from "@/hooks/use-auth-token"
import { useChat } from "@/context/ChatContext"
import { useGetUserChatsQuery, useCreateOrGetDMChatMutation } from "@/states/chatSlice"
import { toast } from "@/hooks/use-toast"
import type { Chat, Message } from "@/types"

// Modal components
import SendMoneyModal from "@/components/chat/send-money-modal"
import RequestMoneyModal from "@/components/chat/request-money-modal"
import AddContactModal from "@/components/chat/add-contact-modal"
import UserProfileModal from "@/components/chat/user-profile-modal"
import GroupProfileModal from "@/components/chat/group-profile-modal"
import ContactRequestModal from "@/components/chat/contact-request"
import InviteToGroupModal from "@/components/chat/invite-to-group-modal"

const { Content } = Layout

export default function RealChatPage() {
    const { getToken, getUserId } = useAuthToken(true) // Enable auto-redirect on token expiration
    const token: string | null = getToken()
    const userId = getUserId()

    // Unified Chat context
    const {
        activeChat,
        setActiveChat,
        messages,
        typingUsers,
        onlineUsers,
        isConnected,
        conversations: enhancedConversations,
        sendMessage: enhancedSendMessage,
        markMessagesAsRead,
        createGroupChat,
        deleteChat,
        initializeEncryption,
        refreshConversations
    } = useChat()

    // API queries
    const { data: chatsData, error: chatsError, isLoading: chatsLoading } = useGetUserChatsQuery(undefined, {
        skip: !token
    })

    const [createOrGetDMChat] = useCreateOrGetDMChatMutation()

    // Local state
    const [showMobileConversationList, setShowMobileConversationList] = useState(true)
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null)

    // Modal states
    const [isSendMoneyModalOpen, setIsSendMoneyModalOpen] = useState(false)
    const [isRequestMoneyModalOpen, setIsRequestMoneyModalOpen] = useState(false)
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
    const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false)
    const [isGroupProfileModalOpen, setIsGroupProfileModalOpen] = useState(false)
    const [isContactRequestModalOpen, setIsContactRequestModalOpen] = useState(false)
    const [isInviteToGroupModalOpen, setIsInviteToGroupModalOpen] = useState(false)
    const [selectedRecipient, setSelectedRecipient] = useState("")

    // Use enhanced conversations if available, otherwise convert API data to legacy format  
    const conversations: any[] = enhancedConversations?.length ? 
        enhancedConversations.map((conv: any) => ({
            id: conv.id,
            name: conv.name,
            isGroup: conv.isGroup,
            isContributionGroup: false,
            lastMessage: conv.lastMessage?.content || "",
            timestamp: conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleTimeString() : "",
            unread: conv.unreadCount,
            avatar: conv.avatar || "/placeholder.svg?height=40&width=40",
            online: conv.isOnline,
            members: conv.memberCount,
            email: conv.isGroup ? undefined : conv.participants?.find((p: any) => p.userId !== userId)?.user?.email,
            phone: conv.isGroup ? undefined : conv.participants?.find((p: any) => p.userId !== userId)?.user?.phone,
            participants: conv.participants
        })) :
        chatsData?.data?.map((chat: Chat) => ({
            id: chat.id,
            name: chat.name,
            isGroup: chat.isGroup,
            isContributionGroup: false,
            lastMessage: chat.lastMessage?.content || "",
            timestamp: chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleTimeString() : "",
            unread: chat.unreadCount,
            avatar: chat.avatar || "/placeholder.svg?height=40&width=40", 
            online: chat.isOnline,
            members: chat.memberCount,
            email: chat.isGroup ? undefined : chat.participants.find(p => p.userId !== userId)?.user.email,
            phone: chat.isGroup ? undefined : chat.participants.find(p => p.userId !== userId)?.user.phone,
            participants: chat.participants
        })) || []

    // Get messages for active chat (compatible with both types)
    const activeMessages = activeChat ? messages[activeChat] || [] : []

    // Convert messages to legacy format (handle both enhanced and legacy message types)
    const legacyMessages = activeMessages.map((msg: any) => {
        // Properly extract sender name to avoid [object Object] issue
        let senderName = 'Unknown';
        
        if (typeof msg.sender === 'string') {
            senderName = msg.sender;
        } else if (msg.sender && typeof msg.sender === 'object') {
            if (msg.sender.name) {
                senderName = msg.sender.name;
            } else if (msg.sender.firstName && msg.sender.lastName) {
                senderName = `${msg.sender.firstName} ${msg.sender.lastName}`.trim();
            } else if (msg.sender.firstName) {
                senderName = msg.sender.firstName;
            } else if (msg.sender.lastName) {
                senderName = msg.sender.lastName;
            } else if (msg.sender.username) {
                senderName = msg.sender.username;
            } else if (msg.sender.email) {
                senderName = msg.sender.email;
            } else if (msg.sender.id) {
                senderName = `User ${msg.sender.id.substring(0, 8)}`;
            }
        }
        
        return {
            id: typeof msg.id === 'string' ? parseInt(msg.id) : msg.id,
            sender: senderName,
            message: msg.content || msg.message,
            timestamp: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : msg.timestamp,
            isMe: msg.isMe || msg.sender?.id === userId,
            avatar: msg.sender?.avatar || msg.avatar || "/placeholder.svg?height=40&width=40"
        };
    })

    // Event handlers
    const handleConversationSelect = (conversation: any) => {
        setSelectedChat({
            id: conversation.id,
            name: conversation.name,
            isGroup: conversation.isGroup,
            avatar: conversation.avatar,
            participants: conversation.participants || [],
            unreadCount: conversation.unread || 0,
            isOnline: conversation.online || false,
            memberCount: conversation.members
        })
        setActiveChat(conversation.id)
        setShowMobileConversationList(false)
    }

    const handleStartNewChat = async (contact: any) => {
        try {
            const result = await createOrGetDMChat({
                participantId: contact.otherUser.id
            }).unwrap()

            // The API returns the chatId, we can then select it
            const newChat: Chat = {
                id: result.data.chatId,
                name: `${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
                isGroup: false,
                avatar: contact.otherUser.profile?.profileImage || "/placeholder.svg?height=40&width=40",
                participants: [
                    { userId: userId!, user: contact.otherUser }
                ],
                unreadCount: 0,
                isOnline: contact.otherUser.isOnline || false
            }

            setSelectedChat(newChat)
            setActiveChat(newChat.id)
            setShowMobileConversationList(false)

            toast({
                title: "Chat Started",
                description: `Started a new conversation with ${newChat.name}`,
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.data?.message || "Failed to start chat",
                variant: "destructive"
            })
        }
    }

    const handleJoinGroup = async (group: any) => {
        try {
            const token = getToken();
            if (!token) {
                toast({
                    title: "Authentication Error",
                    description: "Please log in to join the group chat",
                    variant: "destructive"
                });
                return;
            }

            // Call the backend to join/create the group chat
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/group/${group.id}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to join group chat');
            }

            const data = await response.json();
            
            // Set the active chat to the group's chat ID
            setActiveChat(data.data.chatId);
            
            // Refresh conversations to include the new group chat
            refreshConversations();
            
            toast({
                title: "Group Chat Opened",
                description: `Welcome to ${group.name}! Your chat is ready.`,
            });
            
        } catch (error) {
            console.error("Error joining group chat:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to join group chat",
                variant: "destructive"
            });
        }
    }

    const openSendMoneyModal = (recipient: string) => {
        setSelectedRecipient(recipient)
        setIsSendMoneyModalOpen(true)
    }

    const closeSendMoneyModal = () => {
        setIsSendMoneyModalOpen(false)
        setSelectedRecipient("")
    }

    // Initialize encryption on mount
    useEffect(() => {
        if (isConnected && initializeEncryption) {
            initializeEncryption()
        }
    }, [isConnected, initializeEncryption])

    // Refresh conversations periodically
    useEffect(() => {
        if (refreshConversations) {
            refreshConversations()
            const interval = setInterval(refreshConversations, 30000) // Refresh every 30 seconds
            return () => clearInterval(interval)
        }
    }, [refreshConversations])

    // Handle chat errors
    useEffect(() => {
        if (chatsError) {
            toast({
                title: "Error loading chats",
                description: "Failed to load your conversations. Please try again.",
                variant: "destructive"
            })
        }
    }, [chatsError])

    if (!token || !userId) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex min-h-screen">
            <Navigation />
            
            <main className="flex-1 lg:ml-20 w-full max-w-full overflow-x-hidden">
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-100px)] md:h-screen shadow-lg">
                    {/* Connection Status */}
                    {!isConnected && (
                        <div className="bg-yellow-100 border-yellow-400 text-yellow-700 px-4 py-2 border-b">
                            <p className="text-sm">Connecting to chat server...</p>
                        </div>
                    )}

                    {/* Conversation List */}
                    <ConversationListLayout
                        conversations={conversations}
                        activeConversation={selectedChat || conversations[0]}
                        onConversationSelect={handleConversationSelect}
                        showOnMobile={showMobileConversationList}
                        onAddContact={() => setIsAddContactModalOpen(true)}
                        onViewContactRequests={() => setIsContactRequestModalOpen(true)}
                        onQuickSendMoney={(conversation) => openSendMoneyModal(conversation.name)}
                        onStartNewChat={handleStartNewChat}
                        onJoinGroup={handleJoinGroup}
                        isLoading={chatsLoading}
                    />

                    {/* Chat Area */}
                    {selectedChat ? (
                        <ChatArea
                            conversation={selectedChat as any}
                            messages={legacyMessages}
                            showOnMobile={!showMobileConversationList}
                            onBackClick={() => setShowMobileConversationList(true)}
                            onSendMoney={() => openSendMoneyModal(selectedChat.name)}
                            onRequestMoney={() => setIsRequestMoneyModalOpen(true)}
                            onViewProfile={() => {
                                if (selectedChat.isGroup) {
                                    setIsGroupProfileModalOpen(true)
                                } else {
                                    setIsUserProfileModalOpen(true)
                                }
                            }}
                            onInviteToGroup={() => setIsInviteToGroupModalOpen(true)}
                            typingUsers={typingUsers.filter(t => t.chatId === activeChat)}
                            onlineUsers={onlineUsers}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Select a conversation
                                </h3>
                                <p className="text-gray-500">
                                    Choose a conversation from the list to start chatting
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals */}
                <SendMoneyModal
                    isOpen={isSendMoneyModalOpen}
                    onClose={closeSendMoneyModal}
                    recipient={selectedRecipient}
                    currentConversation={selectedChat as any}
                />

                <RequestMoneyModal
                    isOpen={isRequestMoneyModalOpen}
                    onClose={() => setIsRequestMoneyModalOpen(false)}
                    conversation={selectedChat as any}
                />

                <AddContactModal
                    isOpen={isAddContactModalOpen}
                    onClose={() => setIsAddContactModalOpen(false)}
                />

                <UserProfileModal
                    isOpen={isUserProfileModalOpen}
                    onClose={() => setIsUserProfileModalOpen(false)}
                    user={selectedChat && !selectedChat.isGroup ? 
                        selectedChat.participants.find(p => p.userId !== userId)?.user as any : 
                        undefined
                    }
                />

                <GroupProfileModal
                    isOpen={isGroupProfileModalOpen}
                    onClose={() => setIsGroupProfileModalOpen(false)}
                    group={selectedChat?.isGroup ? selectedChat as any : undefined}
                />

                <ContactRequestModal
                    isOpen={isContactRequestModalOpen}
                    onClose={() => setIsContactRequestModalOpen(false)}
                />

                <InviteToGroupModal
                    isOpen={isInviteToGroupModalOpen}
                    onClose={() => setIsInviteToGroupModalOpen(false)}
                    group={selectedChat as any}
                    token={token}
                />
            </main>
        </div>
    )
}