"use client"
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';

const statusClasses: Record<string, string> = {
  valid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  used: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  expired: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
  published: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  draft: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
};

interface RecentAction {
  id: string;
  name?: string;
  type: string;
  shortDescription?: string;
  metadata?: {
    actionName?: string;
    subActionName?: string;
  };
  status: string;
  availability?: {
    endsAt: string;
  };
  validUntil?: string;
  subActions?: any[];
}

interface RecentActionsProps {
  userId?: string;
  onCreateAction?: () => void;
}

export const RecentActions = ({ userId, onCreateAction }: RecentActionsProps) => {
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrganization, setIsOrganization] = useState(false);
  const { getToken } = useAuthToken();
  const router = useRouter();

  // Check if item is expired
  const isExpired = (endsAt?: string): boolean => {
    if (!endsAt) return false;
    return new Date(endsAt) < new Date();
  };

  // Get status display - handles both organization actions and individual QR objects
  const getStatusDisplay = (action: RecentAction): { label: string; className: string } => {
    const dateToCheck = isOrganization ? action.availability?.endsAt : action.validUntil;
    
    // Check expiration first
    if (isExpired(dateToCheck)) {
      return { label: 'Expired', className: statusClasses['expired'] };
    }

    // Then use the actual status
    const status = action.status?.toLowerCase() || 'unknown';
    const className = statusClasses[status] || 'bg-gray-100 dark:bg-darkBg-interactive text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-darkBorder-light';
    
    return { label: status.charAt(0).toUpperCase() + status.slice(1), className };
  };

  useEffect(() => {
    const fetchRecentActions = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = getToken();
        
        if (!token) return;

        // First, try to determine account type by checking both endpoints
        let isOrgAccount = false;
        let isFetchedAsOrg = false;

        // Try organization endpoint first
        try {
          const orgResponse = await axios.get(
            `${baseUrl}/organizations/${userId}/actions/public`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          let actions = orgResponse.data?.data || orgResponse.data || [];
          
          if (Array.isArray(actions) && actions.length > 0) {
            // It's an organization account with actions
            // Filter out expired, then sort drafts first, then published
            const sorted = actions
              .filter((action: any) => !isExpired(action.availability?.endsAt))
              .sort((a: any, b: any) => {
                // Draft status comes first
                if (a.status === 'draft' && b.status !== 'draft') return -1;
                if (a.status !== 'draft' && b.status === 'draft') return 1;
                // Then sort by date (newest first)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .slice(0, 2);

            setRecentActions(sorted || []);
            setIsOrganization(true);
            isFetchedAsOrg = true;
          }
        } catch (orgError) {
          // Organization endpoint failed - likely a user account
        }

        // If we haven't fetched yet, try user account
        if (!isFetchedAsOrg) {
          try {
            const userResponse = await axios.get(
              `${baseUrl}/users/${userId}/qr-objects`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            let items = userResponse.data?.data || userResponse.data || [];
            if (Array.isArray(items)) {
              // Sort by creation date and get recent 2, filtered to valid tickets only and not expired
              const recent = items
                .filter((item: any) => item.status?.toLowerCase() === 'valid' && !isExpired(item.validUntil))
                .sort((a: any, b: any) => 
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                .slice(0, 2);

              setRecentActions(recent || []);
              setIsOrganization(false);
            } else {
              setRecentActions([]);
              setIsOrganization(false);
            }
          } catch (userError) {
            // Both failed - not authenticated or user has no data
            console.error('Error fetching actions:', userError);
            setRecentActions([]);
            setIsOrganization(false);
          }
        }
      } catch (error) {
        console.error('Error fetching recent actions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActions();
  }, [userId, getToken]);

  const getDaysRemaining = (endsAt?: string) => {
    if (!endsAt) return null;
    const endDate = new Date(endsAt);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  return (
    <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light">
        <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">
          Recent Actions
        </h3>
        {isOrganization && (
          <button 
            onClick={onCreateAction}
            className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-goldHover transition-colors px-3 py-1.5 rounded-full text-sm font-medium text-white dark:text-[#00313A] flex items-center gap-1"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Create new action</span>
            <span className="inline sm:hidden">New</span>
          </button>
        )}
      </div>
 
      {/* Actions Grid */}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Loading...
            </div>
          ) : recentActions.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              {isOrganization ? 'No published actions yet' : 'No tickets yet'}
            </div>
          ) : (
            recentActions.map((action) => {
              const daysLeft = getDaysRemaining(
                isOrganization ? action.availability?.endsAt : action.validUntil
              );
              const actionName = isOrganization ? action.name : action.metadata?.actionName;
              const statusDisplay = getStatusDisplay(action);

              return (
                <div
                  key={action.id}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base flex-1">
                      {actionName}
                    </h4>
                    <div className="ml-2 flex flex-col gap-1 items-end">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-200 dark:bg-emerald-700/40 text-emerald-800 dark:text-emerald-300 rounded-full capitalize">
                        {action.type}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusDisplay.className}`}>
                        {statusDisplay.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {action.shortDescription && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {action.shortDescription}
                      </p>
                    )}
                    {!isOrganization && action.metadata?.subActionName && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Tier:</span> {action.metadata.subActionName}
                      </p>
                    )}
                    {daysLeft !== null && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {daysLeft === 0 ? 'Ending today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* View All Link */}
        {recentActions.length > 0 && (
          <div className="text-right mt-3">
            <button 
              onClick={() => router.push(`/action/${userId}`)}
              className="relative text-brand-green dark:text-brand-gold text-sm font-medium group"
            >
              View all
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-green dark:bg-brand-gold group-hover:w-full transition-all duration-300 ease-out"></span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActions;