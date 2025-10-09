'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { notification } from 'antd';
import { ClipLoader } from 'react-spinners';
import { useVerifyOrganizationQuery, useVerifyOtpMutation } from '@/states/authentication';
import ImageSection from '../ImageSection';

const VerifyPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const otp = searchParams.get('otp');

  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null);
  const [skipOrgQuery, setSkipOrgQuery] = useState(false);
  const hasVerified = useRef(false);

  const {
    data: orgVerificationData,
    error: orgVerificationError,
    isLoading: isOrgVerifying,
    isError: isOrgError,
  } = useVerifyOrganizationQuery(token!, {
    skip: !token || skipOrgQuery
  });

  const [verifyOtp, {
    isLoading: isUserVerifying,
    error: userVerificationError,
  }] = useVerifyOtpMutation();

  const isVerifying = isOrgVerifying || isUserVerifying;

  useEffect(() => {
    if (hasVerified.current) return;

    if (!token) {
      setVerificationStatus('error');
      notification.error({
        message: 'Verification Failed',
        description: 'No verification token provided.',
        placement: 'topRight',
      });
      return;
    }
  }, [token]);

  useEffect(() => {
    if (orgVerificationData && !hasVerified.current) {
      hasVerified.current = true;
      setVerificationStatus('success');
      notification.success({
        message: 'Organization Verified Successfully',
        description: 'Your organization has been verified. You can now log in to your account.',
        placement: 'topRight',
      });

      setTimeout(() => {
        router.replace('/auth/login');
      }, 3000);
    }
  }, [orgVerificationData, router]);
  useEffect(() => {
    if (isOrgError && orgVerificationError && !hasVerified.current) {
      const error = orgVerificationError as any;

      if (error?.status === 400 || error?.status === 404) {
        setSkipOrgQuery(true);

        if (!otp) {
          setVerificationStatus('error');
          notification.error({
            message: 'OTP Required',
            description: 'OTP is required for user verification. Please check your email for the OTP.',
            placement: 'topRight',
          });
          return;
        }
        verifyOtp({ token, otp })
          .unwrap()
          .then((response) => {
            hasVerified.current = true;
            setVerificationStatus('success');
            notification.success({
              message: 'Account Verified Successfully',
              description: 'Your account has been verified. You can now log in to your account.',
              placement: 'topRight',
            });

            setTimeout(() => {
              router.replace('/auth/login');
            }, 3000);
          })
          .catch((userErr) => {
            hasVerified.current = true;
            handleVerificationError(userErr);
          });
      } else {
        hasVerified.current = true;
        handleVerificationError(error);
      }
    }
  }, [isOrgError, orgVerificationError, otp, token, verifyOtp, router]);

  const handleVerificationError = (error: any) => {
    setVerificationStatus('error');
    const errorMessage = error?.data?.message || error?.message || 'Verification failed. Please try again.';

    if (errorMessage.toLowerCase().includes('already verified')) {
      setVerificationStatus('success');
      notification.success({
        message: 'Already Verified',
        description: 'Your account was already verified. You can now log in to your account.',
        placement: 'topRight',
      });

      setTimeout(() => {
        router.replace('/auth/login');
      }, 3000);
    } else if (errorMessage.toLowerCase().includes('otp is required')) {
      notification.error({
        message: 'OTP Required',
        description: 'OTP is required for user verification. Please check your email for the OTP.',
        placement: 'topRight',
      });
    } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('expired')) {
      notification.error({
        message: 'Invalid or Expired Token',
        description: 'The verification link is invalid or has expired. Please request a new verification link.',
        placement: 'topRight',
      });
    } else if (errorMessage.toLowerCase().includes('not found')) {
      notification.error({
        message: 'Account Not Found',
        description: 'No account found with the provided verification token.',
        placement: 'topRight',
      });
    } else {
      notification.error({
        message: 'Verification Failed',
        description: errorMessage,
        placement: 'topRight',
      });
    }
  };

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
            We couldn't verify your account. Please check your email for a new verification link or contact support.
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