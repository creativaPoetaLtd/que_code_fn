'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { notification } from 'antd';
import { ClipLoader } from 'react-spinners';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';
import ImageSection from '../ImageSection';

const VerifyPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    // Prevent duplicate verification calls
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        setIsVerifying(false);
        notification.error({
          message: 'Verification Failed',
          description: 'No verification token provided.',
          placement: 'topRight',
        });
        return;
      }

      try {
        // Try organization verification first, then fall back to user verification
        let response;
        let isOrganization = false;
        
        try {
          response = await axios.get(`${baseUrl}/organizations/verify?token=${token}`);
          isOrganization = true;
        } catch (orgError) {
          // If organization verification fails, try user verification
          response = await axios.get(`${baseUrl}/users/verify-email?token=${token}`);
          isOrganization = false;
        }
        
        if (response.status === 200) {
          setVerificationStatus('success');
          const entityType = isOrganization ? 'Organization' : 'Account';
          notification.success({
            message: `${entityType} Verified Successfully`,
            description: `Your ${entityType.toLowerCase()} has been verified. You can now log in to your account.`,
            placement: 'topRight',
          });
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            router.replace('/auth/login');
          }, 3000);
        }
      } catch (error: any) {
        setVerificationStatus('error');
        const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
        
        // Handle "already verified" case specifically
        if (errorMessage.toLowerCase().includes('already verified')) {
          setVerificationStatus('success');
          notification.success({
            message: 'Already Verified',
            description: 'Your account was already verified. You can now log in to your account.',
            placement: 'topRight',
          });
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            router.replace('/auth/login');
          }, 3000);
        } else {
          // Enhanced error handling for different types of verification failures
          let errorTitle = 'Verification Failed';
          let errorDescription = errorMessage;
          
          if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('expired')) {
            errorDescription = 'The verification link is invalid or has expired. Please check your email for a new verification link.';
          } else if (errorMessage.toLowerCase().includes('user')) {
            errorDescription = 'An error occurred while fetching the user. Please try again or contact support.';
          }
          
          notification.error({
            message: errorTitle,
            description: errorDescription,
            placement: 'topRight',
          });
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className="flex flex-col items-center justify-center">
          <ClipLoader color="#00B512" size={50} />
          <p className="mt-4 text-lg text-gray-600">Verifying your email...</p>
        </div>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Verification Successful!</h2>
          <p className="text-gray-600 text-center mb-6">
            Your account has been successfully verified. You will be redirected to the login page shortly.
          </p>
          <button
            onClick={() => router.replace('/auth/login')}
            className="px-6 py-2 bg-[#00B512] text-white rounded-md hover:bg-[#009510] transition-colors"
          >
            Go to Login
          </button>
        </div>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
          <p className="text-gray-600 text-center mb-6">
            The verification link is invalid or has expired. Please check your email for a new verification link.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.replace('/auth/login')}
              className="px-6 py-2 bg-[#00B512] text-white rounded-md hover:bg-[#009510] transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.replace('/auth/signup')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Sign Up Again
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen">
      <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
        {renderContent()}
      </div>
      <ImageSection url="/Images/art1.png" />
    </div>
  );
};

const VerifyPage = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <ClipLoader color="#00B512" size={50} />
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
};

export default VerifyPage; 