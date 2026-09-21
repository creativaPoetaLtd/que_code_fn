"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux-store";
import { PencilLine, Users } from "lucide-react";
import { whiteboardSlice, useGetWhiteboardQuery, type WhiteboardData } from "@/states/whiteboardSlice";
import socketService from "@/services/socketService";
import { drawWhiteboardStrokes, WHITEBOARD_HEIGHT, WHITEBOARD_WIDTH } from "@/utils/whiteboardDrawing";
import WhiteboardDialog from "./whiteboard-dialog";

/** What the chat message carries — enough to render a placeholder before the
 *  live board loads. The strokes themselves come from GET /whiteboards/:id. */
export interface WhiteboardMessageData {
    type: "whiteboard";
    whiteboardId: string;
    createdBy: string;
    createdByName: string;
    timestamp: string;
}

interface WhiteboardMessageCardProps {
    data: WhiteboardMessageData;
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

export const WhiteboardMessageCard: React.FC<WhiteboardMessageCardProps> = ({ data, isMe }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [editorOpen, setEditorOpen] = useState(false);
    const previewRef = useRef<HTMLCanvasElement>(null);

    const { data: response } = useGetWhiteboardQuery({ whiteboardId: data.whiteboardId });
    const board: WhiteboardData | undefined = response?.data;

    // Keep the preview current as people draw, without reopening the board
    useEffect(() => {
        const handleUpdated = (updated: WhiteboardData) => {
            if (updated?.id !== data.whiteboardId) return;
            dispatch(
                whiteboardSlice.util.updateQueryData("getWhiteboard", { whiteboardId: data.whiteboardId }, (draft) => {
                    draft.data = updated;
                })
            );
        };

        socketService.onWhiteboardUpdated(handleUpdated);
        return () => socketService.offWhiteboardUpdated(handleUpdated);
    }, [data.whiteboardId, dispatch]);

    // Redraw the thumbnail whenever the strokes change
    useEffect(() => {
        const canvas = previewRef.current;
        if (!canvas) return;
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        canvas.width = WHITEBOARD_WIDTH * dpr;
        canvas.height = WHITEBOARD_HEIGHT * dpr;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawWhiteboardStrokes(ctx, board?.strokes ?? []);
    }, [board?.strokes]);

    const editedAt = fmtEdited(board?.lastEditedAt);
    const strokeCount = board?.strokes?.length ?? 0;

    return (
        <>
            <div
                className={`w-[240px] rounded-2xl overflow-hidden shadow-sm border bg-white dark:bg-darkBg-card ${
                    isMe ? "border-fuchsia-200 dark:border-fuchsia-800/40" : "border-gray-100 dark:border-darkBorder-light"
                }`}
            >
                <div className="h-1 w-full bg-fuchsia-400" />

                <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                    <div className="flex items-center gap-1.5">
                        <PencilLine className="w-3.5 h-3.5 text-fuchsia-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Whiteboard
                        </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                        <Users className="w-2.5 h-2.5" /> Everyone can draw
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="w-full px-3 pb-2"
                >
                    <div className="rounded-lg overflow-hidden border border-gray-100 dark:border-darkBorder-light bg-white">
                        <canvas ref={previewRef} style={{ width: "100%", aspectRatio: `${WHITEBOARD_WIDTH} / ${WHITEBOARD_HEIGHT}`, display: "block", backgroundColor: "#ffffff" }} />
                    </div>
                    {strokeCount === 0 && (
                        <p className="text-[11px] text-gray-400 italic mt-1 text-left">Empty board</p>
                    )}
                </button>

                <div className="px-3 pb-3">
                    <button
                        type="button"
                        onClick={() => setEditorOpen(true)}
                        className="w-full h-8 rounded-lg bg-fuchsia-400 hover:bg-fuchsia-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <PencilLine className="w-3 h-3" /> Open whiteboard
                    </button>
                </div>

                <div className="flex items-center justify-between gap-2 px-3 pb-2">
                    <span className="text-[10px] text-gray-400 truncate">
                        {board?.lastEditedByName && editedAt
                            ? `Edited by ${board.lastEditedByName} · ${editedAt}`
                            : `Started by ${board?.createdByName || data.createdByName}`}
                    </span>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600 flex-shrink-0">
                        {fmtTime(data.timestamp)}
                    </span>
                </div>
            </div>

            <WhiteboardDialog
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                whiteboardId={data.whiteboardId}
            />
        </>
    );
};

export default WhiteboardMessageCard;
