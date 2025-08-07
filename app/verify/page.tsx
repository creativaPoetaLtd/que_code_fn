'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const VerifyRedirectPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Redirect to the auth verification page with the token
      router.replace(`/auth/verify?token=${token}`);
    } else {
      // If no token, redirect to login
      router.replace('/auth/login');
    }
  }, [token, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B512] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default VerifyRedirectPage; 