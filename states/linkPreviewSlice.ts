import { apiSlice } from "./apiSlice";

export interface LinkPreviewData {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    domain: string;
    favicon: string | null;
    fallback?: boolean;
}

export const linkPreviewSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getLinkPreview: builder.query<LinkPreviewData, string>({
            query: (url) => `/link-preview?url=${encodeURIComponent(url)}`,
            // Cache preview data for 1 hour — external metadata rarely changes
            keepUnusedDataFor: 3600,
        }),
    }),
    overrideExisting: false,
});

export const { useGetLinkPreviewQuery } = linkPreviewSlice;
