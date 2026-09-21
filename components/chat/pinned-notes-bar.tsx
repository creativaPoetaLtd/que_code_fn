'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, NotebookText } from 'lucide-react';
import { useChatNotes } from '@/hooks/use-chat-notes';

const COLLAPSED_KEY = 'qc-notes-bar-collapsed';

interface PinnedNotesBarProps {
    chatId?: string;
    /** Open one note in the editor */
    onOpenNote: (noteId: string) => void;
    /** Open the full list — used when the conversation has more than one note */
    onOpenList: () => void;
}

const fmtEdited = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    const sameDay = new Date().toDateString() === date.toDateString();
    return sameDay
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const readCollapsed = (chatId?: string) => {
    if (typeof window === 'undefined' || !chatId) return false;
    try {
        const map = JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '{}');
        return Boolean(map[chatId]);
    } catch {
        return false;
    }
};

/**
 * A shared note is the conversation's working document, so it can't live buried in
 * scrollback. This strip sits between the header and the message list — part of the
 * chat chrome, not the scroll area — showing the most recently edited note.
 */
export default function PinnedNotesBar({ chatId, onOpenNote, onOpenList }: PinnedNotesBarProps) {
    const { notes } = useChatNotes(chatId);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        setCollapsed(readCollapsed(chatId));
    }, [chatId]);

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        if (typeof window === 'undefined' || !chatId) return;
        try {
            const map = JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '{}');
            if (next) map[chatId] = true;
            else delete map[chatId];
            localStorage.setItem(COLLAPSED_KEY, JSON.stringify(map));
        } catch {
            // A non-persisted preference is better than a broken bar
        }
    };

    if (notes.length === 0) return null;

    const [latest] = notes;
    const edited = fmtEdited(latest.lastEditedAt);

    if (collapsed) {
        return (
            <div className="flex justify-end px-3 py-1 bg-white dark:bg-darkBg-card border-b border-gray-100 dark:border-darkBorder-light">
                <button
                    type="button"
                    onClick={toggle}
                    aria-label="Show shared notes"
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 text-[11px] font-semibold hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                >
                    <NotebookText className="w-3 h-3" />
                    {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                    <ChevronDown className="w-3 h-3" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50/60 dark:bg-yellow-900/10 border-b border-yellow-100 dark:border-yellow-900/30">
            <span className="w-7 h-7 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 flex items-center justify-center flex-shrink-0">
                <NotebookText className="w-3.5 h-3.5" />
            </span>

            <button
                type="button"
                onClick={() => onOpenNote(latest.id)}
                className="flex-1 min-w-0 text-left"
            >
                <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">
                    {latest.title}
                </span>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {latest.lastEditedByName && edited
                        ? `Edited by ${latest.lastEditedByName} · ${edited}`
                        : `Started by ${latest.createdByName}`}
                </span>
            </button>

            {notes.length > 1 && (
                <button
                    type="button"
                    onClick={onOpenList}
                    aria-label={`Show all ${notes.length} shared notes`}
                    className="px-2 py-1 rounded-full bg-white dark:bg-darkBg-card border border-yellow-200 dark:border-yellow-900/40 text-[10px] font-semibold text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors flex-shrink-0"
                >
                    1/{notes.length}
                </button>
            )}

            <button
                type="button"
                onClick={toggle}
                aria-label="Hide shared notes"
                className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            >
                <ChevronUp className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
