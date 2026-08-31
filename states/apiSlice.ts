import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
    getValidToken,
    handleTokenExpiration,
    refreshAccessToken,
} from "@/utils/tokenUtils";

const baseQueryWithAuth = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers) => {
        const token = getValidToken();
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const requestUrl = typeof args === "string" ? args : args?.url || "";
  const isAuthEndpoint = requestUrl.startsWith("/auth/");

  let result = await baseQueryWithAuth(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (isAuthEndpoint) {
      return result;
    }

    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      result = await baseQueryWithAuth(args, api, extraOptions);

      if (result.error?.status === 401) {
        handleTokenExpiration();
      }
    } else {
      handleTokenExpiration();
    }
  }

  return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Group', 'GroupMember', 'GroupInvitation', 'GroupJoinRequest', 'Notification', 'Contact', 'ContactInvitation', 'User', 'Chat', 'ChatMessage', 'ChatStatus', 'Wallet', 'Escrow', 'Poll', 'SharedNote', 'PinnedMessage'],
    endpoints: () => ({})
})
