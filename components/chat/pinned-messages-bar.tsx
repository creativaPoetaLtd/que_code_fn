'use client';

import React from 'react';
import { Pin, X } from 'lucide-react';
import type { PinnedMessage } from '@/hooks/use-chat-pins';

interface PinnedMessagesBarProps {
    pins: PinnedMessage[];
    /** Scroll the thread to the pinned message */
    onJumpTo: (messageId: string) => void;
    /** Open the list when there is more than one */
    onOpenList: () => void;
    /** Absent when the viewer may not unpin (a group member who isn't an admin) */
    onUnpin?: (messageId: string) => void;
}

/**
 * The most recent pin, parked under the header where it stays reachable however far
 * the conversation runs. Sits above the notes bar: a pin is a pointer into the
 * thread, a note is a document, and they read as different things.
 */
export default function PinnedMessagesBar({
    pins,
    onJumpTo,
    onOpenList,
    onUnpin,
}: PinnedMessagesBarProps) {
    if (pins.length === 0) return null;

    const [latest] = pins;

    return (
        <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/60 px-3 py-1.5 dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <Pin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />

            <button
                type="button"
                onClick={() => onJumpTo(latest.messageId)}
                className="min-w-0 flex-1 text-left"
            >
                <span className="block truncate text-[11px] font-semibold text-gray-800 dark:text-gray-100">
                    {latest.preview}
                </span>
                <span className="block truncate text-[10px] text-gray-500 dark:text-gray-400">
                    Pinned · {latest.senderName}
                </span>
            </button>

            {pins.length > 1 && (
                <button
                    type="button"
                    onClick={onOpenList}
                    aria-label={`Show all ${pins.length} pinned messages`}
                    className="flex-shrink-0 rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-darkBg-card dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                >
                    1/{pins.length}
                </button>
            )}

            {onUnpin && (
                <button
                    type="button"
                    onClick={() => onUnpin(latest.messageId)}
                    aria-label="Unpin this message"
                    title="Unpin"
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
