"use client"

import { useRef, useEffect } from "react"
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
    onInviteToGroup?: () => void // Added this prop
}

export default function ChatArea({
    conversation,
    messages,
    showOnMobile,
    onBackClick,
    onSendMoney,
    onRequestMoney,
    onViewProfile,
    onInviteToGroup, // Destructure the new prop
}: ChatAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    return (
        <div className={`${showOnMobile ? "flex" : "hidden"} md:flex flex-col flex-1 bg-gray-50 h-full`}>
            {/* Chat Header */}
            <ChatHeader
                conversation={conversation}
                onBackClick={onBackClick}
                onViewProfile={onViewProfile}
                onInviteToGroup={onInviteToGroup} // Pass the prop to ChatHeader
            />
            {/* Money Transfer Buttons */}
            <div className="flex gap-2 p-3 sm:p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <Button onClick={onSendMoney} className="bg-[#00B512] hover:bg-[#009E10] text-xs sm:text-sm py-1 h-auto">
                    <Send size={14} className="mr-1.5 hidden sm:inline" />
                    Send Money
                </Button>
                <Button variant="outline" onClick={onRequestMoney} className="text-xs sm:text-sm py-1 h-auto bg-transparent">
                    <Coins size={14} className="mr-1.5 hidden sm:inline" />
                    Request Money
                </Button>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {messages.length > 0 ? (
                    <>
                        {messages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p className="text-center">No messages yet</p>
                        <p className="text-center text-sm mt-1">Start the conversation by sending a message</p>
                    </div>
                )}
            </div>
            {/* Message Input */}
            <MessageInput />
        </div>
    )
}
