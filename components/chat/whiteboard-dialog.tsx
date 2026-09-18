"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux-store";
import { Check, Eraser, Loader2, Pencil, Trash2, Undo2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getCurrentUserId } from "@/utils/tokenUtils";
import socketService from "@/services/socketService";
import {
    whiteboardSlice,
    useCreateWhiteboardMutation,
    useGetWhiteboardQuery,
    useUpdateWhiteboardMutation,
    type WhiteboardData,
} from "@/states/whiteboardSlice";
import {
    WHITEBOARD_COLORS,
    WHITEBOARD_STROKE_WIDTHS,
    type WhiteboardStroke,
} from "@/utils/whiteboardDrawing";
import WhiteboardCanvas from "./whiteboard-canvas";

const AUTOSAVE_DELAY = 900;

interface WhiteboardDialogProps {
    isOpen: boolean;
    onClose: () => void;
    chatId?: string;
    /** Omit to start a new board; the card is posted to the chat on first share */
    whiteboardId?: string;
}

type SaveState = "idle" | "dirty" | "saving" | "saved";
type Tool = "pen" | "eraser";

export default function WhiteboardDialog({ isOpen, onClose, chatId, whiteboardId }: WhiteboardDialogProps) {
    const isCreating = !whiteboardId;
    const dispatch = useDispatch<AppDispatch>();
    const currentUserId = getCurrentUserId() || "me";

    const { data: response, isLoading } = useGetWhiteboardQuery(
        { whiteboardId: whiteboardId as string },
        { skip: !whiteboardId || !isOpen }
    );
    const board = response?.data;
    const baseStrokes = isCreating ? [] : board?.strokes ?? [];

    const [createBoard, { isLoading: creating }] = useCreateWhiteboardMutation();
    const [updateBoard] = useUpdateWhiteboardMutation();

    // Strokes drawn locally that aren't part of the saved board yet - a draft while
    // creating, or the not-yet-autosaved tail while editing an existing one.
    const [localStrokes, setLocalStrokes] = useState<WhiteboardStroke[]>([]);
    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState<string>(WHITEBOARD_COLORS[0]);
    const [lineWidth, setLineWidth] = useState<number>(WHITEBOARD_STROKE_WIDTHS[0]);
    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [confirmingClear, setConfirmingClear] = useState(false);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef<WhiteboardStroke[]>([]);
    const saveStateRef = useRef<SaveState>("idle");

    const applySaveState = useCallback((next: SaveState) => {
        saveStateRef.current = next;
        setSaveState(next);
    }, []);

    useEffect(() => {
        pendingRef.current = localStrokes;
    }, [localStrokes]);

    // Reset the draft each time the dialog is opened fresh
    useEffect(() => {
        if (!isOpen) return;
        setLocalStrokes([]);
        setConfirmingClear(false);
        applySaveState("idle");
    }, [isOpen, whiteboardId, applySaveState]);

    const flushSave = useCallback(
        async (strokesToSave: WhiteboardStroke[]) => {
            if (!whiteboardId || strokesToSave.length === 0) return;
            applySaveState("saving");
            try {
                await updateBoard({ whiteboardId, addStrokes: strokesToSave }).unwrap();
                // Only drop the strokes this save actually covered - drawing that
                // happened while the request was in flight stays queued.
                setLocalStrokes((prev) => prev.slice(strokesToSave.length));
                applySaveState("saved");
            } catch (err: any) {
                applySaveState("dirty");
                toast({
                    title: "Could not save",
                    description: err?.data?.message || "Your drawing is still here — it'll retry.",
                    variant: "destructive",
                });
            }
        },
        [whiteboardId, updateBoard, applySaveState]
    );

    const queueSave = useCallback(() => {
        if (isCreating) return;
        applySaveState("dirty");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => flushSave(pendingRef.current), AUTOSAVE_DELAY);
    }, [isCreating, flushSave, applySaveState]);

    useEffect(() => () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
    }, []);

    const handleStrokeComplete = (stroke: WhiteboardStroke) => {
        setLocalStrokes((prev) => [...prev, stroke]);
        queueSave();
    };

    // Live sync: every save anywhere just appends or removes marks, so there's
    // nothing to conflict with — always adopt the latest.
    useEffect(() => {
        if (!isOpen || !whiteboardId) return;

        const handleUpdated = (updated: WhiteboardData) => {
            if (updated?.id !== whiteboardId) return;
            dispatch(
                whiteboardSlice.util.updateQueryData("getWhiteboard", { whiteboardId }, (draft) => {
                    draft.data = updated;
                })
            );
        };

        const handleDeleted = (data: { whiteboardId: string }) => {
            if (data?.whiteboardId !== whiteboardId) return;
            if (saveTimer.current) clearTimeout(saveTimer.current);
            toast({ title: "Whiteboard deleted", description: "Someone deleted this board from the chat." });
            onClose();
        };

        socketService.onWhiteboardUpdated(handleUpdated);
        socketService.onWhiteboardDeleted(handleDeleted);
        return () => {
            socketService.offWhiteboardUpdated(handleUpdated);
            socketService.offWhiteboardDeleted(handleDeleted);
        };
    }, [isOpen, whiteboardId, dispatch, onClose]);

    /** My most recent surviving stroke — pending first, then whatever's saved */
    const undoTarget = useMemo(() => {
        if (localStrokes.length > 0) return { source: "local" as const, stroke: localStrokes[localStrokes.length - 1] };
        for (let i = baseStrokes.length - 1; i >= 0; i--) {
            if (baseStrokes[i].authorId === currentUserId) {
                return { source: "saved" as const, stroke: baseStrokes[i] };
            }
        }
        return null;
    }, [localStrokes, baseStrokes, currentUserId]);

    const handleUndo = async () => {
        if (!undoTarget) return;
        if (undoTarget.source === "local") {
            setLocalStrokes((prev) => prev.slice(0, -1));
            return;
        }
        if (!whiteboardId) return;
        try {
            await updateBoard({ whiteboardId, removeStrokeIds: [undoTarget.stroke.id] }).unwrap();
        } catch (err: any) {
            toast({
                title: "Could not undo",
                description: err?.data?.message || "Please try again.",
                variant: "destructive",
            });
        }
    };

    const hasAnything = baseStrokes.length > 0 || localStrokes.length > 0;

    const handleClear = async () => {
        setConfirmingClear(false);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setLocalStrokes([]);
        applySaveState("idle");
        if (isCreating || !whiteboardId) return;
        try {
            await updateBoard({ whiteboardId, clear: true }).unwrap();
        } catch (err: any) {
            toast({
                title: "Could not clear the board",
                description: err?.data?.message || "Please try again.",
                variant: "destructive",
            });
        }
    };

    const requestClear = () => {
        if (!hasAnything) return;
        if (isCreating) {
            void handleClear();
            return;
        }
        setConfirmingClear(true);
    };

    const handleShare = async () => {
        if (!chatId) return;
        try {
            await createBoard({ chatId, strokes: localStrokes }).unwrap();
            toast({ title: "Whiteboard shared" });
            onClose();
        } catch (err: any) {
            toast({
                title: "Could not share the whiteboard",
                description: err?.data?.message || "Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleClose = () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        // Don't lose a pending drawing just because the dialog was dismissed
        if (!isCreating && pendingRef.current.length > 0) void flushSave(pendingRef.current);
        onClose();
    };

    const statusLabel = () => {
        if (saveState === "saving") return "Saving…";
        if (saveState === "saved") return "Saved";
        if (saveState === "dirty") return "Unsaved changes";
        if (board?.lastEditedByName) return `Last edited by ${board.lastEditedByName}`;
        return null;
    };

    useEffect(() => {
        if (saveState !== "saved") return;
        const id = setTimeout(() => applySaveState("idle"), 2000);
        return () => clearTimeout(id);
    }, [saveState, applySaveState]);

    return (
        <Dialog open={isOpen} onOpenChange={(next) => { if (!next) handleClose(); }}>
            <DialogContent className="bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-2xl w-[calc(100vw-2rem)] max-w-lg p-0 gap-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <div className="flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                            {isCreating ? "New whiteboard" : "Whiteboard"}
                        </p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                        {isCreating
                            ? "Everyone in this chat can draw on it after you share it."
                            : statusLabel() || "Everyone in this chat can draw on this board."}
                    </p>
                </div>

                {isLoading && !board && !isCreating ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                ) : (
                    <div className="p-5 space-y-3">
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-darkBorder-light">
                            <WhiteboardCanvas
                                strokes={baseStrokes}
                                pendingStrokes={localStrokes}
                                authorId={currentUserId}
                                color={color}
                                lineWidth={lineWidth}
                                tool={tool}
                                onStrokeComplete={handleStrokeComplete}
                            />
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                                {WHITEBOARD_COLORS.map((swatch) => (
                                    <button
                                        key={swatch}
                                        type="button"
                                        onClick={() => { setColor(swatch); setTool("pen"); }}
                                        aria-label={`Use ${swatch}`}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                            tool === "pen" && color === swatch
                                                ? "border-brand-green dark:border-brand-gold scale-110"
                                                : "border-transparent"
                                        }`}
                                        style={{ backgroundColor: swatch }}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-1">
                                {WHITEBOARD_STROKE_WIDTHS.map((w) => (
                                    <button
                                        key={w}
                                        type="button"
                                        onClick={() => setLineWidth(w)}
                                        aria-label={`Stroke width ${w}`}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                                            lineWidth === w
                                                ? "border-brand-green dark:border-brand-gold bg-brand-green/10 dark:bg-brand-gold/10"
                                                : "border-gray-200 dark:border-darkBorder-light"
                                        }`}
                                    >
                                        <span
                                            className="rounded-full bg-gray-700 dark:bg-gray-200"
                                            style={{ width: w, height: w }}
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setTool("eraser")}
                                    aria-label="Eraser"
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                                        tool === "eraser"
                                            ? "border-brand-green dark:border-brand-gold bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold"
                                            : "border-gray-200 dark:border-darkBorder-light text-gray-500 dark:text-gray-400"
                                    }`}
                                >
                                    <Eraser className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    disabled={!undoTarget}
                                    aria-label="Undo my last stroke"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 dark:border-darkBorder-light text-gray-500 dark:text-gray-400 disabled:opacity-30 transition-opacity"
                                >
                                    <Undo2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={requestClear}
                                    disabled={!hasAnything}
                                    aria-label="Clear the board"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 dark:border-darkBorder-light text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 disabled:opacity-30 disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {confirmingClear && (
                            <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-3 py-2.5 space-y-2">
                                <p className="text-[11px] text-red-700 dark:text-red-300">
                                    Clear the board for everyone? This can't be undone.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmingClear(false)}
                                        className="flex-1 py-1.5 rounded-lg border border-gray-200 dark:border-darkBorder-light text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold transition-colors"
                                    >
                                        Yes, clear
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                                {saveState === "saving" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                {saveState === "saved" && <Check className="w-2.5 h-2.5 text-brand-green dark:text-brand-gold" />}
                                {!isCreating && statusLabel()}
                            </span>
                            {!isCreating && board && (
                                <span className="text-[10px] text-gray-400 truncate">
                                    Started by {board.createdByName}
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
                                {isCreating ? "Cancel" : "Done"}
                            </button>
                            {isCreating && (
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    disabled={creating}
                                    className="flex-1 py-2.5 rounded-xl bg-brand-green dark:bg-brand-gold hover:opacity-90 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                                    {creating ? "Sharing..." : "Share whiteboard"}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
