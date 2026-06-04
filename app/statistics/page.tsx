'use client'
import AccountInfo from '@/components/AccountInfo'
import Dashboard from '@/components/Dashboard/Dashboard'

import { Header } from '@/components/Header'
import Navigation from '@/components/Navigation'
// import RecentActions from '@/components/RecentActions'
import RecentMessages from '@/components/RecentMessages'
import RecentTransactions from '@/components/RecentTransactions'

import React from 'react'
import { useSidebar } from '@/context/SidebarContext'
import { cn } from '@/lib/utils'
import { BackButton } from '@/components/shared/BackButton'
import { useAccent } from '@/hooks/use-accent'

const page = () => {
    const { isExpanded } = useSidebar();
    const accent = useAccent();
    return (
        <div className={`flex flex-col min-h-screen bg-gray-50 ${accent.darkBgPage}`}>
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

                    <BackButton className="mt-4 mb-2" />

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