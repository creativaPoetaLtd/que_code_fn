'use client'
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", patients: 200 },
  { month: "Feb", patients: 450 },
  { month: "Mar", patients: 300 },
  { month: "Apr", patients: 500 },
  { month: "May", patients: 700 },
  { month: "Jun", patients: 600 },
  { month: "Jul", patients: 800 },
  { month: "Aug", patients: 650 },
  { month: "Sep", patients: 400 },
  { month: "Oct", patients: 300 },
  { month: "Nov", patients: 500 },
  { month: "Dec", patients: 700 },
];

const RevenueChart = () => {
  return (
    <div className="RevenueChart flex flex-col h-full bg-white w-[60%] pb-2 rounded-md p-4">
      <div className="flex justify-between items-center pb-4">
        <h2 className="text-lg font-bold text-black">Revenue generated</h2>
      </div>
      <ResponsiveContainer width="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="patients" fill="#028934" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
