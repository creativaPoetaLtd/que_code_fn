import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Modal, Table } from 'antd';
import { ExpenseData } from '@/types/dashboard';

interface ExpenseStatsProps {
    data: ExpenseData[];
}

export const ExpenseStats = ({ data }: ExpenseStatsProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ExpenseData | null>(null);

    const handleSegmentClick = (item: ExpenseData) => {
        setSelectedCategory(item);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedCategory(null);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `$${amount.toFixed(2)}`,
        },
    ];

    // Sample detailed data for each category
    const detailedData: any = {
        Entertainment: [
            { key: 1, date: '2025-02-01', description: 'Movie Tickets', amount: 50 },
            { key: 2, date: '2025-02-05', description: 'Concert', amount: 150 },
        ],
        'Bill Expense': [
            { key: 1, date: '2025-02-02', description: 'Electricity Bill', amount: 75 },
            { key: 2, date: '2025-02-06', description: 'Water Bill', amount: 40 },
        ],
        Investment: [
            { key: 1, date: '2025-02-03', description: 'Stocks', amount: 200 },
            { key: 2, date: '2025-02-07', description: 'Bonds', amount: 300 },
        ],
        Others: [
            { key: 1, date: '2025-02-04', description: 'Groceries', amount: 100 },
            { key: 2, date: '2025-02-08', description: 'Clothing', amount: 200 },
        ],
    };

    return (
        <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Expense Statistics</h2>
            <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {data.reduce((acc, item, index) => {
                            const prevTotal = index === 0 ? 0 : data
                                .slice(0, index)
                                .reduce((sum, curr) => sum + curr.value, 0);

                            return [
                                ...acc,
                                <circle
                                    key={item.name}
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke={item.color}
                                    strokeWidth="20"
                                    strokeDasharray={`${item.value * 2.51} 251`}
                                    strokeDashoffset={-prevTotal * 2.51}
                                    className="transition-all duration-1000 cursor-pointer"
                                    onClick={() => handleSegmentClick(item)}
                                />,
                            ];
                        }, [] as JSX.Element[])}
                    </svg>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {data.map((item) => (
                    <div
                        key={item.name}
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => handleSegmentClick(item)}
                    >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.name} ({item.value}%)</span>
                    </div>
                ))}
            </div>
            <Modal
                title={`${selectedCategory?.name} Details`}
                open={isModalOpen} // Updated from 'visible' to 'open'
                onCancel={handleModalClose}
                footer={null}
            >
                <Table
                    columns={columns}
                    dataSource={selectedCategory ? detailedData[selectedCategory.name] : []}
                    pagination={false}
                />
            </Modal>
        </Card>
    );
};
