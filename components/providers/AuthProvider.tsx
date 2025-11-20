'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTokenExpiration } from '@/hooks/use-token-expiration';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
    checkTokenExpiration: () => void;
    isTokenExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
    enableAutoRedirect?: boolean;
    checkInterval?: number;
    warningThreshold?: number;
    redirectPath?: string;
    showToastWarnings?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
    children,
    enableAutoRedirect = true,
    checkInterval = 30000, // 30 seconds
    warningThreshold = 300, // 5 minutes
    redirectPath = '/auth/login',
    showToastWarnings = true,
}) => {
    const { checkToken, isTokenExpired } = useTokenExpiration({
        enabled: enableAutoRedirect,
        checkInterval,
        warningThreshold,
        redirectPath,
        onTokenExpired: () => {
            if (showToastWarnings) {
                toast({
                    title: "Session Expired",
                    description: "Your session has expired. Please log in again.",
                    variant: "destructive",
                });
            }
        },
        onTokenWarning: (timeLeft: number) => {
            if (showToastWarnings) {
                const minutes = Math.floor(timeLeft / 60);
                toast({
                    title: "Session Expiring Soon",
                    description: `Your session will expire in ${minutes} minute${minutes !== 1 ? 's' : ''}. Save your work.`,
                    variant: "default",
                });
            }
        },
    });

    const contextValue: AuthContextType = {
        checkTokenExpiration: checkToken,
        isTokenExpired,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};