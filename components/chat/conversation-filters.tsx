'use client';

import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'users' | 'groups';

interface ConversationFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  totalCount: number;
  userCount: number;
  groupCount: number;
}

export default function ConversationFilters({
  activeFilter,
  onFilterChange,
  totalCount,
  userCount,
  groupCount,
}: ConversationFiltersProps) {
  const filters: Array<{ value: FilterType; label: string; count: number }> = [
    { value: 'all', label: 'All', count: totalCount },
    { value: 'users', label: 'Users', count: userCount },
    { value: 'groups', label: 'Groups', count: groupCount },
  ];

  return (
    <div className='flex gap-1.5 overflow-x-auto py-0'>
      {filters.map(filter => {
        const isActive = activeFilter === filter.value;
        return (
          <button
            key={filter.value}
            type='button'
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              'h-7 shrink-0 rounded-full px-2.5 text-[11px] font-semibold transition-colors',
              isActive
                ? 'bg-brand-green/15 text-brand-green dark:bg-brand-gold/15 dark:text-brand-gold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-darkBg-interactive dark:text-gray-300 dark:hover:bg-darkBg-main'
            )}
          >
            {filter.label}{' '}
            {filter.count > 0 && (
              <span className='opacity-80'>({filter.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
