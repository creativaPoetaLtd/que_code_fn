"use client";

import React, { useState, useEffect } from 'react';
import { Building2, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { getOrganizationBalance, getWalletRestrictions, getOrganizationWallet } from '@/helpers/api';
import { Wallet as WalletType, WalletRestriction } from '@/types/dashboard';

interface OrganizationWalletProps {
  organizationId: string;
  organizationName: string;
}

export const OrganizationWallet: React.FC<OrganizationWalletProps> = ({
  organizationId,
  organizationName
}) => {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [restrictions, setRestrictions] = useState<WalletRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletData();
  }, [organizationId]);

  const fetchWalletData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch wallet information
      const walletResponse = await getOrganizationWallet(organizationId);
      if (walletResponse.success) {
        setWallet(walletResponse.data);
      }

      // Fetch balance
      const balanceResponse = await getOrganizationBalance(organizationId);
      if (balanceResponse.success) {
        setBalance(balanceResponse.data.balance);
      }

      // Fetch restrictions if wallet exists
      if (walletResponse.success && walletResponse.data.walletId) {
        const restrictionsResponse: any = await getWalletRestrictions(walletResponse.data.walletId);
        if (restrictionsResponse.success) {
          setRestrictions(restrictionsResponse.data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching organization wallet data:', err);
      setError(err?.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error loading wallet</span>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{organizationName}</h3>
          <p className="text-sm text-gray-500">Organization Wallet</p>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Wallet className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Current Balance</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          {balance !== null ? `${balance.toLocaleString()} RWF` : 'N/A'}
        </div>
        {wallet && (
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${wallet.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {wallet.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
      </div>

      {/* Wallet Info */}
      {wallet && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Currency</p>
            <p className="font-medium text-gray-900">{wallet.currency}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Wallet ID</p>
            <p className="font-medium text-gray-900 text-xs">{wallet.id.slice(0, 8)}...</p>
          </div>
        </div>
      )}

      {/* Spending Restrictions */}
      {restrictions.length > 0 && (
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Spending Restrictions</span>
          </div>
          <div className="space-y-3">
            {restrictions.map((restriction) => (
              <div key={restriction.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{restriction.categoryName}</p>
                    <p className="text-sm text-gray-500">{restriction.categoryDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {restriction.amount.toLocaleString()} RWF
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Restrictions Message */}
      {restrictions.length === 0 && (
        <div className="border-t border-gray-100 pt-6">
          <div className="text-center py-4">
            <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No spending restrictions</p>
            <p className="text-xs text-gray-400">All funds are available for any category</p>
          </div>
        </div>
      )}
    </div>
  );
};
