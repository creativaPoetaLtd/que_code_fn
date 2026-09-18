/**
 * The logical drawing surface every whiteboard is recorded in, independent of any
 * one screen's actual pixels. Pointer input is mapped into this space before being
 * stored, so a board drawn on a phone looks identical opened on a laptop, and the
 * chat card's small preview and the full editor can share one render function.
 */
export const WHITEBOARD_WIDTH = 800;
export const WHITEBOARD_HEIGHT = 500;

export interface WhiteboardStroke {
    id: string;
    authorId: string;
    points: number[];
    color: string;
    width: number;
    erase?: boolean;
}

/** A pen color swatch offered in the toolbar */
export const WHITEBOARD_COLORS = [
    "#111111", // black
    "#ef4444", // red
    "#2563eb", // blue
    "#16a34a", // green
    "#f59e0b", // amber
] as const;

export const WHITEBOARD_STROKE_WIDTHS = [3, 6, 12] as const;

/** Redraws the full board onto a canvas already sized to WHITEBOARD_WIDTH x
 *  WHITEBOARD_HEIGHT logical units (the caller handles device-pixel scaling). */
export function drawWhiteboardStrokes(
    ctx: CanvasRenderingContext2D,
    strokes: WhiteboardStroke[]
) {
    ctx.save();
    ctx.clearRect(0, 0, WHITEBOARD_WIDTH, WHITEBOARD_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WHITEBOARD_WIDTH, WHITEBOARD_HEIGHT);

    for (const stroke of strokes) {
        if (!stroke.points || stroke.points.length < 4) continue;
        ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(stroke.points[0], stroke.points[1]);
        for (let i = 2; i < stroke.points.length; i += 2) {
            ctx.lineTo(stroke.points[i], stroke.points[i + 1]);
        }
        ctx.stroke();
    }
    ctx.restore();
}
