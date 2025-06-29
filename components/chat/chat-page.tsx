"use client"

import { useState, useEffect } from "react"
import { Layout } from "antd"
import ChatArea from "@/components/chat/chat-area"
import SendMoneyModal from "@/components/chat/send-money-modal"
import RequestMoneyModal from "@/components/chat/request-money-modal"
import AddContactModal from "@/components/chat/add-contact-modal"
import UserProfileModal from "@/components/chat/user-profile-modal"
import GroupProfileModal from "@/components/chat/group-profile-modal"
import type { Conversation, Message, Contact, Group } from "@/types"
import ContactRequestModal from "@/components/chat/contact-request"
import Navigation from "@/components/Navigation"
import { useAuthToken } from "@/hooks/use-auth-token"
import { toast } from "@/hooks/use-toast"
import InviteToGroupModal from "@/components/chat/invite-to-group-modal"
import JoinGroupByLinkModal from "@/components/chat/join-group-by-link-modal" // Import new modal
import ConversationListWithFilters from "./conversation-list"

const { Content } = Layout

// Updated sample data - removed isContributionGroup distinction
export const SAMPLE_CONVERSATIONS: Conversation[] = [
    {
        id: 1,
        name: "Design Team",
        isGroup: true,
        isContributionGroup: false,
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
        isGroup: true,
        isContributionGroup: false, // Treated as regular group now
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
        isGroup: false,
        isContributionGroup: false,
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
        isGroup: true,
        isContributionGroup: false,
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
        isGroup: false,
        isContributionGroup: false,
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

// Sample messages for the active conversation
export const SAMPLE_MESSAGES: Message[] = [
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

export default function ChatPageImproved() {
    const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS)
    const [activeConversation, setActiveConversation] = useState<Conversation>(SAMPLE_CONVERSATIONS[0])
    const [showMobileConversationList, setShowMobileConversationList] = useState<boolean>(true)
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [isTablet, setIsTablet] = useState<boolean>(false)

    // Modal states
    const [isSendMoneyModalOpen, setIsSendMoneyModalOpen] = useState<boolean>(false)
    const [isRequestMoneyModalOpen, setIsRequestMoneyModalOpen] = useState<boolean>(false)
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState<boolean>(false)
    const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false)
    const [isGroupProfileModalOpen, setIsGroupProfileModalOpen] = useState<boolean>(false)
    const [isContactRequestModalOpen, setIsContactRequestModalOpen] = useState<boolean>(false)
    const [isInviteToGroupModalOpen, setIsInviteToGroupModalOpen] = useState<boolean>(false)
    const [isJoinGroupByLinkModalOpen, setIsJoinGroupByLinkModalOpen] = useState<boolean>(false) // New state

    const { getToken } = useAuthToken()
    const token: string | null = getToken()

    // Selected recipient for money operations
    const [selectedRecipient, setSelectedRecipient] = useState<string>("")

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
            // On larger screens, always show both panels
            if (window.innerWidth >= 768) {
                setShowMobileConversationList(true)
            }
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const handleConversationSelect = (conversation: Conversation) => {
        setActiveConversation(conversation)
        if (isMobile) setShowMobileConversationList(false)
    }

    const handleStartNewChat = (contact: any) => {
        // Create a new conversation from the contact
        const newConversation: Conversation = {
            id: Date.now(), // In real app, this would come from backend
            name: `${contact.contactUser.firstName} ${contact.contactUser.lastName}`,
            isGroup: false,
            isContributionGroup: false,
            lastMessage: "",
            timestamp: "Now",
            unread: 0,
            avatar: "/placeholder.svg?height=40&width=40",
            online: false,
            email: contact.contactUser.email,
            phone: contact.contactUser.phone || "",
            address: contact.contactUser.address || "",
            joinedAt: contact.respondedAt || contact.invitedAt,
        }

        // Add to conversations list if not already exists
        const existingConv = conversations.find((conv) => !conv.isGroup && conv.name === newConversation.name)

        if (!existingConv) {
            setConversations((prev) => [newConversation, ...prev])
        }

        // Select the conversation
        setActiveConversation(existingConv || newConversation)

        if (isMobile) setShowMobileConversationList(false)

        toast({
            title: "Chat Started",
            description: `Started a new conversation with ${newConversation.name}`,
        })
    }

    const handleJoinGroup = (group: any) => {
        // Create a new conversation from the group
        const newConversation: Conversation = {
            id: Date.now(), // In real app, this would come from backend
            name: group.name,
            isGroup: true,
            isContributionGroup: false,
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

        // Add to conversations list if not already exists
        const existingConv = conversations.find((conv) => conv.isGroup && conv.name === newConversation.name)

        if (!existingConv) {
            setConversations((prev) => [newConversation, ...prev])
        }

        // Select the conversation
        setActiveConversation(existingConv || newConversation)

        if (isMobile) setShowMobileConversationList(false)

        toast({
            title: "Joined Group",
            description: `You have joined ${newConversation.name}`,
        })
    }

    const handleSendMoney = (recipient?: string) => {
        setSelectedRecipient(recipient || activeConversation.name)
        setIsSendMoneyModalOpen(true)
    }

    const handleRequestMoney = () => {
        setIsRequestMoneyModalOpen(true)
    }

    const handleViewProfile = () => {
        if (activeConversation.isGroup) {
            setIsGroupProfileModalOpen(true)
        } else {
            setIsUserProfileModalOpen(true)
        }
    }

    const handleAddContact = () => {
        setIsAddContactModalOpen(true)
    }

    const handleViewContactRequests = () => {
        setIsContactRequestModalOpen(true)
    }

    const handleInviteToGroup = () => {
        if (activeConversation.isGroup) {
            setIsInviteToGroupModalOpen(true)
        }
    }

    return (
        <Layout className="min-h-screen bg-gray-50 mobile-bottom-padding">
            <div className="flex min-h-screen">
                <Navigation />
                {/* Main Content */}
                <main className="flex-1 lg:ml-20 w-full max-w-full overflow-x-hidden flex-1 flex flex-col transition-all duration-300">
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-100px)] md:h-screen">
                        {/* Conversation List with Filters */}
                        <ConversationListWithFilters
                            conversations={conversations}
                            activeConversation={activeConversation}
                            onConversationSelect={handleConversationSelect}
                            showOnMobile={showMobileConversationList}
                            onAddContact={handleAddContact}
                            onViewContactRequests={handleViewContactRequests}
                            onQuickSendMoney={(conversation) => handleSendMoney(conversation.name)}
                            onStartNewChat={handleStartNewChat}
                            onJoinGroup={handleJoinGroup}
                        />

                        {/* Chat Area */}
                        <ChatArea
                            conversation={activeConversation}
                            messages={SAMPLE_MESSAGES}
                            showOnMobile={!showMobileConversationList}
                            onBackClick={() => setShowMobileConversationList(true)}
                            onSendMoney={() => handleSendMoney()}
                            onRequestMoney={handleRequestMoney}
                            onViewProfile={handleViewProfile}
                            onInviteToGroup={handleInviteToGroup}
                        />
                    </div>
                </main>
            </div>

            {/* Modals */}
            <SendMoneyModal
                isOpen={isSendMoneyModalOpen}
                onClose={() => setIsSendMoneyModalOpen(false)}
                recipient={selectedRecipient}
                currentConversation={activeConversation}
            />
            <RequestMoneyModal
                isOpen={isRequestMoneyModalOpen}
                onClose={() => setIsRequestMoneyModalOpen(false)}
                conversation={activeConversation}
            />
            <AddContactModal isOpen={isAddContactModalOpen} onClose={() => setIsAddContactModalOpen(false)} />
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
            <ContactRequestModal isOpen={isContactRequestModalOpen} onClose={() => setIsContactRequestModalOpen(false)} />
            <InviteToGroupModal
                isOpen={isInviteToGroupModalOpen}
                onClose={() => setIsInviteToGroupModalOpen(false)}
                group={activeConversation.isGroup ? activeConversation : null}
                token={token}
            />
            <JoinGroupByLinkModal
                isOpen={isJoinGroupByLinkModalOpen}
                onClose={() => setIsJoinGroupByLinkModalOpen(false)}
                onGroupJoined={handleJoinGroup}
            />
        </Layout>
    )
}
