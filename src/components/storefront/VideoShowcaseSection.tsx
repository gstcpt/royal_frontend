'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, CheckCircle2, Sparkles, Check } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { formatTndCurrency } from '@/lib/utils';
import { StorefrontProduct } from './ProductCard';
import { ProductMediaViewer } from './ProductMediaViewer';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

export function VideoShowcaseSection({ product }: { product?: StorefrontProduct | null }) {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const { addItem } = useCartStore();
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const customHeroImg = config.views.home.featuredVideoCustomImageUrl;
  const showcaseImages = [customHeroImg, product.primaryImage, ...(product.images || [])].filter(Boolean) as string[];

  const variants = product.variants || [];
  const activeVariant = variants[selectedVariantIdx] || variants[0];
  const hasPromo =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    Number(product.discountPrice) > 0 &&
    Number(product.discountPrice) < Number(product.sellingPrice);
  const activePrice = hasPromo ? Number(product.discountPrice) : Number(product.sellingPrice);

  const dims = product.dimensionsJson || {};
  const specBullets = [
    dims.puissance ? `Puissance : ${dims.puissance}` : null,
    dims.capacite ? `Capacité : ${dims.capacite}` : null,
    dims.garantie ? `${t('product.warranty_prefix')} ${dims.garantie}` : t('storefront.video_warranty_default'),
  ].filter(Boolean) as string[];

  const handleQuickAdd = async () => {
    await addItem({
      productId: product.id,
      ...(activeVariant?.id ? { variantId: activeVariant.id } : {}),
      name: product.name,
      price: activeVariant?.sellingPrice || activePrice,
      quantity: 1,
      sku: activeVariant?.sku || product.sku,
      productName: product.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-100 overflow-hidden">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-[#F8F9FA] rounded-3xl p-5 sm:p-10 lg:p-16 border border-slate-200/80">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--royal-border)] text-xs font-bold text-[var(--royal-ink)] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>{locale === 'ar' ? t('storefront.video_tag') : (config.views.home.featuredVideoTag || t('storefront.video_tag'))}</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
              {product.name}
              {product.brand?.name && (
                <span className="block text-slate-500 font-bold mt-1 text-xl sm:text-2xl">
                  {t('storefront.video_brand')} {product.brand.name} • {t('storefront.video_ref')} {product.sku}
                </span>
              )}
            </h2>

            {product.shortDescription && (
              <p className="text-sm text-slate-600 leading-relaxed max-w-lg line-clamp-3">
                {product.shortDescription}
              </p>
            )}

            <div className="space-y-2 pt-1 text-xs text-slate-700">
              {specBullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {/* Color Swatch Dots */}
            {variants.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  {t('storefront.video_finish_variant')} <strong className="text-slate-950">{activeVariant?.name}</strong>
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {variants.map((v, idx) => {
                    const hex = v.attributesJson?.colorHex;
                    const isSel = selectedVariantIdx === idx;
                    if (hex) {
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantIdx(idx)}
                          title={v.name}
                          className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                            isSel ? 'border-slate-950 scale-110 ring-2 ring-amber-400/50' : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    }
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantIdx(idx)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                          isSel
                            ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)]'
                            : 'bg-white text-slate-700 border-[var(--royal-border)] hover:border-[var(--royal-primary)]'
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price & CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-6">
              <div>
                <span className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-950">
                  {formatTndCurrency(activeVariant?.sellingPrice || activePrice)}
                </span>
                {hasPromo && (
                  <span className="ml-3 text-sm text-slate-400 line-through">
                    {formatTndCurrency(product.sellingPrice)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="px-6 py-3 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {added ? <Check className="w-4 h-4 text-emerald-400" /> : <ShoppingBag className="w-4 h-4" />}
                  <span>{added ? t('storefront.video_added') : t('actions.buy')}</span>
                </button>

                <Link
                  href={`/articles/${product.slug}`}
                  className="text-xs font-bold text-slate-900 hover:underline inline-flex items-center gap-1"
                >
                  <span>{t('storefront.video_view_detail')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Edge-to-Edge Autoplay Product Media Viewer */}
          <div className="lg:col-span-6 relative w-full">
            <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              <ProductMediaViewer
                images={showcaseImages}
                alt={product.name}
                heightClassName="h-[360px] sm:h-[420px] lg:h-[480px]"
                roundedClassName="rounded-3xl"
                wrapperClassName="h-full w-full space-y-0"
                borderClassName="border-0"
                showThumbnails={false}
                enableZoomOnHover={true}
                defaultAutoPlay={true}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
