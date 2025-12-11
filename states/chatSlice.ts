import { apiSlice } from "@/states/apiSlice";

export const chatSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserChats: builder.query({
            query: () => "/chats",
            providesTags: ["Chat"]
        }),

        getChatMessages: builder.query({
            query: ({ chatId, page = 1, limit = 50 }) =>
                `/chats/${chatId}/messages?page=${page}&limit=${limit}`,
            providesTags: (result, error, { chatId }) => [
                { type: "ChatMessage", id: chatId }
            ]
        }),
        createOrGetDMChat: builder.mutation({
            query: ({ participantId }) => ({
                url: "/chats/dm",
                method: "POST",
                body: { participantId }
            }),
            invalidatesTags: ["Chat"]
        }),

        sendMessage: builder.mutation({
            query: ({ chatId, content, messageType = "text", transactionId }) => ({
                url: `/chats/${chatId}/messages`,
                method: "POST",
                body: { content, messageType, transactionId }
            }),
            invalidatesTags: (result, error, { chatId }) => [
                { type: "ChatMessage", id: chatId }
            ]
        }),

        // Mark messages as read
        markMessagesAsRead: builder.mutation({
            query: ({ chatId }) => ({
                url: `/chats/${chatId}/read`,
                method: "POST"
            }),
            invalidatesTags: (result, error, { chatId }) => [
                { type: "ChatMessage", id: chatId }
            ]
        }),

        getChatParticipantsStatus: builder.query({
            query: ({ chatId }) => `/chats/${chatId}/participants/status`,
            providesTags: (result, error, { chatId }) => [
                { type: "ChatStatus", id: chatId }
            ]
        }),

        createGroupChat: builder.mutation({
            query: ({ participantIds, groupName }) => ({
                url: "/chats/group",
                method: "POST",
                body: { participantIds, groupName }
            }),
            invalidatesTags: ["Chat"]
        }),

        joinGroupChat: builder.mutation({
            query: ({ groupId }) => ({
                url: `/chats/group/${groupId}/join`,
                method: "POST"
            }),
            invalidatesTags: ["Chat"]
        }),

        deleteChat: builder.mutation({
            query: ({ chatId }) => ({
                url: `/chats/${chatId}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Chat"]
        }),

        initializeUserEncryption: builder.mutation({
            query: ({ password }) => ({
                url: "/chats/encryption/init",
                method: "POST",
                body: { password }
            })
        }),

        sendMoneyInChat: builder.mutation({
            query: ({ chatId, data }) => ({
                url: `/chats/${chatId}/send-money`,
                method: "POST",
                body: data
            }),
            invalidatesTags: (result, error, { chatId }) => [
                { type: "ChatMessage", id: chatId }
            ]
        }),

        getUserWalletBalance: builder.query({
            query: ({ userId }) => `/transactions/user/${userId}/wallet`,
            providesTags: ["Wallet"]
        }),

        downloadTransactionReceipt: builder.mutation({
            query: ({ transactionId }) => ({
                url: `/transactions/receipt/${transactionId}`,
                method: "GET",
                responseHandler: async (response: Response) => {
                    return await response.blob();
                }
            })
        })
    }),
});

export const {
    useGetUserChatsQuery,
    useGetChatMessagesQuery,
    useCreateOrGetDMChatMutation,
    useSendMessageMutation,
    useMarkMessagesAsReadMutation,
    useGetChatParticipantsStatusQuery,
    useCreateGroupChatMutation,
    useJoinGroupChatMutation,
    useDeleteChatMutation,
    useInitializeUserEncryptionMutation,
    useSendMoneyInChatMutation,
    useGetUserWalletBalanceQuery,
    useDownloadTransactionReceiptMutation
} = chatSlice;