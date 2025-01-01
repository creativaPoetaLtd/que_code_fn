'use client'

import { notification } from 'antd';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';
import ImageSection from '../ImageSection';
import type { NotificationArgsProps } from 'antd';
import { useResendOtpMutation, useVerifyOtpMutation } from '@/states/authentication';
import Button from '@/components/ui/Button';

type NotificationPlacement = NotificationArgsProps['placement'];

const OTPVerification: React.FC = () => {
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(120);
    const [canResend, setCanResend] = useState(true);
    const router = useRouter();

    const inputRefs = Array(6).fill(0).map(() => useRef<HTMLInputElement>(null));

    const [verifyOtp] = useVerifyOtpMutation();
    const [resendOtp] = useResendOtpMutation();

    useEffect(() => {
        if (timeLeft > 0 && !canResend) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            setCanResend(true);
        }
    }, [timeLeft, canResend]);

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtpValues = [...otpValues];
        pastedData.split('').forEach((char, index) => {
            if (index < 6) newOtpValues[index] = char;
        });
        setOtpValues(newOtpValues);

        if (pastedData.length === 6) {
            inputRefs[5].current?.focus();
        } else if (pastedData.length < 6) {
            inputRefs[pastedData.length]?.current?.focus();
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtpValues = [...otpValues];
        newOtpValues[index] = value;
        setOtpValues(newOtpValues);

        if (value && index < 5) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const submitOTP = async () => {
        const otp = otpValues.join('');
        if (otp.length !== 6) {
            notification.error({
                message: 'Invalid OTP',
                description: 'Please enter a valid 6-digit OTP code.',
                placement: 'topRight' as NotificationPlacement,
            });
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (!token) {
            notification.error({
                message: 'Verification Failed',
                description: 'Missing verification token. Please try again.',
                placement: 'topRight',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await verifyOtp({ otp, token }).unwrap();
            notification.success({
                message: 'OTP Verified',
                description: response.message || 'Your account has been successfully verified.',
                placement: 'topRight' as NotificationPlacement,
            });
            router.push('/auth/login');
        } catch (error: any) {
            notification.error({
                message: 'Verification Failed',
                description: error?.data?.message || 'Invalid OTP code.',
                placement: 'topRight' as NotificationPlacement,
            });
            setOtpValues(['', '', '', '', '', '']);
            inputRefs[0].current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const resendOTP = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (!token || !canResend) return;

        setLoading(true);
        try {
            const response = await resendOtp({ token }).unwrap();
            setTimeLeft(120);
            setCanResend(false);
            setOtpValues(['', '', '', '', '', '']);
            inputRefs[0].current?.focus();
            notification.success({
                message: 'OTP Resent',
                description: response.message || 'A new OTP has been sent to your email.',
                placement: 'topRight' as NotificationPlacement,
            });
        } catch (error: any) {
            notification.error({
                message: 'Failed to Resend OTP',
                description: error?.data?.message || 'Please try again later.',
                placement: 'topRight' as NotificationPlacement,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            <div className="flex flex-col justify-center lg:w-1/2 w-full px-4 md:px-16 lg:px-24">
                <div className="max-w-md mx-auto w-full py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Verify Your Account</h1>
                        <p className="mt-3 text-gray-600">
                            Enter the 6-digit code sent to your email to complete verification.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-4">
                            <div className="flex justify-center gap-3" onPaste={handlePaste}>
                                {otpValues.map((value, index) => (
                                    <input
                                        key={index}
                                        ref={inputRefs[index]}
                                        type="text"
                                        maxLength={1}
                                        value={value}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                                    />
                                ))}
                            </div>

                            <Button
                                onClick={submitOTP}
                                loading={loading}
                                className="w-full h-12 font-semibold text-white"
                            >
                                Verify Account
                            </Button>

                            <div className="flex items-center justify-between pt-4">
                                <Button
                                    type="link"
                                    onClick={resendOTP}
                                    disabled={!canResend || loading}
                                    className="text-white font-medium"
                                >
                                    Resend Code
                                </Button>
                                {!canResend && (
                                    <span className="text-sm text-gray-500 font-medium">
                                        Resend in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <ImageSection url="/Images/art3.png" />
        </div>
    );
};

export default OTPVerification;