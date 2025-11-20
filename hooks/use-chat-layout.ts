'use client'

import { useState, useEffect } from "react"
import type { Conversation } from "@/types"

interface UseChatLayoutProps {
    initialConversations: Conversation[]
}

export function useChatLayout({ initialConversations }: UseChatLayoutProps) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
    const [activeConversation, setActiveConversation] = useState<Conversation>(initialConversations[0])
    const [showMobileConversationList, setShowMobileConversationList] = useState<boolean>(true)
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [isTablet, setIsTablet] = useState<boolean>(false)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
            // On larger screens, always show both panels
            if (window.innerWidth >= 768) {
                setShowMobileConversationList(true)
            }
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const handleConversationSelect = (conversation: Conversation) => {
        setActiveConversation(conversation)
        if (isMobile) setShowMobileConversationList(false)
    }

    const addConversation = (newConversation: Conversation) => {
        const existingConv = conversations.find((conv) => 
            conv.isGroup === newConversation.isGroup && 
            conv.name === newConversation.name
        )

        if (!existingConv) {
            setConversations((prev) => [newConversation, ...prev])
        }

        setActiveConversation(existingConv || newConversation)
        if (isMobile) setShowMobileConversationList(false)
    }

    return {
        conversations,
        setConversations,
        activeConversation,
        setActiveConversation,
        showMobileConversationList,
        setShowMobileConversationList,
        isMobile,
        isTablet,
        handleConversationSelect,
        addConversation,
    }
}