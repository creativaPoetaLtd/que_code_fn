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
    const { isTokenValid, checkTokenExpiration } = useAuthToken(true); // Enable auto-redirect
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check token expiration first
                checkTokenExpiration();
                
                // Then check if token is valid
                const valid = isTokenValid();
                
                if (!valid) {
                    console.log('No valid token found, redirecting to login');
                    router.push(redirectTo);
                    return;
                }
                
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Authentication check failed:', error);
                router.push(redirectTo);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [isTokenValid, checkTokenExpiration, router, redirectTo]);

    if (isChecking) {
        return <>{fallback}</>;
    }

    if (!isAuthenticated) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};