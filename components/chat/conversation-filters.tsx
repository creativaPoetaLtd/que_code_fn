'use client'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type FilterType = "all" | "users" | "groups"

interface ConversationFiltersProps {
    activeFilter: FilterType
    onFilterChange: (filter: FilterType) => void
    totalCount: number
    userCount: number
    groupCount: number
}

export default function ConversationFilters({
    activeFilter,
    onFilterChange,
    totalCount,
    userCount,
    groupCount,
}: ConversationFiltersProps) {
    return (
        <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                Conversations
            </p>
            <Tabs 
                value={activeFilter} 
                onValueChange={(value) => onFilterChange(value as FilterType)}
            >
                <TabsList className="grid w-full grid-cols-3 h-8 bg-gray-100">
                    <TabsTrigger 
                        value="all" 
                        className="text-xs data-[state=active]:bg-white data-[state=active]:text-[#00B512]"
                    >
                        All ({totalCount})
                    </TabsTrigger>
                    <TabsTrigger 
                        value="users" 
                        className="text-xs data-[state=active]:bg-white data-[state=active]:text-[#00B512]"
                    >
                        Users ({userCount})
                    </TabsTrigger>
                    <TabsTrigger 
                        value="groups" 
                        className="text-xs data-[state=active]:bg-white data-[state=active]:text-[#00B512]"
                    >
                        Groups ({groupCount})
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    )
}