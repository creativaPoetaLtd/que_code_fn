"use client";
import { Input, Button, message, Modal } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import ImageSection from '../ImageSection';
import baseUrl, { googleUrl } from '@/helpers/baseUrl';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/auth/forgot-password`, { email });
      message.success(response.data.message);
      setIsModalVisible(true);  
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

  const handleOpenGmail = () => {
    window.open(googleUrl, '_blank');
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen">
      <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
        <h1 className="text-3xl font-bold">
          {`Don't worry about it`} <span role="img" aria-label="wave">👋</span>
        </h1>
        <p className="mt-2 text-gray-600">
          Today is a new day. {`It's your day`}. You shape it.
        </p>
        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Example@email.com"
              className="mt-1 p-2 rounded-md"
              required
            />
          </div>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full mt-4 bg-green-500 border-none hover:bg-green-600"
          >
            Submit
          </Button>
        </form>

        <div className="flex items-center justify-between my-6">
          <hr className="w-1/3 border-gray-300" />
          <span className="text-sm text-gray-400">Or</span>
          <hr className="w-1/3 border-gray-300" />
        </div>

        <Button
          icon={<GoogleOutlined />}
          className="w-full flex justify-center items-center border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Sign in with Google
        </Button>

        <p className="mt-6 text-sm text-center">
          {`Don't you have an account?`} <a href="/auth/signup" className="text-green-500 hover:underline">Sign up</a>
        </p>
      </div>
      <ImageSection url="/art1.png" />

      {/* Modal for email sent confirmation */}
      <Modal
        title="Email Sent"
        visible={isModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="open-gmail" type="primary" onClick={handleOpenGmail}>
            Open Gmail
          </Button>,
          <Button key="close" onClick={handleCloseModal}>
            Close
          </Button>,
        ]}
      >
        <p>An email has been sent to your address with instructions to reset your password. Please check your inbox.</p>
      </Modal>
    </div>
  );
};

export default ForgotPasswordPage;
