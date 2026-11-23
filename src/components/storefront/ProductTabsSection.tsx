'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Star, Percent } from 'lucide-react';
import { ProductCard, StorefrontProduct } from './ProductCard';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useI18nStore } from '@/stores/i18n.store';

interface ProductTabsSectionProps {
  newProducts: StorefrontProduct[];
  topRatedProducts: StorefrontProduct[];
  promoProducts: StorefrontProduct[];
}

export function IsolatedProductCarousel({
  title,
  tag,
  subtitle,
  icon,
  products,
  viewAllHref,
  displayMode = 'carousel',
}: {
  title: string;
  tag: string;
  subtitle?: string;
  icon: React.ReactNode;
  products: StorefrontProduct[];
  viewAllHref: string;
  displayMode?: 'carousel' | 'grid';
}) {
  const { t } = useI18nStore();
  const { scrollRef, isDragging, dragProps } = useDragScroll<HTMLDivElement>();
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (displayMode === 'grid' || isHovered || isDragging || (products || []).length <= 1) return;
    const timer = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollWidth <= el.clientWidth + 8) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 16) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 315, behavior: 'smooth' });
      }
    }, 3800);
    return () => clearInterval(timer);
  }, [displayMode, isHovered, isDragging, products, scrollRef]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-white border-b border-slate-100">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-7 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {icon}
              <span className="text-xs uppercase tracking-widest font-bold text-slate-500">
                {tag}
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#1D232E] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={viewAllHref}
              className="text-xs font-bold text-[#9A7414] hover:text-[#1D232E] hover:underline inline-flex items-center gap-1 mr-2"
            >
              <span>{t('common.view_all')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {displayMode !== 'grid' && (
              <>
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  aria-label={`${title} précédent`}
                  className="w-10 h-10 rounded-full border border-[#E6E1D6] bg-white hover:bg-[#C59B27] hover:border-[#C59B27] hover:text-white text-[#1D232E] transition flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  aria-label={`${title} suivant`}
                  className="w-10 h-10 rounded-full border border-[#E6E1D6] bg-white hover:bg-[#C59B27] hover:border-[#C59B27] hover:text-white text-[#1D232E] transition flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {displayMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            {...dragProps}
            data-carousel-paused={isHovered ? 'true' : 'false'}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`flex gap-5 overflow-x-auto pb-3 select-none touch-pan-y ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab snap-x snap-mandatory'
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[270px] sm:w-[295px] snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ProductTabsSection({
  newProducts,
  topRatedProducts,
  promoProducts,
}: ProductTabsSectionProps) {
  const { t } = useI18nStore();
  return (
    <section className="py-12 md:py-16 bg-white border-b border-slate-100">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--royal-primary)]" />
            <span className="text-xs uppercase tracking-widest font-bold text-slate-500">
              {t('storefront.recommended_tag')}
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight">
            {t('storefront.recommended_title')}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl">
            {t('storefront.recommended_subtitle')}
          </p>
        </div>

        {/* 1. Nouveautés Carousel */}
        <IsolatedProductCarousel
          title={t('storefront.new_arrivals')}
          tag={t('storefront.new_arrivals_tag')}
          icon={<Sparkles className="w-4 h-4 text-amber-500" />}
          products={newProducts}
          viewAllHref="/articles?sortBy=newest"
        />

        {/* 2. Mieux Notés Carousel */}
        <IsolatedProductCarousel
          title={t('storefront.top_rated')}
          tag={t('storefront.top_rated_tag')}
          icon={<Star className="w-4 h-4 text-amber-500 fill-current" />}
          products={topRatedProducts}
          viewAllHref="/articles?sortBy=popular"
        />

        {/* 3. Promotions Carousel */}
        <IsolatedProductCarousel
          title={t('storefront.promotions')}
          tag={t('storefront.promotions_tag')}
          icon={<Percent className="w-4 h-4 text-rose-600" />}
          products={promoProducts}
          viewAllHref="/articles?sortBy=promo"
        />

        <div className="mt-10 text-center">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs uppercase tracking-wider font-bold transition shadow-md"
          >
            <span>{t('storefront.discover_full_catalog')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
