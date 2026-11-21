'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
  showHomeIcon = true,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn('flex items-center gap-1.5 text-xs text-neutral-400 no-print', className)}
    >
      {showHomeIcon && (
        <Link
          href="/dashboard"
          className="flex items-center text-neutral-400 hover:text-neutral-900 transition-colors"
          title="Accueil Dashboard"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="sr-only">Accueil</span>
        </Link>
      )}

      {showHomeIcon && items.length > 0 && (
        <ChevronRight className="w-3 h-3 text-neutral-300 shrink-0" />
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-neutral-900 transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'truncate max-w-[240px]',
                  isLast ? 'font-semibold text-neutral-800' : 'text-neutral-400'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}

            {!isLast && (
              <ChevronRight className="w-3 h-3 text-neutral-300 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
