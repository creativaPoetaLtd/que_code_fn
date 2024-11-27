import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  name: string;
  email: string;
  avatarUrl: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, email, avatarUrl }) => {
  return (
    <div className="flex items-center">
      <Image
      width={100}
      height={100}
      src={avatarUrl} 
      alt={`${name}'s avatar`} 
      className="w-10 h-10 rounded-full" 
       />
      <div className="ml-3">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
    </div>
  );
};

export default Avatar;
