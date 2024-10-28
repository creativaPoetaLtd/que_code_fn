'use client'
import { Button, notification } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import axios from 'axios';
import ImageSection from '../../ImageSection';
import type { NotificationArgsProps } from 'antd';
import baseUrl from '@/helpers/baseUrl';

type NotificationPlacement = NotificationArgsProps['placement'];

const UserRegister: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        province: '',
        district: '',
        sector: '',
        gender: '',
        password: '',
        confirmPassword: '',
        national_id: null as File | null,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const validatePasswordWithRegex = (password: string) => {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&*()!]{8,}$/;
        return passwordRegex.test(password);
    };

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    const submitForm = async () => {
        if (!validatePasswordWithRegex(formData.password)) {
            notification.error({
                message: 'Error',
                description: 'Password must contain at least 8 characters, one letter, and one number.',
                placement: 'topRight' as NotificationPlacement,
            });
            return;
        }

        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            notification.error({
                message: 'Error',
                description: 'Passwords do not match',
                placement: 'topRight' as NotificationPlacement,
            });
            return;
        }

        setLoading(true);
        const formPayload = new FormData();
        formPayload.append('firstName', formData.firstName);
        formPayload.append('lastName', formData.lastName);
        formPayload.append('email', formData.email);
        formPayload.append('phone', formData.phone);
        formPayload.append('country', formData.country);
        formPayload.append('province', formData.province);
        formPayload.append('district', formData.district);
        formPayload.append('sector', formData.sector);
        formPayload.append('gender', formData.gender);
        formPayload.append('password', formData.password);
    
        if (formData.national_id) {
            formPayload.append('national_id', formData.national_id);
        }
    
        try {
            await axios.post(
                `${baseUrl}/users/register`,
                formPayload,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            router.push('/auth/otp');
            notification.success({
                message: 'Success',
                description: 'User registered successfully',
                placement: 'topRight' as NotificationPlacement,
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.message || 'An error occurred';
                notification.error({
                    message: 'Error',
                    description: errorMessage,
                    placement: 'topRight' as NotificationPlacement,
                });
            } else {
                notification.error({
                    message: 'Error',
                    description: 'An unexpected error occurred',
                    placement: 'topRight' as NotificationPlacement,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    

    return (
        <div className="flex h-screen">
            <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
                <h1 className="text-3xl font-bold">
                    Welcome Back <span role="img" aria-label="wave">👋</span>
                </h1>
                <p className="mt-2 text-gray-600">
                    Today is a new day. {`It's`} your day. You shape it.
                </p>
                <form className="space-y-4 mt-8">
                    <div className="flex gap-4">
                        <div className="w-full">
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
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
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Doe"
                                className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-full">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="john@gmail.com"
                                className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div className="w-full">
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                Gender
                            </label>
                            <select
                                id="gender"
                                className='mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                                onChange={handleInputChange}
                                value={formData.gender}
                            >
                                <option value="">Select your Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-full">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onBlur={() => {
                                if (!validatePasswordWithRegex(formData.password)) {
                                    notification.error({
                                        message: 'Error',
                                        description: 'Password must contain at least 8 characters, one letter, and one number.',
                                        placement: 'topRight' as NotificationPlacement,
                                    });
                                }
                            }}
                            placeholder="Password"
                            className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />
                        </div>
                        <div className="w-full">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="******"
                                className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                    <Button
                        type="primary"
                        onClick={submitForm}
                        disabled={loading || !formData.firstName || !formData.lastName || !formData.email || !formData?.password || !formData?.confirmPassword}
                        className={`w-full mt-8 bg-green-500 border-none hover:bg-green-600 ${
                            loading || !formData.firstName || !formData.lastName || !formData.email || !formData?.password || !formData?.confirmPassword
                             ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                        Sign in
                    </Button>
                    <div className="flex items-center justify-between my-6">
                        <hr className="w-1/3 border-gray-300" />
                        <span className="text-sm text-gray-400">Or</span>
                        <hr className="w-1/3 border-gray-300" />
                    </div>
                    <Button
                        icon={<GoogleOutlined />}
                        className="w-full flex justify-center items-center border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                        Sign in with Google
                    </Button>
                    <p className="mt-6 text-sm text-center">
                        {`Don't`} have an account? <a href="/auth/signup" className="text-green-500 hover:underline">Sign up</a>
                    </p>
                </form>
            </div>
            <ImageSection url="/art3.png" />
        </div>
    );
};

export default UserRegister;
