"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Smile, ImageIcon } from "lucide-react"
import OptionsDropdown from "./options-dropdown"
import { toast } from "@/hooks/use-toast"
import Input from "../ui/Input-ant"

interface MessageInputProps {
    onSendMessage?: (message: string) => void
}

export default function MessageInput({ onSendMessage = () => { } }: MessageInputProps) {
    const [messageText, setMessageText] = useState<string>("")
    const [showOptions, setShowOptions] = useState<boolean>(false)
    const dropdownRef = useRef<HTMLDivElement | null>(null)

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

    const handleSendMessage = () => {
        if (messageText.trim()) {
            onSendMessage(messageText)
            setMessageText("")
            toast({
                title: "Message sent",
            })
        }
    }

    const handleOptionSelect = (option: string) => {
        setShowOptions(false)
        toast({
            title: "Selected option",
            description: option,
        })
    }

    return (
        <div className="bg-white p-3 sm:p-4 border-t border-gray-200 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Attachments area */}
                <div className="relative" ref={dropdownRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowOptions(!showOptions)}
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
                    className="hover:bg-gray-100 transition-colors h-8 w-8 sm:h-10 sm:w-10"
                    aria-label="Add image"
                >
                    <ImageIcon size={16} className="sm:size-20 text-gray-500" />
                </Button>

                {/* Input Field */}
                <div className="relative flex-1">
                    <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="rounded-full bg-gray-100 border-0 py-1.5 sm:py-2 px-3 sm:px-4 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-opacity-50 transition-all pr-8 sm:pr-10 text-sm"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
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
                    className="bg-[#00B512] hover:bg-[#009E10] text-white shadow-md transition-all hover:shadow-lg rounded-full h-8 w-8 sm:h-10 sm:w-10"
                    aria-label="Send message"
                >
                    <Send size={16} className="sm:size-18" />
                </Button>
            </div>
        </div>
    )
}
