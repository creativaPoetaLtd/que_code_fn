"use client";
import { TransactionList } from '@/components/Dashboard/TransactionList';
import { Header } from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

export default function TransactionsPage() {
  const { isExpanded } = useSidebar();
  return (
    <div className="flex min-h-screen">
      {/* Sidebar navigation */}
      <Navigation />
      {/* Main content */}
      <div className={cn(
        "flex-1 bg-gray-50 dark:bg-transparent transition-all duration-300",
        isExpanded ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Transactions</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">View and manage your transaction history</p>
            </div>
            <TransactionList />
          </div>
        </div>
      </div>
    </div>
  );
}
