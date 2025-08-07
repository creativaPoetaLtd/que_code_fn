export interface CreateGroupRequest {
    name: string
    description?: string
    picture?: string
    isPrivate?: boolean
    maxMembers?: number
    memberIds?: string[]
}

export interface Group {
    id: string
    name: string
    description?: string
    picture?: string
    ownerId: string
    ownerName?: string
    qrCode?: string
    accessLink: string
    isPrivate: boolean
    maxMembers: number
    memberCount: number
    createdAt: string
    updatedAt: string
    userRole?: "owner" | "admin" | "member" | "pending" | "none"
    userStatus: string
    userHasPendingRequest?: boolean
    pendingRequestsCount?: number
}

export interface JoinGroupRequest {
    groupId: string
}

export interface InviteToGroupRequest {
    groupId: string
    memberPublicIds: string[]
}

export interface GroupJoinRequest {
    id: string
    userId: string
    userName: string
    userEmail: string
    userPublicId: string
    userPicture?: string
    requestedAt: string
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
    qrCodeData?: string // This will contain the full URL from the QR code
}