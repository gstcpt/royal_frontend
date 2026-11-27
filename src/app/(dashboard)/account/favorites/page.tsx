'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, RefreshCw } from 'lucide-react';
import { Breadcrumb, Button } from '@/components/ui';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useAuthStore } from '@/stores/auth.store';
import { fetchApi } from '@/lib/api';
import { getSafeImageUrl } from '@/lib/cart-session';
import { ProductCard, StorefrontProduct } from '@/components/storefront/ProductCard';
import { useI18nStore } from '@/stores/i18n.store';

export default function AccountFavoritesPage() {
  const { items, setItems } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18nStore();
  const [serverProducts, setServerProducts] = React.useState<StorefrontProduct[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadWishlist = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/my-wishlist');
      const list = Array.isArray(res) ? res : res?.data || [];
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
    } catch {
      setServerProducts(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setItems]);

  React.useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const cardProducts: StorefrontProduct[] = React.useMemo(() => {
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

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: t('account.dashboard_crumb'), href: '/dashboard' },
          { label: t('account.favorites_title') },
        ]}
      />

      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
              {t('account.favorites_title')} ({t('account.stat_wishlist')} • {cardProducts.length})
            </h1>
            <p className="text-xs text-neutral-500">
              {t('account.favorites_subtitle')}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadWishlist} className="text-xs">
          <RefreshCw className={`h-3.5 w-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`} />
          {t('account.sync_btn')}
        </Button>
      </div>

      {cardProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center space-y-4">
          <Heart className="h-10 w-10 text-neutral-300 mx-auto" />
          <div className="text-sm font-bold text-neutral-900">{t('account.favorites_empty')}</div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold shadow-xs"
          >
            {t('account.explore_catalog')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cardProducts.map((product) => (
            <ProductCard key={product.id} product={product} layout="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
