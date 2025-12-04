'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Search, 
  Bell, 
  Activity, 
  Clock
} from 'lucide-react';
import Badge from './ui/Badge';
import Button from './ui/Button';

interface HeaderProps {
  title: string;
  subtitle: string;
  onMobileMenuToggle: () => void;
}

const timeRanges = [
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export default function Header({ title, subtitle, onMobileMenuToggle }: HeaderProps) {
  const [timeRange, setTimeRange] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 px-4 lg:px-6 flex items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuToggle}
          className="lg:hidden w-8 h-8 p-0 border border-admin-border"
        >
          <Menu className="w-4 h-4" />
        </Button>

        {/* Page title */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-base font-semibold text-gray-900">
            {title}
          </h1>
          <p className="text-xs text-gray-500 hidden sm:block">
            {subtitle}
          </p>
        </div>

        {/* Time range filter */}
        <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1 rounded-full border border-gray-300 bg-white text-gray-600">
          <Clock className="w-3 h-3" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-xs text-gray-700 outline-none border-none cursor-pointer"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value} className="bg-white">
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="hidden lg:flex relative ml-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search user, transaction, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 pl-9 pr-4 py-2 text-xs bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 border border-gray-300 hover:border-green-500"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </Button>
          <Badge 
            variant="danger" 
            size="sm" 
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center p-0 text-[10px] font-bold"
          >
            9
          </Badge>
        </div>

        {/* System status */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 border border-gray-300 hover:border-green-500"
            title="System events"
          >
            <Activity className="w-4 h-4" />
          </Button>
          <Badge 
            variant="success" 
            size="sm" 
            className="absolute -top-1 -right-1 text-[9px] px-1.5 py-0.5 font-bold"
          >
            OK
          </Badge>
        </div>

        {/* Admin avatar */}
        <div 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-xs font-bold text-green-50 cursor-pointer border border-green-500/50 hover:scale-105 transition-transform"
          title="Current admin"
        >
          SA
        </div>
      </div>
    </header>
  );
}