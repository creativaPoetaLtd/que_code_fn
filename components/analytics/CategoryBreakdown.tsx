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
            <Card className="p-6 animate-pulse dark:bg-darkBg-card">
                <div className="mb-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-60"></div>
                </div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-6 text-center text-red-600 dark:text-red-400 dark:bg-darkBg-card">
                <p>Error loading category breakdown</p>
            </Card>
        )
    }

    if (categoryData.length === 0) {
        return (
            <Card className="p-6 text-center text-gray-500 dark:text-gray-400 dark:bg-darkBg-card">
                <p>No category data available for the selected period</p>
            </Card>
        )
    }

    return (
        <Card className="p-6 dark:bg-darkBg-card">
            <div className="mb-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Spending distribution by categories</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterType('expenses')}
                            className={`px-4 py-2 rounded font-medium transition-colors ${
                                filterType === 'expenses'
                                    ? 'bg-red-600 dark:bg-red-700 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Expenses
                        </button>
                        <button
                            onClick={() => setFilterType('income')}
                            className={`px-4 py-2 rounded font-medium transition-colors ${
                                filterType === 'income'
                                    ? 'bg-green-600 dark:bg-green-700 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Income
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6" role="region" aria-label="Category spending breakdown">
                {/* Donut Chart */}
                <div className="flex-1" role="img" aria-label="Interactive pie chart showing spending by category">
                    <CategoryTransactionPopover
                        categoryId={selectedCategory}
                        categoryName={categoryData.find(cat => cat.categoryId === selectedCategory)?.name || ''}
                        dateRange={dateRange}
                        transactionCount={categoryData.find(cat => cat.categoryId === selectedCategory)?.transactionCount || 0}
                    >
                        <div className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
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
                <div className="lg:w-48">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Categories</h4>
                    <div className="space-y-3" role="list" aria-label="Category list with spending amounts">
                        {categoryData.map((category, index) => (
                            <CategoryTransactionPopover
                                key={index}
                                categoryId={category.categoryId}
                                categoryName={category.name}
                                dateRange={dateRange}
                                transactionCount={category.transactionCount}
                            >
                                <div
                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40 focus:bg-gray-50 dark:focus:bg-gray-900/40 rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-darkBg-card"
                                    onClick={() => {
                                        setSelectedCategory(selectedCategory === category.categoryId ? null : category.categoryId)
                                    }}
                                    role="listitem"
                                    tabIndex={0}
                                    aria-label={`${category.name}: $${category.amount.toLocaleString()} (${category.value}%) - Click to view transactions`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            setSelectedCategory(selectedCategory === category.categoryId ? null : category.categoryId)
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: category.color }}
                                            aria-hidden="true"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            RWF {category.amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{category.value}%</p>
                                    </div>
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
