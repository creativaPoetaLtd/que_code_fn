import React, { useState } from "react";
import { Typography, Input } from "antd";
import { Search } from "lucide-react";
import ConversationItem from "./ConversationItem";

const { Title } = Typography;

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

interface ConversationListProps {
    conversations: Conversation[];
    activeConversation: Conversation;
    onConversationSelect: (conversation: Conversation) => void;
    showOnMobile: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, activeConversation, onConversationSelect, showOnMobile }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div
            className={`${showOnMobile ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white`}
        >
            <div className="p-4 border-b border-gray-200">
                <Title level={4} className="mb-4">Messages</Title>
                <div className="relative">
                    <Input
                        placeholder="Search conversations..."
                        prefix={<Search size={18} className="text-gray-400" />}
                        className="rounded-full bg-gray-100 border-0 py-2 pl-10 z-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map(conversation => (
                    <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={activeConversation.id === conversation.id}
                        onClick={() => onConversationSelect(conversation)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ConversationList;