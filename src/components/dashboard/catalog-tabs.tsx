'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Sliders, Boxes, Tag, Package, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';

export type CatalogTabId =
  | 'categories'
  | 'characteristics'
  | 'variants'
  | 'brands'
  | 'articles';

interface CatalogTabItem {
  id: CatalogTabId;
  step: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

const CATALOG_TABS: CatalogTabItem[] = [
  {
    id: 'categories',
    step: '1',
    label: 'Catégories',
    href: '/dashboard/categories',
    icon: <Layers className="w-3.5 h-3.5" />,
    description: 'Arborescence des rayons & familles',
  },
  {
    id: 'characteristics',
    step: '2',
    label: 'Caractéristiques',
    href: '/dashboard/characteristics',
    icon: <Sliders className="w-3.5 h-3.5" />,
    description: 'Attributs techniques reliés aux rayons',
  },
  {
    id: 'variants',
    step: '3',
    label: 'Variantes',
    href: '/dashboard/variants',
    icon: <Boxes className="w-3.5 h-3.5" />,
    description: 'Familles d’options (tailles, couleurs, watts)',
  },
  {
    id: 'brands',
    step: '4',
    label: 'Marques',
    href: '/dashboard/brands',
    icon: <Tag className="w-3.5 h-3.5" />,
    description: 'Constructeurs & fabricants officiels',
  },
  {
    id: 'articles',
    step: '5',
    label: 'Articles',
    href: '/dashboard/articles',
    icon: <Package className="w-3.5 h-3.5" />,
    description: 'Catalogue maître des produits en vente',
  },
];

interface CatalogTabsProps {
  activeTab?: CatalogTabId;
  className?: string;
}

export function CatalogTabs({ activeTab, className }: CatalogTabsProps) {
  const pathname = usePathname();
  const { isRouteVisible } = useRouteVisibility();
  const visibleTabs = CATALOG_TABS.filter((tab) => isRouteVisible(tab.href));
  if (visibleTabs.length === 0) return null;

  // Determine active tab either by prop or by current pathname
  const currentTab =
    activeTab ||
    visibleTabs.find((t) => pathname.startsWith(t.href))?.id ||
    (pathname.startsWith('/dashboard/articles') ? 'articles' : 'categories');

  return (
    <div className={cn('space-y-2 no-print', className)}>
      {/* Horizontal Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl w-fit border border-neutral-200/80 shadow-inner">
        {visibleTabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 select-none group',
                isActive
                  ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-sm font-bold'
                  : 'text-neutral-600 hover:text-[#1D232E] hover:bg-[#FBF9F4]'
              )}
              title={tab.description}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold font-mono transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-200 text-neutral-600 group-hover:bg-neutral-300'
                )}
              >
                {tab.step}
              </span>
              <span className={cn('transition-colors', isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-900')}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
