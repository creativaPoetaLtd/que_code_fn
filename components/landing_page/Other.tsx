import React from 'react';
import { MdArrowOutward } from 'react-icons/md';

const Other: React.FC = () => {
  return (
    <div className="bg-white min-h-screen flex items-center px-[4%] md:px-[15%]">
      <div className="container bg-[#00313A] h-fit rounded-2xl flex flex-col px-4 w-full md:flex-row items-center justify-between">
       
        <div className="md:w-1/2 md:pl-12">
       
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Are you ready to start?
          </h1>
          <p className="mb-8 text-gray-300">
          Personalize your settings, follow your progress, archive your highlights and notes automatically Glose is the ultimate reading 
          </p>
          <div className="relative flex items-center">
            <button className="bg-[#00B512] hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-between space-x-3 transition duration-300 ease-in-out">
              <span>Get Started</span>
              <div className="w-10 h-10 bg-white text-[#013f47] rounded-full flex items-center justify-center transform rotate-150 transition duration-300 ease-in-out">
                <MdArrowOutward className="text-lg" />
              </div>
            </button>
          </div>
        </div>
        <div className="md:w-1/2 md:mb-0">
          <img
            src="/other.png"
            alt="Trust security image"
            className="rounded-3xl shadow-xl w-full max-w-md "
          />
        </div>
      </div>
    </div>
  );
};

export default Other;