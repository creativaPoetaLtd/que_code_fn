import { apiSlice } from "@/states/apiSlice";

// Contact types
export interface Contact {
  id: string;
  userAId: string;
  userBId: string;
  status: "active" | "blocked";
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  tags?: string[];
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    contactType?: "person" | "company";
    profile?: {
      profileImage: string;
    };
  };
}

export interface ContactInvitation {
  id: string;
  inviterId: string;
  inviteeId: string;
  status: "pending" | "accepted" | "declined" | "expired";
  invitationToken: string;
  invitedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  inviter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profile?: {
      profileImage: string;
    };
  };
  invitee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profile?: {
      profileImage: string;
    };
  };
}

export interface ContactInvitationResponse {
  invitations: ContactInvitation[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface SendInvitationRequest {
  inviteeId: string;
  message?: string;
}

export interface SearchUsersResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profile?: {
    profileImage: string;
  };
  relationshipStatus: "none" | "active" | "blocked" | "pending_invitation";
}

export interface ContactStats {
  total: number;
  active: number;
  blocked: number;
}

export const contactSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Legacy endpoints (keeping for backward compatibility)
    inviteContact: builder.mutation({
      query: ({ invitationData, token }) => {
        return {
          url: '/contacts/invite',
          method: 'POST',
          body: invitationData,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          }
        };
      },
    }),
    respondToInvitation: builder.mutation({
      query: ({ contactId, responseData, token }) => {
        return {
          url: `/contacts/respond/${contactId}`,
          method: 'PUT',
          body: responseData,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          }
        };
      },
    }),
    getContacts: builder.query({
      query: (token: string) => {
        return {
          url: '/contacts',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          }
        };
      },
    }),
    getPendingInvitations: builder.query({
      query: (token: string) => {
        return {
          url: '/contacts/pending',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          }
        };
      },
    }),
    getAcceptedContacts: builder.query<
      { contacts: Contact[]; totalCount: number; pagination: { page: number; limit: number; totalPages: number } },
      string
    >({
      query: (token: string) => ({
        url: '/contacts/accepted',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    }),

    // New enhanced contact endpoints
    getContactsEnhanced: builder.query<
      { contacts: Contact[]; totalCount: number },
      { status?: "active" | "blocked"; page?: number; limit?: number; token: string }
    >({
      query: ({ status, page = 1, limit = 20, token }) => ({
        url: "/contacts",
        params: { status, page, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Contact"],
    }),

    getContactById: builder.query<Contact, { contactId: string; token: string }>({
      query: ({ contactId, token }) => ({
        url: `/contacts/${contactId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: (result, error, { contactId }) => [
        { type: "Contact", id: contactId },
      ],
    }),

    updateContactStatus: builder.mutation<
      Contact,
      { contactId: string; status: "active" | "blocked"; token: string }
    >({
      query: ({ contactId, status, token }) => ({
        url: `/contacts/${contactId}`,
        method: "PUT",
        body: { status },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["Contact"],
    }),

    removeContact: builder.mutation<
      { message: string },
      { contactId: string; token: string }
    >({
      query: ({ contactId, token }) => ({
        url: `/contacts/${contactId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["Contact"],
    }),

    searchUsers: builder.query<
      SearchUsersResponse[],
      { query: string; limit?: number; token: string }
    >({
      query: ({ query, limit = 10, token }) => ({
        url: "/contacts/search",
        params: { query, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["User"],
    }),

    getContactStats: builder.query<ContactStats, { token: string }>({
      query: ({ token }) => ({
        url: "/contacts/stats",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Contact"],
    }),

    // Contact invitation endpoints
    sendContactInvitation: builder.mutation<
      { message: string; data: ContactInvitation & { invitationUrl: string } },
      SendInvitationRequest & { token: string }
    >({
      query: ({ token, ...body }) => ({
        url: "/contact-invitations",
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["ContactInvitation"],
    }),

    // Send contact invitation by public ID (for QR code scans)
    sendContactInvitationByPublicId: builder.mutation<
      { message: string; data: ContactInvitation & { invitationUrl: string; inviteeName: string } },
      { publicId: string; message?: string; token: string }
    >({
      query: ({ token, ...body }) => ({
        url: "/contact-invitations/by-public-id",
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["ContactInvitation"],
    }),

    // Use the unified /contacts/pending route for pending invitations
    getPendingInvitationsUnified: builder.query<
      {
        invitations: ContactInvitation[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      },
      { page?: number; limit?: number; token: string }
    >({
      query: ({ page = 1, limit = 20, token }) => ({
        url: "/contacts/pending",
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["ContactInvitation"],
    }),

    // Use the unified /contacts/sent route for sent invitations
    getSentInvitationsUnified: builder.query<
      {
        invitations: ContactInvitation[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      },
      { page?: number; limit?: number; status?: "pending" | "accepted" | "declined" | "expired"; token: string }
    >({
      query: ({ page = 1, limit = 20, status, token }) => ({
        url: "/contacts/sent",
        params: { page, limit, status },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["ContactInvitation"],
    }),

    respondToInvitationEnhanced: builder.mutation<
      { message: string; contactCreated: boolean; invitation: ContactInvitation },
      { invitationId: string; action: "accept" | "decline"; token: string }
    >({
      query: ({ invitationId, action, token }) => ({
        url: `/contact-invitations/${invitationId}/respond`,
        method: "POST",
        body: { action },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["ContactInvitation", "Contact"],
    }),

    respondToInvitationByToken: builder.mutation<
      { message: string; contactCreated: boolean; invitation: ContactInvitation },
      { token: string; action: "accept" | "decline"; userId?: string }
    >({
      query: ({ token, action, userId }) => ({
        url: `/contact-invitations/token/${token}/respond`,
        method: "POST",
        body: { action, userId },
      }),
      invalidatesTags: ["ContactInvitation", "Contact"],
    }),

    cancelInvitation: builder.mutation<
      { message: string },
      { invitationId: string; token: string }
    >({
      query: ({ invitationId, token }) => ({
        url: `/contact-invitations/${invitationId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["ContactInvitation"],
    }),

    getInvitationByToken: builder.query<
      {
        invitation: ContactInvitation;
        isExpired: boolean;
        canRespond: boolean;
      },
      string
    >({
      query: (token) => `/contact-invitations/token/${token}`,
      providesTags: (result, error, token) => [
        { type: "ContactInvitation", id: token },
      ],
    }),

    // Enhanced pending invitations for notification purposes (using unified route)
    getPendingInvitationsEnhanced: builder.query<ContactInvitation[], { token: string }>({
      query: ({ token }) => ({
        url: "/contacts/pending",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (response: {
        invitations: ContactInvitation[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      }) => response.invitations,
      providesTags: ["ContactInvitation"],
    }),

    toggleContactFavorite: builder.mutation<
      { message: string; data: Contact },
      { contactId: string; token: string }
    >({
      query: ({ contactId, token }) => ({
        url: `/contacts/${contactId}/favorite`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: (result, error, { contactId }) => [
        { type: "Contact", id: contactId },
        "Contact",
      ],
    }),

    manageContactTags: builder.mutation<
      { message: string; data: Contact },
      { contactId: string; tags: string[]; action: "add" | "remove" | "set"; token: string }
    >({
      query: ({ contactId, tags, action, token }) => ({
        url: `/contacts/${contactId}/tags`,
        method: "PUT",
        body: { tags, action },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: (result, error, { contactId }) => [
        { type: "Contact", id: contactId },
        "Contact",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  // Legacy hooks (keeping for backward compatibility)
  useInviteContactMutation,
  useRespondToInvitationMutation,
  useGetContactsQuery,
  useGetPendingInvitationsQuery,
  useGetAcceptedContactsQuery,

  // Enhanced contact hooks
  useGetContactsEnhancedQuery,
  useGetContactByIdQuery,
  useUpdateContactStatusMutation,
  useRemoveContactMutation,
  useSearchUsersQuery,
  useGetContactStatsQuery,

  // Contact invitation hooks
  useSendContactInvitationMutation,
  useSendContactInvitationByPublicIdMutation,
  useGetPendingInvitationsUnifiedQuery,
  useGetSentInvitationsUnifiedQuery,
  useRespondToInvitationEnhancedMutation,
  useRespondToInvitationByTokenMutation,
  useCancelInvitationMutation,
  useGetInvitationByTokenQuery,
  useGetPendingInvitationsEnhancedQuery,
  useToggleContactFavoriteMutation,
  useManageContactTagsMutation,
} = contactSlice;
