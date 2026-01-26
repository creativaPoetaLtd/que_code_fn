"use client"
import React from 'react';
import { Plus } from 'lucide-react';

export const RecentActions = () => {
  const campaigns = [
    {
      id: 1,
      name: 'Family trip savings',
      current: 1300,
      goal: 2000,
      daysLeft: 5,
    },
    {
      id: 2,
      name: "Sarah's birthday gift",
      current: 450,
      goal: 500,
      daysLeft: 2,
    },
  ];

  const getProgressPercentage = (current: number, goal: number) => {
    return (current / goal) * 100;
  };

  return (
    <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light">
        <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">
          Active campaigns & groups
        </h3>
        <button className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-goldHover transition-colors px-3 py-1.5 rounded-full text-sm font-medium text-white dark:text-[#00313A] flex items-center gap-1">
          <Plus size={16} />
          <span className="hidden sm:inline">Create new action</span>
          <span className="inline sm:hidden">New</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light rounded-2xl p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-2">
                {campaign.name}
              </h4>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    €{campaign.current.toLocaleString()} / €{campaign.goal.toLocaleString()}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {campaign.daysLeft} days left
                  </span>
                </div>

                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5 sm:h-2 overflow-hidden">
                  <div
                    className="bg-green-500 dark:bg-brand-gold h-full rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(campaign.current, campaign.goal)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-right mt-3">
          <button className="relative text-brand-green dark:text-brand-gold text-sm font-medium group">
            View all
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-green dark:bg-brand-gold group-hover:w-full transition-all duration-300 ease-out"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentActions;