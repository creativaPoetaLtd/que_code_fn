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
            <Card className="p-4 lg:p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-600">Loading comparison data...</p>
                    </div>
                </div>
            </Card>
        )
    }

    // Error state
    if (error) {
        return (
            <Card className="p-4 lg:p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-red-500 mb-2 text-lg">⚠️</div>
                        <p className="text-sm font-medium text-red-600 mb-1">Unable to load comparison data</p>
                        <p className="text-xs text-gray-500">{error}</p>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-4 lg:p-6 transition-all duration-300 ease-in-out">
            {/* Header with Main Stat */}
            <div className="mb-6">
                <div className="flex items-end justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-base lg:text-lg font-bold text-gray-900">{getComparisonLabel()}</h3>
                        <p className="text-xs text-gray-500 mt-1">Period-over-period spending trend</p>
                    </div>
                    {/* Large Delta Indicator */}
                    <div className="text-right">
                        <div className={`text-2xl lg:text-3xl font-bold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                            {isPositive ? '+' : '-'}{Math.abs(Number(stats.changePercent)).toFixed(2)}%
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{formatCurrency(Math.abs(stats.change))}</p>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                        <p className="text-gray-500 mb-1">Previous</p>
                        <p className="font-bold text-gray-900">{formatCurrency(stats.previousTotal)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-1">Current</p>
                        <p className="font-bold text-gray-900">{formatCurrency(stats.currentTotal)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 mb-1">Trend</p>
                        <div className="flex items-center justify-end gap-1">
                            {isPositive ? (
                                <TrendingUp className="w-4 h-4 text-red-600" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-green-600" />
                            )}
                            <p className={`font-bold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                                {isPositive ? 'Up' : 'Down'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Chart - Overlay */}
            <div className="h-64 lg:h-80 -mx-4 lg:-mx-6 mb-4">
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12, fill: '#999' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#999' }}
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
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                                fontSize: '12px'
                            }}
                            formatter={(value) => formatCurrency(value as number)}
                            labelStyle={{ color: '#1f2937', fontWeight: 600 }}
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
