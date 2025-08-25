"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, Statistic, Row, Col, Spin, Alert, DatePicker } from 'antd';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getExpenseSummary, getSpendingTrends } from '@/helpers/api';
import { useAuthToken } from '@/hooks/use-auth-token';
import { getUserIdFromToken, isTokenExpired } from '@/utils/jwtUtils';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, Target } from 'lucide-react';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ExpenseSummary {
    totalExpenses: number;
    totalTransactions: number;
    averageTransaction: number;
    previousPeriodExpenses: number;
    growthPercentage: number;
    period: string;
}

interface SpendingTrend {
    date: string;
    amount: number;
    transactionCount: number;
    period: string;
}

interface AdvancedAnalyticsProps {
    defaultPeriod?: '7d' | '30d' | '90d' | '365d';
}

const AdvancedAnalytics = ({ defaultPeriod = '30d' }: AdvancedAnalyticsProps) => {
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '365d'>(defaultPeriod);
    const [summary, setSummary] = useState<ExpenseSummary | null>(null);
    const [trends, setTrends] = useState<SpendingTrend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuthToken();

    useEffect(() => {
        fetchAnalytics();
    }, [selectedPeriod]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = getToken();
            let userId: string | null | undefined;
            if (token && !isTokenExpired(token)) {
                userId = getUserIdFromToken(token);
            }
            
            if (!userId) {
                setError('Please log in to view analytics');
                return;
            }

            const [summaryResponse, trendsResponse] = await Promise.all([
                getExpenseSummary(userId, selectedPeriod, token || undefined),
                getSpendingTrends(userId, selectedPeriod, token || undefined)
            ]);

            setSummary(summaryResponse.data || null);
            setTrends(trendsResponse.data || []);
        } catch (err) {
            setError('Failed to fetch analytics data');
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = (newPeriod: '7d' | '30d' | '90d' | '365d') => {
        setSelectedPeriod(newPeriod);
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

    const formatTrendData = (data: SpendingTrend[]) => {
        if (!Array.isArray(data)) return [];
        return data.map(item => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }),
            amount: Number(item.amount)
        }));
    };    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-center items-center h-64">
                    <Spin size="large" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                className="mb-6"
            />
        );
    }

    if (!summary) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PieChart className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No analytics data available for {getPeriodLabel(selectedPeriod)}</p>
                <p className="text-sm text-gray-400 mt-2">Start making transactions to see your spending analytics</p>
            </div>
        );
    }

    const chartData = formatTrendData(trends);

    return (
        <div className="space-y-6">
            {/* Header with Period Selector */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Spending Analytics</h2>
                    <p className="text-gray-600">Track your spending patterns and trends</p>
                </div>
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

            {/* Summary Statistics */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <DollarSign className="w-8 h-8 text-blue-600 mr-2" />
                        </div>
                        <Statistic
                            title="Total Expenses"
                            value={summary.totalExpenses}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Target className="w-8 h-8 text-green-600 mr-2" />
                        </div>
                        <Statistic
                            title="Transactions"
                            value={summary.totalTransactions}
                            valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Calendar className="w-8 h-8 text-purple-600 mr-2" />
                        </div>
                        <Statistic
                            title="Average Transaction"
                            value={summary.averageTransaction}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            {summary.growthPercentage >= 0 ? (
                                <TrendingUp className="w-8 h-8 text-red-600 mr-2" />
                            ) : (
                                <TrendingDown className="w-8 h-8 text-green-600 mr-2" />
                            )}
                        </div>
                        <Statistic
                            title="Change"
                            value={Math.abs(summary.growthPercentage)}
                            precision={1}
                            suffix="%"
                            valueStyle={{ 
                                color: summary.growthPercentage >= 0 ? '#f5222d' : '#52c41a',
                                fontSize: '20px'
                            }}
                            prefix={summary.growthPercentage >= 0 ? '+' : '-'}
                        />
                        <p className="text-xs text-gray-500 mt-1">vs previous period</p>
                    </Card>
                </Col>
            </Row>

            {/* Spending Trends Chart */}
            {chartData.length > 0 && (
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Card>
                            <h3 className="text-lg font-semibold mb-4">Spending Trends</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value, name) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                                            labelFormatter={(label) => `Date: ${label}`}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="amount" 
                                            stroke="#1890ff" 
                                            fillOpacity={1} 
                                            fill="url(#colorAmount)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card>
                            <h3 className="text-lg font-semibold mb-4">Transaction Frequency</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value, name) => [value, 'Transactions']}
                                            labelFormatter={(label) => `Date: ${label}`}
                                        />
                                        <Bar dataKey="transactionCount" fill="#52c41a" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Daily Average and Insights */}
            <Row gutter={[16, 16]}>
                <Col xs={24}>
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Insights & Recommendations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">Daily Average</h4>
                                <p className="text-2xl font-bold text-blue-600">
                                    ${(summary.totalExpenses / (selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365)).toFixed(2)}
                                </p>
                                <p className="text-sm text-blue-700 mt-1">per day in {getPeriodLabel(selectedPeriod)}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-medium text-green-900 mb-2">Spending Frequency</h4>
                                <p className="text-2xl font-bold text-green-600">
                                    {trends.length > 0 ? (summary.totalTransactions / trends.length).toFixed(1) : '0'}
                                </p>
                                <p className="text-sm text-green-700 mt-1">transactions per active day</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="font-medium text-purple-900 mb-2">Trend Direction</h4>
                                <div className="flex items-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {summary.growthPercentage >= 0 ? '📈' : '📉'}
                                    </div>
                                    <div className="ml-2">
                                        <p className="text-sm text-purple-700">
                                            {summary.growthPercentage >= 0 ? 'Increasing' : 'Decreasing'}
                                        </p>
                                        <p className="text-xs text-purple-600">spending trend</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdvancedAnalytics;
