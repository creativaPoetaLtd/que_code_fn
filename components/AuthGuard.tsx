'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthToken } from '@/hooks/use-auth-token';

interface AuthGuardProps {
    children: ReactNode;
    redirectTo?: string;
    fallback?: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    redirectTo = '/auth/login',
    fallback = <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
}) => {
    const router = useRouter();
    const { isTokenValid, checkTokenExpiration, forceValidateToken } = useAuthToken(true); // Enable auto-redirect
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Force validate token with expiration check
                const isValid = forceValidateToken();
                
                if (!isValid) {
                    const currentUrl = window.location.pathname + window.location.search;
                    router.push(`${redirectTo}?returnUrl=${encodeURIComponent(currentUrl)}`);
                    return;
                }
                
                setIsAuthenticated(true);
            } catch (error) {
                const currentUrl = window.location.pathname + window.location.search;
                router.push(`${redirectTo}?returnUrl=${encodeURIComponent(currentUrl)}`);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [forceValidateToken, router, redirectTo]);

    if (isChecking) {
        return <>{fallback}</>;
    }

    if (!isAuthenticated) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};