'use client'
import React from 'react';
import { Input as AntInput, InputProps } from 'antd';

interface CustomInputProps extends InputProps {
    className?: string;
}

const Input: React.FC<CustomInputProps> = ({ className, ...props }) => {
    return (
        <AntInput 
            {...props} 
            className={`p-4 rounded-md focus:ring-[#00B512] focus:border-[#00B512] 
            dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light 
            dark:placeholder-gray-500 dark:focus:border-green-600 dark:focus:ring-green-600 
            ${className}`} 
        />
    )
}

export default Input;