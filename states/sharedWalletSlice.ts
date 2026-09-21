import { apiSlice } from "@/states/apiSlice";

export const sharedWalletSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createSharedWallet: builder.mutation({
            query: ({ name, withdrawalPolicy, memberIds, pin }) => ({
                url: `/shared-wallets`,
                method: "POST",
                body: { name, withdrawalPolicy, memberIds, pin },
            }),
            invalidatesTags: ["SharedWallets"],
        }),

        getMySharedWallets: builder.query({
            query: () => `/shared-wallets`,
            providesTags: ["SharedWallets"],
        }),

        getSharedWalletById: builder.query({
            query: (sharedWalletId: string) => `/shared-wallets/${sharedWalletId}`,
            providesTags: (result, error, sharedWalletId) => [{ type: "SharedWallets", id: sharedWalletId }],
        }),

        getSharedWalletActivity: builder.query({
            query: (sharedWalletId: string) => `/shared-wallets/${sharedWalletId}/activity`,
            providesTags: (result, error, sharedWalletId) => [{ type: "Wallet", id: sharedWalletId }],
        }),

        getSharedWalletMembers: builder.query({
            query: (sharedWalletId: string) => `/shared-wallets/${sharedWalletId}/members`,
            providesTags: (result, error, sharedWalletId) => [{ type: "GroupMember", id: sharedWalletId }],
        }),

        addSharedWalletMember: builder.mutation({
            query: ({ sharedWalletId, userId }) => ({
                url: `/shared-wallets/${sharedWalletId}/members`,
                method: "POST",
                body: { userId },
            }),
            invalidatesTags: (result, error, { sharedWalletId }) => [
                { type: "GroupMember", id: sharedWalletId },
                { type: "SharedWallets", id: sharedWalletId },
            ],
        }),

        removeSharedWalletMember: builder.mutation({
            query: ({ sharedWalletId, userId }) => ({
                url: `/shared-wallets/${sharedWalletId}/members/${userId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, { sharedWalletId }) => [
                { type: "GroupMember", id: sharedWalletId },
                { type: "SharedWallets", id: sharedWalletId },
            ],
        }),

        leaveSharedWallet: builder.mutation({
            query: (sharedWalletId: string) => ({
                url: `/shared-wallets/${sharedWalletId}/leave`,
                method: "POST",
            }),
            invalidatesTags: ["SharedWallets"],
        }),

        depositIntoSharedWallet: builder.mutation({
            query: ({ sharedWalletId, amount, pin, note }) => ({
                url: `/shared-wallets/${sharedWalletId}/deposit`,
                method: "POST",
                body: { amount, pin, note },
            }),
            invalidatesTags: (result, error, { sharedWalletId }) => [
                "SharedWallets",
                { type: "SharedWallets", id: sharedWalletId },
                { type: "Wallet", id: sharedWalletId },
            ],
        }),

        withdrawFromSharedWallet: builder.mutation({
            query: ({ sharedWalletId, amount, pin, note }) => ({
                url: `/shared-wallets/${sharedWalletId}/withdraw`,
                method: "POST",
                body: { amount, pin, note },
            }),
            invalidatesTags: (result, error, { sharedWalletId, chatId }) => [
                "SharedWallets",
                { type: "SharedWallets", id: sharedWalletId },
                { type: "Wallet", id: sharedWalletId },
                { type: "ChatMessage", id: chatId },
            ],
        }),

        proposeSharedWalletWithdrawal: builder.mutation({
            query: ({ sharedWalletId, amount, pin, note }) => ({
                url: `/shared-wallets/${sharedWalletId}/withdrawals`,
                method: "POST",
                body: { amount, pin, note },
            }),
            invalidatesTags: (result, error, { sharedWalletId, chatId }) => [
                "SharedWalletWithdrawal",
                { type: "Wallet", id: sharedWalletId },
                { type: "ChatMessage", id: chatId },
            ],
        }),

        getSharedWalletWithdrawalById: builder.query({
            query: ({ sharedWalletId, withdrawalId }) =>
                `/shared-wallets/${sharedWalletId}/withdrawals/${withdrawalId}`,
            providesTags: (result, error, { withdrawalId }) => [
                { type: "SharedWalletWithdrawal", id: withdrawalId },
            ],
        }),

        approveSharedWalletWithdrawal: builder.mutation({
            query: ({ sharedWalletId, withdrawalId, pin }) => ({
                url: `/shared-wallets/${sharedWalletId}/withdrawals/${withdrawalId}/approve`,
                method: "POST",
                body: { pin },
            }),
            invalidatesTags: (result, error, { sharedWalletId, withdrawalId, chatId }) => [
                "SharedWallets",
                { type: "Wallet", id: sharedWalletId },
                { type: "SharedWalletWithdrawal", id: withdrawalId },
                { type: "ChatMessage", id: chatId },
            ],
        }),

        declineSharedWalletWithdrawal: builder.mutation({
            query: ({ sharedWalletId, withdrawalId }) => ({
                url: `/shared-wallets/${sharedWalletId}/withdrawals/${withdrawalId}/decline`,
                method: "POST",
            }),
            invalidatesTags: (result, error, { withdrawalId, chatId }) => [
                { type: "SharedWalletWithdrawal", id: withdrawalId },
                { type: "ChatMessage", id: chatId },
            ],
        }),

        cancelSharedWalletWithdrawal: builder.mutation({
            query: ({ sharedWalletId, withdrawalId }) => ({
                url: `/shared-wallets/${sharedWalletId}/withdrawals/${withdrawalId}/cancel`,
                method: "POST",
            }),
            invalidatesTags: (result, error, { withdrawalId, chatId }) => [
                { type: "SharedWalletWithdrawal", id: withdrawalId },
                { type: "ChatMessage", id: chatId },
            ],
        }),
    }),
});

export const {
    useCreateSharedWalletMutation,
    useGetMySharedWalletsQuery,
    useGetSharedWalletByIdQuery,
    useGetSharedWalletActivityQuery,
    useGetSharedWalletMembersQuery,
    useAddSharedWalletMemberMutation,
    useRemoveSharedWalletMemberMutation,
    useLeaveSharedWalletMutation,
    useDepositIntoSharedWalletMutation,
    useWithdrawFromSharedWalletMutation,
    useProposeSharedWalletWithdrawalMutation,
    useGetSharedWalletWithdrawalByIdQuery,
    useApproveSharedWalletWithdrawalMutation,
    useDeclineSharedWalletWithdrawalMutation,
    useCancelSharedWalletWithdrawalMutation,
} = sharedWalletSlice;
