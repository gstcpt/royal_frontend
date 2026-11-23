'use client';

import React from 'react';
import Link from 'next/link';
import { Store, MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';
import { StorefrontPageHeader } from '@/components/storefront/StorefrontPageHeader';

export default function ShowroomsPublicPage() {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const srCfg = config.views.showrooms;
  const order = Array.isArray(srCfg.sectionOrder) && srCfg.sectionOrder.length > 0 ? srCfg.sectionOrder : ['hero', 'cards', 'map'];
  const showrooms =
    Array.isArray(config.identity.showrooms) && config.identity.showrooms.length > 0
      ? config.identity.showrooms
      : [
          {
            id: 'mahdia-hq',
            name: `Showroom Principal ${config.appName || 'Royal'}`,
            city: 'Mahdia',
            address: config.identity.address || 'Mahdia 5100, Tunisie',
            phone: config.identity.phone || '48 091 914',
            hours: 'Lun–Sam · 09h00 – 19h00',
          },
        ];

  if (srCfg.enabled === false) {
    return (
      <div className="bg-[var(--royal-bg)] min-h-[60vh] py-10 sm:py-12">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <StorefrontPageHeader
            title={locale === 'ar' ? t('stores.hidden_title') : (srCfg.title || t('stores.title'))}
            breadcrumbLabel={t('stores.title')}
          />
          <div className="max-w-md mx-auto text-center space-y-4 bg-white p-8 rounded-3xl border border-[var(--royal-border)] shadow-sm">
            <Store className="w-10 h-10 text-[var(--royal-primary)] mx-auto" />
            <h2 className="font-heading text-xl font-black text-[var(--royal-ink)]">{t('stores.hidden_title')}</h2>
            <p className="text-xs text-slate-500">{t('stores.hidden_desc')}</p>
            <Link href="/articles" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold">
              <span>{t('storefront.explore_collection')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <StorefrontPageHeader
        key="hero"
        title={locale === 'ar' ? t('stores.title') : (srCfg.title || t('stores.title'))}
        breadcrumbLabel={t('stores.title')}
        subtitle={locale === 'ar' ? t('stores.subtitle') : (srCfg.subtitle || t('stores.subtitle'))}
        badge={
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)]">
            <Store className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
            <span>{locale === 'ar' ? t('stores.badge') : (srCfg.badgeText || t('stores.badge'))}</span>
          </div>
        }
      />
    ),
    cards: (
      <div
        key="cards"
        className={
          srCfg.layoutStyle === 'list'
            ? 'space-y-4 max-w-4xl mx-auto'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        }
      >
        {showrooms.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-3xl border border-[var(--royal-border)] p-6 shadow-sm flex flex-col justify-between gap-4 hover:border-[var(--royal-primary)]/50 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-extrabold text-[var(--royal-ink)]">{s.name}</h2>
                {s.city && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-border)]">
                    {s.city}
                  </span>
                )}
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-[var(--royal-primary)] shrink-0 mt-0.5" />
                <span>{s.address}</span>
              </div>
              {srCfg.showPhone !== false && s.phone && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <Phone className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
                  <a href={`tel:${s.phone}`} className="font-semibold hover:text-[var(--royal-primary)] transition">
                    {s.phone}
                  </a>
                </div>
              )}
              {srCfg.showHours !== false && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <Clock className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
                  <span>{s.hours || 'Lun–Sam · 09h00 – 19h00'}</span>
                </div>
              )}
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--royal-primary)] hover:underline pt-2"
            >
              <span>{t('stores.contact_us')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    ),
    map: srCfg.showMap !== false ? (
      <div key="map" className="mt-10 rounded-3xl overflow-hidden border border-[var(--royal-border)] bg-white shadow-sm">
        <iframe
          title="Carte Showrooms Royal"
          src={
            srCfg.mapEmbedUrl ||
            'https://www.openstreetmap.org/export/embed.html?bbox=11.02%2C35.48%2C11.10%2C35.53&layer=mapnik&marker=35.5047%2C11.0622'
          }
          style={{ height: `${Math.max(240, Number(srCfg.mapHeightPx || 380))}px` }}
          className="w-full border-0"
          loading="lazy"
        />
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
