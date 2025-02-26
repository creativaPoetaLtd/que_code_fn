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