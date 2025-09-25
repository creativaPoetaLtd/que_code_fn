"use client";

import React, { useState } from 'react';
import { OrganizationWallet } from '@/components/OrganizationWallet';
import { Building2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const OrganizationWalletDemo = () => {
  const router = useRouter();
  const [selectedOrg, setSelectedOrg] = useState<string>('');

  // Mock organization data - in real app, this would come from API
  const organizations = [
    {
      id: 'org-1',
      name: 'Tech Solutions Ltd',
      description: 'Software development company'
    },
    {
      id: 'org-2', 
      name: 'Green Energy Co',
      description: 'Renewable energy provider'
    },
    {
      id: 'org-3',
      name: 'Healthcare Partners',
      description: 'Medical services organization'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Organization Wallets</h1>
                <p className="text-sm text-gray-500">Demo of organization wallet functionality</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Organization Selection */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Organization</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => setSelectedOrg(org.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedOrg === org.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500">{org.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Organization Wallet Display */}
        {selectedOrg && (
          <div className="mb-8">
            <OrganizationWallet
              organizationId={selectedOrg}
              organizationName={organizations.find(org => org.id === selectedOrg)?.name || 'Unknown Organization'}
            />
          </div>
        )}

        {/* API Integration Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Integration Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Supported Operations</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Organization wallet balance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Spending restrictions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Transaction history</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Organization transfers</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Transfer Scenarios</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>User → Organization</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Organization → User</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Organization → Organization</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Spending constraints</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8">
          <h3 className="font-medium text-blue-900 mb-2">Documentation</h3>
          <p className="text-sm text-blue-700 mb-4">
            Full API documentation and integration notes are available in the docs folder.
          </p>
          <div className="flex space-x-4">
            <a
              href="/docs/TRANSACTION_API_DOCUMENTATION.md"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              API Documentation
            </a>
            <a
              href="/docs/INTEGRATION_NOTES.md"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Integration Notes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationWalletDemo;
