'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
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
  showBackLink?: boolean;
}

/**
 * En-tête unifié de toutes les vues publiques Royal :
 * - Fil d'Ariane identique à la fiche article (`/articles/[slug]`)
 * - Titre aligné à gauche (graisse `font-black`, police dynamique `--font-heading`)
 * - Option CMS `showBackLink` pour les pages légales
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
  showBackLink = false,
}: StorefrontPageHeaderProps) {
  const { t } = useI18nStore();

  return (
    <header className={`mb-8 sm:mb-10 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 sm:mb-8">
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-2 text-xs text-neutral-400 overflow-x-auto whitespace-nowrap"
        >
          <Link href="/" className="hover:text-[var(--royal-ink)] transition">
            {t('nav.home')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
          <span className="font-semibold text-[var(--royal-ink)] truncate max-w-xs">
            {breadcrumbLabel || title}
          </span>
        </nav>

        {showBackLink && (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--royal-gold-dark)] hover:text-[var(--royal-primary)] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('auth.back_to_shop')}</span>
          </Link>
        )}
      </div>

      <div
        className={`relative border-b border-[var(--royal-border)] pb-6 ${
          backgroundImageUrl
            ? 'rounded-3xl overflow-hidden border border-[var(--royal-border)] bg-[var(--royal-card)] p-6 sm:p-8 shadow-xs'
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
            <h1 className="font-heading font-black tracking-tight text-3xl sm:text-4xl text-[var(--royal-ink)]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-2xl font-normal">
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
