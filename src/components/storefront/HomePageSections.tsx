'use client';

import React from 'react';
import { HeroBanner } from '@/components/storefront/HeroBanner';
import { BrandMarquee } from '@/components/storefront/BrandMarquee';
import { CategoriesCarousel } from '@/components/storefront/CategoriesCarousel';
import { IsolatedProductCarousel } from '@/components/storefront/ProductTabsSection';
import { VideoShowcaseSection } from '@/components/storefront/VideoShowcaseSection';
import { EditorialPromoBanner } from '@/components/storefront/EditorialPromoBanner';
import { NewsletterSection } from '@/components/storefront/NewsletterSection';
import { ValuePropositionBar } from '@/components/storefront/ValuePropositionBar';
import { LifestyleGallery } from '@/components/storefront/LifestyleGallery';
import { TestimonialsCarousel } from '@/components/storefront/TestimonialsCarousel';
import { BottomPromoFloatingCard } from '@/components/storefront/BottomPromoFloatingCard';
import { StorefrontProduct } from '@/components/storefront/ProductCard';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { Sparkles, Star, Percent } from 'lucide-react';

export function HomePageSections({
  categories,
  brands,
  newProducts,
  topRatedProducts,
  promoProducts,
  spotlightProduct,
  highlightProduct,
  galleryProducts,
}: {
  categories: any[];
  brands: Array<{ name: string; slug?: string }>;
  newProducts: StorefrontProduct[];
  topRatedProducts: StorefrontProduct[];
  promoProducts: StorefrontProduct[];
  spotlightProduct: StorefrontProduct | null;
  highlightProduct: StorefrontProduct | null;
  galleryProducts: StorefrontProduct[];
}) {
  const { config } = useCmsConfig();
  const home = config.views.home;
  const [dynamicPool, setDynamicPool] = React.useState<StorefrontProduct[]>([]);

  const needsDynamicPool = React.useMemo(() => {
    return (
      (home.newArrivalsTargetType && home.newArrivalsTargetType !== 'AUTO') ||
      (home.topRatedTargetType && home.topRatedTargetType !== 'AUTO') ||
      (home.promotionsTargetType && home.promotionsTargetType !== 'AUTO') ||
      (home.featuredVideoTargetType && home.featuredVideoTargetType !== 'AUTO') ||
      (home.editorialTargetType && home.editorialTargetType !== 'AUTO') ||
      (home.lifestyleTargetType && home.lifestyleTargetType !== 'AUTO')
    );
  }, [home]);

  React.useEffect(() => {
    if (!needsDynamicPool) return;
    let cancelled = false;
    fetch('/api/v1/products/storefront?limit=150')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        const list = json?.data?.data || json?.data || json?.products || [];
        if (Array.isArray(list)) setDynamicPool(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [needsDynamicPool]);

  const combinedPool = React.useMemo(() => {
    const map = new Map<string, StorefrontProduct>();
    for (const p of [...dynamicPool, ...newProducts, ...topRatedProducts, ...promoProducts, ...galleryProducts]) {
      if (p?.id && !map.has(p.id)) map.set(p.id, p);
    }
    return Array.from(map.values());
  }, [dynamicPool, newProducts, topRatedProducts, promoProducts, galleryProducts]);

  const resolveTargetedList = React.useCallback(
    (
      fallbackList: StorefrontProduct[],
      targetType?: string,
      categorySlugs?: string[],
      productIds?: string[],
      limit = 16,
    ): StorefrontProduct[] => {
      if (targetType === 'ARTICLES' && Array.isArray(productIds) && productIds.length > 0) {
        const picked = productIds
          .map((id) => combinedPool.find((p) => p.id === id))
          .filter(Boolean) as StorefrontProduct[];
        if (picked.length > 0) return picked.slice(0, limit);
      }
      if (targetType === 'CATEGORIES' && Array.isArray(categorySlugs) && categorySlugs.length > 0) {
        const matched = combinedPool.filter((p) => p.category?.slug && categorySlugs.includes(p.category.slug));
        if (matched.length > 0) return matched.slice(0, limit);
      }
      return fallbackList.slice(0, limit);
    },
    [combinedPool],
  );

  const resolvedNewProducts = resolveTargetedList(
    newProducts,
    home.newArrivalsTargetType,
    home.newArrivalsTargetCategorySlugs,
    home.newArrivalsTargetProductIds,
    home.newArrivalsLimit || 16,
  );
  const resolvedTopRatedProducts = resolveTargetedList(
    topRatedProducts,
    home.topRatedTargetType,
    home.topRatedTargetCategorySlugs,
    home.topRatedTargetProductIds,
    home.topRatedLimit || 16,
  );
  const resolvedPromoProducts = resolveTargetedList(
    promoProducts,
    home.promotionsTargetType,
    home.promotionsTargetCategorySlugs,
    home.promotionsTargetProductIds,
    home.promotionsLimit || 16,
  );
  const resolvedSpotlight = React.useMemo(() => {
    if (home.featuredVideoTargetType === 'ARTICLES') {
      const targetId = home.featuredVideoTargetProductIds?.[0] || home.featuredVideoTargetProductId;
      const found = targetId ? combinedPool.find((p) => p.id === targetId) : null;
      if (found) return found;
    }
    return spotlightProduct;
  }, [home.featuredVideoTargetType, home.featuredVideoTargetProductIds, home.featuredVideoTargetProductId, combinedPool, spotlightProduct]);

  const resolvedHighlight = React.useMemo(() => {
    const picked = resolveTargetedList(
      highlightProduct ? [highlightProduct] : [],
      home.editorialTargetType,
      home.editorialTargetCategorySlugs,
      home.editorialTargetProductIds,
      1,
    );
    return picked[0] || highlightProduct;
  }, [resolveTargetedList, highlightProduct, home.editorialTargetType, home.editorialTargetCategorySlugs, home.editorialTargetProductIds]);

  const resolvedGallery = resolveTargetedList(
    galleryProducts,
    home.lifestyleTargetType,
    home.lifestyleTargetCategorySlugs,
    home.lifestyleTargetProductIds,
    4,
  );

  const sectionRenderers: Record<string, React.ReactNode> = {
    hero: home.showHeroSlider ? (
      <div key="hero">
        <HeroBanner />
        {home.showBrandMarquee !== false && <BrandMarquee brands={brands} />}
      </div>
    ) : null,
    categories: home.showCategoriesCarousel ? (
      <CategoriesCarousel key="categories" categories={categories} />
    ) : null,
    valueProps: home.showValueProps ? <ValuePropositionBar key="valueProps" /> : null,
    newArrivals: home.showNewArrivals ? (
      <IsolatedProductCarousel
        key="newArrivals"
        title={home.newArrivalsTitle || 'Nouveautés'}
        tag={home.newArrivalsTag || `Derniers Arrivages ${config.appName || 'Royal'}`}
        subtitle={home.newArrivalsSubtitle || `Les dernières références sélectionnées par ${config.appName || 'Royal'} pour votre intérieur.`}
        icon={<Sparkles className="w-4 h-4 text-[var(--royal-primary)]" />}
        products={resolvedNewProducts}
        displayMode={home.newArrivalsDisplayMode || 'carousel'}
        viewAllHref="/articles?sortBy=newest"
      />
    ) : null,
    featuredVideo: home.showFeaturedVideo ? (
      <VideoShowcaseSection key="featuredVideo" product={resolvedSpotlight} />
    ) : null,
    topRated: home.showTopRated ? (
      <IsolatedProductCarousel
        key="topRated"
        title={home.topRatedTitle || 'Mieux Notés'}
        tag={home.topRatedTag || 'Sélection Plébiscitée'}
        subtitle={home.topRatedSubtitle || 'Les équipements préférés de nos clients partout en Tunisie.'}
        icon={<Star className="w-4 h-4 text-[var(--royal-primary)] fill-current" />}
        products={resolvedTopRatedProducts}
        displayMode={home.topRatedDisplayMode || 'carousel'}
        viewAllHref="/articles?sortBy=popular"
      />
    ) : null,
    editorialBanner: home.showEditorialBanner ? (
      <EditorialPromoBanner key="editorialBanner" highlightProduct={resolvedHighlight} />
    ) : null,
    promotions: home.showPromotions ? (
      <IsolatedProductCarousel
        key="promotions"
        title={home.promotionsTitle || 'Promotions'}
        tag={home.promotionsTag || 'Meilleures Réductions TND'}
        subtitle={home.promotionsSubtitle || 'Profitez de remises immédiates et de prix promo sur nos appareils sélectionnés.'}
        icon={<Percent className="w-4 h-4 text-rose-600" />}
        products={resolvedPromoProducts}
        displayMode={home.promotionsDisplayMode || 'carousel'}
        viewAllHref="/articles?collection=promo&sortBy=promo"
      />
    ) : null,
    newsletter: home.showNewsletter ? <NewsletterSection key="newsletter" /> : null,
    lifestyle: home.showLifestyleGallery ? (
      <LifestyleGallery key="lifestyle" featuredProducts={resolvedGallery} />
    ) : null,
    testimonials: home.showTestimonials ? <TestimonialsCarousel key="testimonials" /> : null,
  };

  const order =
    Array.isArray(home.sectionOrder) && home.sectionOrder.length > 0
      ? home.sectionOrder
      : [
          'hero',
          'categories',
          'valueProps',
          'newArrivals',
          'featuredVideo',
          'topRated',
          'editorialBanner',
          'promotions',
          'newsletter',
          'lifestyle',
          'testimonials',
        ];

  return (
    <div className="flex flex-col min-h-screen">
      {order.map((secKey) => sectionRenderers[secKey] || null)}
      <BottomPromoFloatingCard />
    </div>
  );
}
