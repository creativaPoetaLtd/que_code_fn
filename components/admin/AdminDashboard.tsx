'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import OverviewSection from './sections/OverviewSection';
import UsersSection from './sections/UsersSection';
import OrganizationsSection from './sections/OrganizationsSection';
import TransactionsSection from './sections/TransactionsSection';
import WalletSection from './sections/WalletSection';
import { cn } from '@/lib/utils';

// View titles and subtitles
const viewConfig = {
  overview: {
    title: 'Super Admin overview',
    subtitle: 'Global status of users, orgs, wallets & risk',
  },
  users: {
    title: 'User management',
    subtitle:
      'Manage user accounts , monitor activity, and oversee verification and approval',
  },
  organizations: {
    title: 'Organization management',
    subtitle: 'Organizations management and oversight',
  },
  transactions: {
    title: 'Transactions',
    subtitle: 'Monitor payments, transfers, top-ups, and withdrawals',
  },
  financial: {
    title: 'Wallet & Financial Management',
    subtitle: 'Monitor wallets, restrictions, balances and financial flows',
  },
  disputes: {
    title: 'Disputes & chargebacks',
    subtitle: 'End-to-end view of open disputes and admin decisions',
  },
  actions: {
    title: 'QC Pro actions management',
    subtitle: 'Global view of tickets, donations, transport, votes',
  },
  merchants: {
    title: 'Merchants',
    subtitle: 'Shops, transport companies, ticketing & online merchants',
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'High-level dashboards on users, orgs, and money flows',
  },
  admins: {
    title: 'Admin roles & access',
    subtitle:
      'Manage who controls QC: super admins, risk admins, finance admins',
  },
  config: {
    title: 'Platform configuration',
    subtitle:
      'Feature flags, notification templates, gateways, payment providers',
  },
  logs: {
    title: 'Audit logs',
    subtitle:
      'Every sensitive admin action is recorded for security and traceability',
  },
  support: {
    title: 'Support center',
    subtitle: 'Central inbox for user issues, disputes, merchant requests',
  },
  queries: {
    title: 'User queries',
    subtitle: 'Questions and requests sent by users from the app or web',
  },
  health: {
    title: 'System health',
    subtitle: 'Uptime, latency, error rate and background job queues',
  },
  security: {
    title: 'Security & Compliance',
    subtitle: 'Suspicious activity, IP blocks, KYC/AML, GDPR, AI monitoring',
  },
  settings: {
    title: 'Settings',
    subtitle:
      'Global configuration for features, fees, branding, notifications',
  },
};

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentView =
    viewConfig[activeView as keyof typeof viewConfig] || viewConfig.overview;

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className='min-h-screen flex bg-gray-50 text-gray-900'>
        <div className='w-64 bg-white border-r border-gray-200' />
        <div className='flex-1 flex flex-col min-w-0'>
          <div className='h-16 bg-white border-b border-gray-200' />
          <main className='flex-1 p-4 lg:p-6 overflow-y-auto'>
            <div className='animate-pulse'>
              <div className='h-8 bg-gray-200 rounded w-1/4 mb-4' />
              <div className='h-4 bg-gray-200 rounded w-1/2 mb-8' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='h-32 bg-gray-200 rounded' />
                <div className='h-32 bg-gray-200 rounded' />
                <div className='h-32 bg-gray-200 rounded' />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewSection />;
      case 'users':
        return <UsersSection />;
      case 'organizations':
        return <OrganizationsSection />;
      case 'transactions':
        return <TransactionsSection />;
      case 'financial':
        return <WalletSection />;
      case 'disputes':
        return <PlaceholderSection title='Disputes & Chargebacks' />;
      case 'actions':
        return <PlaceholderSection title='QC Pro Actions' />;
      case 'merchants':
        return <PlaceholderSection title='Merchants' />;
      case 'analytics':
        return <PlaceholderSection title='Analytics' />;
      case 'admins':
        return <PlaceholderSection title='Admin Roles & Access' />;
      case 'config':
        return <PlaceholderSection title='Platform Configuration' />;
      case 'logs':
        return <PlaceholderSection title='Audit Logs' />;
      case 'support':
        return <PlaceholderSection title='Support Center' />;
      case 'queries':
        return <PlaceholderSection title='User Queries' />;
      case 'health':
        return <PlaceholderSection title='System Health' />;
      case 'security':
        return <PlaceholderSection title='Security & Compliance' />;
      case 'settings':
        return <PlaceholderSection title='Settings' />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className='min-h-screen flex bg-gray-50 text-gray-900'>
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isMobileOpen={isMobileOpen}
        onMobileToggle={handleMobileToggle}
      />

      <div className='flex-1 flex flex-col min-w-0'>
        <Header
          title={currentView.title}
          subtitle={currentView.subtitle}
          onMobileMenuToggle={handleMobileToggle}
        />

        <main className='flex-1 p-4 lg:p-6 overflow-y-auto'>
          <div className='animate-fadeIn'>{renderActiveSection()}</div>
        </main>
      </div>
    </div>
  );
}

// Placeholder component for sections not yet implemented
function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className='flex items-center justify-center min-h-96 bg-white/50 rounded-2xl border border-gray-200'>
      <div className='text-center text-gray-600'>
        <div className='text-xl font-semibold mb-2 text-gray-900'>{title}</div>
        <div className='text-sm'>This section will be implemented soon.</div>
      </div>
    </div>
  );
}
