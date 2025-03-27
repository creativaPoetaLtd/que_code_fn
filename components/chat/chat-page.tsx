"use client"

import { useState, useEffect } from "react"
import { Layout } from "antd"

import ConversationList from "@/components/chat/conversation-list"
import ChatArea from "@/components/chat/chat-area"
import SendMoneyModal from "@/components/chat/send-money-modal"
import RequestMoneyModal from "@/components/chat/request-money-modal"
import CreateGroupModal from "@/components/chat/create-group-modal"
import AddContactModal from "@/components/chat/add-contact-modal"
import UserProfileModal from "@/components/chat/user-profile-modal"
import GroupProfileModal from "@/components/chat/group-profile-modal"
import type { Conversation, Message, Contact, Group } from "@/types"
import Navigation from "../Navigation"

const { Content } = Layout

// Sample data for conversations
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
        isContributionGroup: true,
        lastMessage: "I've shared the social media calendar",
        timestamp: "Yesterday",
        unread: 0,
        avatar: "/placeholder.svg?height=40&width=40",
        members: 6,
        online: 2,
        contributionProgress: 50, // Example: 50% of contributions collected
        targetAmount: 2000,
        collectedAmount: 1000,
        deadline: "2023-12-31",
        description: "Group for Q4 marketing campaign budget contributions",
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
        isContributionGroup: true,
        lastMessage: "The MVP is ready for testing",
        timestamp: "Monday",
        unread: 0,
        avatar: "/placeholder.svg?height=40&width=40",
        members: 12,
        online: 7,
        contributionProgress: 75, // Example: 75% of contributions collected
        targetAmount: 5000,
        collectedAmount: 3750,
        deadline: "2023-11-30",
        description: "Group for new product launch expenses",
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
    {
        id: 3,
        sender: "David Wong",
        message: "I've already accepted the invitation. Looking forward to working with everyone!",
        timestamp: "10:35 AM",
        isMe: false,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 4,
        sender: "You",
        message: "Great! Let's start brainstorming some ideas before the meeting.",
        timestamp: "10:36 AM",
        isMe: true,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 5,
        sender: "Sarah Johnson",
        message: "Perfect! I'll prepare an agenda and share it with everyone.",
        timestamp: "10:40 AM",
        isMe: false,
        avatar: "/placeholder.svg?height=40&width=40",
    },
]

export default function ChatPage() {
    const [activeConversation, setActiveConversation] = useState<Conversation>(SAMPLE_CONVERSATIONS[0])
    const [showMobileConversationList, setShowMobileConversationList] = useState<boolean>(true)
    const [isMobile, setIsMobile] = useState<boolean>(false)

    // Modal states
    const [isSendMoneyModalOpen, setIsSendMoneyModalOpen] = useState<boolean>(false)
    const [isRequestMoneyModalOpen, setIsRequestMoneyModalOpen] = useState<boolean>(false)
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState<boolean>(false)
    const [isCreateContributionGroupModalOpen, setIsCreateContributionGroupModalOpen] = useState<boolean>(false)
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState<boolean>(false)
    const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false)
    const [isGroupProfileModalOpen, setIsGroupProfileModalOpen] = useState<boolean>(false)

    // Selected recipient for money operations
    const [selectedRecipient, setSelectedRecipient] = useState<string>("")

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const handleConversationSelect = (conversation: Conversation) => {
        setActiveConversation(conversation)
        if (isMobile) setShowMobileConversationList(false)
    }

    const handleSendMoney = (recipient?: string) => {
        setSelectedRecipient(recipient || activeConversation.name)
        setIsSendMoneyModalOpen(true)
    }

    const handleRequestMoney = () => {
        setIsRequestMoneyModalOpen(true)
    }

    const handleCreateGroup = (isContribution = false) => {
        if (isContribution) {
            setIsCreateContributionGroupModalOpen(true)
        } else {
            setIsCreateGroupModalOpen(true)
        }
    }

    const handleViewProfile = () => {
        if (activeConversation.isGroup) {
            setIsGroupProfileModalOpen(true)
        } else {
            setIsUserProfileModalOpen(true)
        }
    }

    return (
        <Layout className="min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <Content className="flex-1 flex flex-col lg:ml-20 transition-all duration-300">
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Conversation List */}
                    <ConversationList
                        conversations={SAMPLE_CONVERSATIONS}
                        activeConversation={activeConversation}
                        onConversationSelect={handleConversationSelect}
                        showOnMobile={showMobileConversationList}
                        onAddContact={() => setIsAddContactModalOpen(true)}
                        onCreateGroup={() => handleCreateGroup(false)}
                        onCreateContributionGroup={() => handleCreateGroup(true)}
                        onQuickSendMoney={(conversation) => handleSendMoney(conversation.name)}
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
                    />
                </div>
            </Content>

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

            <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
                isContributionGroup={false}
            />

            <CreateGroupModal
                isOpen={isCreateContributionGroupModalOpen}
                onClose={() => setIsCreateContributionGroupModalOpen(false)}
                isContributionGroup={true}
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
        </Layout>
    )
}

