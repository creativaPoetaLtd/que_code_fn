'use client';

import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';
import { ReactNode } from 'react';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-all',
  {
    variants: {
      variant: {
        default: 'border-gray-300 text-gray-700 bg-gray-50',
        success: 'border-green-300 bg-green-100 text-green-700',
        warning: 'border-orange-300 bg-orange-100 text-orange-700',
        danger: 'border-red-300 bg-red-100 text-red-700',
        muted: 'border-gray-300 bg-gray-100 text-gray-600',
        info: 'border-blue-300 bg-blue-100 text-blue-700',
        live: 'border-green-400 bg-green-200 text-green-800 animate-pulse',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        default: 'px-2 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export default function Badge({
  children,
  variant,
  size,
  className,
  icon,
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {icon && <span className='shrink-0'>{icon}</span>}
      {children}
    </span>
  );
}

export { badgeVariants };
