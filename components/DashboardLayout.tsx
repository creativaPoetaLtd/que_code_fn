import React from "react";
import { AccountInfo } from "./AccountInfo";
import { Header } from "./Header";
import { RecentActions } from "./RecentActions";
import { RecentMessages } from "./RecentMessages";
import { RecentTransactions } from "./RecentTransactions";
import { Navigation } from "./Navigation";

export const DashboardLayout = () => {
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

            {/* Bottom Navigation for small devices */}
            <div className="lg:hidden">
                <Navigation />
            </div>
        </div>
    );
};
