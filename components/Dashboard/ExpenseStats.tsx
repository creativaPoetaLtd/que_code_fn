"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Modal, Table, Select, Spin, Alert } from 'antd';
import { ExpenseData } from '@/types/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getCategoryBreakdown, getRecentExpenses } from '@/helpers/api';
import { useAuthToken } from '@/hooks/use-auth-token';
import { getUserIdFromToken, isTokenExpired } from '@/utils/jwtUtils';

const { Option } = Select;

interface CategoryBreakdownItem {
    category: string;
    name: string;
    amount: number;
    percentage: number;
    icon: string;
    color: string;
}

interface RecentExpense {
    id: string;
    amount: number;
    description: string;
    category: string;
    categoryName: string;
    categoryColor: string;
    createdAt: string;
}

interface ExpenseStatsProps {
    period?: '7d' | '30d' | '90d' | '365d';
}

export const ExpenseStats = ({ period = '30d' }: ExpenseStatsProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryBreakdownItem | null>(null);
    const [categoryData, setCategoryData] = useState<CategoryBreakdownItem[]>([]);
    const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '365d'>(period);
    const { getToken } = useAuthToken();

    useEffect(() => {
        fetchData();
    }, [selectedPeriod]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = getToken();
            let userId: string | null | undefined;
            if (token && !isTokenExpired(token)) {
                userId = getUserIdFromToken(token);
            }
            
            if (!userId) {
                setError('Please log in to view expense statistics');
                return;
            }

            const [categoryResponse, recentResponse] = await Promise.all([
                getCategoryBreakdown(userId, selectedPeriod, token || undefined),
                getRecentExpenses(userId, 50, token || undefined)
            ]);

            setCategoryData(categoryResponse.data || []);
            setRecentExpenses(recentResponse.data || []);
        } catch (err) {
            setError('Failed to fetch expense data');
            console.error('Error fetching expense data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSegmentClick = (item: CategoryBreakdownItem) => {
        setSelectedCategory(item);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedCategory(null);
    };

    const handlePeriodChange = (newPeriod: '7d' | '30d' | '90d' | '365d') => {
        setSelectedPeriod(newPeriod);
    };

    // Convert category data to pie chart format
    const pieChartData: ExpenseData[] = Array.isArray(categoryData)
  ? categoryData.map(item => ({
      name: item.name,
      value: Math.round(item.percentage),
      color: item.color
    }))
  : [];

    // Get expenses for selected category
    const getCategoryExpenses = (categoryId: string) => {
        return recentExpenses.filter(expense => expense.category === categoryId);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'date',
            render: (date: string) => new Date(date).toLocaleDateString(),
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

    // Custom renderer for pie chart labels
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case '7d': return 'Last 7 days';
            case '30d': return 'Last 30 days';
            case '90d': return 'Last 3 months';
            case '365d': return 'Last year';
            default: return 'Last 30 days';
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex justify-center items-center h-64">
                    <Spin size="large" />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-6">
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                />
            </Card>
        );
    }

    if (categoryData.length === 0) {
        return (
            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Expense Statistics</h2>
                    <Select
                        value={selectedPeriod}
                        onChange={handlePeriodChange}
                        style={{ width: 150 }}
                    >
                        <Option value="7d">Last 7 days</Option>
                        <Option value="30d">Last 30 days</Option>
                        <Option value="90d">Last 3 months</Option>
                        <Option value="365d">Last year</Option>
                    </Select>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-500">No expense data available for {getPeriodLabel(selectedPeriod)}</p>
                    <p className="text-sm text-gray-400 mt-2">Start making categorized transactions to see your expense breakdown</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Expense Statistics</h2>
                <Select
                    value={selectedPeriod}
                    onChange={handlePeriodChange}
                    style={{ width: 150 }}
                >
                    <Option value="7d">Last 7 days</Option>
                    <Option value="30d">Last 30 days</Option>
                    <Option value="90d">Last 3 months</Option>
                    <Option value="365d">Last year</Option>
                </Select>
            </div>
            <div className="flex justify-center mb-6">
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieChartData}
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
                                    const categoryItem = categoryData.find(cat => cat.name === data.name);
                                    if (categoryItem) {
                                        handleSegmentClick(categoryItem);
                                    }
                                }}
                                cursor="pointer"
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => [`${value}%`, 'Percentage']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {Array.isArray(categoryData) && categoryData.map((item) => (
                    <div
                        key={item.category}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        onClick={() => handleSegmentClick(item)}
                    >
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">{item.icon}</span>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">${item.amount.toFixed(2)} ({Math.round(item.percentage)}%)</div>
                        </div>
                    </div>
                ))}
            </div>
            <Modal
                title={`${selectedCategory?.name} Details - ${getPeriodLabel(selectedPeriod)}`}
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={null}
                width={800}
            >
                {selectedCategory && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{selectedCategory.icon}</span>
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedCategory.name}</h3>
                                        <p className="text-gray-600">Total spent: ${selectedCategory.amount.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold" style={{ color: selectedCategory.color }}>
                                        {Math.round(selectedCategory.percentage)}%
                                    </div>
                                    <div className="text-sm text-gray-500">of total expenses</div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                            <Table
                                columns={columns}
                                dataSource={getCategoryExpenses(selectedCategory.category)}
                                pagination={{ pageSize: 10 }}
                                size="small"
                                locale={{ emptyText: 'No transactions found for this category' }}
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
};

export default ExpenseStats;