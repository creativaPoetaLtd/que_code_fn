import { CreateGroupRequest, Group, InviteToGroupRequest, JoinGroupByLinkRequest, JoinGroupRequest } from "@/types/group.types";
import { apiSlice } from "./apiSlice";

export const groupSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createGroup: builder.mutation<{ message: string; data: Group }, { groupData: CreateGroupRequest; token: string }>({
            query: ({ groupData, token }) => {
                return {
                    url: "/groups",
                    method: "POST",
                    body: groupData,
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: ["Group"],
        }),

        getGroups: builder.query<{ data: { groups: Group[] } }, string>({
            query: (token: string) => {
                return {
                    url: "/groups",
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            providesTags: ["Group"],
        }),

        getGroupById: builder.query<{ data: Group }, { groupId: string; token: string }>({
            query: ({ groupId, token }) => {
                return {
                    url: `/groups/${groupId}`,
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            providesTags: (result, error, { groupId }) => [{ type: "Group", id: groupId }],
        }),

        joinGroup: builder.mutation<{ message: string; data: Group }, { joinData: JoinGroupRequest; token: string }>({
            query: ({ joinData, token }) => {
                return {
                    url: "/groups/join",
                    method: "POST",
                    body: joinData,
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: ["Group"],
        }),

        inviteToGroup: builder.mutation<{ message: string }, { inviteData: InviteToGroupRequest; token: string }>({
            query: ({ inviteData, token }) => {
                return {
                    url: `/groups/${inviteData.groupId}/invite`,
                    method: "POST",
                    body: { memberIds: inviteData.memberIds },
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: (result, error, { inviteData }) => [{ type: "Group", id: inviteData.groupId }, "GroupMember"],
        }),

        getGroupMembers: builder.query<{ data: any[] }, { groupId: string; token: string }>({
            query: ({ groupId, token }) => {
                return {
                    url: `/groups/${groupId}/members`,
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            providesTags: (result, error, { groupId }) => [{ type: "GroupMember", id: groupId }],
        }),

        updateGroup: builder.mutation<
            { message: string; data: Group },
            { groupId: string; updateData: Partial<CreateGroupRequest>; token: string }
        >({
            query: ({ groupId, updateData, token }) => {
                return {
                    url: `/groups/${groupId}`,
                    method: "PUT",
                    body: updateData,
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: (result, error, { groupId }) => [{ type: "Group", id: groupId }, "Group"],
        }),

        leaveGroup: builder.mutation<{ message: string }, { groupId: string; token: string }>({
            query: ({ groupId, token }) => {
                return {
                    url: `/groups/${groupId}/leave`,
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: (result, error, { groupId }) => [{ type: "Group", id: groupId }, "Group"],
        }),

        deleteGroup: builder.mutation<{ message: string }, { groupId: string; token: string }>({
            query: ({ groupId, token }) => {
                return {
                    url: `/groups/${groupId}`,
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: ["Group"],
        }),
        respondToGroupInvitation: builder.mutation<
            { message: string; data?: any },
            { membershipId: string; responseData: { action: "accept" | "reject" }; token: string }
        >({
            query: ({ membershipId, responseData, token }) => {
                return {
                    url: `/groups/respond/${membershipId}`,
                    method: "POST",
                    body: responseData,
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: ["Group"],
        }),
        requestToJoinGroup: builder.mutation<{ message: string; data?: any }, { groupId: string; token: string }>({
            query: ({ groupId, token }) => {
                return {
                    url: `/groups/${groupId}/requests`,
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: ["Group"],
        }),
        getGroupJoinRequests: builder.query<
            { data: any },
            { groupId: string; token: string; page?: number; limit?: number }
        >({
            query: ({ groupId, token, page = 1, limit = 20 }) => {
                return {
                    url: `/groups/${groupId}/requests?page=${page}&limit=${limit}`,
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            providesTags: (result, error, { groupId }) => [{ type: "Group", id: groupId }, "GroupMember"],
        }),
        respondToJoinRequest: builder.mutation<
            { message: string; data?: any },
            { groupId: string; requestId: string; action: "approve" | "reject"; token: string }
        >({
            query: ({ groupId, requestId, action, token }) => {
                return {
                    url: `/groups/${groupId}/requests/${requestId}/respond`,
                    method: "POST",
                    body: { action },
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: (result, error, { groupId }) => [{ type: "Group", id: groupId }, "GroupMember"],
        }),
        joinGroupByLink: builder.mutation<
            { message: string; data?: any },
            { joinData: JoinGroupByLinkRequest; token: string }
        >({
            query: ({ joinData, token }) => {
                return {
                    url: "/groups/join",
                    method: "POST",
                    body: joinData,
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: ["Group"],
        }),
    }),
    overrideExisting: false,
})

export const {
    useCreateGroupMutation,
    useGetGroupsQuery,
    useGetGroupByIdQuery,
    useJoinGroupMutation,
    useInviteToGroupMutation,
    useGetGroupMembersQuery,
    useUpdateGroupMutation,
    useLeaveGroupMutation,
    useDeleteGroupMutation,
    useRespondToGroupInvitationMutation,
    useRequestToJoinGroupMutation,
    useGetGroupJoinRequestsQuery,
    useRespondToJoinRequestMutation,
    useJoinGroupByLinkMutation,
} = groupSlice