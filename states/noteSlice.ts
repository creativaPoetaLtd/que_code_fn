import { apiSlice } from "@/states/apiSlice";

export interface SharedNoteData {
    id: string;
    chatId: string;
    groupId: string | null;
    title: string;
    content: string;
    /** Bumped on every save — send it back as baseVersion to guard against overwrites */
    version: number;
    snippet: string;
    createdBy: string;
    createdByName: string;
    lastEditedBy: string | null;
    lastEditedByName: string | null;
    lastEditedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

/** List rows carry everything but the body, which can be long */
export type SharedNoteSummary = Omit<SharedNoteData, "content">;

/** Cache tag for "the set of notes in this chat" */
const listTag = (chatId: string) => ({ type: "SharedNote" as const, id: `LIST-${chatId}` });

export const noteSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createSharedNote: builder.mutation<
            { data: SharedNoteData },
            { chatId: string; title: string; content: string }
        >({
            query: ({ chatId, ...body }) => ({
                url: `/chats/${chatId}/notes`,
                method: "POST",
                body,
            }),
            invalidatesTags: (result, error, { chatId }) => [
                listTag(chatId),
                { type: "ChatMessage", id: chatId },
            ],
        }),

        getChatNotes: builder.query<{ data: SharedNoteSummary[] }, { chatId: string }>({
            query: ({ chatId }) => `/chats/${chatId}/notes`,
            providesTags: (result, error, { chatId }) => [listTag(chatId)],
        }),

        getSharedNote: builder.query<{ data: SharedNoteData }, { noteId: string }>({
            query: ({ noteId }) => `/notes/${noteId}`,
            providesTags: (result, error, { noteId }) => [{ type: "SharedNote", id: noteId }],
        }),

        updateSharedNote: builder.mutation<
            { data: SharedNoteData },
            { noteId: string; title?: string; content?: string; baseVersion: number }
        >({
            query: ({ noteId, ...body }) => ({
                url: `/notes/${noteId}`,
                method: "PATCH",
                body,
            }),
            // The response is the saved note, so patch the cache from it rather than
            // refetching — a refetch mid-typing would fight the editor.
            async onQueryStarted({ noteId }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        noteSlice.util.updateQueryData("getSharedNote", { noteId }, (draft) => {
                            draft.data = data.data;
                        })
                    );
                } catch {
                    // A 409 carries the other person's copy; the editor handles it
                }
            },
        }),
    }),
});

export const {
    useCreateSharedNoteMutation,
    useGetChatNotesQuery,
    useGetSharedNoteQuery,
    useUpdateSharedNoteMutation,
} = noteSlice;
