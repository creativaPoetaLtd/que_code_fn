/* eslint-disable */
'use client';
import { GoogleOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import React, { useEffect } from 'react';
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

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const response = await login(data).unwrap();
      console.log("Response", response);

      const { token, user } = response;

      localStorage.setItem('authToken', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      notification.success({
        message: 'Login Successful',
        description: `Welcome back, ${user?.data?.dataValues?.email}`,
        placement: 'topRight',
      });
      router.push('/dashboard');
    } catch (error) {
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
          message: 'Error',
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
          notification.success({
            message: 'Login Successful',
            description: 'You have been logged in with Google.',
            placement: 'topRight',
          });
          router.replace('/dashboard');
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

  return (
    <div className="flex h-screen">
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
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <ClipLoader color='#fffff' size={20} />
                Signing in...
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
        >
          Sign in with Google
        </Button>

        <p className="mt-6 text-sm text-center">
          {`Don't`} you have an account? <a href="/auth/signup" className="text-[#00B512] hover:underline">Sign up</a>
        </p>
      </div>
      <ImageSection url="/Images/art1.png" />
    </div>
  );
};

export default LoginPage;