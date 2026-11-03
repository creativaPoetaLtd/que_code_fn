'use client'
import React, { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { useSpendingComparison } from '@/hooks/use-analytics'
import { DateRange } from '@/types/analytics.types'

interface ComparisonChartProps {
    dateRange: DateRange
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

interface ComparisonData {
    label: string
    current: number
    previous: number
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ dateRange, interval }) => {
    // Convert yearly to monthly for API call (yearly view shows monthly data)
    const apiInterval = interval === 'yearly' ? 'monthly' : interval
    const { data: comparisonData, loading, error } = useSpendingComparison(dateRange, apiInterval)

    // Transform API data to chart format
    const chartData = useMemo(() => {
        if (!comparisonData) return []

        const currentMap = new Map(comparisonData.currentPeriod.data.map(item => [item.label, item.amount]))
        const previousMap = new Map(comparisonData.previousPeriod.data.map(item => [item.label, item.amount]))

        // Combine all unique labels from both periods
        const allLabels = new Set([...Array.from(currentMap.keys()), ...Array.from(previousMap.keys())])

        return Array.from(allLabels).map(label => ({
            label,
            current: currentMap.get(label) || 0,
            previous: previousMap.get(label) || 0
        })).sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())
    }, [comparisonData])

    const getComparisonLabel = (): string => {
        switch (interval) {
            case 'daily':
                return 'This Week vs Last Week'
            case 'weekly':
                return 'This Month vs Last Month'
            case 'monthly':
                return 'This Year vs Last Year'
            case 'yearly':
                return 'Year-over-Year'
            default:
                return 'Comparison'
        }
    }

    const stats = useMemo(() => {
        if (!comparisonData) {
            return { currentTotal: 0, previousTotal: 0, change: 0, changePercent: 0 }
        }

        const currentTotal = comparisonData.currentPeriod.total
        const previousTotal = comparisonData.previousPeriod.total
        const change = currentTotal - previousTotal
        const changePercent = previousTotal > 0 ? ((change / previousTotal) * 100) : 0

        return { currentTotal, previousTotal, change, changePercent }
    }, [comparisonData])

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const isPositive = stats.change > 0

    // Loading state
    if (loading) {
        return (
            <Card className="p-3.5 lg:p-4 dark:bg-darkBg-card">
                <div className="flex items-center justify-center h-60 lg:h-72">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Loading comparison data...</p>
                    </div>
                </div>
            </Card>
        )
    }

    // Error state
    if (error) {
        return (
            <Card className="p-3.5 lg:p-4 dark:bg-darkBg-card">
                <div className="flex items-center justify-center h-60 lg:h-72">
                    <div className="text-center">
                        <div className="text-red-500 dark:text-red-400 mb-2 text-lg">⚠️</div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Unable to load comparison data</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{error}</p>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-3.5 lg:p-4 transition-all duration-300 ease-in-out dark:bg-darkBg-card">
            {/* Header: title on the left, period stats inline on the right */}
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div>
                    <h3 className="text-[15px] lg:text-base font-semibold text-gray-900 dark:text-white">{getComparisonLabel()}</h3>
                    <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-0.5">Period-over-period spending trend</p>
                </div>
                <div className="flex gap-4 lg:gap-6 text-xs">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Previous</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.previousTotal)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Current</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.currentTotal)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Change</p>
                        <p className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {isPositive ? '+' : '-'}{Math.abs(Number(stats.changePercent)).toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Line Chart - Overlay */}
            <div className="h-48 lg:h-60 -mx-3.5 lg:-mx-4 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#374151' : '#f0f0f0'} vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12, fill: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#9ca3af' : '#999' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#9ca3af' : '#999' }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                            tickFormatter={(value) =>
                                new Intl.NumberFormat('en-US', {
                                    notation: 'compact',
                                    compactDisplay: 'short'
                                }).format(value)
                            }
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                                border: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '1px solid #374151' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                                fontSize: '12px'
                            }}
                            formatter={(value) => formatCurrency(value as number)}
                            labelStyle={{ color: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#1f2937', fontWeight: 600 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="current"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Current Period"
                            isAnimationActive
                        />
                        <Line
                            type="monotone"
                            dataKey="previous"
                            stroke="#d1d5db"
                            strokeWidth={2}
                            dot={{ fill: '#9ca3af', r: 3 }}
                            activeDot={{ r: 5 }}
                            name="Previous Period"
                            isAnimationActive
                            strokeDasharray="5 5"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </Card>
    )
}

export default ComparisonChart
