'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

export default function TermsPage() {
  const { config } = useCmsConfig();
  const termsCfg = config.views.terms || {};
  const order = Array.isArray(termsCfg.sectionOrder) && termsCfg.sectionOrder.length > 0 ? termsCfg.sectionOrder : ['header', 'document', 'footerNote'];

  const [page, setPage] = useState<{ title: string; subtitle?: string; content: string; updatedAt?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/storefront-cms/pages/terms')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        setPage(json?.data || json || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const blocks: Record<string, React.ReactNode> = {
    header: (
      <div key="header" className="mb-6">
        {termsCfg.showBackLink !== false && (
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[var(--royal-primary)] mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l’accueil</span>
          </Link>
        )}
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] mb-4">
            <FileText className="w-4 h-4 text-[var(--royal-primary)]" />
            <span>{termsCfg.badgeText || `Informations Légales ${config.appName || 'Royal'}`}</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-[var(--royal-ink)] tracking-tight">
            {page?.title || 'Conditions Générales de Vente'}
          </h1>
          {page?.subtitle && <p className="mt-2 text-sm text-neutral-500">{page.subtitle}</p>}
        </div>
      </div>
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
      termsCfg.showFooterNote !== false && termsCfg.footerNoteText ? (
        <div key="footerNote" className="mt-6 p-4 rounded-2xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs text-[var(--royal-gold-dark)] font-medium">
          {termsCfg.footerNoteText}
        </div>
      ) : null,
  };

  return (
    <div className="bg-[var(--royal-bg)] min-h-screen py-14 md:py-20">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {order.map((sec) => blocks[sec] || null)}
      </div>
    </div>
  );
}
