import React from "react";
import { AccountInfo } from "./AccountInfo";
import { Header } from "./Header";
import { RecentActions } from "./RecentActions";
import { RecentMessages } from "./RecentMessages";
import { RecentTransactions } from "./RecentTransactions";
import { Sidebar } from "./Sidebar";

export const DashboardLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className={`flex-1 p-8 ml-20 transition-all duration-300`}>
                <div className="max-h-screen overflow-y-auto">
                    <Header />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <div className="space-y-4">
                            <AccountInfo />
                            <RecentActions />
                        </div>
                        <div className="space-y-8">
                            <RecentTransactions />
                            <RecentMessages />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};