import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthToken } from './use-auth-token';
import { decodeJWT, isTokenExpired } from '@/utils/jwtUtils';

interface UseTokenExpirationOptions {
    enabled?: boolean;
    checkInterval?: number; // in milliseconds
    warningThreshold?: number; // in seconds before expiration to show warning
    onTokenExpired?: () => void;
    onTokenWarning?: (timeLeft: number) => void;
    redirectPath?: string;
}

export const useTokenExpiration = (options: UseTokenExpirationOptions = {}) => {
    const {
        enabled = true,
        checkInterval = 30000, // 30 seconds
        warningThreshold = 300, // 5 minutes
        onTokenExpired,
        onTokenWarning,
        redirectPath = '/auth/login'
    } = options;

    const router = useRouter();
    const { getToken, removeToken } = useAuthToken(false); // Disable auto-redirect in base hook
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRedirectingRef = useRef(false);
    const lastWarningRef = useRef<number>(0);

    const handleTokenExpired = () => {
        if (isRedirectingRef.current) return;

        isRedirectingRef.current = true;
        console.log('Token expired, cleaning up and redirecting...');

        // Clear token
        removeToken();

        // Call custom callback if provided
        if (onTokenExpired) {
            onTokenExpired();
        }

        // Redirect to login
        router.push(redirectPath);

        // Reset redirect flag
        setTimeout(() => {
            isRedirectingRef.current = false;
        }, 1000);
    };

    const shouldWarnUser = (timeLeft: number): boolean => {
        if (timeLeft > warningThreshold || timeLeft <= 0) return false;

        const now = Date.now();
        const shouldWarn = now - lastWarningRef.current > 60000; // Only warn once per minute

        if (shouldWarn) {
            lastWarningRef.current = now;
        }

        return shouldWarn;
    };

    const checkTokenWarning = (token: string) => {
        const payload = decodeJWT(token);
        if (!payload?.exp) return;

        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = payload.exp - currentTime;

        if (shouldWarnUser(timeLeft)) {
            console.warn(`Token expires in ${Math.floor(timeLeft / 60)} minutes`);
            onTokenWarning?.(timeLeft);
        }
    };

    const checkToken = () => {
        if (!enabled || typeof window === 'undefined') return;

        const token = getToken();
        if (!token) return;

        if (isTokenExpired(token)) {
            console.warn('Token has expired');
            handleTokenExpired();
            return;
        }

        checkTokenWarning(token);
    };

    useEffect(() => {
        if (!enabled) return;

        // Initial check
        checkToken();

        // Set up periodic checking
        intervalRef.current = setInterval(checkToken, checkInterval);

        // Check when tab becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkToken();
            }
        };

        // Check when window gains focus
        const handleFocus = () => {
            checkToken();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [enabled, checkInterval]);

    return {
        checkToken,
        isTokenExpired: () => {
            const token = getToken();
            return !token || isTokenExpired(token);
        }
    };
};
