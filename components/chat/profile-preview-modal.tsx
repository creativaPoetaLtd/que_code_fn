'use client';

import React from 'react';
import { ExternalLink, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import PublicProfileView from '@/components/profile/PublicProfileView';

interface ProfilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** The person whose public profile to show */
    userId?: string | null;
    name?: string;
}

/**
 * The /welcome profile, opened from chat without leaving the conversation. It renders
 * the same component the page does, so the two can't drift apart.
 */
export default function ProfilePreviewModal({
    isOpen,
    onClose,
    userId,
    name,
}: ProfilePreviewModalProps) {
    const router = useRouter();

    if (!userId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={next => { if (!next) onClose(); }}>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-darkBorder-light dark:bg-darkBg-card">
                {/* Own chrome: the embedded view drops the app header and nav */}
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-darkBorder-light">
                    <p className="min-w-0 truncate text-sm font-bold text-gray-900 dark:text-white">
                        {name || 'Profile'}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                router.push(`/welcome/${userId}`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-darkBg-interactive dark:hover:text-gray-200"
                        >
                            <ExternalLink className="h-3 w-3" /> Open full page
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close profile"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-darkBg-interactive dark:hover:text-gray-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="max-h-[80vh] overflow-y-auto">
                    <PublicProfileView userId={userId} embedded />
                </div>
            </DialogContent>
        </Dialog>
    );
}
