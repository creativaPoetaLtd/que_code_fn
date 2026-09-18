import { apiSlice } from "@/states/apiSlice";

/** One freehand stroke, recorded in the fixed 800x500 logical space every
 *  whiteboard-canvas.tsx surface draws into - see WHITEBOARD_WIDTH/HEIGHT. */
export interface WhiteboardStroke {
    id: string;
    authorId: string;
    points: number[];
    color: string;
    width: number;
    erase?: boolean;
}

export interface WhiteboardData {
    id: string;
    chatId: string;
    groupId: string | null;
    strokes: WhiteboardStroke[];
    /** Bumped on every save */
    version: number;
    createdBy: string;
    createdByName: string;
    lastEditedBy: string | null;
    lastEditedByName: string | null;
    lastEditedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export const whiteboardSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createWhiteboard: builder.mutation<
            { data: WhiteboardData },
            { chatId: string; strokes?: Omit<WhiteboardStroke, "authorId">[] }
        >({
            query: ({ chatId, ...body }) => ({
                url: `/chats/${chatId}/whiteboards`,
                method: "POST",
                body,
            }),
            invalidatesTags: (result, error, { chatId }) => [
                { type: "ChatMessage", id: chatId },
            ],
        }),

        getWhiteboard: builder.query<{ data: WhiteboardData }, { whiteboardId: string }>({
            query: ({ whiteboardId }) => `/whiteboards/${whiteboardId}`,
            providesTags: (result, error, { whiteboardId }) => [
                { type: "Whiteboard", id: whiteboardId },
            ],
        }),

        // A delta, not a replacement: new strokes are appended, and a stroke can
        // only be removed by whoever drew it - see updateWhiteboard on the server
        // for why that means two people drawing at once never conflict.
        updateWhiteboard: builder.mutation<
            { data: WhiteboardData },
            {
                whiteboardId: string;
                addStrokes?: Omit<WhiteboardStroke, "authorId">[];
                removeStrokeIds?: string[];
                clear?: boolean;
            }
        >({
            query: ({ whiteboardId, ...body }) => ({
                url: `/whiteboards/${whiteboardId}`,
                method: "PATCH",
                body,
            }),
            // The response carries the full, authoritative stroke list, so patch the
            // cache from it rather than refetching - a refetch mid-drawing would
            // fight the canvas.
            async onQueryStarted({ whiteboardId }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        whiteboardSlice.util.updateQueryData("getWhiteboard", { whiteboardId }, (draft) => {
                            draft.data = data.data;
                        })
                    );
                } catch {
                    // Request failed - the canvas keeps its pending strokes and retries
                }
            },
        }),
    }),
});

export const {
    useCreateWhiteboardMutation,
    useGetWhiteboardQuery,
    useUpdateWhiteboardMutation,
} = whiteboardSlice;
