'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';
import { StorefrontPageHeader } from '@/components/storefront/StorefrontPageHeader';

export default function PrivacyPage() {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const privCfg = config.views.privacy || {};
  const order = Array.isArray(privCfg.sectionOrder) && privCfg.sectionOrder.length > 0 ? privCfg.sectionOrder : ['header', 'document', 'footerNote'];

  const [page, setPage] = useState<{ title: string; subtitle?: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/storefront-cms/pages/privacy')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        setPage(json?.data || json || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const blocks: Record<string, React.ReactNode> = {
    header: (
      <StorefrontPageHeader
        key="header"
        title={locale === 'ar' ? t('legal.privacy_title') : (page?.title || t('legal.privacy_title'))}
        breadcrumbLabel={t('footer.privacy')}
        subtitle={page?.subtitle}
        showBackLink={privCfg.showBackLink !== false}
        badge={
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
            <span>{locale === 'ar' ? t('legal.privacy_badge') : (privCfg.badgeText || t('legal.privacy_badge'))}</span>
          </div>
        }
      />
    ),
    document: loading ? (
      <div key="document" className="h-64 bg-neutral-100 rounded-3xl animate-pulse" />
    ) : (
      <article key="document" className="bg-[var(--royal-card)] rounded-3xl border border-[var(--royal-border)] p-8 sm:p-12 space-y-6 shadow-xs">
        <div className="space-y-4 text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
          {(page?.content || '').split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return (
                <h2 key={i} className="font-heading text-lg font-extrabold text-[var(--royal-ink)] pt-4">
                  {line.replace('## ', '')}
                </h2>
              );
            }
            return <p key={i}>{line.replace(/\*\*/g, '')}</p>;
          })}
        </div>
      </article>
    ),
    footerNote:
      privCfg.showFooterNote !== false && privCfg.footerNoteText ? (
        <div key="footerNote" className="mt-6 p-4 rounded-2xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs text-[var(--royal-gold-dark)] font-medium">
          {privCfg.footerNoteText}
        </div>
      ) : null,
  };

  return (
    <div className="bg-[var(--royal-bg)] min-h-screen py-10 sm:py-12">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {order.map((sec) => blocks[sec] || null)}
      </div>
    </div>
  );
}
