import React, { useMemo, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Calendar, Check, ChevronDown, Search, SlidersHorizontal, User, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UserAvatar } from '@/components/UserAvatar';
import { useGetAcceptedContactsQuery } from '@/states/contactSlice';
import { useAuthToken } from '@/hooks/use-auth-token';
import { cn } from '@/lib/utils';
import { DatePreset, EMPTY_FILTERS, HistoryFilters, activeFilterCount } from './useTransactionHistory';

type Option<T> = { value: T; label: string };

const KIND_OPTIONS: Option<HistoryFilters['kind']>[] = [
  { value: undefined, label: 'All types' },
  { value: 'sent', label: 'Sent' },
  { value: 'received', label: 'Received' },
  { value: 'contribution', label: 'Contributions' },
  { value: 'split', label: 'Split bills' },
  { value: 'topup', label: 'Deposits' },
  { value: 'withdrawal', label: 'Withdrawals' },
];

const STATUS_OPTIONS: Option<HistoryFilters['status']>[] = [
  { value: undefined, label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DATE_OPTIONS: Option<DatePreset>[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

const chipBase =
  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green dark:focus-visible:ring-brand-gold';
const chipIdle =
  'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-darkBorder-medium dark:bg-darkBg-card dark:text-gray-300 dark:hover:bg-white/5';
const chipOn =
  'border-brand-green bg-green-50 font-medium text-[#065F10] dark:border-brand-gold dark:bg-brand-gold/10 dark:text-brand-gold';

const inputClass =
  'h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green dark:border-darkBorder-medium dark:bg-darkBg-main dark:text-white dark:focus:ring-brand-gold dark:[color-scheme:dark]';

const useContactOptions = () => {
  const { getToken } = useAuthToken();
  const token = getToken();
  const { data } = useGetAcceptedContactsQuery(token || '', { skip: !token });
  return useMemo(
    () =>
      (data?.contacts || []).map((contact) => ({
        value: contact.otherUser.id,
        label: `${contact.otherUser.firstName} ${contact.otherUser.lastName}`.trim(),
        profileImage: contact.otherUser.profile?.profileImage,
      })),
    [data],
  );
};

export const dateChipLabel = (f: HistoryFilters) => {
  if (f.datePreset !== 'custom') return DATE_OPTIONS.find((o) => o.value === f.datePreset)?.label || 'Date';
  const fmt = (ymd?: string) =>
    ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '…';
  return `${fmt(f.customStart)} – ${fmt(f.customEnd)}`;
};

const OptionList = <T,>({
  options,
  value,
  onPick,
}: {
  options: Option<T>[];
  value: T;
  onPick: (value: T) => void;
}) => (
  <div role="listbox" className="flex flex-col py-1">
    {options.map((option) => (
      <button
        key={option.label}
        type="button"
        role="option"
        aria-selected={option.value === value}
        onClick={() => onPick(option.value)}
        className="flex items-center justify-between gap-6 rounded-md px-2.5 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
      >
        {option.label}
        {option.value === value && <Check className="h-4 w-4 text-[#0A7A16] dark:text-brand-gold" />}
      </button>
    ))}
  </div>
);

const CustomRange = ({ filters, onChange }: { filters: HistoryFilters; onChange: (f: HistoryFilters) => void }) => {
  const invalid = !!filters.customStart && !!filters.customEnd && filters.customStart > filters.customEnd;
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-xs text-gray-600 dark:text-gray-400">
        From
        <input
          type="date"
          className={cn(inputClass, 'mt-1')}
          value={filters.customStart || ''}
          max={filters.customEnd || undefined}
          onChange={(e) => onChange({ ...filters, datePreset: 'custom', customStart: e.target.value || undefined })}
        />
      </label>
      <label className="text-xs text-gray-600 dark:text-gray-400">
        To
        <input
          type="date"
          className={cn(inputClass, 'mt-1')}
          value={filters.customEnd || ''}
          min={filters.customStart || undefined}
          onChange={(e) => onChange({ ...filters, datePreset: 'custom', customEnd: e.target.value || undefined })}
        />
      </label>
      {invalid && <p className="col-span-2 text-xs text-red-600 dark:text-red-400">The start date is after the end date.</p>}
    </div>
  );
};

/** A chip that opens a menu, with its own clear button while a value is set. */
const FilterChip = ({
  icon,
  label,
  active,
  onClear,
  clearLabel,
  children,
  contentClassName,
}: {
  icon?: React.ReactNode;
  label: string;
  active: boolean;
  onClear: () => void;
  clearLabel: string;
  children: (close: () => void) => React.ReactNode;
  contentClassName?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <span className={cn(chipBase, active ? chipOn : chipIdle, 'p-0 gap-0')}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={cn('inline-flex h-full items-center gap-1.5 rounded-full', active ? 'pl-3 pr-1.5' : 'px-3')}>
            {icon}
            {label}
            {!active && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className={cn('w-56 p-1.5', contentClassName)}>
          {children(() => setOpen(false))}
        </PopoverContent>
      </Popover>
      {active && (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
          className="mr-1 flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
};

const PersonPicker = ({ value, onPick }: { value?: string; onPick: (id?: string) => void }) => {
  const options = useContactOptions();
  return (
    <Command>
      <CommandInput placeholder="Search contacts..." />
      <CommandList>
        <CommandEmpty>No contacts found.</CommandEmpty>
        <CommandGroup className="max-h-60 overflow-auto">
          {options.map((option) => (
            <CommandItem key={option.value} value={option.label} onSelect={() => onPick(option.value === value ? undefined : option.value)}>
              <UserAvatar
                profileImage={option.profileImage}
                firstName={option.label.split(' ')[0]}
                lastName={option.label.split(' ')[1] || ''}
                disableClick
                className="mr-2 h-6 w-6"
              />
              <span className="flex-1 truncate">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 text-[#0A7A16] dark:text-brand-gold" />}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

const SearchBox = ({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) => (
  <label className={cn('relative flex items-center', className)}>
    <span className="sr-only">Search transactions</span>
    <Search className="pointer-events-none absolute left-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search name, reference or note"
      className="h-10 md:h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green dark:border-darkBorder-medium dark:bg-darkBg-card dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-brand-gold"
    />
  </label>
);

interface TransactionFiltersProps {
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
}

export const TransactionFilters = ({ filters, onChange }: TransactionFiltersProps) => {
  const contacts = useContactOptions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const personName = contacts.find((c) => c.value === filters.contactId)?.label;
  const set = (patch: Partial<HistoryFilters>) => onChange({ ...filters, ...patch });
  const count = activeFilterCount(filters);

  const quickChips: { label: string; on: boolean; toggle: () => void }[] = [
    { label: 'Sent', on: filters.kind === 'sent', toggle: () => set({ kind: filters.kind === 'sent' ? undefined : 'sent' }) },
    { label: 'Received', on: filters.kind === 'received', toggle: () => set({ kind: filters.kind === 'received' ? undefined : 'received' }) },
    { label: 'Pending', on: filters.status === 'pending', toggle: () => set({ status: filters.status === 'pending' ? undefined : 'pending' }) },
    { label: 'Split bills', on: filters.kind === 'split', toggle: () => set({ kind: filters.kind === 'split' ? undefined : 'split' }) },
  ];

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex flex-wrap items-center gap-2">
        <SearchBox value={filters.search} onChange={(search) => set({ search })} className="w-full max-w-[340px] flex-1 min-w-[220px]" />
        <FilterChip
          label={filters.kind ? KIND_OPTIONS.find((o) => o.value === filters.kind)!.label : 'Type'}
          active={!!filters.kind}
          onClear={() => set({ kind: undefined })}
          clearLabel="Clear type filter"
        >
          {(close) => <OptionList options={KIND_OPTIONS} value={filters.kind} onPick={(kind) => { set({ kind }); close(); }} />}
        </FilterChip>
        <FilterChip
          label={filters.status ? STATUS_OPTIONS.find((o) => o.value === filters.status)!.label : 'Status'}
          active={!!filters.status}
          onClear={() => set({ status: undefined })}
          clearLabel="Clear status filter"
        >
          {(close) => <OptionList options={STATUS_OPTIONS} value={filters.status} onPick={(status) => { set({ status }); close(); }} />}
        </FilterChip>
        <FilterChip
          icon={<Calendar className="h-3.5 w-3.5" />}
          label={filters.datePreset === 'all' ? 'Date' : dateChipLabel(filters)}
          active={filters.datePreset !== 'all'}
          onClear={() => set({ datePreset: 'all', customStart: undefined, customEnd: undefined })}
          clearLabel="Clear date filter"
          contentClassName="w-72"
        >
          {(close) => (
            <>
              <OptionList
                options={DATE_OPTIONS}
                value={filters.datePreset}
                onPick={(datePreset) => {
                  set({ datePreset });
                  if (datePreset !== 'custom') close();
                }}
              />
              {filters.datePreset === 'custom' && (
                <div className="border-t border-gray-100 px-2.5 pb-1.5 pt-2.5 dark:border-darkBorder-light">
                  <CustomRange filters={filters} onChange={onChange} />
                </div>
              )}
            </>
          )}
        </FilterChip>
        <FilterChip
          icon={<User className="h-3.5 w-3.5" />}
          label={personName || 'Person'}
          active={!!filters.contactId}
          onClear={() => set({ contactId: undefined })}
          clearLabel="Clear person filter"
          contentClassName="w-64 p-0"
        >
          {(close) => <PersonPicker value={filters.contactId} onPick={(contactId) => { set({ contactId }); close(); }} />}
        </FilterChip>
        {count > 1 && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
            className="text-[13px] font-medium text-[#0A7A16] hover:underline dark:text-brand-gold"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        <div className="flex gap-2">
          <SearchBox value={filters.search} onChange={(search) => set({ search })} className="flex-1" />
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 dark:border-darkBorder-medium dark:bg-darkBg-card dark:text-white"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {count > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0A7A16] px-1 text-[11px] font-semibold text-white dark:bg-brand-gold dark:text-[#00313A]">
                {count}
              </span>
            )}
          </button>
        </div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
          {filters.datePreset !== 'all' && (
            <button type="button" onClick={() => set({ datePreset: 'all', customStart: undefined, customEnd: undefined })} className={cn(chipBase, chipOn, 'shrink-0')} aria-label={`${dateChipLabel(filters)}, clear date filter`}>
              {dateChipLabel(filters)} <X className="h-3.5 w-3.5" />
            </button>
          )}
          {personName && (
            <button type="button" onClick={() => set({ contactId: undefined })} className={cn(chipBase, chipOn, 'shrink-0')} aria-label={`${personName}, clear person filter`}>
              {personName} <X className="h-3.5 w-3.5" />
            </button>
          )}
          {quickChips.map((chip) => (
            <button key={chip.label} type="button" aria-pressed={chip.on} onClick={chip.toggle} className={cn(chipBase, chip.on ? chipOn : chipIdle, 'shrink-0')}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <DialogPrimitive.Root open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 md:hidden" />
          <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white px-5 pb-6 pt-2 shadow-xl focus:outline-none dark:bg-darkBg-card md:hidden data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <DialogPrimitive.Title className="text-[15px] font-semibold text-gray-900 dark:text-white">Filters</DialogPrimitive.Title>
              <DialogPrimitive.Close aria-label="Close filters" className="-mr-2 flex h-11 w-11 items-center justify-center text-gray-500 dark:text-gray-400">
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">Narrow down your transactions</DialogPrimitive.Description>

            {[
              { title: 'Type', options: KIND_OPTIONS, value: filters.kind, pick: (kind: HistoryFilters['kind']) => set({ kind }) },
              { title: 'Status', options: STATUS_OPTIONS, value: filters.status, pick: (status: HistoryFilters['status']) => set({ status }) },
            ].map((group) => (
              <fieldset key={group.title} className="mt-3">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{group.title}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {(group.options as Option<string | undefined>[]).map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={option.value === group.value}
                      onClick={() => (group.pick as (v: string | undefined) => void)(option.value)}
                      className={cn(chipBase, option.value === group.value ? chipOn : chipIdle)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}

            <fieldset className="mt-4">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date</legend>
              <div className="flex flex-wrap gap-1.5">
                {DATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={option.value === filters.datePreset}
                    onClick={() => set({ datePreset: option.value })}
                    className={cn(chipBase, option.value === filters.datePreset ? chipOn : chipIdle)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {filters.datePreset === 'custom' && (
                <div className="mt-3">
                  <CustomRange filters={filters} onChange={onChange} />
                </div>
              )}
            </fieldset>

            <fieldset className="mt-4">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Person</legend>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-darkBorder-light">
                <PersonPicker value={filters.contactId} onPick={(contactId) => set({ contactId })} />
              </div>
            </fieldset>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
                className="h-11 flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-900 dark:border-darkBorder-medium dark:text-white"
              >
                Reset
              </button>
              <DialogPrimitive.Close className="h-11 flex-1 rounded-lg bg-[#0A7A16] text-sm font-semibold text-white dark:bg-brand-gold dark:text-[#00313A]">
                Done
              </DialogPrimitive.Close>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
};
