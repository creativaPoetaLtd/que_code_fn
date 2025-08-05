import { apiSlice } from "@/states/apiSlice";

export const contactSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
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
        getAcceptedContacts: builder.query({
            query: (token: string) => {

                return {
                    url: '/contacts/accepted',
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                };
            },
        }),
    }),
    overrideExisting: false,
});

export const {
    useInviteContactMutation,
    useRespondToInvitationMutation,
    useGetContactsQuery,
    useGetPendingInvitationsQuery,
    useGetAcceptedContactsQuery,
} = contactSlice;
