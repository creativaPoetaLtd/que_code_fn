"use client"

import { Button } from "@/components/ui/button"
import { Send, Coins } from "lucide-react"
import ChatHeader from "./chat-header"
import MessageItem from "./message-item"
import MessageInput from "./message-input"
import type { Conversation, Message } from "@/types"

interface ChatAreaProps {
    conversation: Conversation
    messages: Message[]
    showOnMobile: boolean
    onBackClick: () => void
    onSendMoney: () => void
    onRequestMoney: () => void
    onViewProfile: () => void
}

export default function ChatArea({
    conversation,
    messages,
    showOnMobile,
    onBackClick,
    onSendMoney,
    onRequestMoney,
    onViewProfile,
}: ChatAreaProps) {
    return (
        <div className={`${showOnMobile ? "flex" : "hidden"} md:flex flex-col flex-1 bg-gray-50 h-screen`}>
            {/* Chat Header */}
            <ChatHeader conversation={conversation} onBackClick={onBackClick} onViewProfile={onViewProfile} />

            {/* Money Transfer Buttons */}
            <div className="flex gap-2 p-4 border-b border-gray-200 bg-white">
                <Button onClick={onSendMoney} className="bg-[#00B512] hover:bg-[#009E10]">
                    <Send size={16} className="mr-2" />
                    Send Money
                </Button>
                <Button variant="outline" onClick={onRequestMoney}>
                    <Coins size={16} className="mr-2" />
                    Request Money
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                ))}
            </div>

            {/* Message Input */}
            <MessageInput />
        </div>
    )
}

