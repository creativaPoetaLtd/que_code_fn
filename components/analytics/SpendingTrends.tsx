'use client'
import React from 'react'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DateRange } from '@/types/analytics.types'
import { useAnalyticsSpendingTrends } from '@/hooks/use-analytics'
import moment from 'moment'

interface TrendData {
    date: string
    amount: number
    formattedDate: string
}

interface SpendingTrendsProps {
    dateRange: DateRange;
    interval: 'daily' | 'weekly' | 'monthly';
}

const SpendingTrends: React.FC<SpendingTrendsProps> = ({ dateRange, interval }) => {
    const { data, loading, error } = useAnalyticsSpendingTrends(dateRange, interval)

    const formatDate = (dateString: string, interval: string) => {
        const date = moment(dateString)
        switch (interval) {
            case 'daily':
                return date.format('MMM D')
            case 'weekly':
                return `Week ${date.week()}`
            case 'monthly':
                return date.format('MMM YYYY')
            default:
                return date.format('MMM D')
        }
    }

    const trendData: TrendData[] = data.map(item => ({
        date: item.date,
        amount: item.totalSpent,
        formattedDate: formatDate(item.date, interval)
    }))

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-blue-600">
                        Amount: ${payload[0].value.toLocaleString()}
                    </p>
                </div>
            )
        }
        return null
    }

    if (loading) {
        return (
            <Card className="p-6 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                </div>
                <div className="h-80 bg-gray-200 rounded"></div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-6 text-center text-red-600">
                <p>Error loading spending trends</p>
            </Card>
        )
    }

    if (trendData.length === 0) {
        return (
            <Card className="p-6 text-center text-gray-500">
                <p>No spending data available for the selected period</p>
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Spending Trends</h3>
                    <p className="text-sm text-gray-600">Track your spending patterns over time ({interval})</p>
                </div>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="formattedDate" 
                            stroke="#666"
                            fontSize={12}
                        />
                        <YAxis 
                            stroke="#666"
                            fontSize={12}
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#1e40af" 
                            strokeWidth={3}
                            dot={{ fill: '#1e40af', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, stroke: '#1e40af', strokeWidth: 2, fill: '#fff' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}

export default SpendingTrends
