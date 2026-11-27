'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  ShoppingBag,
  Star,
  Check,
  ArrowUpRight,
  Eye,
  Layers,
  X,
  Plus,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Share2,
  Copy,
} from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useCartStore } from '@/stores/cart.store';
import { useCompareStore } from '@/stores/compare.store';
import { useReactionStore } from '@/stores/reaction.store';
import { useReviewStore } from '@/stores/review.store';
import { getSafeImageUrl, getCartHeaders } from '@/lib/cart-session';
import { formatTndCurrency } from '@/lib/utils';
import { ProductMediaViewer } from './ProductMediaViewer';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';
import { Modal } from '@/components/ui';
import { trackMarketingEvent } from './MarketingPixelsTracker';
import { QuickOrderModal } from './QuickOrderModal';
import { ShareProductModal } from './ShareProductModal';
import { ProductReviewModal } from './ProductReviewModal';

export interface StorefrontVariant {
  id: string;
  sku: string;
  name: string;
  sellingPrice?: number;
  attributesJson?: Record<string, any> | null;
}

export interface StorefrontProduct {
  id: string;
  sku: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  shortDescription?: string | null;
  shortDescAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  sellingPrice: number;
  discountPrice?: number | null;
  discountPercent?: number | null;
  discountPercentage?: number | null;
  primaryImage: string;
  images?: string[];
  category?: { name: string; nameAr?: string | null; slug?: string } | null;
  brand?: { name: string; slug?: string } | null;
  variants?: StorefrontVariant[];
  dimensionsJson?: Record<string, any> | null;
  reviewsCount?: number;
  reviewCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  favoriteCount?: number;
  rating?: number;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  viewCount?: number;
  salesCount?: number;
  stockStatus?: string;
  availableStock?: number;
}

export interface ProductCardProps {
  product: StorefrontProduct;
  priority?: boolean;
  layout?: 'grid' | 'list';
  imageHeightPx?: number;
  cardContext?: 'home' | 'articles';
}

export function ProductCard({
  product,
  layout = 'grid',
  imageHeightPx,
  cardContext = 'articles',
}: ProductCardProps) {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const displayProductName = locale === 'ar' && product.nameAr ? product.nameAr : product.name;
  const displayShortDesc = locale === 'ar' && product.shortDescAr ? product.shortDescAr : product.shortDescription;
  const displayCategoryName =
    locale === 'ar' && product.category?.nameAr ? product.category.nameAr : product.category?.name;
  const articleFlags = config.views.articles;
  const resolvedImageHeightPx = Math.min(
    460,
    Math.max(
      180,
      Number(
        imageHeightPx ??
          (cardContext === 'home' ? config.views.home.cardImageHeightPx : articleFlags.cardImageHeightPx) ??
          288,
      ) || 288,
    ),
  );
  const roundedRating = Math.min(5, Math.max(0, Math.round(Number(product.rating || 0))));
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<string>(getSafeImageUrl(product.primaryImage));
  const [addedBanner, setAddedBanner] = useState(false);
  const [compareNotice, setCompareNotice] = useState<string | null>(null);

  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const { addItem: addToCart, isInCart } = useCartStore();
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const {
    reactions,
    loaded: reactionsLoaded,
    fetchMyReactions,
    getCounts,
    toggleReaction,
    authPromptProductId,
  } = useReactionStore();
  const {
    reviews: myReviews,
    stats: reviewStats,
    loaded: reviewsLoaded,
    fetchMyReviews,
  } = useReviewStore();

  useEffect(() => {
    if (!reactionsLoaded && typeof window !== 'undefined' && localStorage.getItem('royal_token')) {
      fetchMyReactions();
    }
  }, [reactionsLoaded, fetchMyReactions]);

  useEffect(() => {
    if (!reviewsLoaded && typeof window !== 'undefined') {
      fetchMyReviews();
    }
  }, [reviewsLoaded, fetchMyReviews]);

  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const myReview = myReviews[product.id] || null;
  const displayReviewCount =
    reviewStats[product.id]?.reviewCount ?? product.reviewCount ?? product.reviewsCount ?? 0;
  const myReaction = reactions[product.id] || null;
  const reactionCounts = getCounts(product.id, product.likeCount || 0, product.dislikeCount || 0);
  const inCompare = isInCompare(product.id);
  const hasPromo =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    Number(product.discountPrice) > 0 &&
    Number(product.discountPrice) < Number(product.sellingPrice);
  const currentPrice = hasPromo ? Number(product.discountPrice) : Number(product.sellingPrice);
  const discountPct =
    product.discountPercentage ||
    product.discountPercent ||
    (hasPromo
      ? Math.round(((Number(product.sellingPrice) - Number(product.discountPrice)) / Number(product.sellingPrice)) * 100)
      : null);

  const selectedVariant =
    product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.[0];

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextAction = inWishlist ? 'REMOVE' : 'ADD';
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: currentPrice,
        image: product.primaryImage,
        category: product.category?.name,
        sku: product.sku,
        inStock: true,
      });
      trackMarketingEvent('AddToWishlist', {
        value: currentPrice,
        content_name: product.name,
        content_ids: [product.id],
      });
    }
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('royal_token')) {
        fetch('/api/v1/storefront-cms/wishlist/toggle', {
          method: 'POST',
          headers: getCartHeaders(true),
          credentials: 'include',
          keepalive: true,
          body: JSON.stringify({
            productId: product.id,
            variantId: selectedVariant?.id,
            action: nextAction,
          }),
        }).catch(() => null);
      }
      window.dispatchEvent(new Event('royal-wishlist-updated'));
    }
  };

  const handleReaction = async (e: React.MouseEvent, rx: 'LIKE' | 'DISLIKE') => {
    e.preventDefault();
    e.stopPropagation();
    await toggleReaction(product.id, rx, product.likeCount || 0, product.dislikeCount || 0);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
      setCompareNotice('Retiré du comparateur');
    } else {
      const ok = addToCompare({
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        sellingPrice: Number(product.sellingPrice),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
        primaryImage: getSafeImageUrl(product.primaryImage),
        category: product.category ? { name: product.category.name } : undefined,
        brand: product.brand ? { name: product.brand.name } : undefined,
        specs: product.dimensionsJson || {},
      });
      setCompareNotice(ok ? 'Ajouté au comparateur' : 'Comparateur plein (4 max)');
    }
    setTimeout(() => setCompareNotice(null), 2200);
  };

  const handleCopySku = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.sku) return;
    try {
      await navigator.clipboard.writeText(product.sku);
    } catch {
      if (typeof document !== 'undefined') {
        const el = document.createElement('textarea');
        el.value = product.sku;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    }
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2200);
  };

  const handleConfirmAddToCart = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsBuyModalOpen(false);
    setIsQuickViewOpen(false);
    setAddedBanner(true);
    setTimeout(() => setAddedBanner(false), 3800);
    addToCart({
      productId: product.id,
      ...(selectedVariant?.id ? { variantId: selectedVariant.id } : {}),
      quantity,
      name: product.name,
      price: selectedVariant?.sellingPrice || currentPrice,
      sku: selectedVariant?.sku || product.sku,
      productName: product.name,
    });
    trackMarketingEvent('AddToCart', {
      value: (selectedVariant?.sellingPrice || currentPrice) * quantity,
      content_name: product.name,
      content_ids: [product.id],
    });
  };

  const handleIconAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variants && product.variants.length > 1) {
      setIsBuyModalOpen(true);
      return;
    }
    await handleConfirmAddToCart(e);
  };

  const gallery =
    product.images && product.images.length > 0
      ? product.images.map((im) => getSafeImageUrl(im))
      : [getSafeImageUrl(product.primaryImage)];

  const renderModals = () => (
    <>
      {/* Added to Cart Toast Notification */}
      {addedBanner && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 end-6 z-[9999] bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] px-5 py-3.5 rounded-2xl shadow-2xl border border-[var(--royal-primary)]/40 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-4"
        >
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </span>
          <div className="max-w-[220px]">
            <p className="font-bold text-[var(--royal-ink)] line-clamp-1">{t('actions.added_to_cart_qty')} ({quantity})</p>
            <p className="text-[11px] text-slate-600 line-clamp-1">{displayProductName}</p>
          </div>
          <Link
            href="/cart"
            className="ms-2 px-3 py-1.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold hover:bg-[var(--royal-primary-hover)] transition shrink-0"
          >
            {t('actions.view_cart_short')}
          </Link>
        </div>
      )}

      {/* SKU Copied Toast Notification */}
      {copiedSku && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 start-6 z-[9999] bg-[var(--royal-card)] text-[var(--royal-ink)] px-4 py-2.5 rounded-xl shadow-xl border border-[var(--royal-primary)] flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3"
        >
          <Check className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
          <span>{t('product.copied')} <span className="font-mono text-[var(--royal-primary)]">{product.sku}</span></span>
        </div>
      )}

      {/* Share Article Modal */}
      <ShareProductModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        product={product}
      />

      {/* Rate & Review Modal */}
      <ProductReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        product={{
          id: product.id,
          name: displayProductName,
          sku: product.sku,
          brandName: product.brand?.name,
          rating: product.rating,
          reviewCount: displayReviewCount,
        }}
      />

      {/* Compare Feedback Toast */}
      {compareNotice && (
        <div className="fixed bottom-6 start-6 z-[9999] bg-white text-neutral-900 px-4 py-2.5 rounded-xl shadow-xl border border-neutral-200 flex items-center gap-2 text-xs font-bold">
          <Layers className="w-4 h-4 text-amber-500" />
          <span>{compareNotice}</span>
        </div>
      )}

      {/* Login Required Prompt for Like/Dislike */}
      {authPromptProductId === product.id && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 start-6 end-6 sm:end-auto max-w-sm z-[9999] bg-white text-neutral-900 px-4 py-3 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 text-xs"
        >
          <ThumbsUp className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">{t('storefront.login_to_react')}</span>
          <Link
            href="/login"
            className="px-3 py-1 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold hover:bg-[var(--royal-primary-hover)] transition shrink-0"
          >
            {t('nav.login')}
          </Link>
        </div>
      )}

      {/* Confirm Quantity & Variant Purchase Modal (Centralized) */}
      <Modal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        title={product.name}
        subtitle={`${product.brand?.name || 'Royal'} • SKU ${product.sku}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(false)}
              className="px-4 py-2.5 rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold cursor-pointer"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirmAddToCart}
              className="flex-1 sm:flex-initial py-2.5 px-5 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('actions.confirm_add_to_cart')}</span>
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F8F9FA] border border-neutral-200">
            <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 overflow-hidden shrink-0">
              <img
                src={getSafeImageUrl(product.primaryImage)}
                alt={displayProductName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                {product.brand?.name || 'Royal'} • {product.sku}
              </span>
              <h4 className="font-heading font-bold text-sm text-neutral-950 line-clamp-2">
                {displayProductName}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-sm text-neutral-950">
                  {formatTndCurrency(selectedVariant?.sellingPrice || currentPrice)}
                </span>
                {hasPromo && (
                  <span className="text-xs text-neutral-400 line-through">
                    {formatTndCurrency(product.sellingPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
                {t('storefront.variant_finish')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const isSel = selectedVariant?.id === v.id;
                  const colHex = v.attributesJson?.colorHex;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`p-2.5 rounded-xl border text-start text-xs flex items-center gap-2 transition cursor-pointer ${
                        isSel
                          ? 'border-[var(--royal-primary)] bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold'
                          : 'border-neutral-200 bg-[#F8F9FA] text-neutral-800 hover:border-[var(--royal-primary)]/50'
                      }`}
                    >
                      {colHex && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: colHex }}
                        />
                      )}
                      <span className="truncate">{v.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              {t('common.qty')}
            </span>
            <div className="flex items-center gap-3 bg-[#F4F5F7] rounded-full px-3 py-1.5 border border-neutral-200">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1 rounded-full hover:bg-white text-neutral-700 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-black text-neutral-950">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1 rounded-full hover:bg-white text-neutral-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Rich Quick View Modal (Centralized) */}
      <Modal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        title={displayProductName}
        subtitle={`${product.brand?.name || 'Royal'} • SKU ${product.sku}`}
        type="details"
        size="4xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <Link
              href={`/articles/${product.slug}`}
              className="py-2 px-4 rounded-full border border-neutral-300 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition"
            >
              {t('actions.view_full_sheet')}
            </Link>
            <button
              type="button"
              onClick={() => setIsQuickViewOpen(false)}
              className="py-2 px-4 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
            >
              {t('actions.close')}
            </button>
          </div>
        }
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Interactive Gallery: Autoplay 3s, Pause on Hover, Zoom & Fullscreen */}
          <ProductMediaViewer
            images={gallery}
            alt={displayProductName}
            heightClassName="h-72 sm:h-80"
            roundedClassName="rounded-2xl"
            enableZoomOnHover={true}
            defaultAutoPlay={true}
          />

          {/* Info & Specs */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-neutral-950">
                  {formatTndCurrency(selectedVariant?.sellingPrice || currentPrice)}
                </span>
                {hasPromo && (
                  <>
                    <span className="text-sm text-neutral-400 line-through">
                      {formatTndCurrency(product.sellingPrice)}
                    </span>
                    {discountPct && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                        -{discountPct}%
                      </span>
                    )}
                  </>
                )}
              </div>

              {displayShortDesc && (
                <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                  {displayShortDesc}
                </p>
              )}

              {product.dimensionsJson && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {Object.entries(product.dimensionsJson)
                    .filter(([k, v]) => !['stockQuantity', 'lowStockThreshold', 'allowBackorders'].includes(k) && v)
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <div key={k} className="p-2 rounded-xl bg-[#F8F9FA] border border-neutral-200 text-[11px]">
                        <span className="text-neutral-400 uppercase block text-[9px] font-bold">{k}</span>
                        <span className="font-semibold text-neutral-900 line-clamp-1">{String(v)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-neutral-100">
              {articleFlags.showBuyButton !== false && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#F4F5F7] rounded-full px-3 py-2 border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-0.5 text-neutral-700 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-0.5 text-neutral-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmAddToCart}
                  title={inCart ? t('actions.added_to_cart_qty') : t('actions.add_to_cart')}
                  aria-label={t('actions.add_to_cart')}
                  className={`w-11 h-11 rounded-full border-[1.5px] transition flex items-center justify-center shrink-0 cursor-pointer shadow-2xs ${
                    inCart
                      ? 'bg-[var(--royal-success,#059669)] hover:bg-[var(--royal-success-hover,#047857)] border-white text-white ring-1 ring-[var(--royal-success,#059669)]/80'
                      : 'bg-white hover:bg-[var(--royal-gold-light)] border-[var(--royal-primary)] text-[var(--royal-primary)]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickViewOpen(false);
                    setIsQuickOrderOpen(true);
                  }}
                  className="flex-1 py-3 px-4 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{t('actions.buy')}</span>
                </button>
              </div>
              )}

              {/* Like / Dislike / Wishlist Strip in Quick View */}
              <div className="flex flex-wrap items-center gap-2">
                {articleFlags.showLikeDislike !== false && (
                  <>
                <button
                  type="button"
                  onClick={(e) => handleReaction(e, 'LIKE')}
                  className={`px-3 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    myReaction === 'LIKE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${myReaction === 'LIKE' ? 'fill-current' : ''}`} />
                  <span>{reactionCounts.likeCount}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleReaction(e, 'DISLIKE')}
                  className={`px-3 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    myReaction === 'DISLIKE'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${myReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
                  <span>{reactionCounts.dislikeCount}</span>
                </button>
                  </>
                )}
                {articleFlags.showWishlistButton !== false && (
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`px-3 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    inWishlist
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current' : ''}`} />
                  <span>{t('actions.favorite')}</span>
                </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <QuickOrderModal
        isOpen={isQuickOrderOpen}
        onClose={() => setIsQuickOrderOpen(false)}
        product={product}
        initialVariantId={selectedVariant?.id}
        initialQuantity={quantity}
      />
    </>
  );

  // Horizontal List Mode Card
  if (layout === 'list') {
    return (
      <>
        <div className="group bg-[var(--royal-card)] rounded-2xl border border-[var(--royal-border)] p-4 flex flex-col sm:flex-row items-center gap-5 hover:shadow-md hover:border-[var(--royal-primary)]/50 transition">
          <Link
            href={`/articles/${product.slug}`}
            className="relative w-full sm:w-52 h-52 rounded-xl bg-[var(--royal-silver-light)] overflow-hidden shrink-0 block"
          >
            <img
              src={getSafeImageUrl(product.primaryImage)}
              alt={product.name}
              className="w-full h-full object-cover object-center scale-[1.06] group-hover:scale-110 transition-transform duration-500"
            />
            {hasPromo && (
              <span className="absolute top-2 start-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase">
                {discountPct ? `-${discountPct}%` : 'PROMO'}
              </span>
            )}
            {product.sku && (
              <button
                type="button"
                onClick={handleCopySku}
                title={`${t('product.copy_sku')} (${product.sku})`}
                aria-label={`${t('product.copy_sku')} ${product.sku}`}
                className="absolute bottom-2 start-2 px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-sm hover:bg-white border-[1.5px] border-[var(--royal-primary)] text-[10px] font-mono font-bold text-[var(--royal-primary)] hover:text-[var(--royal-ink)] shadow-sm transition-all cursor-pointer max-w-[82%] truncate inline-flex items-center gap-1"
              >
                {copiedSku ? <Check className="w-3 h-3 shrink-0" /> : <Copy className="w-2.5 h-2.5 shrink-0" />}
                <span className="truncate">{copiedSku ? t('product.copied') : product.sku}</span>
              </button>
            )}
          </Link>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--royal-primary)] uppercase tracking-wider">
              <span>{product.brand?.name || 'Royal'}</span>
              {displayCategoryName && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{displayCategoryName}</span>
                </>
              )}
            </div>
            <Link href={`/articles/${product.slug}`}>
              <h3 className="font-heading font-bold text-base text-[var(--royal-ink)] group-hover:text-[var(--royal-primary)] transition-colors">
                {displayProductName}
              </h3>
            </Link>
            {displayShortDesc && (
              <p className="text-xs text-slate-500 line-clamp-2">{displayShortDesc}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-3.5 h-3.5 ${
                      starIdx <= roundedRating
                        ? 'text-[var(--royal-primary)] fill-current'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">
                {product.reviewCount || product.reviewsCount || 0} {t('storefront.reviews_count')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end justify-between w-full sm:w-auto gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <div className="flex items-baseline gap-2 justify-between sm:justify-end w-full sm:w-auto text-start sm:text-end">
              <div className="text-lg font-black text-[var(--royal-primary)] font-mono">
                {formatTndCurrency(currentPrice)}
              </div>
              {hasPromo && (
                <div className="text-xs text-slate-400 line-through font-mono">
                  {formatTndCurrency(product.sellingPrice)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
              {articleFlags.showQuickViewButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveImage(getSafeImageUrl(product.primaryImage));
                    setIsQuickViewOpen(true);
                  }}
                  title={t('actions.quick_view')}
                  aria-label={t('actions.quick_view')}
                  className="w-9 h-9 rounded-full border-[1.5px] border-[var(--royal-primary)] bg-white/75 backdrop-blur-sm hover:bg-white text-[var(--royal-primary)] flex items-center justify-center cursor-pointer transition"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {articleFlags.showCompareButton && (
                <button
                  type="button"
                  onClick={handleToggleCompare}
                  title={t('actions.compare_title')}
                  aria-label={t('actions.compare_title')}
                  className={`w-9 h-9 rounded-full border-[1.5px] border-[var(--royal-primary)] flex items-center justify-center cursor-pointer transition ${
                    inCompare
                      ? 'bg-blue-50/95 text-blue-600 hover:bg-white'
                      : 'bg-white/75 backdrop-blur-sm text-[var(--royal-primary)] hover:bg-white hover:text-blue-600'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </button>
              )}
              {articleFlags.showWishlistButton && (
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  title={inWishlist ? t('actions.wishlist_remove') : t('actions.wishlist_add')}
                  aria-label={inWishlist ? t('actions.wishlist_remove') : t('actions.wishlist_add')}
                  className={`w-9 h-9 rounded-full border-[1.5px] border-[var(--royal-primary)] flex items-center justify-center cursor-pointer transition ${
                    inWishlist
                      ? 'bg-rose-50/95 text-rose-600 hover:bg-white'
                      : 'bg-white/75 backdrop-blur-sm text-[var(--royal-primary)] hover:bg-white hover:text-rose-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsReviewOpen(true);
                }}
                title={myReview ? t('actions.review_edit') : t('actions.review')}
                aria-label={myReview ? t('actions.review_edit') : t('actions.review')}
                className={`w-9 h-9 rounded-full border-[1.5px] border-[var(--royal-primary)] flex items-center justify-center cursor-pointer transition ${
                  myReview
                    ? 'bg-amber-50/95 text-amber-500 hover:bg-white'
                    : 'bg-white/75 backdrop-blur-sm text-[var(--royal-primary)] hover:bg-white hover:text-amber-500'
                }`}
              >
                <Star className={`w-4 h-4 ${myReview ? 'fill-amber-400 text-amber-500' : ''}`} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsShareOpen(true);
                }}
                title={t('actions.share')}
                aria-label={t('actions.share')}
                className="w-9 h-9 rounded-full border-[1.5px] border-[var(--royal-primary)] bg-white/75 backdrop-blur-sm hover:bg-white text-[var(--royal-primary)] flex items-center justify-center cursor-pointer transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {articleFlags.showLikeDislike !== false && (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleReaction(e, 'LIKE')}
                    title="J'aime cet article"
                    className={`px-2.5 h-9 rounded-full border flex items-center gap-1 text-xs font-bold cursor-pointer ${
                      myReaction === 'LIKE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'border-[var(--royal-border)] bg-[var(--royal-card)] hover:bg-[var(--royal-silver-light)] text-[var(--royal-ink)]'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${myReaction === 'LIKE' ? 'fill-current' : ''}`} />
                    <span>{reactionCounts.likeCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleReaction(e, 'DISLIKE')}
                    title="Je n'aime pas cet article"
                    className={`px-2.5 h-9 rounded-full border flex items-center gap-1 text-xs font-bold cursor-pointer ${
                      myReaction === 'DISLIKE'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'border-[var(--royal-border)] bg-[var(--royal-card)] hover:bg-[var(--royal-silver-light)] text-[var(--royal-ink)]'
                    }`}
                  >
                    <ThumbsDown className={`w-3.5 h-3.5 ${myReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
                    <span>{reactionCounts.dislikeCount}</span>
                  </button>
                </>
              )}
              {articleFlags.showBuyButton && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleIconAddToCart}
                    title={t('actions.add_to_cart')}
                    aria-label={t('actions.add_to_cart')}
                    className={`w-9 h-9 rounded-full border-[1.5px] flex items-center justify-center cursor-pointer shrink-0 transition shadow-2xs ${
                      inCart
                        ? 'bg-[var(--royal-success,#059669)] hover:bg-[var(--royal-success-hover,#047857)] border-white text-white ring-1 ring-[var(--royal-success,#059669)]/80'
                        : 'bg-white hover:bg-[var(--royal-gold-light)] border-[var(--royal-primary)] text-[var(--royal-primary)]'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsQuickOrderOpen(true);
                    }}
                    className="px-4 py-2 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{t('actions.buy')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {renderModals()}
      </>
    );
  }

  // Standard Grid Card (Full-Size Image Fitting Container + Translucent Gold Overlay Icons + Copyable Bottom-Left SKU + Inline Prices Under Title)
  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group flex flex-col h-full"
      >
        <div className="relative w-full h-full rounded-2xl bg-[var(--royal-card)] border border-[var(--royal-border)] overflow-hidden flex flex-col justify-between transition-all duration-300 group-hover:border-[var(--royal-primary)]/60 group-hover:shadow-md">
          {/* Article Image Wrapper with Translucent White (25%) + Primary Gold Overlay Icons & Copyable SKU Pill */}
          <div
            style={{ height: `${resolvedImageHeightPx}px` }}
            className="relative w-full overflow-hidden bg-[var(--royal-silver-light)] shrink-0"
          >
            {/* Top Floating Overlay Controls */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between z-20 pointer-events-none">
              {hasPromo ? (
                <span className="pointer-events-auto px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
                  {discountPct ? `-${discountPct}%` : 'PROMO'}
                </span>
              ) : (
                <span className="pointer-events-auto px-2.5 py-0.5 rounded-full bg-white/75 backdrop-blur-sm hover:bg-white border border-[var(--royal-primary)] text-[10px] font-bold text-[var(--royal-primary)] uppercase tracking-wider shadow-sm transition-all">
                  {product.brand?.name || 'Royal'}
                </span>
              )}

              <div className="pointer-events-auto flex flex-col gap-1.5">
                {articleFlags.showQuickViewButton && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImage(getSafeImageUrl(product.primaryImage));
                      setIsQuickViewOpen(true);
                    }}
                    title={t('actions.quick_view')}
                    aria-label={t('actions.quick_view')}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-white/75 backdrop-blur-sm border-[1.5px] border-[var(--royal-primary)] text-[var(--royal-primary)] hover:bg-white shadow-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                {articleFlags.showCompareButton && (
                  <button
                    type="button"
                    onClick={handleToggleCompare}
                    title={t('actions.compare_title')}
                    aria-label={t('actions.compare_title')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-[1.5px] border-[var(--royal-primary)] shadow-sm cursor-pointer ${
                      inCompare
                        ? 'text-blue-600 bg-blue-50/95 hover:bg-white'
                        : 'bg-white/75 backdrop-blur-sm text-[var(--royal-primary)] hover:bg-white hover:text-blue-600'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                )}
                {articleFlags.showWishlistButton && (
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    title={inWishlist ? t('actions.wishlist_remove') : t('actions.wishlist_add')}
                    aria-label={inWishlist ? t('actions.wishlist_remove') : t('actions.wishlist_add')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-[1.5px] border-[var(--royal-primary)] shadow-sm cursor-pointer ${
                      inWishlist
                        ? 'text-rose-600 bg-rose-50/95 hover:bg-white'
                        : 'bg-white/75 backdrop-blur-sm text-[var(--royal-primary)] hover:bg-white hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current' : ''}`} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsReviewOpen(true);
                  }}
                  title={myReview ? t('actions.review_edit') : t('actions.review')}
                  aria-label={myReview ? t('actions.review_edit') : t('actions.review')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-[1.5px] border-[var(--royal-primary)] shadow-sm cursor-pointer ${
                    myReview
                      ? 'text-amber-500 bg-amber-50/95 hover:bg-white'
                      : 'bg-white/75 backdrop-blur-sm text-[var(--royal-primary)] hover:bg-white hover:text-amber-500'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${myReview ? 'fill-amber-400 text-amber-500' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsShareOpen(true);
                  }}
                  title={t('actions.share')}
                  aria-label={t('actions.share')}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-white/75 backdrop-blur-sm border-[1.5px] border-[var(--royal-primary)] text-[var(--royal-primary)] hover:bg-white shadow-sm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <Link
              href={`/articles/${product.slug}`}
              className="w-full h-full block cursor-pointer"
            >
              <img
                src={getSafeImageUrl(product.primaryImage)}
                alt={displayProductName}
                className="w-full h-full object-cover object-center scale-[1.08] group-hover:scale-115 transition-transform duration-500"
              />
            </Link>

            {/* Bottom-Start Click-to-Copy SKU Badge styled symmetrically to top-end controls */}
            {product.sku && (
              <div className="absolute bottom-2.5 start-2.5 z-20 max-w-[78%]">
                <button
                  type="button"
                  onClick={handleCopySku}
                  title={`${t('product.copy_sku')} (${product.sku})`}
                  aria-label={`${t('product.copy_sku')} ${product.sku}`}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/75 backdrop-blur-sm hover:bg-white border-[1.5px] border-[var(--royal-primary)] text-[10px] font-mono font-bold text-[var(--royal-primary)] hover:text-[var(--royal-ink)] shadow-sm transition-all cursor-pointer truncate max-w-full"
                >
                  {copiedSku ? (
                    <>
                      <Check className="w-3 h-3 shrink-0" />
                      <span>{t('product.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5 shrink-0 opacity-80" />
                      <span className="truncate">{product.sku}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Card Content & Clean Single-Line "Acheter" Action */}
          <div className="p-3.5 bg-[var(--royal-card)] border-t border-[var(--royal-border)] flex-1 flex flex-col justify-between gap-2">
            <div className="space-y-1.5">
              <Link href={`/articles/${product.slug}`}>
                <h3 className="font-heading font-semibold text-sm text-[var(--royal-ink)] line-clamp-1 group-hover:text-[var(--royal-primary)] transition-colors">
                  {displayProductName}
                </h3>
              </Link>

              {/* Promo / Current Price & Old Price side by side right below the article title */}
              <div className="flex items-baseline gap-2 flex-nowrap overflow-hidden">
                <span className="text-[15px] font-black font-mono text-[var(--royal-primary)] leading-tight whitespace-nowrap">
                  {formatTndCurrency(currentPrice)}
                </span>
                {hasPromo && (
                  <span className="text-[11px] text-slate-400 line-through font-mono leading-tight whitespace-nowrap truncate">
                    {formatTndCurrency(product.sellingPrice)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <div className="flex shrink-0">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-3 h-3 ${
                          starIdx <= roundedRating
                            ? 'text-[var(--royal-primary)] fill-current'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 truncate">
                    {displayReviewCount} {t('storefront.reviews_count')}
                  </span>
                </div>

                {articleFlags.showLikeDislike !== false && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleReaction(e, 'LIKE')}
                      title={t('actions.like')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold transition cursor-pointer ${
                        myReaction === 'LIKE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-[var(--royal-card)] text-slate-600 border-[var(--royal-border)] hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${myReaction === 'LIKE' ? 'fill-current' : ''}`} />
                      <span>{reactionCounts.likeCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleReaction(e, 'DISLIKE')}
                      title={t('actions.dislike')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold transition cursor-pointer ${
                        myReaction === 'DISLIKE'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-[var(--royal-card)] text-slate-600 border-[var(--royal-border)] hover:border-rose-300 hover:text-rose-700'
                      }`}
                    >
                      <ThumbsDown className={`w-3 h-3 ${myReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
                      <span>{reactionCounts.dislikeCount}</span>
                    </button>
                  </div>
                )}
              </div>

              {articleFlags.showBuyButton && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleIconAddToCart}
                    title={t('actions.add_to_cart')}
                    aria-label={t('actions.add_to_cart')}
                    className={`w-9 h-[34px] rounded-xl border-[1.5px] flex items-center justify-center shrink-0 cursor-pointer transition shadow-2xs ${
                      inCart
                        ? 'bg-[var(--royal-success,#059669)] hover:bg-[var(--royal-success-hover,#047857)] border-white text-white ring-1 ring-[var(--royal-success,#059669)]/80'
                        : 'bg-white hover:bg-[var(--royal-gold-light)] border-[var(--royal-primary)] text-[var(--royal-primary)]'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsQuickOrderOpen(true);
                    }}
                    title={t('actions.quick_order')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('actions.buy')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      {renderModals()}
    </>
  );
}
