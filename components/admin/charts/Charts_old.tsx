'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TransactionChartProps {
  className?: string;
}

export function TransactionChart({ className }: TransactionChartProps) {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Transactions',
        data: [820, 740, 930, 680, 910, 780, 720],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderRadius: 6,
        maxBarThickness: 20,
      },
      {
        label: 'Disputes',
        data: [18, 22, 27, 14, 31, 19, 12],
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderRadius: 6,
        maxBarThickness: 16,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f9fafb',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.9)',
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.25)',
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.9)',
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div className={`h-40 ${className}`}>
      <Bar data={data} options={options} />
    </div>
  );
}

interface FlowChartProps {
  className?: string;
}

export function FlowChart({ className }: FlowChartProps) {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Payments',
        data: [120, 145, 160, 130, 190, 170, 150],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 2,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
      },
      {
        label: 'Donations',
        data: [40, 45, 60, 55, 72, 65, 58],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
      {
        label: 'Votes',
        data: [200, 210, 260, 230, 310, 290, 280],
        borderColor: 'rgba(225, 29, 72, 1)',
        backgroundColor: 'rgba(225, 29, 72, 0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 2,
        pointBackgroundColor: 'rgba(225, 29, 72, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f9fafb',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.9)',
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.25)',
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.9)',
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div className={`h-44 ${className}`}>
      <Line data={data} options={options} />
    </div>
  );
}