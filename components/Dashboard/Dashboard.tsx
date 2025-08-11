'use client'
import React from 'react';
import { StatCard } from './StatCard';

import { TransactionList } from './TransactionList';
import { ExpenseStats } from './ExpenseStats';
import AnalyticsChart from './AnalyticsChart';
import { StatRecentActions } from '../StatRecentAction';


const Dashboard = () => {
  const analyticsData = [
    { name: 'Jan', income: 35000, expense: 20000 },
    { name: 'Feb', income: 28000, expense: 15000 },
    { name: 'Mar', income: 30000, expense: 18000 },
    { name: 'Apr', income: 35000, expense: 22000 },
    { name: 'May', income: 40000, expense: 25000 },
    { name: 'Jun', income: 25000, expense: 15000 },
    { name: 'Jul', income: 22000, expense: 13000 },
    { name: 'Aug', income: 20000, expense: 12000 },
  ];


  const expenseData = [
    { name: 'Entertainment', value: 30, color: '#1e40af' },
    { name: 'Bill Expense', value: 15, color: '#f97316' },
    { name: 'Investment', value: 20, color: '#e11d48' },
    { name: 'Others', value: 35, color: '#2563eb' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-8 lg:ml-20">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back, Raisa 👋</h1>
          <p className="text-gray-600">Here's what's happening with your store today.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard title="Total Income" amount="632,000" percentage={1.29} type="income" />
              <StatCard title="Total Outcome" amount="632,000" percentage={1.29} type="outcome" />
            </div>
            <AnalyticsChart data={analyticsData} />
            <TransactionList />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <ExpenseStats data={expenseData} />
            <StatRecentActions percentage={75} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;