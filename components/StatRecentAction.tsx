import React from 'react';
import { Card } from '@/components/ui/card';

interface StatRecentActionsProps {
    percentage: number;
}

export const StatRecentActions = ({ percentage }: StatRecentActionsProps) => {
    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Recent Actions</h2>
                <button className="text-sm text-gray-600">today</button>
            </div>
            <div className="relative pt-2">
                <div className="w-full h-32 bg-teal-600 rounded-full overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{percentage}%</div>
                            <div className="text-sm mt-1">Total Income</div>
                        </div>
                    </div>
                </div>
            </div>
            <button className="w-full mt-6 py-2 text-sm text-teal-600 hover:text-teal-700 transition-colors">
                View progress →
            </button>
        </Card>
    );
};