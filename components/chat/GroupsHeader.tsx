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
                        className="bg-green-50 text-green-700 border-green-200 px-3 py-1"
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
                        className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
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
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Search size={16} />
                    <span>
                        Searching for "<span className="font-medium text-gray-900">{searchTerm}</span>"
                    </span>
                </div>
            )}
        </div>
    )
}