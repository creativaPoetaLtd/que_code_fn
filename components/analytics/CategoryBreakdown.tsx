'use client'
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { DateRange } from '@/types/analytics.types'
import { useAnalyticsCategoryBreakdown } from '@/hooks/use-analytics'
import CategoryTransactionPopover from './CategoryTransactionPopover'

interface CategoryData {
    name: string
    value: number
    color: string
    amount: number
    categoryId: string
    transactionCount: number
}

interface CategoryBreakdownProps {
    dateRange: DateRange;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ dateRange }) => {
    const [filterType, setFilterType] = useState<'expenses' | 'income'>('expenses')
    const { data = [], loading, error } = useAnalyticsCategoryBreakdown(dateRange, filterType)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // Color palette for categories
    const colors = ['#1e40af', '#f97316', '#e11d48', '#059669', '#7c3aed', '#0891b2', '#dc2626', '#ca8a04']

    const categoryData: CategoryData[] = (data || []).map((item, index) => ({
        name: item.categoryName,
        value: item.percentage,
        color: colors[index % colors.length],
        amount: item.totalAmount,
        categoryId: item.categoryId,
        transactionCount: item.transactionCount
    }))

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0]
            return (
                <div className="bg-white dark:bg-gray-900 p-3 border border-gray-200 dark:border-darkBorder-light rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900 dark:text-white">{data.payload.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        RWF {data.payload.amount.toLocaleString()} ({data.value}%)
                    </p>
                </div>
            )
        }
        return null
    }

    if (loading) {
        return (
            <Card className="p-3.5 lg:p-4 h-full animate-pulse dark:bg-darkBg-card">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                <div className="flex items-center gap-4 mt-3">
                    <div className="w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] shrink-0 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1 space-y-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-4 text-center text-red-600 dark:text-red-400 dark:bg-darkBg-card">
                <p>Error loading category breakdown</p>
            </Card>
        )
    }

    if (categoryData.length === 0) {
        return (
            <Card className="p-4 text-center text-gray-500 dark:text-gray-400 dark:bg-darkBg-card">
                <p>No category data available for the selected period</p>
            </Card>
        )
    }

    return (
        <Card className="p-3.5 lg:p-4 h-full dark:bg-darkBg-card">
            <div className="flex justify-between items-center gap-3">
                <h3 className="text-[15px] lg:text-base font-semibold text-gray-900 dark:text-white">Spending by category</h3>
                <div className="flex gap-0.5 p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                    {(['expenses', 'income'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            aria-pressed={filterType === type}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                filterType === type
                                    ? 'bg-white dark:bg-darkBg-card text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {type === 'expenses' ? 'Expenses' : 'Income'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-5 mt-3" role="region" aria-label="Category spending breakdown">
                {/* Donut Chart */}
                <div className="w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] shrink-0" role="img" aria-label="Interactive pie chart showing spending by category">
                    <CategoryTransactionPopover
                        categoryId={selectedCategory}
                        categoryName={categoryData.find(cat => cat.categoryId === selectedCategory)?.name || ''}
                        dateRange={dateRange}
                        transactionCount={categoryData.find(cat => cat.categoryId === selectedCategory)?.transactionCount || 0}
                    >
                        <div className="w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="60%"
                                        outerRadius="100%"
                                        paddingAngle={2}
                                        dataKey="value"
                                        onClick={(_, index) => {
                                            const categoryId = categoryData[index]?.categoryId || null
                                            setSelectedCategory(selectedCategory === categoryId ? null : categoryId)
                                        }}
                                        tabIndex={-1}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CategoryTransactionPopover>
                </div>

                {/* Category List */}
                <div className="flex-1 min-w-0">
                    <div className="divide-y divide-gray-100 dark:divide-darkBorder-light" role="list" aria-label="Category list with spending amounts">
                        {categoryData.map((category, index) => (
                            <CategoryTransactionPopover
                                key={index}
                                categoryId={category.categoryId}
                                categoryName={category.name}
                                dateRange={dateRange}
                                transactionCount={category.transactionCount}
                            >
                                <div
                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40 focus:bg-gray-50 dark:focus:bg-gray-900/40 rounded-md px-1.5 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-offset-darkBg-card"
                                    onClick={() => {
                                        setSelectedCategory(selectedCategory === category.categoryId ? null : category.categoryId)
                                    }}
                                    role="listitem"
                                    tabIndex={0}
                                    aria-label={`${category.name}: RWF ${category.amount.toLocaleString()} (${category.value}%) - Click to view transactions`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            setSelectedCategory(selectedCategory === category.categoryId ? null : category.categoryId)
                                        }
                                    }}
                                >
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: category.color }}
                                        aria-hidden="true"
                                    />
                                    <span className="flex-1 min-w-0 truncate text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                                    <span className="hidden sm:inline text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                        RWF {category.amount.toLocaleString()}
                                    </span>
                                    <span className="w-10 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{category.value}%</span>
                                </div>
                            </CategoryTransactionPopover>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default CategoryBreakdown
