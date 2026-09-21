'use client';

import React from 'react';
import { Loader2, NotebookText, PencilLine } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useChatNotes } from '@/hooks/use-chat-notes';

interface NotesPanelProps {
    isOpen: boolean;
    onClose: () => void;
    chatId?: string;
    onOpenNote: (noteId: string) => void;
}

const fmtEdited = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    const sameDay = new Date().toDateString() === date.toDateString();
    return sameDay
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/** Every shared note in the conversation — reachable from the header and the bar. */
export default function NotesPanel({ isOpen, onClose, chatId, onOpenNote }: NotesPanelProps) {
    const { notes, isLoading } = useChatNotes(chatId, isOpen);

    return (
        <Dialog open={isOpen} onOpenChange={next => { if (!next) onClose(); }}>
            <DialogContent className="bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-2xl w-[calc(100vw-2rem)] max-w-md p-0 gap-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <div className="flex items-center gap-2">
                        <NotebookText className="w-4 h-4 text-yellow-500" />
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Shared notes</p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                        {notes.length === 0
                            ? 'No notes in this conversation yet.'
                            : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} — everyone here can edit them.`}
                    </p>
                </div>

                <div className="p-3 max-h-[60vh] overflow-y-auto space-y-1.5">
                    {isLoading && notes.length === 0 ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-10">
                            <NotebookText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Start one from the <span className="font-semibold">+</span> menu.
                            </p>
                        </div>
                    ) : (
                        notes.map(note => {
                            const edited = fmtEdited(note.lastEditedAt);
                            return (
                                <button
                                    key={note.id}
                                    type="button"
                                    onClick={() => {
                                        onOpenNote(note.id);
                                        onClose();
                                    }}
                                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-darkBorder-light hover:border-yellow-300 dark:hover:border-yellow-800/60 text-left transition-colors"
                                >
                                    <span className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 flex items-center justify-center flex-shrink-0">
                                        <NotebookText className="w-4 h-4" />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {note.title}
                                        </span>
                                        <span className="block text-[11px] text-gray-400 truncate">
                                            {note.lastEditedByName && edited
                                                ? `Edited by ${note.lastEditedByName} · ${edited}`
                                                : `Started by ${note.createdByName}`}
                                        </span>
                                    </span>
                                    <PencilLine className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 mt-1 flex-shrink-0" />
                                </button>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
