"use client";

import { useEffect, useMemo } from "react";
import { useGetPinnedMessagesQuery } from "@/states/chatSlice";
import socketService from "@/services/socketService";
import { getChatPreviewText } from "@/utils/chatPreview";
import type { Message } from "@/types/chat.types";

export interface PinnedMessage {
    messageId: string;
    chatId: string;
    messageType: string;
    /** Null for encrypted messages — the preview comes from the local copy instead */
    content: string | null;
    isEncrypted: boolean;
    createdAt: string;
    pinnedAt: string;
    pinnedBy: string;
    senderId: string;
    senderName: string;
    /** Ready-to-render one-liner for the bar */
    preview: string;
}

/**
 * The pinned messages in a conversation, kept live.
 *
 * A secure chat's text never leaves the server, so the preview is resolved from the
 * decrypted copy already in the message list; anything not loaded falls back to a
 * neutral label rather than showing ciphertext or an empty row.
 */
export function useChatPins(chatId?: string, loadedMessages: Message[] = []) {
    const { data, isLoading, refetch } = useGetPinnedMessagesQuery(
        { chatId: chatId as string },
        { skip: !chatId }
    );

    useEffect(() => {
        if (!chatId) return;

        const handleChanged = (payload: { chatId: string }) => {
            if (payload?.chatId !== chatId) return;
            refetch();
        };

        socketService.onMessagePinned(handleChanged);
        socketService.onMessageUnpinned(handleChanged);
        return () => {
            socketService.offMessagePinned(handleChanged);
            socketService.offMessageUnpinned(handleChanged);
        };
    }, [chatId, refetch]);

    const pins: PinnedMessage[] = useMemo(() => {
        const rows = (data?.data ?? []) as Omit<PinnedMessage, "preview">[];
        const byId = new Map(loadedMessages.map(message => [message.id, message]));

        return rows.map(row => {
            const local = byId.get(row.messageId);
            const source = local
                ? getChatPreviewText({
                      content: local.content,
                      messageType: local.messageType,
                      deletedAt: local.deletedAt,
                  })
                : row.content
                    ? getChatPreviewText({ content: row.content, messageType: row.messageType })
                    : "";

            return { ...row, preview: source || "Pinned message" };
        });
    }, [data, loadedMessages]);

    return { pins, isLoading };
}
