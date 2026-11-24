import { apiSlice } from "@/states/apiSlice";
import type { TopUp, TopUpOptions, TopUpProviderKey } from "@/types/topUp.types";

export const topUpSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTopUpOptions: builder.query<TopUpOptions, void>({
            query: () => "/topups/options",
            transformResponse: (response: { data: TopUpOptions }) => response.data,
        }),

        createTopUp: builder.mutation<
            { message: string; data: TopUp },
            { amount: number; provider: TopUpProviderKey; phoneNumber: string; note?: string }
        >({
            query: (body) => ({ url: "/topups", method: "POST", body }),
            invalidatesTags: ["TopUp"],
        }),

        getTopUp: builder.query<TopUp, string>({
            query: (id) => `/topups/${id}`,
            transformResponse: (response: { data: TopUp }) => response.data,
            providesTags: (result, error, id) => [{ type: "TopUp", id }],
        }),

        getMyTopUps: builder.query<
            { topUps: TopUp[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
            { page?: number; limit?: number } | void
        >({
            query: (params) => `/topups?page=${params?.page ?? 1}&limit=${params?.limit ?? 20}`,
            transformResponse: (response: { data: any }) => response.data,
            providesTags: ["TopUp"],
        }),

        // Simulation only: settle a pending simulated top-up right away.
        simulateTopUp: builder.mutation<{ data: TopUp }, { id: string; outcome: "successful" | "failed" }>({
            query: ({ id, outcome }) => ({ url: `/topups/${id}/simulate`, method: "POST", body: { outcome } }),
            invalidatesTags: (result, error, { id }) => ["TopUp", { type: "TopUp", id }, "Wallet"],
        }),
    }),
});

export const {
    useGetTopUpOptionsQuery,
    useCreateTopUpMutation,
    useGetTopUpQuery,
    useGetMyTopUpsQuery,
    useSimulateTopUpMutation,
} = topUpSlice;
