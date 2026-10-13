import { apiSlice } from "@/states/apiSlice";

// Mutations invalidate the whole "Bills" tag on purpose: a payment changes both the bill
// detail and every list that shows its progress.
export const billSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMyBills: builder.query({
            query: () => `/bills`,
            providesTags: ["Bills"],
        }),

        getBillById: builder.query({
            query: (billId: string) => `/bills/${billId}`,
            providesTags: (result, error, billId) => [{ type: "Bills", id: billId }],
        }),

        createBill: builder.mutation({
            query: (body: {
                recipientUserId?: string
                recipientOrganizationId?: string
                totalAmount: number
                title?: string
                note?: string
                shares: { payerId: string; amount: number }[]
            }) => ({
                url: `/bills`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Bills"],
        }),

        payBillShare: builder.mutation({
            query: ({ billId, shareId, pin }) => ({
                url: `/bills/${billId}/shares/${shareId}/pay`,
                method: "POST",
                body: { pin },
            }),
            invalidatesTags: ["Bills"],
        }),

        declineBillShare: builder.mutation({
            query: ({ billId, shareId, note }) => ({
                url: `/bills/${billId}/shares/${shareId}/decline`,
                method: "POST",
                body: { note },
            }),
            invalidatesTags: ["Bills"],
        }),

        coverBillShare: builder.mutation({
            query: ({ billId, shareId, pin, requestReimbursement }) => ({
                url: `/bills/${billId}/shares/${shareId}/cover`,
                method: "POST",
                body: { pin, requestReimbursement },
            }),
            invalidatesTags: ["Bills"],
        }),

        reassignBillShare: builder.mutation({
            query: ({ billId, shareId, newPayerId }) => ({
                url: `/bills/${billId}/shares/${shareId}/reassign`,
                method: "POST",
                body: { newPayerId },
            }),
            invalidatesTags: ["Bills"],
        }),

        closeBillShare: builder.mutation({
            query: ({ billId, shareId }) => ({
                url: `/bills/${billId}/shares/${shareId}/close`,
                method: "POST",
            }),
            invalidatesTags: ["Bills"],
        }),

        remindBillShare: builder.mutation({
            query: ({ billId, shareId }) => ({
                url: `/bills/${billId}/shares/${shareId}/remind`,
                method: "POST",
            }),
        }),

        cancelBill: builder.mutation({
            query: (billId: string) => ({
                url: `/bills/${billId}/cancel`,
                method: "POST",
            }),
            invalidatesTags: ["Bills"],
        }),
    }),
});

export const {
    useGetMyBillsQuery,
    useGetBillByIdQuery,
    useCreateBillMutation,
    usePayBillShareMutation,
    useDeclineBillShareMutation,
    useCoverBillShareMutation,
    useReassignBillShareMutation,
    useCloseBillShareMutation,
    useRemindBillShareMutation,
    useCancelBillMutation,
} = billSlice;
