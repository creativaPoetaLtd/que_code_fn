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
        <div className={`${showOnMobile ? "flex" : "hidden"} md:flex flex-col flex-1 bg-gradient-to-b from-gray-50 to-gray-100 h-full`}>
            {/* Chat Header */}
            <ChatHeader
                conversation={conversation}
                onBackClick={onBackClick}
                onViewProfile={onViewProfile}
                onInviteToGroup={onInviteToGroup} // Pass the prop to ChatHeader
            />
            {/* Quick Actions */}
            <div className="flex gap-2 p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
                <Button 
                    onClick={onSendMoney} 
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs sm:text-sm py-2 px-4 rounded-lg shadow-sm transition-all duration-200 flex-1 sm:flex-none"
                >
                    <Send size={14} className="mr-1.5 hidden sm:inline" />
                    Send Money
                </Button>
                <Button 
                    variant="outline" 
                    onClick={onRequestMoney} 
                    className="text-xs sm:text-sm py-2 px-4 rounded-lg border-gray-300 hover:bg-gray-50 transition-all duration-200 flex-1 sm:flex-none"
                >
                    <Coins size={14} className="mr-1.5 hidden sm:inline" />
                    Request Money
                </Button>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
                {messages.length > 0 ? (
                    <>
                        {messages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center max-w-md">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send size={24} className="text-blue-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-2">Start the conversation</p>
                            <p className="text-sm text-gray-500">
                                Send a message to begin chatting with {conversation.name}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {/* Message Input */}
            <MessageInput />
        </div>
    )
}
