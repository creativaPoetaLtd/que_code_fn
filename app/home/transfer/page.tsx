"use client";
import TransferPageLayout from '@/components/transfer/TransferPageLayout'
import React from 'react'
import Navigation from '@/components/Navigation'
import { Header } from '@/components/Header'
import { useSidebar } from '@/context/SidebarContext'
import { cn } from '@/lib/utils'

const TransferPage = () => {
    const { isExpanded } = useSidebar();

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-transparent">
            <Navigation hideBottomNav />

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col p-4 sm:p-6 lg:p-8 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 overflow-y-auto pb-4 sm:pb-6 lg:pb-8">
                    <Header showBackButton />

                    {/* Transfer Content */}
                    <div className="mt-6">
                        <TransferPageLayout />
                    </div>
                </div>
            </main>
        </div>
    )
}

export default TransferPage;
