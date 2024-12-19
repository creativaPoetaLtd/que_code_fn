'use client';
import { notification } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ImageSection from '../ImageSection';
import baseUrl, { mainUrl } from '@/helpers/baseUrl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import InputPassword from '@/components/ui/InputPassword';
import Label from '@/components/ui/Label';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/auth/login`, { email, password });
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      notification.success({
        message: 'Login Successful',
        description: `Welcome back, ${user?.data?.dataValues?.email}`,
        placement: 'topRight',
      });
      router.push('/dashboard');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data.message || 'An error occurred during login';

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
      } else {
        console.error('Unexpected error:', error);
        notification.error({
          message: 'Error',
          description: 'An unexpected error occurred during login.',
          placement: 'topRight',
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      `${baseUrl}/auth/google`,
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
        <form className="mt-6" onSubmit={(e) => e.preventDefault()}>
          <div className="mb-4">
            <Label htmlFor='email'>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Example@email.com"
              className="p-4 rounded-md"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor='password'>Password</Label>
            <InputPassword
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <a href="forgot-password" className="text-sm text-[#00B512] hover:underline">
            Forgot Password?
          </a>

          <Button
            type="primary"
            onClick={handleLogin}
            className={`w-full !mt-4 !py-6 text-lg rounded-lg border-none text-white hover:bg-[#2dc93d] hover:text-white 
              ${loading || !email || !password ? 'opacity-70 cursor-not-allowed' : ''}`}
            loading={loading}
            disabled={!email || !password || loading}
          >
            Sign in
          </Button>
        </form>

        <div className="flex items-center justify-between my-6">
          <hr className="w-1/3 border-gray-300" />
          <span className="text-sm text-gray-400">Or</span>
          <hr className="w-1/3 border-gray-300" />
        </div>

        <Button
          icon={<GoogleOutlined />}
          className="w-full flex justify-center text-lg py-6 items-center bg-gray-100 border-gray-300 text-gray-700 hover:text-white"
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