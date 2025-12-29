"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Smile, ImageIcon } from "lucide-react"
import OptionsDropdown from "./options-dropdown"
import { toast } from "@/hooks/use-toast"
import Input from "../ui/Input-ant"
import { useChat } from "@/context/ChatContext"
import MediaUploadModal from "./media-upload-modal"
import { uploadMediaMessage } from "@/services/mediaService"

interface MessageInputProps {
    onSendMessage?: (message: string) => void
}

export default function MessageInput({ onSendMessage = () => { } }: MessageInputProps) {
    const [messageText, setMessageText] = useState<string>("")
    const [showOptions, setShowOptions] = useState<boolean>(false)
    const [showMediaModal, setShowMediaModal] = useState<boolean>(false)
    const [uploading, setUploading] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const chat = useChat()

    const {
        activeChat,
        sendMessage: contextSendMessage,
        startTyping,
        stopTyping,
        isConnected,
        addMessage
    } = chat

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
            if (contextSendMessage && activeChat) {
                contextSendMessage(activeChat, messageText.trim())
                // Stop typing indicator when sending
                if (stopTyping) {
                    stopTyping(activeChat)
                }
            } else {
                // Fallback to legacy onSendMessage prop
                onSendMessage(messageText)
            }

            setMessageText("")
            toast({
                title: "Message sent",
                description: "Message sent successfully",
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

    const handleMediaUpload = async (file: File, caption: string) => {
        if (!activeChat) {
            toast({
                title: "Error",
                description: "No active chat selected",
                variant: "destructive"
            })
            return
        }

        setUploading(true)
        setUploadProgress(0)

        try {
            const result = await uploadMediaMessage(
                activeChat,
                file,
                caption,
                (progress) => {
                    setUploadProgress(progress.percentage)
                }
            )

            if (result.success && result.data) {
                if (addMessage) {
                    addMessage(result.data as any)
                }

                toast({
                    title: "Media sent",
                    description: "Your media has been sent successfully",
                })
                setShowMediaModal(false)
            } else {
                toast({
                    title: "Upload failed",
                    description: result.message || "Failed to upload media",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Error uploading media:', error)
            toast({
                title: "Upload failed",
                description: "An error occurred while uploading",
                variant: "destructive"
            })
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    return (
        <>
            <div className="bg-white dark:bg-darkBg-card p-3 sm:p-4 border-t border-gray-100 dark:border-darkBorder-light shadow-sm fixed bottom-0 md:bottom-0 left-0 right-0 md:relative">
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowOptions(!showOptions)}
                            className={`transition-all duration-300 h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-darkBg-interactive ${showOptions ? "bg-gray-100 dark:bg-darkBg-interactive" : ""}`}
                            aria-label="Attachments"
                        >
                            <Paperclip size={16} className="sm:size-20 text-gray-500 dark:text-gray-400" />
                        </Button>

                        <OptionsDropdown isOpen={showOptions} onOptionSelect={handleOptionSelect} />
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMediaModal(true)}
                        className="hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors h-8 w-8 sm:h-10 sm:w-10"
                        aria-label="Add media"
                    >
                        <ImageIcon size={16} className="sm:size-20 text-gray-500 dark:text-gray-400" />
                    </Button>

                    <div className="relative flex-1">
                        <Input
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => {
                                const value = e.target.value
                                setMessageText(value)

                                if (activeChat && startTyping && stopTyping) {
                                    if (value.trim()) {
                                        startTyping(activeChat)
                                    } else {
                                        stopTyping(activeChat)
                                    }
                                }
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            onBlur={() => {
                                // Stop typing when input loses focus
                                if (activeChat && stopTyping) {
                                    stopTyping(activeChat)
                                }
                            }}
                            className="rounded-full bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light py-1.5 sm:py-2 px-3 sm:px-4 focus-visible:ring-2 focus-visible:ring-brand-green dark:focus-visible:ring-brand-gold focus-visible:ring-opacity-50 transition-all pr-8 sm:pr-10 text-sm text-gray-900 dark:text-white"
                            disabled={!isConnected}
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

                    <Button
                        onClick={handleSendMessage}
                        size="icon"
                        disabled={!messageText.trim() || !isConnected}
                        className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main shadow-md transition-all hover:shadow-lg rounded-full h-8 w-8 sm:h-10 sm:w-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        <Send size={16} className="sm:size-18" />
                    </Button>
                </div>
            </div>

            {/* Media Upload Modal */}
            <MediaUploadModal
                isOpen={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                onUpload={handleMediaUpload}
                uploading={uploading}
                uploadProgress={uploadProgress}
            />
        </>
    )
}
