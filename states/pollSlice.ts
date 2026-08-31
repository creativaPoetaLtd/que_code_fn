import { apiSlice } from "@/states/apiSlice";

export interface PollOptionResult {
    id: string;
    text: string;
    voteCount: number;
    /** Empty on anonymous polls — counts are still reported */
    voters: Array<{ userId: string; name: string }>;
}

export interface PollData {
    id: string;
    chatId: string;
    groupId: string | null;
    question: string;
    options: PollOptionResult[];
    allowMultiple: boolean;
    isAnonymous: boolean;
    closesAt: string | null;
    status: "open" | "closed";
    createdBy: string;
    createdByName: string;
    createdAt: string;
    /** Total selections — higher than voterCount when multiple choices are allowed */
    totalVotes: number;
    voterCount: number;
    myVotes: string[];
    /** Whether the viewer may end the poll early (creator, or a group admin) */
    canClose: boolean;
}

export const pollSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createPoll: builder.mutation<
            { data: PollData },
            {
                chatId: string;
                question: string;
                options: string[];
                allowMultiple?: boolean;
                isAnonymous?: boolean;
                closesAt?: string | null;
            }
        >({
            query: ({ chatId, ...body }) => ({
                url: `/chats/${chatId}/polls`,
                method: "POST",
                body,
            }),
            invalidatesTags: (result, error, { chatId }) => [
                "Poll",
                { type: "ChatMessage", id: chatId },
            ],
        }),

        getPoll: builder.query<{ data: PollData }, { pollId: string }>({
            query: ({ pollId }) => `/polls/${pollId}`,
            providesTags: (result, error, { pollId }) => [{ type: "Poll", id: pollId }],
        }),

        votePoll: builder.mutation<
            { data: PollData },
            { pollId: string; optionIds: string[] }
        >({
            query: ({ pollId, optionIds }) => ({
                url: `/polls/${pollId}/vote`,
                method: "POST",
                body: { optionIds },
            }),
            // The response carries the fresh tally, so patch the cache from it instead
            // of round-tripping a refetch.
            async onQueryStarted({ pollId }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        pollSlice.util.updateQueryData("getPoll", { pollId }, (draft) => {
                            draft.data = data.data;
                        })
                    );
                } catch {
                    // The mutation already surfaced the error; leave the cache alone
                }
            },
        }),

        closePoll: builder.mutation<{ data: PollData }, { pollId: string }>({
            query: ({ pollId }) => ({
                url: `/polls/${pollId}/close`,
                method: "POST",
            }),
            async onQueryStarted({ pollId }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        pollSlice.util.updateQueryData("getPoll", { pollId }, (draft) => {
                            draft.data = data.data;
                        })
                    );
                } catch {
                    // Ignore — the card keeps showing the last known state
                }
            },
        }),
    }),
});

export const {
    useCreatePollMutation,
    useGetPollQuery,
    useVotePollMutation,
    useClosePollMutation,
} = pollSlice;
