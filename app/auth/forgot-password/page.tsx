
import { Input, Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import React from 'react';
import ImageSection from '../ImageSection';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="flex h-screen">
      <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
      <h1 className="text-3xl font-bold">
          {`Don't worry about it`} <span role="img" aria-label="wave">👋</span>
        </h1>
        <p className="mt-2 text-gray-600">
          Today is a new day. {`It's your day`}. You shape it.
        </p>
        <form className="mt-6">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
            <Input
              type="email"
              placeholder="Example@email.com"
              className="mt-1 p-2 rounded-md"
            />
          </div>
          <Button
            type="primary"
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
    </div>
  );
};

export default ForgotPasswordPage;
