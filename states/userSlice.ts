import { apiSlice } from "@/states/apiSlice";

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profileType: 'user' | 'organization';
    profile?: {
        profileImage?: string;
        bio?: string;
    };
}

export const userSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Get user by ID
        getUserById: builder.query<UserProfile, { userId: string; token: string }>({
            query: ({ userId, token }) => ({
                url: `/users/${userId}`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
            providesTags: (result, error, arg) => [{ type: 'User', id: arg.userId }],
        }),

        // Get user profile info for QR scanning (try both user and organization endpoints)
        getUserProfileForTransfer: builder.query<{
            user: UserProfile | null;
            isOrganization: boolean;
            name: string;
            avatar?: string;
            type: 'user' | 'organization';
        }, { userId: string; token: string }>({
            queryFn: async ({ userId, token }, _queryApi, _extraOptions, fetchWithBQ) => {
                // Try user endpoint first
                try {
                    const userResult = await fetchWithBQ({
                        url: `/users/${userId}`,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (userResult.data) {
                        const userData = userResult.data as UserProfile;
                        return {
                            data: {
                                user: userData,
                                isOrganization: false,
                                name: `${userData.firstName} ${userData.lastName}`.trim(),
                                avatar: userData.profile?.profileImage,
                                type: 'user' as const,
                            }
                        };
                    }
                } catch (userError) {
                    // If user not found, try organization endpoint
                    try {
                        const orgResult = await fetchWithBQ({
                            url: `/organizations/${userId}`,
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });

                        if (orgResult.data) {
                            const orgData = orgResult.data as any;
                            return {
                                data: {
                                    user: null,
                                    isOrganization: true,
                                    name: orgData.name || orgData.organizationName || 'Organization',
                                    avatar: orgData.profileImage,
                                    type: 'organization' as const,
                                }
                            };
                        }
                    } catch (orgError) {
                        return {
                            error: {
                                status: 404,
                                data: { message: 'User or organization not found' }
                            }
                        };
                    }
                }

                return {
                    error: {
                        status: 404,
                        data: { message: 'User or organization not found' }
                    }
                };
            },
            providesTags: (result, error, arg) => [{ type: 'User', id: arg.userId }],
        }),
    }),
});

export const {
    useGetUserByIdQuery,
    useGetUserProfileForTransferQuery,
    useLazyGetUserProfileForTransferQuery,
} = userSlice;