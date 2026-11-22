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
} from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useCartStore } from '@/stores/cart.store';
import { useCompareStore } from '@/stores/compare.store';
import { useReactionStore } from '@/stores/reaction.store';
import { getSafeImageUrl, getCartHeaders } from '@/lib/cart-session';
import { formatTndCurrency } from '@/lib/utils';
import { ProductMediaViewer } from './ProductMediaViewer';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';
import { Modal } from '@/components/ui';
import { trackMarketingEvent } from './MarketingPixelsTracker';

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
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  sellingPrice: number;
  discountPrice?: number | null;
  discountPercent?: number | null;
  discountPercentage?: number | null;
  primaryImage: string;
  images?: string[];
  category?: { name: string; slug?: string } | null;
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
}

export function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const { config } = useCmsConfig();
  const { t } = useI18nStore();
  const articleFlags = config.views.articles;
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<string>(getSafeImageUrl(product.primaryImage));
  const [addedBanner, setAddedBanner] = useState(false);
  const [compareNotice, setCompareNotice] = useState<string | null>(null);

  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
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

  const inWishlist = isInWishlist(product.id);
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

  const handleConfirmAddToCart = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    await addToCart({
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
    setIsBuyModalOpen(false);
    setIsQuickViewOpen(false);
    setAddedBanner(true);
    setTimeout(() => setAddedBanner(false), 3800);
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
          className="fixed bottom-6 right-6 z-[9999] bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] px-5 py-3.5 rounded-2xl shadow-2xl border border-[var(--royal-primary)]/40 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-4"
        >
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </span>
          <div className="max-w-[220px]">
            <p className="font-bold text-[var(--royal-ink)] line-clamp-1">{t('actions.added_to_cart_qty')} ({quantity})</p>
            <p className="text-[11px] text-slate-600 line-clamp-1">{product.name}</p>
          </div>
          <Link
            href="/cart"
            className="ml-2 px-3 py-1.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold hover:bg-[var(--royal-primary-hover)] transition shrink-0"
          >
            {t('actions.view_cart_short')}
          </Link>
        </div>
      )}

      {/* Compare Feedback Toast */}
      {compareNotice && (
        <div className="fixed bottom-6 left-6 z-[9999] bg-white text-neutral-900 px-4 py-2.5 rounded-xl shadow-xl border border-neutral-200 flex items-center gap-2 text-xs font-bold">
          <Layers className="w-4 h-4 text-amber-500" />
          <span>{compareNotice}</span>
        </div>
      )}

      {/* Login Required Prompt for Like/Dislike */}
      {authPromptProductId === product.id && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 left-6 right-6 sm:right-auto max-w-sm z-[9999] bg-white text-neutral-900 px-4 py-3 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 text-xs"
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
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                {product.brand?.name || 'Royal'} • {product.sku}
              </span>
              <h4 className="font-heading font-bold text-sm text-neutral-950 line-clamp-2">
                {product.name}
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
                      className={`p-2.5 rounded-xl border text-left text-xs flex items-center gap-2 transition cursor-pointer ${
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
        title={product.name}
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
            alt={product.name}
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

              {product.shortDescription && (
                <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                  {product.shortDescription}
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
                  className="flex-1 py-3 px-4 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ajouter au panier</span>
                </button>
              </div>

              {/* Like / Dislike / Wishlist Strip in Quick View */}
              <div className="flex flex-wrap items-center gap-2">
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
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );

  // Horizontal List Mode Card
  if (layout === 'list') {
    return (
      <>
        <div className="group bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center gap-5 hover:shadow-md hover:border-slate-300 transition">
          <Link
            href={`/articles/${product.slug}`}
            className="relative w-full sm:w-52 h-52 rounded-xl bg-neutral-100 overflow-hidden shrink-0 block"
          >
            <img
              src={getSafeImageUrl(product.primaryImage)}
              alt={product.name}
              className="w-full h-full object-cover object-center scale-[1.06] group-hover:scale-110 transition-transform duration-500"
            />
            {hasPromo && (
              <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase">
                {discountPct ? `-${discountPct}%` : 'PROMO'}
              </span>
            )}
          </Link>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              <span>{product.brand?.name || 'Royal'}</span>
              {product.category?.name && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{product.category.name}</span>
                </>
              )}
            </div>
            <Link href={`/articles/${product.slug}`}>
              <h3 className="font-heading font-bold text-base text-slate-950 group-hover:text-amber-700 transition-colors">
                {product.name}
              </h3>
            </Link>
            {product.shortDescription && (
              <p className="text-xs text-slate-500 line-clamp-2">{product.shortDescription}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs text-slate-400">SKU : {product.sku}</span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end justify-between w-full sm:w-auto gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <div className="flex sm:block items-baseline justify-between w-full sm:w-auto text-left sm:text-right">
              <div className="text-lg font-black text-slate-950 font-mono">
                {formatTndCurrency(currentPrice)}
              </div>
              {hasPromo && (
                <div className="text-xs text-slate-400 line-through font-mono">
                  {formatTndCurrency(product.sellingPrice)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImage(getSafeImageUrl(product.primaryImage));
                  setIsQuickViewOpen(true);
                }}
                title="Aperçu rapide"
                className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToggleCompare}
                title="Comparer"
                className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer ${
                  inCompare
                    ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)]'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleReaction(e, 'LIKE')}
                title="J'aime cet article"
                className={`px-2.5 h-9 rounded-full border flex items-center gap-1 text-xs font-bold cursor-pointer ${
                  myReaction === 'LIKE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
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
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <ThumbsDown className={`w-3.5 h-3.5 ${myReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
                <span>{reactionCounts.dislikeCount}</span>
              </button>
              <button
                type="button"
                onClick={handleToggleWishlist}
                title={inWishlist ? t('actions.wishlist_remove') : t('actions.wishlist_add')}
                className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer ${
                  inWishlist
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsBuyModalOpen(true);
                }}
                className="px-4 py-2 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('actions.buy')}</span>
              </button>
            </div>
          </div>
        </div>
        {renderModals()}
      </>
    );
  }

  // Standard Grid Card (Full-Size Image Fitting Container)
  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group flex flex-col justify-between"
      >
        <div className="relative w-full rounded-2xl bg-white border border-slate-200/80 overflow-hidden flex flex-col justify-between transition-all duration-300 group-hover:border-slate-300 group-hover:shadow-md">
          {/* Top Floating Overlay Controls */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between z-20 pointer-events-none">
            {hasPromo ? (
              <span className="pointer-events-auto px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
                {discountPct ? `-${discountPct}%` : 'PROMO'}
              </span>
            ) : (
              <span className="pointer-events-auto px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {product.brand?.name || 'Royal'}
              </span>
            )}

            <div className="pointer-events-auto flex flex-col gap-1.5">
              {articleFlags.showWishlistButton && (
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  title={inWishlist ? 'Retirer de la liste d’envies' : 'Ajouter à la liste d’envies'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition bg-white/95 border shadow-sm cursor-pointer ${
                    inWishlist
                      ? 'text-rose-600 bg-rose-50 border-rose-200'
                      : 'text-slate-600 border-[var(--royal-border)] hover:text-rose-600'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              )}
              {articleFlags.showQuickViewButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveImage(getSafeImageUrl(product.primaryImage));
                    setIsQuickViewOpen(true);
                  }}
                  title="Aperçu rapide"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition bg-white/95 border border-[var(--royal-border)] text-slate-600 hover:text-[var(--royal-primary)] shadow-sm cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
              {articleFlags.showCompareButton && (
                <button
                  type="button"
                  onClick={handleToggleCompare}
                  title="Comparer cet article"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition border shadow-sm cursor-pointer ${
                    inCompare
                      ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)]'
                      : 'bg-white/95 border-[var(--royal-border)] text-slate-600 hover:text-[var(--royal-primary)]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Full-Bleed Fixed-Height Card Image */}
          <Link
            href={`/articles/${product.slug}`}
            className="relative w-full h-72 overflow-hidden bg-neutral-100 block cursor-pointer shrink-0"
          >
            <img
              src={getSafeImageUrl(product.primaryImage)}
              alt={product.name}
              className="w-full h-full object-cover object-center scale-[1.08] group-hover:scale-115 transition-transform duration-500"
            />
          </Link>

          {/* Bottom Action Pill: Buy Modal + Promo Old/New Prices */}
          <div className="p-2.5 bg-[var(--royal-silver-light)] border-t border-[var(--royal-border)] flex items-center justify-between gap-2 z-20">
            {articleFlags.showBuyButton ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsBuyModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] border border-[var(--royal-border)] text-xs font-bold text-[var(--royal-ink)] transition shadow-2xs cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('actions.buy')}</span>
              </button>
            ) : <span />}

            <div className="text-right leading-tight">
              <div className="px-2.5 py-1 rounded-lg bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold font-mono inline-block shadow-2xs">
                {formatTndCurrency(currentPrice)}
              </div>
              {hasPromo && (
                <div className="text-[10px] text-slate-400 line-through font-mono mt-0.5 pr-1">
                  {formatTndCurrency(product.sellingPrice)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title & Meta Below Card */}
        <div className="pt-3 px-1">
          <Link href={`/articles/${product.slug}`}>
            <h3 className="font-heading font-semibold text-sm text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center justify-between mt-1.5 text-xs gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
              <span className="text-[11px] text-slate-500 truncate">
                {product.reviewCount || product.reviewsCount || 0} {t('storefront.reviews_count')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => handleReaction(e, 'LIKE')}
                title={t('actions.like')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold transition cursor-pointer ${
                  myReaction === 'LIKE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
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
                    : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-700'
                }`}
              >
                <ThumbsDown className={`w-3 h-3 ${myReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
                <span>{reactionCounts.dislikeCount}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      {renderModals()}
    </>
  );
}
