import React from "react";
import { Typography, Avatar, Badge } from "antd";
import { Users } from "lucide-react";

const { Text } = Typography;

const ConversationItem = ({ conversation, isActive, onClick }: any) => {
    return (
        <div
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${isActive ? 'bg-gray-50' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    {conversation.isGroup ? (
                        <div className="bg-[#00313A] h-10 w-10 rounded-full flex items-center justify-center text-white">
                            <Users size={20} />
                        </div>
                    ) : (
                        <Badge
                            dot
                            status={conversation.online ? "success" : "default"}
                            offset={[-4, 32]}
                        >
                            <Avatar src={conversation.avatar} size={40} />
                        </Badge>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <Text strong className="truncate">{conversation.name}</Text>
                        <Text type="secondary" className="text-xs whitespace-nowrap">{conversation.timestamp}</Text>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                        <Text type="secondary" className="text-sm truncate">
                            {conversation.isGroup &&
                                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 mr-2">
                                    {conversation.online}/{conversation.members}
                                </span>
                            }
                            {conversation.lastMessage}
                        </Text>
                        {conversation.unread > 0 && (
                            <span className="bg-[#00B512] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {conversation.unread}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversationItem;