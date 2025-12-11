'use client'
import React from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, AlertTriangle, Target, Calendar } from 'lucide-react'
import { DateRange } from '@/types/analytics.types'
import { useAnalyticsSummary, useAnalyticsCategoryBreakdown } from '@/hooks/use-analytics'

interface KeyInsightsProps {
    dateRange: DateRange;
}

interface InsightCardProps {
    title: string
    description: string
    value: string
    type: 'positive' | 'negative' | 'warning' | 'info'
    icon: React.ReactNode
}

const InsightCard = ({ title, description, value, type, icon }: InsightCardProps) => {
    const getTypeStyles = () => {
        switch (type) {
            case 'positive':
                return 'border-l-green-500 dark:border-l-green-400 bg-green-50 dark:bg-darkBg-card'
            case 'negative':
                return 'border-l-red-500 dark:border-l-red-400 bg-red-50 dark:bg-darkBg-card'
            case 'warning':
                return 'border-l-yellow-500 dark:border-l-yellow-400 bg-yellow-50 dark:bg-darkBg-card'
            case 'info':
                return 'border-l-blue-500 dark:border-l-blue-400 bg-blue-50 dark:bg-darkBg-card'
            default:
                return 'border-l-gray-500 dark:border-l-gray-400 bg-gray-50 dark:bg-darkBg-card'
        }
    }

    const getIconStyles = () => {
        switch (type) {
            case 'positive':
                return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
            case 'negative':
                return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
            case 'warning':
                return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
            case 'info':
                return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
            default:
                return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
        }
    }

    return (
        <Card className={`p-4 border-l-4 ${getTypeStyles()}`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getIconStyles()}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{description}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </Card>
    )
}

const KeyInsights: React.FC<KeyInsightsProps> = ({ dateRange }) => {
    const { data: summaryData, loading: summaryLoading } = useAnalyticsSummary(dateRange)
    const { data: categoryData = [], loading: categoryLoading } = useAnalyticsCategoryBreakdown(dateRange)

    const loading = summaryLoading || categoryLoading

    const generateInsights = () => {
        const insights = []

        if (summaryData && Array.isArray(categoryData) && categoryData.length > 0) {
            const topCategory = categoryData[0]
            if (topCategory) {
                insights.push({
                    title: 'Top Spending Category',
                    description: `${topCategory.categoryName} accounts for ${topCategory.percentage.toFixed(1)}% of expenses`,
                    value: `RWF ${topCategory.totalAmount.toLocaleString()}`,
                    type: 'info' as const,
                    icon: <Target className="h-5 w-5" />
                })
            }

            if (summaryData.expenseCount > 0) {
                const avgTransaction = summaryData.totalExpenses / summaryData.expenseCount
                insights.push({
                    title: 'Average Transaction',
                    description: `Based on ${summaryData.expenseCount} transactions this period`,
                    value: `RWF ${avgTransaction.toFixed(0)}`,
                    type: 'info' as const,
                    icon: <Calendar className="h-5 w-5" />
                })
            }

            if (summaryData.netBalance > 0) {
                insights.push({
                    title: 'Positive Balance',
                    description: 'Your income exceeded expenses this period',
                    value: `RWF ${summaryData.netBalance.toLocaleString()}`,
                    type: 'positive' as const,
                    icon: <TrendingUp className="h-5 w-5" />
                })
            } else if (summaryData.netBalance < 0) {
                insights.push({
                    title: 'Spending Alert',
                    description: 'Your expenses exceeded income this period',
                    value: `RWF ${Math.abs(summaryData.netBalance).toLocaleString()}`,
                    type: 'warning' as const,
                    icon: <AlertTriangle className="h-5 w-5" />
                })
            }

            if (categoryData.length > 3) {
                insights.push({
                    title: 'Spending Diversity',
                    description: `Your expenses span across ${categoryData.length} different categories`,
                    value: `${categoryData.length} categories`,
                    type: 'info' as const,
                    icon: <Target className="h-5 w-5" />
                })
            }
        }

        // Add default insights if no data
        if (insights.length === 0) {
            insights.push({
                title: 'No Data Available',
                description: 'Start making transactions to see insights',
                value: '-',
                type: 'info' as const,
                icon: <Calendar className="h-5 w-5" />
            })
        }

        return insights.slice(0, 4) // Limit to 4 insights
    }

    const insights = generateInsights()

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="mb-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="p-4 animate-pulse dark:bg-darkBg-card">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                <div className="flex-1">
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Insights</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Important highlights from your spending data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                    <InsightCard
                        key={index}
                        title={insight.title}
                        description={insight.description}
                        value={insight.value}
                        type={insight.type}
                        icon={insight.icon}
                    />
                ))}
            </div>
        </div>
    )
}

export default KeyInsights
