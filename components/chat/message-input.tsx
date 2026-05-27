"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import type { EmojiClickData } from "emoji-picker-react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Smile, ImageIcon, X } from "lucide-react"
import OptionsDropdown from "./options-dropdown"
import { toast } from "@/hooks/use-toast"
import { useChat } from "@/context/ChatContext"
import { useTheme } from "@/context/ThemeContext"
import MediaUploadModal from "./media-upload-modal"
import { uploadMediaMessage } from "@/services/mediaService"
import { sendSecureMediaMessage } from "@/services/secureChatService"
import MentionDropdown, { MentionMember } from "./mention-dropdown"
import { useSearchGroupMembersQuery } from "@/states/groupSlice"
import { useAuthToken } from "@/hooks/use-auth-token"
import type { Conversation, ReplyPreview } from "@/types/chat.types"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })
const ALL_MENTION_USER_ID = "__all__"

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const MAX_HEIGHT = 160

// CSS variable overrides injected into the emoji picker's host div
const pickerVars = (isDark: boolean): React.CSSProperties => ({
    "--epr-bg-color":                isDark ? "#0c2418"                  : "#ffffff",
    "--epr-category-label-bg-color": isDark ? "#040f0c"                  : "#f9fafb",
    "--epr-search-input-bg-color":   isDark ? "#0d1e15"                  : "#f3f4f6",
    "--epr-search-input-text-color": isDark ? "#e5e7eb"                  : "#111827",
    "--epr-search-border-color":     isDark ? "rgba(255,255,255,0.07)"   : "#e5e7eb",
    "--epr-text-color":              isDark ? "#d1d5db"                  : "#374151",
    "--epr-category-icon-active-color": isDark ? "#00B512"               : "#00B512",
    "--epr-hover-color":             isDark ? "rgba(0,181,18,0.12)"      : "#f0fdf4",
    "--epr-focus-bg-color":          isDark ? "rgba(0,181,18,0.08)"      : "#dcfce7",
    "--epr-highlight-color":         "#00B512",
    "--epr-border-color":            isDark ? "rgba(255,255,255,0.06)"   : "#e5e7eb",
    "--epr-emoji-border-radius":     "10px",
    "--epr-header-padding":          "8px 8px 0",
} as React.CSSProperties)

interface MessageInputProps {
    onSendMessage?: (message: string) => void
    chatId?: string
    /** Pass the group ID when inside a group chat to enable @mentions */
    groupId?: string
    isSecureChat?: boolean
    secureConversation?: Conversation
    replyToMessage?: ReplyPreview | null
    onCancelReply?: () => void
}

export default function MessageInput({
    onSendMessage = () => { },
    chatId,
    groupId,
    isSecureChat = false,
    secureConversation,
    replyToMessage = null,
    onCancelReply,
}: MessageInputProps) {
    const [messageText, setMessageText]       = useState<string>("")
    const [showOptions, setShowOptions]       = useState<boolean>(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
    const [showMediaModal, setShowMediaModal] = useState<boolean>(false)
    const [uploading, setUploading]           = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [cursorPos, setCursorPos]           = useState<number>(0)

    // ── @Mention state ────────────────────────────────────────────────────────
    /** The current `@query` being typed, or null when not in mention mode */
    const [mentionQuery, setMentionQuery]     = useState<string | null>(null)
    /** Start index of the `@` character in messageText */
    const [mentionStart, setMentionStart]     = useState<number>(-1)
    const [mentionActiveIdx, setMentionActiveIdx] = useState<number>(0)
    /**
     * Registry of all mentions accepted during this composition.
     * Key: mention label (lower-cased), Value: mention payload.
     */
    const [mentionMap, setMentionMap]         = useState<Map<string, { userId: string; username: string }>>(new Map())
    // Debounced query to avoid firing a request on every keystroke
    const [debouncedMentionQuery, setDebouncedMentionQuery] = useState<string>("")

    const wrapperRef      = useRef<HTMLDivElement | null>(null)
    const dropdownRef     = useRef<HTMLDivElement | null>(null)
    const emojiPickerRef  = useRef<HTMLDivElement | null>(null)
    const emojiButtonRef  = useRef<HTMLButtonElement | null>(null)
    const textareaRef     = useRef<HTMLTextAreaElement | null>(null)

    const chat   = useChat()
    const { theme } = useTheme()
    const { getToken, getUserId } = useAuthToken()
    const token  = getToken()
    const userId = getUserId()
    const isDark = theme === "dark"
    const { activeChat, sendMessage: contextSendMessage, startTyping, stopTyping, isConnected, addMessage } = chat
    const currentChatId = chatId || activeChat

    // ── Debounce mentionQuery for the RTK search ───────────────────────────────
    useEffect(() => {
        const id = setTimeout(() => setDebouncedMentionQuery(mentionQuery ?? ""), 250)
        return () => clearTimeout(id)
    }, [mentionQuery])

    const showMentionDropdown = mentionQuery !== null && groupId !== undefined

    const { data: mentionResults, isFetching: mentionLoading } = useSearchGroupMembersQuery(
        { groupId: groupId!, q: debouncedMentionQuery, token: token! },
        { skip: !showMentionDropdown || !groupId || !token }
    )

    const mentionMembers: MentionMember[] = useMemo(() => {
        const members = mentionResults?.data ?? []
        const query = (mentionQuery ?? "").trim().toLowerCase()

        const supportsAllMention = query.length === 0 || "all".startsWith(query)
        if (!supportsAllMention) {
            return members
        }

        const allOption: MentionMember = {
            userId: ALL_MENTION_USER_ID,
            username: "all",
            name: "Everyone",
            avatar: null,
        }

        return [allOption, ...members]
    }, [mentionResults, mentionQuery])

    // Reset active index when results change
    useEffect(() => { setMentionActiveIdx(0) }, [mentionMembers])

    // ── Auto-resize ────────────────────────────────────────────────────────────
    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
        el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "scroll" : "hidden"
    }, [])

    useEffect(() => { resizeTextarea() }, [messageText, resizeTextarea])

    // ── Outside-click: close dropdown + emoji picker ───────────────────────────
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
            // Close mention dropdown on outside click
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setMentionQuery(null)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    // ── Save cursor position ───────────────────────────────────────────────────
    const saveCursor = () => {
        if (textareaRef.current) setCursorPos(textareaRef.current.selectionStart)
    }

    // ── Toggle emoji picker — dismisses keyboard on mobile ────────────────────
    const toggleEmojiPicker = () => {
        const next = !showEmojiPicker
        setShowEmojiPicker(next)
        if (next) {
            textareaRef.current?.blur()
        } else {
            requestAnimationFrame(() => textareaRef.current?.focus())
        }
    }

    // ── Insert emoji at cursor ─────────────────────────────────────────────────
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

    // ── Detect @mention trigger ────────────────────────────────────────────────
    const detectMention = useCallback((text: string, pos: number) => {
        if (!groupId) return

        // Walk backwards from cursor to find the nearest `@`
        const slice = text.slice(0, pos)
        const atIdx = slice.lastIndexOf("@")

        if (atIdx === -1) {
            setMentionQuery(null)
            return
        }

        // Ensure the character before `@` is a space / start-of-string (not mid-word)
        const charBefore = atIdx > 0 ? text[atIdx - 1] : " "
        if (!/\s/.test(charBefore)) {
            setMentionQuery(null)
            return
        }

        const query = text.slice(atIdx + 1, pos)

        // If there's a space inside the query, the mention has ended
        if (/\s/.test(query)) {
            setMentionQuery(null)
            return
        }

        setMentionStart(atIdx)
        setMentionQuery(query)
    }, [groupId])

    // ── Accept a mention from the dropdown ────────────────────────────────────
    const acceptMention = useCallback((member: MentionMember) => {
        if (mentionStart === -1) return

        const mentionLabel = member.userId === ALL_MENTION_USER_ID
            ? member.username
            : (member.name || member.username)

        const before  = messageText.slice(0, mentionStart)
        const after   = messageText.slice(cursorPos)
        const insert  = `@${mentionLabel} `
        const newText = before + insert + after
        const newPos  = mentionStart + insert.length

        setMessageText(newText)
        setCursorPos(newPos)
        setMentionQuery(null)
        setMentionStart(-1)

        // Register this mention in the map so we can send the userId later
        setMentionMap((prev) => {
            const next = new Map(prev)
            next.set(mentionLabel.toLowerCase(), { userId: member.userId, username: mentionLabel })
            return next
        })

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(newPos, newPos)
            }
        })
    }, [messageText, mentionStart, cursorPos])

    // ── Extract confirmed mentions from the final message text ────────────────
    const collectMentions = useCallback(
        (text: string): Array<{ userId: string; username: string }> => {
            const found: Array<{ userId: string; username: string }> = []
            const seen  = new Set<string>()

            mentionMap.forEach((mention) => {
                const label = mention.username
                const re = new RegExp(
                    `(^|\\s)@${escapeRegExp(label)}(?=\\s|$|[.,!?])`,
                    "i"
                )

                if (re.test(text) && !seen.has(mention.userId)) {
                    seen.add(mention.userId)
                    found.push({ userId: mention.userId, username: label })
                }
            })

            return found
        },
        [mentionMap]
    )

    // ── Send ───────────────────────────────────────────────────────────────────
    const handleSendMessage = useCallback(() => {
        const text = messageText.trim()
        if (!text) return

        const mentions = collectMentions(text)

        if (contextSendMessage && currentChatId) {
            contextSendMessage(
                currentChatId,
                text,
                "text",
                mentions,
                replyToMessage?.id,
                replyToMessage || null
            )
            if (stopTyping) stopTyping(currentChatId)
        } else {
            onSendMessage(text)
        }

        setMessageText("")
        setShowEmojiPicker(false)
        setMentionQuery(null)
        setMentionMap(new Map())
        if (onCancelReply) onCancelReply()
        if (textareaRef.current) {
            textareaRef.current.style.height    = "auto"
            textareaRef.current.style.overflowY = "hidden"
        }
    }, [
        messageText,
        currentChatId,
        contextSendMessage,
        stopTyping,
        onSendMessage,
        collectMentions,
        replyToMessage,
        onCancelReply,
    ])

    // ── Textarea events ────────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        const pos   = e.target.selectionStart
        setMessageText(value)
        setCursorPos(pos)
        detectMention(value, pos)
        if (currentChatId && startTyping && stopTyping) {
            if (value.trim()) startTyping(currentChatId)
            else stopTyping(currentChatId)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Handle mention dropdown keyboard navigation first
        if (showMentionDropdown && mentionMembers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setMentionActiveIdx((i) => Math.min(i + 1, mentionMembers.length - 1))
                return
            }
            if (e.key === "ArrowUp") {
                e.preventDefault()
                setMentionActiveIdx((i) => Math.max(i - 1, 0))
                return
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault()
                acceptMention(mentionMembers[mentionActiveIdx])
                return
            }
            if (e.key === "Escape") {
                setMentionQuery(null)
                return
            }
        }

        if (e.key === "Escape") { setShowEmojiPicker(false); return }
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
    }

    const handleBlur = () => {
        saveCursor()
        if (currentChatId && stopTyping) stopTyping(currentChatId)
    }

    // ── Attachments / Media ───────────────────────────────────────────────────
    const handleOptionSelect = (option: string) => {
        setShowOptions(false)
        toast({ title: "Selected option", description: option })
    }

    const handleMediaUpload = async (file: File, caption: string) => {
        if (isSecureChat) {
            if (!currentChatId || !token || !userId || !secureConversation) {
                toast({
                    title: "Secure media unavailable",
                    description: "Your secure session is not ready yet.",
                    variant: "destructive",
                })
                return
            }

            setUploading(true); setUploadProgress(10)
            try {
                const message = await sendSecureMediaMessage({
                    token,
                    userId,
                    chatId: currentChatId,
                    conversation: secureConversation,
                    file,
                    caption,
                })
                if (addMessage) addMessage(message as any)
                toast({ title: "Secure media sent", description: "Your encrypted media has been sent successfully" })
                setShowMediaModal(false)
            } catch (error: any) {
                toast({
                    title: "Secure media failed",
                    description: error?.message || "Failed to send encrypted media",
                    variant: "destructive",
                })
            } finally {
                setUploading(false); setUploadProgress(0)
            }
            return
        }

        if (!currentChatId) {
            toast({ title: "Error", description: "No active chat selected", variant: "destructive" })
            return
        }
        setUploading(true); setUploadProgress(0)
        try {
            const result = await uploadMediaMessage(currentChatId, file, caption, (p) => setUploadProgress(p.percentage))
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
            <div
                ref={wrapperRef}
                className="relative bg-white dark:bg-darkBg-card px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-100 dark:border-darkBorder-light"
            >
                {/* ── @Mention dropdown ──────────────────────────────────────────────── */}
                {showMentionDropdown && (
                    <MentionDropdown
                        members={mentionMembers}
                        activeIndex={mentionActiveIdx}
                        onSelect={acceptMention}
                        isLoading={mentionLoading && debouncedMentionQuery.length > 0}
                    />
                )}

                {/* ── Emoji picker popover ──────────────────────────────────────────── */}
                {showEmojiPicker && (
                    <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-0 right-0 sm:left-auto sm:right-0 sm:w-[300px] mb-1 z-50 animate-fadeIn"
                        style={{ filter: "drop-shadow(0 -4px 24px rgba(0,0,0,0.18))" }}
                    >
                        <div
                            className={`
                                overflow-hidden rounded-t-2xl sm:rounded-2xl
                                border border-b-0 sm:border-b
                                ${isDark ? "border-[rgba(255,255,255,0.07)]" : "border-gray-200"}
                            `}
                            style={pickerVars(isDark)}
                        >
                            <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                theme={isDark ? "dark" as any : "light" as any}
                                searchPlaceholder="Search emoji…"
                                skinTonesDisabled
                                width="100%"
                                height={340}
                                previewConfig={{ showPreview: false }}
                                lazyLoadEmojis
                            />
                        </div>
                    </div>
                )}

                {replyToMessage && (
                    <div className="mb-2 rounded-lg border border-gray-200 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-interactive px-3 py-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-brand-green dark:text-brand-gold truncate">
                                Replying to {replyToMessage.senderName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {replyToMessage.content || "(no text)"}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onCancelReply}
                            className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            aria-label="Cancel reply"
                        >
                            <X size={14} />
                        </Button>
                    </div>
                )}

                {/* ── Input row ─────────────────────────────────────────────────────── */}
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
                        onClick={() => {
                            setShowMediaModal(true)
                        }}
                        className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 mb-0.5 hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors"
                        aria-label="Add media"
                    >
                        <ImageIcon size={16} className="text-gray-500 dark:text-gray-400" />
                    </Button>

                    {/* Textarea */}
                    <div className="relative flex-1">
                        <textarea
                            ref={textareaRef}
                            placeholder={!isConnected ? "Connecting…" : groupId ? "Type a message… use @ to mention" : "Type a message…"}
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
                            aria-autocomplete={showMentionDropdown ? "list" : "none"}
                            className="w-full resize-none rounded-2xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light py-2.5 pl-4 pr-10 text-base leading-6 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-gold focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden hide-scrollbar"
                            style={{ minHeight: "44px" }}
                        />
                        {/* Emoji trigger */}
                        <button
                            ref={emojiButtonRef}
                            type="button"
                            onClick={toggleEmojiPicker}
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
                        Shift+Enter for new line{groupId ? " · @ to mention" : ""}
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
