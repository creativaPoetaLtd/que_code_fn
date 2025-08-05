import { NotificationResponse } from "@/types/notification.types"
import { apiSlice } from "@/states/apiSlice"

export const notificationSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query<NotificationResponse, { token: string }>({
            query: ({ token }) => ({
                url: "/notifications",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
            providesTags: ["Notification"],
        }),
        markNotificationRead: builder.mutation<{ message: string }, { notificationId: string; token: string }>({
            query: ({ notificationId, token }) => ({
                url: `/notifications/${notificationId}/read`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
            invalidatesTags: ["Notification"],
        }),
    }),
    overrideExisting: false,
})

export const {
    useGetNotificationsQuery,
    useMarkNotificationReadMutation,
} = notificationSlice
