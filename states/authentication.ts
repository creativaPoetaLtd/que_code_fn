
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
                url: '/auth/register',
                method: 'POST',
                body: userData,
            })
        })
    }),
    overrideExisting: false,
});


export const { useLoginMutation, useRegisterUserMutation } = authenticationSlice;
