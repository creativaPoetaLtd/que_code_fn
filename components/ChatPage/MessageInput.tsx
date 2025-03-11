import React, { FC, useState, useRef, useEffect } from "react";
import { Input, Button, message } from "antd";
import { Send, Paperclip, Smile, Image as ImageIcon } from "lucide-react";
import OptionsDropdown from "./OptionsDropdown";
import SendMoneyModal, { SendMoneyData } from "./SendMoneyModal";

interface MessageInputProps {
    onSendMessage?: (message: string) => void;
    onAttachmentSelect?: (option: string) => void;
}

const MessageInput: FC<MessageInputProps> = ({
    onSendMessage = () => { },
    onAttachmentSelect = () => { }
}) => {
    const [messageText, setMessageText] = useState<string>("");
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [showSendMoneyModal, setShowSendMoneyModal] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSendMessage = () => {
        if (messageText.trim()) {
            onSendMessage(messageText);
            setMessageText("");
        }
    };

    const handleOptionSelect = (option: string) => {
        onAttachmentSelect(option);
        setShowOptions(false);

        // Show the SendMoneyModal if "Send Money" is selected
        if (option === "Send Money") {
            setShowSendMoneyModal(true);
        }
    };

    const handleSendMoney = (data: SendMoneyData) => {
        message.success(`$${data.amount.toFixed(2)} sent to ${data.recipient}`);
        // In a real app, you would handle the payment process here

        // Optionally send a message about the transaction
        if (data.note) {
            setMessageText(`Sent $${data.amount.toFixed(2)} to ${data.recipient} - Note: ${data.note}`);
        } else {
            setMessageText(`Sent $${data.amount.toFixed(2)} to ${data.recipient}`);
        }
    };

    return (
        <>
            <div className="bg-white p-4 border-t border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                    {/* Attachments area */}
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            type="text"
                            shape="circle"
                            icon={<Paperclip size={20} className="text-gray-500" />}
                            onClick={() => setShowOptions(!showOptions)}
                            className={`transition-all duration-300 ${showOptions ? 'bg-gray-100' : ''}`}
                        />

                        <OptionsDropdown
                            isOpen={showOptions}
                            onOptionSelect={handleOptionSelect}
                        />
                    </div>

                    <Button
                        type="text"
                        shape="circle"
                        icon={<ImageIcon size={20} className="text-gray-500" />}
                        className="hover:bg-gray-100 transition-colors"
                    />

                    {/* Input Field */}
                    <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onPressEnter={handleSendMessage}
                        className="rounded-full bg-gray-100 border-0 flex-1 py-2 px-4 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all"
                        suffix={
                            <Button
                                type="text"
                                shape="circle"
                                icon={<Smile size={20} className="text-gray-500" />}
                                className="hover:bg-transparent border-0"
                            />
                        }
                    />

                    {/* Send Button */}
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<Send size={18} />}
                        onClick={handleSendMessage}
                        className="bg-green-600 hover:bg-green-700 border-0 shadow-md transition-all hover:shadow-lg"
                    />
                </div>
            </div>

            {/* Send Money Modal */}
            <SendMoneyModal
                isOpen={showSendMoneyModal}
                onClose={() => setShowSendMoneyModal(false)}
                onSend={handleSendMoney}
            />
        </>
    );
};

export default MessageInput;