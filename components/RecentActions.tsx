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
        <>
            <h3 className="text-2xl text-[#00313A] font-semibold mb-6">Recent Actions</h3>
            <div className="w-full max-w-md bg-[#EEF4FF] rounded-xl shadow-sm p-6">

                <div className="space-y-4">
                    {/* Claude House Actions */}
                    {actions.map((action) => (
                        <div
                            key={action.id}
                            className="bg-slate-50 rounded-lg"
                        >
                            <button
                                onClick={() => toggleItem(action.id)}
                                className="w-full p-4 space-y-2"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{action.name}</span>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        <ChevronDown
                                            className={`h-4 w-4 text-slate-400 transform transition-transform ${expandedItems.has(action.id) ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </div>
                                </div>

                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 rounded-full h-2 transition-all"
                                        style={{ width: `${action.progress}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>{action.amount}</span>
                                    {action.dueDate && (
                                        <span>Due: {action.dueDate}</span>
                                    )}
                                </div>
                            </button>

                            {/* Expanded Details */}
                            {expandedItems.has(action.id) && (
                                <div className="px-4 pb-4 border-t border-slate-200">
                                    <div className="pt-4 space-y-3">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-sm">Started: {action.details.startDate}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-600">
                                            <DollarSign className="h-4 w-4" />
                                            <span className="text-sm">Amount: {action.amount}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-sm">Due: {action.dueDate}</span>
                                        </div>

                                        <div className="text-sm text-slate-600">
                                            <p className="font-medium mb-1">Description:</p>
                                            <p>{action.details.description}</p>
                                        </div>

                                        <div className="text-sm text-slate-600">
                                            <p className="font-medium mb-1">Progress:</p>
                                            <p>{action.details.completedMilestones} of {action.details.totalMilestones} milestones completed</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Miss Rwanda Section */}
                    <div className="border rounded-lg">
                        <button
                            onClick={() => toggleItem('miss-rwanda')}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 rounded-lg"
                        >
                            <span className="font-medium">Miss Rwanda</span>
                            <ChevronDown
                                className={`h-4 w-4 text-slate-400 transform transition-transform ${expandedItems.has('miss-rwanda') ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {expandedItems.has('miss-rwanda') && (
                            <div className="p-2 space-y-2">
                                {missRwandaEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
                                            <img
                                                src={entry.avatar}
                                                alt={entry.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{entry.name}</p>
                                            <p className="text-sm text-slate-500">{entry.date}</p>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>

    );
};

