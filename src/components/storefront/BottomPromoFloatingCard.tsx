'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useI18nStore } from '@/stores/i18n.store';

export function BottomPromoFloatingCard() {
  const { t } = useI18nStore();

  return (
    <section className="py-14 sm:py-20 bg-[var(--royal-bg)]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="relative min-h-[380px] sm:h-[480px] rounded-[36px] overflow-hidden border border-[var(--royal-border)] shadow-xl flex items-center justify-center p-4 sm:p-6">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1800&q=85"
            alt="Royal Électro de Maison — Ambiance Culinaire"
            className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.68]"
          />

          <div className="relative z-10 max-w-lg w-full bg-[var(--royal-card)]/95 backdrop-blur-xl rounded-[28px] sm:rounded-[32px] p-6 sm:p-12 text-center shadow-2xl border border-[var(--royal-border)]">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--royal-silver-light)] text-[var(--royal-ink)] text-[11px] uppercase tracking-widest font-extrabold mb-4">
              {t('storefront.floating_badge')}
            </span>

            <h3 className="font-heading text-xl sm:text-3xl md:text-4xl font-extrabold text-[var(--royal-ink)] tracking-tight leading-tight">
              {t('storefront.floating_title')}
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-neutral-500 font-normal leading-relaxed">
              {t('storefront.floating_subtitle')}
            </p>

            <div className="mt-7 flex justify-center">
              <Link
                href="/articles?sortBy=promo"
                className="inline-flex items-center gap-3 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] hover:bg-[var(--royal-primary-hover)] transition-all text-xs uppercase tracking-widest font-bold shadow-lg"
              >
                <span>{t('storefront.floating_cta')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
