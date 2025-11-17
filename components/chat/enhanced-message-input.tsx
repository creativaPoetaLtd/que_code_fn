"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Smile, ImageIcon } from "lucide-react"
import OptionsDropdown from "./options-dropdown"
import { toast } from "@/hooks/use-toast"
import Input from "../ui/Input-ant"
import { useChat } from "@/context/ChatContext"

interface EnhancedMessageInputProps {
    chatId: string
    onSendMessage?: (message: string) => void
    disabled?: boolean
}

export default function EnhancedMessageInput({ 
    chatId, 
    onSendMessage, 
    disabled = false 
}: EnhancedMessageInputProps) {
    const [messageText, setMessageText] = useState<string>("")
    const [showOptions, setShowOptions] = useState<boolean>(false)
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const { sendMessage, startTyping, stopTyping } = useChat()

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowOptions(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // Handle typing indicators
    const handleTypingStart = useCallback(() => {
        if (!isTyping && !disabled) {
            setIsTyping(true)
            startTyping(chatId)
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Set new timeout to stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
            stopTyping(chatId)
        }, 2000)
    }, [chatId, isTyping, disabled, startTyping, stopTyping])

    const handleTypingStop = useCallback(() => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }
        if (isTyping) {
            setIsTyping(false)
            stopTyping(chatId)
        }
    }, [chatId, isTyping, stopTyping])

    const handleSendMessage = useCallback(() => {
        if (messageText.trim() && !disabled) {
            // Stop typing indicator
            handleTypingStop()

            // Send message via Socket.IO
            sendMessage(chatId, messageText.trim())

            // Call optional callback
            onSendMessage?.(messageText.trim())

            // Clear input
            setMessageText("")
        }
    }, [messageText, disabled, handleTypingStop, sendMessage, chatId, onSendMessage])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageText(e.target.value)
        if (e.target.value.trim()) {
            handleTypingStart()
        } else {
            handleTypingStop()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleOptionSelect = (option: string) => {
        setShowOptions(false)
        
        switch (option) {
            case "camera":
                toast({
                    title: "Camera",
                    description: "Image capture feature coming soon",
                })
                break
            case "gallery":
                toast({
                    title: "Gallery",
                    description: "Image gallery feature coming soon",
                })
                break
            case "document":
                toast({
                    title: "Document",
                    description: "Document sharing feature coming soon",
                })
                break
            case "contact":
                toast({
                    title: "Contact",
                    description: "Contact sharing feature coming soon",
                })
                break
            default:
                toast({
                    title: "Selected option",
                    description: option,
                })
        }
    }

    // Clean up typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [])

    return (
        <div className="bg-white p-3 sm:p-4 border-t border-gray-200 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Attachments area */}
                <div className="relative" ref={dropdownRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowOptions(!showOptions)}
                        disabled={disabled}
                        className={`transition-all duration-300 h-8 w-8 sm:h-10 sm:w-10 ${showOptions ? "bg-gray-100" : ""}`}
                        aria-label="Attachments"
                    >
                        <Paperclip size={16} className="sm:size-20 text-gray-500" />
                    </Button>

                    <OptionsDropdown isOpen={showOptions} onOptionSelect={handleOptionSelect} />
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className="hover:bg-gray-100 transition-colors h-8 w-8 sm:h-10 sm:w-10"
                    aria-label="Add image"
                    onClick={() => handleOptionSelect("gallery")}
                >
                    <ImageIcon size={16} className="sm:size-20 text-gray-500" />
                </Button>

                {/* Input Field */}
                <div className="relative flex-1">
                    <Input
                        placeholder={disabled ? "Chat unavailable" : "Type a message..."}
                        value={messageText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        className="rounded-full bg-gray-100 border-0 py-1.5 sm:py-2 px-3 sm:px-4 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-opacity-50 transition-all pr-8 sm:pr-10 text-sm disabled:opacity-50"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 hover:bg-transparent border-0 h-6 w-6 sm:h-8 sm:w-8"
                        aria-label="Emoji"
                    >
                        <Smile size={16} className="sm:size-18 text-gray-500" />
                    </Button>
                </div>

                {/* Send Button */}
                <Button
                    onClick={handleSendMessage}
                    size="icon"
                    disabled={disabled || !messageText.trim()}
                    className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all duration-200 ${
                        messageText.trim() && !disabled
                            ? "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    aria-label="Send message"
                >
                    <Send size={16} className="sm:size-18" />
                </Button>
            </div>

            {/* Typing indicator */}
            {isTyping && (
                <div className="text-xs text-gray-500 mt-2 px-2">
                    Typing...
                </div>
            )}
        </div>
    )
}