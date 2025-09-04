"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthToken } from '@/hooks/use-auth-token';

const HomePage = () => {
  const router = useRouter();
  const { getToken } = useAuthToken();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  useEffect(() => {
    const redirectToUserHome = () => {
      // Prevent multiple redirects and limit attempts
      if (isRedirecting || redirectAttempts >= 3) return;
      
      setIsRedirecting(true);
      setRedirectAttempts(prev => prev + 1);
      
      const authToken = getToken();
      
      if (!authToken) {
        router.push('/auth/login');
        return;
      }

      try {
        // Decode token to get logged-in user's ID
        const base64Url = authToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        const loggedInUserId = payload?.userId || payload?.id || payload?.sub;

        if (loggedInUserId) {
          // Check if we're already on the correct page to prevent loops
          const currentPath = window.location.pathname;
          const targetPath = `/home/${loggedInUserId}`;
          
          if (currentPath !== targetPath) {
            router.replace(targetPath);
            
            // Add a fallback redirect after 3 seconds
            setTimeout(() => {
              if (window.location.pathname !== targetPath) {
                window.location.href = targetPath;
              }
            }, 3000);
          } else {
            setIsRedirecting(false);
          }
        } else {
          // No user ID in token, redirect to login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        router.push('/auth/login');
      }
    };

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(redirectToUserHome, 100);
    
    return () => clearTimeout(timer);
  }, [router, isRedirecting, redirectAttempts, getToken]);

  // If too many redirect attempts, show error and manual redirect button
  if (redirectAttempts >= 3) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">Redirect failed</div>
            <p className="text-gray-600 mb-4">Unable to automatically redirect to your home page.</p>
            <button
              onClick={() => {
                const authToken = getToken();
                if (authToken) {
                  try {
                    const base64Url = authToken.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(atob(base64));
                    const loggedInUserId = payload?.userId || payload?.id || payload?.sub;
                    if (loggedInUserId) {
                      window.location.href = `/home/${loggedInUserId}`;
                    } else {
                      router.push('/auth/login');
                    }
                  } catch (error) {
                    router.push('/auth/login');
                  }
                } else {
                  router.push('/auth/login');
                }
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to your home page...</p>
          <p className="mt-2 text-sm text-gray-400">Please wait...</p>
          {redirectAttempts > 0 && (
            <p className="mt-2 text-xs text-gray-500">Attempt {redirectAttempts + 1}/3</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;