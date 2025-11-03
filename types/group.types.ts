export interface CreateGroupRequest {
    name: string
    description?: string
    picture?: string
    isPrivate?: boolean
    privacyType?: 'private' | 'public' | 'require_approval'
    maxMembers?: number
    memberIds?: string[]
    adminId?: string
    hasFundraising?: boolean
    fundraisingTarget?: number
    expirationDate?: string
    expirationType?: 'custom_date' | 'target_reached' | 'deadline_reached' | 'never'
    hasAdditionalInfo?: boolean
    additionalInfoPrompt?: string
}

export interface Group {
    id: string
    name: string
    description?: string
    picture?: string
    profilePictureUrl?: string
    ownerId: string
    adminId?: string
    ownerName?: string
    qrCode?: string
    accessLink: string
    isPrivate: boolean
    privacyType: 'private' | 'public' | 'require_approval'
    maxMembers: number
    memberCount: number
    hasFundraising: boolean
    fundraisingTarget?: number
    fundraisingCurrentAmount: number
    expirationDate?: string
    expirationType: 'custom_date' | 'target_reached' | 'deadline_reached' | 'never'
    hasAdditionalInfo: boolean
    additionalInfoPrompt?: string
    createdAt: string
    updatedAt: string
    userRole?: "owner" | "admin" | "member" | "pending" | "none"
    userStatus: string
    userHasPendingRequest?: boolean
    pendingRequestsCount?: number
}

export interface JoinGroupRequest {
    groupId: string
    additionalInfo?: string
}

export interface InviteToGroupRequest {
    groupId: string
    memberPublicIds: string[]
    invitationMessage?: string
}

export interface GroupJoinRequest {
    id: string
    userId: string
    userName: string
    userEmail: string
    userPublicId: string
    userPicture?: string
    requestedAt: string
    groupId: string
    additionalInfo?: string
    group: {
        id: string
        name: string
        description?: string
        profilePictureUrl?: string
    }
    user: {
        id: string
        name: string
        email: string
    }
}

export interface GroupInvitation {
    id: string
    groupId: string
    invitedAt: string
    invitationMessage?: string
    group: {
        id: string
        name: string
        description?: string
        profilePictureUrl?: string
        hasFundraising: boolean
        fundraisingTarget?: number
        hasAdditionalInfo: boolean
        additionalInfoPrompt?: string
    }
    inviter: {
        id: string
        name: string
        email: string
    }
}

export interface RespondToInvitationRequest {
    response: 'accept' | 'decline'
    additionalInfo?: string
}

export interface RespondToJoinRequestRequest {
    action: 'approve' | 'deny'
    rejectionReason?: string
}

export interface BulkRespondToJoinRequestsRequest {
    requestIds: string[]
    action: 'approve' | 'deny'
    rejectionReason?: string
}

export interface GroupJoinRequestsResponse {
    requests: GroupJoinRequest[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface JoinGroupByLinkRequest {
    accessToken?: string
    qrCodeData?: string
}