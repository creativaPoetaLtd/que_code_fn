'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, Flame, QrCode } from 'lucide-react';

interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
  meta: {
    rule?: string;
    priority?: string;
    ip?: string;
    flag?: string;
    time: string;
  };
}

interface AlertsListProps {
  alerts: Alert[];
  className?: string;
}

export default function AlertsList({ alerts, className }: AlertsListProps) {
  const getAlertIcon = (type: Alert['type']): ReactNode => {
    const iconClass = "w-3 h-3";
    
    switch (type) {
      case 'danger':
        return <Flame className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'info':
        return <Info className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getAlertIconBg = (type: Alert['type']): string => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 text-red-700';
      case 'warning':
        return 'bg-orange-100 text-orange-700';
      case 'info':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={cn('space-y-2 mt-2', className)}>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-xl p-3 border border-gray-200 bg-white text-sm flex gap-3"
        >
          {/* Alert icon */}
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
            getAlertIconBg(alert.type)
          )}>
            {getAlertIcon(alert.type)}
          </div>

          {/* Alert content */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 mb-1">
              {alert.title}
            </div>
            <div className="text-gray-700 text-sm mb-2">
              {alert.description}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {alert.meta.rule && (
                <span>Rule: {alert.meta.rule}</span>
              )}
              {alert.meta.priority && (
                <span>Priority: {alert.meta.priority}</span>
              )}
              {alert.meta.ip && (
                <span>IP: {alert.meta.ip}</span>
              )}
              {alert.meta.flag && (
                <span>Fraud flag: {alert.meta.flag}</span>
              )}
              <span>{alert.meta.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Mock alerts data for demonstration
export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'danger',
    title: 'Suspicious refund pattern',
    description: '3 organizations triggered RF-CL-03 in the last 45 minutes.',
    meta: {
      rule: 'RF-CL-03',
      time: '15 min ago'
    }
  },
  {
    id: '2',
    type: 'warning',
    title: 'High amount dispute',
    description: 'Dispute DP-3042 (€9,800, cross-border) awaiting manual decision.',
    meta: {
      priority: 'High',
      time: '31 min ago'
    }
  },
  {
    id: '3',
    type: 'info',
    title: 'New admin session',
    description: 'Device fingerprint unknown – Role: Finance Admin, 2FA passed.',
    meta: {
      ip: '83.112.45.10',
      time: '5 min ago'
    }
  },
  {
    id: '4',
    type: 'warning',
    title: 'Too many QR scans',
    description: 'Transport action TR-778 has 4x above normal scan rate.',
    meta: {
      flag: 'SCAN-OVR',
      time: '2 min ago'
    }
  }
];