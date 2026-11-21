'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, Clock, ArrowRight, Award } from 'lucide-react';
import { formatTndCurrency } from '@/lib/utils';
import { StorefrontProduct } from './ProductCard';
import { ProductMediaViewer } from './ProductMediaViewer';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

const DEFAULT_ECARDS = [
  { title: '24–48h Express', desc: 'Livraison rapide à domicile sur tous les gouvernorats tunisiens avec suivi de commande.' },
  { title: 'Garantie Officielle', desc: 'Garantie constructeur officielle selon la fiche de chaque article avec SAV dédié.' },
  { title: '387 Références', desc: 'Large choix d’appareils et équipements Royal en stock réel et prêts à être expédiés.' },
];

export function EditorialPromoBanner({ highlightProduct }: { highlightProduct?: StorefrontProduct | null }) {
  const { config } = useCmsConfig();
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
              {home.editorialTag || 'Nos Engagements & Réseau'}
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[var(--royal-ink)] tracking-tight">
            {home.editorialTitle || 'Au Cœur des Foyers Tunisiens'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl">
            {home.editorialSubtitle || 'Royal sélectionne les meilleurs équipements culinaires et appareils électroménagers pour vous garantir fiabilité, sécurité et plaisir quotidien partout en Tunisie.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Stat Box */}
          <div className="md:col-span-4 p-8 rounded-2xl bg-[var(--royal-bg)] border border-[var(--royal-border)] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white border border-[var(--royal-border)] flex items-center justify-center text-[var(--royal-primary)] shadow-sm mb-6">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-4xl sm:text-5xl font-heading font-extrabold text-[var(--royal-ink)] block">
                {home.editorialStatTitle || '24 Gouvernorats'}
              </span>
              <p className="text-xs text-slate-600 mt-3 font-medium leading-relaxed">
                {home.editorialStatDesc || 'Expédition rapide depuis Mahdia 5100 vers toute la Tunisie en 24h à 48h, avec paiement comptant à la réception et vérification de votre commande.'}
              </p>
            </div>

            <Link
              href={highlightProduct ? `/articles/${highlightProduct.slug}` : '/articles'}
              className="mt-6 text-xs font-bold text-[#9A7414] hover:text-[#1D232E] hover:underline inline-flex items-center gap-1.5"
            >
              <span>{highlightProduct ? 'Voir notre sélection phare' : 'Explorer le catalogue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Best-Seller / Random Fallback Real Product Showcase */}
          <div className="md:col-span-8 relative rounded-2xl overflow-hidden min-h-[380px] lg:min-h-[440px] shadow-sm border border-[#E6E1D6] bg-white grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-6 relative h-[320px] sm:h-full bg-[#F4F5F7]">
              <ProductMediaViewer
                images={highlightImages}
                alt={highlightProduct?.name || 'Article Phare Royal'}
                heightClassName="h-[320px] sm:h-full sm:min-h-[380px] lg:min-h-[440px]"
                roundedClassName="rounded-none"
                wrapperClassName="h-full w-full space-y-0"
                borderClassName="border-0"
                showThumbnails={false}
                enableZoomOnHover={true}
                defaultAutoPlay={true}
              />
            </div>

            <div className="sm:col-span-6 p-8 bg-[#F4F5F7]/70 flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-[#E6E1D6]">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] text-[11px] font-bold uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Article Plébiscité</span>
                </span>
                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#1D232E] leading-snug">
                  {highlightProduct?.name || 'Découvrez notre Catalogue Royal'}
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
                  <span>Consulter cet article</span>
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
