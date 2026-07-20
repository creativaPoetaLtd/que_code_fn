'use client'

import { Search } from 'lucide-react'
import Input from "../ui/Input-ant"

interface SearchBarProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    placeholder?: string
}

export default function SearchBar({ 
    searchTerm, 
    onSearchChange, 
    placeholder = "Search conversations..." 
}: SearchBarProps) {
    return (
        <div className="relative">
            <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={16}
            />
            <Input
                placeholder={placeholder}
                className="rounded-full bg-gray-100 dark:bg-darkBg-interactive dark:text-white border-0 py-1.5 sm:py-2 pl-9 sm:pl-10 text-sm w-full focus:bg-white dark:focus:bg-darkBg-interactive focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
    )
}