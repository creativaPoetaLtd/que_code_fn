// pages/register.tsx
'use client'
import { Button } from 'antd';
import React from 'react';
import { useRouter } from 'next/navigation';
import ImageSection from '../ImageSection';

const RegisterPage: React.FC = () => {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/auth/signup/user');
  }
  const handleFacilityRegister = () => {
    router.push('/auth/signup/facility');
  }
  return (
    <div className="flex relative h-screen">
      <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
      <h1 className="text-2xl flex text-center items-center mx-auto font-bold">
          You want to join us <span role="img" aria-label="wave">👋</span>
        </h1>
        <p className="mt-2 text-gray-600 flex text-center items-center mx-auto">
          Today is a new day. {`It's your day`}. You shape it.
        </p>

        <div className="mt-6">
          <Button
            type="primary"
            onClick={handleRegister}
            className="w-full mb-4 bg-green-500 border-none hover:bg-green-600"
          >
            Register as user
          </Button>
          <Button
            type="primary"
            onClick={handleFacilityRegister}
            className="w-full bg-green-500 border-none hover:bg-green-600"
          >
            Register as facility
          </Button>
        </div>

        <p className="mt-6 text-sm text-center">
          Already have an account? <a href="/auth/login" className="text-green-500 hover:underline">Sign in</a>
        </p>
        
      </div>
      <ImageSection url="/art1.png" />
      <footer className="  justify-center mt-12 absolute text-sm bottom-8 left-[14%] w-1/2 text-gray-400">
          © 2024 creativa poeta. All rights reserved.
        </footer>
    </div>
  );
};

export default RegisterPage;
