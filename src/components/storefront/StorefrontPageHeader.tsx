'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useI18nStore } from '@/stores/i18n.store';

export interface StorefrontPageHeaderProps {
  title: string;
  breadcrumbLabel?: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  backgroundImageUrl?: string;
}

/**
 * En-tête unifié de toutes les vues publiques Royal :
 * - Fil d'Ariane identique à la fiche article (`/articles/[slug]`)
 * - Titre aligné à gauche (style `/cart`, graisse `font-black`)
 * - Zéro lien redondant « Retour à l'accueil »
 */
export function StorefrontPageHeader({
  title,
  breadcrumbLabel,
  subtitle,
  badge,
  rightSlot,
  children,
  className = '',
  backgroundImageUrl,
}: StorefrontPageHeaderProps) {
  const { t } = useI18nStore();

  return (
    <header className={`mb-8 sm:mb-10 ${className}`}>
      <nav
        aria-label="Fil d'Ariane"
        className="flex items-center gap-2 text-xs text-neutral-400 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap"
      >
        <Link href="/" className="hover:text-neutral-900 transition">
          {t('nav.home')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
        <span className="font-semibold text-neutral-900 truncate max-w-xs">
          {breadcrumbLabel || title}
        </span>
      </nav>

      <div
        className={`relative border-b border-[#EFECE6] pb-6 ${
          backgroundImageUrl
            ? 'rounded-3xl overflow-hidden border border-[#E6E1D6] bg-white p-6 sm:p-8 shadow-xs'
            : ''
        }`}
      >
        {backgroundImageUrl && (
          <>
            <img
              src={backgroundImageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/70" />
          </>
        )}

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="min-w-0 text-left rtl:text-right">
            {badge && <div className="mb-2.5">{badge}</div>}
            <h1 className="font-sans font-black tracking-tight text-3xl sm:text-4xl text-[#0C1A14]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-xs sm:text-sm text-[#0C1A14]/65 max-w-2xl font-normal">
                {subtitle}
              </p>
            )}
          </div>

          {rightSlot && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {rightSlot}
            </div>
          )}
        </div>

        {children && <div className="relative z-10 mt-5">{children}</div>}
      </div>
    </header>
  );
}
