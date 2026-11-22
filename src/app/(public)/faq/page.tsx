'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, MessageCircle, ArrowRight, Search } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export default function FaqPage() {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const faqCfg = config.views.faq;
  const order = Array.isArray(faqCfg.sectionOrder) && faqCfg.sectionOrder.length > 0 ? faqCfg.sectionOrder : ['hero', 'categories', 'questions', 'cta'];

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/storefront-cms/faq')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = json?.data || json || [];
        if (Array.isArray(list)) {
          setFaqs(list);
          if (list[0]) setOpenId(list[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', ...Array.from(new Set(faqs.map((f) => f.category)))];
  const filtered = faqs.filter((f) => {
    if (activeCategory !== 'ALL' && f.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <div key="hero" className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] mb-4">
          <HelpCircle className="w-4 h-4 text-[var(--royal-primary)]" />
          <span>{locale === 'ar' ? t('faq.badge') : (faqCfg.badgeText || `${t('faq.badge')} ${config.appName || 'Royal'}`)}</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-5xl font-black text-[var(--royal-ink)] tracking-tight">
          {locale === 'ar' ? t('faq.title') : (faqCfg.title || t('faq.title'))}
        </h1>
        <p className="mt-3 text-sm text-neutral-500 max-w-xl mx-auto">
          {locale === 'ar' ? t('faq.subtitle') : (faqCfg.subtitle || t('faq.subtitle'))}
        </p>
        {faqCfg.showSearch !== false && (
          <div className="max-w-md mx-auto mt-6 relative">
            <Search className="w-4 h-4 text-[var(--royal-primary)] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('faq.search_placeholder')}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[var(--royal-border)] text-xs sm:text-sm text-[var(--royal-ink)] focus:outline-none focus:border-[var(--royal-primary)] shadow-2xs"
            />
          </div>
        )}
      </div>
    ),
    categories:
      faqCfg.showCategoryFilter !== false && categories.length > 2 ? (
        <div key="categories" className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-sm'
                  : 'bg-[var(--royal-silver-light)] text-[var(--royal-ink)] hover:bg-[var(--royal-gold-light)]'
              }`}
            >
              {cat === 'ALL' ? t('faq.all_categories') : cat}
            </button>
          ))}
        </div>
      ) : null,
    questions: loading ? (
      <div key="questions" className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />
        ))}
      </div>
    ) : (
      <div key="questions" className="space-y-3">
        {filtered.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--royal-border)] bg-[var(--royal-silver-light)] overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] block mb-1">
                    {item.category}
                  </span>
                  <span className="font-heading font-bold text-sm sm:text-base text-[var(--royal-ink)]">
                    {item.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--royal-primary)] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-[var(--royal-border)] bg-white">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    ),
    cta: faqCfg.showCta !== false ? (
      <div key="cta" className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[var(--royal-bg)] via-white to-[var(--royal-silver-light)] text-[var(--royal-ink)] border border-[var(--royal-border)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-heading text-xl font-bold text-[var(--royal-ink)]">
            {locale === 'ar' ? t('faq.cta_title') : (faqCfg.ctaTitle || t('faq.cta_title'))}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            {locale === 'ar' ? t('faq.subtitle') : (faqCfg.ctaSubtitle || `Notre équipe ${config.appName || 'Royal'} vous répond tous les jours par téléphone, WhatsApp ou formulaire.`)}
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider shrink-0 transition shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{locale === 'ar' ? t('faq.cta_btn') : (faqCfg.ctaButtonText || t('faq.cta_btn'))}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
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
