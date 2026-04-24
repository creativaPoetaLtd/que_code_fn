import { parseMessageSegments } from "@/utils/url-utils"
import type { MentionData } from "@/types/chat.types"

interface MessageTextProps {
    content:  string
    isMe:     boolean
    /** Confirmed @-mentions attached to this message from the server */
    mentions?: MentionData[]
}

/**
 * Renders a message string with:
 *  - URLs converted to styled, clickable anchor elements
 *  - @mentions highlighted as a coloured chip (only for usernames
 *    that appear in the server-confirmed `mentions` list)
 */
export default function MessageText({ content, isMe, mentions }: MessageTextProps) {
    const confirmedMentionLabels = (mentions ?? []).map((m) => m.username)

    const segments = parseMessageSegments(content)

    return (
        <span
            className={`break-words whitespace-pre-wrap ${
                isMe ? "text-white dark:text-darkBg-main" : "text-gray-900 dark:text-white"
            }`}
        >
            {segments.map((segment, i) => {
                if (segment.type === "url" && segment.href) {
                    return (
                        <a
                            key={i}
                            href={segment.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`underline underline-offset-2 break-all ${
                                isMe
                                    ? "text-white/90 hover:text-white"
                                    : "text-brand-green dark:text-brand-gold hover:opacity-80"
                            }`}
                        >
                            {segment.content}
                        </a>
                    )
                }

                // Within plain-text segments, highlight confirmed @mentions
                if (confirmedMentionLabels.length === 0) {
                    return <span key={i}>{segment.content}</span>
                }

                return (
                    <span key={i}>
                        {splitMentions(segment.content, confirmedMentionLabels, isMe)}
                    </span>
                )
            })}
        </span>
    )
}

/**
 * Split a plain-text string into normal text and @mention chips.
 * Only highlights usernames that are in the `confirmedUsernames` set.
 */
function splitMentions(
    text: string,
    confirmedMentionLabels: string[],
    isMe: boolean
): React.ReactNode[] {
    if (confirmedMentionLabels.length === 0) return [text]

    const uniqueLabels = confirmedMentionLabels.filter((label, index, arr) => {
        if (!label) return false
        return arr.indexOf(label) === index
    })

    const escapedLabels = uniqueLabels
        .sort((a, b) => b.length - a.length)
        .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))

    if (escapedLabels.length === 0) return [text]

    const parts: React.ReactNode[] = []
    const re = new RegExp(`(^|\\s)(@(?:${escapedLabels.join("|")}))(?=\\s|$|[.,!?])`, "gi")
    let last = 0
    let m: RegExpExecArray | null

    while ((m = re.exec(text)) !== null) {
        const prefix = m[1] || ""
        const mentionText = m[2]
        const mentionStart = m.index + prefix.length

        if (m.index > last) {
            parts.push(text.slice(last, m.index))
        }
        if (prefix) {
            parts.push(prefix)
        }

        parts.push(
            <span
                key={`mention_${mentionStart}`}
                className={`
                    inline-block font-semibold rounded px-1 py-0.5 text-[0.85em] leading-tight
                    ${isMe
                        ? "bg-white/20 text-white"
                        : "bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold"
                    }
                `}
            >
                {mentionText}
            </span>
        )

        last = mentionStart + mentionText.length
    }

    if (last < text.length) parts.push(text.slice(last))

    return parts.length > 0 ? parts : [text]
}
