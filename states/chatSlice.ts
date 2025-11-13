import { apiSlice } from "@/states/apiSlice";

// Chat API endpoints
export const chatSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Get user's chats
        getUserChats: builder.query({
            query: () => "/chats",
            providesTags: ["Chat"]
        }),

        // Get chat messages
        getChatMessages: builder.query({
            query: ({ chatId, page = 1, limit = 50 }) => 
                `/chats/${chatId}/messages?page=${page}&limit=${limit}`,
            providesTags: (result, error, { chatId }) => [
                { type: "ChatMessage", id: chatId }
            ]
        }),

        // Create or get DM chat
        createOrGetDMChat: builder.mutation({
            query: ({ participantId }) => ({
                url: "/chats/dm",
                method: "POST",
                body: { participantId }
            }),
            invalidatesTags: ["Chat"]
        }),

        // Send message (HTTP fallback)
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

        // Get chat participants status
        getChatParticipantsStatus: builder.query({
            query: ({ chatId }) => `/chats/${chatId}/participants/status`,
            providesTags: (result, error, { chatId }) => [
                { type: "ChatStatus", id: chatId }
            ]
        }),

        // Create group chat
        createGroupChat: builder.mutation({
            query: ({ participantIds, groupName }) => ({
                url: "/chats/group",
                method: "POST",
                body: { participantIds, groupName }
            }),
            invalidatesTags: ["Chat"]
        }),

        // Delete chat
        deleteChat: builder.mutation({
            query: ({ chatId }) => ({
                url: `/chats/${chatId}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Chat"]
        }),

        // Initialize user encryption
        initializeUserEncryption: builder.mutation({
            query: ({ password }) => ({
                url: "/chats/encryption/init",
                method: "POST",
                body: { password }
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
    useDeleteChatMutation,
    useInitializeUserEncryptionMutation
} = chatSlice;