'use client';
import React from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { notification } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ImageSection from '../../ImageSection';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from 'antd';
import { useRegisterUserMutation } from '@/states/authentication';
import { ClipLoader } from 'react-spinners';

type FormValues = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    password: string;
    confirmPassword: string;
};

const UserRegister: React.FC = () => {
    const router = useRouter();
    const [registerUser, { isLoading }] = useRegisterUserMutation();
    const { handleSubmit, control, setError } = useForm<FormValues>();

    const onSubmit = async (data: FormValues) => {
        if (data.password !== data.confirmPassword) {
            setError('confirmPassword', { message: 'Passwords do not match' });
            return;
        }

        try {
            await registerUser(data).unwrap();
            notification.success({
                message: 'Success',
                description: 'User registered successfully',
                placement: 'topRight',
            });
            router.push('/auth/otp');
        } catch (error: any) {
            console.log("Error", error);

            const errorMessage = error.data?.message || 'An error occurred';
            notification.error({
                message: 'Error',
                description: errorMessage,
                placement: 'topRight',
            });
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen">
            <div className="flex flex-col justify-center lg:w-1/2 w-full mt-8 md:px-32 px-6">
                <h1 className="text-3xl font-bold">
                    Welcome Back <span role="img" aria-label="wave">👋</span>
                </h1>
                <p className="mt-2 text-gray-600">
                    Today is a new day. {`It's`} your day. You shape it.
                </p>
                <form className="space-y-6 mt-8" onSubmit={handleSubmit(onSubmit)}>
                    {/* First Row */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Controller
                            name="firstName"
                            control={control}
                            rules={{ required: 'First Name is required' }}
                            render={({ field, fieldState }) => (
                                <div className="w-full">
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                        First Name
                                    </label>
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        {...field}
                                        status={fieldState.error ? 'error' : ''}
                                    />
                                    {fieldState.error && (
                                        <span className="text-red-500 text-sm">{fieldState.error.message}</span>
                                    )}
                                </div>
                            )}
                        />
                        <Controller
                            name="lastName"
                            control={control}
                            rules={{ required: 'Last Name is required' }}
                            render={({ field, fieldState }) => (
                                <div className="w-full">
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                        Last Name
                                    </label>
                                    <Input
                                        id="lastName"
                                        placeholder="Doe"
                                        {...field}
                                        status={fieldState.error ? 'error' : ''}
                                    />
                                    {fieldState.error && (
                                        <span className="text-red-500 text-sm">{fieldState.error.message}</span>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                    {/* Second Row */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                required: 'Email is required',
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: 'Invalid email address',
                                },
                            }}
                            render={({ field, fieldState }) => (
                                <div className="w-full">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        placeholder="john@gmail.com"
                                        {...field}
                                        status={fieldState.error ? 'error' : ''}
                                    />
                                    {fieldState.error && (
                                        <span className="text-red-500 text-sm">{fieldState.error.message}</span>
                                    )}
                                </div>
                            )}
                        />
                        <Controller
                            name="gender"
                            control={control}
                            rules={{ required: 'Gender is required' }}
                            render={({ field, fieldState }) => (
                                <div className="w-full">
                                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                        Gender
                                    </label>
                                    <Select
                                        id="gender"
                                        {...field}
                                        placeholder="Select Gender"
                                        className={`w-full ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}
                                        onChange={(value) => field.onChange(value)}
                                        style={{
                                            height: '55px'
                                        }}
                                    >
                                        <Select.Option value="male">Male</Select.Option>
                                        <Select.Option value="female">Female</Select.Option>
                                    </Select>
                                    {fieldState.error && (
                                        <span className="text-red-500 text-sm">{fieldState.error.message}</span>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                    {/* Passwords */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Controller
                            name="password"
                            control={control}
                            rules={{
                                required: 'Password is required',
                                pattern: {
                                    value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&*()!]{8,}$/,
                                    message: 'Password must contain at least 8 characters, one letter, and one number.',
                                },
                            }}
                            render={({ field, fieldState }) => (
                                <div className="w-full">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Password"
                                        {...field}
                                        status={fieldState.error ? 'error' : ''}
                                    />
                                    {fieldState.error && (
                                        <span className="text-red-500 text-sm">{fieldState.error.message}</span>
                                    )}
                                </div>
                            )}
                        />
                        <Controller
                            name="confirmPassword"
                            control={control}
                            rules={{ required: 'Confirm Password is required' }}
                            render={({ field, fieldState }) => (
                                <div className="w-full">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                        Confirm Password
                                    </label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="******"
                                        {...field}
                                        status={fieldState.error ? 'error' : ''}
                                    />
                                    {fieldState.error && (
                                        <span className="text-red-500 text-sm">{fieldState.error.message}</span>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                    <Button
                        htmlType="submit"
                        type="primary"
                        className="w-full !mt-4"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <ClipLoader color='#fffff' size={20} />
                                Registering...
                            </div>
                        ) : (
                            'Sign up'
                        )}
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
                        Already have an account? <Link href="/auth/login" className="text-green-500 hover:underline">Sign in</Link>
                    </p>
                </form>
            </div>
            <ImageSection url="/Images/art3.png" />
        </div>
    );
};

export default UserRegister;
