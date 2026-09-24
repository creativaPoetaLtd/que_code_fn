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

        getSharedWalletPendingMembers: builder.query({
            query: (sharedWalletId: string) => `/shared-wallets/${sharedWalletId}/pending-members`,
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

        transferSharedWalletOwnership: builder.mutation({
            query: ({ sharedWalletId, newOwnerUserId }) => ({
                url: `/shared-wallets/${sharedWalletId}/transfer-ownership`,
                method: "POST",
                body: { newOwnerUserId },
            }),
            invalidatesTags: (result, error, { sharedWalletId }) => [
                { type: "GroupMember", id: sharedWalletId },
                { type: "SharedWallets", id: sharedWalletId },
            ],
        }),

        deleteSharedWallet: builder.mutation({
            query: (sharedWalletId: string) => ({
                url: `/shared-wallets/${sharedWalletId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["SharedWallets"],
        }),

        getPendingSharedWalletInvitations: builder.query({
            query: () => `/shared-wallets/invitations/pending`,
            providesTags: ["SharedWalletInvitations"],
        }),

        respondToSharedWalletInvitation: builder.mutation({
            query: ({ sharedWalletId, membershipId, action }) => ({
                url: `/shared-wallets/${sharedWalletId}/invitations/${membershipId}/respond`,
                method: "POST",
                body: { action },
            }),
            invalidatesTags: ["SharedWalletInvitations", "SharedWallets"],
        }),

        tightenSharedWalletPolicy: builder.mutation({
            query: (sharedWalletId: string) => ({
                url: `/shared-wallets/${sharedWalletId}/policy`,
                method: "PATCH",
                body: { policy: "approval" },
            }),
            invalidatesTags: (result, error, sharedWalletId) => [{ type: "SharedWallets", id: sharedWalletId }],
        }),

        getPendingSharedWalletPolicyChange: builder.query({
            query: (sharedWalletId: string) => `/shared-wallets/${sharedWalletId}/policy-changes/pending`,
            providesTags: (result, error, sharedWalletId) => [{ type: "SharedWalletPolicyChange", id: sharedWalletId }],
        }),

        proposeSharedWalletPolicyChange: builder.mutation({
            query: (sharedWalletId: string) => ({
                url: `/shared-wallets/${sharedWalletId}/policy-changes`,
                method: "POST",
            }),
            invalidatesTags: (result, error, sharedWalletId) => [{ type: "SharedWalletPolicyChange", id: sharedWalletId }],
        }),

        approveSharedWalletPolicyChange: builder.mutation({
            query: ({ sharedWalletId, policyChangeId }) => ({
                url: `/shared-wallets/${sharedWalletId}/policy-changes/${policyChangeId}/approve`,
                method: "POST",
            }),
            invalidatesTags: (result, error, { sharedWalletId }) => [
                { type: "SharedWalletPolicyChange", id: sharedWalletId },
                { type: "SharedWallets", id: sharedWalletId },
            ],
        }),

        declineSharedWalletPolicyChange: builder.mutation({
            query: ({ sharedWalletId, policyChangeId }) => ({
                url: `/shared-wallets/${sharedWalletId}/policy-changes/${policyChangeId}/decline`,
                method: "POST",
            }),
            invalidatesTags: (result, error, { sharedWalletId }) => [
                { type: "SharedWalletPolicyChange", id: sharedWalletId },
            ],
        }),

        cancelSharedWalletPolicyChange: builder.mutation({
            query: ({ sharedWalletId, policyChangeId }) => ({
                url: `/shared-wallets/${sharedWalletId}/policy-changes/${policyChangeId}/cancel`,
                method: "POST",
            }),
            invalidatesTags: (result, error, { sharedWalletId }) => [
                { type: "SharedWalletPolicyChange", id: sharedWalletId },
            ],
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
    useGetSharedWalletPendingMembersQuery,
    useAddSharedWalletMemberMutation,
    useRemoveSharedWalletMemberMutation,
    useLeaveSharedWalletMutation,
    useTransferSharedWalletOwnershipMutation,
    useDeleteSharedWalletMutation,
    useGetPendingSharedWalletInvitationsQuery,
    useRespondToSharedWalletInvitationMutation,
    useTightenSharedWalletPolicyMutation,
    useGetPendingSharedWalletPolicyChangeQuery,
    useProposeSharedWalletPolicyChangeMutation,
    useApproveSharedWalletPolicyChangeMutation,
    useDeclineSharedWalletPolicyChangeMutation,
    useCancelSharedWalletPolicyChangeMutation,
    useDepositIntoSharedWalletMutation,
    useWithdrawFromSharedWalletMutation,
    useProposeSharedWalletWithdrawalMutation,
    useGetSharedWalletWithdrawalByIdQuery,
    useApproveSharedWalletWithdrawalMutation,
    useDeclineSharedWalletWithdrawalMutation,
    useCancelSharedWalletWithdrawalMutation,
} = sharedWalletSlice;
