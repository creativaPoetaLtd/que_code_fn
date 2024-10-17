'use client'
import { useState } from 'react';
import ImageSection from '../../ImageSection';

const MultiStepFormFacility = () => {
  const [step, setStep] = useState(1);
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen w-full flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white  h-screen rounded-lg w-full  my-auto justify-center flex">
        {/* Left side: Form */}
        <div className="lg:w-1/2 md:px-16 px-4  my-auto justify-center flex flex-col">
          <h1 className="text-2xl font-bold mb-4">You are amazing 👋</h1>
          <p className="text-gray-600 mb-8">Today is a new day. {`It's`} your day. You shape it.</p>

          {/* Step Indicator */}
          <div className="flex w-full mx-auto justify-center items-center mb-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex mx-auto justify-center  w-full items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    step >= item ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  {item}
                </div>
                {item !== 3 && (
                  <div
                    className={`w-10 h-1 ${step >= item ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Steps */}
          {step === 1 && (
            <div className='my-auto'>
              <h2 className="text-xl font-semibold mb-4">Organization Information Details</h2>
              <p className="text-gray-600 mb-6">
                Please fill your information so we can get in touch with you.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Organization Name"
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  placeholder="Choose Type"
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="email"
                  placeholder="Organization Email"
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="email"
                  placeholder="Owner Email"
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  placeholder="Organization Phone"
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  placeholder="TIN Number"
                  className="border p-2 rounded-lg w-full outline-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Address</h2>
              <p className="text-gray-600 mb-6">
                Please fill your information to know where you are.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Country"
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  placeholder="City"
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  placeholder="District"
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  placeholder="Street"
                  className="border p-2 rounded-lg w-full outline-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Documents</h2>
              <p className="text-gray-600 mb-6">Upload Operational license document and Logo.</p>
              <div className="border-dashed border-2 border-gray-300 rounded-lg p-4">
                <input type="file" className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <span className="block text-2xl">📁</span>
                    <p className="mt-2 text-gray-600">Select a file or drag and drop here</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              >
                Previous
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={nextStep}
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={() => alert('Form submitted')}
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                Submit
              </button>
            )}
          </div>
          <p className="mt-2 text-gray-500 text-center">Already have an account? <a href="/auth/login" className="text-green-500">Sign in</a></p>
        </div>
        <ImageSection url="/art3.png" />
      </div>
    </div>
  );
};

export default MultiStepFormFacility;
