"use client";

import React, { useState } from 'react';
import { AuthDebugger } from '@/components/AuthDebugger';
import { getOrganizationWallet, getCurrentUserInfo } from '@/helpers/api';

const AuthDebugPage = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testOrganizationAPI = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const userInfo = getCurrentUserInfo();
      console.log('Current user info:', userInfo);
      
      if (!userInfo.organizationId) {
        setTestResult('❌ No organization ID found in token. You might be logged in as a regular user.');
        return;
      }
      
      setTestResult('🔄 Testing organization wallet API...');
      
      const result = await getOrganizationWallet(userInfo.organizationId);
      setTestResult(`✅ Success! Organization wallet data: ${JSON.stringify(result, null, 2)}`);
      
    } catch (error: any) {
      console.error('Test error:', error);
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug Page</h1>
        
        <AuthDebugger />
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Organization API Test</h2>
          <button
            onClick={testOrganizationAPI}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Organization Wallet API'}
          </button>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debugging Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check if you're logged in (look for token in the debugger above)</li>
            <li>Verify your account type (should be 'organization' for organization wallet access)</li>
            <li>Check if your token is expired</li>
            <li>Click "Test Organization Wallet API" to test the actual API call</li>
            <li>Check browser console for detailed error messages</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPage;
