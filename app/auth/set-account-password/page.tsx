'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { Input, Button, message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import ImageSection from '../ImageSection';
import baseUrl from '@/helpers/baseUrl';

const SetAccountPasswordContent: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      message.error('Invalid or missing setup token');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      message.error('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${baseUrl}/auth/set-account-password`,
        {
          token,
          newPassword,
        }
      );

      setNewPassword('');
      setConfirmPassword('');
      message.success(response.data.message || 'Password set successfully');
      setTimeout(() => {
        // Clear any existing token to force user to log in with new password
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        router.replace('/auth/login');
      }, 800);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        message.error(
          error.response?.data?.message || 'Failed to set password'
        );
      } else {
        message.error('Failed to set password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex h-screen'>
      <div className='flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4'>
        <h1 className='text-3xl font-bold'>
          Set your account password{' '}
          <span role='img' aria-label='lock'>
            🔐
          </span>
        </h1>
        <p className='mt-2 text-gray-600'>
          Create a password to activate your account.
        </p>

        <div className='w-full max-w-md p-8 space-y-6 bg-white shadow-md rounded-lg mt-6'>
          <form onSubmit={handleSetPassword}>
            <div className='mb-4'>
              <label
                htmlFor='newPassword'
                className='block text-sm font-semibold text-gray-700'
              >
                New Password
              </label>
              <Input.Password
                id='newPassword'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder='Enter your new password'
                required
                className='mt-1 p-2 rounded-md w-full'
              />
            </div>

            <div className='mb-6'>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-semibold text-gray-700'
              >
                Confirm Password
              </label>
              <Input.Password
                id='confirmPassword'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder='Confirm your new password'
                required
                className='mt-1 p-2 rounded-md w-full'
              />
            </div>

            <Button
              type='primary'
              htmlType='submit'
              loading={loading}
              className='w-full bg-green-500 border-none hover:bg-green-600'
              disabled={!token}
            >
              Set Password
            </Button>
          </form>

          {!token && (
            <p className='text-sm text-red-500 text-center'>
              Setup token is missing. Please use the link sent to your email.
            </p>
          )}
        </div>
      </div>

      <ImageSection url='/Images/art1.png' />
    </div>
  );
};

const SetAccountPasswordPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className='flex h-screen'>
          <div className='flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4'>
            <div className='w-full max-w-md p-8 space-y-6 bg-white shadow-md rounded-lg mt-6'>
              <p className='text-center text-gray-600'>Loading...</p>
            </div>
          </div>
          <ImageSection url='/Images/art1.png' />
        </div>
      }
    >
      <SetAccountPasswordContent />
    </Suspense>
  );
};

export default SetAccountPasswordPage;
