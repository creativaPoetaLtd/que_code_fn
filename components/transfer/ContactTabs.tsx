"use client";

import React from "react";
import { cn } from "@/lib/utils";

type TabType = "all" | "recent";

interface ContactTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const ContactTabs = ({ activeTab, onTabChange }: ContactTabsProps) => {
    const tabs: { id: TabType; label: string }[] = [
        { id: "all", label: "All contacts" },
        { id: "recent", label: "Recent sends" },
    ];

    return (
        <div className="flex border-b border-gray-200 dark:border-darkBorder-light">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-all relative",
                        activeTab === tab.id
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white" />
                    )}
                </button>
            ))}
        </div>
    );
};

export default ContactTabs;
export type { TabType };
