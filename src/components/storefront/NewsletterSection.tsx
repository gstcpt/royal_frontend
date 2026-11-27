'use client';

import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

export function NewsletterSection() {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const home = config.views.home;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setStatus('idle');
    setMessage('');
    try {
      const res = await fetch('/api/v1/storefront-cms/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'homepage' }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage(t('storefront.newsletter_success'));
        setEmail('');
      } else {
        const err = await res.json().catch(() => null);
        setStatus('error');
        setMessage(err?.message || t('storefront.newsletter_error'));
      }
    } catch {
      setStatus('error');
      setMessage(t('storefront.newsletter_net_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-14 md:py-20 bg-[#FBF9F4] border-b border-[#E6E1D6]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="bg-white rounded-3xl border border-[#E6E1D6] p-6 sm:p-12 lg:p-14 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs font-bold text-[var(--royal-gold-dark)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>{locale === 'ar' ? t('storefront.newsletter_tag') : (home.newsletterTag || t('storefront.newsletter_tag'))}</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[var(--royal-ink)] tracking-tight">
              {locale === 'ar' ? t('storefront.newsletter_title') : (home.newsletterTitle || t('storefront.newsletter_title'))}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {locale === 'ar' ? t('storefront.newsletter_subtitle') : (home.newsletterSubtitle || t('storefront.newsletter_subtitle'))}
            </p>
          </div>

          <div className="w-full lg:max-w-md space-y-3">
            {status === 'success' ? (
              <div className="p-4 rounded-2xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[var(--royal-gold-dark)] text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[var(--royal-primary)] shrink-0" />
                <span>{message}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-[var(--royal-primary)] absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={locale === 'ar' ? t('storefront.newsletter_placeholder') : (home.newsletterPlaceholder || t('storefront.newsletter_placeholder'))}
                    className="w-full ps-11 pe-4 py-3.5 rounded-full bg-[var(--royal-silver-light)] border border-[var(--royal-border)] text-sm text-[var(--royal-ink)] focus:outline-none focus:border-[var(--royal-primary)] transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(to right, var(--royal-primary), var(--royal-primary-hover))',
                    color: 'var(--royal-primary-text)',
                  }}
                  className="px-7 py-3.5 rounded-full hover:opacity-95 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-60 shrink-0"
                >
                  <span>{loading ? t('storefront.newsletter_sending') : (locale === 'ar' ? t('storefront.newsletter_button') : (home.newsletterButtonText || t('storefront.newsletter_button')))}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="text-xs text-rose-600 font-medium ps-2">{message}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
