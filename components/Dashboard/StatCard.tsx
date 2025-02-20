import React from 'react';
import { Card } from '@/components/ui/card';
import { StatCardProps } from '@/types/dashboard';


export const StatCard = ({ title, amount, percentage, type }: StatCardProps) => {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <h3 className="text-2xl font-semibold mt-1">${amount}</h3>
                </div>
                <div
                    className={`px-2 py-1 rounded text-xs ${type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}
                >
                    {percentage}%
                </div>
            </div>
        </Card>
    );
};