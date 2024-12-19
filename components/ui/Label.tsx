import React from "react";

interface LabelProps {
    htmlFor?: string;
    children: React.ReactNode;
    className?: string;
}

const Label: React.FC<LabelProps> = ({ htmlFor, children, className, ...props }) => {
    return (
        <label
            htmlFor={htmlFor}
            className={`block text-sm font-semibold text-gray-700 ${className || ''}`}
        >
            {children}
        </label>
    )
}

export default Label;