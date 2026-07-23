import { CreateGroupRequest, Group, GroupMembersResponse, InviteToGroupRequest, JoinGroupByLinkRequest, JoinGroupRequest } from "@/types/group.types";
import { apiSlice } from "./apiSlice";

export const groupSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createGroup: builder.mutation<{ message: string; data: Group }, { groupData: CreateGroupRequest | FormData; token: string }>({
            query: ({ groupData, token }) => {
                // Check if groupData is FormData (for file uploads) or regular object
                const isFormData = groupData instanceof FormData;
                return {
                    url: "/groups",
                    method: "POST",
                    body: groupData,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // Don't set Content-Type for FormData, let browser set it with boundary
                        ...(isFormData ? {} : {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        }),
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

        inviteToGroup: builder.mutation<{ message: string; data: { successful: any[]; failed: any[]; totalInvited: number } }, { inviteData: InviteToGroupRequest; token: string }>({
            query: ({ inviteData, token }) => {
                const requestBody = {
                    groupId: inviteData.groupId,
                    memberIds: inviteData.memberIds
                }
                return {
                    url: "/groups/invite",
                    method: "POST",
                    body: requestBody,
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            },
            invalidatesTags: (result, error, { inviteData }) => [{ type: "Group", id: inviteData.groupId }, "GroupMember"],
        }),

        getGroupMembers: builder.query<{ data: GroupMembersResponse }, { groupId: string; token: string }>({
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
            { groupId: string; requestId: string; action: "approve" | "decline"; token: string }
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

        // Enhanced invitation endpoints
        getPendingInvitations: builder.query<
            { data: { invitations: any[]; total: number } },
            string
        >({
            query: (token: string) => ({
                url: "/groups/invitations/pending",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
            providesTags: ["GroupInvitation"],
        }),

        getPendingJoinRequests: builder.query<
            { data: { requests: any[]; total: number } },
            string
        >({
            query: (token: string) => ({
                url: "/groups/requests/pending",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
            providesTags: ["GroupJoinRequest"],
        }),

        respondToJoinRequestEnhanced: builder.mutation<
            { message: string; data: any },
            { requestId: string; action: 'approve' | 'deny'; rejectionReason?: string; token: string }
        >({
            query: ({ requestId, action, rejectionReason, token }) => ({
                url: `/groups/requests/${requestId}/respond`,
                method: "POST",
                body: { action, rejectionReason },
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }),
            invalidatesTags: ["GroupJoinRequest", "Group", "GroupMember"],
        }),

        bulkRespondToJoinRequests: builder.mutation<
            { message: string; data: any },
            { requestIds: string[]; action: 'approve' | 'deny'; rejectionReason?: string; token: string }
        >({
            query: ({ requestIds, action, rejectionReason, token }) => ({
                url: "/groups/requests/bulk-respond",
                method: "POST",
                body: { requestIds, action, rejectionReason },
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }),
            invalidatesTags: ["GroupJoinRequest", "Group", "GroupMember"],
        }),

        // @mention autocomplete — search active members by partial name/username
        searchGroupMembers: builder.query<
            { data: Array<{ userId: string; username: string; name: string; avatar: string | null }> },
            { groupId: string; q: string; token: string }
        >({
            query: ({ groupId, q, token }) => ({
                url:     `/groups/${groupId}/members/search?q=${encodeURIComponent(q)}&limit=10`,
                headers: { Authorization: `Bearer ${token}` },
            }),
            // Cache per groupId+query for 30 seconds — members list rarely changes mid-session
            keepUnusedDataFor: 30,
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
    // Enhanced invitation hooks
    useGetPendingInvitationsQuery,
    useGetPendingJoinRequestsQuery,
    useRespondToJoinRequestEnhancedMutation,
    useBulkRespondToJoinRequestsMutation,
    useSearchGroupMembersQuery,
} = groupSlice