"use client";

import React from "react";
import { Eye, EyeOff, TrendingUp, ArrowUpRight } from "lucide-react";

interface BalanceCardProps {
  balance: number;
  currency?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  monthlyChange?: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  currency = "RWF",
  isVisible = true,
  onToggleVisibility,
  monthlyChange = 0
}) => {
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-[#00313A] to-[#00252e] rounded-2xl p-6 text-white shadow-lg relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-300">Available Balance</p>
          <div className="flex items-center space-x-3">
            {isVisible ? (
              <h2 className="text-3xl font-bold">
                {currency} {formatBalance(balance)}
              </h2>
            ) : (
              <h2 className="text-3xl font-bold">
                {currency} ••••••
              </h2>
            )}
            <button
              onClick={onToggleVisibility}
              className="p-1 hover:bg-white/10 rounded-full transition"
            >
              {isVisible ? (
                <EyeOff className="w-5 h-5 text-gray-300" />
              ) : (
                <Eye className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Change */}
      {monthlyChange !== 0 && (
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            monthlyChange > 0 
              ? 'bg-green-900/30 text-green-400' 
              : 'bg-red-900/30 text-red-400'
          }`}>
            {monthlyChange > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <ArrowUpRight className="w-3 h-3 rotate-45" />
            )}
            <span>
              {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}% this month
            </span>
          </div>
        </div>
      )}

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
    </div>
  );
};

export default BalanceCard;
