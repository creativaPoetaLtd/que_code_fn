'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Loader2, NotebookText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
    useCreateSharedNoteMutation,
    useGetSharedNoteQuery,
    useUpdateSharedNoteMutation,
    type SharedNoteData,
} from '@/states/noteSlice';
import socketService from '@/services/socketService';
import { getCurrentUserId } from '@/utils/tokenUtils';

const AUTOSAVE_DELAY = 1500;
const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 20000;

interface SharedNoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    chatId?: string;
    /** Omit to start a new note; the card is posted to the chat on the first save */
    noteId?: string;
}

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved';

const fmtWhen = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    const sameDay = new Date().toDateString() === date.toDateString();
    return sameDay
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function SharedNoteDialog({
    isOpen,
    onClose,
    chatId,
    noteId,
}: SharedNoteDialogProps) {
    const isCreating = !noteId;
    const currentUserId = getCurrentUserId();

    const { data: response, isLoading } = useGetSharedNoteQuery(
        { noteId: noteId as string },
        { skip: !noteId || !isOpen }
    );
    const note = response?.data;

    const [createNote, { isLoading: creating }] = useCreateSharedNoteMutation();
    const [updateNote] = useUpdateSharedNoteMutation();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saveState, setSaveState] = useState<SaveState>('idle');
    /** The version this editor's text is based on — sent with every save */
    const [baseVersion, setBaseVersion] = useState(0);
    /** Someone else's copy, held aside when it collides with unsaved local edits */
    const [conflict, setConflict] = useState<SharedNoteData | null>(null);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latest = useRef({ title: '', content: '', baseVersion: 0 });
    // Mirrors saveState so callbacks and socket handlers can read it without nesting
    // a setState call inside a state updater.
    const saveStateRef = useRef<SaveState>('idle');

    const applySaveState = useCallback((next: SaveState) => {
        saveStateRef.current = next;
        setSaveState(next);
    }, []);

    useEffect(() => {
        latest.current = { title, content, baseVersion };
    }, [title, content, baseVersion]);

    // Seed the editor once the note arrives (and reset it between openings)
    useEffect(() => {
        if (!isOpen) return;
        if (isCreating) {
            setTitle('');
            setContent('');
            setBaseVersion(0);
        }
        applySaveState('idle');
        setConflict(null);
    }, [isOpen, isCreating, applySaveState]);

    useEffect(() => {
        if (!isOpen || !note) return;
        // Only seed from the server while there is nothing unsaved to protect
        if (saveStateRef.current === 'dirty' || saveStateRef.current === 'saving') return;
        setTitle(note.title);
        setContent(note.content);
        setBaseVersion(note.version);
    }, [isOpen, note]);

    const save = useCallback(
        async (overrideBaseVersion?: number) => {
            if (!noteId) return;
            const { title: currentTitle, content: currentContent } = latest.current;
            if (!currentTitle.trim()) return;

            applySaveState('saving');
            try {
                const result = await updateNote({
                    noteId,
                    title: currentTitle.trim(),
                    content: currentContent,
                    baseVersion: overrideBaseVersion ?? latest.current.baseVersion,
                }).unwrap();

                setBaseVersion(result.data.version);
                setConflict(null);
                applySaveState('saved');
            } catch (err: any) {
                // 409 means someone saved first — keep the local text and surface theirs
                if (err?.status === 409 && err?.data?.data) {
                    setConflict(err.data.data as SharedNoteData);
                    applySaveState('dirty');
                    return;
                }
                applySaveState('dirty');
                toast({
                    title: 'Could not save',
                    description: err?.data?.message || 'Your changes are still here — try again.',
                    variant: 'destructive',
                });
            }
        },
        [noteId, updateNote, applySaveState]
    );

    const queueSave = useCallback(() => {
        if (isCreating) return;
        applySaveState('dirty');
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => save(), AUTOSAVE_DELAY);
    }, [isCreating, save, applySaveState]);

    useEffect(() => () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
    }, []);

    // Live sync: adopt other people's saves when this editor has nothing at stake,
    // otherwise hold them in the conflict banner rather than overwriting the draft.
    useEffect(() => {
        if (!isOpen || !noteId) return;

        const handleNoteUpdated = (updated: SharedNoteData) => {
            if (updated?.id !== noteId) return;
            if (updated.version <= latest.current.baseVersion) return;
            if (updated.lastEditedBy === currentUserId) {
                setBaseVersion(updated.version);
                return;
            }

            if (saveStateRef.current === 'dirty' || saveStateRef.current === 'saving') {
                setConflict(updated);
                return;
            }
            setTitle(updated.title);
            setContent(updated.content);
            setBaseVersion(updated.version);
            applySaveState('idle');
        };

        const handleNoteDeleted = (data: { noteId: string }) => {
            if (data?.noteId !== noteId) return;
            if (saveTimer.current) clearTimeout(saveTimer.current);
            applySaveState('idle');
            toast({
                title: 'Note deleted',
                description: 'Someone deleted this note from the chat.',
            });
            onClose();
        };

        socketService.onSharedNoteUpdated(handleNoteUpdated);
        socketService.onSharedNoteDeleted(handleNoteDeleted);
        return () => {
            socketService.offSharedNoteUpdated(handleNoteUpdated);
            socketService.offSharedNoteDeleted(handleNoteDeleted);
        };
    }, [isOpen, noteId, currentUserId, applySaveState, onClose]);

    const handleCreate = async () => {
        if (!chatId || !title.trim()) return;
        try {
            await createNote({
                chatId,
                title: title.trim(),
                content,
            }).unwrap();
            toast({ title: 'Note shared', description: title.trim() });
            onClose();
        } catch (err: any) {
            toast({
                title: 'Could not share the note',
                description: err?.data?.message || 'Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleClose = () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        // Don't lose a pending edit just because the dialog was dismissed
        if (!isCreating && saveState === 'dirty' && !conflict) void save();
        onClose();
    };

    const takeTheirs = () => {
        if (!conflict) return;
        setTitle(conflict.title);
        setContent(conflict.content);
        setBaseVersion(conflict.version);
        setConflict(null);
        applySaveState('idle');
    };

    const keepMine = () => {
        if (!conflict) return;
        const version = conflict.version;
        setConflict(null);
        void save(version);
    };

    useEffect(() => {
        if (saveState !== 'saved') return;
        const id = setTimeout(() => applySaveState('idle'), 2000);
        return () => clearTimeout(id);
    }, [saveState, applySaveState]);

    const statusLabel = () => {
        if (saveState === 'saving') return 'Saving…';
        if (saveState === 'saved') return 'Saved';
        if (saveState === 'dirty') return 'Unsaved changes';
        if (note?.lastEditedByName && note.lastEditedAt) {
            return `Edited by ${note.lastEditedByName} · ${fmtWhen(note.lastEditedAt)}`;
        }
        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={next => { if (!next) handleClose(); }}>
            <DialogContent className="bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-2xl w-[calc(100vw-2rem)] max-w-lg p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <div className="flex items-center gap-2">
                        <NotebookText className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                            {isCreating ? 'New shared note' : 'Shared note'}
                        </p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                        {isCreating
                            ? 'Everyone in this chat can edit it after you share it.'
                            : statusLabel() || 'Everyone in this chat can edit this note.'}
                    </p>
                </div>

                {isLoading && !note && !isCreating ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                ) : (
                    <div className="p-5 space-y-3">
                        {/* Someone else saved while this draft was open */}
                        {conflict && (
                            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-3 py-2.5 space-y-2">
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {conflict.lastEditedByName || 'Someone'} saved changes while you were
                                    typing. Your text is still here — pick which version to keep.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={takeTheirs}
                                        className="flex-1 py-1.5 rounded-lg border border-amber-300 dark:border-amber-900/50 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                                    >
                                        Use theirs
                                    </button>
                                    <button
                                        type="button"
                                        onClick={keepMine}
                                        className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition-colors"
                                    >
                                        Keep mine
                                    </button>
                                </div>
                            </div>
                        )}

                        <input
                            value={title}
                            onChange={e => {
                                setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH));
                                queueSave();
                            }}
                            placeholder="Note title"
                            autoFocus={isCreating}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-brand-green dark:focus:border-brand-gold transition-colors"
                        />

                        <textarea
                            value={content}
                            onChange={e => {
                                setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH));
                                queueSave();
                            }}
                            placeholder="Write anything — a plan, a list, meeting notes…"
                            rows={12}
                            className="w-full resize-none px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-brand-green dark:focus:border-brand-gold transition-colors leading-relaxed"
                        />

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                                {saveState === 'saving' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                {saveState === 'saved' && <Check className="w-2.5 h-2.5 text-brand-green dark:text-brand-gold" />}
                                {isCreating ? `${content.length}/${MAX_CONTENT_LENGTH}` : statusLabel()}
                            </span>
                            {!isCreating && note && (
                                <span className="text-[10px] text-gray-400 truncate">
                                    Started by {note.createdByName}
                                </span>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={creating}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-darkBg-interactive disabled:opacity-40 transition-colors"
                            >
                                {isCreating ? 'Cancel' : 'Done'}
                            </button>
                            {isCreating && (
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={!title.trim() || creating}
                                    className="flex-1 py-2.5 rounded-xl bg-brand-green dark:bg-brand-gold hover:opacity-90 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <NotebookText className="w-3.5 h-3.5" />}
                                    {creating ? 'Sharing...' : 'Share note'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
