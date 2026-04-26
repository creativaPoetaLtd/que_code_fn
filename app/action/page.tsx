'use client'
import ActionPageLayout from '@/components/ActionPage/ActionPageLayout'
import { Header } from '@/components/Header'
import Navigation from '@/components/Navigation'
import React, { Suspense } from 'react'
import { useSidebar } from '@/context/SidebarContext'
import { cn } from '@/lib/utils'

const page = () => {
    const { isExpanded } = useSidebar();
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Navigation />

            <main className={cn(
                "flex-1 flex flex-col p-8 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    <Header />
                    <Suspense>
                        <ActionPageLayout />
                    </Suspense>
                </div>
            </main>

            <div className="lg:hidden">
                <Navigation />
            </div>
        </div>
    )
}

export default page
