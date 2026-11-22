'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, Clock, ArrowRight, Award } from 'lucide-react';
import { formatTndCurrency } from '@/lib/utils';
import { StorefrontProduct } from './ProductCard';
import { ProductMediaViewer } from './ProductMediaViewer';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

const DEFAULT_ECARDS = [
  { title: '24–48h Express', desc: 'Livraison rapide à domicile sur tous les gouvernorats tunisiens avec suivi de commande.' },
  { title: 'Garantie Officielle', desc: 'Garantie constructeur officielle selon la fiche de chaque article avec SAV dédié.' },
  { title: '387 Références', desc: 'Large choix d’appareils et équipements Royal en stock réel et prêts à être expédiés.' },
];

export function EditorialPromoBanner({ highlightProduct }: { highlightProduct?: StorefrontProduct | null }) {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const home = config.views.home;
  const eCards = Array.isArray(home.editorialCards) && home.editorialCards.length === 3 ? home.editorialCards : DEFAULT_ECARDS;
  const hasPromo =
    highlightProduct &&
    highlightProduct.discountPrice !== null &&
    highlightProduct.discountPrice !== undefined &&
    Number(highlightProduct.discountPrice) > 0 &&
    Number(highlightProduct.discountPrice) < Number(highlightProduct.sellingPrice);
  const activePrice = highlightProduct
    ? hasPromo
      ? Number(highlightProduct.discountPrice)
      : Number(highlightProduct.sellingPrice)
    : 0;

  const highlightImages = React.useMemo(() => {
    const imgs: Array<string | undefined> = [home.editorialCustomImageUrl];
    if (highlightProduct) {
      imgs.push(highlightProduct.primaryImage, ...(highlightProduct.images || []));
    }
    return imgs.filter(Boolean) as string[];
  }, [highlightProduct, home.editorialCustomImageUrl]);

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-100">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--royal-primary)]" />
            <span className="text-xs uppercase tracking-widest font-bold text-[var(--royal-gold-dark)]">
              {locale === 'ar' ? t('storefront.editorial_tag') : (home.editorialTag || t('storefront.editorial_tag'))}
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[var(--royal-ink)] tracking-tight">
            {locale === 'ar' ? t('storefront.editorial_title') : (home.editorialTitle || t('storefront.editorial_title'))}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl">
            {locale === 'ar' ? t('storefront.editorial_subtitle') : (home.editorialSubtitle || t('storefront.editorial_subtitle'))}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Stat Box */}
          <div className="md:col-span-4 p-6 sm:p-8 rounded-2xl bg-[var(--royal-bg)] border border-[var(--royal-border)] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white border border-[var(--royal-border)] flex items-center justify-center text-[var(--royal-primary)] shadow-sm mb-6">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-3xl sm:text-5xl font-heading font-extrabold text-[var(--royal-ink)] block">
                {locale === 'ar' ? t('storefront.editorial_stat_title') : (home.editorialStatTitle || t('storefront.editorial_stat_title'))}
              </span>
              <p className="text-xs text-slate-600 mt-3 font-medium leading-relaxed">
                {locale === 'ar' ? t('storefront.editorial_stat_desc') : (home.editorialStatDesc || t('storefront.editorial_stat_desc'))}
              </p>
            </div>

            <Link
              href={highlightProduct ? `/articles/${highlightProduct.slug}` : '/articles'}
              className="mt-6 text-xs font-bold text-[#9A7414] hover:text-[#1D232E] hover:underline inline-flex items-center gap-1.5"
            >
              <span>{highlightProduct ? t('storefront.editorial_cta') : t('storefront.editorial_cta_fallback')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Best-Seller / Random Fallback Real Product Showcase */}
          <div className="md:col-span-8 relative rounded-2xl overflow-hidden min-h-[380px] lg:min-h-[440px] shadow-sm border border-[#E6E1D6] bg-white grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-6 relative h-[280px] sm:h-full bg-[#F4F5F7]">
              <ProductMediaViewer
                images={highlightImages}
                alt={highlightProduct?.name || 'Article Phare Royal'}
                heightClassName="h-[280px] sm:h-full sm:min-h-[380px] lg:min-h-[440px]"
                roundedClassName="rounded-none"
                wrapperClassName="h-full w-full space-y-0"
                borderClassName="border-0"
                showThumbnails={false}
                enableZoomOnHover={true}
                defaultAutoPlay={true}
              />
            </div>

            <div className="sm:col-span-6 p-6 sm:p-8 bg-[#F4F5F7]/70 flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-[#E6E1D6]">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] text-[11px] font-bold uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>{t('storefront.editorial_badge')}</span>
                </span>
                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#1D232E] leading-snug">
                  {highlightProduct?.name || t('storefront.discover_full_catalog')}
                </h3>
                {highlightProduct?.shortDescription && (
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {highlightProduct.shortDescription}
                  </p>
                )}
              </div>

              <div className="pt-5 space-y-4">
                {highlightProduct && (
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black text-slate-950">
                      {formatTndCurrency(activePrice)}
                    </span>
                    {hasPromo && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatTndCurrency(highlightProduct.sellingPrice)}
                      </span>
                    )}
                  </div>
                )}

                <Link
                  href={highlightProduct ? `/articles/${highlightProduct.slug}` : '/articles'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider transition shadow-md"
                >
                  <span>{t('storefront.editorial_cta')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Secondary Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <div className="p-6 rounded-2xl bg-[var(--royal-silver-light)] border border-[var(--royal-border)]">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[var(--royal-primary)]" />
              <span className="text-2xl font-heading font-extrabold text-[var(--royal-ink)]">{eCards[0]?.title}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{eCards[0]?.desc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--royal-silver-light)] border border-[var(--royal-border)]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[var(--royal-primary)]" />
              <span className="text-2xl font-heading font-extrabold text-[var(--royal-ink)]">{eCards[1]?.title}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{eCards[1]?.desc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--royal-silver-light)] border border-[var(--royal-border)]">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-heading font-extrabold text-[var(--royal-ink)]">{eCards[2]?.title}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{eCards[2]?.desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
