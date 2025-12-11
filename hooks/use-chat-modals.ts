'use client'

import { useState } from "react"

export function useChatModals() {
    const [isSendMoneyModalOpen, setIsSendMoneyModalOpen] = useState<boolean>(false)
    const [isRequestMoneyModalOpen, setIsRequestMoneyModalOpen] = useState<boolean>(false)
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState<boolean>(false)
    const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false)
    const [isGroupProfileModalOpen, setIsGroupProfileModalOpen] = useState<boolean>(false)
    const [isContactRequestModalOpen, setIsContactRequestModalOpen] = useState<boolean>(false)
    const [isInviteToGroupModalOpen, setIsInviteToGroupModalOpen] = useState<boolean>(false)
    const [isJoinGroupByLinkModalOpen, setIsJoinGroupByLinkModalOpen] = useState<boolean>(false)
    const [isStartChatModalOpen, setIsStartChatModalOpen] = useState<boolean>(false)

    const [selectedRecipient, setSelectedRecipient] = useState<string>("")

    const openSendMoneyModal = (recipient?: string) => {
        setSelectedRecipient(recipient || "")
        setIsSendMoneyModalOpen(true)
    }

    const closeSendMoneyModal = () => {
        setIsSendMoneyModalOpen(false)
        setSelectedRecipient("")
    }

    const closeAllModals = () => {
        setIsSendMoneyModalOpen(false)
        setIsRequestMoneyModalOpen(false)
        setIsAddContactModalOpen(false)
        setIsUserProfileModalOpen(false)
        setIsGroupProfileModalOpen(false)
        setIsContactRequestModalOpen(false)
        setIsInviteToGroupModalOpen(false)
        setIsJoinGroupByLinkModalOpen(false)
        setIsStartChatModalOpen(false)
        setSelectedRecipient("")
    }

    return {
        // Modal states
        isSendMoneyModalOpen,
        isRequestMoneyModalOpen,
        isAddContactModalOpen,
        isUserProfileModalOpen,
        isGroupProfileModalOpen,
        isContactRequestModalOpen,
        isInviteToGroupModalOpen,
        isJoinGroupByLinkModalOpen,
        isStartChatModalOpen,
        selectedRecipient,

        // Modal actions
        openSendMoneyModal,
        closeSendMoneyModal,
        setIsRequestMoneyModalOpen,
        setIsAddContactModalOpen,
        setIsUserProfileModalOpen,
        setIsGroupProfileModalOpen,
        setIsContactRequestModalOpen,
        setIsInviteToGroupModalOpen,
        setIsJoinGroupByLinkModalOpen,
        setIsStartChatModalOpen,
        closeAllModals,
    }
}