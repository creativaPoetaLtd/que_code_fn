'use client'
import React from 'react';
import { Input as AntInput, InputProps } from 'antd';

interface CustomInputProps extends InputProps {
    className?: string;
}

const Input: React.FC<CustomInputProps> = ({ className, ...props }) => {
    return (
        <AntInput {...props} className={`p-4 rounded-md focus:ring-[#00B512] focus:border-[#00B512] ${className}`} />
    )
}

export default Input;