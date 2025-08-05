"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, UserPlus, Users, Send, MessageCirclePlus, Link } from "lucide-react"
import ConversationItem from "./conversation-item"
import GroupsModal from "./groups-modal"
import JoinGroupByLinkModal from "./join-group-by-link-modal" // Import new modal
import type { Conversation } from "@/types"
import Input from "../ui/Input-ant"
import StartChatModal from "./start-chart-modal"

interface ConversationListProps {
    conversations: Conversation[]
    activeConversation: Conversation
    onConversationSelect: (conversation: Conversation) => void
    showOnMobile: boolean
    onAddContact: () => void
    onViewContactRequests: () => void
    onQuickSendMoney: (conversation: Conversation) => void
    onStartNewChat?: (contact: any) => void
    onJoinGroup?: (group: any) => void
}

type FilterType = "all" | "users" | "groups"

export default function ConversationListWithFilters({
    conversations,
    activeConversation,
    onConversationSelect,
    showOnMobile,
    onAddContact,
    onViewContactRequests,
    onQuickSendMoney,
    onStartNewChat,
    onJoinGroup,
}: ConversationListProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [activeFilter, setActiveFilter] = useState<FilterType>("all")
    const [isStartChatModalOpen, setIsStartChatModalOpen] = useState<boolean>(false)
    const [isGroupsModalOpen, setIsGroupsModalOpen] = useState<boolean>(false)
    const [isJoinGroupByLinkModalOpen, setIsJoinGroupByLinkModalOpen] = useState<boolean>(false) // New state

    // Filter conversations based on search term and active filter
    const filteredConversations = conversations.filter((conv) => {
        const matchesSearch = (conv.name || "").toLowerCase().includes(searchTerm.toLowerCase())


        switch (activeFilter) {
            case "users":
                return matchesSearch && !conv.isGroup
            case "groups":
                return matchesSearch && conv.isGroup
            default:
                return matchesSearch
        }
    })

    // Count conversations by type
    const userCount = conversations.filter((conv) => !conv.isGroup).length
    const groupCount = conversations.filter((conv) => conv.isGroup).length

    const handleStartNewChat = (contact: any) => {
        const newConversation: Conversation = {
            id: Date.now(),
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

        if (onStartNewChat) {
            onStartNewChat(contact)
        }
        onConversationSelect(newConversation)
    }

    const handleJoinGroup = (group: any) => {
        const newConversation: Conversation = {
            id: Date.now(),
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

        if (onJoinGroup) {
            onJoinGroup(group)
        }
        onConversationSelect(newConversation)
    }

    return (
        <div
            className={`${showOnMobile ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white h-full overflow-hidden`}
        >
            {/* Header Section */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h4 className="text-lg font-semibold mb-0">Messages</h4>
                    <div className="flex gap-1 sm:gap-2">
                        {/* Contact Requests Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onViewContactRequests}
                            className="hover:bg-gray-100 transition-colors relative h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="View contact requests"
                        >
                            <UserPlus size={16} className="sm:size-18" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                3
                            </span>
                        </Button>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div className="mb-4">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Quick Actions</p>
                    <div className="flex gap-2 mb-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsStartChatModalOpen(true)}
                            className="flex-1 h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                            <MessageCirclePlus size={14} className="mr-1.5" />
                            New Chat
                        </Button>
                        <Button variant="outline" size="sm" onClick={onAddContact} className="flex-1 h-8 text-xs bg-transparent">
                            <UserPlus size={14} className="mr-1.5" />
                            Add Contact
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsGroupsModalOpen(true)}
                            className="flex-1 h-8 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        >
                            <Users size={14} className="mr-1.5" />
                            My Groups
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsJoinGroupByLinkModalOpen(true)}
                            className="flex-1 h-8 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                        >
                            <Link size={14} className="mr-1.5" />
                            Join Group
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                        placeholder="Search conversations..."
                        className="rounded-full bg-gray-100 border-0 py-1.5 sm:py-2 pl-9 sm:pl-10 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filter Tabs */}
                <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Conversations</p>
                    <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)}>
                        <TabsList className="grid w-full grid-cols-3 h-8">
                            <TabsTrigger value="all" className="text-xs">
                                All ({conversations.length})
                            </TabsTrigger>
                            <TabsTrigger value="users" className="text-xs">
                                Users ({userCount})
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="text-xs">
                                Groups ({groupCount})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                    <>
                        {/* Section Header */}
                        {searchTerm === "" && (
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                    {activeFilter === "all" && "All Conversations"}
                                    {activeFilter === "users" && "Direct Messages"}
                                    {activeFilter === "groups" && "Group Chats"}
                                </p>
                            </div>
                        )}

                        {filteredConversations.map((conversation) => (
                            <div key={conversation.id} className="relative group">
                                <ConversationItem
                                    conversation={conversation}
                                    isActive={activeConversation.id === conversation.id}
                                    onClick={() => onConversationSelect(conversation)}
                                />
                                {/* Quick Send Money Button - Only for users */}
                                {!conversation.isGroup && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onQuickSendMoney(conversation)
                                        }}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 h-8 w-8"
                                        aria-label="Quick send money"
                                    >
                                        <Send size={14} />
                                    </Button>
                                )}
                                {/* Group Badge */}
                                {conversation.isGroup && (
                                    <Badge
                                        variant="outline"
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                                    >
                                        Group
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                        {searchTerm ? (
                            <>
                                <Search size={40} className="mb-3 text-gray-400" />
                                <p className="text-center mb-2">No conversations found</p>
                                <p className="text-sm text-gray-400 text-center mb-4">Try searching with different keywords</p>
                            </>
                        ) : (
                            <>
                                {activeFilter === "all" && (
                                    <>
                                        <MessageCirclePlus size={40} className="mb-3 text-gray-400" />
                                        <p className="text-center mb-2">No conversations yet</p>
                                        <p className="text-sm text-gray-400 text-center mb-4">Start chatting with your contacts</p>
                                    </>
                                )}
                                {activeFilter === "users" && (
                                    <>
                                        <MessageCirclePlus size={40} className="mb-3 text-gray-400" />
                                        <p className="text-center mb-2">No direct messages</p>
                                        <p className="text-sm text-gray-400 text-center mb-4">Start a conversation with your contacts</p>
                                    </>
                                )}
                                {activeFilter === "groups" && (
                                    <>
                                        <Users size={40} className="mb-3 text-gray-400" />
                                        <p className="text-center mb-2">No group chats</p>
                                        <p className="text-sm text-gray-400 text-center mb-4">Join a group to get started</p>
                                    </>
                                )}
                            </>
                        )}
                        <div className="space-y-2 w-full max-w-48">
                            {(activeFilter === "all" || activeFilter === "users") && (
                                <Button variant="default" onClick={() => setIsStartChatModalOpen(true)} className="w-full" size="sm">
                                    <MessageCirclePlus size={16} className="mr-2" />
                                    Start New Chat
                                </Button>
                            )}
                            {(activeFilter === "all" || activeFilter === "groups") && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsGroupsModalOpen(true)}
                                        className="w-full bg-transparent"
                                        size="sm"
                                    >
                                        <Users size={16} className="mr-2" />
                                        My Groups
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsJoinGroupByLinkModalOpen(true)}
                                        className="w-full bg-transparent"
                                        size="sm"
                                    >
                                        <Link size={16} className="mr-2" />
                                        Join Group
                                    </Button>
                                </>
                            )}
                            {activeFilter === "all" && (
                                <Button variant="outline" onClick={onAddContact} className="w-full bg-transparent" size="sm">
                                    <UserPlus size={16} className="mr-2" />
                                    Add Contact
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <StartChatModal
                isOpen={isStartChatModalOpen}
                onClose={() => setIsStartChatModalOpen(false)}
                onStartChat={handleStartNewChat}
                existingConversations={conversations}
            />

            <GroupsModal
                isOpen={isGroupsModalOpen}
                onClose={() => setIsGroupsModalOpen(false)}
                onJoinGroup={handleJoinGroup}
                existingConversations={conversations}
            />

            <JoinGroupByLinkModal
                isOpen={isJoinGroupByLinkModalOpen}
                onClose={() => setIsJoinGroupByLinkModalOpen(false)}
                onGroupJoined={handleJoinGroup} // Reuse handleJoinGroup to add to conversations
            />
        </div>
    )
}
