'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export default function Table({ children, className }: TableProps) {
  return (
    <div className="mt-3 max-h-72 overflow-y-auto">
      <table className={cn('w-full border-collapse text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function TableHeader({ children, className, sticky = true }: TableHeaderProps) {
  return (
    <thead 
      className={cn(
        'bg-gray-50/95',
        sticky && 'sticky top-0 z-10',
        className
      )}
    >
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn('', className)}>
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function TableRow({ children, className, hoverable = true }: TableRowProps) {
  return (
    <tr 
      className={cn(
        'border-b border-gray-200',
        hoverable && 'hover:bg-gray-50 transition-colors',
        className
      )}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <th 
      className={cn(
        'px-2 py-2 text-left text-xs text-gray-600 uppercase tracking-wider font-medium',
        className
      )}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td 
      className={cn(
        'px-2 py-2 text-sm whitespace-nowrap',
        className
      )}
    >
      {children}
    </td>
  );
}

// Table utilities for main/sub text
interface TableMainTextProps {
  children: ReactNode;
  className?: string;
}

export function TableMainText({ children, className }: TableMainTextProps) {
  return (
    <div className={cn('text-sm font-medium text-gray-900', className)}>
      {children}
    </div>
  );
}

interface TableSubTextProps {
  children: ReactNode;
  className?: string;
}

export function TableSubText({ children, className }: TableSubTextProps) {
  return (
    <div className={cn('text-xs text-gray-500', className)}>
      {children}
    </div>
  );
}

// Table actions wrapper
interface TableActionsProps {
  children: ReactNode;
  className?: string;
}

export function TableActions({ children, className }: TableActionsProps) {
  return (
    <div className={cn('flex items-center gap-1 justify-end', className)}>
      {children}
    </div>
  );
}