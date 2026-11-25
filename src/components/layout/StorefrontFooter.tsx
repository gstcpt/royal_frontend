'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, Phone, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

export function StorefrontFooter() {
  const { config } = useCmsConfig();
  const { t, locale } = useI18nStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [topCategories, setTopCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  useEffect(() => {
    fetch('/api/v1/categories?tree=false')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = json?.data || json || [];
        if (Array.isArray(list)) {
          const activeWithArticles = list.filter(
            (c: any) => c.isActive !== false && Number(c.productsCount ?? c._count?.products ?? 0) > 0
          );
          const roots = activeWithArticles.filter((c: any) => !c.parentId);
          setTopCategories((roots.length > 0 ? roots : activeWithArticles).slice(0, 6));
        }
      })
      .catch(() => null);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await fetch('/api/v1/storefront-cms/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'footer' }),
      });
    } catch {
      // ignore offline error
    }
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer
      style={{
        background: 'linear-gradient(to bottom, var(--royal-bg), var(--royal-silver-light))',
        color: 'var(--royal-ink)',
        borderColor: 'var(--royal-border)',
      }}
      className="pt-20 pb-12 border-t"
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Giant Brand Wordmark + Official Logo + Newsletter */}
        {(config.footer.showBrandHeader !== false || config.footer.showNewsletter !== false) && (
          <div className="pb-14 border-b border-[var(--royal-border)]">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              {config.footer.showBrandHeader !== false && (
                <div className="flex items-start sm:items-center gap-5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[var(--royal-primary)]/50 bg-[var(--royal-gold-light)] shadow-md shrink-0">
                    <img
                      src={config.logoUrl || '/images/royal-logo.jpg'}
                      alt={config.appName || 'Royal Electro de Maison'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="font-heading text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-[var(--royal-ink)] leading-none uppercase">
                      {config.appName || 'ROYAL'}
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm mt-2.5 max-w-xl font-light">
                      {config.identity.slogan}
                    </p>
                  </div>
                </div>
              )}

              {/* Newsletter Subscription Box */}
              {config.footer.showNewsletter !== false && (
                <div className="w-full lg:max-w-md">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--royal-gold-dark)] block mb-3">
                    {locale === 'ar' ? t('storefront.newsletter_title') : (config.footer.newsletterTitle || t('storefront.newsletter_title'))}
                  </span>
                  {subscribed ? (
                    <div className="p-4 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[var(--royal-gold-dark)] text-xs font-medium">
                      {t('footer.newsletter_ok')}
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="relative flex items-center">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('footer.newsletter_placeholder')}
                        required
                        className="w-full bg-[var(--royal-card)] text-[var(--royal-ink)] placeholder-slate-400 text-xs sm:text-sm ps-6 pe-14 py-4 rounded-full border border-[var(--royal-border)] focus:outline-none focus:border-[var(--royal-primary)] transition-colors shadow-xs"
                      />
                      <button
                        type="submit"
                        aria-label={t('footer.subscribe_aria')}
                        style={{
                          background: 'linear-gradient(to right, var(--royal-primary), var(--royal-primary-hover))',
                          color: 'var(--royal-primary-text)',
                        }}
                        className="absolute end-2 top-2 bottom-2 w-10 rounded-full flex items-center justify-center hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4 Clean Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 py-12 sm:py-14 border-b border-[var(--royal-border)] text-xs sm:text-sm">
          {/* Col 1: À Propos */}
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] mb-5 sm:mb-6">
              {locale === 'ar' ? t('footer.col1_title') : (config.footer.col1Title || t('footer.col1_title'))}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {config.footer.aboutDescription}
            </p>
            <ul className="space-y-3 text-slate-700">
              {(config.footer.col1Links && config.footer.col1Links.length > 0 && locale === 'fr'
                ? config.footer.col1Links
                : [
                    { label: t('footer.about_home'), href: '/' },
                    { label: t('footer.about_articles'), href: '/articles' },
                    { label: t('footer.about_promos'), href: '/articles?sortBy=promo' },
                  ]
              ).map((lnk, idx) => (
                <li key={idx}>
                  <Link href={lnk.href || '/'} className="hover:text-[var(--royal-gold-dark)] transition">
                    {lnk.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2: Rayons & Articles */}
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] mb-5 sm:mb-6">
              {locale === 'ar' ? t('footer.col2_title') : (config.footer.col2Title || t('footer.col2_title'))}
            </h4>
            <ul className="space-y-3 text-slate-700">
              {config.footer.col2Links && config.footer.col2Links.length > 0 && locale === 'fr' ? (
                config.footer.col2Links.map((lnk, idx) => (
                  <li key={idx}>
                    <Link href={lnk.href || '/articles'} className="hover:text-[#9A7414] transition">
                      {lnk.label}
                    </Link>
                  </li>
                ))
              ) : topCategories.length > 0 ? (
                topCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link href={`/articles?category=${cat.slug}`} className="hover:text-[#9A7414] transition">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/articles" className="hover:text-[#9A7414] transition">{t('footer.cat_appliances')}</Link>
                  </li>
                  <li>
                    <Link href="/articles" className="hover:text-[#9A7414] transition">{t('footer.cat_hair')}</Link>
                  </li>
                  <li>
                    <Link href="/articles" className="hover:text-[#9A7414] transition">{t('footer.cat_tableware')}</Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Col 3: Informations & Assistance */}
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] mb-5 sm:mb-6">
              {locale === 'ar' ? t('footer.col3_title') : (config.footer.col3Title || t('footer.col3_title'))}
            </h4>
            <ul className="space-y-3 text-slate-700">
              {(config.footer.col3Links && config.footer.col3Links.length > 0 && locale === 'fr'
                ? config.footer.col3Links
                : [
                    { label: t('footer.info_contact'), href: '/contact' },
                    { label: t('footer.info_faq'), href: '/faq' },
                    { label: t('footer.info_terms'), href: '/terms' },
                    { label: t('footer.info_privacy'), href: '/privacy' },
                    { label: t('footer.info_track'), href: '/track-order' },
                  ]
              ).map((lnk, idx) => (
                <li key={idx}>
                  <Link href={lnk.href || '/'} className="hover:text-[#9A7414] transition">
                    {lnk.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact Direct & Réseaux Sociaux */}
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] mb-5 sm:mb-6">
              {locale === 'ar' ? t('footer.col4_title') : (config.footer.col4Title || t('footer.col4_title'))}
            </h4>
            <ul className="space-y-3.5 text-slate-700">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--royal-primary)] mt-0.5 flex-shrink-0" />
                <span className="break-words">{config.identity.address || 'Mahdia 5100, Tunisie'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[var(--royal-primary)] flex-shrink-0" />
                <a href={`tel:${config.identity.phone || '+21648091914'}`} className="hover:text-[var(--royal-gold-dark)] transition break-all">
                  {config.identity.phone || '48 091 914'}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[var(--royal-primary)] flex-shrink-0" />
                <a
                  href={`https://wa.me/${(config.identity.whatsapp || '21648091914').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--royal-gold-dark)] transition break-all"
                >
                  {t('footer.whatsapp')} : {config.identity.whatsapp || '48 091 914'}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[var(--royal-primary)] flex-shrink-0" />
                <a href={`mailto:${config.identity.email || 'royaltn24@gmail.com'}`} className="hover:text-[var(--royal-gold-dark)] transition break-all">
                  {config.identity.email || 'royaltn24@gmail.com'}
                </a>
              </li>
            </ul>

            {config.footer.showSocialLinks !== false && (
              <div className="flex items-center gap-3 mt-6">
                {config.identity.instagram && (
                  <a
                    href={config.identity.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                    className="w-9 h-9 rounded-full bg-[var(--royal-card)] border border-[var(--royal-border)] flex items-center justify-center text-[var(--royal-primary)] hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] transition-colors shadow-xs"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {config.identity.facebook && (
                  <a
                    href={config.identity.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook"
                    className="w-9 h-9 rounded-full bg-[var(--royal-card)] border border-[var(--royal-border)] flex items-center justify-center text-[var(--royal-primary)] hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] transition-colors shadow-xs"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {config.identity.tiktok && (
                  <a
                    href={config.identity.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="TikTok"
                    aria-label="TikTok"
                    className="w-9 h-9 rounded-full bg-[var(--royal-card)] border border-[var(--royal-border)] flex items-center justify-center text-[var(--royal-primary)] hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] transition-colors shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 text-center sm:text-start">
          <p>© {new Date().getFullYear()} {config.footer.copyrightText}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {config.views.showrooms?.enabled !== false && (
              <Link href="/stores" className="hover:text-[var(--royal-gold-dark)] transition">{t('stores.title')}</Link>
            )}
            <Link href="/contact" className="hover:text-[var(--royal-gold-dark)] transition">{t('footer.contact')}</Link>
            <Link href="/faq" className="hover:text-[var(--royal-gold-dark)] transition">{t('footer.faq')}</Link>
            <Link href="/privacy" className="hover:text-[var(--royal-gold-dark)] transition">{t('footer.privacy')}</Link>
            <Link href="/terms" className="hover:text-[var(--royal-gold-dark)] transition">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
