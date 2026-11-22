'use client';

import React from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

const clientReviews = [
  {
    id: 'rev-1',
    name: 'Sami Ben Salem',
    city: 'Tunis, Les Berges du Lac',
    date: 'Il y a 2 jours',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    stars: 5,
    comment:
      'Airfryer 8.5L reçu en moins de 24h à Tunis. La cuisson des viandes et des frites sans huile est tout simplement bluffante. Emballage parfait et facture en règle.',
  },
  {
    id: 'rev-2',
    name: 'Inès Trabelsi',
    city: 'Sousse Sahloul',
    date: 'Il y a 5 jours',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    stars: 5,
    comment:
      'J’ai acheté le robot pétrin DSP 1800W. Très robuste, les pâtes à pain et brioches montent merveilleusement bien. Le retrait au showroom de La Marsa s’est fait en 10 minutes.',
  },
  {
    id: 'rev-3',
    name: 'Mohamed Ali Gharbi',
    city: 'Sfax, Route de Téniour',
    date: 'Il y a 1 semaine',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    stars: 5,
    comment:
      'Four encastrable Royal acheté en ligne. Livraison soignée et conseils précieux du service client par téléphone. Je recommande vivement Royal !',
  },
  {
    id: 'rev-4',
    name: 'Amira Khelil',
    city: 'Monastir, Marina',
    date: 'Il y a 2 semaines',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    stars: 5,
    comment:
      'Machine Expresso Royal 5 en 1 livrée en 24h à Monastir. Extraction parfaite dès le premier café, service après-vente à l’écoute.',
  },
];

export function TestimonialsCarousel() {
  const { scrollRef, isDragging, dragProps } = useDragScroll<HTMLDivElement>();
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const displayReviews =
    config.testimonials && config.testimonials.length > 0
      ? config.testimonials.map((t) => ({
          id: t.id,
          name: t.name,
          city: t.city,
          date: t.dateLabel || 'Vérifié',
          avatar: t.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
          stars: t.stars || 5,
          comment: t.comment,
        }))
      : clientReviews;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -380 : 380, behavior: 'smooth' });
    }
  };

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
          className={`flex gap-6 overflow-x-auto pb-4 select-none touch-pan-y ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab snap-x snap-mandatory'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayReviews.map((rev) => (
            <div
              key={rev.id}
              className="flex-shrink-0 w-[290px] sm:w-[380px] lg:w-[410px] snap-start p-5 sm:p-6 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.avatar}
                      alt={rev.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
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
          ))}
        </div>
      </div>
    </section>
  );
}
