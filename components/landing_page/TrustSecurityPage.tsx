import React from 'react';
import { MdArrowOutward } from 'react-icons/md';

const TrustSecurityPage: React.FC = () => {
  return (
    <div className="bg-[#00313A] text-white min-h-screen flex items-center px-[15%]">
      <div className="container py-12 md:py-24 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 md:mb-0">
          <img
            src="/trustImg.png"
            alt="Trust security image"
            className="rounded-3xl shadow-xl w-full max-w-md "
          />
        </div>
        <div className="md:w-1/2 md:pl-12">
          <div className="flex items-center mb-4">
            <span className="text-orange-500 mr-2">🔥</span>
            <span className="uppercase text-sm font-semibold">Trustworthiness</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            We Value Your Trust And Security
          </h1>
          <p className="mb-8 text-gray-300">
            Our Mission Is To Make Finance More Accessible, Transparent, And Secure
            For Everyone. With Cutting.
          </p>
          <div className="relative flex items-center">
            <button className="bg-[#00B512] hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-between space-x-3 transition duration-300 ease-in-out">
              <span>Open Account</span>
              <div className="w-10 h-10 bg-white text-[#013f47] rounded-full flex items-center justify-center transform rotate-150 transition duration-300 ease-in-out">
                <MdArrowOutward className="text-lg" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSecurityPage;