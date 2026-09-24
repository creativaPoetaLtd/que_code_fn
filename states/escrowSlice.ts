import { apiSlice } from "@/states/apiSlice";

export const escrowSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createEscrow: builder.mutation({
            query: (data) => ({
                url: "/escrows",
                method: "POST",
                body: data
            }),
            invalidatesTags: (result, error, { chatId }) => [
                "Escrow",
                { type: "ChatMessage", id: chatId }
            ]
        }),

        getMyEscrows: builder.query({
            query: ({ status, role }: { status?: string; role?: "payer" | "payee" } = {}) => {
                const params = new URLSearchParams();
                if (status) params.set("status", status);
                if (role) params.set("role", role);
                const qs = params.toString();
                return `/escrows${qs ? `?${qs}` : ""}`;
            },
            providesTags: ["Escrow"]
        }),

        getEscrowById: builder.query({
            query: ({ escrowId }) => `/escrows/${escrowId}`,
            providesTags: (result, error, { escrowId }) => [{ type: "Escrow", id: escrowId }]
        }),

        releaseEscrow: builder.mutation({
            query: ({ escrowId }) => ({
                url: `/escrows/${escrowId}/release`,
                method: "POST"
            }),
            invalidatesTags: (result, error, { escrowId, chatId }) => [
                "Escrow",
                { type: "Escrow", id: escrowId },
                { type: "ChatMessage", id: chatId }
            ]
        }),

        fulfillEscrow: builder.mutation({
            query: ({ escrowId }) => ({
                url: `/escrows/${escrowId}/fulfill`,
                method: "POST"
            }),
            invalidatesTags: (result, error, { escrowId, chatId }) => [
                "Escrow",
                { type: "Escrow", id: escrowId },
                { type: "ChatMessage", id: chatId }
            ]
        }),

        proposeSettlement: builder.mutation({
            query: ({ escrowId, payeeAmount, note }) => ({
                url: `/escrows/${escrowId}/propose`,
                method: "POST",
                body: { payeeAmount, note }
            }),
            invalidatesTags: (result, error, { escrowId, chatId }) => [
                "Escrow",
                { type: "Escrow", id: escrowId },
                { type: "ChatMessage", id: chatId }
            ]
        }),

        acceptSettlement: builder.mutation({
            query: ({ escrowId }) => ({
                url: `/escrows/${escrowId}/accept`,
                method: "POST"
            }),
            invalidatesTags: (result, error, { escrowId, chatId }) => [
                "Escrow",
                { type: "Escrow", id: escrowId },
                { type: "ChatMessage", id: chatId }
            ]
        }),

        declineSettlement: builder.mutation({
            query: ({ escrowId }) => ({
                url: `/escrows/${escrowId}/decline`,
                method: "POST"
            }),
            invalidatesTags: (result, error, { escrowId, chatId }) => [
                "Escrow",
                { type: "Escrow", id: escrowId },
                { type: "ChatMessage", id: chatId }
            ]
        }),

        disputeEscrow: builder.mutation({
            query: ({ escrowId, reason }) => ({
                url: `/escrows/${escrowId}/dispute`,
                method: "POST",
                body: { reason }
            }),
            invalidatesTags: (result, error, { escrowId, chatId }) => [
                "Escrow",
                { type: "Escrow", id: escrowId },
                { type: "ChatMessage", id: chatId }
            ]
        }),
    }),
});

export const {
    useCreateEscrowMutation,
    useGetMyEscrowsQuery,
    useGetEscrowByIdQuery,
    useReleaseEscrowMutation,
    useFulfillEscrowMutation,
    useProposeSettlementMutation,
    useAcceptSettlementMutation,
    useDeclineSettlementMutation,
    useDisputeEscrowMutation,
} = escrowSlice;
