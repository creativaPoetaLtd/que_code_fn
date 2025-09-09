'use client'
import React from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'
import { DateRange } from '@/types/analytics.types'
import { useAnalyticsSummary } from '@/hooks/use-analytics'

interface SummaryCardsProps {
    dateRange: DateRange;
}

interface SummaryCardProps {
    title: string
    amount: string
    percentage?: number
    type: 'income' | 'expense' | 'balance'
    icon: React.ReactNode
    loading?: boolean
}

const SummaryCard = ({ title, amount, percentage, type, icon, loading }: SummaryCardProps) => {
    const isPositive = percentage ? percentage > 0 : false
    const isBalance = type === 'balance'
    
    if (loading) {
        return (
            <Card className="p-6 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-24"></div>
                        </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
            </Card>
        )
    }
    
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                        type === 'income' ? 'bg-green-100 text-green-600' :
                        type === 'expense' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">{title}</p>
                        <h3 className="text-2xl font-semibold mt-1">${amount}</h3>
                    </div>
                </div>
                
                {percentage !== undefined && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        isBalance ? 
                            (isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600') :
                            type === 'income' ? 
                                (isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600') :
                                (isPositive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')
                    }`}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(percentage)}%
                    </div>
                )}
            </div>
        </Card>
    )
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ dateRange }) => {
    const { data, loading, error } = useAnalyticsSummary(dateRange)

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        }).format(amount)
    }

    if (error) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 text-center text-red-600">
                    Error loading data
                </Card>
            </div>
        )
    }

    const summaryData = data ? [
        {
            title: 'Total Expenses',
            amount: formatAmount(data.totalExpenses),
            type: 'expense' as const,
            icon: <DollarSign className="h-4 w-4" />
        },
        {
            title: 'Total Income',
            amount: formatAmount(data.totalIncome),
            type: 'income' as const,
            icon: <TrendingUp className="h-4 w-4" />
        },
        {
            title: 'Net Balance',
            amount: formatAmount(data.netBalance),
            type: 'balance' as const,
            icon: <Wallet className="h-4 w-4" />
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
