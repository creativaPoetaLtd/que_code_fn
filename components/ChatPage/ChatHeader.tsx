import React from "react";
import { Typography, Avatar, Button } from "antd";
import { ChevronLeft, Users, Phone, Video, MoreVertical } from "lucide-react";

const { Text } = Typography;

const ChatHeader = ({ conversation, onBackClick }: any) => {
    return (
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBackClick}
                    className="md:hidden text-gray-600"
                >
                    <ChevronLeft size={24} />
                </button>

                {conversation.isGroup ? (
                    <div className="bg-[#00313A] h-10 w-10 rounded-full flex items-center justify-center text-white">
                        <Users size={20} />
                    </div>
                ) : (
                    <Avatar src={conversation.avatar} size={40} />
                )}

                <div>
                    <Text strong className="block">{conversation.name}</Text>
                    <Text type="secondary" className="text-xs">
                        {conversation.isGroup
                            ? `${conversation.online} online • ${conversation.members} members`
                            : (conversation.online ? 'Online' : 'Offline')}
                    </Text>
                </div>
            </div>

            <div className="flex gap-3">
                <Button type="text" shape="circle" icon={<Phone size={20} />} />
                <Button type="text" shape="circle" icon={<Video size={20} />} />
                <Button type="text" shape="circle" icon={<MoreVertical size={20} />} />
            </div>
        </div>
    );
};

export default ChatHeader;