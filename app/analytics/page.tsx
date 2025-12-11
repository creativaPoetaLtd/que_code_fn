'use client'
import React, { useState } from 'react'
import { Header } from '@/components/Header'
import Navigation from '@/components/Navigation'
import FiltersBar from '../../components/analytics/FiltersBar'
import SummaryCards from '../../components/analytics/SummaryCards'
import ComparisonChart from '../../components/analytics/ComparisonChart'
import TransactionTable from '../../components/analytics/TransactionTable'
import CategoryBreakdown from '../../components/analytics/CategoryBreakdown'
import KeyInsights from '../../components/analytics/KeyInsights'
import { DateRange } from '@/types/analytics.types'
import { useSidebar } from '@/context/SidebarContext'
import { cn } from '@/lib/utils'

type ViewType = 'daily' | 'weekly' | 'monthly' | 'yearly'

const AnalyticsPage = () => {
    const { isExpanded } = useSidebar();
    // State for filters
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date()
    });
    
    // Helper function to determine optimal interval based on date range
    const calculateOptimalInterval = (start: Date, end: Date): 'daily' | 'weekly' | 'monthly' | 'yearly' => {
        const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (durationDays === 1) return 'daily';
        if (durationDays <= 7) return 'daily'; 
        if (durationDays <= 31) return 'weekly';
        if (durationDays <= 365) return 'monthly';
        return 'yearly';
    };

    // Calculate interval based on current date range
    const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(() => 
        calculateOptimalInterval(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date()
        )
    );

    // Update interval whenever date range changes
    const handleDateRangeChange = (newDateRange: DateRange) => {
        setDateRange(newDateRange);
        if (newDateRange.startDate && newDateRange.endDate) {
            const newInterval = calculateOptimalInterval(newDateRange.startDate, newDateRange.endDate);
            setInterval(newInterval);
        }
    };
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-darkBg-main transition-colors duration-300">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col p-8 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    {/* Header */}
                    <Header />

                    {/* Analytics Content */}
                    <div className="space-y-6">
                        {/* Page Title & Filters */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Finances</h1>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">Track your spending patterns and financial insights.</p>
                            <FiltersBar 
                                dateRange={dateRange}
                                onDateRangeChange={handleDateRangeChange}
                            />
                        </div>

                        {/* Summary Cards */}
                        <SummaryCards dateRange={dateRange} />

                        {/* Comparison Chart */}
                        <ComparisonChart dateRange={dateRange} interval={interval} />

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Category Breakdown */}
                            <div className="lg:col-span-6">
                                <CategoryBreakdown dateRange={dateRange} />
                            </div>

                            {/* Key Insights */}
                            <div className="lg:col-span-6">
                                <KeyInsights dateRange={dateRange} />
                            </div>
                        </div>


                        {/* Transaction Table - Shows Daily/Weekly/Monthly/Yearly View */}
                        <TransactionTable dateRange={dateRange} activeView={interval} />

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
