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
            className={`${showOnMobile ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white h-screen md:h-auto`}
        >
            {/* Header Section */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold mb-0">Messages</h4>
                    <div className="flex gap-2">
                        {/* Add Contact Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onAddContact}
                            className="hover:bg-gray-100 transition-colors"
                            aria-label="Add contact"
                        >
                            <UserPlus size={18} />
                        </Button>
                        {/* Create Group Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCreateGroup}
                            className="hover:bg-gray-100 transition-colors"
                            aria-label="Create group"
                        >
                            <Users size={18} />
                        </Button>
                        {/* Create Contribution Group Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCreateContributionGroup}
                            className="hover:bg-gray-100 transition-colors"
                            aria-label="Create contribution group"
                        >
                            <Coins size={18} />
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Search conversations..."
                            className="rounded-full bg-gray-100 border-0 py-2 pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
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
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                aria-label="Quick send money"
                            >
                                <Send size={16} />
                            </Button>
                        )}

                        {/* Contribution Group Badge */}
                        {conversation.isGroup && conversation.isContributionGroup && (
                            <Badge
                                variant="outline"
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
                            >
                                Contribution
                            </Badge>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

