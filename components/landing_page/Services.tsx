import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { MdArrowOutward } from "react-icons/md";

const Services = () => {
  return (
    <section className="bg-white py-16 w-full min-h-fit px-[10%] justify-between">
      <div className="text-center mb-12">
        <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">
          🔥 Our Services
        </h2>
        <h1 className="text-4xl font-extrabold text-gray-900">
          Can Help You Achieve Financial Success
        </h1>
      </div>

      <div className="flex flex-col gap-12 items-center">
        <div className="flex flex-col md:flex-row bg-[#F6F9F8] justify-start items-center gap-32 p-12 border rounded-2xl shadow-md w-full">
          <img src="/service1.png" alt="Service 1" className="w-1/3 h-auto rounded-lg" />
          <div className="flex flex-col items-start gap-4">
            <img src="/globe.png" alt="Globe Icon" className="w-12 h-12" />
            <h1 className="text-6xl font-bold text-black">
              Transfers Across the Globe Are Free
            </h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-8 w-full">
          <div className="bg-white flex flex-col gap-6 p-8 border rounded-2xl shadow-lg w-full md:w-[50%]">
            <h1 className="text-3xl font-bold text-black">
              Create A QR Code That Is Unique
            </h1>
            <p className="text-gray-700">
              We offer a comprehensive range of innovative financial services tailored to your needs. Includes High-Yield Savings Accounts.
            </p>
            <img src="/service2.png" alt="QR Code Service" className="w-3/4 h-auto rounded-lg" />
          </div>

          <div className="bg-[#001027] text-white flex flex-col gap-6 px-8  h-fit pt-32 border rounded-2xl shadow-lg w-full md:w-[45%]">
            <h1 className="text-3xl font-bold">
              Personalized Insights And Financial Goals
            </h1>
            <p className="text-gray-300">
              Get competitive rates, flexible deposit options, and personalized investment services with high-yield savings.
            </p>
            <img src="/service3.png" alt="Financial Goals" className="w-3/4 h-auto rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 w-full">
          <div className="bg-[#E2FF54] p-8 flex flex-col gap-4 rounded-2xl shadow-lg w-full md:w-1/3 justify-center">
            <h1 className="text-3xl font-bold text-black">
              100% Dedication
            </h1>
            <p className="text-gray-700">
              We are committed to providing innovative financial services tailored to meet your unique needs.
            </p>
          </div>

          <div className="bg-white p-8 flex flex-col gap-4 rounded-2xl shadow-lg w-full md:w-1/3">
            <h1 className="text-3xl font-bold text-black">
              Hold Money in 30+ Currencies
            </h1>
            <p className="text-gray-700">
              Manage your money globally with multi-currency accounts.
            </p>
            <img src="/service4.png" alt="Multi-currencies" className="w-full h-auto rounded-lg" />
          </div>

          <div className="bg-green-500 text-white p-8 flex flex-col justify-center items-center rounded-2xl shadow-lg w-full md:w-1/3">
            <h1 className="text-3xl font-bold">
              Visit Our Services Page
            </h1>
          </div>
        </div>
          <div className="text-center mt-16 w-full items-center flex justify-center ">
        <div className="relative flex items-center">
          <button className="bg-white border border-[#00B512] hover:bg-[#e7e5e5] text-black font-semibold py-4 px-8 rounded-full flex items-center justify-between space-x-4 transition duration-300 ease-in-out">
            <span>View More</span>
            <div className="w-6 h-6 bg-[#00B512] text-white rounded-full flex items-center justify-center transform rotate-150 transition duration-300 ease-in-out">
              <MdArrowOutward className="text-xl" />
            </div>
          </button>
        </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
