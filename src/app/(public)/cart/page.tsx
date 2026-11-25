'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart.store';
import { getCartHeaders, getSafeImageUrl } from '@/lib/cart-session';
import { useI18nStore } from '@/stores/i18n.store';
import { StorefrontPageHeader } from '@/components/storefront/StorefrontPageHeader';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { CmsElementWrapper, CmsCustomBlockRenderer, CmsViewCodeInjector } from '@/components/storefront/CmsElementRuntime';
import { buildCmsInlineStyle } from '@/lib/cms-builder';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableQty: number;
  isAvailable: boolean;
}

export default function CartPage() {
  const { locale, t } = useI18nStore();
  const { config } = useCmsConfig();
  const cartCfg = config.views.cart || {};
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description?: string;
    type?: string;
    freeShipping?: boolean;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [shippingThreshold, setShippingThreshold] = useState<number>(150.0);
  const [standardShippingFee, setStandardShippingFee] = useState<number>(7.0);
  const [vatRate, setVatRate] = useState<number>(19);

  // Fetch cart & shipping config
  const fetchCart = async () => {
    try {
      setLoading(true);
      const [res, cfgRes] = await Promise.all([
        fetch('/api/v1/cart', { headers: getCartHeaders(), credentials: 'include' }),
        fetch('/api/v1/storefront-cms/config').catch(() => null),
      ]);
      const data = await res.json();
      if (data.data?.items) {
        setItems(data.data.items);
      }
      if (cfgRes?.ok) {
        const cfgJson = await cfgRes.json();
        const cfg = cfgJson?.data || cfgJson;
        if (cfg?.freeShippingThreshold !== undefined) setShippingThreshold(Number(cfg.freeShippingThreshold));
        if (cfg?.standardShippingFee !== undefined) setStandardShippingFee(Number(cfg.standardShippingFee));
        if (cfg?.vatStandard !== undefined) setVatRate(Number(cfg.vatStandard));
      }
      useCartStore.getState().fetchCart();
    } catch (e) {
      console.error('Failed to load cart', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQty = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: 'PUT',
        headers: getCartHeaders(true),
        body: JSON.stringify({ quantity: newQty }),
      });
      const data = await res.json();
      if (data.data?.items) {
        setItems(data.data.items);
      }
      useCartStore.getState().fetchCart();
    } catch (e) {
      console.error('Failed to update quantity', e);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: getCartHeaders(),
      });
      const data = await res.json();
      if (data.data?.items) {
        setItems(data.data.items);
      }
      useCartStore.getState().fetchCart();
    } catch (e) {
      console.error('Failed to remove item', e);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
      const res = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          orderAmount: subtotal,
          items: items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.data?.valid) {
        const isFreeShip = Boolean(data.data.freeShipping || data.data.coupon?.type === 'FREE_SHIPPING');
        setAppliedCoupon({
          code: data.data.coupon.code,
          discountAmount: data.data.discountAmount,
          description: data.data.coupon.description,
          type: data.data.coupon?.type,
          freeShipping: isFreeShip,
        });
        setCouponSuccess(
          isFreeShip
            ? `Coupon ${data.data.coupon.code} appliqué — Livraison OFFERTE !`
            : `Coupon ${data.data.coupon.code} appliqué avec succès ! (-${Number(data.data.discountAmount || 0).toFixed(3)} TND)`,
        );
      } else {
        setCouponError(data.message || 'Code promo invalide ou expiré.');
      }
    } catch {
      setCouponError('Erreur de validation du coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const isFreeShippingCoupon = Boolean(appliedCoupon?.freeShipping || appliedCoupon?.type === 'FREE_SHIPPING');
  const shippingCost =
    isFreeShippingCoupon || subtotalAfterDiscount >= shippingThreshold || subtotal === 0
      ? 0
      : standardShippingFee;
  const taxAmount = Number((subtotalAfterDiscount * (vatRate / 100)).toFixed(3));
  const finalTotal = Number((subtotalAfterDiscount + shippingCost).toFixed(3));
  const missingForFreeShipping = isFreeShippingCoupon ? 0 : Math.max(0, shippingThreshold - subtotalAfterDiscount);
  const progressPercent = isFreeShippingCoupon
    ? 100
    : Math.min(100, Math.round((subtotalAfterDiscount / shippingThreshold) * 100));

  return (
    <div
      id={cartCfg.viewStyle?.domId?.trim() || 'royal-view-cart'}
      style={buildCmsInlineStyle(cartCfg.viewStyle)}
      className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10 sm:py-12"
    >
      <CmsViewCodeInjector viewKey="cart" viewStyle={cartCfg.viewStyle} />
      {cartCfg.showHeader !== false && (
        <CmsElementWrapper viewKey="cart" elemId="header" styleCfg={cartCfg.elementStyles?.header}>
          <StorefrontPageHeader
            title={locale === 'ar' ? t('cart.title') : (cartCfg.title || t('cart.title'))}
            breadcrumbLabel={t('nav.my_cart')}
            subtitle={locale === 'ar' ? `${items.length} ${t('catalog.articles_word')}` : (cartCfg.subtitle ? `${cartCfg.subtitle} (${items.length})` : `${items.length} ${t('catalog.articles_word')}`)}
            badge={
              cartCfg.badgeText ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs uppercase tracking-widest font-bold text-[var(--royal-gold-dark)]">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
                  <span>{cartCfg.badgeText}</span>
                </div>
              ) : undefined
            }
            rightSlot={
              <Link
                href="/articles"
                className="text-xs uppercase font-medium tracking-widest text-[#0C1A14] hover:text-[var(--royal-primary)] flex items-center gap-1.5 transition"
              >
                <span>{t('actions.continue_shopping')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
        </CmsElementWrapper>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-12 h-12 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#0C1A14]/70">{t('cart.loading')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 sm:py-20 text-center bg-white rounded-3xl border border-[#EFECE6] shadow-sm max-w-2xl mx-auto px-6">
          <div className="w-20 h-20 bg-[#FBF9F5] rounded-full flex items-center justify-center mx-auto mb-6 text-[#0C1A14]/40">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="font-sans font-bold tracking-tight text-2xl text-[#0C1A14] mb-2">{t('cart.empty')}</h2>
          <p className="text-sm text-[#0C1A14]/60 max-w-md mx-auto mb-8">
            {t('cart.empty_subtitle')}
          </p>
          <Link
            href="/articles"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs uppercase font-semibold tracking-widest hover:bg-[var(--royal-primary-hover)] transition-all shadow-md"
          >
            {t('wishlist.discover_catalog')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-6">
            <CmsElementWrapper viewKey="cart" elemId="itemsList" styleCfg={cartCfg.elementStyles?.itemsList} className="space-y-6">
              {/* Free shipping progress bar */}
              {cartCfg.showFreeShippingProgress !== false && (
                <div className="bg-[var(--royal-gold-light)] text-[var(--royal-ink)] p-4 sm:p-5 rounded-2xl shadow-sm border border-[var(--royal-primary)]/40">
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <span className="flex items-center gap-2 font-medium min-w-0">
                      <Truck className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
                      {missingForFreeShipping === 0 ? (
                        <span className="text-[var(--royal-gold-dark)] font-bold">{t('cart.free_shipping_ok')}</span>
                      ) : (
                        <span>
                          {t('cart.free_shipping_more')} <strong className="text-[var(--royal-gold-dark)]">{missingForFreeShipping.toFixed(3)} {t('common.currency')}</strong> {t('cart.free_shipping_unlock')}
                        </span>
                      )}
                    </span>
                    <span className="text-[var(--royal-ink)]/70 font-semibold shrink-0">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-white/80 border border-[var(--royal-primary)]/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--royal-primary)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Cart Table / Cards */}
              <div className="bg-white rounded-3xl border border-[#EFECE6] divide-y divide-[#EFECE6] overflow-hidden shadow-sm">
              {items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 hover:bg-[#FBF9F5]/50 transition">
                  {/* Image & Details */}
                  <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FBF9F5] border border-[#EFECE6] flex-shrink-0 overflow-hidden flex items-center justify-center p-2">
                      <img src={getSafeImageUrl(item.image)} alt={item.productName} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-sans font-bold tracking-tight text-base sm:text-lg text-[#0C1A14] leading-snug line-clamp-2">
                        {item.productName}
                      </h3>
                      {item.variantName && (
                        <p className="text-xs text-[#0C1A14]/60 mt-0.5 truncate">
                          {t('cart.variant')} <span className="font-medium text-[#0C1A14]">{item.variantName}</span>
                        </p>
                      )}
                      <p className="text-xs text-[#0C1A14]/40 font-mono mt-0.5">{t('cart.sku')} {item.sku}</p>
                      <div className="mt-1.5 text-sm font-semibold text-[#0C1A14]">
                        {item.unitPrice.toFixed(3)} {t('common.currency')}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Total */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EFECE6]">
                    <div className="flex items-center border border-[#EFECE6] rounded-full bg-[#FBF9F5] px-2 py-1">
                      <button
                        onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                        className="p-1 rounded-full text-[#0C1A14]/60 hover:text-[#0C1A14] hover:bg-white transition"
                        title="-"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-[#0C1A14]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                        className="p-1 rounded-full text-[#0C1A14]/60 hover:text-[#0C1A14] hover:bg-white transition"
                        title="+"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <span className="block font-sans font-bold tracking-tight text-base sm:text-lg text-[#0C1A14]">
                        {item.lineTotal.toFixed(3)} {t('common.currency')}
                      </span>
                      <span className="text-[10px] text-[#0C1A14]/50">{t('cart.vat_inc_short')}</span>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 rounded-full text-[#0C1A14]/30 hover:text-red-500 hover:bg-red-50 transition"
                      title={t('actions.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </CmsElementWrapper>

            {/* Quick Guarantees */}
            {cartCfg.showGuarantees !== false && (
              <CmsElementWrapper viewKey="cart" elemId="guarantees" styleCfg={cartCfg.elementStyles?.guarantees}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#EFECE6]">
                    <ShieldCheck className="w-6 h-6 text-[#D4AF37] shrink-0" />
                    <span className="text-xs text-[#0C1A14]/80">{t('cart.guarantee_warranty')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#EFECE6]">
                    <Truck className="w-6 h-6 text-[#D4AF37] shrink-0" />
                    <span className="text-xs text-[#0C1A14]/80">{t('cart.guarantee_delivery')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#EFECE6]">
                    <Sparkles className="w-6 h-6 text-[#D4AF37] shrink-0" />
                    <span className="text-xs text-[#0C1A14]/80">{t('cart.guarantee_cod')}</span>
                  </div>
                </div>
              </CmsElementWrapper>
            )}
          </div>

          {/* Cart Summary Card */}
          <CmsElementWrapper viewKey="cart" elemId="summary" styleCfg={cartCfg.elementStyles?.summary} className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-6 shadow-sm sticky top-28">
              <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold pb-4 border-b border-[#EFECE6]">
                {t('cart.summary_title')}
              </h2>

              {/* Promo code form */}
              {cartCfg.showCouponBox !== false && (
                <div className="pt-5 pb-5 border-b border-[#EFECE6]">
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <label className="text-xs font-medium text-[#0C1A14]/70 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{t('cart.coupon_label')}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={t('cart.coupon_placeholder')}
                      className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-[#EFECE6] bg-[#FBF9F5] text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-5 py-2.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-semibold tracking-wider hover:bg-[var(--royal-primary-hover)] transition disabled:opacity-50 shrink-0"
                    >
                      {couponLoading ? '...' : t('cart.apply_coupon')}
                    </button>
                  </div>
                </form>

                {couponSuccess && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{couponSuccess}</span>
                  </div>
                )}
                {couponError && (
                  <div className="mt-3 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 py-5 text-sm text-[#0C1A14]/80">
                <div className="flex justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-semibold text-[#0C1A14]">{subtotal.toFixed(3)} {t('common.currency')}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>
                      {isFreeShippingCoupon && discount <= 0
                        ? `Avantage Livraison (${appliedCoupon.code})`
                        : `${t('cart.discount')} (${appliedCoupon.code})`}
                    </span>
                    <span>
                      {isFreeShippingCoupon && discount <= 0
                        ? 'Livraison offerte'
                        : `-${discount.toFixed(3)} ${t('common.currency')}`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{t('cart.shipping')}</span>
                  {shippingCost === 0 ? (
                    <span className="text-emerald-700 font-semibold uppercase text-xs">{t('cart.free')}</span>
                  ) : (
                    <span className="font-semibold text-[#0C1A14]">{shippingCost.toFixed(3)} {t('common.currency')}</span>
                  )}
                </div>

                <div className="flex justify-between text-xs text-[#0C1A14]/50">
                  <span>{t('cart.tax')}</span>
                  <span>{taxAmount.toFixed(3)} {t('common.currency')}</span>
                </div>
              </div>

              {/* Total & Checkout CTA */}
              <div className="pt-5 border-t border-[#EFECE6] space-y-5">
                <div className="flex justify-between items-baseline">
                  <span className="font-sans font-bold tracking-tight text-lg text-[#0C1A14]">{t('cart.total')}</span>
                  <div className="text-right">
                    <span className="font-sans font-bold tracking-tight text-3xl font-extrabold text-[#0C1A14]">
                      {finalTotal.toFixed(3)} <span className="text-lg font-normal">{t('common.currency')}</span>
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full py-4 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs uppercase font-bold tracking-widest hover:bg-[var(--royal-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>{locale === 'ar' ? t('cart.checkout_button') : (cartCfg.checkoutCtaText || t('cart.checkout_button'))}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-[11px] text-center text-[#0C1A14]/50 leading-relaxed">
                  {t('cart.cod_note')}
                </p>
              </div>
            </div>
          </CmsElementWrapper>
        </div>
      )}
      {Array.isArray(cartCfg.customBlocks) &&
        cartCfg.customBlocks.map((cb) => <CmsCustomBlockRenderer key={cb.id} block={cb} viewKey="cart" />)}
    </div>
  );
}
