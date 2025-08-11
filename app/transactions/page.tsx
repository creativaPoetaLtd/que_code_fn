"use client";
import { TransactionList } from '@/components/Dashboard/TransactionList';

export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
          <p className="text-gray-600 mt-2">View and manage your transaction history</p>
        </div>
        <TransactionList />
      </div>
    </div>
  );
}
