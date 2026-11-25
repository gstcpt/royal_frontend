'use client';

import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

const ICONS = [Truck, RotateCcw, ShieldCheck, Headphones];

export function ValuePropositionBar() {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const defaultPropositions = [
    { title: t('storefront.fast_delivery'), subtitle: t('cart.guarantee_delivery') },
    { title: t('storefront.satisfaction_guarantee'), subtitle: t('cart.guarantee_warranty') },
    { title: t('storefront.secure_payment'), subtitle: t('cart.guarantee_cod') },
    { title: t('storefront.customer_service'), subtitle: t('header.contact_support') },
  ];
  const custom = locale === 'fr' ? config.views.home.valuePropsItems : null;
  const propositions = (Array.isArray(custom) && custom.length === 4 ? custom : defaultPropositions).map(
    (item, index) => ({
      ...item,
      icon: ICONS[index % ICONS.length],
    })
  );

  return (
    <section className="py-12 bg-[var(--royal-silver-light)] border-y border-[var(--royal-border)]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {propositions.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="bg-[var(--royal-card)] rounded-2xl p-6 border border-[var(--royal-border)] shadow-sm flex items-center gap-4 transition hover:-translate-y-0.5 hover:border-[var(--royal-primary)]/50 duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[var(--royal-gold-dark)] flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-5 h-5 text-[var(--royal-primary)]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--royal-ink)] tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
