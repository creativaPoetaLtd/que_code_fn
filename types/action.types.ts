// types.ts
export interface Action {
    key: number;
    name: string;
    type: string;
    dueDate: string;
    dueTime: string;
}

export interface FormValues {
    name: string;
    actionType: string;
    hasActivities?: boolean;
    activities?: { activity: string }[];
    limitedDuration?: boolean;
    duration?: string;
    isFree?: boolean;
    freeDescription?: string;
    hasAmount?: boolean;
    targetAmount?: number;
}

export interface InviteFormValues {
    email: string;
    phone: string;
    message: string;
}
export interface OrganizationAction {
    id: string;
    organizationId: string;
    type: string;
    name: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    displayLayout?: string;
    coverImage?: string | null;
    shortDescription?: string | null;
    description?: string | null;
    currency?: string;
    pricing?: {
        mode?: string;
        amount?: number;
        [key: string]: any;
    };
    availability?: {
        startsAt?: string | null;
        endsAt?: string | null;
        timezone?: string | null;
        salesWindow?: Record<string, any>;
        [key: string]: any;
    };
    visibility?: {
        mode?: string;
        [key: string]: any;
    };
    buyerFields?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface SubActionSummary {
    id: string;
    actionId: string;
    name: string;
    description?: string | null;
    price: number | string;
    stock?: number | null;
    metadata?: Record<string, any>;
    sortOrder?: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
