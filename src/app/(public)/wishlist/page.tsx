'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useI18nStore } from '@/stores/i18n.store';
import { getCartHeaders, getSafeImageUrl } from '@/lib/cart-session';
import { ProductCard, StorefrontProduct } from '@/components/storefront/ProductCard';
import { StorefrontPageHeader } from '@/components/storefront/StorefrontPageHeader';
import { CmsOrderedSections, CmsViewCodeInjector } from '@/components/storefront/CmsElementRuntime';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { buildCmsInlineStyle } from '@/lib/cms-builder';
import { Heart, ShoppingBag, ArrowRight, Check } from 'lucide-react';

export default function WishlistPage() {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const wishCfg = config.views.wishlist || {};
  const { items, removeItem, clearWishlist, setItems } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [serverProducts, setServerProducts] = useState<StorefrontProduct[] | null>(null);
  const [addedAll, setAddedAll] = useState(false);

  const syncFromServer = React.useCallback(() => {
    if (!isAuthenticated) {
      setServerProducts(null);
      return;
    }
    fetch('/api/v1/storefront-cms/my-wishlist', {
      headers: getCartHeaders(true),
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = json?.data || json;
        if (Array.isArray(list)) {
          setServerProducts(list);
          setItems(
            list.map((p: StorefrontProduct) => {
              const activeP =
                p.discountPrice && Number(p.discountPrice) > 0 && Number(p.discountPrice) < Number(p.sellingPrice)
                  ? Number(p.discountPrice)
                  : Number(p.sellingPrice);
              return {
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: activeP,
                image: getSafeImageUrl(p.primaryImage),
                category: p.category?.name,
                sku: p.sku,
                inStock: true,
              };
            }),
          );
        }
      })
      .catch(() => null);
  }, [isAuthenticated, setItems]);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const cardProducts: StorefrontProduct[] = useMemo(() => {
    const serverById = new Map<string, StorefrontProduct>();
    (serverProducts || []).forEach((p) => serverById.set(p.id, p));

    return items.map((item) => {
      const full = serverById.get(item.id);
      if (full) return full;
      return {
        id: item.id,
        sku: item.sku || `SKU-${item.id.slice(0, 6)}`,
        name: item.name,
        slug: item.slug,
        sellingPrice: Number(item.price || 0),
        discountPrice: null,
        primaryImage: getSafeImageUrl(item.image),
        images: item.image ? [getSafeImageUrl(item.image)] : [],
        category: item.category ? { name: item.category } : null,
        brand: { name: 'Royal' },
      };
    });
  }, [items, serverProducts]);

  const handleClearAll = async () => {
    if (isAuthenticated && cardProducts.length > 0) {
      await Promise.all(
        cardProducts.map((p) =>
          fetch('/api/v1/storefront-cms/wishlist/toggle', {
            method: 'POST',
            headers: getCartHeaders(true),
            credentials: 'include',
            body: JSON.stringify({ productId: p.id, action: 'REMOVE' }),
          }).catch(() => null),
        ),
      );
      setServerProducts([]);
    }
    clearWishlist();
  };

  const handleAddAllToCart = async () => {
    for (const item of cardProducts) {
      const price =
        item.discountPrice && Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.sellingPrice)
          ? Number(item.discountPrice)
          : Number(item.sellingPrice);
      await addToCart({
        productId: item.id,
        quantity: 1,
        name: item.name,
        price,
        sku: item.sku,
        productName: item.name,
      });
    }
    setAddedAll(true);
    setTimeout(() => setAddedAll(false), 2500);
  };

  const wishColsClass =
    wishCfg.defaultColumns === '3' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6';

  const wishSections: Record<string, React.ReactNode> = {
    header: (
      <StorefrontPageHeader
        key="header"
        title={`${locale === 'ar' ? t('wishlist.title') : (wishCfg.title || t('wishlist.title'))} (${cardProducts.length})`}
        breadcrumbLabel={t('nav.wishlist')}
        subtitle={locale === 'ar' ? t('wishlist.subtitle') : (wishCfg.subtitle || t('wishlist.subtitle'))}
        badge={
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs uppercase tracking-widest font-bold text-[var(--royal-gold-dark)]">
            <Heart className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
            <span>{locale === 'ar' ? t('wishlist.badge') : (wishCfg.badgeText || t('wishlist.badge'))}</span>
          </div>
        }
        rightSlot={
          cardProducts.length > 0 ? (
            <>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-red-600 transition cursor-pointer"
              >
                {t('wishlist.clear_all')}
              </button>
              <button
                type="button"
                onClick={handleAddAllToCart}
                className="px-6 py-2.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider hover:bg-[var(--royal-primary-hover)] transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {addedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                <span>{addedAll ? t('wishlist.added_all') : t('wishlist.add_all_to_cart')}</span>
              </button>
            </>
          ) : undefined
        }
      />
    ),
    productsGrid:
      cardProducts.length === 0 ? (
        <div key="productsGrid" className="text-center py-20 sm:py-24 bg-[#F8F9FA] rounded-[32px] border border-neutral-200 p-6 sm:p-8">
          <div className="w-16 h-16 rounded-full bg-white text-neutral-400 flex items-center justify-center mx-auto mb-4 border border-neutral-200 shadow-sm">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-neutral-900 mb-2">
            {t('wishlist.empty')}
          </h2>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
            {t('wishlist.empty_desc')}
          </p>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider hover:bg-[var(--royal-primary-hover)] transition shadow-lg"
          >
            <span>{t('wishlist.discover_catalog')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div key="productsGrid" className={`grid ${wishColsClass}`}>
          {cardProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              layout="grid"
              imageHeightPx={wishCfg.cardImageHeightPx}
            />
          ))}
        </div>
      ),
  };

  return (
    <div
      id={wishCfg.viewStyle?.domId?.trim() || 'royal-view-wishlist'}
      style={buildCmsInlineStyle(wishCfg.viewStyle)}
      className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10 sm:py-12"
    >
      <CmsViewCodeInjector viewKey="wishlist" viewStyle={wishCfg.viewStyle} />
      <CmsOrderedSections
        viewKey="wishlist"
        viewCfg={wishCfg}
        defaultOrder={['header', 'productsGrid']}
        sections={wishSections}
        products={cardProducts}
      />
    </div>
  );
}
