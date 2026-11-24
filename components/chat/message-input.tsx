"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import type { EmojiClickData } from "emoji-picker-react"
import { Button } from "@/components/ui/button"
import { Plus, Send, Smile, X } from "lucide-react"
import OptionsDropdown from "./options-dropdown"
import { toast } from "@/hooks/use-toast"
import { useChat } from "@/context/ChatContext"
import { useTheme } from "@/context/ThemeContext"
import MediaUploadModal from "./media-upload-modal"
import ShareToGroupModal from "./share-to-group-modal"
import ShareLocationModal from "./share-location-modal"
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

/** Photos and videos, and everything the document picker takes */
const MEDIA_ACCEPT = "image/*,video/*"
const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
/** Matches the modal tray cap, and keeps a batch of uploads sane */
const MAX_ATTACHMENTS = 10

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
    onSendMoney?: () => void
    onRequestMoney?: () => void
    onCreateContribution?: () => void
    onCreateGroup?: () => void
    onSendMultiple?: () => void
    onCreateSharedWallet?: () => void
    /** The other participant of this DM — lets "Group" offer to invite them into one of your groups */
    shareTargetUserId?: string
    shareTargetName?: string
    onSendTicket?: () => void
    onShareAction?: () => void
    onCreatePoll?: () => void
    onCreateSharedNote?: () => void
    onCreateWhiteboard?: () => void
}

export default function MessageInput({
    onSendMessage = () => { },
    chatId,
    groupId,
    isSecureChat = false,
    secureConversation,
    replyToMessage = null,
    onCancelReply,
    onSendMoney,
    onRequestMoney,
    onCreateContribution,
    onCreateGroup,
    onSendMultiple,
    onCreateSharedWallet,
    shareTargetUserId,
    shareTargetName,
    onSendTicket,
    onShareAction,
    onCreatePoll,
    onCreateSharedNote,
    onCreateWhiteboard,
}: MessageInputProps) {
    const [messageText, setMessageText]       = useState<string>("")
    const [showOptions, setShowOptions]       = useState<boolean>(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
    const [showMediaModal, setShowMediaModal] = useState<boolean>(false)
    /** The files taken straight from the OS picker, awaiting captions */
    const [pickedFiles, setPickedFiles]       = useState<File[] | null>(null)
    const [pickedKind, setPickedKind]         = useState<"media" | "document">("media")
    const [showShareToGroupModal, setShowShareToGroupModal] = useState<boolean>(false)
    const [showShareLocationModal, setShowShareLocationModal] = useState<boolean>(false)
    const [uploading, setUploading]           = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    /** "Sending 2 of 5" while a batch is in flight */
    const [uploadLabel, setUploadLabel]       = useState<string>("")
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
    const mediaInputRef   = useRef<HTMLInputElement | null>(null)
    const documentInputRef = useRef<HTMLInputElement | null>(null)

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
        // Attaching a file is one decision, so go straight to the picker; the
        // caption step comes after, once there is something to caption.
        if (option === "Media") {
            setPickedKind("media")
            mediaInputRef.current?.click()
            return
        }
        if (option === "Document") {
            setPickedKind("document")
            documentInputRef.current?.click()
            return
        }
        if (option === "Send Money") {
            if (onSendMoney) { onSendMoney(); return }
            toast({ title: "Unavailable", description: "Open this chat to send money", variant: "destructive" })
            return
        }
        if (option === "Request Money") {
            if (onRequestMoney) { onRequestMoney(); return }
            toast({ title: "Unavailable", description: "Open this chat to request money", variant: "destructive" })
            return
        }
        if (option === "Contribution") {
            if (onCreateContribution) { onCreateContribution(); return }
            toast({ title: "Unavailable", description: "Open this chat to start a contribution", variant: "destructive" })
            return
        }
        if (option === "Group") {
            // In a DM, "Group" invites the other participant into one of your existing
            // groups rather than starting a brand new one.
            if (shareTargetUserId) { setShowShareToGroupModal(true); return }
            if (onCreateGroup) { onCreateGroup(); return }
            toast({ title: "Unavailable", description: "Unable to open group creation right now", variant: "destructive" })
            return
        }
        if (option === "Send to Multiple") {
            if (onSendMultiple) { onSendMultiple(); return }
            toast({ title: "Unavailable", description: "Unable to open multi-send right now", variant: "destructive" })
            return
        }
        if (option === "Shared Wallet") {
            if (onCreateSharedWallet) { onCreateSharedWallet(); return }
            toast({ title: "Unavailable", description: "Unable to open shared wallet creation right now", variant: "destructive" })
            return
        }
        if (option === "Shared Note") {
            if (onCreateSharedNote) { onCreateSharedNote(); return }
            toast({ title: "Unavailable", description: "Open this chat to start a shared note", variant: "destructive" })
            return
        }
        if (option === "Whiteboard") {
            if (onCreateWhiteboard) { onCreateWhiteboard(); return }
            toast({ title: "Unavailable", description: "Open this chat to start a whiteboard", variant: "destructive" })
            return
        }
        if (option === "Poll") {
            if (onCreatePoll) { onCreatePoll(); return }
            toast({ title: "Unavailable", description: "Open this chat to start a poll", variant: "destructive" })
            return
        }
        if (option === "Send Ticket") {
            if (onSendTicket) { onSendTicket(); return }
            toast({ title: "Unavailable", description: "Open this chat to send a ticket", variant: "destructive" })
            return
        }
        if (option === "Location") {
            if (!currentChatId) {
                toast({ title: "Unavailable", description: "Open this chat to share your location", variant: "destructive" })
                return
            }
            setShowShareLocationModal(true)
            return
        }
        if (option === "Share Action") {
            if (onShareAction) { onShareAction(); return }
            toast({ title: "Unavailable", description: "Open this chat to share an action", variant: "destructive" })
            return
        }
        toast({ title: "Coming soon", description: option })
    }

    /** Files came back from the OS picker — move on to preview and captions */
    const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        // Reset the input so picking the same file twice still fires a change
        e.target.value = ""
        if (!files.length) return
        setPickedFiles(files)
        setShowMediaModal(true)
    }

    const closeMediaModal = () => {
        setShowMediaModal(false)
        setPickedFiles(null)
    }

    /**
     * Send a tray of attachments as one message each, in the order shown, so a
     * batch behaves like several sends rather than one all-or-nothing upload.
     * Resolves with the files that failed, which the modal keeps for a retry.
     */
    const handleMediaUploadMany = async (
        entries: { file: File; caption: string }[]
    ): Promise<File[]> => {
        const allFiles = entries.map((entry) => entry.file)
        if (!entries.length) return []

        if (!currentChatId) {
            toast({ title: "Error", description: "No active chat selected", variant: "destructive" })
            return allFiles
        }

        // Captured once so the loop keeps a checked secure context throughout
        const secureCtx =
            isSecureChat && token && userId && secureConversation
                ? { token, userId, conversation: secureConversation }
                : null
        if (isSecureChat && !secureCtx) {
            toast({
                title: "Secure media unavailable",
                description: "Your secure session is not ready yet.",
                variant: "destructive",
            })
            return allFiles
        }

        const total = entries.length
        const failed: File[] = []

        setUploading(true)
        setUploadProgress(0)
        try {
            for (let i = 0; i < total; i++) {
                const { file, caption } = entries[i]
                setUploadLabel(total > 1 ? `Sending ${i + 1} of ${total}` : "Uploading...")
                // Progress spans the whole batch, not just the file in flight
                const batchProgress = (fraction: number) =>
                    setUploadProgress(Math.round(((i + fraction) / total) * 100))
                batchProgress(0)

                try {
                    if (secureCtx) {
                        const message = await sendSecureMediaMessage({
                            ...secureCtx,
                            chatId: currentChatId,
                            file,
                            caption,
                        })
                        if (addMessage) addMessage(message as any)
                        batchProgress(1)
                    } else {
                        const result = await uploadMediaMessage(currentChatId, file, caption, (p) =>
                            batchProgress(p.percentage / 100)
                        )
                        if (result.success && result.data) {
                            if (addMessage) addMessage(result.data as any)
                            batchProgress(1)
                        } else {
                            failed.push(file)
                        }
                    }
                } catch {
                    failed.push(file)
                }
            }
        } finally {
            setUploading(false)
            setUploadProgress(0)
            setUploadLabel("")
        }

        const sent = total - failed.length
        if (sent > 0) {
            toast({
                title: isSecureChat ? "Secure media sent" : "Media sent",
                description: sent === 1 ? "Your media has been sent successfully" : `${sent} files sent successfully`,
            })
        }
        if (failed.length) {
            toast({
                title: failed.length === 1 ? "Upload failed" : `${failed.length} uploads failed`,
                description: `${failed.map((file) => file.name).slice(0, 3).join(", ")} — tap Send to try again`,
                variant: "destructive",
            })
        } else {
            closeMediaModal()
        }

        return failed
    }

    const canSend = !!messageText.trim() && isConnected

    return (
        <>
            <div
                ref={wrapperRef}
                className="relative bg-white dark:bg-darkBg-card px-2.5 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-3.5 sm:pt-2.5 sm:pb-[calc(0.625rem+env(safe-area-inset-bottom))] border-t border-gray-100 dark:border-darkBorder-light"
            >
                {/* @Mention dropdown */}
                {showMentionDropdown && (
                    <MentionDropdown
                        members={mentionMembers}
                        activeIndex={mentionActiveIdx}
                        onSelect={acceptMention}
                        isLoading={mentionLoading && debouncedMentionQuery.length > 0}
                    />
                )}

                {/* Emoji picker popover */}
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
                                searchPlaceholder="Search emoji..."
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
                    <div className="mb-1.5 rounded-lg border border-gray-200 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-interactive px-2.5 py-1.5 flex items-start justify-between gap-2">
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
                {/* Input row — bottom-aligned so the field grows upward past a
                    composer that stays put, instead of dragging the controls
                    into the middle of a tall box. */}
                <div className="flex items-end gap-1.5">
                    {/* Attach lives beside the field, not inside it, so it never
                        floats mid-textarea on a long message */}
                    <div className="relative flex-shrink-0" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setShowOptions(!showOptions)}
                            aria-label="Share"
                            aria-expanded={showOptions}
                            // Carries its own surface at rest — as a bare glyph it did
                            // not read as a button until you already pressed it.
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                                showOptions
                                    ? "bg-brand-green text-white dark:bg-brand-gold dark:text-darkBg-main"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-darkBg-interactive dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                        >
                            <Plus size={20} />
                        </button>
                        <OptionsDropdown isOpen={showOptions} onOptionSelect={handleOptionSelect} />
                    </div>

                    <div className="relative min-w-0 flex-1">
                        <textarea
                            ref={textareaRef}
                            // Short enough not to wrap and double the field's resting
                            // height; the @ hint already appears below once you type.
                            placeholder={!isConnected ? "Connecting..." : "Message"}
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
                            className="block w-full resize-none rounded-2xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light py-2 pl-3.5 pr-10 text-base leading-6 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-gold focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden hide-scrollbar"
                            style={{ minHeight: "40px", height: "40px" }}
                        />

                        {/* Pinned to the last line rather than the field's centre */}
                        <button
                            ref={emojiButtonRef}
                            type="button"
                            onClick={toggleEmojiPicker}
                            aria-label="Open emoji picker"
                            aria-expanded={showEmojiPicker}
                            className={`absolute bottom-1 right-1.5 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                                showEmojiPicker
                                    ? "text-brand-green dark:text-brand-gold"
                                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                        >
                            <Smile size={17} />
                        </button>
                    </div>

                    <Button
                        onClick={handleSendMessage}
                        size="icon"
                        disabled={!canSend}
                        aria-label="Send message"
                        className={`h-10 w-10 flex-shrink-0 rounded-full transition-all duration-200 shadow-sm ${
                            canSend
                                ? "bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main hover:shadow-md"
                                : "bg-gray-200 dark:bg-darkBg-interactive text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        <Send size={17} />
                    </Button>
                </div>
                {/* Hint shown while typing */}
                {messageText.length > 0 && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 pl-1 select-none">
                        Shift+Enter for new line{groupId ? " · @ to mention" : ""}
                    </p>
                )}
            </div>

            {/* Hidden pickers — "Photo / video" and "Document" open these straight
                away, and the modal below only handles the captions afterwards.
                Both take several files at once, as WhatsApp does. */}
            <input
                ref={mediaInputRef}
                type="file"
                className="hidden"
                multiple
                accept={MEDIA_ACCEPT}
                onChange={handleFilePicked}
            />
            <input
                ref={documentInputRef}
                type="file"
                className="hidden"
                multiple
                accept={DOCUMENT_ACCEPT}
                onChange={handleFilePicked}
            />

            <MediaUploadModal
                isOpen={showMediaModal}
                onClose={closeMediaModal}
                onUpload={(file, caption) => { void handleMediaUploadMany([{ file, caption }]) }}
                onUploadMany={handleMediaUploadMany}
                uploading={uploading}
                uploadProgress={uploadProgress}
                uploadLabel={uploadLabel}
                initialFiles={pickedFiles}
                multiple
                accept={pickedKind === "document" ? DOCUMENT_ACCEPT : MEDIA_ACCEPT}
                maxFiles={MAX_ATTACHMENTS}
                title={
                    pickedKind === "document"
                        ? (pickedFiles && pickedFiles.length > 1 ? "Send documents" : "Send document")
                        : (pickedFiles && pickedFiles.length > 1 ? "Send photos or videos" : "Send photo or video")
                }
            />

            {shareTargetUserId && (
                <ShareToGroupModal
                    isOpen={showShareToGroupModal}
                    onClose={() => setShowShareToGroupModal(false)}
                    token={token}
                    targetUserId={shareTargetUserId}
                    targetName={shareTargetName}
                />
            )}

            <ShareLocationModal
                isOpen={showShareLocationModal}
                onClose={() => setShowShareLocationModal(false)}
                chatId={currentChatId || undefined}
            />
        </>
    )
}
