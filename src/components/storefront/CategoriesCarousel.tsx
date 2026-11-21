'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { getSafeImageUrl } from '@/lib/cart-session';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  productCount?: number;
  productsCount?: number;
}

interface CategoriesCarouselProps {
  categories: CategoryItem[];
}

export function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  const { config } = useCmsConfig();
  const home = config.views.home;
  const { scrollRef: scrollContainerRef, isDragging, dragProps } = useDragScroll<HTMLDivElement>();

  // Filter categories by CMS selection if configured, otherwise show categories with articles
  const baseCategories = (categories || []).filter(
    (c) => Number(c.productCount ?? c.productsCount ?? 0) > 0 && c.imageUrl
  );
  const validCategories =
    home.categoriesTargetType === 'CATEGORIES' && Array.isArray(home.categoriesTargetSlugs) && home.categoriesTargetSlugs.length > 0
      ? (categories || []).filter(
          (c) => home.categoriesTargetSlugs!.includes(c.slug) && c.imageUrl
        )
      : baseCategories;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (validCategories.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-white border-b border-slate-100">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--royal-primary)]" />
              <span className="text-xs uppercase tracking-widest font-bold text-[var(--royal-gold-dark)]">
                {home.categoriesTag || 'Collections & Rayons'}
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--royal-ink)] tracking-tight">
              {home.categoriesTitle || 'Explorer par Catégories'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Catégorie précédente"
              className="w-10 h-10 rounded-full border border-[#E6E1D6] bg-white hover:bg-[#C59B27] hover:text-white hover:border-[#C59B27] text-[#1D232E] transition flex items-center justify-center shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Catégorie suivante"
              className="w-10 h-10 rounded-full border border-[#E6E1D6] bg-white hover:bg-[#C59B27] hover:text-white hover:border-[#C59B27] text-[#1D232E] transition flex items-center justify-center shadow-sm cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          {...dragProps}
          className={`flex gap-5 overflow-x-auto pb-4 scrollbar-none select-none touch-pan-y ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab snap-x snap-mandatory'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {validCategories.map((cat) => {
            const count = Number(cat.productCount ?? cat.productsCount ?? 0);
            const imgUrl = getSafeImageUrl(cat.imageUrl);
            return (
              <motion.div
                key={cat.id || cat.slug}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 w-64 sm:w-72 snap-start"
              >
                <Link
                  href={`/articles?category=${cat.slug}`}
                  className="group block relative rounded-2xl overflow-hidden bg-[#F4F5F7] border border-slate-200/70 transition-all duration-300 hover:border-slate-400 hover:shadow-lg"
                >
                  {/* Full-bleed responsive category card image with fixed height */}
                  <div className="relative h-60 w-full bg-neutral-100 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover object-center scale-[1.08] group-hover:scale-115 transition-transform duration-500 ease-out"
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between border-t border-slate-200/60 bg-[#F4F5F7]">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-heading font-bold text-sm text-slate-900 group-hover:text-slate-700 transition-colors truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {count} article{count > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-[var(--royal-primary)] group-hover:text-[var(--royal-primary-text)] group-hover:border-[var(--royal-primary)] transition-all shadow-sm shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
