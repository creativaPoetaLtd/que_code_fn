'use client';

import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';
import { ReactNode, ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full border font-medium transition-all duration-200 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900',
        primary: 'border-green-600/70 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 hover:-translate-y-0.5',
        ghost: 'border-transparent bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        danger: 'border-red-500/70 bg-red-600 text-white hover:bg-red-700',
        success: 'border-green-500/70 bg-green-600 text-white hover:bg-green-700',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        default: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
}

export default function Button({ 
  children, 
  variant, 
  size, 
  className, 
  loading = false,
  icon,
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
            <animate attributeName="stroke-dasharray" dur="2s" values="0 32;32 32;32 32" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-32;-64" repeatCount="indefinite"/>
          </circle>
        </svg>
      )}
      {!loading && icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

// Icon button variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'danger' | 'ghost' | 'primary';
  size?: 'sm' | 'default';
}

export function IconButton({ 
  children, 
  className, 
  variant = 'default',
  size = 'default',
  ...props 
}: IconButtonProps) {
  const variants = {
    default: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900',
    danger: 'border-red-300 bg-red-100 text-red-700 hover:bg-red-200',
    ghost: 'border-transparent bg-transparent text-gray-600 hover:bg-gray-100',
    primary: 'border-green-600 bg-green-600 text-white hover:bg-green-700',
  };

  const sizes = {
    sm: 'w-6 h-6 text-xs',
    default: 'w-8 h-8 text-sm',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full border transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}