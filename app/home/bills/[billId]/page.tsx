"use client";
import React from "react";
import { useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Header } from "@/components/Header";
import BillDetail from "@/components/bills/BillDetail";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { useAccent } from "@/hooks/use-accent";

const BillDetailPage = () => {
    const { isExpanded } = useSidebar();
    const accent = useAccent();
    const params = useParams<{ billId: string }>();

    return (
        <div className={`flex flex-col min-h-screen bg-gray-50 ${accent.darkBgPage}`}>
            <Navigation hideBottomNav />
            <main
                className={cn(
                    "flex-1 flex flex-col p-4 sm:p-6 lg:p-8 transition-all duration-300",
                    isExpanded ? "lg:ml-64" : "lg:ml-20"
                )}
            >
                <div className="flex-1 overflow-y-auto pb-4 sm:pb-6 lg:pb-8">
                    <Header showBackButton />
                    <div className="max-w-2xl mx-auto mt-6">
                        {params?.billId && <BillDetail billId={params.billId} />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BillDetailPage;
