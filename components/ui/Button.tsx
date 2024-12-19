'use client'
import React from "react"
import { Button as AntButton, ButtonProps } from "antd"

interface CustomButtonProps extends ButtonProps {
    className?: string;
}

const Button: React.FC<CustomButtonProps> = ({ className, ...props }) => {
    return (
        <AntButton {...props} className={`rounded-lg py-6 text-lg bg-[#00B512] hover:bg-[#1fd331] transition-colors duration-500 ease-in-out ${className}`} />
    )
}

export default Button;