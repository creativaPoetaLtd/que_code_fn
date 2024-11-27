import React from 'react';
import Avatar from './AvatarCard';

interface SalesItemProps {
  name: string;
  email: string;
  avatarUrl: string;
  amount: string;
}

const SalesItem: React.FC<SalesItemProps> = ({ name, email, avatarUrl, amount }) => {
  return (
    <div className="flex justify-between items-center py-2">
      <Avatar name={name} email={email} avatarUrl={avatarUrl} />
      <p className="font-medium text-green-600">+{amount}</p>
    </div>
  );
};

export default SalesItem;
