"use client";

import React, { useEffect, useRef } from "react";
import {
    drawWhiteboardStrokes,
    WHITEBOARD_HEIGHT,
    WHITEBOARD_WIDTH,
    type WhiteboardStroke,
} from "@/utils/whiteboardDrawing";

interface WhiteboardCanvasProps {
    /** Everyone's committed strokes */
    strokes: WhiteboardStroke[];
    /** This viewer's own strokes, drawn locally but not saved yet - kept separate
     *  so a slow save never makes a just-drawn line flicker away. */
    pendingStrokes?: WhiteboardStroke[];
    authorId: string;
    color: string;
    lineWidth: number;
    tool: "pen" | "eraser";
    readOnly?: boolean;
    onStrokeComplete: (stroke: WhiteboardStroke) => void;
    className?: string;
}

const newStrokeId = (authorId: string) =>
    `${authorId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function WhiteboardCanvas({
    strokes,
    pendingStrokes = [],
    authorId,
    color,
    lineWidth,
    tool,
    readOnly = false,
    onStrokeComplete,
    className,
}: WhiteboardCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const dprRef = useRef(1);
    const drawingRef = useRef<{ points: number[] } | null>(null);

    // Size the backing store once for crisp lines at this device's pixel density,
    // then draw everything after in the fixed logical 800x500 space.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        dprRef.current = dpr;
        canvas.width = WHITEBOARD_WIDTH * dpr;
        canvas.height = WHITEBOARD_HEIGHT * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
        ctxRef.current = ctx;
        if (ctx) drawWhiteboardStrokes(ctx, [...strokes, ...pendingStrokes]);
        // Only the one-time setup depends on the canvas element itself
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Full redraw whenever the committed or pending strokes change
    useEffect(() => {
        if (!ctxRef.current) return;
        drawWhiteboardStrokes(ctxRef.current, [...strokes, ...pendingStrokes]);
    }, [strokes, pendingStrokes]);

    const toLogicalPoint = (clientX: number, clientY: number): [number, number] => {
        const canvas = canvasRef.current;
        if (!canvas) return [0, 0];
        const rect = canvas.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * WHITEBOARD_WIDTH;
        const y = ((clientY - rect.top) / rect.height) * WHITEBOARD_HEIGHT;
        return [
            Math.max(0, Math.min(WHITEBOARD_WIDTH, x)),
            Math.max(0, Math.min(WHITEBOARD_HEIGHT, y)),
        ];
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (readOnly) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const [x, y] = toLogicalPoint(e.clientX, e.clientY);
        drawingRef.current = { points: [x, y] };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const drawing = drawingRef.current;
        const ctx = ctxRef.current;
        if (!drawing || !ctx) return;

        const [x, y] = toLogicalPoint(e.clientX, e.clientY);
        const [prevX, prevY] = drawing.points.slice(-2);
        drawing.points.push(x, y);

        // Draw just the new segment on top of what's already there — cheap even
        // with thousands of older strokes already committed to the canvas.
        ctx.save();
        ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
    };

    const finishStroke = () => {
        const drawing = drawingRef.current;
        drawingRef.current = null;
        if (!drawing) return;

        // A tap with no drag is still just one point — repeat it so moveTo+lineTo
        // draws a zero-length line, which the round cap renders as a dot. Without
        // this, a quick dab (the normal way to erase a small mistake, as opposed
        // to drawing, which is usually a drag) silently does nothing.
        const points = drawing.points.length >= 4
            ? drawing.points
            : [drawing.points[0], drawing.points[1], drawing.points[0], drawing.points[1]];

        onStrokeComplete({
            id: newStrokeId(authorId),
            authorId,
            points,
            color,
            width: lineWidth,
            ...(tool === "eraser" ? { erase: true } : {}),
        });
    };

    return (
        <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerLeave={finishStroke}
            onPointerCancel={finishStroke}
            className={className}
            style={{
                width: "100%",
                aspectRatio: `${WHITEBOARD_WIDTH} / ${WHITEBOARD_HEIGHT}`,
                touchAction: "none",
                cursor: readOnly ? "default" : "crosshair",
                display: "block",
                // The board's own white fill is part of the drawing (see
                // drawWhiteboardStrokes), but an erased spot punches all the way
                // through to canvas transparency — without this, that shows
                // whatever's behind the element (the dark modal background in
                // dark mode) instead of blending back to the board's white.
                backgroundColor: "#ffffff",
            }}
        />
    );
}
