"use client";

import React, { useState, useEffect } from 'react';
import { getCurrentUserInfo } from '@/helpers/api';

export const AuthDebugger: React.FC = () => {
  const [userInfo, setUserInfo] = useState<{ userId: string | null; organizationId: string | null; accountType: 'user' | 'organization' | 'unknown' } | null>(null);
  const [tokenDetails, setTokenDetails] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const info = getCurrentUserInfo();
      setUserInfo(info);

      // Get token details
      const raw = sessionStorage.getItem('token') ?? localStorage.getItem('token');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const authToken = parsed.value || parsed;
          
          if (authToken) {
            const parts = authToken.split('.');
            if (parts.length >= 2) {
              const base64Url = parts[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(atob(base64));
              setTokenDetails({
                ...payload,
                expires: new Date(payload.exp * 1000),
                expired: new Date() > new Date(payload.exp * 1000)
              });
            }
          }
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
    };

    checkAuth();
  }, []);

  if (!userInfo) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <h3 className="text-red-800 font-semibold">Authentication Debugger</h3>
        <p className="text-red-600">No authentication information found</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
      <h3 className="text-blue-800 font-semibold mb-2">Authentication Debugger</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Account Type:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            userInfo.accountType === 'organization' ? 'bg-purple-100 text-purple-800' :
            userInfo.accountType === 'user' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {userInfo.accountType}
          </span>
        </div>
        
        {userInfo.userId && (
          <div>
            <span className="font-medium">User ID:</span> 
            <span className="ml-2 font-mono text-xs">{userInfo.userId}</span>
          </div>
        )}
        
        {userInfo.organizationId && (
          <div>
            <span className="font-medium">Organization ID:</span> 
            <span className="ml-2 font-mono text-xs">{userInfo.organizationId}</span>
          </div>
        )}
        
        {tokenDetails && (
          <div>
            <span className="font-medium">Token Status:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              tokenDetails.expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {tokenDetails.expired ? 'EXPIRED' : 'VALID'}
            </span>
          </div>
        )}
        
        {tokenDetails && (
          <div>
            <span className="font-medium">Expires:</span> 
            <span className="ml-2 text-xs">{tokenDetails.expires?.toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 text-xs text-blue-600">
        <p>This component helps debug authentication issues. Remove it in production.</p>
      </div>
    </div>
  );
};
