/* eslint-disable */
'use client';
import { GoogleOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import ImageSection from '../ImageSection';
import { mainUrl } from '@/helpers/baseUrl';
import Button from '../../../components/ui/Button-ant';
import InputPassword from '@/components/ui/InputPassword';
import Input from 'antd/es/input';
import { useLoginMutation } from '@/states/authentication';
import { ClipLoader } from 'react-spinners';

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

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [checkingAuth, setCheckingAuth] = useState(true);

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
    const checkAuthStatus = () => {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        try {
          const base64Url = authToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          
          // Check if token is not expired
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            const userId = payload?.userId || payload?.id || payload?.sub;
            if (userId) {
              router.replace(`/home/${userId}`);
            } else {
              router.replace('/home');
            }
            return;
          } else {
            // Token is expired, remove it
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('authToken');
        }
      }
      setCheckingAuth(false);
    };
    
    checkAuthStatus();
  }, [router]);

  useEffect(() => {
    const handleTokenMessage = (event: MessageEvent) => {
      if (event.origin !== mainUrl) {
        console.error('Received message from unauthorized origin:', event.origin);
        return;
      }

      try {
        if (event.data && event.data.token) {
          console.log('Token received from Google login');
          localStorage.setItem('authToken', event.data.token);
          
          // Decode Google token to get user ID
          const decodeToken = (token: string) => {
            try {
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(atob(base64));
              return payload;
            } catch (error) {
              console.error("Error decoding token:", error);
              return null;
            }
          };

          const payload = decodeToken(event.data.token);
          const userId = payload?.userId || payload?.id || payload?.sub;
          const userName = payload?.name || payload?.firstName || 'User';
          
          
          
          // Redirect to home with userId for Google login too
          if (userId) {
            router.replace(`/home/${userId}`);
          } else {
            console.warn('No userId found in Google token, redirecting to generic home');
            router.replace('/home');
          }

          notification.success({
            message: 'Login Successful',
            description: `Welcome back, ${userName}!`,
            placement: 'topRight',
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        notification.error({
          message: 'Login Error',
          description: 'An error occurred during Google login.',
          placement: 'topRight',
        });
      }
    };

    window.addEventListener('message', handleTokenMessage);
    return () => window.removeEventListener('message', handleTokenMessage);
  }, [router]);

  if (checkingAuth) {
    return null; // Or a loading spinner if you want
  }

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const response = await login(data).unwrap();
      console.log("Response", response);
      const { token } = response;
  
      // Decode the JWT token to extract the user's name and ID
      const decodeToken = (token: string) => {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          return payload;
        } catch (error) {
          console.error("Error decoding token:", error);
          return null;
        }
      };
  
      const payload = decodeToken(token);
      if (!payload) {
        throw new Error('Invalid token received');
      }
      
      const userName = payload?.name || payload?.firstName || 'User';
      const userId = payload?.userId || payload?.id || payload?.sub;
  
      console.log('Login successful - User ID:', userId);
      console.log('Login successful - User Name:', userName);
      
      localStorage.setItem('authToken', token);
      notification.success({
        message: 'Login Successful',
        description: `Welcome back, ${userName}!`,
        placement: 'topRight',
      });
  
      // Redirect to home with userId as a parameter
      if (userId) {
        router.push(`/home/${userId}`);
      } else {
        console.warn('No userId found in token, redirecting to generic home');
        router.push('/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      const err = error as APIError;
      const status = err?.status;
      const errorMessage = err?.data?.message || 'An error occurred during login';
  
      if (status === 404) {
        notification.error({
          message: 'Login Failed',
          description: 'User not found. Please check your email.',
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
    const popup = window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
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
        if (!localStorage.getItem('authToken')) {
          notification.warning({
            message: 'Login Cancelled',
            description: 'Google login was cancelled or unsuccessful.',
            placement: 'topRight',
          });
        }
      }
    }, 1000);
  };

  return (
    <div className="flex h-screen">
      <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
        <h1 className="text-3xl font-bold">
          Welcome Back <span role="img" aria-label="wave">👋</span>
        </h1>
        <p className="mt-2 text-gray-600">
          Today is a new day. It's your day. You shape it.
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
            disabled={isLoading}
          >
            {isLoading ? (
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
          disabled={isLoading}
        >
          Sign in with Google
        </Button>

        <p className="mt-6 text-sm text-center">
          Don't you have an account? <a href="/auth/signup" className="text-[#00B512] hover:underline">Sign up</a>
        </p>
      </div>
      <ImageSection url="/Images/art1.png" />
    </div>
  );
};

export default LoginPage;