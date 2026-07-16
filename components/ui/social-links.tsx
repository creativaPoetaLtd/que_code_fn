'use client';

import React from 'react';
import { Instagram } from 'lucide-react';
import type { SocialLinks } from '@/types/action.types';

interface SocialLinksRowProps {
  links?: SocialLinks | null;
  className?: string;
  /** 'icon' = compact square buttons, 'chip' = icon + handle pill */
  variant?: 'icon' | 'chip';
}

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/** instagram.com/someone → @someone */
const handleFromUrl = (url: string): string => {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    return path.length ? `@${path[path.length - 1]}` : url;
  } catch {
    return url;
  }
};

const SocialLinksRow: React.FC<SocialLinksRowProps> = ({
  links,
  className = '',
  variant = 'icon',
}) => {
  if (!links?.instagram && !links?.x) return null;

  const entries = [
    links.instagram
      ? {
          key: 'instagram',
          href: links.instagram,
          label: 'Instagram',
          icon: <Instagram className="w-3.5 h-3.5" />,
          // Instagram's gradient on hover, muted at rest
          hover: 'hover:text-white hover:border-transparent hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]',
        }
      : null,
    links.x
      ? {
          key: 'x',
          href: links.x,
          label: 'X',
          icon: <XIcon className="w-3 h-3" />,
          hover: 'hover:text-black hover:bg-white hover:border-white',
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    href: string;
    label: string;
    icon: React.ReactNode;
    hover: string;
  }[];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {entries.map((entry) => (
        <a
          key={entry.key}
          href={entry.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${entry.label} profile`}
          title={`${entry.label} · ${handleFromUrl(entry.href)}`}
          className={[
            'flex items-center justify-center gap-1.5 rounded-lg border border-[#1e2d40] bg-[#0d1117] text-[#8da0b3]',
            'transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
            entry.hover,
            variant === 'chip' ? 'px-2.5 h-7 text-[11px] font-semibold' : 'w-7 h-7',
          ].join(' ')}
        >
          {entry.icon}
          {variant === 'chip' && (
            <span className="max-w-[110px] truncate">{handleFromUrl(entry.href)}</span>
          )}
        </a>
      ))}
    </div>
  );
};

export default SocialLinksRow;
