"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle, Shield, Clock } from "lucide-react";

interface UserProfileCardProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;
    lastSeen?: string;
    paymentLink: string;
  };
  onSendMoney: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, onSendMoney }) => {
  return (
    <div className="bg-[#00252e] rounded-2xl p-6 shadow-lg border border-white/10">
      {/* User Info */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 shadow-inner">
            <Image
              src={user.avatar || "/Images/Profile.png"}
              alt={user.name}
              width={80}
              height={80}
              className="object-cover rounded-full"
            />
          </div>
          {user.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-semibold text-white">{user.name}</h3>
            {user.isVerified && (
              <Shield className="w-4 h-4 text-green-500" />
            )}
          </div>
          <p className="text-sm text-gray-400">User ID: #{user.id}</p>
          {user.lastSeen && (
            <div className="flex items-center space-x-1 mt-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <p className="text-xs text-gray-500">{user.lastSeen}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Link Preview */}
      <div className="bg-[#00313A] rounded-lg p-3 mb-6">
        <p className="text-xs text-gray-400 mb-1">Payment Link</p>
        <p className="text-sm text-blue-400 truncate">{user.paymentLink}</p>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center space-x-2 bg-green-900/20 rounded-lg p-3 mb-6">
        <Shield className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-400">Secure Payment</span>
      </div>

      {/* Send Money Button */}
      <button
        onClick={onSendMoney}
        className="w-full bg-green-600 hover:bg-green-700 transition text-white text-lg font-medium py-4 rounded-xl shadow-md"
      >
        Send Money
      </button>
    </div>
  );
};

export default UserProfileCard;
