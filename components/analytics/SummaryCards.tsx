'use client'
import React, { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'
import { DateRange } from '@/types/analytics.types'
import { useAnalyticsSummary } from '@/hooks/use-analytics'
import moment from 'moment'

interface SummaryCardsProps {
    dateRange: DateRange;
}

interface SummaryCardProps {
    title: string
    amount: string
    percentage?: number
    comparisonText?: string
    type: 'income' | 'expense' | 'balance'
    icon: React.ReactNode
    loading?: boolean
}

const SummaryCard = ({ 
    title, 
    amount, 
    percentage, 
    comparisonText,
    type, 
    icon, 
    loading 
}: SummaryCardProps) => {
    const isPositive = percentage ? percentage > 0 : false
    const isBalance = type === 'balance'
    
    if (loading) {
        return (
            <Card className="p-6 animate-pulse transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
            </Card>
        )
    }
    
    return (
        <Card className="p-6 hover:shadow-md dark:hover:shadow-lg transition-shadow dark:bg-darkBg-card">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${
                    type === 'income' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
                    type === 'expense' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' :
                    'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                }`}>
                    {icon}
                </div>
                
                {percentage !== undefined && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        isBalance ? 
                            (isPositive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400') :
                            type === 'income' ? 
                                (isPositive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400') :
                                (isPositive ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400')
                    }`}>
                        {isPositive ? '↑' : '↓'}
                        {Math.abs(percentage)}%
                    </div>
                )}
            </div>
            
            <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">RWF {amount}</h3>
                {comparisonText && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {comparisonText}
                    </p>
                )}
            </div>
        </Card>
    )
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ dateRange }) => {
    const { data, loading, error } = useAnalyticsSummary(dateRange)

    // Calculate previous period date range for comparison
    const previousDateRange = useMemo(() => {
        if (!dateRange.startDate || !dateRange.endDate) return null

        const start = moment(dateRange.startDate)
        const end = moment(dateRange.endDate)
        const daysDiff = end.diff(start, 'days')

        return {
            startDate: start.clone().subtract(daysDiff + 1, 'days').toDate(),
            endDate: start.clone().subtract(1, 'day').toDate()
        }
    }, [dateRange])

    // Fetch previous period data
    const { data: previousData } = useAnalyticsSummary(previousDateRange || dateRange)

    // Calculate percentage changes
    const calculateChangePercent = (current: number, previous: number): number => {
        if (previous === 0) return 0
        return Math.round(((current - previous) / Math.abs(previous)) * 100)
    }

    const getComparisonText = (current: number, previous: number, type: string): string => {
        if (previous === 0) return 'No previous data'
        const change = current - previous
        const symbol = change >= 0 ? '↑' : '↓'
        const absChange = Math.abs(change).toLocaleString()
        
        if (type === 'income') {
            return change >= 0 ? `+RWF ${absChange} vs last period` : `-RWF ${absChange} vs last period`
        } else if (type === 'expense') {
            return change >= 0 ? `+RWF ${absChange} vs last period` : `-RWF ${absChange} vs last period`
        } else {
            return change >= 0 ? `+RWF ${absChange} vs last period` : `-RWF ${absChange} vs last period`
        }
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        }).format(amount)
    }

    if (error) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 text-center text-red-600 dark:text-red-400 dark:bg-darkBg-card">
                    Error loading data
                </Card>
            </div>
        )
    }

    const expenseChange = data && previousData 
        ? calculateChangePercent(data.totalExpenses, previousData.totalExpenses)
        : undefined
    const incomeChange = data && previousData
        ? calculateChangePercent(data.totalIncome, previousData.totalIncome)
        : undefined
    const balanceChange = data && previousData
        ? calculateChangePercent(data.netBalance, previousData.netBalance)
        : undefined

    const summaryData = data ? [
        {
            title: 'Total Expenses',
            amount: formatAmount(data.totalExpenses),
            percentage: expenseChange,
            comparisonText: getComparisonText(data.totalExpenses, previousData?.totalExpenses || 0, 'expense'),
            type: 'expense' as const,
            icon: <DollarSign className="h-5 w-5" />
        },
        {
            title: 'Total Income',
            amount: formatAmount(data.totalIncome),
            percentage: incomeChange,
            comparisonText: getComparisonText(data.totalIncome, previousData?.totalIncome || 0, 'income'),
            type: 'income' as const,
            icon: <TrendingUp className="h-5 w-5" />
        },
        {
            title: 'Net Balance',
            amount: formatAmount(data.netBalance),
            percentage: balanceChange,
            comparisonText: getComparisonText(data.netBalance, previousData?.netBalance || 0, 'balance'),
            type: 'balance' as const,
            icon: <Wallet className="h-5 w-5" />
        }
    ] : []

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                    <SummaryCard
                        key={index}
                        title=""
                        amount=""
                        type="balance"
                        icon={<div />}
                        loading={true}
                    />
                ))
            ) : (
                summaryData.map((item, index) => (
                    <SummaryCard
                        key={index}
                        title={item.title}
                        amount={item.amount}
                        percentage={item.percentage}
                        comparisonText={item.comparisonText}
                        type={item.type}
                        icon={item.icon}
                        loading={false}
                    />
                ))
            )}
        </div>
    )
}

export default SummaryCards
