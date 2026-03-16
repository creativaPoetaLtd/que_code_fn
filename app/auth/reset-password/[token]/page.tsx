'use client'

import React, { useState } from 'react';
import { Input, Button, message } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import ImageSection from '../../ImageSection';
import baseUrl from '@/helpers/baseUrl';

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useParams<{ token: string }>();
  const navigate = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      message.error('Invalid or missing reset token');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      message.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/auth/reset-password`, {
        token,
        newPassword,
      });
      setNewPassword('');
      message.success(response.data.message || 'Password reset successful');
      setTimeout(() => {
        navigate.replace('/auth/login');
      }, 800);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        message.error(error.response?.data?.message || 'An error occurred');
      } else {
        message.error('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
        <h1 className="text-3xl font-bold">
          {`Don't worry about it`} <span role="img" aria-label="wave">👋</span>
        </h1>
        <p className="mt-2 text-gray-600">
          Reset Your Password
        </p>
        <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-md rounded-lg">
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700">
                New Password
              </label>
              <Input.Password
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                className="mt-1 p-2 rounded-md w-full"
              // validate password


              />
            </div>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full bg-green-500 border-none hover:bg-green-600"
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
      <ImageSection url="/Images/art1.png" />
    </div>
  );
};

export default ResetPasswordPage;
