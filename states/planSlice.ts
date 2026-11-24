import { apiSlice } from "@/states/apiSlice";
import type { AccountTier, MyPlan, PlanCatalogue, PlanChangeResult } from "@/types/plan.types";

export const planSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPlans: builder.query<PlanCatalogue, void>({
            query: () => "/plans",
            transformResponse: (response: { data: PlanCatalogue }) => response.data,
        }),

        getMyPlan: builder.query<MyPlan, void>({
            query: () => "/plans/me",
            transformResponse: (response: { data: MyPlan }) => response.data,
            providesTags: ["Plan"],
        }),

        changeMyPlan: builder.mutation<
            { message: string; data: PlanChangeResult },
            { tier: AccountTier; pin?: string }
        >({
            query: (body) => ({ url: "/plans/me/change", method: "POST", body }),
            invalidatesTags: ["Plan", "Wallet"],
        }),

        cancelMyPlan: builder.mutation<{ message: string }, void>({
            query: () => ({ url: "/plans/me/cancel", method: "POST", body: {} }),
            invalidatesTags: ["Plan"],
        }),

        // Organizations: ask QC for the NPO (non-profit) account type.
        requestNpo: builder.mutation<{ message: string }, { note: string }>({
            query: (body) => ({ url: "/plans/me/npo-request", method: "POST", body }),
            invalidatesTags: ["Plan"],
        }),

        cancelNpoRequest: builder.mutation<{ message: string }, void>({
            query: () => ({ url: "/plans/me/npo-request", method: "DELETE" }),
            invalidatesTags: ["Plan"],
        }),
    }),
});

export const {
    useGetPlansQuery,
    useGetMyPlanQuery,
    useChangeMyPlanMutation,
    useCancelMyPlanMutation,
    useRequestNpoMutation,
    useCancelNpoRequestMutation,
} = planSlice;
