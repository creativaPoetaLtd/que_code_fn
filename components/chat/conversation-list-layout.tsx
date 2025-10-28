'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ConversationItem from "./conversation-item"
import QuickActions from "./quick-actions"
import SearchBar from "./search-bar"
import ConversationFilters, { type FilterType } from "./conversation-filters"
import EmptyState from "./empty-state"
import StartChatModal from "./start-chart-modal"
import GroupsModal from "./groups-modal"
import JoinGroupByLinkModal from "./join-group-by-link-modal"
import type { Conversation } from "@/types"
import { Send } from 'lucide-react'

interface ConversationListLayoutProps {
    conversations: Conversation[]
    activeConversation: Conversation
    onConversationSelect: (conversation: Conversation) => void
    showOnMobile: boolean
    onAddContact: () => void
    onViewContactRequests: () => void
    onQuickSendMoney: (conversation: Conversation) => void
    onStartNewChat?: (contact: any) => void
    onJoinGroup?: (group: any) => void
    pendingRequestsCount?: number
}

export default function ConversationListLayout({
    conversations,
    activeConversation,
    onConversationSelect,
    showOnMobile,
    onAddContact,
    onViewContactRequests,
    onQuickSendMoney,
    onStartNewChat,
    onJoinGroup,
    pendingRequestsCount = 3,
}: ConversationListLayoutProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [activeFilter, setActiveFilter] = useState<FilterType>("all")
    const [isStartChatModalOpen, setIsStartChatModalOpen] = useState<boolean>(false)
    const [isGroupsModalOpen, setIsGroupsModalOpen] = useState<boolean>(false)
    const [isJoinGroupByLinkModalOpen, setIsJoinGroupByLinkModalOpen] = useState<boolean>(false)

    // Filter conversations
    const filteredConversations = conversations.filter((conv) => {
        const matchesSearch = conv.name.toLowerCase().includes(searchTerm.toLowerCase())
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

    return (
        <div
            className={`${
                showOnMobile ? "flex" : "hidden"
            } md:flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white h-full overflow-hidden`}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                    {pendingRequestsCount > 0 && (
                        <Badge className="bg-red-500 text-white">
                            {pendingRequestsCount} new
                        </Badge>
                    )}
                </div>

                <QuickActions
                    onAddContact={onAddContact}
                    onStartNewChat={() => setIsStartChatModalOpen(true)}
                    onViewMyGroups={() => setIsGroupsModalOpen(true)}
                    onJoinGroupByLink={() => setIsJoinGroupByLinkModalOpen(true)}
                    onViewContactRequests={onViewContactRequests}
                    pendingRequestsCount={pendingRequestsCount}
                />
            </div>

            {/* Search and Filters */}
            <div className="p-4 space-y-3 border-b border-gray-100">
                <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />
                <ConversationFilters
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    totalCount={conversations.length}
                    userCount={userCount}
                    groupCount={groupCount}
                />
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                    <div>
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
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-100 h-8 w-8"
                                        aria-label="Quick send money"
                                    >
                                        <Send size={14} className="text-blue-600" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        filterType={activeFilter}
                        hasSearchTerm={!!searchTerm}
                        onStartNewChat={() => setIsStartChatModalOpen(true)}
                        onViewMyGroups={() => setIsGroupsModalOpen(true)}
                        onJoinGroupByLink={() => setIsJoinGroupByLinkModalOpen(true)}
                        onAddContact={onAddContact}
                    />
                )}
            </div>

            {/* Modals */}
            <StartChatModal
                isOpen={isStartChatModalOpen}
                onClose={() => setIsStartChatModalOpen(false)}
                onStartChat={(contact) => {
                    onStartNewChat?.(contact)
                    setIsStartChatModalOpen(false)
                }}
                existingConversations={conversations}
            />
            <GroupsModal
                isOpen={isGroupsModalOpen}
                onClose={() => setIsGroupsModalOpen(false)}
                onJoinGroup={(group) => {
                    onJoinGroup?.(group)
                    setIsGroupsModalOpen(false)
                }}
                existingConversations={conversations}
            />
            <JoinGroupByLinkModal
                isOpen={isJoinGroupByLinkModalOpen}
                onClose={() => setIsJoinGroupByLinkModalOpen(false)}
                onGroupJoined={(group) => {
                    onJoinGroup?.(group)
                    setIsJoinGroupByLinkModalOpen(false)
                }}
            />
        </div>
    )
}