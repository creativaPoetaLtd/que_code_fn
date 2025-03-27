"use client"

import { FileText, DollarSign, MapPin, Calendar } from 'lucide-react'

interface OptionsDropdownProps {
    isOpen: boolean;
    onOptionSelect: (option: string) => void;
}

interface DropdownOption {
    icon: React.ReactNode;
    label: string;
    color: string;
    action: () => void;
}

export default function OptionsDropdown({ isOpen, onOptionSelect }: OptionsDropdownProps) {
    const options: DropdownOption[] = [
        {
            icon: <FileText size={18} />,
            label: "Document",
            color: "text-blue-500",
            action: () => onOptionSelect("Document"),
        },
        {
            icon: <DollarSign size={18} />,
            label: "Send Money",
            color: "text-green-500",
            action: () => onOptionSelect("Send Money"),
        },
        {
            icon: <MapPin size={18} />,
            label: "Location",
            color: "text-red-500",
            action: () => onOptionSelect("Location"),
        },
        {
            icon: <Calendar size={18} />,
            label: "Schedule",
            color: "text-purple-500",
            action: () => onOptionSelect("Schedule"),
        },
    ]

    if (!isOpen) return null

    return (
        <div className="absolute bottom-16 left-0 z-50 min-w-48">
            <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden transform origin-bottom-left transition-all duration-200 ease-out animate-dropdown">
                {options.map((option, index) => (
                    <div
                        key={index}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out"
                        onClick={option.action}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={`${option.color} mr-3 flex items-center justify-center`}>{option.icon}</div>
                        <span className="text-sm font-medium text-gray-700">{option.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
