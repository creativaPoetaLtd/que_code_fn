import React from 'react';
import CardSales from './CardSales';
import SalesList from './SalesList';

const salesData = [
  { name: 'Olivia Martin', email: 'olivia.martin@email.com', avatarUrl: '/avatar.png', amount: '$1,999.00' },
  { name: 'Jackson Lee', email: 'jackson.lee@email.com', avatarUrl: '/avatar.png', amount: '$39.00' },
  { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', avatarUrl: '/avatar.png', amount: '$299.00' },
  { name: 'William Kim', email: 'will@email.com', avatarUrl: '/avatar.png', amount: '$99.00' },
  { name: 'Sofia Davis', email: 'sofia.davis@email.com', avatarUrl: '/avatar.png', amount: '$39.00' },
];

const SalesPanel: React.FC = () => {
  return (
    <div className=" -mt-3 p-4 w-[40%]">
      <CardSales title="Recent Sales" subtitle="You made 265 sales this month.">
        <SalesList sales={salesData} />
      </CardSales>
    </div>
  );
};

export default SalesPanel;
