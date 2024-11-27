import React from 'react';

interface CardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const CardSales: React.FC<CardProps> = ({ title, subtitle, children }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      {children}
    </div>
  );
};

export default CardSales;
