'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { getSafeImageUrl } from '@/lib/cart-session';
import { useI18nStore } from '@/stores/i18n.store';

export interface SlideItem {
  id: string;
  tagline?: string;
  title: string;
  highlightText?: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  imageUrl: string;
}

const luxuryHeroSlides: SlideItem[] = [
  {
    id: 'slide-1',
    tagline: 'INNOVATION CULINAIRE & CONFORT',
    title: 'L’Art de Vivre.',
    highlightText: 'La Précision Culinaire.',
    subtitle:
      'Découvrez notre collection exclusive d’équipements culinaires, friteuses sans huile, robots pétrins et appareils conçus pour durer.',
    primaryCtaText: 'Explorer la Collection',
    primaryCtaLink: '/articles',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=90',
  },
  {
    id: 'slide-2',
    tagline: 'GROS ÉLECTROMÉNAGER & CUISSON',
    title: 'Fours & Plaques.',
    highlightText: 'Ingénierie & Performance.',
    subtitle:
      'Chaleur tournante, foyers haute puissance et finitions inox brossé. Équipez votre cuisine avec les références les plus fiables.',
    primaryCtaText: 'Voir les Nouveautés',
    primaryCtaLink: '/articles?sortBy=newest',
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1920&q=90',
  },
  {
    id: 'slide-3',
    tagline: 'OFFRES PRIVILÈGES ROYAL',
    title: 'Équipez Votre Maison.',
    highlightText: 'Qualité & Prix Directs.',
    subtitle:
      'Profitez de nos promotions actives avec garantie constructeur et livraison rapide partout dans les 24 gouvernorats de Tunisie.',
    primaryCtaText: 'Voir les Promotions',
    primaryCtaLink: '/articles?sortBy=promo',
    imageUrl: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1920&q=90',
  },
];

function sanitizeSlides(raw: unknown): SlideItem[] {
  if (!Array.isArray(raw)) return [];
  const valid = raw.filter(
    (s): s is Record<string, any> =>
      Boolean(s) &&
      typeof s === 'object' &&
      !Array.isArray(s) &&
      ((typeof s.title === 'string' && s.title.trim().length > 0) ||
        (typeof s.imageUrl === 'string' && s.imageUrl.trim().length > 0)),
  );
  return valid.map((s, idx) => {
    const fb = luxuryHeroSlides[idx % luxuryHeroSlides.length];
    return {
      id: typeof s.id === 'string' && s.id.trim() ? s.id : `slide-${idx + 1}`,
      tagline: typeof s.tagline === 'string' ? s.tagline : fb.tagline,
      title: typeof s.title === 'string' && s.title.trim() ? s.title : fb.title,
      highlightText: typeof s.highlightText === 'string' ? s.highlightText : fb.highlightText,
      subtitle: typeof s.subtitle === 'string' ? s.subtitle : fb.subtitle,
      primaryCtaText:
        typeof s.primaryCtaText === 'string' && s.primaryCtaText.trim() ? s.primaryCtaText : fb.primaryCtaText,
      primaryCtaLink:
        typeof s.primaryCtaLink === 'string' && s.primaryCtaLink.trim() ? s.primaryCtaLink : fb.primaryCtaLink,
      imageUrl: typeof s.imageUrl === 'string' && s.imageUrl.trim() ? s.imageUrl : fb.imageUrl,
    };
  });
}

export function HeroBanner({ slides: propSlides }: { slides?: SlideItem[] }) {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();

  const slides = useMemo(() => {
    const fromProps = sanitizeSlides(propSlides);
    if (fromProps.length > 0) return fromProps;
    const fromCms = sanitizeSlides(config?.heroSlides);
    if (fromCms.length > 0) return fromCms;
    return luxuryHeroSlides;
  }, [propSlides, config?.heroSlides]);

  const heroAutoplayMs = Math.max(2000, Number(config.views.home.heroAutoplayMs || 6000));
  const heroHeightPx = Math.max(420, Number(config.views.home.heroHeightPx || 720));
  const heroAnim = config.views.home.heroAnimation || 'slide';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const swipeStartXRef = React.useRef<number | null>(null);

  const HERO_FR_TO_AR: Record<string, string> = {
    'INNOVATION CULINAIRE & CONFORT': 'الابتكار في المطبخ والراحة',
    'L’Art de Vivre.': 'فن العيش الراقي.',
    "L'Art de Vivre.": 'فن العيش الراقي.',
    'La Précision Culinaire.': 'الدقة في عالم الطهي.',
    'Découvrez notre collection exclusive d’équipements culinaires, friteuses sans huile, robots pétrins et appareils conçus pour durer.': 'اكتشفوا تشكيلتنا الحصرية من تجهيزات المطبخ، القلايات بدون زيت، العجانات والأجهزة المصممة لتدوم طويلاً.',
    "Découvrez notre collection exclusive d'équipements culinaires, friteuses sans huile, robots pétrins et appareils conçus pour durer.": 'اكتشفوا تشكيلتنا الحصرية من تجهيزات المطبخ، القلايات بدون زيت، العجانات والأجهزة المصممة لتدوم طويلاً.',
    'Explorer la Collection': 'استكشف التشكيلة',
    'GROS ÉLECTROMÉNAGER & CUISSON': 'الأجهزة الكبيرة ومعدات الطهي',
    'Fours & Plaques.': 'الأفران ومواقد الطبخ.',
    'Ingénierie & Performance.': 'هندسة متقنة وأداء فائق.',
    'Chaleur tournante, foyers haute puissance et finitions inox brossé. Équipez votre cuisine avec les références les plus fiables.': 'حرارة دوارة، مواقد عالية القدرة وتشطيبات ستانلس ستيل مصقول. جهّز مطبخك بأكثر المنتجات موثوقية.',
    'Voir les Nouveautés': 'اكتشف أحدث الوصولات',
    'OFFRES PRIVILÈGES ROYAL': 'عروض امتيازات رويال',
    'Équipez Votre Maison.': 'جهّز منزلك بأناقة.',
    'Qualité & Prix Directs.': 'جودة عالية وأسعار مباشرة.',
    'Profitez de nos promotions actives avec garantie constructeur et livraison rapide partout dans les 24 gouvernorats de Tunisie.': 'استفيدوا من تخفيضاتنا الجارية مع ضمان المصنع وتوصيل سريع لكافة ولايات الجمهورية التونسية الـ 24.',
    'Voir les Promotions': 'عرض التخفيضات',
    'Voir le Catalogue': 'تصفح الكتالوج',
    Catalogue: 'الكتالوج',
    Promotions: 'التخفيضات',
  };

  const translateSlideText = (val?: string | null, arVal?: string | null) => {
    if (locale !== 'ar') return val || '';
    if (arVal && arVal.trim()) return arVal;
    if (!val) return '';
    return HERO_FR_TO_AR[val.trim()] || val;
  };

  const safeIndex = slides.length > 0 ? ((currentIndex % slides.length) + slides.length) % slides.length : 0;
  const rawSlide = slides[safeIndex] || luxuryHeroSlides[0];
  const anySlide = rawSlide as unknown as Record<string, string | undefined>;
  const isFallbackFirst = slides === luxuryHeroSlides && safeIndex === 0;
  const currentSlide =
    locale === 'ar'
      ? {
          ...rawSlide,
          tagline: translateSlideText(rawSlide.tagline, anySlide?.taglineAr),
          title: anySlide?.titleAr || HERO_FR_TO_AR[(rawSlide.title || '').trim()] || (isFallbackFirst ? t('storefront.hero_title') : rawSlide.title),
          highlightText: isFallbackFirst && !anySlide?.highlightTextAr ? '' : translateSlideText(rawSlide.highlightText, anySlide?.highlightTextAr),
          subtitle: anySlide?.subtitleAr || HERO_FR_TO_AR[(rawSlide.subtitle || '').trim()] || (isFallbackFirst ? t('storefront.hero_subtitle') : rawSlide.subtitle),
          primaryCtaText: anySlide?.primaryCtaTextAr || HERO_FR_TO_AR[(rawSlide.primaryCtaText || '').trim()] || (isFallbackFirst ? t('storefront.explore_collection') : rawSlide.primaryCtaText),
        }
      : rawSlide;

  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement)?.closest('a, button')) return;
    swipeStartXRef.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (swipeStartXRef.current === null) return;
    const dx = e.clientX - swipeStartXRef.current;
    swipeStartXRef.current = null;
    if (Math.abs(dx) > 45 && slides.length > 1) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  };

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, heroAutoplayMs);
    return () => clearInterval(interval);
  }, [isPaused, slides.length, heroAutoplayMs, safeIndex]);

  return (
    <section
      aria-label="Bannière Principale Royal"
      data-active-slide={safeIndex}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        swipeStartXRef.current = null;
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ height: `${heroHeightPx}px` }}
      className="relative w-full overflow-hidden bg-neutral-950 text-white flex items-center pt-20 sm:pt-24 select-none cursor-grab active:cursor-grabbing"
    >
      {/* Background Slider Track / Stack (zero-leak full-bleed overflow-hidden) */}
      <div dir="ltr" className="absolute inset-0 z-0 overflow-hidden">
        {heroAnim === 'slide' ? (
          <div
            className="flex w-full h-full transition-transform duration-700 ease-out will-change-transform"
            style={{ transform: `translate3d(-${safeIndex * 100}%, 0, 0)` }}
          >
            {slides.map((slide, idx) => {
              const fbUrl = luxuryHeroSlides[idx % luxuryHeroSlides.length].imageUrl;
              const imgSrc = getSafeImageUrl(slide.imageUrl, fbUrl);
              return (
                <div key={slide.id || `slide-bg-${idx}`} className="relative w-full h-full shrink-0 overflow-hidden">
                  <img
                    src={imgSrc}
                    alt={slide.title || 'Royal Electroménager'}
                    loading="eager"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.fallbackApplied) return;
                      img.dataset.fallbackApplied = '1';
                      img.src = fbUrl;
                    }}
                    className="w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative w-full h-full overflow-hidden">
            {slides.map((slide, idx) => {
              const isActive = idx === safeIndex;
              const fbUrl = luxuryHeroSlides[idx % luxuryHeroSlides.length].imageUrl;
              const imgSrc = getSafeImageUrl(slide.imageUrl, fbUrl);
              return (
                <div
                  key={slide.id || `slide-layer-${idx}`}
                  className={`absolute inset-0 w-full h-full overflow-hidden transition-all duration-700 ease-out ${
                    isActive
                      ? 'opacity-100 scale-100 z-10'
                      : heroAnim === 'zoom'
                      ? 'opacity-0 scale-105 z-0 pointer-events-none'
                      : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={imgSrc}
                    alt={slide.title || 'Royal Electroménager'}
                    loading="eager"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.fallbackApplied) return;
                      img.dataset.fallbackApplied = '1';
                      img.src = fbUrl;
                    }}
                    className="w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deterministic Always-Visible Foreground Content */}
      <div className="relative z-20 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex flex-col justify-center pointer-events-none">
        <div
          key={`hero-copy-${currentSlide.id}-${safeIndex}`}
          className="max-w-2xl opacity-100 translate-y-0 transition-all duration-500 pointer-events-auto"
        >
          {currentSlide.tagline && (
            <p className="text-xs uppercase tracking-[0.3em] font-semibold text-amber-300 mb-4">
              {currentSlide.tagline}
            </p>
          )}

          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-heading font-extrabold text-white tracking-tight leading-[1.08]">
            {currentSlide.title}
            {currentSlide.highlightText && (
              <span className="block text-slate-200 font-heading font-bold mt-1">
                {currentSlide.highlightText}
              </span>
            )}
          </h1>

          {currentSlide.subtitle && (
            <p className="mt-4 sm:mt-5 text-xs sm:text-base text-slate-200/90 max-w-lg leading-relaxed font-normal">
              {currentSlide.subtitle}
            </p>
          )}

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href={currentSlide.primaryCtaLink || '/articles'}
              className="group inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xl hover:bg-slate-100 hover:scale-[1.02]"
            >
              <span>{currentSlide.primaryCtaText || t('storefront.explore_collection')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/articles?sortBy=promo"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-xs tracking-wider uppercase backdrop-blur-md transition"
            >
              <span>{t('storefront.promo_offers')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Navigation Controls (Explicit z-30 & pointer isolation) */}
      {slides.length > 1 && (
        <div
          className="absolute bottom-8 right-6 sm:right-12 lg:right-20 z-30 flex items-center gap-3 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mr-3">
            {slides.map((s, idx) => (
              <button
                key={s.id || `dot-${idx}`}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Slide ${idx + 1}`}
                aria-current={idx === safeIndex ? 'true' : undefined}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === safeIndex ? 'w-8 bg-white shadow-sm' : 'w-2.5 bg-white/45 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Slide précédent"
            className="w-10 h-10 rounded-full border border-white/35 bg-black/40 hover:bg-white hover:text-black text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Slide suivant"
            className="w-10 h-10 rounded-full border border-white/35 bg-black/40 hover:bg-white hover:text-black text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
