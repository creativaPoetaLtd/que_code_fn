"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

interface ReactionPickerProps {
    isMe: boolean
    onSelect: (emoji: string) => void
    onClose: () => void
}

export default function ReactionPicker({ isMe, onSelect, onClose }: ReactionPickerProps) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent | TouchEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener("mousedown", handler)
        document.addEventListener("touchstart", handler)
        return () => {
            document.removeEventListener("mousedown", handler)
            document.removeEventListener("touchstart", handler)
        }
    }, [onClose])

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 flex gap-1 p-1.5 rounded-full shadow-lg border",
                "bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light",
                "bottom-full mb-2",
                isMe ? "right-0" : "left-0"
            )}
            style={{ animation: "fadeInScale 120ms ease-out" }}
        >
            {QUICK_EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    type="button"
                    onClick={() => { onSelect(emoji); onClose() }}
                    className="text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors"
                    aria-label={`React with ${emoji}`}
                >
                    {emoji}
                </button>
            ))}
        </div>
    )
}
