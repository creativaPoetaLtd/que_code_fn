import AccountInfo from '@/components/AccountInfo'
import Dashboard from '@/components/Dashboard/Dashboard'

import { Header } from '@/components/Header'
import Navigation from '@/components/Navigation'
import RecentActions from '@/components/RecentActions'
import RecentMessages from '@/components/RecentMessages'
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

                    {/* Content */}
                    <Dashboard />
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