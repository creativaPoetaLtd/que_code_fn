
import { apiSlice } from "@/states/apiSlice";

export const authenticationSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        loginOrganization: builder.mutation({
            query: (credentials) => ({
                url: '/organizations/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        registerUser: builder.mutation({
            query: (userData) => ({
                url: '/users/register',
                method: 'POST',
                body: userData,
                headers: {
                    Accept: 'application/json',
                }
            })
        }),
        registerOrganization: builder.mutation({
            query: (data) => ({
                url: '/organizations',
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }
            })
        }),
        verifyOtp: builder.mutation({
            query: (data) => ({
                url: '/users/verify',
                method: 'POST',
                body: data,
            }),
        }),
        resendOtp: builder.mutation({
            query: (data) => ({
                url: '/users/resend-verification',
                method: 'POST',
                body: data,
            }),
        }),
        verifyOrganization: builder.query({
            query: (token) => ({
                url: `/organizations/verify?token=${token}`,
                method: 'GET',
            }),
        }),
        getOrganizationCategories: builder.query({
            query: () => ({
                url: '/organization-categories',
                method: 'GET',
            }),
        }),

    }),
    overrideExisting: false,
});


export const {
    useLoginMutation,
    useLoginOrganizationMutation,
    useRegisterUserMutation,
    useRegisterOrganizationMutation,
    useVerifyOtpMutation,
    useResendOtpMutation,
    useVerifyOrganizationQuery,
    useGetOrganizationCategoriesQuery
} = authenticationSlice;
