import React from "react";
import { Typography, Avatar } from "antd";

const { Text } = Typography;

const MessageItem = ({ message }: any) => {
    return (
        <div className={`flex ${message.isMe ? 'justify-end' : 'justify-start'} mb-4`}>
            {!message.isMe && (
                <Avatar src={message.avatar} size={36} className="mt-1 mr-2" />
            )}

            <div className={`max-w-[75%] ${message.isMe ? 'bg-[#00B512] text-white' : 'bg-white'} rounded-2xl px-4 py-3 shadow-sm`}>
                {!message.isMe && (
                    <Text strong className="block text-xs mb-1">{message.sender}</Text>
                )}
                <Text className={message.isMe ? 'text-white' : ''}>{message.message}</Text>
                <Text className={`block text-right text-xs mt-1 ${message.isMe ? 'text-green-100' : 'text-gray-400'}`}>
                    {message.timestamp}
                </Text>
            </div>

            {message.isMe && (
                <Avatar src={message.avatar} size={36} className="mt-1 ml-2" />
            )}
        </div>
    );
};

export default MessageItem;