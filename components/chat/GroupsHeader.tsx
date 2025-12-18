'use client'

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Filter } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface GroupsHeaderProps {
    groupsCount: number
    searchTerm: string
    onSearchChange: (value: string) => void
}

export default function GroupsHeader({ groupsCount, searchTerm, onSearchChange }: GroupsHeaderProps) {
    return (
        <div className="space-y-6">
            {/* Title Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <Users size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
                        <p className="text-sm text-gray-500">
                            {groupsCount > 0 ? (
                                <>Manage your {groupsCount} group{groupsCount !== 1 ? 's' : ''}</>
                            ) : (
                                'Discover and join groups'
                            )}
                        </p>
                    </div>
                </div>

                {groupsCount > 0 && (
                    <Badge
                        variant="secondary"
                        className="bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold border-brand-green/20 dark:border-brand-gold/20 px-3 py-1"
                    >
                        {groupsCount} Total
                    </Badge>
                )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search groups by name or description..."
                        className="pl-10 h-11 border-gray-200 dark:border-darkBorder-light focus:border-brand-green dark:focus:border-brand-gold focus:ring-brand-green/20 dark:focus:ring-brand-gold/20"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <Button
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 h-11 px-4"
                >
                    <Filter size={18} className="mr-2" />
                    Filters
                </Button>
            </div>

            {/* Search Results Info */}
            {searchTerm && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Search size={16} />
                    <span>
                        Searching for "<span className="font-medium text-gray-900 dark:text-white">{searchTerm}</span>"
                    </span>
                </div>
            )}
        </div>
    )
}