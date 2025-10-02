import { apiSlice } from "@/states/apiSlice";

// Types for contact invitation system
export interface ContactInvitation {
  id: number;
  inviterId: number;
  inviteeId: number;
  status: "pending" | "accepted" | "declined" | "expired";
  invitationToken: string;
  invitedAt: string;
  respondedAt?: string;
  expiresAt: string;
  inviter?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  invitee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const contactInvitationSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Send contact invitation using profile URL
    sendInvitation: builder.mutation<
      { message: string; data: ContactInvitation },
      { profileUrl: string; token: string }
    >({
      query: ({ profileUrl, token }) => ({
        url: "/contact-invitations/send",
        method: "POST",
        body: { profileUrl },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      // Invalidate related queries after sending invitation
      invalidatesTags: ["ContactInvitation", "Contact"],
    }),

    // Accept contact invitation
    acceptInvitation: builder.mutation<
      { message: string; data: any },
      { invitationId: number; token: string }
    >({
      query: ({ invitationId, token }) => ({
        url: `/contact-invitations/${invitationId}/accept`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["ContactInvitation", "Contact"],
    }),

    // Decline contact invitation
    declineInvitation: builder.mutation<
      { message: string },
      { invitationId: number; token: string }
    >({
      query: ({ invitationId, token }) => ({
        url: `/contact-invitations/${invitationId}/decline`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["ContactInvitation"],
    }),

    // Generic respond to invitation (for backwards compatibility)
    respondToInvitation: builder.mutation<
      { message: string },
      { invitationId: number; action: "accept" | "decline"; token: string }
    >({
      query: ({ invitationId, action, token }) => ({
        url: `/contact-invitations/${invitationId}/${action}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["ContactInvitation", "Contact"],
    }),

    // Get pending invitations (received)
    getPendingInvitations: builder.query<{ data: ContactInvitation[] }, string>(
      {
        query: (token: string) => ({
          url: "/contact-invitations/pending",
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        providesTags: ["ContactInvitation"],
      }
    ),

    // Get sent invitations
    getSentInvitations: builder.query<{ data: ContactInvitation[] }, string>({
      query: (token: string) => ({
        url: "/contact-invitations/sent",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["ContactInvitation"],
    }),

    // Verify invitation by token (for email links)
    verifyInvitation: builder.query<{ data: ContactInvitation }, string>({
      query: (token: string) => ({
        url: `/contact-invitations/verify/${token}`,
        method: "GET",
      }),
    }),

    // Accept invitation by token (for email links)
    acceptInvitationByToken: builder.mutation<{ message: string }, string>({
      query: (token: string) => ({
        url: `/contact-invitations/accept/${token}`,
        method: "POST",
      }),
      invalidatesTags: ["ContactInvitation", "Contact"],
    }),

    // Decline invitation by token (for email links)
    declineInvitationByToken: builder.mutation<{ message: string }, string>({
      query: (token: string) => ({
        url: `/contact-invitations/decline/${token}`,
        method: "POST",
      }),
      invalidatesTags: ["ContactInvitation"],
    }),
  }),
  overrideExisting: false,
});

// Export hooks for use in components
export const {
  // Invitation mutations
  useSendInvitationMutation,
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useRespondToInvitationMutation,

  // Invitation queries
  useGetPendingInvitationsQuery,
  useGetSentInvitationsQuery,

  // Token-based operations (for email links)
  useVerifyInvitationQuery,
  useAcceptInvitationByTokenMutation,
  useDeclineInvitationByTokenMutation,
} = contactInvitationSlice;
