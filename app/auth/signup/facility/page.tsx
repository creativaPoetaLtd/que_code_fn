'use client';
import { useState } from 'react';
import axios from 'axios';
import ImageSection from '../../ImageSection';
import { useRouter } from 'next/navigation';
import { notification } from 'antd';
import type { NotificationArgsProps } from 'antd';
import baseUrl from '@/helpers/baseUrl';
import { useRegisterOrganizationMutation, useGetOrganizationCategoriesQuery } from '@/states/authentication';

type NotificationPlacement = NotificationArgsProps['placement'];

interface FormData {
  name: string;
  type: string;
  email: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  contactPhone: string;
  tinNumber: string;
  password: string;
}

interface FormErrors {
  [key: string]: string;
}

interface OrganizationCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const MultiStepFormFacility = () => {
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    email: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    contactPhone: '',
    tinNumber: '',
    password: '',
  });
  const router = useRouter();
  const [registerOrganization, { isLoading }] = useRegisterOrganizationMutation();
  const { data: categories, isLoading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useGetOrganizationCategoriesQuery({});
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Required fields validation
    if (!formData.name.trim()) errors.name = 'Organization name is required';
    if (!formData.type) errors.type = 'Facility type is required';
    if (!formData.email.trim()) errors.email = 'Organization email is required';
    if (!formData.ownerName.trim()) errors.ownerName = 'Owner name is required';
    if (!formData.ownerEmail.trim()) errors.ownerEmail = 'Owner email is required';
    if (!formData.ownerPhone.trim()) errors.ownerPhone = 'Owner phone is required';
    if (!formData.contactPhone.trim()) errors.contactPhone = 'Contact phone is required';
    if (!formData.tinNumber.trim()) errors.tinNumber = 'TIN number is required';
    if (!formData.password.trim()) errors.password = 'Password is required';
    
    // Categories loading validation
    if (categoriesLoading) {
      errors.type = 'Please wait for categories to load';
    } else if (categoriesError) {
      errors.type = 'Failed to load categories. Please refresh the page';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (formData.ownerEmail && !emailRegex.test(formData.ownerEmail)) {
      errors.ownerEmail = 'Please enter a valid owner email address';
    }
    
    // Password strength validation
    if (formData.password && passwordStrength !== 'Strong') {
      errors.password = 'Password must be strong (8+ characters, uppercase, number)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handlePasswordBlur = () => {
    checkPasswordStrength(formData.password);
  };

  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      notification.error({
        message: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        placement: 'topRight' as NotificationPlacement,
      });
      return;
    }

    setLoading(true);

    try {
      // Create JSON data for submission
      const data = {
        name: formData.name,
        type: formData.type,
        email: formData.email,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerEmail: formData.ownerEmail,
        contactPhone: formData.contactPhone,
        tinNumber: formData.tinNumber,
        password: formData.password,
      };

      const response = await registerOrganization(data).unwrap();
      
      notification.success({
        message: 'Success',
        description: 'Organization registered successfully. Please check your email for verification.',
        placement: 'topRight' as NotificationPlacement,
      });
      
      // Redirect to OTP page with organization email
      const queryParams = new URLSearchParams({
        email: formData.email,
        type: 'organization'
      });
      
      // Add organization ID if available in response
      if (response?.data?.id) {
        queryParams.append('orgId', response.data.id);
      }
      
      // Add token if available in response
      if (response?.data?.token) {
        queryParams.append('token', response.data.token);
      }
      
      router.push(`/auth/otp?${queryParams.toString()}`);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'An error occurred during registration';
      
      // Handle different error types
      if (error?.status === 400) {
        errorMessage = error?.data?.message || 'Invalid data provided';
      } else if (error?.status === 401) {
        errorMessage = 'Authentication failed';
      } else if (error?.status === 403) {
        errorMessage = 'Email verification required';
      } else if (error?.status === 409) {
        errorMessage = 'Organization with this email already exists';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      notification.error({
        message: 'Registration Failed',
        description: errorMessage,
        placement: 'topRight' as NotificationPlacement,
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white h-screen rounded-lg w-full my-auto justify-center flex">
        <div className="lg:w-1/2 md:px-16 px-4 my-auto justify-center flex flex-col">
          <h1 className="text-2xl font-bold mb-4">You are amazing 👋</h1>
          <p className="text-gray-600 mb-8">Today is a new day. {`It's`} your day. You shape it.</p>

          {/* Organization Registration Form */}
            <div className='my-auto'>
            <h2 className="text-xl font-semibold mb-4">Organization Registration</h2>
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                <input
                  type="text"
                  name="name"
                      placeholder="Organization Name *"
                      value={formData.name}
                  onChange={handleInputChange}
                      className={`border p-2 rounded-lg w-full outline-none ${formErrors.name ? 'border-red-500' : ''}`}
                />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                <input
                  type="password"
                  name="password"
                      placeholder="Password *"
                      value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handlePasswordBlur}
                      className={`border p-2 rounded-lg w-full outline-none ${formErrors.password ? 'border-red-500' : ''}`}
                />
                {passwordStrength && (
                  <p className={`text-sm ${passwordStrength === 'Strong' ? 'text-green-600' : 'text-red-600'}`}>
                    Password Strength: {passwordStrength}
                  </p>
                )}
                    {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <select 
                      name="type" 
                      value={formData.type}
                      onChange={handleInputChange} 
                      disabled={categoriesLoading}
                      className={`border p-2 rounded-lg w-full outline-none ${formErrors.type ? 'border-red-500' : ''} ${categoriesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="">
                        {categoriesLoading ? 'Loading categories...' : 'Select Facility Type *'}
                      </option>
                      {categories?.map((category: OrganizationCategory) => (
                        <option key={category.id} value={category.id} title={category.description}>
                          {category.name}
                        </option>
                      ))}
                </select>
                    {formErrors.type && <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>}
                    {categoriesError && (
                      <div className="text-red-500 text-xs mt-1">
                        <p>Failed to load categories.</p>
                        <button 
                          onClick={() => refetchCategories()}
                          className="text-blue-500 underline hover:text-blue-700 mt-1"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                <input
                  type="email"
                  name="email"
                      placeholder="Organization Email *"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`border p-2 rounded-lg w-full outline-none ${formErrors.email ? 'border-red-500' : ''}`}
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="ownerName"
                      placeholder="Owner Name *"
                      value={formData.ownerName}
                  onChange={handleInputChange}
                      className={`border p-2 rounded-lg w-full outline-none ${formErrors.ownerName ? 'border-red-500' : ''}`}
                />
                    {formErrors.ownerName && <p className="text-red-500 text-xs mt-1">{formErrors.ownerName}</p>}
                  </div>
                  <div>
                <input
                  type="email"
                  name="ownerEmail"
                      placeholder="Owner Email *"
                      value={formData.ownerEmail}
                  onChange={handleInputChange}
                      className={`border p-2 rounded-lg w-full outline-none ${formErrors.ownerEmail ? 'border-red-500' : ''}`}
                    />
                    {formErrors.ownerEmail && <p className="text-red-500 text-xs mt-1">{formErrors.ownerEmail}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                <input
                  type="text"
                  name="ownerPhone"
                      placeholder="Owner Phone *"
                      value={formData.ownerPhone}
                      onChange={handleInputChange}
                      className={`border p-2 rounded-lg w-full outline-none ${formErrors.ownerPhone ? 'border-red-500' : ''}`}
                    />
                    {formErrors.ownerPhone && <p className="text-red-500 text-xs mt-1">{formErrors.ownerPhone}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="contactPhone"
                      placeholder="Contact Phone *"
                      value={formData.contactPhone}
                  onChange={handleInputChange}
                      className={`border p-2 rounded-lg w-full outline-none ${formErrors.contactPhone ? 'border-red-500' : ''}`}
                    />
                    {formErrors.contactPhone && <p className="text-red-500 text-xs mt-1">{formErrors.contactPhone}</p>}
                  </div>
                </div>
                
              <div className="grid grid-cols-1 gap-4">
                  <div>
                <input
                  type="text"
                  name="tinNumber"
                      placeholder="TIN Number *"
                      value={formData.tinNumber}
                      onChange={handleInputChange}
                      className={`border p-2 rounded-lg w-full outline-none ${formErrors.tinNumber ? 'border-red-500' : ''}`}
                    />
                    {formErrors.tinNumber && <p className="text-red-500 text-xs mt-1">{formErrors.tinNumber}</p>}
                  </div>
                </div>
              </div>
            </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
              <button
                disabled={isLoading || loading}
                onClick={handleSubmit}
              className={`bg-green-500 text-white px-8 py-3 rounded-lg 
                  ${(isLoading || loading) ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
              >
              {(isLoading || loading) ? 'Creating Organization...' : 'Create Organization'}
              </button>
          </div>
        </div>
        <ImageSection url="/Images/art3.png" />
      </div>
    </div>
  );
};

export default MultiStepFormFacility;
