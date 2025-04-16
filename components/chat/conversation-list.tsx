"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Users, Coins, Send } from "lucide-react"
import ConversationItem from "./conversation-item"
import type { Conversation } from "@/types"
import Input from "../ui/Input-ant"

interface ConversationListProps {
    conversations: Conversation[]
    activeConversation: Conversation
    onConversationSelect: (conversation: Conversation) => void
    showOnMobile: boolean
    onAddContact: () => void
    onViewContactRequests: () => void
    onCreateGroup: () => void
    onCreateContributionGroup: () => void
    onQuickSendMoney: (conversation: Conversation) => void
}

export default function ConversationList({
    conversations,
    activeConversation,
    onConversationSelect,
    showOnMobile,
    onAddContact,
    onViewContactRequests,
    onCreateGroup,
    onCreateContributionGroup,
    onQuickSendMoney,
}: ConversationListProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")

    const filteredConversations = conversations.filter((conv) =>
        conv.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

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

                        {/* Add Contact Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onAddContact}
                            className="hover:bg-gray-100 transition-colors h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Add contact"
                        >
                            <UserPlus size={16} className="sm:size-18" />
                        </Button>

                        {/* Create Group Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCreateGroup}
                            className="hover:bg-gray-100 transition-colors h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Create group"
                        >
                            <Users size={16} className="sm:size-18" />
                        </Button>

                        {/* Create Contribution Group Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCreateContributionGroup}
                            className="hover:bg-gray-100 transition-colors h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Create contribution group"
                        >
                            <Coins size={16} className="sm:size-18" />
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Search conversations..."
                            className="rounded-full bg-gray-100 border-0 py-1.5 sm:py-2 pl-9 sm:pl-10 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                        <div key={conversation.id} className="relative group">
                            <ConversationItem
                                conversation={conversation}
                                isActive={activeConversation.id === conversation.id}
                                onClick={() => onConversationSelect(conversation)}
                            />

                            {/* Quick Send Money Button */}
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

                            {/* Contribution Group Badge */}
                            {conversation.isGroup && conversation.isContributionGroup && (
                                <Badge
                                    variant="outline"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full"
                                >
                                    Contribution
                                </Badge>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                        <p>No conversations found</p>
                        <Button variant="link" onClick={onAddContact} className="mt-2">
                            Add a new contact
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
