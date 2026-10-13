"use client";
import React from "react";
import Navigation from "@/components/Navigation";
import { Header } from "@/components/Header";
import BillsList from "@/components/bills/BillsList";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { useAccent } from "@/hooks/use-accent";

const BillsPage = () => {
    const { isExpanded } = useSidebar();
    const accent = useAccent();

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
                        <BillsList />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BillsPage;
