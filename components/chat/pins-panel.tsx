'use client';

import React from 'react';
import { Pin, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { PinnedMessage } from '@/hooks/use-chat-pins';

interface PinsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    pins: PinnedMessage[];
    onJumpTo: (messageId: string) => void;
    onUnpin?: (messageId: string) => void;
}

const fmtWhen = (value: string) => {
    const date = new Date(value);
    const sameDay = new Date().toDateString() === date.toDateString();
    return sameDay
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/** Everything pinned in this conversation. */
export default function PinsPanel({
    isOpen,
    onClose,
    pins,
    onJumpTo,
    onUnpin,
}: PinsPanelProps) {
    return (
        <Dialog open={isOpen} onOpenChange={next => { if (!next) onClose(); }}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-md gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 dark:border-darkBorder-light dark:bg-darkBg-card">
                <div className="border-b border-gray-100 px-5 py-4 dark:border-darkBorder-light">
                    <div className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Pinned</p>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {pins.length === 0
                            ? 'Nothing pinned in this conversation yet.'
                            : `${pins.length} pinned ${pins.length === 1 ? 'item' : 'items'}`}
                    </p>
                </div>

                <div className="max-h-[60vh] space-y-1.5 overflow-y-auto p-3">
                    {pins.length === 0 ? (
                        <div className="py-10 text-center">
                            <Pin className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Pin a message from its hover menu.
                            </p>
                        </div>
                    ) : (
                        pins.map(pin => (
                            <div
                                key={pin.messageId}
                                className="flex items-start gap-2 rounded-xl border border-gray-100 px-3 py-2.5 transition-colors hover:border-emerald-300 dark:border-darkBorder-light dark:hover:border-emerald-800/60"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        onJumpTo(pin.messageId);
                                        onClose();
                                    }}
                                    className="min-w-0 flex-1 text-left"
                                >
                                    <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
                                        {pin.preview}
                                    </span>
                                    <span className="block truncate text-[11px] text-gray-400">
                                        {pin.senderName} · {fmtWhen(pin.createdAt)}
                                    </span>
                                </button>

                                {onUnpin && (
                                    <button
                                        type="button"
                                        onClick={() => onUnpin(pin.messageId)}
                                        aria-label="Unpin"
                                        title="Unpin"
                                        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-red-500"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
