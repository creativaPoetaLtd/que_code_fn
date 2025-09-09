'use client'
import React from 'react'
import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { DateRange } from '@/types/analytics.types'
import { useAnalyticsCategoryBreakdown } from '@/hooks/use-analytics'

interface CategoryData {
    name: string
    value: number
    color: string
    amount: number
}

interface CategoryBreakdownProps {
    dateRange: DateRange;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ dateRange }) => {
    const { data, loading, error } = useAnalyticsCategoryBreakdown(dateRange)

    // Color palette for categories
    const colors = ['#1e40af', '#f97316', '#e11d48', '#059669', '#7c3aed', '#0891b2', '#dc2626', '#ca8a04']

    const categoryData: CategoryData[] = data.map((item, index) => ({
        name: item.categoryName,
        value: item.percentage,
        color: colors[index % colors.length],
        amount: item.totalAmount
    }))

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0]
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium">{data.payload.name}</p>
                    <p className="text-sm text-gray-600">
                        ${data.payload.amount.toLocaleString()} ({data.value}%)
                    </p>
                </div>
            )
        }
        return null
    }

    if (loading) {
        return (
            <Card className="p-6 animate-pulse">
                <div className="mb-4">
                    <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-60"></div>
                </div>
                <div className="h-64 bg-gray-200 rounded"></div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-6 text-center text-red-600">
                <p>Error loading category breakdown</p>
            </Card>
        )
    }

    if (categoryData.length === 0) {
        return (
            <Card className="p-6 text-center text-gray-500">
                <p>No category data available for the selected period</p>
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
                <p className="text-sm text-gray-600">Spending distribution by categories</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Donut Chart */}
                <div className="flex-1">
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
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Category List */}
                <div className="lg:w-48">
                    <h4 className="font-medium text-gray-900 mb-3">Top Categories</h4>
                    <div className="space-y-3">
                        {categoryData.map((category, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span className="text-sm text-gray-700">{category.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        ${category.amount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">{category.value}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default CategoryBreakdown
