"use client";
import { TransactionList } from '@/components/Dashboard/TransactionList';
import { Header } from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/shared/BackButton';
import { useAccent } from '@/hooks/use-accent';

export default function TransactionsPage() {
  const { isExpanded } = useSidebar();
  const accent = useAccent();
  return (
    <div className={`flex min-h-screen bg-gray-50 ${accent.darkBgPage}`}>
      {/* Sidebar navigation */}
      <Navigation />
      {/* Main content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isExpanded ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Header />
        </div>
        
        {/* Page Content */}
        <div className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <BackButton className="mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">All Transactions</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">View and manage your transaction history</p>
            </div>
            <TransactionList toolbarInHeader />
          </div>
        </div>
      </div>
    </div>
  );
}
