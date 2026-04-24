"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface MentionMember {
    userId:   string
    username: string
    name:     string
    avatar:   string | null
}

interface MentionDropdownProps {
    members:         MentionMember[]
    activeIndex:     number
    onSelect:        (member: MentionMember) => void
    isLoading:       boolean
}

export default function MentionDropdown({
    members,
    activeIndex,
    onSelect,
    isLoading,
}: MentionDropdownProps) {
    const activeRef = useRef<HTMLButtonElement | null>(null)

    // Keep the highlighted item scrolled into view during keyboard navigation
    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: "nearest" })
    }, [activeIndex])

    if (!isLoading && members.length === 0) return null

    return (
        <div
            role="listbox"
            aria-label="Mention suggestions"
            className="
                absolute bottom-full left-0 right-0 mb-1 z-50
                bg-white dark:bg-darkBg-card
                border border-gray-200 dark:border-darkBorder-light
                rounded-xl shadow-lg overflow-hidden
                max-h-52 overflow-y-auto
            "
        >
            {isLoading ? (
                // Skeleton rows while debounce resolves
                <div className="p-2 space-y-1">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                members.map((member, idx) => {
                    const isActive = idx === activeIndex
                    const initials = member.name
                        ? member.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
                        : member.username.slice(0, 2).toUpperCase()

                    return (
                        <button
                            key={member.userId}
                            ref={isActive ? activeRef : null}
                            role="option"
                            aria-selected={isActive}
                            type="button"
                            onClick={() => onSelect(member)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                                ${isActive
                                    ? "bg-brand-green/10 dark:bg-brand-gold/10"
                                    : "hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
                                }
                            `}
                        >
                            <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={member.avatar ?? "/placeholder.svg"} alt={member.name} />
                                <AvatarFallback className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {member.name || member.username}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {member.userId === "__all__" ? "Mention everyone" : "Tap to mention"}
                                </p>
                            </div>

                            {isActive && (
                                <kbd className="hidden sm:inline-flex text-[10px] text-gray-400 dark:text-gray-500">
                                    ↵ select
                                </kbd>
                            )}
                        </button>
                    )
                })
            )}
        </div>
    )
}
