'use client';

import React from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

export function TestimonialsCarousel() {
  const { scrollRef, isDragging, dragProps } = useDragScroll<HTMLDivElement>();
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const [isHovered, setIsHovered] = React.useState(false);
  const displayReviews =
    config.testimonials && config.testimonials.length > 0
      ? config.testimonials.map((item) => ({
          id: item.id,
          name: item.name,
          city: item.city,
          date: item.dateLabel || 'Vérifié',
          avatar: item.avatar || '',
          stars: item.stars || 5,
          comment: item.comment,
        }))
      : [];

  React.useEffect(() => {
    if (isHovered || isDragging || displayReviews.length <= 1) return;
    const timer = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollWidth <= el.clientWidth + 8) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 16) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 390, behavior: 'smooth' });
      }
    }, 4200);
    return () => clearInterval(timer);
  }, [isHovered, isDragging, displayReviews.length, scrollRef]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -380 : 380, behavior: 'smooth' });
    }
  };

  if (displayReviews.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-100">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--royal-primary)]" />
              <span className="text-xs uppercase tracking-widest font-bold text-[var(--royal-gold-dark)]">
                {locale === 'ar' ? t('storefront.testimonials_tag') : (config.views.home.testimonialsTag || t('storefront.testimonials_tag'))}
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[var(--royal-ink)] tracking-tight">
              {locale === 'ar' ? t('storefront.testimonials_title') : (config.views.home.testimonialsTitle || t('storefront.testimonials_title'))}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--royal-ink)]">
              <span className="text-[var(--royal-primary)] flex items-center gap-1">★★★★★</span>
              <span>{locale === 'ar' ? t('storefront.testimonials_badge') : (config.views.home.testimonialsBadge || t('storefront.testimonials_badge'))}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                aria-label={t('storefront.testimonials_prev')}
                className="w-10 h-10 rounded-full border border-[#E6E1D6] bg-white hover:bg-[#C59B27] hover:border-[#C59B27] hover:text-white text-[#1D232E] transition flex items-center justify-center shadow-xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                aria-label={t('storefront.testimonials_next')}
                className="w-10 h-10 rounded-full border border-[#E6E1D6] bg-white hover:bg-[#C59B27] hover:border-[#C59B27] hover:text-white text-[#1D232E] transition flex items-center justify-center shadow-xs cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          {...dragProps}
          data-carousel-paused={isHovered ? 'true' : 'false'}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`flex gap-6 overflow-x-auto pb-4 select-none touch-pan-y ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab snap-x snap-mandatory'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayReviews.map((rev) => {
            const initials = rev.name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((s) => s[0]?.toUpperCase() || '')
              .join('') || 'CL';
            return (
            <div
              key={rev.id}
              className="flex-shrink-0 w-[290px] sm:w-[380px] lg:w-[410px] snap-start p-5 sm:p-6 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {rev.avatar ? (
                      <img
                        src={rev.avatar}
                        alt={rev.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] flex items-center justify-center font-heading font-bold text-xs shrink-0">
                        {initials}
                      </div>
                    )}
                    <div>
                      <h4 className="font-heading font-bold text-sm text-slate-900">{rev.name}</h4>
                      <p className="text-[11px] text-slate-500">{rev.city}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{rev.date}</span>
                </div>

                <div className="flex text-amber-500 mb-3">
                  {[...Array(rev.stars)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  « {rev.comment} »
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{t('common.verified')}</span>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
