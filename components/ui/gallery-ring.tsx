'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GalleryRingProps {
    /** Whether this person has photos worth opening */
    active: boolean;
    children: React.ReactNode;
    /** Matches the surface behind the avatar so the gap reads as a gap, not a halo */
    gapClassName?: string;
    /** "sm" for chat avatars, "lg" for the big profile picture */
    size?: 'sm' | 'lg';
    className?: string;
}

/**
 * The green ring that marks an avatar whose owner has a visible photo gallery.
 *
 * One component for the chat list, the chat header and the profile page — the three
 * are meant to read as the same signal, so the gradient lives in exactly one place.
 * The gap and the gradient are what separate it from an ordinary coloured border.
 */
export default function GalleryRing({
    active,
    children,
    gapClassName = 'bg-white dark:bg-darkBg-card',
    size = 'sm',
    className,
}: GalleryRingProps) {
    if (!active) return <>{children}</>;

    return (
        <span
            className={cn(
                'inline-block rounded-full bg-gradient-to-tr from-emerald-300 via-green-400 to-emerald-500',
                size === 'lg'
                    ? 'p-[3px] shadow-[0_0_0_4px_rgba(52,211,153,0.18)]'
                    : 'p-[2px]',
                className
            )}
        >
            <span
                className={cn(
                    'block rounded-full',
                    size === 'lg' ? 'p-[2.5px]' : 'p-[1.5px]',
                    gapClassName
                )}
            >
                {children}
            </span>
        </span>
    );
}
