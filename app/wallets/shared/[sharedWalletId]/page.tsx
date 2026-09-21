"use client"

import { useParams } from "next/navigation"
import { useSidebar } from "@/context/SidebarContext"
import { Header } from "@/components/Header"
import Navigation from "@/components/Navigation"
import { BackButton } from "@/components/shared/BackButton"
import { useAccent } from "@/hooks/use-accent"
import { cn } from "@/lib/utils"
import SharedWalletDetail from "@/components/Wallet/SharedWalletDetail"

export default function SharedWalletDetailPage() {
    const params = useParams()
    const sharedWalletId = params?.sharedWalletId as string
    const { isExpanded } = useSidebar()
    const accent = useAccent()

    return (
        <div className={`flex min-h-screen bg-gray-50 ${accent.darkBgPage}`}>
            <Navigation />
            <div className={cn("flex-1 transition-all duration-300", isExpanded ? "lg:ml-64" : "lg:ml-20")}>
                <div className="px-4 sm:px-6 lg:px-8 py-4"><Header /></div>
                <div className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-6">
                            <BackButton className="mb-4" />
                        </div>
                        {sharedWalletId && <SharedWalletDetail sharedWalletId={sharedWalletId} />}
                    </div>
                </div>
            </div>
        </div>
    )
}
