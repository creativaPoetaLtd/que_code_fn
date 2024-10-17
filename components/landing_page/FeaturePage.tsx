import React from 'react';
import Image from 'next/image';
import { MdArrowOutward } from 'react-icons/md';

const FeaturePage: React.FC = () => {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between w-full h-screen mx-auto py-6 px-[15%] space-y-6 md:space-y-0 bg-white">
      
      <div className="md:w-[50%] w-[90%] mx-auto text-left">
        <span className="text-black font-semibold mb-4 inline-block">
          &#128293; FEATURED
        </span>
        <h1 className="text-4xl md:text-5xl text-black font-bold mb-6 leading-tight">
          All the features in one app
        </h1>

        <ul className="space-y-4 mb-8 text-[#676666]">
          <li className="flex items-start">
            <span className="mr-2">&#8226;</span>
            <p>Get 3% Cash Back On Everyday Purchases, 2% On Everything Else</p>
          </li>
          <li className="flex items-start">
            <span className="mr-2">&#8226;</span>
            <p>Extra Spending Power When You Have Rewards Checking Through Upgrade</p>
          </li>
        </ul>

        <div className="relative flex items-center">
          <button className="bg-white border border-[#00B512] hover:bg-[#e7e5e5] text-black font-semibold py-4 px-8 rounded-full flex items-center justify-between space-x-4 transition duration-300 ease-in-out">
            <span>Get Started</span>
            <div className="w-6 h-6 bg-[#00B512] text-white rounded-full flex items-center justify-center transform rotate-150 transition duration-300 ease-in-out">
              <MdArrowOutward className="text-xl" />
            </div>
          </button>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="w-full md:w-[50%] max-w-xl mx-auto flex justify-center">
        <Image
          src="/featureimg.png"
          alt="Phone image"
          width={600}
          height={900}
          className="rounded-lg shadow-xl w-full h-auto"
        />
      </div>
    </section>
  );
};

export default FeaturePage;
