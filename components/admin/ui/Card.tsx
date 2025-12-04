'use client';

import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';
import { ReactNode } from 'react';

const cardVariants = cva('rounded-2xl border shadow-lg transition-all', {
  variants: {
    variant: {
      default: 'bg-white border-gray-200',
      glass: 'bg-white/90 backdrop-blur-sm border-gray-200/50',
      solid: 'bg-gray-50 border-gray-300',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      default: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
  },
});

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  variant,
  padding,
  className,
}: CardProps) {
  return (
    <div className={cn(cardVariants({ variant, padding }), className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-2', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-xs uppercase tracking-wider text-gray-600 font-medium',
        className
      )}
    >
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('', className)}>{children}</div>;
}
