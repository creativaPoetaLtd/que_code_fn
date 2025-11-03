'use client'

import { Layout } from "antd"
import ChatArea from "@/components/chat/chat-area"
import ConversationListLayout from "@/components/chat/conversation-list-layout"
import Navigation from "@/components/Navigation"
import { useChatLayout } from "@/hooks/use-chat-layout"
import { useChatModals } from "@/hooks/use-chat-modals"
import { useAuthToken } from "@/hooks/use-auth-token"
import { toast } from "@/hooks/use-toast"
import type { Contact, Group } from "@/types"

// Modal components
import SendMoneyModal from "@/components/chat/send-money-modal"
import RequestMoneyModal from "@/components/chat/request-money-modal"
import AddContactModal from "@/components/chat/add-contact-modal"
import UserProfileModal from "@/components/chat/user-profile-modal"
import GroupProfileModal from "@/components/chat/group-profile-modal"
import ContactRequestModal from "@/components/chat/contact-request"
import InviteToGroupModal from "@/components/chat/invite-to-group-modal"

// Sample data - in real app this would come from API
export const SAMPLE_CONVERSATIONS = [
    {
        id: 1,
        name: "Design Team",
        isGroup: true as const,
        isContributionGroup: false as const,
        lastMessage: "Let's finalize the mockups by EOD",
        timestamp: "10:45 AM",
        unread: 3,
        avatar: "/placeholder.svg?height=40&width=40",
        members: 8,
        online: 5,
        description: "Team responsible for UI/UX design across all products",
        createdAt: "2023-05-15",
        createdBy: "Alex Johnson",
    },
    {
        id: 2,
        name: "Marketing Campaign",
        isGroup: true as const,
        isContributionGroup: false as const,
        lastMessage: "I've shared the social media calendar",
        timestamp: "Yesterday",
        unread: 0,
        avatar: "/placeholder.svg?height=40&width=40",
        members: 6,
        online: 2,
        description: "Group for Q4 marketing campaign planning",
        createdAt: "2023-09-01",
        createdBy: "Maya Rodriguez",
    },
    {
        id: 3,
        name: "Sarah Johnson",
        isGroup: false as const,
        isContributionGroup: false as const,
        lastMessage: "Can we schedule a call tomorrow?",
        timestamp: "Yesterday",
        unread: 1,
        avatar: "/placeholder.svg?height=40&width=40",
        online: true,
        email: "sarah.johnson@example.com",
        phone: "+1 555-123-4567",
        address: "123 Main St, San Francisco, CA",
        joinedAt: "2023-01-15",
    },
    {
        id: 4,
        name: "Product Launch",
        isGroup: true as const,
        isContributionGroup: false as const,
        lastMessage: "The MVP is ready for testing",
        timestamp: "Monday",
        unread: 0,
        avatar: "/placeholder.svg?height=40&width=40",
        members: 12,
        online: 7,
        description: "Group for new product launch coordination",
        createdAt: "2023-08-15",
        createdBy: "John Smith",
    },
    {
        id: 5,
        name: "Michael Chen",
        isGroup: false as const,
        isContributionGroup: false as const,
        lastMessage: "I've reviewed your proposal",
        timestamp: "Monday",
        unread: 0,
        avatar: "/placeholder.svg?height=40&width=40",
        online: false,
        email: "michael.chen@example.com",
        phone: "+1 555-987-6543",
        address: "456 Oak Ave, Seattle, WA",
        joinedAt: "2023-03-10",
    },
]

export const SAMPLE_MESSAGES = [
    {
        id: 1,
        sender: "Sarah Johnson",
        message: "Hi team! I've created a new invitation for our project kickoff.",
        timestamp: "10:30 AM",
        isMe: false,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 2,
        sender: "You",
        message: "Thanks Sarah! I'll check it out right away.",
        timestamp: "10:32 AM",
        isMe: true,
        avatar: "/placeholder.svg?height=40&width=40",
    },
]

const { Content } = Layout

export default function ChatPageClean() {
    const { getToken } = useAuthToken(true) // Enable auto-redirect on token expiration
    const token: string | null = getToken()

    // Custom hooks for state management
    const {
        conversations,
        activeConversation,
        showMobileConversationList,
        setShowMobileConversationList,
        handleConversationSelect,
        addConversation,
    } = useChatLayout({ initialConversations: SAMPLE_CONVERSATIONS })

    const {
        isSendMoneyModalOpen,
        isRequestMoneyModalOpen,
        isAddContactModalOpen,
        isUserProfileModalOpen,
        isGroupProfileModalOpen,
        isContactRequestModalOpen,
        isInviteToGroupModalOpen,
        selectedRecipient,
        openSendMoneyModal,
        closeSendMoneyModal,
        setIsRequestMoneyModalOpen,
        setIsAddContactModalOpen,
        setIsUserProfileModalOpen,
        setIsGroupProfileModalOpen,
        setIsContactRequestModalOpen,
        setIsInviteToGroupModalOpen,
    } = useChatModals()

    // Event handlers
    const handleStartNewChat = (contact: any) => {
        console.log("Starting new chat with:", contact)
        const newConversation = {
            id: Date.now(),
            name: `${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
            isGroup: false as const,
            isContributionGroup: false as const,
            lastMessage: "",
            timestamp: "Now",
            unread: 0,
            avatar: "/placeholder.svg?height=40&width=40",
            online: false,
            email: contact.otherUser.email,
            phone: contact.otherUser.phone || "",
            address: contact.otherUser.address || "",
            joinedAt: contact.respondedAt || contact.invitedAt,
        }

        addConversation(newConversation)
        toast({
            title: "Chat Started",
            description: `Started a new conversation with ${newConversation.name}`,
        })
    }

    const handleJoinGroup = (group: any) => {
        const newConversation = {
            id: Date.now(),
            name: group.name,
            isGroup: true as const,
            isContributionGroup: false as const,
            lastMessage: "",
            timestamp: "Now",
            unread: 0,
            avatar: group.avatar || "/placeholder.svg?height=40&width=40",
            members: group.memberCount || 0,
            online: 0,
            description: group.description,
            createdAt: group.createdAt,
            createdBy: group.createdBy,
        }

        addConversation(newConversation)
        toast({
            title: "Joined Group",
            description: `You have joined ${newConversation.name}`,
        })
    }

    const handleViewProfile = () => {
        if (activeConversation.isGroup) {
            setIsGroupProfileModalOpen(true)
        } else {
            setIsUserProfileModalOpen(true)
        }
    }

    const handleInviteToGroup = () => {
        if (activeConversation.isGroup) {
            setIsInviteToGroupModalOpen(true)
        }
    }

    return (
        <Layout className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="flex min-h-screen">
                <Navigation />
                
                <main className="flex-1 lg:ml-20 w-full max-w-full overflow-x-hidden">
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-100px)] md:h-screen shadow-lg">
                        {/* Conversation List */}
                        <ConversationListLayout
                            conversations={conversations}
                            activeConversation={activeConversation}
                            onConversationSelect={handleConversationSelect}
                            showOnMobile={showMobileConversationList}
                            onAddContact={() => setIsAddContactModalOpen(true)}
                            onViewContactRequests={() => setIsContactRequestModalOpen(true)}
                            onQuickSendMoney={(conversation) => openSendMoneyModal(conversation.name)}
                            onStartNewChat={handleStartNewChat}
                            onJoinGroup={handleJoinGroup}
                        />

                        {/* Chat Area */}
                        <ChatArea
                            conversation={activeConversation}
                            messages={SAMPLE_MESSAGES}
                            showOnMobile={!showMobileConversationList}
                            onBackClick={() => setShowMobileConversationList(true)}
                            onSendMoney={() => openSendMoneyModal()}
                            onRequestMoney={() => setIsRequestMoneyModalOpen(true)}
                            onViewProfile={handleViewProfile}
                            onInviteToGroup={handleInviteToGroup}
                        />
                    </div>
                </main>
            </div>

            {/* Modals */}
            <SendMoneyModal
                isOpen={isSendMoneyModalOpen}
                onClose={closeSendMoneyModal}
                recipient={selectedRecipient}
                currentConversation={activeConversation}
            />
            <RequestMoneyModal
                isOpen={isRequestMoneyModalOpen}
                onClose={() => setIsRequestMoneyModalOpen(false)}
                conversation={activeConversation}
            />
            <AddContactModal 
                isOpen={isAddContactModalOpen} 
                onClose={() => setIsAddContactModalOpen(false)} 
            />
            <UserProfileModal
                isOpen={isUserProfileModalOpen}
                onClose={() => setIsUserProfileModalOpen(false)}
                user={activeConversation.isGroup ? null : (activeConversation as Contact)}
            />
            <GroupProfileModal
                isOpen={isGroupProfileModalOpen}
                onClose={() => setIsGroupProfileModalOpen(false)}
                group={activeConversation.isGroup ? (activeConversation as Group) : null}
            />
            <ContactRequestModal 
                isOpen={isContactRequestModalOpen} 
                onClose={() => setIsContactRequestModalOpen(false)} 
            />
            <InviteToGroupModal
                isOpen={isInviteToGroupModalOpen}
                onClose={() => setIsInviteToGroupModalOpen(false)}
                group={activeConversation.isGroup ? activeConversation : null}
                token={token}
            />
        </Layout>
    )
}