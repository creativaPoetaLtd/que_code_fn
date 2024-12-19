'use client'
import React from 'react'
import { Input } from 'antd'
import { PasswordProps } from 'antd/es/input'

interface CustomPasswordProps extends PasswordProps {
    className?: string;
}

const InputPassword: React.FC<CustomPasswordProps> = ({ className, ...props }) => {
    return (
        <Input.Password {...props} className={`p-4 rounded-md ${className}`} />
    )
}

export default InputPassword;