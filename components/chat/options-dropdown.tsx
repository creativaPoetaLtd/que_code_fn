'use client';

import {
  BarChart3,
  CalendarDays,
  DollarSign,
  FileText,
  HandCoins,
  ImageIcon,
  MapPin,
  MonitorUp,
  NotebookText,
  PiggyBank,
  Ticket,
  Users,
  WalletCards,
  Workflow,
} from 'lucide-react';

interface OptionsDropdownProps {
  isOpen: boolean;
  onOptionSelect: (option: string) => void;
}

interface DropdownOption {
  icon: React.ReactNode;
  label: string;
  color: string;
  action: () => void;
}

interface DropdownSection {
  title: string;
  options: DropdownOption[];
}

export default function OptionsDropdown({
  isOpen,
  onOptionSelect,
}: OptionsDropdownProps) {
  const sections: DropdownSection[] = [
    {
      title: 'Send',
      options: [
        {
          icon: <ImageIcon size={18} />,
          label: 'Photo / video',
          color: 'text-sky-600 dark:text-sky-300',
          action: () => onOptionSelect('Media'),
        },
        {
          icon: <FileText size={18} />,
          label: 'Document',
          color: 'text-gray-600 dark:text-gray-300',
          action: () => onOptionSelect('Document'),
        },
        {
          icon: <DollarSign size={18} />,
          label: 'Send money',
          color: 'text-brand-green dark:text-brand-gold',
          action: () => onOptionSelect('Send Money'),
        },
        {
          icon: <HandCoins size={18} />,
          label: 'Request money',
          color: 'text-amber-600 dark:text-amber-300',
          action: () => onOptionSelect('Request Money'),
        },
        {
          icon: <Ticket size={18} />,
          label: 'Ticket',
          color: 'text-violet-600 dark:text-violet-300',
          action: () => onOptionSelect('Ticket'),
        },
      ],
    },
    {
      title: 'Share',
      options: [
        {
          icon: <CalendarDays size={18} />,
          label: 'Event',
          color: 'text-indigo-600 dark:text-indigo-300',
          action: () => onOptionSelect('Event'),
        },
        {
          icon: <Users size={18} />,
          label: 'Group',
          color: 'text-cyan-600 dark:text-cyan-300',
          action: () => onOptionSelect('Group'),
        },
        {
          icon: <PiggyBank size={18} />,
          label: 'Contribution',
          color: 'text-emerald-600 dark:text-emerald-300',
          action: () => onOptionSelect('Contribution'),
        },
        {
          icon: <MapPin size={18} />,
          label: 'Location',
          color: 'text-rose-600 dark:text-rose-300',
          action: () => onOptionSelect('Location'),
        },
      ],
    },
    {
      title: 'Create together',
      options: [
        {
          icon: <WalletCards size={18} />,
          label: 'Shared wallet',
          color: 'text-emerald-600 dark:text-emerald-300',
          action: () => onOptionSelect('Shared Wallet'),
        },
        {
          icon: <NotebookText size={18} />,
          label: 'Shared note',
          color: 'text-yellow-600 dark:text-yellow-300',
          action: () => onOptionSelect('Shared Note'),
        },
        {
          icon: <Workflow size={18} />,
          label: 'Whiteboard',
          color: 'text-fuchsia-600 dark:text-fuchsia-300',
          action: () => onOptionSelect('Whiteboard'),
        },
        {
          icon: <MonitorUp size={18} />,
          label: 'Screen share',
          color: 'text-blue-600 dark:text-blue-300',
          action: () => onOptionSelect('Screen Share'),
        },

        {
          icon: <BarChart3 size={18} />,
          label: 'Poll',
          color: 'text-pink-600 dark:text-pink-300',
          action: () => onOptionSelect('Poll'),
        },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className='absolute bottom-12 left-0 z-50 w-[20rem] max-w-[calc(100vw-2rem)]'>
      <div className='max-h-[70vh] overflow-y-auto rounded-xl border border-gray-100 bg-white p-2 shadow-xl dark:border-darkBorder-light dark:bg-darkBg-card'>
        {sections.map(section => (
          <div key={section.title} className='space-y-1 pb-2 last:pb-0'>
            <p className='px-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500'>
              {section.title}
            </p>
            <div className='grid grid-cols-2 gap-1'>
              {section.options.map(option => (
                <button
                  key={option.label}
                  type='button'
                  className='flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-darkBg-interactive'
                  onClick={option.action}
                >
                  <span
                    className={`${option.color} flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-darkBg-interactive`}
                  >
                    {option.icon}
                  </span>
                  <span className='truncate text-xs font-semibold text-gray-700 dark:text-gray-200'>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
