'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { notification, Upload, UploadFile } from 'antd';
import { GoogleOutlined, InboxOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ImageSection from '../../ImageSection';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from 'antd';
import { useRegisterUserMutation } from '@/states/authentication';
import { ClipLoader } from 'react-spinners';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'

type FormValues = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    password: string;
    confirmPassword: string;
    // national_id?: UploadFile[];
};

const steps = [
    {
        title: 'Contact Details',
        description: 'Please fill your information so we can get in touch with you.'
    },
    {
        title: 'Security',
        description: 'Set up your account security.'
    },
];

const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
    <div className="flex items-center justify-center mt-8 mb-8">
        {steps.map((step, index) => (
            <React.Fragment key={index}>
                <div className="flex items-center transition-all duration-500">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center
                        ${currentStep === index
                            ? 'bg-[#00B512] text-white'
                            : currentStep > index
                                ? 'bg-[#00B512] text-[#ffff]'
                                : 'bg-gray-200 text-gray-500'
                        }`}
                        style={{
                            transition: 'all 0.9s ease-in-out',
                            transform: currentStep === index ? 'scale(1.2)' : 'scale(1)',
                        }}>
                        {currentStep > index ? '✓' : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`w-24 h-1 ml-4 transition-all duration-1500
                            ${currentStep > index ? 'bg-[#00B512]' : 'bg-gray-200'}`}
                        />
                    )}
                </div>
            </React.Fragment>
        ))}
    </div>
);


const UserRegister: React.FC = () => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [registerUser, { isLoading }] = useRegisterUserMutation();
    const { handleSubmit, control, setError } = useForm<FormValues>();
    // const [fileList, setFileList] = useState<UploadFile[]>([]);
    const onSubmit = async (data: FormValues) => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            return;
        }

        if (data.password !== data.confirmPassword) {
            setError('confirmPassword', { message: 'Passwords do not match' });
            return;
        }

        try {
            const formData = new FormData();
            Object.keys(data).forEach((key) => {
                // Add type assertion to key
                const typedKey = key as keyof FormValues;
                if (typedKey !== 'confirmPassword') {
                    formData.append(typedKey, data[typedKey] as string);
                }
            });

            // if (fileList[0]?.originFileObj) {
            //     formData.append('national_id', fileList[0].originFileObj);
            // }
            await registerUser(formData).unwrap();
            notification.success({
                message: 'Success',
                description: 'User registered successfully Check your email inbox to verify your account',
                placement: 'topRight',
            });
            // router.push('/auth/otp');
        } catch (error: any) {
            const errorMessage = error.data?.message || 'An error occurred';
            notification.error({
                message: 'Error',
                description: errorMessage,
                placement: 'topRight',
            });
        }
    };

    const ContactDetailsStep = (
        <>
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
                name="phone"
                control={control}
                rules={{ required: 'Phone number is required' }}
                render={({ field, fieldState }) => (
                    <div className="w-full">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone Number
                        </label>
                        <PhoneInput
                            country="us"
                            value={field.value}
                            onChange={field.onChange}
                            inputStyle={{
                                width: '100%',
                                borderColor: fieldState.error ? 'red' : '#d9d9d9',
                                height: '55px',
                            }}
                            containerStyle={{ marginBottom: '8px' }}
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
                            style={{ height: '55px' }}
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
        </>
    );

    // const DocumentUploadStep = (
    //     <div className="w-full">
    //         <label className="block text-sm font-medium text-gray-700 mb-2">
    //             Upload National ID or Driving License
    //         </label>
    //         <Upload.Dragger
    //             name="file"
    //             multiple={false}
    //             accept=".pdf,.jpg,.png"
    //             fileList={fileList}
    //             beforeUpload={() => false}
    //             onChange={({ fileList: newFileList }) => {
    //                 setFileList(newFileList);
    //             }}
    //             maxCount={1}
    //         >
    //             <p className="ant-upload-drag-icon">
    //                 <InboxOutlined />
    //             </p>
    //             <p className="ant-upload-text">
    //                 Click or drag file to this area to upload
    //             </p>
    //             <p className="ant-upload-hint">
    //                 Support for a single upload. Only .pdf, .jpg, or .png files allowed.
    //                 Maximum file size: 5MB
    //             </p>
    //         </Upload.Dragger>
    //         {fileList.length > 0 && (
    //             <div className="mt-2">
    //                 <p className="text-sm text-gray-500">
    //                     Selected file: {fileList[0].name}
    //                 </p>
    //             </div>
    //         )}
    //     </div>
    // );

    const SecurityStep = (
        <>
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
        </>
    );

    const stepContent = [
        ContactDetailsStep,
        SecurityStep,
        // DocumentUploadStep,
    ];

    return (
        <div className="flex flex-col lg:flex-row h-screen">
            <div className="flex flex-col justify-center lg:w-1/2 w-full mt-8 md:px-32 px-6">
                <h1 className="text-3xl font-bold">
                    Welcome Back <span role="img" aria-label="wave">👋</span>
                </h1>
                <p className="mt-2 text-gray-600">
                    {steps[currentStep].description}
                </p>

                <StepIndicator currentStep={currentStep} />

                <form className="space-y-6 mt-8 transition-opacity duration-500" onSubmit={handleSubmit(onSubmit)} >
                    {stepContent[currentStep]}

                    <div className="flex gap-4">
                        {currentStep > 0 && (
                            <Button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="w-full text-white"
                            >
                                Previous
                            </Button>
                        )}
                        <Button
                            htmlType="submit"
                            type="primary"
                            className="w-full"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <ClipLoader color='#ffffff' size={20} />
                                    <span className="ml-2">Processing...</span>
                                </div>
                            ) : currentStep === steps.length - 1 ? (
                                'Complete Registration'
                            ) : (
                                'Next Step'
                            )}
                        </Button>
                    </div>

                    {currentStep === 0 && (
                        <>
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
                        </>
                    )}

                    <p className="mt-6 text-sm text-center">
                        Already have an account? <Link href="/auth/login" className="text-[#00B512] hover:underline">Sign in</Link>
                    </p>
                </form>
            </div>
            <ImageSection url="/Images/MirrorHouse.jpg" />
        </div>
    );
};

export default UserRegister;