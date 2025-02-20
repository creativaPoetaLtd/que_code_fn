"use client"
import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, Calendar, DollarSign, Clock } from 'lucide-react';

export const RecentActions = () => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleItem = (id: any) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const actions = [
    {
      id: 1,
      name: 'Claude House',
      progress: 75,
      amount: 'RWF 1,000,000',
      dueDate: '12/11/2024',
      completed: true,
      details: {
        startDate: '01/01/2024',
        description: 'Housing project phase 1',
        status: 'In Progress',
        totalMilestones: 4,
        completedMilestones: 3,
      }
    },
    {
      id: 2,
      name: 'Claude House',
      progress: 75,
      amount: 'RWF 1,000,000',
      dueDate: '12/11/2024',
      completed: true,
      details: {
        startDate: '01/01/2024',
        description: 'Housing project phase 2',
        status: 'In Progress',
        totalMilestones: 4,
        completedMilestones: 3,
      }
    },
    {
      id: 3,
      name: 'Claude House',
      progress: 75,
      amount: 'RWF 1,000,000',
      dueDate: '12/11/2024',
      completed: true,
      details: {
        startDate: '01/01/2024',
        description: 'Housing project phase 3',
        status: 'In Progress',
        totalMilestones: 4,
        completedMilestones: 3,
      }
    }
  ];

  const missRwandaEntries = [
    {
      id: 1,
      name: 'AKALIZA Amanda',
      date: '1.14.2020',
      avatar: '/api/placeholder/32/32'
    },
    {
      id: 2,
      name: 'Mutesi Jolie',
      date: '1.14.2020',
      avatar: '/api/placeholder/32/32'
    }
  ];

  return (
    <div className="w-full">
      <h3 className="text-xl sm:text-2xl text-[#00313A] font-semibold mb-4 sm:mb-6 px-4 sm:px-0">Recent Actions</h3>

      <div className="bg-[#EEF4FF] rounded-xl shadow-sm p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Claude House Actions */}
          {actions.map((action) => (
            <div
              key={action.id}
              className="bg-white rounded-lg transition-shadow hover:shadow-md"
            >
              <button
                onClick={() => toggleItem(action.id)}
                className="w-full p-3 sm:p-4 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm sm:text-base">{action.name}</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transform transition-transform duration-200 ${expandedItems.has(action.id) ? 'rotate-180' : ''
                        }`}
                    />
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-green-500 rounded-full h-1.5 sm:h-2 transition-all duration-300"
                    style={{ width: `${action.progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs sm:text-sm text-slate-500">
                  <span>{action.amount}</span>
                  {action.dueDate && (
                    <span>Due: {action.dueDate}</span>
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {expandedItems.has(action.id) && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-slate-100">
                  <div className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Started: {action.details.startDate}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Amount: {action.amount}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Due: {action.dueDate}</span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-600">
                      <p className="font-medium mb-1">Description:</p>
                      <p>{action.details.description}</p>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-600">
                      <p className="font-medium mb-1">Progress:</p>
                      <p>{action.details.completedMilestones} of {action.details.totalMilestones} milestones completed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Miss Rwanda Section */}
          <div className="bg-white rounded-lg transition-shadow hover:shadow-md">
            <button
              onClick={() => toggleItem('miss-rwanda')}
              className="w-full px-3 sm:px-4 py-3 flex items-center justify-between rounded-lg"
            >
              <span className="font-medium text-sm sm:text-base">Miss Rwanda</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transform transition-transform duration-200 ${expandedItems.has('miss-rwanda') ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {expandedItems.has('miss-rwanda') && (
              <div className="p-2 space-y-2 border-t border-slate-100">
                {missRwandaEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      <img
                        src={entry.avatar}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{entry.name}</p>
                      <p className="text-xs sm:text-sm text-slate-500">{entry.date}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActions;