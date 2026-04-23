"use client"
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface UserAvatarProps {
    profileImage?: string | null;
    firstName?: string;
    lastName?: string;
    className?: string;
    fallbackClassName?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    width?: number;
    height?: number;
    userType?: 'user' | 'organization'; // Add userType prop
    userId?: string;
    disableClick?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    profileImage,
    firstName = '?',
    lastName = '?',
    className,
    fallbackClassName,
    userType,
    userId,
    disableClick = false,
}) => {
    const router = useRouter();
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

    // Determine border color based on userType
    const borderClass = userType === 'organization'
        ? 'border-2 border-blue-500'
        : userType === 'user'
            ? 'border-2 border-green-500'
            : '';

    return (
        <Avatar 
            className={cn(borderClass, className, userId && !disableClick && 'cursor-pointer hover:opacity-80 transition-opacity')}
            onClick={(e) => {
                if (userId && !disableClick) {
                    e.stopPropagation();
                    router.push(`/profile/${userId}`);
                }
            }}
        >
            <AvatarImage src={profileImage || undefined} alt={`${firstName} ${lastName}`} />
            <AvatarFallback className={fallbackClassName}>{initials || '??'}</AvatarFallback>
        </Avatar>
    );
};
