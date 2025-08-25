"use client";

import AdvancedAnalytics from '@/components/Dashboard/AdvancedAnalytics'
import { ExpenseStats } from '@/components/Dashboard/ExpenseStats'

import { Header } from '@/components/Header'
import Navigation from '@/components/Navigation'

import RecentTransactions from '@/components/RecentTransactions'

import React from 'react'

const page = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-8 lg:ml-20 transition-all duration-300">
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    {/* Header */}
                    <Header />

                    {/* Enhanced Analytics Content */}
                    <div className="space-y-8 mt-6">
                        {/* Advanced Analytics Section */}
                        <AdvancedAnalytics />
                        
                        {/* Split Layout for Detailed Views */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Expense Statistics - 2 columns */}
                            <div className="lg:col-span-2">
                                <ExpenseStats />
                            </div>
                            
                            {/* Recent Transactions - 1 column */}
                            <div className="lg:col-span-1">
                                <RecentTransactions />
                            </div>
                        </div>
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

export default page