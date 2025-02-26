import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Modal, Table } from 'antd';
import { ExpenseData } from '@/types/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseStatsProps {
    data: ExpenseData[];
}

interface DetailedExpenseItem {
    key: number;
    date: string;
    description: string;
    amount: number;
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
    const detailedData: Record<string, DetailedExpenseItem[]> = {
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

    // Create summary data for the modal pie chart
    const getModalPieData = (categoryName: string) => {
        if (!categoryName) return [];

        const categoryItems = detailedData[categoryName];
        if (!categoryItems) return [];

        // Group by description
        const groupedData = categoryItems.reduce((acc, item) => {
            const existingItem = acc.find(i => i.description === item.description);
            if (existingItem) {
                existingItem.amount += item.amount;
            } else {
                acc.push({
                    description: item.description,
                    amount: item.amount
                });
            }
            return acc;
        }, [] as { description: string; amount: number }[]);

        return groupedData;
    };

    // Calculate total for selected category
    const getSelectedCategoryTotal = (categoryName: string) => {
        if (!categoryName) return 0;
        const categoryItems = detailedData[categoryName];
        if (!categoryItems) return 0;
        return categoryItems.reduce((total, item) => total + item.amount, 0);
    };

    // Custom renderer for pie chart labels
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = 25 + innerRadius + (outerRadius - innerRadius);
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return percent > 0.05 ? (
            <text
                x={x}
                y={y}
                fill="#000"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        ) : null;
    };

    // Custom click handler for pie chart
    const onPieClick = (data: any, index: number) => {
        if (data && data.name) {
            const selectedItem = data.data.find((item: ExpenseData) => item.name === data.name);
            if (selectedItem) {
                handleSegmentClick(selectedItem);
            }
        }
    };

    return (
        <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Expense Statistics</h2>
            <div className="flex justify-center mb-6">
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                                nameKey="name"
                                onClick={(data, index) => {
                                    const item = data as unknown as ExpenseData;
                                    handleSegmentClick(item);
                                }}
                                cursor="pointer"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [`${value}%`, 'Percentage']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
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
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={null}
                width={700}
            >
                {selectedCategory && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Summary</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getModalPieData(selectedCategory.name)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="amount"
                                                nameKey="description"
                                                label={({ description }) => description}
                                            >
                                                {getModalPieData(selectedCategory.name).map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={index % 2 === 0 ? selectedCategory.color : `${selectedCategory.color}99`}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="text-center mt-2">
                                    <p className="text-gray-500">Total: ${getSelectedCategoryTotal(selectedCategory.name).toFixed(2)}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Transactions</h3>
                                <Table
                                    columns={columns}
                                    dataSource={detailedData[selectedCategory.name] || []}
                                    pagination={false}
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
};