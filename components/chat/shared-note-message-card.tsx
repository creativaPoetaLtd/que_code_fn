"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux-store";
import { NotebookText, PencilLine, Users } from "lucide-react";
import { noteSlice, useGetSharedNoteQuery, type SharedNoteData } from "@/states/noteSlice";
import socketService from "@/services/socketService";
import SharedNoteDialog from "./shared-note-dialog";
import { MessageCardAction, MessageCardChip, MessageCardShell } from "./message-card-shell";

/** What the chat message carries — enough to render before the note loads */
export interface SharedNoteMessageData {
    type: "shared_note";
    noteId: string;
    title: string;
    snippet?: string;
    createdBy: string;
    createdByName: string;
    timestamp: string;
}

interface SharedNoteMessageCardProps {
    data: SharedNoteMessageData;
    isMe: boolean;
}

function fmtTime(ts: string) {
    return new Date(ts).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function fmtEdited(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    const sameDay = new Date().toDateString() === date.toDateString();
    return sameDay
        ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const SharedNoteMessageCard: React.FC<SharedNoteMessageCardProps> = ({ data, isMe }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [editorOpen, setEditorOpen] = useState(false);

    const { data: response } = useGetSharedNoteQuery({ noteId: data.noteId });
    const note: SharedNoteData | undefined = response?.data;

    // Keep the preview current as people edit, without reopening the note
    useEffect(() => {
        const handleNoteUpdated = (updated: SharedNoteData) => {
            if (updated?.id !== data.noteId) return;
            dispatch(
                noteSlice.util.updateQueryData("getSharedNote", { noteId: data.noteId }, draft => {
                    draft.data = updated;
                })
            );
        };

        socketService.onSharedNoteUpdated(handleNoteUpdated);
        return () => socketService.offSharedNoteUpdated(handleNoteUpdated);
    }, [data.noteId, dispatch]);

    const title = note?.title || data.title;
    const snippet = note?.snippet ?? data.snippet ?? "";
    const editedAt = fmtEdited(note?.lastEditedAt);

    return (
        <>
            <MessageCardShell
                accentBarClassName="bg-yellow-400"
                borderClassName={isMe ? "border-yellow-200 dark:border-yellow-800/40" : undefined}
                icon={<NotebookText className="w-3.5 h-3.5 flex-shrink-0 text-yellow-500" />}
                label="Shared note"
                headerMeta={
                    <MessageCardChip>
                        <Users className="w-2.5 h-2.5" /> Everyone can edit
                    </MessageCardChip>
                }
                action={
                    <MessageCardAction
                        onClick={() => setEditorOpen(true)}
                        className="bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                    >
                        <PencilLine className="w-3 h-3" /> Open note
                    </MessageCardAction>
                }
                footerLeft={
                    note?.lastEditedByName && editedAt
                        ? `Edited by ${note.lastEditedByName} · ${editedAt}`
                        : `Started by ${note?.createdByName || data.createdByName}`
                }
                footerRight={fmtTime(data.timestamp)}
            >
                <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="w-full px-3 pt-1 pb-2 text-left"
                >
                    <p className="text-sm font-bold text-gray-900 dark:text-white break-words line-clamp-2">
                        {title}
                    </p>
                    {snippet ? (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-3 mt-0.5 whitespace-pre-wrap">
                            {snippet}
                        </p>
                    ) : (
                        <p className="text-[11px] text-gray-400 italic mt-0.5">Empty note</p>
                    )}
                </button>
            </MessageCardShell>

            <SharedNoteDialog
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                noteId={data.noteId}
            />
        </>
    );
};

export default SharedNoteMessageCard;
