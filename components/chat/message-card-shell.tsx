"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * One width for every card in the thread. They used to be 240px, 260px and 280px
 * depending on which one you were looking at, which made a conversation read as a
 * pile of unrelated widgets rather than one thread.
 */
export const MESSAGE_CARD_WIDTH = "w-[16.5rem] sm:w-[18.5rem]";

interface MessageCardShellProps {
    /** Tints the top rule, e.g. "bg-fuchsia-400" */
    accentBarClassName: string;
    /** Overrides the resting border — used to tint your own cards */
    borderClassName?: string;
    /** Small glyph beside the label, already colour-tinted by the caller */
    icon: React.ReactNode;
    /** The card's kind, shown uppercase: "Whiteboard", "Poll", … */
    label: string;
    /** Right side of the header — a permission hint, a status chip, a countdown */
    headerMeta?: React.ReactNode;
    /** The card's own content, padded by the caller so previews can run edge to edge */
    children: React.ReactNode;
    /** The single primary action, usually a <MessageCardAction> */
    action?: React.ReactNode;
    footerLeft?: React.ReactNode;
    footerRight?: React.ReactNode;
    /** An extra footer row, for the rare card that needs one */
    footerBelow?: React.ReactNode;
    className?: string;
}

/**
 * The common frame every rich message card sits in: accent rule, titled header,
 * body, one primary action, and a byline/timestamp footer.
 */
export function MessageCardShell({
    accentBarClassName,
    borderClassName,
    icon,
    label,
    headerMeta,
    children,
    action,
    footerLeft,
    footerRight,
    footerBelow,
    className,
}: MessageCardShellProps) {
    const hasFooter = Boolean(footerLeft || footerRight || footerBelow);

    return (
        <div
            className={cn(
                MESSAGE_CARD_WIDTH,
                "overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-darkBg-card",
                borderClassName ?? "border-gray-100 dark:border-darkBorder-light",
                className
            )}
        >
            <div className={cn("h-1 w-full", accentBarClassName)} />

            <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-2.5">
                <div className="flex min-w-0 items-center gap-1.5">
                    {icon}
                    <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {label}
                    </span>
                </div>
                {headerMeta && <div className="flex-shrink-0">{headerMeta}</div>}
            </div>

            {children}

            {action && <div className="px-3 pb-3">{action}</div>}

            {hasFooter && (
                <div className="space-y-1.5 px-3 pb-2">
                    {(footerLeft || footerRight) && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[10px] text-gray-400">{footerLeft}</span>
                            {footerRight && (
                                <span className="flex-shrink-0 text-[10px] text-gray-300 dark:text-gray-600">
                                    {footerRight}
                                </span>
                            )}
                        </div>
                    )}
                    {footerBelow}
                </div>
            )}
        </div>
    );
}

/** A card's single primary action — same height and shape wherever it appears */
export function MessageCardAction({
    onClick,
    disabled,
    className,
    children,
}: {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40",
                className
            )}
        >
            {children}
        </button>
    );
}

/** The small pill some cards show on the right of their header */
export function MessageCardChip({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    // No padding by default: a plain text chip should sit flush with the header's
    // own gutter. Callers that give it a background add the pill padding too.
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold",
                className ?? "text-gray-400"
            )}
        >
            {children}
        </span>
    );
}
