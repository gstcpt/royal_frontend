'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCompareStore } from '@/stores/compare.store';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useReactionStore } from '@/stores/reaction.store';
import { getSafeImageUrl, getCartHeaders } from '@/lib/cart-session';
import { formatCurrency, formatPriceAdjustment } from '@/lib/utils';
import { fetchAllPaginated } from '@/lib/api';
import { ProductMediaViewer } from '@/components/storefront/ProductMediaViewer';
import { ProductCard, StorefrontProduct } from '@/components/storefront/ProductCard';
import { QuickOrderModal } from '@/components/storefront/QuickOrderModal';
import { ShareProductModal } from '@/components/storefront/ShareProductModal';
import { trackMarketingEvent } from '@/components/storefront/MarketingPixelsTracker';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';
import {
  Star,
  ShieldCheck,
  Truck,
  Banknote,
  Layers,
  Heart,
  ShoppingCart,
  Check,
  ChevronRight,
  Share2,
  CheckCircle2,
  ArrowRight,
  Plus,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from 'lucide-react';

interface ProductVariantData {
  id: string;
  sku: string;
  name: string;
  priceAdjustment?: number | null;
  sellingPrice?: number | null;
  attributes?: Record<string, any>;
  attributesJson?: Record<string, any>;
  imageUrl?: string | null;
}

interface ProductDetailData {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  basePrice?: number;
  sellingPrice: number;
  discountPrice?: number | null;
  discountPercentage?: number | null;
  weightGrams?: number | null;
  dimensions?: any;
  dimensionsJson?: Record<string, any> | null;
  category?: { id?: string; name: string; slug: string };
  brand?: { id?: string; name: string; slug: string; logoUrl?: string };
  images: Array<{ id: string; url: string; alt?: string; isPrimary: boolean }>;
  variants: ProductVariantData[];
  stockStatus?: string;
  availableStock?: number;
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  favoriteCount?: number;
}

const CHAR_LABELS: Record<string, string> = {
  puissance: 'Puissance Électrique',
  capacite: 'Capacité / Volume',
  couleur: 'Couleur Principale',
  garantie: 'Garantie Constructeur',
  alimentation: 'Alimentation & Tension',
  materiau: 'Matériau & Revêtement',
  vitesses: 'Vitesses & Niveaux',
  temperature: 'Plage de Température',
  fonctions: 'Fonctions & Programmes',
  securite: 'Sécurité & Protection',
  affichage: 'Affichage & Commandes',
  accessoires: 'Accessoires Inclus',
  entretien: 'Entretien & Nettoyage',
  dimensions: 'Dimensions / Diamètre',
  poids: 'Poids',
  cordon: "Cordon d'Alimentation",
  moteur: 'Motorisation',
  batterie: 'Batterie & Autonomie',
  pression: 'Pression',
  niveau_sonore: 'Niveau Sonore',
  lames: 'Lames & Coupe',
  usage: 'Usage Recommandé',
  type_appareil: "Type d'Appareil",
  modele: 'Référence Modèle',
};

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const detailCfg = config.views.productDetail;

  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews' | 'delivery'>(detailCfg.defaultTab || 'desc');
  const [candidateRecommended, setCandidateRecommended] = useState<StorefrontProduct[]>([]);

  useEffect(() => {
    if (detailCfg.defaultTab) setActiveTab(detailCfg.defaultTab);
  }, [detailCfg.defaultTab]);

  useEffect(() => {
    const allowed: Array<'desc' | 'specs' | 'reviews' | 'delivery'> = [];
    if (detailCfg.showDescription !== false) allowed.push('desc');
    if (detailCfg.showSpecs !== false) allowed.push('specs');
    if (detailCfg.showReviews !== false) allowed.push('reviews');
    if (detailCfg.showDeliveryTab) allowed.push('delivery');
    if (allowed.length > 0 && !allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  }, [detailCfg.showDescription, detailCfg.showSpecs, detailCfg.showReviews, detailCfg.showDeliveryTab, activeTab]);

  useEffect(() => {
    if (!product?.id) return;
    if (detailCfg.showRelatedProducts === false && (!detailCfg.extraRecommendedBlocks || detailCfg.extraRecommendedBlocks.length === 0)) {
      return;
    }
    let cancelled = false;
    fetchAllPaginated<StorefrontProduct>('/products/storefront', 200)
      .then(({ items: list }) => {
        if (!cancelled && Array.isArray(list)) setCandidateRecommended(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [product?.id, detailCfg.showRelatedProducts, detailCfg.extraRecommendedBlocks]);
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    totalReviews: number;
    myReview?: { id: string; rating: number; body: string } | null;
    reviews: Array<{
      id: string;
      rating: number;
      title?: string | null;
      body: string;
      authorName: string;
      isVerifiedPurchase?: boolean;
      createdAt: string;
    }>;
  }>({ averageRating: 0, totalReviews: 0, myReview: null, reviews: [] });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { addToCompare, isInCompare, removeFromCompare } = useCompareStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const {
    reactions,
    loaded: reactionsLoaded,
    fetchMyReactions,
    getCounts,
    toggleReaction,
    authPromptProductId,
  } = useReactionStore();

  useEffect(() => {
    if (!reactionsLoaded && typeof window !== 'undefined' && localStorage.getItem('royal_token')) {
      fetchMyReactions();
    }
  }, [reactionsLoaded, fetchMyReactions]);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/products/slug/${slug}`);
        if (res.ok) {
          const resJson = await res.json();
          const data: ProductDetailData = resJson?.data || resJson;
          setProduct(data);
          trackMarketingEvent('ViewContent', {
            value: Number(data.discountPrice || data.sellingPrice || 0),
            content_name: data.name,
            content_ids: [data.id],
          });
          const primaryImg = getSafeImageUrl(
            data.images?.find((img) => img.isPrimary)?.url || data.images?.[0]?.url
          );
          setSelectedImage(primaryImg);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariantId(data.variants[0].id);
          }
          fetch(`/api/v1/storefront-cms/reviews/${data.id}`, { headers: getCartHeaders() })
            .then((r) => (r.ok ? r.json() : null))
            .then((rv) => {
              const payload = rv?.data || rv;
              if (payload && Array.isArray(payload.reviews)) {
                setReviewsData(payload);
                if (payload.myReview) {
                  setReviewRating(Number(payload.myReview.rating) || 5);
                  setReviewComment(payload.myReview.body || '');
                }
              }
            })
            .catch(() => null);
        }
      } catch (err) {
        console.error('Error fetching article detail', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  const selectedVariant = useMemo(() => {
    if (!product || !product.variants) return null;
    return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0] || null;
  }, [product, selectedVariantId]);

  const { activePrice, hasPromo, originalPrice } = useMemo(() => {
    if (!product) return { activePrice: 0, hasPromo: false, originalPrice: 0 };

    const baseSelling = Number(product.sellingPrice || 0);
    const discount = product.discountPrice ? Number(product.discountPrice) : null;
    const isPromo = discount !== null && discount > 0 && discount < baseSelling;
    const effectiveBase = isPromo ? discount : baseSelling;

    let computedPrice = effectiveBase;
    if (selectedVariant?.sellingPrice && Number(selectedVariant.sellingPrice) > 0) {
      computedPrice = Number(selectedVariant.sellingPrice);
    }

    return {
      activePrice: computedPrice,
      hasPromo: isPromo,
      originalPrice: baseSelling,
    };
  }, [product, selectedVariant]);

  if (loading) {
    return (
      <div className="py-24 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
          <div className="lg:col-span-7 h-[540px] rounded-3xl bg-neutral-100" />
          <div className="lg:col-span-5 space-y-6">
            <div className="h-6 w-32 bg-neutral-100 rounded-full" />
            <div className="h-10 w-3/4 bg-neutral-100 rounded-xl" />
            <div className="h-8 w-40 bg-neutral-100 rounded-xl" />
            <div className="h-28 w-full bg-neutral-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 max-w-2xl mx-auto text-center px-4">
        <h1 className="font-heading text-3xl font-black text-neutral-900">
          Article introuvable
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          Cette référence n’est plus disponible ou a été déplacée dans notre catalogue.
        </p>
        <Link
          href="/articles"
          className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs uppercase tracking-wider font-bold hover:bg-[var(--royal-primary-hover)] transition"
        >
          <span>Retour au catalogue</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  const myReaction = reactions[product.id] || null;
  const reactionCounts = getCounts(product.id, product.likeCount || 0, product.dislikeCount || 0);

  const handleAddToCart = async () => {
    await addToCart({
      productId: product.id,
      ...(selectedVariant?.id ? { variantId: selectedVariant.id } : {}),
      quantity,
      name: selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name,
      price: activePrice,
      sku: selectedVariant?.sku || product.sku,
      productName: product.name,
      image: selectedImage,
    });
    trackMarketingEvent('AddToCart', {
      value: activePrice * quantity,
      content_name: product.name,
      content_ids: [product.id],
    });
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 3800);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const nextAction = inWishlist ? 'REMOVE' : 'ADD';
    if (inWishlist) removeFromWishlist(product.id);
    else {
      addToWishlist({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: activePrice,
        image: selectedImage,
        category: product.category?.name,
        sku: product.sku,
        inStock: true,
      });
      trackMarketingEvent('AddToWishlist', {
        value: activePrice,
        content_name: product.name,
        content_ids: [product.id],
      });
    }
    if (typeof window !== 'undefined' && localStorage.getItem('royal_token')) {
      fetch('/api/v1/storefront-cms/wishlist/toggle', {
        method: 'POST',
        headers: getCartHeaders(true),
        credentials: 'include',
        keepalive: true,
        body: JSON.stringify({ productId: product.id, variantId: selectedVariant?.id, action: nextAction }),
      }).catch(() => null);
    }
  };

  const handleToggleCompare = () => {
    if (inCompare) removeFromCompare(product.id);
    else {
      addToCompare({
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        sellingPrice: product.sellingPrice,
        discountPrice: product.discountPrice,
        primaryImage: selectedImage,
        category: product.category,
        brand: product.brand,
        specs: product.dimensionsJson || {},
      });
    }
  };

  const warrantyText =
    product.dimensionsJson?.garantie
      ? `Garantie constructeur : ${product.dimensionsJson.garantie}`
      : 'Garantie constructeur officielle selon fiche article';

  const displayedRating =
    reviewsData.totalReviews > 0
      ? Number(reviewsData.averageRating || 0)
      : Number(product.rating || 0);
  const roundedDisplayedRating = Math.round(displayedRating);

  const detailOrder =
    Array.isArray(detailCfg.sectionOrder) && detailCfg.sectionOrder.length > 0
      ? detailCfg.sectionOrder
      : ['breadcrumb', 'gallery', 'purchaseInfo', 'trustBadges', 'tabs', 'related'];
  const getDetailOrderIdx = (key: string, fallback: number) => {
    const idx = detailOrder.indexOf(key);
    return idx >= 0 ? idx : fallback;
  };
  const breadcrumbOrder = getDetailOrderIdx('breadcrumb', 0);
  const galleryOrder = getDetailOrderIdx('gallery', 1);
  const purchaseOrder = getDetailOrderIdx('purchaseInfo', 2);
  const trustOrder = getDetailOrderIdx('trustBadges', 3);
  const tabsOrder = getDetailOrderIdx('tabs', 4);
  const relatedOrder = getDetailOrderIdx('related', 5);
  const splitGridOrder = Math.min(galleryOrder, purchaseOrder);
  const keepTrustInline = trustOrder === purchaseOrder + 1;
  const galleryOnRight = galleryOrder > purchaseOrder || detailCfg.galleryPosition === 'right';

  const trustBadgeItems = [
    {
      Icon: Truck,
      title: locale === 'ar' ? t('product.badge_delivery_title') : (detailCfg.trustBadges?.[0]?.title || t('product.badge_delivery_title')),
      subtitle: locale === 'ar' ? t('product.badge_delivery_sub') : (detailCfg.trustBadges?.[0]?.subtitle || t('product.badge_delivery_sub')),
    },
    {
      Icon: ShieldCheck,
      title: locale === 'ar' ? t('product.badge_warranty_title') : (detailCfg.trustBadges?.[1]?.title || t('product.badge_warranty_title')),
      subtitle: locale === 'ar' ? t('product.badge_warranty_sub') : (product.dimensionsJson?.garantie || detailCfg.trustBadges?.[1]?.subtitle || t('product.badge_warranty_sub')),
    },
    {
      Icon: Banknote,
      title: locale === 'ar' ? t('product.badge_payment_title') : (detailCfg.trustBadges?.[2]?.title || t('product.badge_payment_title')),
      subtitle: locale === 'ar' ? t('product.badge_payment_sub') : (detailCfg.trustBadges?.[2]?.subtitle || t('product.badge_payment_sub')),
    },
  ];

  const renderTrustBadges = (standalone = false) =>
    detailCfg.showTrustBadges !== false ? (
      <div
        style={standalone ? { order: trustOrder } : undefined}
        className={`${standalone ? 'mt-8 ' : ''}pt-6 border-t border-[var(--royal-border)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs text-neutral-600`}
      >
        {trustBadgeItems.map(({ Icon, title, subtitle }, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-[var(--royal-silver-light)] flex flex-col items-center gap-1.5 border border-[var(--royal-border)]"
          >
            <Icon className="w-5 h-5 text-[var(--royal-primary)]" />
            <span className="font-bold text-[var(--royal-ink)]">{title}</span>
            <span className="text-[10px] text-neutral-500">{subtitle}</span>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <div className="bg-[var(--royal-bg)] min-h-screen py-8 md:py-12">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 flex flex-col">
        {/* Breadcrumb */}
        {detailCfg.showBreadcrumb !== false && (
          <nav
            style={{ order: breadcrumbOrder }}
            className="flex items-center gap-2 text-xs text-neutral-400 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap"
          >
            <Link href="/" className="hover:text-neutral-900 transition">{t('nav.home')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
            <Link href="/articles" className="hover:text-neutral-900 transition">{t('nav.articles')}</Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
                <Link
                  href={`/articles?category=${product.category.slug}`}
                  className="hover:text-neutral-900 transition"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
            <span className="font-semibold text-neutral-900 truncate max-w-xs">{product.name}</span>
          </nav>
        )}

        <div
          style={{ order: splitGridOrder }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start"
        >
          {/* Interactive Gallery (Left or Right via CMS) */}
          <div
            className={`w-full ${galleryOnRight ? 'lg:order-2' : 'lg:order-1'} ${
              detailCfg.mediaColumnSpan === 8
                ? 'lg:col-span-7 xl:col-span-8'
                : detailCfg.mediaColumnSpan === 5
                ? 'lg:col-span-5'
                : detailCfg.mediaColumnSpan === 6
                ? 'lg:col-span-6'
                : 'lg:col-span-6 xl:col-span-7'
            }`}
          >
            <div className="w-full">
              <ProductMediaViewer
                images={(product.images || []).map((im) => im.url)}
                alt={product.name}
                heightClassName="h-[340px] sm:h-[500px] lg:h-[580px]"
                desktopHeightPx={detailCfg.galleryHeightPx}
                roundedClassName="rounded-[24px] sm:rounded-[32px]"
                enableZoomOnHover={detailCfg.enableImageZoom}
                defaultAutoPlay={detailCfg.enableImageAutoplay}
                displayMode={detailCfg.imageDisplayMode || 'thumbnails-bottom'}
                animationMode={detailCfg.imageAnimation || (detailCfg.enableImageZoom ? 'zoom-hover' : 'none')}
                objectFit={detailCfg.imageObjectFit || 'cover'}
                badgeOverlay={
                  hasPromo ? (
                    <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 px-3.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-md">
                      {t('product.promo_badge')}
                    </div>
                  ) : null
                }
              />
            </div>
          </div>

          {/* Purchase Panel */}
          <div
            className={`space-y-6 ${galleryOnRight ? 'lg:order-1' : 'lg:order-2'} ${
              detailCfg.mediaColumnSpan === 8
                ? 'lg:col-span-5 xl:col-span-4'
                : detailCfg.mediaColumnSpan === 5
                ? 'lg:col-span-7'
                : detailCfg.mediaColumnSpan === 6
                ? 'lg:col-span-6'
                : 'lg:col-span-6 xl:col-span-5'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-widest font-bold text-[var(--royal-gold-dark)]">
                  {product.brand?.name || 'Royal Official'}
                </span>
                <span className="font-mono text-xs text-neutral-400">SKU: {product.sku}</span>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl xl:text-4xl font-black text-[var(--royal-ink)] tracking-tight leading-tight">
                {product.name}
              </h1>

              {detailCfg.showRatings !== false && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-0.5 text-[var(--royal-primary)]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < roundedDisplayedRating ? 'fill-current' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-neutral-900 ml-1">
                    {displayedRating > 0 ? displayedRating.toFixed(1) : '0.0'}
                  </span>
                  {reviewsData.totalReviews > 0 && (
                    <span className="text-xs text-neutral-400">({reviewsData.totalReviews})</span>
                  )}
                </div>
              )}
            </div>

            <div className="py-5 border-y border-neutral-100 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-heading font-black text-neutral-950 tracking-tight">
                    {formatCurrency(activePrice, 'TND')}
                  </span>
                  {hasPromo && (
                    <span className="text-base text-neutral-400 line-through">
                      {formatCurrency(originalPrice, 'TND')}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-400 block mt-1">
                  {t('product.ttc_cod_note')}
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t('product.in_stock')}
              </span>
            </div>

            {product.shortDescription && (
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                {product.shortDescription}
              </p>
            )}

            <div className="space-y-2.5 py-1 text-xs text-neutral-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('product.delivery_bullet')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{warrantyText}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('product.cod_bullet')}</span>
              </div>
            </div>

            {/* Color Dots & Variant Selector (Same clean interactive style as Coup de Cœur!) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-900 block">
                  Variante & Coloris : <span className="text-amber-700">{selectedVariant?.name}</span>
                </label>

                <div className="flex flex-wrap items-center gap-2.5">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariantId === v.id;
                    const colorHex = v.attributesJson?.colorHex;
                    const colorLabel = v.attributesJson?.couleur || v.attributesJson?.color;
                    const effectiveBase =
                      hasPromo && product.discountPrice
                        ? Number(product.discountPrice)
                        : Number(product.sellingPrice);
                    let adjustment = 0;
                    if (v.sellingPrice && Number(v.sellingPrice) > 0) {
                      adjustment = Number(v.sellingPrice) - effectiveBase;
                    }

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border text-left text-xs transition cursor-pointer ${
                          isSelected
                            ? 'border-[var(--royal-primary)] bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-md'
                            : 'border-[var(--royal-border)] bg-white text-[var(--royal-ink)] hover:border-[var(--royal-primary)]'
                        }`}
                      >
                        {colorHex && (
                          <span
                            className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                            style={{ backgroundColor: colorHex }}
                            title={colorLabel || v.name}
                          />
                        )}
                        <div>
                          <div className="font-bold leading-tight">{v.name}</div>
                          <div className="text-[10px] opacity-75 font-mono">
                            {formatPriceAdjustment(adjustment, 'TND')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Action Row */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 bg-[#F4F5F7] border border-neutral-200 rounded-full px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 text-neutral-700 hover:text-neutral-950 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-black">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 text-neutral-700 hover:text-neutral-950 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  title={locale === 'ar' ? t('product.add_to_cart') : (detailCfg.addToCartText || t('product.add_to_cart'))}
                  aria-label={locale === 'ar' ? t('product.add_to_cart') : (detailCfg.addToCartText || t('product.add_to_cart'))}
                  className="h-12 w-12 rounded-full bg-white hover:bg-[var(--royal-gold-light)] border-2 border-[var(--royal-primary)] text-[var(--royal-primary)] shadow-sm flex items-center justify-center shrink-0 transition cursor-pointer"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuickOrderOpen(true)}
                  className="flex-1 min-w-[180px] py-3.5 px-6 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs uppercase tracking-widest font-bold shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{t('actions.buy')}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {detailCfg.showLikeDislike !== false && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleReaction(product.id, 'LIKE', product.likeCount || 0, product.dislikeCount || 0)}
                      className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        myReaction === 'LIKE'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${myReaction === 'LIKE' ? 'fill-current' : ''}`} />
                      <span>{t('actions.like')} ({reactionCounts.likeCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleReaction(product.id, 'DISLIKE', product.likeCount || 0, product.dislikeCount || 0)}
                      className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        myReaction === 'DISLIKE'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${myReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
                      <span>({reactionCounts.dislikeCount})</span>
                    </button>
                  </>
                )}
                {detailCfg.showWishlist !== false && (
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      inWishlist
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current' : ''}`} />
                    <span>{t('actions.favorite')}</span>
                  </button>
                )}
                {detailCfg.showCompare !== false && (
                  <button
                    type="button"
                    onClick={handleToggleCompare}
                    className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      inCompare
                        ? 'bg-[var(--royal-primary)] border-[var(--royal-primary)] text-[var(--royal-primary-text)]'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t('actions.compare')}</span>
                  </button>
                )}
                {detailCfg.showShareButton !== false && (
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="col-span-2 sm:col-span-1 py-2.5 rounded-xl border bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t('actions.share')}</span>
                  </button>
                )}
              </div>
              {authPromptProductId === product.id && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                  <span>{t('product.login_prompt')}</span>
                  <Link href="/login" className="font-bold underline shrink-0">
                    {t('product.login_cta')}
                  </Link>
                </div>
              )}
            </div>

            {addedToCartToast && (
              <div className="p-4 rounded-2xl bg-[var(--royal-gold-light)] text-[var(--royal-ink)] border border-[var(--royal-primary)]/40 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
                <Check className="w-4 h-4 text-[var(--royal-gold-dark)] shrink-0" />
                <span>{quantity} {t('product.added_banner')}</span>
                <Link href="/cart" className="ml-auto underline text-[var(--royal-gold-dark)] hover:text-[var(--royal-primary)] font-bold">
                  {t('product.view_cart')}
                </Link>
              </div>
            )}

            {keepTrustInline && renderTrustBadges(false)}
          </div>
        </div>

        {!keepTrustInline && renderTrustBadges(true)}

        {/* Detailed Tabs: 1. Description -> 2. Fiche Technique -> 3. Avis & Commentaires -> 4. Livraison & Garantie */}
        {(detailCfg.showDescription !== false ||
          detailCfg.showSpecs !== false ||
          detailCfg.showReviews !== false ||
          detailCfg.showDeliveryTab) && (
        <div style={{ order: tabsOrder }} className="mt-16 pt-10 border-t border-[var(--royal-border)]">
          <div className="flex flex-wrap gap-4 sm:gap-8 border-b border-neutral-200 pb-3">
            {detailCfg.showDescription !== false && (
              <button
                type="button"
                onClick={() => setActiveTab('desc')}
                className={`text-xs uppercase tracking-wider font-bold pb-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'desc'
                    ? 'border-[var(--royal-primary)] text-[var(--royal-ink)]'
                    : 'border-transparent text-neutral-400 hover:text-[var(--royal-ink)]'
                }`}
              >
                {locale === 'ar' ? t('product.tab_desc') : (detailCfg.descriptionTabLabel || t('product.tab_desc'))}
              </button>
            )}
            {detailCfg.showSpecs !== false && (
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`text-xs uppercase tracking-wider font-bold pb-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'specs'
                    ? 'border-[var(--royal-primary)] text-[var(--royal-ink)]'
                    : 'border-transparent text-neutral-400 hover:text-[var(--royal-ink)]'
                }`}
              >
                {locale === 'ar' ? t('product.tab_specs') : (detailCfg.specsTabLabel || t('product.tab_specs'))}
              </button>
            )}
            {detailCfg.showReviews !== false && (
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`text-xs uppercase tracking-wider font-bold pb-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'border-[var(--royal-primary)] text-[var(--royal-ink)]'
                    : 'border-transparent text-neutral-400 hover:text-[var(--royal-ink)]'
                }`}
              >
                {locale === 'ar' ? t('product.tab_reviews') : (detailCfg.reviewsTabLabel || t('product.tab_reviews'))} ({reviewsData.totalReviews})
              </button>
            )}
            {detailCfg.showDeliveryTab && (
              <button
                type="button"
                onClick={() => setActiveTab('delivery')}
                className={`text-xs uppercase tracking-wider font-bold pb-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'delivery'
                    ? 'border-[var(--royal-primary)] text-[var(--royal-ink)]'
                    : 'border-transparent text-neutral-400 hover:text-[var(--royal-ink)]'
                }`}
              >
                {locale === 'ar' ? t('product.tab_delivery') : (detailCfg.deliveryTabLabel || t('product.tab_delivery'))}
              </button>
            )}
          </div>

          <div className="py-8 text-xs sm:text-sm text-neutral-700 leading-relaxed max-w-4xl">
            {activeTab === 'desc' && (
              <div className="space-y-4">
                <p className="whitespace-pre-line">
                  {product.description || product.shortDescription || 'Aucune description détaillée renseignée pour cet article.'}
                </p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200">
                  <span className="text-neutral-400 block mb-1">Marque :</span>
                  <span className="font-bold text-neutral-900">{product.brand?.name || 'Officiel'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200">
                  <span className="text-neutral-400 block mb-1">Référence SKU :</span>
                  <span className="font-mono font-bold text-neutral-900">{product.sku}</span>
                </div>
                {product.dimensionsJson &&
                  Object.entries(product.dimensionsJson)
                    .filter(([k, v]) => !['stockQuantity', 'lowStockThreshold', 'allowBackorders'].includes(k) && v !== null && v !== undefined && String(v).trim() !== '')
                    .map(([k, v]) => (
                      <div key={k} className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200">
                        <span className="text-neutral-400 block mb-1">{CHAR_LABELS[k] || k} :</span>
                        <span className="font-semibold text-neutral-900">{String(v)}</span>
                      </div>
                    ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#F8F9FA] border border-neutral-200">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Note Globale Client
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-3xl font-black text-neutral-950 font-mono">
                        {reviewsData.averageRating > 0 ? reviewsData.averageRating.toFixed(1) : '—'}
                      </span>
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(reviewsData.averageRating || 0) ? 'fill-current' : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-neutral-500">
                        ({reviewsData.totalReviews} avis vérifié{reviewsData.totalReviews > 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add / Edit Review Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!reviewComment.trim()) return;
                    setReviewSubmitting(true);
                    setReviewNotice(null);
                    try {
                      const res = await fetch(`/api/v1/storefront-cms/reviews/${product.id}`, {
                        method: 'POST',
                        headers: getCartHeaders(true),
                        body: JSON.stringify({
                          rating: reviewRating,
                          ...(!user ? { authorName: reviewAuthor.trim() || 'Client Royal' } : {}),
                          body: reviewComment.trim(),
                        }),
                      });
                      if (res.ok) {
                        const resJson = await res.json();
                        const wasEdit = Boolean(resJson?.data?.isEdit);
                        setReviewNotice(
                          wasEdit
                            ? 'Votre avis existant a bien été mis à jour !'
                            : 'Merci ! Votre avis a été publié et transmis à l’équipe Royal.'
                        );
                        const freshRes = await fetch(`/api/v1/storefront-cms/reviews/${product.id}`, {
                          headers: getCartHeaders(),
                        });
                        if (freshRes.ok) {
                          const freshJson = await freshRes.json();
                          const payload = freshJson?.data || freshJson;
                          if (payload) {
                            setReviewsData(payload);
                            if (payload.myReview) {
                              setReviewRating(Number(payload.myReview.rating) || 5);
                              setReviewComment(payload.myReview.body || '');
                            }
                          }
                        }
                      } else {
                        setReviewNotice("Impossible d'enregistrer votre avis pour le moment.");
                      }
                    } catch {
                      setReviewNotice('Erreur réseau.');
                    } finally {
                      setReviewSubmitting(false);
                    }
                  }}
                  className="p-5 rounded-2xl bg-white border border-neutral-200 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-neutral-900">
                      {reviewsData.myReview ? 'Modifier mon avis & ma note' : 'Laisser un avis & note'}
                    </h4>
                    {user && (
                      <span className="text-[11px] font-semibold text-neutral-500 bg-[#F8F9FA] px-3 py-1 rounded-full border border-neutral-200">
                        Connecté en tant que <strong className="text-neutral-900">{user.firstName} {user.lastName}</strong>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xs font-semibold text-neutral-600">Votre note :</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewRating(s)}
                          className="p-0.5 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              s <= reviewRating ? 'text-amber-500 fill-current' : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {!user && (
                      <input
                        type="text"
                        value={reviewAuthor}
                        onChange={(e) => setReviewAuthor(e.target.value)}
                        placeholder="Votre nom (ex: Amine)"
                        className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs bg-[#F8F9FA]"
                      />
                    )}
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Partagez votre expérience avec cet appareil..."
                    className="w-full p-3 rounded-xl border border-neutral-200 bg-[#F8F9FA] text-xs focus:outline-none focus:border-neutral-900"
                  />
                  <div className="flex items-center justify-between gap-3">
                    {reviewNotice ? (
                      <span className="text-xs font-semibold text-emerald-700">{reviewNotice}</span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="px-5 py-2 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] hover:bg-[var(--royal-primary-hover)] text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      {reviewSubmitting
                        ? 'Envoi...'
                        : reviewsData.myReview
                        ? 'Mettre à jour mon avis'
                        : 'Publier mon avis'}
                    </button>
                  </div>
                </form>

                {/* Reviews List */}
                {reviewsData.reviews.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">
                    Aucun commentaire pour le moment. Soyez le premier à donner votre avis sur cet article.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reviewsData.reviews.map((rv) => (
                      <div key={rv.id} className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-neutral-900">{rv.authorName}</span>
                            {rv.isVerifiedPurchase && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                Achat vérifié
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400">
                            {new Date(rv.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= rv.rating ? 'fill-current' : 'text-neutral-300'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-neutral-700">{rv.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-1.5">
                  <div className="font-bold text-[#1D232E] flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#C59B27]" />
                    <span>{detailCfg.trustBadges?.[0]?.title || 'Expédition Express 24–48h'}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Livraison sécurisée sur les 24 gouvernorats de Tunisie avec vérification à la réception.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-1.5">
                  <div className="font-bold text-[#1D232E] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                    <span>{detailCfg.trustBadges?.[1]?.title || 'Garantie Constructeur'}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {product.dimensionsJson?.garantie
                      ? `Couverture officielle : ${product.dimensionsJson.garantie} avec SAV dédié Royal.`
                      : 'Garantie officielle constructeur avec service après-vente Royal.'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-1.5">
                  <div className="font-bold text-[#1D232E] flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#C59B27]" />
                    <span>{detailCfg.trustBadges?.[2]?.title || 'Paiement à la Livraison'}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Réglez en toute sérénité en espèces à la livraison ou directement en showroom Royal.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Recommended / Similar Products Section(s) */}
        {(() => {
          const resolveItems = (
            targetType?: string,
            categorySlugs?: string[],
            productIds?: string[],
            limit = 4,
          ): StorefrontProduct[] => {
            const pool = candidateRecommended.filter((p) => p.id !== product.id);
            if (targetType === 'ARTICLES' && Array.isArray(productIds) && productIds.length > 0) {
              const explicit = productIds
                .map((id) => pool.find((p) => p.id === id))
                .filter(Boolean) as StorefrontProduct[];
              if (explicit.length > 0) return explicit.slice(0, limit);
            }
            if (targetType === 'CATEGORIES' && Array.isArray(categorySlugs) && categorySlugs.length > 0) {
              const catItems = pool.filter((p) => p.category?.slug && categorySlugs.includes(p.category.slug));
              if (catItems.length > 0) return catItems.slice(0, limit);
            }
            const sameCat = pool.filter((p) => p.category?.slug && p.category.slug === product.category?.slug);
            return (sameCat.length > 0 ? sameCat : pool).slice(0, limit);
          };

          const blocksToRender: Array<{
            id: string;
            title: string;
            subtitle?: string;
            displayMode: 'grid' | 'carousel';
            columns: '3' | '4';
            items: StorefrontProduct[];
          }> = [];

          if (detailCfg.showRelatedProducts !== false) {
            const primaryItems = resolveItems(
              detailCfg.relatedTargetType,
              detailCfg.relatedTargetCategorySlugs,
              detailCfg.relatedTargetProductIds,
              detailCfg.relatedLimit || 4,
            );
            if (primaryItems.length > 0) {
              blocksToRender.push({
                id: 'primary-related',
                title: detailCfg.relatedTitle || 'Vous aimerez aussi',
                subtitle: detailCfg.relatedSubtitle,
                displayMode: detailCfg.relatedDisplayMode || 'grid',
                columns: detailCfg.relatedColumns || '4',
                items: primaryItems,
              });
            }
          }

          if (Array.isArray(detailCfg.extraRecommendedBlocks)) {
            for (const blk of detailCfg.extraRecommendedBlocks) {
              if (blk.visible === false) continue;
              const items = resolveItems(blk.targetType, blk.targetCategorySlugs, blk.targetProductIds, blk.limit || 4);
              if (items.length > 0) {
                blocksToRender.push({
                  id: blk.id,
                  title: blk.title || 'Sélection Recommandée',
                  subtitle: blk.subtitle,
                  displayMode: blk.displayMode || 'grid',
                  columns: blk.columns || '4',
                  items,
                });
              }
            }
          }

          if (blocksToRender.length === 0) return null;

          return (
            <div style={{ order: relatedOrder }}>
              {blocksToRender.map((block) => (
                <section key={block.id} className="mt-16 pt-12 border-t border-[var(--royal-border)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--royal-ink)] tracking-tight">
                        {block.title}
                      </h2>
                      {block.subtitle && (
                        <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">{block.subtitle}</p>
                      )}
                    </div>
                    <Link
                      href="/articles"
                      className="text-xs font-bold text-[#9A7414] hover:text-[#1D232E] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Tout le catalogue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {block.displayMode === 'carousel' ? (
                    <div className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory">
                      {block.items.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-[265px] sm:w-[295px] snap-start">
                          <ProductCard
                            product={item}
                            imageHeightPx={config.views.articles.cardImageHeightPx}
                            cardContext="articles"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 ${
                        block.columns === '3' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
                      } gap-5`}
                    >
                      {block.items.map((item) => (
                        <ProductCard
                          key={item.id}
                          product={item}
                          imageHeightPx={config.views.articles.cardImageHeightPx}
                          cardContext="articles"
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          );
        })()}
      </div>
      {product && (
        <>
          <QuickOrderModal
            isOpen={isQuickOrderOpen}
            onClose={() => setIsQuickOrderOpen(false)}
            product={{
              id: product.id,
              sku: product.sku,
              name: product.name,
              slug: product.slug,
              shortDescription: product.shortDescription,
              description: product.description,
              sellingPrice: Number(product.sellingPrice),
              discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
              discountPercentage: product.discountPercentage,
              primaryImage:
                product.images?.find((im) => im.isPrimary)?.url || product.images?.[0]?.url || '',
              images: product.images?.map((im) => im.url) || [],
              category: product.category ? { name: product.category.name, slug: product.category.slug } : null,
              brand: product.brand ? { name: product.brand.name, slug: product.brand.slug } : null,
              variants: (product.variants || []).map((v) => ({
                id: v.id,
                sku: v.sku,
                name: v.name,
                sellingPrice: v.sellingPrice ? Number(v.sellingPrice) : undefined,
                attributesJson: v.attributesJson || v.attributes || null,
              })),
            }}
            initialVariantId={selectedVariantId}
            initialQuantity={quantity}
          />
          <ShareProductModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            product={{
              id: product.id,
              sku: product.sku,
              name: product.name,
              slug: product.slug,
              sellingPrice: Number(product.sellingPrice),
              discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
              primaryImage:
                product.images?.find((im) => im.isPrimary)?.url || product.images?.[0]?.url || '',
              brand: product.brand ? { name: product.brand.name } : null,
            }}
          />
        </>
      )}
    </div>
  );
}
