import React from 'react';
import SalesItem from './SalesItem';

interface Sale {
  name: string;
  email: string;
  avatarUrl: string;
  amount: string;
}

interface SalesListProps {
  sales: Sale[];
}

const SalesList: React.FC<SalesListProps> = ({ sales }) => {
  return (
    <div>
      {sales.map((sale, index) => (
        <SalesItem 
          key={index} 
          name={sale.name} 
          email={sale.email} 
          avatarUrl={sale.avatarUrl} 
          amount={sale.amount} 
        />
      ))}
    </div>
  );
};

export default SalesList;
