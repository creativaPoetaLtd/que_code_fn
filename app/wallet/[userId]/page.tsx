"use client";

import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/shared/BackButton';
import { useAccent } from '@/hooks/use-accent';
import { useUserInfo } from '@/hooks/use-user-info';
import WalletView from '@/components/Wallet/WalletView';

export default function WalletPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const { isExpanded } = useSidebar();
  const accent = useAccent();
  const { accountType } = useUserInfo();
  const entityType = accountType === 'organization' ? 'organization' : 'user';

  return (
    <div className={`flex min-h-screen bg-gray-50 ${accent.darkBgPage}`}>
      {/* Sidebar navigation */}
      <Navigation />
      {/* Main content */}
      <div
        className={cn(
          'flex-1 transition-all duration-300',
          isExpanded ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Header />
        </div>

        {/* Page Content */}
        <div className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <BackButton className="mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {entityType === 'organization' ? 'Organization Wallet' : 'My Wallet'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Balance, purchased actions, tickets and everything you keep in your wallet.
              </p>
            </div>
            {userId && <WalletView entityId={userId} entityType={entityType} />}
          </div>
        </div>
      </div>
    </div>
  );
}
