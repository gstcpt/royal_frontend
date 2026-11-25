'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, ShieldCheck } from 'lucide-react';
import { useI18nStore } from '@/stores/i18n.store';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, setLocale, t } = useI18nStore();
  const { config } = useCmsConfig();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--royal-silver-light)]">
      {/* Top Header */}
      <header className="w-full border-b border-[var(--royal-border)] bg-white/90 backdrop-blur-md py-3.5 px-4 sm:px-10 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-[var(--royal-primary)]/60 bg-[var(--royal-gold-light)] shadow-xs shrink-0">
            <img src={config.logoUrl || '/images/royal-logo.jpg'} alt={config.appName || 'Royal'} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-heading font-black text-xl sm:text-2xl tracking-tighter text-[var(--royal-ink)] uppercase">
              {config.appName || 'ROYAL'}
            </span>
            <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-widest text-[var(--royal-gold-dark)] border-l border-[var(--royal-border)] pl-2.5">
              {t('header.brand_tagline')}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setLocale(locale === 'fr' ? 'ar' : 'fr')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--royal-silver-light)] hover:bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[var(--royal-ink)] text-[10px] font-bold uppercase cursor-pointer transition"
          >
            <Globe className="w-3 h-3 text-[var(--royal-primary)]" />
            <span>{locale === 'fr' ? 'العربية' : 'FR'}</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-[var(--royal-ink)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">{t('auth.back_to_shop')}</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full py-4 px-4 sm:px-6 border-t border-[var(--royal-border)] bg-[var(--royal-card)] text-center text-[11px] sm:text-xs text-neutral-500 flex items-center justify-center gap-2 flex-wrap">
        <ShieldCheck className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
        <span>{t('auth.ssl_footer')} &copy; {new Date().getFullYear()} {config.appName || 'Royal'}. {t('auth.all_rights')}</span>
      </footer>
    </div>
  );
}
