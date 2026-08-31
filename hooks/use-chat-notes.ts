"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux-store";
import {
    noteSlice,
    useGetChatNotesQuery,
    type SharedNoteData,
    type SharedNoteSummary,
} from "@/states/noteSlice";
import socketService from "@/services/socketService";

const editedAt = (note: SharedNoteSummary) =>
    new Date(note.lastEditedAt || note.createdAt).getTime();

/**
 * The shared notes in a conversation, kept live.
 *
 * Every caller (the pinned bar, the header badge, the notes panel) hits the same RTK
 * cache entry, so this costs one request per chat no matter how many mount it.
 */
export function useChatNotes(chatId?: string, enabled = true) {
    const dispatch = useDispatch<AppDispatch>();

    const { data, isLoading } = useGetChatNotesQuery(
        { chatId: chatId as string },
        { skip: !chatId || !enabled }
    );

    useEffect(() => {
        if (!chatId) return;

        const handleNoteUpdated = (updated: SharedNoteData) => {
            if (updated?.chatId !== chatId) return;

            dispatch(
                noteSlice.util.updateQueryData("getChatNotes", { chatId }, draft => {
                    const { content, ...summary } = updated;
                    const index = draft.data.findIndex(note => note.id === updated.id);
                    if (index === -1) {
                        draft.data.push(summary);
                    } else {
                        draft.data[index] = summary;
                    }
                    // The bar shows the first entry, so most recently touched leads
                    draft.data.sort((a, b) => editedAt(b) - editedAt(a));
                })
            );
        };

        // A note is deleted by deleting its card, so the bar has to let go of it
        const handleNoteDeleted = (data: { chatId: string; noteId: string }) => {
            if (data?.chatId !== chatId) return;
            dispatch(
                noteSlice.util.updateQueryData("getChatNotes", { chatId }, draft => {
                    draft.data = draft.data.filter(note => note.id !== data.noteId);
                })
            );
        };

        socketService.onSharedNoteUpdated(handleNoteUpdated);
        socketService.onSharedNoteDeleted(handleNoteDeleted);
        return () => {
            socketService.offSharedNoteUpdated(handleNoteUpdated);
            socketService.offSharedNoteDeleted(handleNoteDeleted);
        };
    }, [chatId, dispatch]);

    return { notes: data?.data ?? [], isLoading };
}
