"use client";
import { TransactionList } from '@/components/Dashboard/TransactionList';

import Navigation from '@/components/Navigation';

export default function TransactionsPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar navigation */}
      <Navigation />
      {/* Main content */}
      <div className="flex-1 bg-gray-50 p-4 ml-14">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
            <p className="text-gray-600 mt-2">View and manage your transaction history</p>
          </div>
          <TransactionList />
        </div>
      </div>
    </div>
  );
}
