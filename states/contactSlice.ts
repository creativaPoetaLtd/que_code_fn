import { apiSlice } from "@/states/apiSlice";

export const contactSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getContacts: builder.query({
      query: (token: string) => ({
        url: "/contacts",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Contact"],
    }),
    getAcceptedContacts: builder.query({
      query: (token: string) => ({
        url: "/contacts",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (response: any) => {
        // Filter only accepted/active contacts
        const contacts = response.data || response;
        return {
          data: contacts.filter((contact: any) => contact.status === "active"),
        };
      },
      providesTags: ["Contact"],
    }),
    removeContact: builder.mutation({
      query: ({ contactUserId, token }) => ({
        url: `/contacts/${contactUserId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["Contact", "User"],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useGetAcceptedContactsQuery,
  useRemoveContactMutation,
} = contactSlice;
