'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Users, 
  Building, 
  ArrowRightLeft, 
  Wallet, 
  Scale, 
  Target, 
  Store, 
  TrendingUp, 
  Shield, 
  Settings, 
  FileText, 
  Headphones,
  Mail,
  Heart,
  ShieldCheck,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Badge from './ui/Badge';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const navigationSections = [
  {
    label: 'Monitoring',
    items: [
      { 
        id: 'overview', 
        label: 'Overview', 
        icon: BarChart3, 
        badge: { text: 'Live', variant: 'live' as const }
      },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'organizations', label: 'Organizations', icon: Building },
      { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
      { id: 'financial', label: 'Wallet & Flows', icon: Wallet },
      { 
        id: 'disputes', 
        label: 'Disputes', 
        icon: Scale, 
        badge: { text: '5', variant: 'danger' as const }
      },
      { id: 'actions', label: 'Actions & Groups', icon: Target },
      { id: 'merchants', label: 'Merchants', icon: Store },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { 
        id: 'admins', 
        label: 'Admins', 
        icon: Shield, 
        badge: { text: '3', variant: 'default' as const }
      },
      { id: 'config', label: 'Platform Config', icon: Settings },
      { id: 'logs', label: 'Audit Logs', icon: FileText },
      { 
        id: 'support', 
        label: 'Support Center', 
        icon: Headphones, 
        badge: { text: '5 open', variant: 'default' as const }
      },
    ]
  },
  {
    label: 'Operations',
    items: [
      { 
        id: 'queries', 
        label: 'User Queries', 
        icon: Mail, 
        badge: { text: '12', variant: 'warning' as const }
      },
      { id: 'health', label: 'System Health', icon: Heart },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'security', label: 'Security & Compliance', icon: ShieldCheck },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  }
];

export default function Sidebar({ activeView, onViewChange, isMobileOpen, onMobileToggle }: SidebarProps) {

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:sticky top-0 left-0 h-screen w-60 bg-white border-r border-gray-200',
        'flex flex-col gap-4 p-4 z-50 transform transition-transform duration-300 ease-in-out',
        'shadow-2xl lg:shadow-lg',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          {/* Mobile close button */}
          <button
            onClick={onMobileToggle}
            className="lg:hidden p-1 text-admin-text-soft hover:text-admin-text"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-200 to-qc-gold-2 flex items-center justify-center font-bold text-amber-950 text-lg">
            QC
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Super Admin
            </div>
            <div className="text-xs text-gray-500">
              Platform Control Center
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {navigationSections.map((section) => (
            <div key={section.label} className="mb-6">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-2 px-1">
                {section.label}
              </div>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onViewChange(item.id);
                        onMobileToggle(); // Close mobile sidebar when item is clicked
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-2 rounded-xl text-sm transition-all',
                        'border border-transparent',
                        isActive
                          ? 'bg-green-100 border-green-200 text-green-700'
                          : 'text-gray-600 hover:bg-green-50 hover:border-green-100 hover:text-green-600'
                      )}
                    >
                      <Icon className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant={item.badge.variant} 
                          size="sm"
                          className="text-[10px] px-1.5 py-0.5"
                        >
                          {item.badge.text}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
              {section.label !== 'System' && (
                <div className="h-px bg-admin-border my-3" />
              )}
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="border-t border-gray-200 pt-4 space-y-1">
          <button className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-sm transition-all text-gray-600 hover:bg-gray-100 hover:text-gray-700">
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
          <div className="text-xs text-gray-400 mt-3 px-2 leading-relaxed">
            © 2025 QiewCode - <span className="text-green-600 cursor-pointer">Legal & Privacy</span>
          </div>
        </div>
      </aside>
    </>
  );
}