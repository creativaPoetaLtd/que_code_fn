'use client';
import { useState } from 'react';
import axios from 'axios';
import ImageSection from '../../ImageSection';
import { useRouter } from 'next/navigation';
import { notification } from 'antd';
import type { NotificationArgsProps } from 'antd';
import baseUrl from '@/helpers/baseUrl';

type NotificationPlacement = NotificationArgsProps['placement'];

interface FormData {
  name: string;
  type: string;
  email: string;
  ownerPhone: string;
  ownerEmail: string;
  contactPhone: string;
  tinNumber: string;
  registrationNumber: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  logo?: null | string;
  operationalDocument?: null | string;
  password: string;
}

const MultiStepFormFacility = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    email: '',
    ownerPhone: '',
    ownerEmail: '',
    contactPhone: '',
    tinNumber: '',
    registrationNumber: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    logo: null,
    operationalDocument: null,
    password: '',
  });
  const router = useRouter();
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };
  const checkPasswordStrength = (password: string) => {
    if (password.length < 8) {
      setPasswordStrength('Weak');
    } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordStrength('Moderate');
    } else {
      setPasswordStrength('Strong');
    }
  };
  const handlePasswordBlur = () => {
    checkPasswordStrength(formData.password);
  };
  const handleSubmit = async () => {
    if (passwordStrength !== 'Strong') {
      notification.error({
        message: 'Password Strength Error',
        description: 'Password is not strong enough.',
        placement: 'topRight' as NotificationPlacement,
      });
      return;
    }
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'logo' || key === 'operationalDocument') {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      } else {
        data.append(key, formData[key as keyof FormData] as string);
      }
    });
    try {
      await axios.post(`${baseUrl}/organizations/register`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      router.push('/auth/login');
      setLoading(false);
      notification.success({
        message: 'Success',
        description: 'Organization registered successfully',
        placement: 'topRight' as NotificationPlacement,
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.message || 'An error occurred';
        notification.error({
          message: 'Error',
          description: errorMessage,
          placement: 'topRight' as NotificationPlacement,
        });
      }
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white h-screen rounded-lg w-full my-auto justify-center flex">
        <div className="lg:w-1/2 md:px-16 px-4 my-auto justify-center flex flex-col">
          <h1 className="text-2xl font-bold mb-4">You are amazing 👋</h1>
          <p className="text-gray-600 mb-8">Today is a new day. {`It's`} your day. You shape it.</p>
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
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Organization Name"
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg w-full outline-none"
                />
                   <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={handleInputChange}
                  onBlur={handlePasswordBlur}
                  className="border p-2 rounded-lg w-full outline-none"
                />
                {passwordStrength && (
                  <p className={`text-sm ${passwordStrength === 'Strong' ? 'text-green-600' : 'text-red-600'}`}>
                    Password Strength: {passwordStrength}
                  </p>
                )}
                <select name="type" onChange={handleInputChange} className="border p-2 rounded-lg w-full outline-none">
                  <option value="">Select Facility Type</option>
                  <option value="church">Church</option>
                  <option value="school">School</option>
                  <option value="shop">Shop</option>
                </select>
                <input
                  type="email"
                  name="email"
                  placeholder="Organization Email"
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="email"
                  name="ownerEmail"
                  placeholder="Owner Email"
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  name="ownerPhone"
                  placeholder="Organization Phone"
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  name="tinNumber"
                  placeholder="TIN Number"
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg w-full outline-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl  gap-4  flex flex-col skew-y-2 font-semibold mb-4">Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="province"
                  placeholder="Province"
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  name="district"
                  placeholder="District"
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg w-full outline-none"
                />
              </div>
              <div className="grid grid-cols-2 mt-4 gap-4">
                <input
                  type="text"
                  name="Sector"
                  placeholder="sector"
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg w-full outline-none"
                />
                <input
                  type="text"
                  name="cell"
                  placeholder="Cell"
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg w-full outline-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Documents</h2>
              <p className="text-gray-600 mb-6">Upload Operational license document and Logo.</p>
              <input
                type="file"
                name="logo"
                onChange={handleFileChange}
                className="border p-2 rounded-lg w-full outline-none"
              />
              <input
                type="file"
                name="operationalDocument"
                onChange={handleFileChange}
                className="border p-2 mt-4 rounded-lg w-full outline-none"
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <button onClick={prevStep} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                Previous
              </button>
            )}
            {step < 3 ? (
              <button onClick={nextStep} className="bg-green-500 text-white px-4 py-2 rounded-lg">
                Next Step
              </button>
            ) : (
              <button
              disabled={loading}
               onClick={handleSubmit} className={`bg-green-500 text-white px-4 py-2 rounded-lg 
                ${loading ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
                {
                  loading ? 'Loading...' : 'Submit'
                }
              </button>
            )}
          </div>
        </div>
        <ImageSection url="/Images/art3.png" />
      </div>
    </div>
  );
};

export default MultiStepFormFacility;
