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
import { useI18nStore } from '@/stores/i18n.store';
import { fetchAllPaginated } from '@/lib/api';
import { Sparkles, Star, Percent } from 'lucide-react';
import {
  CmsCustomBlockRenderer,
  CmsElementWrapper,
  CmsViewCodeInjector,
} from '@/components/storefront/CmsElementRuntime';
import { buildCmsInlineStyle } from '@/lib/cms-builder';

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
  const { locale, t } = useI18nStore();
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
    fetchAllPaginated<StorefrontProduct>('/products/storefront', 200)
      .then(({ items: list }) => {
        if (!cancelled && Array.isArray(list)) setDynamicPool(list);
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

  const expandCategorySlugs = React.useCallback(
    (slugs?: string[]) => {
      if (!Array.isArray(slugs) || slugs.length === 0) return new Set<string>();
      const out = new Set<string>(slugs);
      const selectedIds = new Set(
        (categories || []).filter((c: any) => slugs.includes(c.slug)).map((c: any) => c.id),
      );
      let added = true;
      while (added) {
        added = false;
        for (const c of categories || []) {
          if (c?.parentId && selectedIds.has(c.parentId) && !selectedIds.has(c.id)) {
            selectedIds.add(c.id);
            if (c.slug) out.add(c.slug);
            added = true;
          }
        }
      }
      return out;
    },
    [categories],
  );

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
        const expanded = expandCategorySlugs(categorySlugs);
        const matched = combinedPool.filter((p) => p.category?.slug && expanded.has(p.category.slug));
        if (matched.length > 0) return matched.slice(0, limit);
      }
      return fallbackList.slice(0, limit);
    },
    [combinedPool, expandCategorySlugs],
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
        title={locale === 'ar' ? t('storefront.new_arrivals') : (home.newArrivalsTitle || t('storefront.new_arrivals'))}
        tag={locale === 'ar' ? t('storefront.new_arrivals_tag') : (home.newArrivalsTag || `${t('storefront.new_arrivals_tag')} ${config.appName || 'Royal'}`)}
        subtitle={locale === 'ar' ? t('storefront.new_arrivals_subtitle') : (home.newArrivalsSubtitle || t('storefront.new_arrivals_subtitle'))}
        icon={<Sparkles className="w-4 h-4 text-[var(--royal-primary)]" />}
        products={resolvedNewProducts}
        displayMode={home.newArrivalsDisplayMode || 'carousel'}
        columns={home.newArrivalsColumns || '4'}
        viewAllText={locale === 'fr' ? home.newArrivalsViewAllText : undefined}
        showViewAll={home.newArrivalsShowViewAll !== false}
        cardImageHeightPx={home.cardImageHeightPx}
        viewAllHref="/articles?sortBy=newest"
      />
    ) : null,
    featuredVideo: home.showFeaturedVideo ? (
      <VideoShowcaseSection key="featuredVideo" product={resolvedSpotlight} />
    ) : null,
    topRated: home.showTopRated ? (
      <IsolatedProductCarousel
        key="topRated"
        title={locale === 'ar' ? t('storefront.top_rated') : (home.topRatedTitle || t('storefront.top_rated'))}
        tag={locale === 'ar' ? t('storefront.top_rated_tag') : (home.topRatedTag || t('storefront.top_rated_tag'))}
        subtitle={locale === 'ar' ? t('storefront.top_rated_subtitle') : (home.topRatedSubtitle || t('storefront.top_rated_subtitle'))}
        icon={<Star className="w-4 h-4 text-[var(--royal-primary)] fill-current" />}
        products={resolvedTopRatedProducts}
        displayMode={home.topRatedDisplayMode || 'carousel'}
        columns={home.topRatedColumns || '4'}
        viewAllText={locale === 'fr' ? home.topRatedViewAllText : undefined}
        showViewAll={home.topRatedShowViewAll !== false}
        cardImageHeightPx={home.cardImageHeightPx}
        viewAllHref="/articles?sortBy=popular"
      />
    ) : null,
    editorialBanner: home.showEditorialBanner ? (
      <EditorialPromoBanner key="editorialBanner" highlightProduct={resolvedHighlight} />
    ) : null,
    promotions: home.showPromotions ? (
      <IsolatedProductCarousel
        key="promotions"
        title={locale === 'ar' ? t('storefront.promotions') : (home.promotionsTitle || t('storefront.promotions'))}
        tag={locale === 'ar' ? t('storefront.promotions_tag') : (home.promotionsTag || t('storefront.promotions_tag'))}
        subtitle={locale === 'ar' ? t('storefront.promotions_subtitle') : (home.promotionsSubtitle || t('storefront.promotions_subtitle'))}
        icon={<Percent className="w-4 h-4 text-rose-600" />}
        products={resolvedPromoProducts}
        displayMode={home.promotionsDisplayMode || 'carousel'}
        columns={home.promotionsColumns || '4'}
        viewAllText={locale === 'fr' ? home.promotionsViewAllText : undefined}
        showViewAll={home.promotionsShowViewAll !== false}
        cardImageHeightPx={home.cardImageHeightPx}
        viewAllHref="/articles?collection=promo&sortBy=promo"
      />
    ) : null,
    newsletter: home.showNewsletter ? <NewsletterSection key="newsletter" /> : null,
    lifestyle: home.showLifestyleGallery ? (
      <LifestyleGallery key="lifestyle" featuredProducts={resolvedGallery} />
    ) : null,
    testimonials: home.showTestimonials ? <TestimonialsCarousel key="testimonials" /> : null,
    bottomPromo: home.showBottomPromo !== false ? <BottomPromoFloatingCard key="bottomPromo" /> : null,
  };

  const baseOrder =
    Array.isArray(home.sectionOrder) && home.sectionOrder.length > 0
      ? [...home.sectionOrder]
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
          'bottomPromo',
        ];
  if (!baseOrder.includes('bottomPromo')) {
    baseOrder.push('bottomPromo');
  }

  const customBlocks = Array.isArray(home.customBlocks) ? home.customBlocks : [];
  for (const cb of customBlocks) {
    if (cb?.id && !baseOrder.includes(cb.id)) baseOrder.push(cb.id);
  }

  const viewDomId = home.viewStyle?.domId?.trim() || 'royal-view-home';

  return (
    <div id={viewDomId} style={buildCmsInlineStyle(home.viewStyle)} className="flex flex-col min-h-screen">
      <CmsViewCodeInjector viewKey="home" viewStyle={home.viewStyle} />
      {baseOrder.map((secKey) => {
        if (secKey.startsWith('custom-')) {
          const cb = customBlocks.find((b) => b.id === secKey);
          if (!cb) return null;
          return (
            <CmsCustomBlockRenderer
              key={cb.id}
              block={cb}
              viewKey="home"
              categories={categories}
              products={combinedPool}
            />
          );
        }
        const node = sectionRenderers[secKey];
        if (!node) return null;
        return (
          <CmsElementWrapper
            key={secKey}
            viewKey="home"
            elemId={secKey}
            styleCfg={home.elementStyles?.[secKey]}
          >
            {node}
          </CmsElementWrapper>
        );
      })}
    </div>
  );
}
