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
        "flex-1 min-w-0 transition-all duration-300",
        isExpanded ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Header */}
        <div className="px-4 lg:px-6 pt-3 lg:pt-5">
          <Header />
        </div>

        {/* Page Content */}
        <div className="px-4 lg:px-6 pt-3 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <TransactionList
              heading={
                <>
                  <BackButton label="" className="px-2" />
                  <h1 className="truncate text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
