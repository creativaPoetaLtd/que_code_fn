
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
        verifyOtp: builder.mutation({
            query: (data) => ({
                url: '/users/verify-otp',
                method: 'POST',
                body: data,
            }),
        }),
        resendOtp: builder.mutation({
            query: (data) => ({
                url: '/users/resend-otp',
                method: 'POST',
                body: data,
            }),
        }),
    }),
    overrideExisting: false,
});


export const {
    useLoginMutation,
    useRegisterUserMutation,
    useVerifyOtpMutation,
    useResendOtpMutation
} = authenticationSlice;
