'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useCompareStore } from '@/stores/compare.store';
import { useI18nStore } from '@/stores/i18n.store';
import type {
  CmsCustomBlock,
  CmsCustomViewRecord,
  CmsElementStyleConfig,
  CmsNavLinkItem,
} from '@/lib/cms-builder';

export interface CmsThemeConfig {
  primaryHex: string;
  primaryHoverHex: string;
  primaryTextHex: string;
  inkHex: string;
  goldHex: string;
  goldDarkHex: string;
  goldLightHex: string;
  silverHex: string;
  silverLightHex: string;
  backgroundHex: string;
  cardHex: string;
  borderHex: string;
  headingFont: string;
  bodyFont: string;
  arabicFont: string;
}

export interface CmsIdentityConfig {
  appName: string;
  slogan: string;
  logoUrl: string;
  faviconUrl: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  showrooms: Array<{
    id: string;
    name: string;
    city: string;
    address: string;
    phone: string;
    hours?: string;
  }>;
}

export interface CmsHeaderConfig {
  announcementText: string;
  showSearch: boolean;
  showLanguageSwitch: boolean;
  showCompare: boolean;
  showWishlist: boolean;
  showTrackOrder: boolean;
  showCartButton?: boolean;
  showAccountButton?: boolean;
  transparentOnHome?: boolean;
  stickyMode?: 'auto' | 'always' | 'static';
  navLinks?: CmsNavLinkItem[];
  elementStyles?: Record<string, CmsElementStyleConfig>;
}

export interface CmsFooterLink {
  label: string;
  href: string;
}

export interface CmsFooterConfig {
  aboutDescription: string;
  col1Title: string;
  col1Links?: CmsFooterLink[];
  col2Title: string;
  col2Links?: CmsFooterLink[];
  col3Title: string;
  col3Links?: CmsFooterLink[];
  col4Title: string;
  copyrightText: string;
  showBrandHeader?: boolean;
  showNewsletter?: boolean;
  newsletterTitle?: string;
  showSocialLinks?: boolean;
  showAddress?: boolean;
  showPhone?: boolean;
  showWhatsapp?: boolean;
  showEmail?: boolean;
  elementStyles?: Record<string, CmsElementStyleConfig>;
}

export interface CmsTargetConfig {
  targetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES' | 'CUSTOM_URL';
  targetCategorySlugs?: string[];
  targetProductIds?: string[];
}

export interface CmsRecommendedBlock {
  id: string;
  title: string;
  subtitle?: string;
  visible?: boolean;
  displayMode?: 'grid' | 'carousel';
  columns?: '3' | '4';
  limit?: number;
  targetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES';
  targetCategorySlugs?: string[];
  targetProductIds?: string[];
}

export interface CmsHeroSlideConfig extends CmsTargetConfig {
  id: string;
  tagline?: string;
  title: string;
  highlightText?: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageUrl: string;
}

export interface CmsViewExtensibility {
  elementStyles?: Record<string, CmsElementStyleConfig>;
  customBlocks?: CmsCustomBlock[];
  viewStyle?: CmsElementStyleConfig;
}

export interface CmsViewsConfig {
  home: CmsViewExtensibility & {
    showHeroSlider: boolean;
    showBrandMarquee?: boolean;
    heroAutoplayMs: number;
    heroHeightPx?: number;
    heroAnimation?: 'slide' | 'fade' | 'zoom';
    heroContentAlign?: 'left' | 'center';
    cardImageHeightPx?: number;
    sectionOrder?: string[];
    categoriesTag?: string;
    categoriesTitle?: string;
    categoriesCardHeightPx?: number;
    categoriesTargetType?: 'AUTO' | 'CATEGORIES';
    categoriesTargetSlugs?: string[];
    valuePropsItems?: Array<{ title: string; subtitle: string }>;
    newArrivalsTag?: string;
    newArrivalsTitle?: string;
    newArrivalsSubtitle?: string;
    newArrivalsLimit?: number;
    newArrivalsDisplayMode?: 'carousel' | 'grid';
    newArrivalsColumns?: '3' | '4';
    newArrivalsViewAllText?: string;
    newArrivalsShowViewAll?: boolean;
    newArrivalsTargetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES';
    newArrivalsTargetCategorySlugs?: string[];
    newArrivalsTargetProductIds?: string[];
    featuredVideoTag?: string;
    featuredVideoTitleOverride?: string;
    featuredVideoSubtitleOverride?: string;
    featuredVideoBuyText?: string;
    featuredVideoDetailText?: string;
    featuredVideoLayout?: 'media-right' | 'media-left';
    featuredVideoHeightPx?: number;
    featuredVideoCustomImageUrl?: string;
    featuredVideoTargetType?: 'AUTO' | 'ARTICLES';
    featuredVideoTargetProductId?: string;
    featuredVideoTargetProductIds?: string[];
    topRatedTag?: string;
    topRatedTitle?: string;
    topRatedSubtitle?: string;
    topRatedLimit?: number;
    topRatedDisplayMode?: 'carousel' | 'grid';
    topRatedColumns?: '3' | '4';
    topRatedViewAllText?: string;
    topRatedShowViewAll?: boolean;
    topRatedTargetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES';
    topRatedTargetCategorySlugs?: string[];
    topRatedTargetProductIds?: string[];
    editorialTag?: string;
    editorialTitle?: string;
    editorialSubtitle?: string;
    editorialStatTitle?: string;
    editorialStatDesc?: string;
    editorialBadgeText?: string;
    editorialCtaText?: string;
    editorialLayout?: 'stat-left' | 'stat-right';
    editorialCards?: Array<{ title: string; desc: string }>;
    editorialCustomImageUrl?: string;
    editorialTargetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES';
    editorialTargetCategorySlugs?: string[];
    editorialTargetProductIds?: string[];
    promotionsTag?: string;
    promotionsTitle?: string;
    promotionsSubtitle?: string;
    promotionsLimit?: number;
    promotionsDisplayMode?: 'carousel' | 'grid';
    promotionsColumns?: '3' | '4';
    promotionsViewAllText?: string;
    promotionsShowViewAll?: boolean;
    promotionsTargetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES';
    promotionsTargetCategorySlugs?: string[];
    promotionsTargetProductIds?: string[];
    lifestyleTag?: string;
    lifestyleTitle?: string;
    lifestyleCtaText?: string;
    lifestyleCustomBannerUrl?: string;
    lifestyleTargetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES';
    lifestyleTargetCategorySlugs?: string[];
    lifestyleTargetProductIds?: string[];
    testimonialsTag?: string;
    testimonialsTitle?: string;
    testimonialsBadge?: string;
    testimonialsVerifiedText?: string;
    newsletterTag?: string;
    newsletterTitle?: string;
    newsletterSubtitle?: string;
    newsletterPlaceholder?: string;
    newsletterButtonText?: string;
    bottomPromoBadge?: string;
    bottomPromoTitle?: string;
    bottomPromoSubtitle?: string;
    bottomPromoCtaText?: string;
    bottomPromoCtaLink?: string;
    bottomPromoImageUrl?: string;
    bottomPromoHeightPx?: number;
    showCategoriesCarousel: boolean;
    showValueProps: boolean;
    showNewArrivals: boolean;
    showFeaturedVideo: boolean;
    showTopRated: boolean;
    showEditorialBanner: boolean;
    showPromotions: boolean;
    showLifestyleGallery: boolean;
    showTestimonials: boolean;
    showNewsletter: boolean;
    showBottomPromo?: boolean;
  };
  articles: CmsViewExtensibility & {
    sectionOrder?: string[];
    headerBadge?: string;
    headerTitle?: string;
    headerSubtitle?: string;
    headerImageUrl?: string;
    showHeaderBanner?: boolean;
    showFiltersSection?: boolean;
    filterPosition?: 'left' | 'right';
    showCategoryFilter?: boolean;
    showPriceFilter?: boolean;
    showBrandFilter?: boolean;
    showCharacteristicsFilter?: boolean;
    defaultColumns: string;
    defaultItemsPerPage: number;
    paginationMode?: 'PAGINATION' | 'LOAD_MORE';
    cardImageHeightPx?: number;
    showCompareButton: boolean;
    showWishlistButton: boolean;
    showQuickViewButton: boolean;
    showBuyButton: boolean;
    showLikeDislike: boolean;
    showSidebarFiltersByDefault: boolean;
    showPageSizeSelector?: boolean;
    targetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES';
    targetCategorySlugs?: string[];
    targetProductIds?: string[];
  };
  productDetail: CmsViewExtensibility & {
    sectionOrder?: string[];
    showBreadcrumb?: boolean;
    showDescription?: boolean;
    descriptionTabLabel?: string;
    showReviews: boolean;
    reviewsTabLabel?: string;
    showRatings: boolean;
    showSpecs: boolean;
    specsTabLabel?: string;
    showDeliveryTab?: boolean;
    deliveryTabLabel?: string;
    showRelatedProducts: boolean;
    relatedTitle?: string;
    relatedSubtitle?: string;
    relatedDisplayMode?: 'grid' | 'carousel';
    relatedColumns?: '3' | '4';
    relatedLimit?: number;
    relatedTargetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES';
    relatedTargetCategorySlugs?: string[];
    relatedTargetProductIds?: string[];
    extraRecommendedBlocks?: CmsRecommendedBlock[];
    showShareButton: boolean;
    showWishlist: boolean;
    showCompare: boolean;
    showLikeDislike: boolean;
    showTrustBadges?: boolean;
    trustBadges?: Array<{ title: string; subtitle: string }>;
    addToCartText?: string;
    enableImageZoom: boolean;
    enableImageAutoplay: boolean;
    galleryPosition?: 'left' | 'right';
    imageDisplayMode?: 'thumbnails-bottom' | 'thumbnails-left' | 'grid-2x2' | 'single';
    imageAnimation?: 'zoom-hover' | 'fade' | 'slide' | 'none';
    imageObjectFit?: 'cover' | 'contain';
    mediaColumnSpan: number;
    galleryHeightPx?: number;
    defaultTab?: 'desc' | 'specs' | 'reviews' | 'delivery';
  };
  contact: CmsViewExtensibility & {
    sectionOrder?: string[];
    badgeText?: string;
    title?: string;
    subtitle?: string;
    showMap: boolean;
    mapTitle?: string;
    mapHeightPx?: number;
    mapEmbedUrl?: string;
    showInfoCards: boolean;
    showSocials?: boolean;
    layoutDirection?: 'info-left' | 'form-left';
    infoTitle?: string;
    infoSubtitle?: string;
    formTitle?: string;
    formSubtitle?: string;
    submitText?: string;
    phoneRequired: boolean;
    emailRequired: boolean;
    subjectRequired: boolean;
  };
  faq: CmsViewExtensibility & {
    sectionOrder?: string[];
    badgeText?: string;
    title: string;
    subtitle: string;
    showSearch: boolean;
    showCategoryFilter?: boolean;
    showCta?: boolean;
    ctaTitle?: string;
    ctaSubtitle?: string;
    ctaButtonText?: string;
  };
  terms?: CmsViewExtensibility & {
    sectionOrder?: string[];
    showBackLink?: boolean;
    badgeText?: string;
    showFooterNote?: boolean;
    footerNoteText?: string;
  };
  privacy?: CmsViewExtensibility & {
    sectionOrder?: string[];
    showBackLink?: boolean;
    badgeText?: string;
    showFooterNote?: boolean;
    footerNoteText?: string;
  };
  showrooms: CmsViewExtensibility & {
    enabled?: boolean;
    sectionOrder?: string[];
    badgeText?: string;
    title?: string;
    subtitle?: string;
    layoutStyle: string;
    showMap: boolean;
    mapHeightPx?: number;
    mapEmbedUrl?: string;
    showHours: boolean;
    showPhone: boolean;
  };
  cart?: CmsViewExtensibility & {
    sectionOrder?: string[];
    showHeader?: boolean;
    badgeText?: string;
    title?: string;
    subtitle?: string;
    showCouponBox?: boolean;
    showFreeShippingProgress?: boolean;
    showGuarantees?: boolean;
    checkoutCtaText?: string;
  };
  checkout?: CmsViewExtensibility & {
    sectionOrder?: string[];
    badgeText?: string;
    title?: string;
    subtitle?: string;
    showFulfillmentToggle?: boolean;
    allowDelivery?: boolean;
    allowShowroomPickup?: boolean;
    showCouponBox?: boolean;
    showNotesStep?: boolean;
    submitButtonText?: string;
    showroomPayLabel?: string;
  };
  compare?: CmsViewExtensibility & {
    sectionOrder?: string[];
    badgeText?: string;
    title?: string;
    subtitle?: string;
    maxCompareItems?: number;
    showAddToCart?: boolean;
  };
  wishlist?: CmsViewExtensibility & {
    sectionOrder?: string[];
    badgeText?: string;
    title?: string;
    subtitle?: string;
    defaultColumns?: string;
    cardImageHeightPx?: number;
  };
  trackOrder?: CmsViewExtensibility & {
    sectionOrder?: string[];
    badgeText?: string;
    title?: string;
    subtitle?: string;
    showNineStepTimeline?: boolean;
  };
}

export interface CmsTestimonialItem {
  id: string;
  name: string;
  city: string;
  dateLabel?: string;
  avatar?: string;
  stars: number;
  comment: string;
  isActive?: boolean;
}

export interface CmsConfig {
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  vatStandard?: number;
  maintenance?: {
    enabled: boolean;
    message: string;
  };
  identity: CmsIdentityConfig;
  theme: CmsThemeConfig;
  header: CmsHeaderConfig;
  footer: CmsFooterConfig;
  views: CmsViewsConfig;
  customViews?: CmsCustomViewRecord[];
  globalCustomCode?: { customCss?: string; customJs?: string };
  heroSlides?: CmsHeroSlideConfig[];
  testimonials: CmsTestimonialItem[];
  contact: Record<string, string>;
}

const DEFAULT_CONFIG: CmsConfig = {
  appName: 'Royal',
  logoUrl: '/images/royal-logo.jpg',
  faviconUrl: '/icon.png',
  freeShippingThreshold: 150,
  standardShippingFee: 7,
  vatStandard: 19,
  maintenance: {
    enabled: false,
    message: 'Notre boutique est momentanément en maintenance technique. Merci de votre patience.',
  },
  identity: {
    appName: 'Royal',
    slogan: 'Electro de Maison • Équipement Culinaire & Électroménager Tunisie',
    logoUrl: '/images/royal-logo.jpg',
    faviconUrl: '/icon.png',
    email: 'royaltn24@gmail.com',
    phone: '48 091 914',
    whatsapp: '48091914',
    address: 'Mahdia 5100, Tunisia',
    instagram: 'https://www.instagram.com/royal_electr',
    facebook: 'https://www.facebook.com/people/Royaltn/61584896805901',
    tiktok: 'https://www.tiktok.com/@electrome1',
    showrooms: [],
  },
  theme: {
    primaryHex: '#C59B27',
    primaryHoverHex: '#A67C1E',
    primaryTextHex: '#FFFFFF',
    inkHex: '#1D232E',
    goldHex: '#C59B27',
    goldDarkHex: '#9A7414',
    goldLightHex: '#FBF6E8',
    silverHex: '#CBD5E1',
    silverLightHex: '#F4F5F7',
    backgroundHex: '#FDFCF9',
    cardHex: '#FFFFFF',
    borderHex: '#E6E1D6',
    headingFont: 'Poppins',
    bodyFont: 'Poppins',
    arabicFont: 'Cairo',
  },
  header: {
    announcementText: 'Livraison 24–48h partout en Tunisie',
    showSearch: true,
    showLanguageSwitch: true,
    showCompare: true,
    showWishlist: true,
    showTrackOrder: true,
    showCartButton: true,
    showAccountButton: true,
    transparentOnHome: true,
    stickyMode: 'auto',
    navLinks: [
      { id: 'nav-home', label: 'Accueil', href: '/', i18nKey: 'nav.home', visible: true, highlight: false },
      { id: 'nav-articles', label: 'Articles', href: '/articles', i18nKey: 'nav.articles', visible: true, highlight: false },
      { id: 'nav-rays', label: 'Rayons', href: '#rays', type: 'RAYONS_DROPDOWN', i18nKey: 'nav.rays', visible: true, highlight: false },
      { id: 'nav-promos', label: 'Promotions', href: '/articles?sortBy=promo', i18nKey: 'nav.promos', visible: true, highlight: true },
    ],
    elementStyles: {},
  },
  footer: {
    aboutDescription:
      'Boutique spécialisée en petit et gros électroménager de qualité, arts de la table et équipements culinaires modernes en Tunisie.',
    col1Title: 'À Propos',
    col1Links: [
      { label: 'Accueil Royal', href: '/' },
      { label: 'Tous nos Articles', href: '/articles' },
      { label: 'Promotions & Soldes', href: '/articles?sortBy=promo' },
    ],
    col2Title: 'Rayons & Articles',
    col2Links: [],
    col3Title: 'Informations & Aide',
    col3Links: [
      { label: 'Contactez-nous', href: '/contact' },
      { label: 'Foire Aux Questions (FAQ)', href: '/faq' },
      { label: 'Conditions Générales de Vente', href: '/terms' },
      { label: 'Politique de Confidentialité', href: '/privacy' },
      { label: 'Suivi de Commande', href: '/track-order' },
    ],
    col4Title: 'Contact & Coordonnées',
    copyrightText: 'Royal — Électro de Maison (Mahdia, Tunisie). Tous droits réservés.',
    showBrandHeader: true,
    showNewsletter: true,
    newsletterTitle: 'Restez Informé de nos Offres & Nouveautés',
    showSocialLinks: true,
    showAddress: true,
    showPhone: true,
    showWhatsapp: true,
    showEmail: true,
    elementStyles: {},
  },
  customViews: [],
  globalCustomCode: { customCss: '', customJs: '' },
  views: {
    home: {
      showHeroSlider: true,
      showBrandMarquee: true,
      heroAutoplayMs: 6000,
      heroHeightPx: 720,
      cardImageHeightPx: 280,
      sectionOrder: [
        'hero',
        'categories',
        'valueProps',
        'newArrivals',
        'editorialBanner',
        'topRated',
        'lifestyle',
        'promotions',
        'featuredVideo',
        'testimonials',
        'newsletter',
        'bottomPromo',
      ],
      showCategoriesCarousel: true,
      showValueProps: true,
      showNewArrivals: true,
      showFeaturedVideo: true,
      showTopRated: true,
      showEditorialBanner: true,
      showPromotions: true,
      showLifestyleGallery: true,
      showTestimonials: true,
      showNewsletter: true,
      showBottomPromo: true,
      elementStyles: {},
      customBlocks: [],
      viewStyle: {},
    },
    articles: {
      sectionOrder: ['header', 'filters', 'grid', 'actions', 'pagination'],
      showHeaderBanner: true,
      showFiltersSection: true,
      filterPosition: 'left',
      showCategoryFilter: true,
      showPriceFilter: true,
      showBrandFilter: true,
      showCharacteristicsFilter: true,
      defaultColumns: '3',
      defaultItemsPerPage: 12,
      paginationMode: 'PAGINATION',
      showCompareButton: true,
      showWishlistButton: true,
      showQuickViewButton: true,
      showBuyButton: true,
      showLikeDislike: true,
      showSidebarFiltersByDefault: true,
      showPageSizeSelector: true,
      targetType: 'AUTO',
      targetCategorySlugs: [],
      targetProductIds: [],
    },
    productDetail: {
      sectionOrder: ['breadcrumb', 'gallery', 'purchaseInfo', 'trustBadges', 'tabs', 'related'],
      showBreadcrumb: true,
      showDescription: true,
      descriptionTabLabel: 'Description Détaillée',
      showReviews: true,
      reviewsTabLabel: 'Avis & Commentaires',
      showRatings: true,
      showSpecs: true,
      specsTabLabel: 'Fiche Technique',
      showDeliveryTab: false,
      deliveryTabLabel: 'Livraison & Garantie',
      showRelatedProducts: true,
      relatedTitle: 'Vous aimerez aussi',
      relatedSubtitle: 'Complétez votre équipement Royal avec notre sélection sur-mesure.',
      relatedDisplayMode: 'grid',
      relatedColumns: '4',
      relatedLimit: 4,
      relatedTargetType: 'AUTO',
      relatedTargetCategorySlugs: [],
      relatedTargetProductIds: [],
      extraRecommendedBlocks: [],
      showShareButton: true,
      showWishlist: true,
      showCompare: true,
      showLikeDislike: true,
      showTrustBadges: true,
      enableImageZoom: true,
      enableImageAutoplay: true,
      galleryPosition: 'left',
      imageDisplayMode: 'thumbnails-bottom',
      imageAnimation: 'zoom-hover',
      imageObjectFit: 'cover',
      mediaColumnSpan: 7,
      defaultTab: 'desc',
    },
    contact: {
      sectionOrder: ['hero', 'mainGrid', 'map'],
      showMap: true,
      showInfoCards: true,
      showSocials: true,
      layoutDirection: 'info-left',
      phoneRequired: true,
      emailRequired: false,
      subjectRequired: true,
    },
    faq: {
      sectionOrder: ['hero', 'categories', 'questions', 'cta'],
      title: 'Foire Aux Questions',
      subtitle: 'Réponses sur la livraison, garantie et nos appareils.',
      showSearch: true,
      showCategoryFilter: true,
      showCta: true,
    },
    terms: {
      sectionOrder: ['header', 'document', 'footerNote'],
      showBackLink: true,
      badgeText: 'Informations Légales Royal',
      showFooterNote: true,
      footerNoteText: 'Document mis à jour conformément à la réglementation tunisienne du commerce électronique.',
    },
    privacy: {
      sectionOrder: ['header', 'document', 'footerNote'],
      showBackLink: true,
      badgeText: 'Protection des Données',
      showFooterNote: true,
      footerNoteText: 'Pour toute demande relative à vos données personnelles, contactez notre support à royaltn24@gmail.com.',
    },
    showrooms: {
      enabled: false,
      sectionOrder: ['hero', 'cards', 'map'],
      layoutStyle: 'grid',
      showMap: true,
      showHours: true,
      showPhone: true,
    },
    cart: {
      sectionOrder: ['header', 'itemsList', 'guarantees', 'summary'],
      showHeader: true,
      badgeText: 'Mon Panier',
      title: 'Votre Sélection Royal',
      subtitle: 'Vérifiez vos articles, appliquez un code promo ou profitez de la livraison gratuite.',
      showCouponBox: true,
      showFreeShippingProgress: true,
      showGuarantees: true,
      elementStyles: {},
      customBlocks: [],
      viewStyle: {},
    },
    checkout: {
      sectionOrder: ['header', 'contactStep', 'fulfillmentStep', 'shippingStep', 'paymentStep', 'notesStep', 'summary'],
      badgeText: 'Commande Sécurisée',
      title: 'Finaliser Votre Commande',
      subtitle: 'Livraison rapide 24h–48h partout en Tunisie ou Retrait en Showroom Royal.',
      showFulfillmentToggle: true,
      allowDelivery: true,
      allowShowroomPickup: true,
      showCouponBox: true,
      showNotesStep: true,
      showroomPayLabel: 'Payer sur place (au showroom)',
      elementStyles: {},
      customBlocks: [],
      viewStyle: {},
    },
    compare: {
      sectionOrder: ['header', 'comparisonTable'],
      badgeText: 'Comparateur Technique',
      title: 'Comparer les Équipements',
      subtitle: 'Analysez côte à côte prix, garanties et caractéristiques techniques jusqu’à 4 articles.',
      maxCompareItems: 4,
      showAddToCart: true,
      elementStyles: {},
      customBlocks: [],
      viewStyle: {},
    },
    wishlist: {
      sectionOrder: ['header', 'productsGrid'],
      badgeText: 'Liste d’Envies',
      title: 'Vos Articles Favoris',
      subtitle: 'Retrouvez vos équipements enregistrés et ajoutez-les au panier en un clic.',
      defaultColumns: '4',
      cardImageHeightPx: 260,
      elementStyles: {},
      customBlocks: [],
      viewStyle: {},
    },
    trackOrder: {
      sectionOrder: ['header', 'searchForm', 'timelineResult'],
      badgeText: 'Suivi Temps Réel',
      title: 'Suivre Votre Commande',
      subtitle: 'Saisissez votre référence CMD-... pour consulter l’état logistique de votre commande.',
      showNineStepTimeline: true,
      elementStyles: {},
      customBlocks: [],
      viewStyle: {},
    },
  },
  testimonials: [],
  contact: {},
};

function hexToHslComponents(hex?: string): string | null {
  if (!hex || typeof hex !== 'string') return null;
  const cleaned = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const CmsConfigContext = createContext<{ config: CmsConfig; refresh: () => Promise<void> }>({
  config: DEFAULT_CONFIG,
  refresh: async () => {},
});

function applyDynamicCssTokens(cfg: CmsConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const t = cfg.theme;
  const primary = t.primaryHex || '#C59B27';
  const primaryHover = t.primaryHoverHex || '#A67C1E';
  const primaryText = t.primaryTextHex || '#FFFFFF';
  const ink = t.inkHex || '#1D232E';
  const gold = t.goldHex || primary;
  const goldDark = t.goldDarkHex || '#9A7414';
  const goldLight = t.goldLightHex || '#FBF6E8';
  const silver = t.silverHex || '#CBD5E1';
  const silverLight = t.silverLightHex || '#F4F5F7';
  const bg = t.backgroundHex || '#FDFCF9';
  const card = t.cardHex || '#FFFFFF';
  const border = t.borderHex || '#E6E1D6';

  root.style.setProperty('--royal-primary', primary);
  root.style.setProperty('--royal-primary-hover', primaryHover);
  root.style.setProperty('--royal-primary-text', primaryText);
  root.style.setProperty('--royal-ink', ink);
  root.style.setProperty('--royal-gold', gold);
  root.style.setProperty('--royal-gold-dark', goldDark);
  root.style.setProperty('--royal-gold-light', goldLight);
  root.style.setProperty('--royal-silver', silver);
  root.style.setProperty('--royal-silver-light', silverLight);
  root.style.setProperty('--royal-bg', bg);
  root.style.setProperty('--royal-card', card);
  root.style.setProperty('--royal-border', border);

  const bgHsl = hexToHslComponents(bg);
  const fgHsl = hexToHslComponents(ink);
  const cardHsl = hexToHslComponents(card);
  const borderHsl = hexToHslComponents(border);
  const accentHsl = hexToHslComponents(goldLight);
  const accentFgHsl = hexToHslComponents(goldDark);
  const ringHsl = hexToHslComponents(primary);
  const silverLightHsl = hexToHslComponents(silverLight);
  if (bgHsl) root.style.setProperty('--background', bgHsl);
  if (fgHsl) {
    root.style.setProperty('--foreground', fgHsl);
    root.style.setProperty('--card-foreground', fgHsl);
  }
  if (cardHsl) root.style.setProperty('--card', cardHsl);
  if (borderHsl) {
    root.style.setProperty('--border', borderHsl);
    root.style.setProperty('--input', borderHsl);
  }
  if (accentHsl) root.style.setProperty('--accent', accentHsl);
  if (accentFgHsl) root.style.setProperty('--accent-foreground', accentFgHsl);
  if (ringHsl) {
    root.style.setProperty('--ring', ringHsl);
    root.style.setProperty('--gold', ringHsl);
  }
  if (silverLightHsl) root.style.setProperty('--silver-light', silverLightHsl);

  if (t.bodyFont) {
    root.style.setProperty(
      '--font-sans',
      `'${t.bodyFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
    );
  }
  if (t.headingFont) {
    root.style.setProperty(
      '--font-heading',
      `'${t.headingFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
    );
  }
  if (t.arabicFont) {
    root.style.setProperty('--font-arabic', `'${t.arabicFont}', 'Cairo', sans-serif`);
  }

  document.body.style.backgroundColor = bg;
  document.body.style.color = ink;

  // Load selected Google Fonts dynamically
  const fontFamilies = Array.from(new Set([t.headingFont, t.bodyFont, t.arabicFont].filter(Boolean))).map(
    (f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800;900`
  );
  if (fontFamilies.length > 0) {
    let fontLink = document.getElementById('royal-dynamic-google-fonts') as HTMLLinkElement | null;
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'royal-dynamic-google-fonts';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    const nextHref = `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=swap`;
    if (fontLink.href !== nextHref) fontLink.href = nextHref;
  }

  // Sync hardcoded luxury hex utility classes cleanly to dynamic theme tokens
  let styleTag = document.getElementById('royal-dynamic-theme-overrides') as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'royal-dynamic-theme-overrides';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `
    .bg-\\[\\#FDFCF9\\], .bg-\\[\\#FBF9F4\\] { background-color: var(--royal-bg) !important; }
    .bg-\\[\\#FBF6E8\\] { background-color: var(--royal-gold-light) !important; }
    .bg-\\[\\#F4F5F7\\], .bg-\\[\\#F8F9FA\\] { background-color: var(--royal-silver-light) !important; }
    .text-\\[\\#1D232E\\] { color: var(--royal-ink) !important; }
    .text-\\[\\#C59B27\\], .text-\\[\\#B8860B\\] { color: var(--royal-gold) !important; }
    .text-\\[\\#9A7414\\] { color: var(--royal-gold-dark) !important; }
    .border-\\[\\#E6E1D6\\], .border-\\[\\#E6D6A6\\] { border-color: var(--royal-border) !important; }
    .bg-\\[\\#C59B27\\] { background-color: var(--royal-primary) !important; }
    .from-\\[\\#C59B27\\] { --tw-gradient-from: var(--royal-primary) var(--tw-gradient-from-position) !important; --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
    .to-\\[\\#A67C1E\\] { --tw-gradient-to: var(--royal-primary-hover) var(--tw-gradient-to-position) !important; }
  `;

  if (cfg.faviconUrl) {
    const iconLinks = document.querySelectorAll("link[rel~='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']");
    iconLinks.forEach((lnk) => {
      (lnk as HTMLLinkElement).href = cfg.faviconUrl;
    });
  }

  if (
    typeof window !== 'undefined' &&
    cfg.appName &&
    !window.location.pathname.startsWith('/dashboard') &&
    !(window as any).__royalPixelsConfig?.seoTitle?.trim()
  ) {
    const activeLocale = useI18nStore.getState().locale;
    document.title =
      activeLocale === 'ar'
        ? `${cfg.appName} — أرقى الأجهزة الكهرومنزلية | المتجر الإلكتروني تونس`
        : `${cfg.appName} — Electro de Maison | E-Commerce & Électroménager Tunisie`;
  }
}

export function CmsConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<CmsConfig>(DEFAULT_CONFIG);
  const { locale } = useI18nStore();

  useEffect(() => {
    const appName = config?.identity?.appName || config?.appName;
    if (
      typeof window !== 'undefined' &&
      appName &&
      !window.location.pathname.startsWith('/dashboard') &&
      !(window as any).__royalPixelsConfig?.seoTitle?.trim()
    ) {
      document.title =
        locale === 'ar'
          ? `${appName} — أرقى الأجهزة الكهرومنزلية | المتجر الإلكتروني تونس`
          : `${appName} — Electro de Maison | E-Commerce & Électroménager Tunisie`;
    }
  }, [locale, config?.identity?.appName, config?.appName]);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/storefront-cms/config');
      if (res.ok) {
        const json = await res.json();
        const data = json?.data || json;
        if (data && data.theme) {
          const merged: CmsConfig = {
            ...DEFAULT_CONFIG,
            ...data,
            identity: { ...DEFAULT_CONFIG.identity, ...(data.identity || {}) },
            theme: { ...DEFAULT_CONFIG.theme, ...(data.theme || {}) },
            header: { ...DEFAULT_CONFIG.header, ...(data.header || {}) },
            footer: { ...DEFAULT_CONFIG.footer, ...(data.footer || {}) },
            views: {
              home: { ...DEFAULT_CONFIG.views.home, ...(data.views?.home || {}) },
              articles: { ...DEFAULT_CONFIG.views.articles, ...(data.views?.articles || {}) },
              productDetail: { ...DEFAULT_CONFIG.views.productDetail, ...(data.views?.productDetail || {}) },
              contact: { ...DEFAULT_CONFIG.views.contact, ...(data.views?.contact || {}) },
              faq: { ...DEFAULT_CONFIG.views.faq, ...(data.views?.faq || {}) },
              terms: { ...DEFAULT_CONFIG.views.terms, ...(data.views?.terms || {}) },
              privacy: { ...DEFAULT_CONFIG.views.privacy, ...(data.views?.privacy || {}) },
              showrooms: { ...DEFAULT_CONFIG.views.showrooms, ...(data.views?.showrooms || {}) },
              cart: { ...DEFAULT_CONFIG.views.cart, ...(data.views?.cart || {}) },
              checkout: { ...DEFAULT_CONFIG.views.checkout, ...(data.views?.checkout || {}) },
              compare: { ...DEFAULT_CONFIG.views.compare, ...(data.views?.compare || {}) },
              wishlist: { ...DEFAULT_CONFIG.views.wishlist, ...(data.views?.wishlist || {}) },
              trackOrder: { ...DEFAULT_CONFIG.views.trackOrder, ...(data.views?.trackOrder || {}) },
            },
            customViews: Array.isArray(data.customViews) ? data.customViews : [],
            globalCustomCode: {
              customCss: data.globalCustomCode?.customCss || '',
              customJs: data.globalCustomCode?.customJs || '',
            },
          };
          setConfig(merged);
          applyDynamicCssTokens(merged);
          if (data.translations && typeof data.translations === 'object') {
            useI18nStore.getState().mergeTranslations(data.translations);
          }
        }
      }
    } catch {
      applyDynamicCssTokens(DEFAULT_CONFIG);
    }
  }, []);

  useEffect(() => {
    useWishlistStore.getState().hydrate();
    useCompareStore.getState().hydrate();
    useI18nStore.getState().hydrate();
    loadConfig();
    const handler = () => loadConfig();
    if (typeof window !== 'undefined') {
      window.addEventListener('royal-cms-updated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('royal-cms-updated', handler);
      }
    };
  }, [loadConfig]);

  return (
    <CmsConfigContext.Provider value={{ config, refresh: loadConfig }}>
      {children}
    </CmsConfigContext.Provider>
  );
}

export function useCmsConfig() {
  return useContext(CmsConfigContext);
}
