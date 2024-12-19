'use client'
import { Button, notification, Input } from 'antd';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import axios from 'axios';
import ImageSection from '../ImageSection';
import type { NotificationArgsProps } from 'antd';
import baseUrl from '@/helpers/baseUrl';

type NotificationPlacement = NotificationArgsProps['placement'];

const OTPVerification: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOtp(e.target.value);
    };
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    }

    const submitOTP = async () => {
        if (otp.length !== 6) {
            notification.error({
                message: 'Invalid OTP',
                description: 'Please enter a valid 4-digit OTP code.',
                placement: 'topRight' as NotificationPlacement,
            });
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${baseUrl}/users/verify-otp`, { otp, email });
            notification.success({
                message: 'OTP Verified',
                description: 'Your account has been successfully verified.',
                placement: 'topRight' as NotificationPlacement,
            });
            router.push('/auth/login');
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                notification.error({
                    message: 'Error',
                    description: error?.response?.data?.message,
                    placement: 'topRight' as NotificationPlacement,
                });
                return;
            }
            if (axios.isAxiosError(error)) {

                notification.error({
                    message: 'Verification Failed',
                    description: error?.response?.data?.message,
                    placement: 'topRight' as NotificationPlacement,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const resendOTP = async () => {
        setLoading(true);
        if (!email) {
            notification.error({
                message: 'Error',
                description: 'Please enter your email to resend OTP.',
                placement: 'topRight' as NotificationPlacement,
            });
            setLoading(false);
            return;
        }
        try {
            await axios.post(`${baseUrl}/users/resend-otp`, { email });
            notification.success({
                message: 'OTP Resent',
                description: 'A new OTP has been sent to your email.',
                placement: 'topRight' as NotificationPlacement,
            });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                notification.error({
                    message: 'Failed to Resend OTP',
                    description: error.response.data?.message,
                    placement: 'topRight' as NotificationPlacement,
                });
            } else {
                notification.error({
                    message: 'Failed to Resend OTP',
                    description: 'An unknown error occurred.',
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
                <h1 className="text-3xl font-bold">OTP Verification</h1>
                <p className="mt-2 text-gray-600">
                    Enter the OTP sent to your email or phone to verify your account.
                </p>
                <form className="space-y-4 mt-8">
                    <div className="w-full">
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <Input
                            type='email'
                            id='email'
                            value={email}
                            onChange={handleEmailChange}
                            placeholder='Enter your email'
                            className='mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                        />
                    </div>
                    <div className="w-full">
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                            OTP Code
                        </label>
                        <Input
                            type="number"
                            id="otp"
                            value={otp}
                            onChange={handleInputChange}
                            maxLength={6}
                            placeholder="Enter OTP"
                            className="mt-1 p-2 block w-full border outline-none border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />

                    </div>

                    <Button
                        type="primary"
                        onClick={submitOTP}
                        loading={loading}
                        disabled={!otp || otp.length !== 6}
                        className="w-full mt-8 bg-green-500 border-none hover:bg-green-600"
                    >
                        Verify OTP
                    </Button>
                    <Button
                        type="link"
                        onClick={resendOTP}
                        disabled={loading}
                        className="w-full mt-4 text-center text-green-500 hover:underline"
                    >
                        Resend OTP
                    </Button>
                </form>
            </div>
            <ImageSection url="/Images/art3.png" />
        </div>
    );
};

export default OTPVerification;
