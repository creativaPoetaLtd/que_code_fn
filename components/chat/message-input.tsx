"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import type { EmojiClickData } from "emoji-picker-react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Smile, ImageIcon } from "lucide-react"
import OptionsDropdown from "./options-dropdown"
import { toast } from "@/hooks/use-toast"
import { useChat } from "@/context/ChatContext"
import { useTheme } from "@/context/ThemeContext"
import MediaUploadModal from "./media-upload-modal"
import { uploadMediaMessage } from "@/services/mediaService"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

const MAX_HEIGHT = 160

// CSS variable overrides injected into the emoji picker's host div
const pickerVars = (isDark: boolean): React.CSSProperties => ({
    // Background
    "--epr-bg-color":                isDark ? "#0c2418"                  : "#ffffff",
    "--epr-category-label-bg-color": isDark ? "#040f0c"                  : "#f9fafb",
    // Search
    "--epr-search-input-bg-color":   isDark ? "#0d1e15"                  : "#f3f4f6",
    "--epr-search-input-text-color": isDark ? "#e5e7eb"                  : "#111827",
    "--epr-search-border-color":     isDark ? "rgba(255,255,255,0.07)"   : "#e5e7eb",
    // Text & icons
    "--epr-text-color":              isDark ? "#d1d5db"                  : "#374151",
    "--epr-category-icon-active-color": isDark ? "#00B512"               : "#00B512",
    // Hover / highlight (brand-green tint)
    "--epr-hover-color":             isDark ? "rgba(0,181,18,0.12)"      : "#f0fdf4",
    "--epr-focus-bg-color":          isDark ? "rgba(0,181,18,0.08)"      : "#dcfce7",
    "--epr-highlight-color":         "#00B512",
    // Borders
    "--epr-border-color":            isDark ? "rgba(255,255,255,0.06)"   : "#e5e7eb",
    // Radius to match the app's rounded-2xl cards
    "--epr-emoji-border-radius":     "10px",
    "--epr-header-padding":          "8px 8px 0",
} as React.CSSProperties)

interface MessageInputProps {
    onSendMessage?: (message: string) => void
}

export default function MessageInput({ onSendMessage = () => { } }: MessageInputProps) {
    const [messageText, setMessageText]     = useState<string>("")
    const [showOptions, setShowOptions]     = useState<boolean>(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
    const [showMediaModal, setShowMediaModal]   = useState<boolean>(false)
    const [uploading, setUploading]         = useState<boolean>(false)
    const [uploadProgress, setUploadProgress]   = useState<number>(0)
    const [cursorPos, setCursorPos]         = useState<number>(0)

    const wrapperRef     = useRef<HTMLDivElement | null>(null)
    const dropdownRef    = useRef<HTMLDivElement | null>(null)
    const emojiPickerRef = useRef<HTMLDivElement | null>(null)
    const emojiButtonRef = useRef<HTMLButtonElement | null>(null)
    const textareaRef    = useRef<HTMLTextAreaElement | null>(null)

    const chat = useChat()
    const { theme } = useTheme()
    const isDark = theme === "dark"
    const { activeChat, sendMessage: contextSendMessage, startTyping, stopTyping, isConnected, addMessage } = chat

    // ── Auto-resize ───────────────────────────────────────────────────────────
    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
        el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden"
    }, [])

    useEffect(() => { resizeTextarea() }, [messageText, resizeTextarea])

    // ── Outside-click: close dropdown + emoji picker ──────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowOptions(false)
            }
            if (
                emojiPickerRef.current  && !emojiPickerRef.current.contains(e.target as Node) &&
                emojiButtonRef.current  && !emojiButtonRef.current.contains(e.target as Node)
            ) {
                setShowEmojiPicker(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    // ── Save cursor position ──────────────────────────────────────────────────
    const saveCursor = () => {
        if (textareaRef.current) setCursorPos(textareaRef.current.selectionStart)
    }

    // ── Insert emoji at cursor ────────────────────────────────────────────────
    const handleEmojiClick = (data: EmojiClickData) => {
        const emoji  = data.emoji
        const before = messageText.slice(0, cursorPos)
        const after  = messageText.slice(cursorPos)
        const newText = before + emoji + after
        setMessageText(newText)
        const newCursor = cursorPos + emoji.length
        setCursorPos(newCursor)
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(newCursor, newCursor)
            }
        })
    }

    // ── Send ──────────────────────────────────────────────────────────────────
    const handleSendMessage = useCallback(() => {
        const text = messageText.trim()
        if (!text) return
        if (contextSendMessage && activeChat) {
            contextSendMessage(activeChat, text)
            if (stopTyping) stopTyping(activeChat)
        } else {
            onSendMessage(text)
        }
        setMessageText("")
        setShowEmojiPicker(false)
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.overflowY = "hidden"
        }
    }, [messageText, activeChat, contextSendMessage, stopTyping, onSendMessage])

    // ── Textarea events ───────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setMessageText(value)
        setCursorPos(e.target.selectionStart)
        if (activeChat && startTyping && stopTyping) {
            if (value.trim()) startTyping(activeChat)
            else stopTyping(activeChat)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Escape") { setShowEmojiPicker(false); return }
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
    }

    const handleBlur = () => {
        saveCursor()
        if (activeChat && stopTyping) stopTyping(activeChat)
    }

    // ── Attachments / Media ───────────────────────────────────────────────────
    const handleOptionSelect = (option: string) => {
        setShowOptions(false)
        toast({ title: "Selected option", description: option })
    }

    const handleMediaUpload = async (file: File, caption: string) => {
        if (!activeChat) {
            toast({ title: "Error", description: "No active chat selected", variant: "destructive" })
            return
        }
        setUploading(true); setUploadProgress(0)
        try {
            const result = await uploadMediaMessage(activeChat, file, caption, (p) => setUploadProgress(p.percentage))
            if (result.success && result.data) {
                if (addMessage) addMessage(result.data as any)
                toast({ title: "Media sent", description: "Your media has been sent successfully" })
                setShowMediaModal(false)
            } else {
                toast({ title: "Upload failed", description: result.message || "Failed to upload media", variant: "destructive" })
            }
        } catch {
            toast({ title: "Upload failed", description: "An error occurred while uploading", variant: "destructive" })
        } finally {
            setUploading(false); setUploadProgress(0)
        }
    }

    const canSend = !!messageText.trim() && isConnected

    return (
        <>
            {/* Outer wrapper is `relative` so the emoji picker can be positioned against it */}
            <div
                ref={wrapperRef}
                className="relative bg-white dark:bg-darkBg-card px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-100 dark:border-darkBorder-light"
            >
                {/* ── Emoji picker popover ────────────────────────────────────────────── */}
                {showEmojiPicker && (
                    <div
                        ref={emojiPickerRef}
                        // Mobile: full-width flush with the input bar
                        // Desktop (sm+): 300 px, right-aligned
                        className="absolute bottom-full left-0 right-0 sm:left-auto sm:right-0 sm:w-[300px] mb-1 z-50 animate-fadeIn"
                        style={{
                            filter: "drop-shadow(0 -4px 24px rgba(0,0,0,0.18))",
                            // Round only the top corners on mobile (picker is flush at bottom)
                        }}
                    >
                        {/* Inner wrapper clips the picker and applies border + radius */}
                        <div
                            className={`
                                overflow-hidden rounded-t-2xl sm:rounded-2xl
                                border border-b-0 sm:border-b
                                ${isDark
                                    ? "border-[rgba(255,255,255,0.07)]"
                                    : "border-gray-200"
                                }
                            `}
                            style={pickerVars(isDark)}
                        >
                            <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                theme={isDark ? "dark" as any : "light" as any}
                                searchPlaceholder="Search emoji…"
                                skinTonesDisabled
                                // Full-width on mobile, fixed on desktop
                                width="100%"
                                height={340}
                                previewConfig={{ showPreview: false }}
                                lazyLoadEmojis
                            />
                        </div>
                    </div>
                )}

                {/* ── Input row ──────────────────────────────────────────────────────── */}
                <div className="flex items-end gap-1 sm:gap-2">

                    {/* Attachment */}
                    <div className="relative flex-shrink-0 pb-0.5" ref={dropdownRef}>
                        <Button
                            variant="ghost" size="icon"
                            onClick={() => setShowOptions(!showOptions)}
                            className={`h-8 w-8 sm:h-9 sm:w-9 transition-colors hover:bg-gray-100 dark:hover:bg-darkBg-interactive ${showOptions ? "bg-gray-100 dark:bg-darkBg-interactive" : ""}`}
                            aria-label="Attachments"
                        >
                            <Paperclip size={16} className="text-gray-500 dark:text-gray-400" />
                        </Button>
                        <OptionsDropdown isOpen={showOptions} onOptionSelect={handleOptionSelect} />
                    </div>

                    {/* Media */}
                    <Button
                        variant="ghost" size="icon"
                        onClick={() => setShowMediaModal(true)}
                        className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 mb-0.5 hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors"
                        aria-label="Add media"
                    >
                        <ImageIcon size={16} className="text-gray-500 dark:text-gray-400" />
                    </Button>

                    {/* Textarea */}
                    <div className="relative flex-1">
                        <textarea
                            ref={textareaRef}
                            placeholder={!isConnected ? "Connecting…" : "Type a message…"}
                            value={messageText}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            onClick={saveCursor}
                            onKeyUp={saveCursor}
                            disabled={!isConnected}
                            rows={1}
                            aria-label="Message input"
                            aria-multiline="true"
                            className="w-full resize-none rounded-2xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light py-2.5 pl-4 pr-10 text-base leading-6 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-gold focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                            style={{ minHeight: "44px" }}
                        />
                        {/* Emoji trigger — anchored to bottom-right of the textarea */}
                        <button
                            ref={emojiButtonRef}
                            type="button"
                            onClick={() => setShowEmojiPicker((v) => !v)}
                            aria-label="Open emoji picker"
                            aria-expanded={showEmojiPicker}
                            className={`absolute right-2 bottom-2 h-7 w-7 flex items-center justify-center rounded-full transition-colors ${
                                showEmojiPicker
                                    ? "text-brand-green dark:text-brand-gold"
                                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                        >
                            <Smile size={15} />
                        </button>
                    </div>

                    {/* Send */}
                    <Button
                        onClick={handleSendMessage}
                        size="icon"
                        disabled={!canSend}
                        aria-label="Send message"
                        className={`flex-shrink-0 mb-0.5 h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all duration-200 shadow-sm ${
                            canSend
                                ? "bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main hover:shadow-md"
                                : "bg-gray-200 dark:bg-darkBg-interactive text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        <Send size={15} />
                    </Button>
                </div>

                {/* Hint shown while typing */}
                {messageText.length > 0 && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 pl-1 select-none">
                        Shift+Enter for new line
                    </p>
                )}
            </div>

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
