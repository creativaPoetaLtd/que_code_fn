"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux-store";
import { NotebookText, PencilLine, Users } from "lucide-react";
import { noteSlice, useGetSharedNoteQuery, type SharedNoteData } from "@/states/noteSlice";
import socketService from "@/services/socketService";
import SharedNoteDialog from "./shared-note-dialog";

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
            <div
                className={`w-[280px] rounded-2xl overflow-hidden shadow-sm border bg-white dark:bg-darkBg-card ${
                    isMe
                        ? "border-yellow-200 dark:border-yellow-800/40"
                        : "border-gray-100 dark:border-darkBorder-light"
                }`}
            >
                <div className="h-1 w-full bg-yellow-400" />

                <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                    <div className="flex items-center gap-1.5">
                        <NotebookText className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Shared note
                        </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                        <Users className="w-2.5 h-2.5" /> Everyone can edit
                    </span>
                </div>

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

                <div className="px-3 pb-3">
                    <button
                        type="button"
                        onClick={() => setEditorOpen(true)}
                        className="w-full h-8 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <PencilLine className="w-3 h-3" /> Open note
                    </button>
                </div>

                <div className="flex items-center justify-between gap-2 px-3 pb-2">
                    <span className="text-[10px] text-gray-400 truncate">
                        {note?.lastEditedByName && editedAt
                            ? `Edited by ${note.lastEditedByName} · ${editedAt}`
                            : `Started by ${note?.createdByName || data.createdByName}`}
                    </span>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600 flex-shrink-0">
                        {fmtTime(data.timestamp)}
                    </span>
                </div>
            </div>

            <SharedNoteDialog
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                noteId={data.noteId}
            />
        </>
    );
};

export default SharedNoteMessageCard;
