/* eslint-disable */
'use client';
import { GoogleOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import ImageSection from '../ImageSection';
import { mainUrl } from '@/helpers/baseUrl';
import Button from '../../../components/ui/Button-ant';
import InputPassword from '@/components/ui/InputPassword';
import Input from 'antd/es/input';
import { useLoginMutation, useLoginOrganizationMutation } from '@/states/authentication';
import { ClipLoader } from 'react-spinners';
import { useAuthToken } from '@/hooks/use-auth-token';

interface LoginFormInputs {
  email: string;
  password: string;
}

interface APIError {
  status: number;
  data: {
    message?: string;
  };
}

interface TokenPayload {
  id: string;
  email: string;
  name: string;
  accountType: string;
  iat: number;
  exp: number;
}

// Hook to decode and extract token information
const useTokenInfo = () => {
  const { getToken } = useAuthToken();

  const decodeToken = (token: string): TokenPayload | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload;
    } catch (error) {
      return null;
    }
  };

  const getTokenInfo = (): TokenPayload | null => {
    const token = getToken();
    if (!token) return null;

    const payload = decodeToken(token);
    if (!payload) return null;

    // Check if token is expired
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return payload;
  };

  return { getTokenInfo, decodeToken };
};

// Separate the component that uses useSearchParams
const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/home';

  const [login, { isLoading }] = useLoginMutation();
  const [loginOrganization, { isLoading: isOrgLoading }] = useLoginOrganizationMutation();
  const { setToken, getToken } = useAuthToken();
  const { getTokenInfo, decodeToken } = useTokenInfo();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const tokenInfo = getTokenInfo();
    if (tokenInfo) {
      // User is already logged in with valid token
      redirectAfterLogin(tokenInfo.id, tokenInfo.accountType);
    }
  }, [router]);

  const redirectAfterLogin = (userId: string, accountType?: string) => {
    // Redirect based on account type
    if (accountType === 'organization') {
      // For organizations, redirect to a different dashboard or home page
      router.replace(`/home/${userId}`);
    } else {
      // For regular users, redirect to user home
      router.replace(`/home/${userId}`);
    }
  };

  const onSubmit = async (data: LoginFormInputs) => {
    try {

      // Try organization login first, then fall back to regular login
      let response;
      let isOrganization = false;

      try {
        response = await loginOrganization(data).unwrap();
        isOrganization = true;
      } catch (orgError) {
        response = await login(data).unwrap();
        isOrganization = false;
      }

      const { token, account } = response;

      setToken(token);

      // Decode token to get user information
      const tokenInfo = decodeToken(token);
      if (!tokenInfo) {
        throw new Error('Invalid token received');
      }

      // Determine account type for appropriate messaging
      const accountType = isOrganization ? 'organization' : (tokenInfo.accountType || 'user');
      const entityType = accountType === 'organization' ? 'Organization' : 'User';

      notification.success({
        message: 'Login Successful',
        description: `Welcome back, ${tokenInfo.name}!`,
        placement: 'topRight',
      });

      // Redirect based on account type
      redirectAfterLogin(tokenInfo.id, accountType);
    } catch (error) {
      const err = error as APIError;
      const status = err?.status;
      const errorMessage = err?.data?.message || 'An error occurred during login';

      if (status === 404) {
        notification.error({
          message: 'Login Failed',
          description: 'Account not found. Please check your email.',
          placement: 'topRight',
        });
      } else if (status === 401) {
        notification.error({
          message: 'Invalid Credentials',
          description: 'Incorrect password. Please try again.',
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: 'Login Error',
          description: errorMessage,
          placement: 'topRight',
        });
      }
    }
  };

  const handleGoogleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Pass return URL to Google OAuth flow
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;

    const popup = window.open(
      googleAuthUrl,
      'GoogleLogin',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      notification.error({
        message: 'Popup Blocked',
        description: 'Please allow popups for this website to use Google login.',
        placement: 'topRight',
      });
      return;
    }

    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopupClosed);
        const token = getToken();
        if (!token) {
          notification.warning({
            message: 'Login Cancelled',
            description: 'Google login was cancelled or unsuccessful.',
            placement: 'topRight',
          });
        }
      }
    }, 1000);
  };

  useEffect(() => {
    const handleTokenMessage = (event: MessageEvent) => {
      if (event.origin !== mainUrl) {
        return;
      }

      try {
        if (event.data && event.data.token) {
          setToken(event.data.token);

          // Decode token to get user information
          const tokenInfo = decodeToken(event.data.token);
          if (tokenInfo) {
            notification.success({
              message: 'Login Successful',
              description: `Welcome back, ${tokenInfo.name}!`,
              placement: 'topRight',
            });

            // Redirect based on account type
            redirectAfterLogin(tokenInfo.id, tokenInfo.accountType);
          } else {
            notification.error({
              message: 'Login Error',
              description: 'Invalid token received from Google login.',
              placement: 'topRight',
            });
          }
        }
      } catch (error) {
        notification.error({
          message: 'Login Error',
          description: 'An error occurred during Google login.',
          placement: 'topRight',
        });
      }
    };

    window.addEventListener('message', handleTokenMessage);
    return () => window.removeEventListener('message', handleTokenMessage);
  }, [router, returnUrl]);

  return (
    <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
      <h1 className="text-3xl font-bold">
        Welcome Back <span role="img" aria-label="wave">👋</span>
      </h1>
      <p className="mt-2 text-gray-600">
        Today is a new day. {`It's`} your day. You shape it.
      </p>
      <form className="mt-6" method='POST' onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email</label>
          <Controller
            name="email"
            control={control}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            }}
            render={({ field }) => (
              <Input
                {...field}
                size="large"
                placeholder="Example@email.com"
                status={errors.email ? 'error' : ''}
                className="p-4 rounded-md"
              />
            )}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Password</label>
          <Controller
            name="password"
            control={control}
            rules={{
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            }}
            render={({ field }) => (
              <InputPassword
                {...field}
                placeholder="At least 8 characters"
                className={errors.password ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <a href="forgot-password" className="text-sm text-[#00B512] hover:underline">
          Forgot Password?
        </a>

        <Button
          htmlType="submit"
          type="primary"
          className="w-full !mt-4"
          disabled={isLoading || isOrgLoading}
        >
          {(isLoading || isOrgLoading) ? (
            <div className="flex items-center justify-center">
              <ClipLoader color='#ffffff' size={20} />
              <span className="ml-2">Signing in...</span>
            </div>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="flex items-center justify-between my-6">
        <hr className="w-1/3 border-gray-300" />
        <span className="text-sm text-gray-400">Or</span>
        <hr className="w-1/3 border-gray-300" />
      </div>

      <Button
        icon={<GoogleOutlined />}
        className="w-full flex justify-center items-center bg-gray-100 border-gray-300 text-gray-700 hover:text-white"
        onClick={handleGoogleLogin}
        disabled={isLoading || isOrgLoading}
      >
        Sign in with Google
      </Button>

      <p className="mt-6 text-sm text-center">
        {`Don't`} you have an account? <a href="/auth/signup" className="text-[#00B512] hover:underline">Sign up</a>
      </p>
    </div>
  );
};

// Loading fallback component
const LoginPageFallback: React.FC = () => (
  <div className="flex h-screen">
    <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    <ImageSection url="/Images/art1.png" />
  </div>
);

// Main component with Suspense boundary
const LoginPage: React.FC = () => {
  return (
    <div className="flex h-screen">
      <Suspense fallback={<LoginPageFallback />}>
        <LoginForm />
      </Suspense>
      <ImageSection url="/Images/art1.png" />
    </div>
  );
};

export default LoginPage;