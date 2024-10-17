'use client'
import React, { useState } from 'react';
import ImageSection from '../../ImageSection';

const MultiStepForm: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);

    // Proceed to the next step
    const nextStep = () => {
        setCurrentStep(currentStep + 1);
    };

    // Go back to the previous step
    const prevStep = () => {
        setCurrentStep(currentStep - 1);
    };

    // Form contents for each step
    const steps = [
        {
            title: 'Contact details',
            content: (
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-full">
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                placeholder="John"
                                className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div className="w-full">
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                placeholder="Doe"
                                className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="johndoe@example.com"
                            className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                        </label>
                        <input
                            type="text"
                            id="phone"
                            placeholder="+250"
                            className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: 'Address',
            content: (
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-full">
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                                Country
                            </label>
                            <input
                                type="text"
                                id="country"
                                placeholder="Rwanda"
                                className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div className="w-full">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                City
                            </label>
                            <input
                                type="text"
                                id="city"
                                placeholder="Kigali"
                                className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-full">
                            <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                                District
                            </label>
                            <input
                                type="text"
                                id="district"
                                placeholder="Nyarugenge"
                                className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div className="w-full">
                            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                                Postal Code
                            </label>
                            <input
                                type="text"
                                id="postalCode"
                                placeholder="Doe"
                                className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                            Street
                        </label>
                        <input
                            type="text"
                            id="street"
                            placeholder="KN 255"
                            className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: 'Documents',
            content: (
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Upload National ID or Driving license Document
                    </label>
                    <div className="flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                        <input type="file" className="hidden" id="file" />
                        <label htmlFor="file" className="cursor-pointer">
                            <span className="flex items-center  justify-center h-12 w-full rounded-full bg-gray-100">
                                📁
                            </span>
                            <p className="mt-1 text-sm text-gray-600">
                                Select a file or drag and drop here (PDF, JPG, PNG)
                            </p>
                        </label>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="flex h-screen">
            <div className=" lg:w-1/2 md:px-16 px-4 flex flex-col my-auto justify-center bg-white h-full rounded-lg shadow-lg">
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        {steps.map((step, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full text-center my-auto flex justify-center items-center font-bold text-white ${currentStep === index
                                        ? 'bg-green-500'
                                        : index < currentStep
                                            ? 'bg-green-300'
                                            : 'bg-gray-300'
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="w-16 border-t-2 border-gray-300"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step content */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">{steps[currentStep].title}</h2>
                    {steps[currentStep].content}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between">
                    {currentStep > 0 && (
                        <button
                            onClick={prevStep}
                            className="bg-green-500 text-white py-2 px-4 rounded-md"
                        >
                            Previous
                        </button>
                    )}
                    {currentStep < steps.length - 1 ? (
                        <button
                            onClick={nextStep}
                            className="bg-green-500 text-white py-2 px-4 rounded-md"
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            onClick={() => alert('Form submitted')}
                            className="bg-green-500 text-white py-2 px-4 rounded-md"
                        >
                            Submit
                        </button>
                    )}
                </div>
                <div className='mt-6 text-sm text-center'>
                    Already have an account? <a href='/auth/login' className='text-green-500 hover:underline'>Sign in</a>
                </div>
                <div className='absolute bottom-8 left-56 text-sm text-center'>
                    © 2024 creativa poeta. All rights reserved.
                </div>

            </div>
            <ImageSection url="/art2.png" />
        </div>
    );
};

export default MultiStepForm;
