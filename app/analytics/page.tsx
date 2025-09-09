'use client'
import React, { useState } from 'react'
import { Header } from '@/components/Header'
import Navigation from '@/components/Navigation'
import FiltersBar from '../../components/analytics/FiltersBar'
import SummaryCards from '../../components/analytics/SummaryCards'
import CategoryBreakdown from '../../components/analytics/CategoryBreakdown'
import SpendingTrends from '../../components/analytics/SpendingTrends'
import KeyInsights from '../../components/analytics/KeyInsights'
import { DateRange } from '@/types/analytics.types'

const AnalyticsPage = () => {
    // State for filters
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date()
    });
    
    const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-8 lg:ml-20 transition-all duration-300">
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    {/* Header */}
                    <Header />

                    {/* Analytics Content */}
                    <div className="space-y-6">
                        {/* Page Title & Filters */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
                            <p className="text-gray-600 mb-6">Track your spending patterns and financial insights.</p>
                            <FiltersBar 
                                dateRange={dateRange}
                                interval={interval}
                                onDateRangeChange={setDateRange}
                                onIntervalChange={setInterval}
                            />
                        </div>

                        {/* Summary Metrics */}
                        <SummaryCards dateRange={dateRange} />

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Category Breakdown */}
                            <div className="lg:col-span-5">
                                <CategoryBreakdown dateRange={dateRange} />
                            </div>

                            {/* Spending Trends */}
                            <div className="lg:col-span-7">
                                <SpendingTrends dateRange={dateRange} interval={interval} />
                            </div>
                        </div>

                        {/* Key Insights */}
                        <KeyInsights dateRange={dateRange} />
                    </div>
                </div>
            </main>

            {/* Bottom Navigation for small devices */}
            <div className="lg:hidden">
                <Navigation />
            </div>
        </div>
    )
}

export default AnalyticsPage
