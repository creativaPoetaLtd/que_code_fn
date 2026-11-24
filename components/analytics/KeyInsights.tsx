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

const InsightRow = ({ title, description, value, type, icon }: InsightCardProps) => {
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
        <div className="flex items-center gap-3 py-2.5">
            <div className={`hidden sm:flex w-7 h-7 shrink-0 items-center justify-center rounded-lg ${getIconStyles()}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">{value}</p>
        </div>
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
                    icon: <Target className="h-4 w-4" />
                })
            }

            if (summaryData.expenseCount > 0) {
                const avgTransaction = summaryData.totalExpenses / summaryData.expenseCount
                insights.push({
                    title: 'Average Transaction',
                    description: `Based on ${summaryData.expenseCount} transactions this period`,
                    value: `RWF ${avgTransaction.toFixed(0)}`,
                    type: 'info' as const,
                    icon: <Calendar className="h-4 w-4" />
                })
            }

            if (summaryData.netBalance > 0) {
                insights.push({
                    title: 'Positive Balance',
                    description: 'Your income exceeded expenses this period',
                    value: `RWF ${summaryData.netBalance.toLocaleString()}`,
                    type: 'positive' as const,
                    icon: <TrendingUp className="h-4 w-4" />
                })
            } else if (summaryData.netBalance < 0) {
                insights.push({
                    title: 'Spending Alert',
                    description: 'Your expenses exceeded income this period',
                    value: `RWF ${Math.abs(summaryData.netBalance).toLocaleString()}`,
                    type: 'warning' as const,
                    icon: <AlertTriangle className="h-4 w-4" />
                })
            }

            if (categoryData.length > 3) {
                insights.push({
                    title: 'Spending Diversity',
                    description: `Your expenses span across ${categoryData.length} different categories`,
                    value: `${categoryData.length} categories`,
                    type: 'info' as const,
                    icon: <Target className="h-4 w-4" />
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
                icon: <Calendar className="h-4 w-4" />
            })
        }

        return insights.slice(0, 4) // Limit to 4 insights
    }

    const insights = generateInsights()

    if (loading) {
        return (
            <Card className="p-3.5 lg:p-4 h-full animate-pulse dark:bg-darkBg-card">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                <div className="mt-2 divide-y divide-gray-100 dark:divide-darkBorder-light">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 py-2.5">
                            <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-44"></div>
                            </div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                    ))}
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-3.5 lg:p-4 pb-1.5 lg:pb-2 h-full dark:bg-darkBg-card">
            <h3 className="text-[15px] lg:text-base font-semibold text-gray-900 dark:text-white">Key insights</h3>

            <div className="mt-1 divide-y divide-gray-100 dark:divide-darkBorder-light">
                {insights.map((insight, index) => (
                    <InsightRow
                        key={index}
                        title={insight.title}
                        description={insight.description}
                        value={insight.value}
                        type={insight.type}
                        icon={insight.icon}
                    />
                ))}
            </div>
        </Card>
    )
}

export default KeyInsights
