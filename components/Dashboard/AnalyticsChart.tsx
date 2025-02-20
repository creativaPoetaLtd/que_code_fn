import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Modal, Table } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AnalyticsData } from '@/types/dashboard';

interface AnalyticsChartProps {
  data: AnalyticsData[];
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<AnalyticsData | null>(null);

  const handleBarClick = (data: any, index: number) => {
    setSelectedData(data);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedData(null);
  };

  const columns = [
    {
      title: 'Month',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Income',
      dataIndex: 'income',
      key: 'income',
      render: (income: number) => `$${income.toLocaleString()}`,
    },
    {
      title: 'Expense',
      dataIndex: 'expense',
      key: 'expense',
      render: (expense: number) => `$${expense.toLocaleString()}`,
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold mb-4 md:mb-0">Analytics</h2>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="income"
              fill="#4caf50"
              name="Income"
              onClick={handleBarClick}
            />
            <Bar
              dataKey="expense"
              fill="#f44336"
              name="Expense"
              onClick={handleBarClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Modal
        title="Detailed Information"
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
      >
        {selectedData && (
          <Table
            columns={columns}
            dataSource={[selectedData]}
            pagination={false}
            rowKey="name"
          />
        )}
      </Modal>
    </Card>
  );
};

export default AnalyticsChart;
