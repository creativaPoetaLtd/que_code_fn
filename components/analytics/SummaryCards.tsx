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

const GOOD_TEXT = 'text-green-700 dark:text-green-400'
const BAD_TEXT = 'text-red-700 dark:text-red-400'

// Rising expenses are bad; rising income or balance is good.
const isGoodChange = (type: SummaryCardProps['type'], percentage: number) =>
    type === 'expense' ? percentage <= 0 : percentage > 0

const ChangeBadge = ({ type, percentage }: { type: SummaryCardProps['type'], percentage: number }) => (
    <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold ${
        isGoodChange(type, percentage) ? `bg-green-100 dark:bg-green-900 ${GOOD_TEXT}` : `bg-red-100 dark:bg-red-900 ${BAD_TEXT}`
    }`}>
        {percentage > 0 ? '↑' : '↓'} {Math.abs(percentage)}%
    </span>
)

const SummaryCard = ({
    title,
    amount,
    percentage,
    comparisonText,
    type,
    icon,
    loading
}: SummaryCardProps) => {
    if (loading) {
        return (
            <Card className="p-4 animate-pulse transition-all duration-300">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32 mt-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40 mt-1.5"></div>
            </Card>
        )
    }

    return (
        <Card className="p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow dark:bg-darkBg-card">
            <div className="flex items-center gap-2">
                <div className={`w-7 h-7 flex items-center justify-center rounded-lg ${
                    type === 'income' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
                    type === 'expense' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' :
                    'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                }`}>
                    {icon}
                </div>
                <p className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                {percentage !== undefined && <ChangeBadge type={type} percentage={percentage} />}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">RWF {amount}</h3>
            {comparisonText && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {comparisonText}
                </p>
            )}
        </Card>
    )
}

type SummaryItem = Omit<SummaryCardProps, 'loading'>

// Phones get one card: net balance on top, expenses and income side by side below it.
const MobileSummaryCard = ({ items, loading }: { items: SummaryItem[], loading: boolean }) => {
    if (loading) {
        return (
            <Card className="p-3.5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-36 mt-1.5"></div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-darkBorder-light">
                    <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </Card>
        )
    }

    const balance = items.find((item) => item.type === 'balance')
    const others = items.filter((item) => item.type !== 'balance')
    if (!balance) return null

    return (
        <Card className="p-3.5 dark:bg-darkBg-card">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{balance.title}</p>
                {balance.percentage !== undefined && <ChangeBadge type="balance" percentage={balance.percentage} />}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">RWF {balance.amount}</h3>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-darkBorder-light">
                {others.map((item) => (
                    <div key={item.title} className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.title.replace('Total ', '')}
                            {item.percentage !== undefined && (
                                <span className={`ml-1 font-semibold ${isGoodChange(item.type, item.percentage) ? GOOD_TEXT : BAD_TEXT}`}>
                                    {item.percentage > 0 ? '↑' : '↓'} {Math.abs(item.percentage)}%
                                </span>
                            )}
                        </p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white mt-0.5 truncate">RWF {item.amount}</p>
                    </div>
                ))}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="p-4 text-center text-red-600 dark:text-red-400 dark:bg-darkBg-card">
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
            icon: <DollarSign className="h-4 w-4" />
        },
        {
            title: 'Total Income',
            amount: formatAmount(data.totalIncome),
            percentage: incomeChange,
            comparisonText: getComparisonText(data.totalIncome, previousData?.totalIncome || 0, 'income'),
            type: 'income' as const,
            icon: <TrendingUp className="h-4 w-4" />
        },
        {
            title: 'Net Balance',
            amount: formatAmount(data.netBalance),
            percentage: balanceChange,
            comparisonText: getComparisonText(data.netBalance, previousData?.netBalance || 0, 'balance'),
            type: 'balance' as const,
            icon: <Wallet className="h-4 w-4" />
        }
    ] : []

    return (
        <>
        <div className="md:hidden">
            <MobileSummaryCard items={summaryData} loading={loading} />
        </div>
        <div className="hidden md:grid grid-cols-3 gap-3 lg:gap-4">
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
        </>
    )
}

export default SummaryCards
