import React from "react";
import Image from "next/image";

const AboutUs: React.FC = () => {
  return (
    <section className="flex max-h-fit flex-col md:flex-row items-center justify-between w-full min-h-screen mx-auto py-6 px-[15%] space-y-6 md:space-y-0 bg-white">
      
      <div className="w-full md:w-1/3">
        <div className="rounded-lg shadow-lg bg-[#F5F5F5] px-10 py-16 overflow-hidden justify-center flex items-center">
          <Image
            src="/chart1.png"
            alt="Savings Chart"
            width={500}
            height={500}
            className="rounded-md"
          />
        </div>
      </div>
     
      <div className="w-full md:w-1/2 p-4">
        <div className="bg-[#F9FAFB] inline-block px-4 py-2 rounded-full text-[#031B1D] font-semibold text-md mb-4 border-[#EAECF0] border-2">
          🔥ABOUT US
        </div>
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          All Your Money Needs In One App
        </h1>
      
      <div className="flex " >
      <div className="hidden md:flex flex-col justify-center items-center px-4">
        <div className="h-[400px] w-[12px] bg-[#D1D5DB] rounded-full">
        <div className="h-[120px] w-[12px] bg-[#1D8363] rounded-full mb-2"></div>
        </div>
      </div>
      <div className="space-y-6">
          <div className="p-4 bg-[#F1FFD2] rounded-lg shadow hover:bg-green-200 transition-colors border">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Expenses Tracker
            </h3>
            <p className="text-gray-700">
              Our comprehensive selection of medications, supplements, and healthcare products.
            </p>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg shadow hover:bg-gray-200 transition-colors border">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Money Transfer
            </h3>
            <p className="text-gray-700">
              From advanced imaging technology such as MRI and CT scanners to precision surgical tools.
            </p>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg shadow hover:bg-gray-200 transition-colors border">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Build Connection
            </h3>
            <p className="text-gray-700">
              We are committed to leveraging the latest innovations in medical technology.
            </p>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default AboutUs;
