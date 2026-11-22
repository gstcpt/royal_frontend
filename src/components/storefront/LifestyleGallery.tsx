'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getSafeImageUrl } from '@/lib/cart-session';
import { formatTndCurrency } from '@/lib/utils';
import { StorefrontProduct } from './ProductCard';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

export function LifestyleGallery({ featuredProducts = [] }: { featuredProducts?: StorefrontProduct[] }) {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const home = config.views.home;
  const items = featuredProducts.slice(0, 4);
  if (items.length === 0) return null;
  const bannerImg = home.lifestyleCustomBannerUrl ? getSafeImageUrl(home.lifestyleCustomBannerUrl) : '';

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-[var(--royal-border)]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {bannerImg && (
          <div className="mb-10 rounded-3xl overflow-hidden border border-[#E6E1D6] h-48 sm:h-64 relative shadow-sm">
            <img src={bannerImg} alt={t('storefront.lifestyle_title')} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent flex items-end p-6 sm:p-8">
              <div className="text-white">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 block mb-1">
                  {locale === 'ar' ? t('storefront.lifestyle_tag') : (home.lifestyleTag || t('storefront.lifestyle_tag'))}
                </span>
                <p className="font-heading text-xl sm:text-3xl font-extrabold">
                  {locale === 'ar' ? t('storefront.lifestyle_title') : (home.lifestyleTitle || t('storefront.lifestyle_title'))}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] block mb-2">
              {locale === 'ar' ? t('storefront.lifestyle_tag') : (home.lifestyleTag || t('storefront.lifestyle_tag'))}
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[var(--royal-ink)] tracking-tight">
              {locale === 'ar' ? t('storefront.lifestyle_title') : (home.lifestyleTitle || t('storefront.lifestyle_title'))}
            </h2>
          </div>

          <Link
            href="/articles?collection=featured"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-[var(--royal-primary)] hover:underline transition"
          >
            <span>{locale === 'ar' ? t('storefront.lifestyle_cta') : (home.lifestyleCtaText || t('storefront.lifestyle_cta'))}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const hasPromo =
              item.discountPrice !== null &&
              item.discountPrice !== undefined &&
              Number(item.discountPrice) > 0 &&
              Number(item.discountPrice) < Number(item.sellingPrice);
            const activePrice = hasPromo ? Number(item.discountPrice) : Number(item.sellingPrice);
            return (
              <div
                key={item.id}
                className="relative h-[380px] rounded-3xl overflow-hidden group border border-neutral-200 bg-white transition-all hover:shadow-xl"
              >
                <img
                  src={getSafeImageUrl(item.primaryImage)}
                  alt={item.name}
                  className="w-full h-full object-cover object-center scale-[1.06] group-hover:scale-110 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 text-neutral-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <ArrowUpRight className="w-4 h-4" />
                </div>

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 block mb-1">
                    {item.brand?.name || 'Royal'} • {item.category?.name || 'En vedette'}
                  </span>
                  <h3 className="text-sm font-bold tracking-tight line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-sm font-black text-white">
                      {formatTndCurrency(activePrice)}
                    </span>
                    {hasPromo && (
                      <span className="text-xs text-white/60 line-through">
                        {formatTndCurrency(item.sellingPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <Link href={`/articles/${item.slug}`} className="absolute inset-0 z-10">
                  <span className="sr-only">Voir {item.name}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
