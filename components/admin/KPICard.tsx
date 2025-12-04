'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Badge from './ui/Badge';

interface KPICardProps {
  title: string;
  value: string | number;
  label: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
    timeframe: string;
  };
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'live';
  };
  sparkline?: ReactNode;
  className?: string;
}

export default function KPICard({ 
  title, 
  value, 
  label, 
  trend, 
  badge, 
  sparkline, 
  className 
}: KPICardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {badge && (
          <Badge variant={badge.variant || 'default'} size="sm">
            {badge.text}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex items-end justify-between gap-2 mt-2">
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {label}
            </div>
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{trend.value} vs {trend.timeframe}</span>
              </div>
            )}
          </div>
          
          {sparkline && (
            <div className="shrink-0">
              {sparkline}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Sparkline component
interface SparklineProps {
  type?: 'users' | 'orgs' | 'volume' | 'risk';
  className?: string;
}

export function Sparkline({ type = 'users', className }: SparklineProps) {
  const sparklineStyles = {
    users: 'from-green-500/40 to-amber-500/10 bg-gradient-to-br',
    orgs: 'from-blue-500/40 to-purple-500/10 bg-gradient-to-br',
    volume: 'from-emerald-500/40 to-cyan-500/10 bg-gradient-to-br',
    risk: 'from-orange-500/40 to-red-500/10 bg-gradient-to-br',
  };

  return (
    <div className={cn(
      'w-20 h-7 rounded-lg overflow-hidden relative',
      sparklineStyles[type],
      className
    )}>
      <div className="absolute inset-1 rounded-md bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80">
        <svg 
          className="w-full h-full" 
          viewBox="0 0 80 28" 
          fill="none"
        >
          <path
            d="M2 20 L12 15 L22 18 L32 8 L42 12 L52 6 L62 10 L72 4 L78 8"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-white/80"
          />
          <path
            d="M2 20 L12 15 L22 18 L32 8 L42 12 L52 6 L62 10 L72 4 L78 8 L78 26 L2 26 Z"
            fill="currentColor"
            className="text-white/30"
          />
        </svg>
      </div>
    </div>
  );
}

// Mini KPI for smaller cards
interface MiniKPIProps {
  label: string;
  value: string | number;
  meta?: string;
  className?: string;
}

export function MiniKPI({ label, value, meta, className }: MiniKPIProps) {
  return (
    <div className={cn(
      'p-2.5 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white',
      className
    )}>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {meta && <div className="text-xs text-gray-500">{meta}</div>}
    </div>
  );
}