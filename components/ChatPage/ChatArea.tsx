import React from "react";
import ChatHeader from "./ChatHeader";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";

interface Message {
    id: number;
    sender: string;
    message: string;
    timestamp: string;
}

interface Conversation {
    id: number;
    name: string;
    isGroup: boolean;
    lastMessage: string;
    timestamp: string;
    unread: number;
    avatar: string;
    members?: number;
    online: number | boolean;
}

interface ChatAreaProps {
    conversation: Conversation;
    messages: Message[];
    showOnMobile: boolean;
    onBackClick: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ conversation, messages, showOnMobile, onBackClick }) => {
    return (
        <div
            className={`${showOnMobile ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-gray-50`}
            style={{
                height: showOnMobile ? 'calc(100vh - 80px)' : '100%', // Adjust for bottom navigation
                paddingBottom: showOnMobile ? '100px' : '0', // Add padding for bottom navigation
            }}
        >
            {/* Chat Header */}
            <ChatHeader conversation={conversation} onBackClick={onBackClick} />

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto p-4"
                style={{
                    maxHeight: showOnMobile ? 'calc(100vh - 200px)' : '100%', // Adjust for header and input
                }}
            >
                {messages.map((message: Message) => (
                    <MessageItem key={message.id} message={message} />
                ))}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200">
                <MessageInput />
            </div>
        </div>
    );
};

export default ChatArea;