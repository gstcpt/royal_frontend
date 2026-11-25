'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { useI18nStore } from '@/stores/i18n.store';
import { getCartHeaders, getSafeImageUrl } from '@/lib/cart-session';
import { trackMarketingEvent } from '@/components/storefront/MarketingPixelsTracker';
import { TUNISIAN_GOVERNORATES } from '@/components/storefront/QuickOrderModal';
import { StorefrontPageHeader } from '@/components/storefront/StorefrontPageHeader';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Lock,
  Wallet,
  MapPin,
  Store,
  AlertTriangle,
} from 'lucide-react';

interface CartItem {
  id: string;
  productId?: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

const EMPTY_CART_ITEMS: CartItem[] = [];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, fetchMe } = useAuthStore();
  const { t } = useI18nStore();
  const storeCart = useCartStore((s) => s.cart);
  const storeCartItems = React.useMemo(() => storeCart?.items ?? EMPTY_CART_ITEMS, [storeCart]);

  // Cart state
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [shippingThreshold, setShippingThreshold] = useState<number>(150.0);
  const [standardShippingFee, setStandardShippingFee] = useState<number>(7.0);
  const [vatRate, setVatRate] = useState<number>(19);

  // Form states
  const [formData, setFormData] = useState({
    // Contact
    email: '',
    firstName: '',
    lastName: '',
    phone: '+216 ',
    // Shipping Address
    street: '',
    street2: '',
    city: '',
    state: 'Mahdia',
    postalCode: '',
    country: 'TN',
    // Preferences
    deliveryMethod: 'STANDARD_HOME',
    paymentMethod: 'CASH_ON_DELIVERY',
    couponCode: '',
    notes: '',
  });
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    type?: string;
    freeShipping?: boolean;
  } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'SHOWROOM_PICKUP'>('DELIVERY');
  const [geoCountries, setGeoCountries] = useState<Array<{ code: string; nameFr: string; states: Array<{ name: string; lat: number; lng: number }> }>>([]);
  const [deliveryQuotes, setDeliveryQuotes] = useState<any[]>([]);
  const [selectedDeliveryCompanyId, setSelectedDeliveryCompanyId] = useState<string>('');
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [selectedShowroomId, setSelectedShowroomId] = useState<string>('');
  const [loadingDeliveryOptions, setLoadingDeliveryOptions] = useState(false);
  const [selectedGatewayCode, setSelectedGatewayCode] = useState<'CASH_ON_DELIVERY' | 'FLOUCI' | 'CLICTOPAY' | 'BANK_TRANSFER'>('CASH_ON_DELIVERY');
  const [publicGateways, setPublicGateways] = useState<{
    codEnabled: boolean;
    bankTransferEnabled: boolean;
    bankRib?: string;
    flouci?: { enabled: boolean; isPubliclyVisible: boolean; label: string; description: string };
    clictopay?: { enabled: boolean; isPubliclyVisible: boolean; label: string; description: string };
  }>({ codEnabled: true, bankTransferEnabled: false });

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('royal_token') && !user) {
      fetchMe();
    }
  }, [user, fetchMe]);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      email: prev.email || user.email || '',
      firstName: prev.firstName || user.firstName || '',
      lastName: prev.lastName || user.lastName || '',
      phone: (prev.phone === '+216 ' || !prev.phone.trim()) && user.phone ? user.phone : prev.phone,
    }));

    // Fetch complete saved profile & shipping address from backend for logged-in user
    let cancelled = false;
    fetch('/api/v1/storefront-cms/my-profile', {
      headers: getCartHeaders(true),
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        const p = json?.data || json;
        if (!p) return;
        const ship = p.shippingAddress;
        const matchedGov = ship?.state
          ? TUNISIAN_GOVERNORATES.find(
              (g) => g.toLowerCase() === String(ship.state).trim().toLowerCase(),
            ) || ship.state
          : null;
        const combinedAddress = [ship?.street, ship?.street2].filter(Boolean).join(', ');
        setFormData((prev) => ({
          ...prev,
          email: p.email || prev.email || user.email || '',
          firstName: prev.firstName || ship?.firstName || p.firstName || user.firstName || '',
          lastName: prev.lastName || ship?.lastName || p.lastName || user.lastName || '',
          phone:
            prev.phone === '+216 ' || !prev.phone.trim()
              ? ship?.phone || p.phone || user.phone || prev.phone
              : prev.phone,
          street: prev.street || ship?.street || '',
          street2: prev.street2 || combinedAddress || '',
          city: prev.city || ship?.city || '',
          state: matchedGov || prev.state,
          postalCode: prev.postalCode || ship?.postalCode || '',
        }));
        setPrefilledFromProfile(true);
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (storeCartItems && storeCartItems.length > 0 && items.length === 0) {
      setItems(
        storeCartItems.map((it: any) => ({
          id: it.id,
          variantId: it.variantId || it.productId,
          productName: it.productName || it.name || 'Article',
          variantName: it.variantName || null,
          sku: it.sku || '',
          image: it.image || null,
          unitPrice: Number(it.unitPrice || it.price || 0),
          quantity: Number(it.quantity || 1),
          lineTotal: Number(it.lineTotal ?? Number(it.unitPrice || it.price || 0) * Number(it.quantity || 1)),
        }))
      );
    }
  }, [storeCartItems, items.length]);

  useEffect(() => {
    async function loadCart() {
      try {
        const [res, cfgRes, gwRes] = await Promise.all([
          fetch('/api/v1/cart', { headers: getCartHeaders(), credentials: 'include' }),
          fetch('/api/v1/storefront-cms/config').catch(() => null),
          fetch('/api/v1/storefront-cms/public-payment-gateways').catch(() => null),
        ]);
        const data = await res.json();
        const apiItems = data?.data?.items || data?.items || [];
        if (Array.isArray(apiItems) && apiItems.length > 0) {
          setItems(apiItems);
        } else {
          // Ensure cart store syncs from backend
          await useCartStore.getState().fetchCart();
        }
        if (cfgRes?.ok) {
          const cfgJson = await cfgRes.json();
          const cfg = cfgJson?.data || cfgJson;
          if (cfg?.freeShippingThreshold !== undefined) setShippingThreshold(Number(cfg.freeShippingThreshold));
          if (cfg?.standardShippingFee !== undefined) setStandardShippingFee(Number(cfg.standardShippingFee));
          if (cfg?.vatStandard !== undefined) setVatRate(Number(cfg.vatStandard));
        }
        if (gwRes?.ok) {
          const gwJson = await gwRes.json();
          const gw = gwJson?.data || gwJson;
          if (gw) setPublicGateways(gw);
        }
      } catch (e) {
        console.error('Error fetching cart for checkout', e);
      } finally {
        setLoadingCart(false);
      }
    }

    loadCart();
  }, []);

  useEffect(() => {
    fetch('/api/v1/deliveries/geography')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const list = json?.data?.countries || json?.countries || [];
        if (Array.isArray(list) && list.length > 0) {
          setGeoCountries(list);
        }
      })
      .catch(() => null);
  }, []);

  const currentSubtotalValue = React.useMemo(
    () => items.reduce((sum, it) => sum + it.lineTotal, 0),
    [items],
  );
  const currentDiscountValue = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const currentSubtotalAfterDiscount = Math.max(0, currentSubtotalValue - currentDiscountValue);

  useEffect(() => {
    if (loadingCart) return;
    let cancelled = false;
    setLoadingDeliveryOptions(true);

    const quoteItems = items
      .filter((it) => it.variantId)
      .map((it) => ({ variantId: it.variantId, quantity: Math.max(1, Number(it.quantity || 1)) }));

    Promise.all([
      fetch('/api/v1/deliveries/calculate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationCountry: formData.country || 'TN',
          destinationState: formData.state || 'Tunis',
          items: quoteItems,
          subtotalTnd: currentSubtotalAfterDiscount,
          freeShippingCoupon: Boolean(appliedCoupon?.freeShipping || appliedCoupon?.type === 'FREE_SHIPPING'),
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('/api/v1/deliveries/showrooms-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: quoteItems }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([quoteRes, showRes]) => {
        if (cancelled) return;
        const qData = quoteRes?.data || quoteRes;
        const quotes = Array.isArray(qData?.quotes) ? qData.quotes : [];
        setDeliveryQuotes(quotes);
        if (quotes.length > 0) {
          setSelectedDeliveryCompanyId((prev) => {
            if (prev && quotes.some((q: any) => q.companyId === prev && q.available)) return prev;
            const firstAvail = quotes.find((q: any) => q.available) || quotes[0];
            return firstAvail?.companyId || '';
          });
        }

        const sData = showRes?.data || showRes;
        const showList = Array.isArray(sData?.showrooms) ? sData.showrooms : [];
        setShowrooms(showList);
        if (showList.length > 0) {
          setSelectedShowroomId((prev) => {
            if (prev && showList.some((s: any) => s.id === prev)) return prev;
            const firstInStock = showList.find((s: any) => s.inShowroomStock) || showList[0];
            return firstInStock?.id || '';
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDeliveryOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    loadingCart,
    items,
    formData.country,
    formData.state,
    currentSubtotalAfterDiscount,
    appliedCoupon,
  ]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponError('');
    try {
      const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
      const res = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCodeInput.trim().toUpperCase(),
          orderAmount: subtotal,
          customerEmail: formData.email.trim() || undefined,
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
        setAppliedCoupon({
          code: data.data.coupon.code,
          discountAmount: data.data.discountAmount,
          type: data.data.coupon?.type,
          freeShipping: Boolean(data.data.freeShipping || data.data.coupon?.type === 'FREE_SHIPPING'),
        });
        setFormData((prev) => ({ ...prev, couponCode: data.data.coupon.code }));
      } else {
        setCouponError(data.message || 'Code promo invalide.');
      }
    } catch {
      setCouponError('Erreur de validation.');
    }
  };

  const selectedQuote = deliveryQuotes.find((q) => q.companyId === selectedDeliveryCompanyId) || null;
  const selectedShowroom = showrooms.find((s) => s.id === selectedShowroomId) || null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setSubmitError('Votre panier est vide. Ajoutez au moins un article avant de valider.');
      return;
    }
    if (fulfillmentType === 'DELIVERY' && selectedQuote && !selectedQuote.available) {
      setSubmitError('Ce transporteur ne couvre pas votre zone/poids. Veuillez en choisir un autre ou sélectionner le retrait en showroom.');
      return;
    }
    if (fulfillmentType === 'SHOWROOM_PICKUP' && showrooms.length > 0 && !selectedShowroomId) {
      setSubmitError('Veuillez sélectionner le showroom pour votre retrait en magasin.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        items: items.map((it) => ({
          variantId: it.variantId,
          quantity: it.quantity,
        })),
        guestInfo: {
          ...(formData.email.trim() ? { email: formData.email.trim() } : {}),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
        },
        shippingAddress: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          ...(formData.street.trim() || formData.street2.trim()
            ? {
                street: formData.street.trim() || formData.street2.trim(),
                street2: formData.street2.trim(),
              }
            : {}),
          city: formData.city.trim(),
          state: formData.state,
          ...(formData.postalCode.trim() ? { postalCode: formData.postalCode.trim() } : {}),
          country: formData.country,
        },
        paymentMethod:
          selectedGatewayCode === 'FLOUCI' || selectedGatewayCode === 'CLICTOPAY'
            ? 'CARD_ONLINE'
            : selectedGatewayCode === 'BANK_TRANSFER'
            ? 'BANK_TRANSFER'
            : 'CASH_ON_DELIVERY',
        fulfillmentType,
        deliveryCompanyId: fulfillmentType === 'DELIVERY' ? selectedDeliveryCompanyId || undefined : undefined,
        pickupShowroomId: fulfillmentType === 'SHOWROOM_PICKUP' ? selectedShowroomId || undefined : undefined,
        deliveryMethod:
          fulfillmentType === 'SHOWROOM_PICKUP'
            ? `SHOWROOM_PICKUP:${selectedShowroom?.code || ''}`
            : selectedQuote?.code || formData.deliveryMethod,
        couponCode: appliedCoupon?.code || undefined,
        notes: [
          formData.notes,
          selectedGatewayCode === 'FLOUCI' ? '[Passerelle Flouci TND]' : selectedGatewayCode === 'CLICTOPAY' ? '[Passerelle ClicToPay SMT]' : '',
        ]
          .filter(Boolean)
          .join(' ') || undefined,
      };

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: getCartHeaders(true),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.data?.reference) {
        const orderTotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
        trackMarketingEvent('Purchase', {
          value: orderTotal,
          transaction_id: data.data.reference,
          content_ids: items.map((it) => it.productId || it.variantId),
        });
        await useCartStore.getState().clearCart();

        if (selectedGatewayCode === 'FLOUCI') {
          try {
            const initRes = await fetch('/api/v1/storefront-cms/payments/flouci/init', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderReference: data.data.reference,
                amountTnd: finalTotal,
              }),
            });
            const initJson = await initRes.json();
            const paymentUrl = initJson?.data?.paymentUrl || initJson?.paymentUrl;
            if (initRes.ok && paymentUrl) {
              window.location.href = paymentUrl;
              return;
            }
          } catch {
            // Fallback cleanly to confirmation page if Flouci portal unreachable
          }
        }
        router.push(`/order-confirmation/${data.data.reference}`);
      } else {
        setSubmitError(data.message || 'Échec de la validation de commande. Veuillez vérifier vos données.');
      }
    } catch {
      setSubmitError('Erreur réseau lors de la passation de commande.');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const isFreeShippingCoupon = Boolean(appliedCoupon?.freeShipping || appliedCoupon?.type === 'FREE_SHIPPING');
  const shippingCost =
    subtotal === 0 || fulfillmentType === 'SHOWROOM_PICKUP' || isFreeShippingCoupon
      ? 0
      : selectedQuote && selectedQuote.available
        ? Number(selectedQuote.feeTnd)
        : subtotalAfterDiscount >= shippingThreshold
          ? 0
          : standardShippingFee;
  const taxAmount = Number((subtotalAfterDiscount * (vatRate / 100)).toFixed(3));
  const finalTotal = Number((subtotalAfterDiscount + shippingCost).toFixed(3));
  const stateOptions =
    geoCountries.find((c) => c.code === (formData.country || 'TN'))?.states?.map((s) => s.name) ||
    TUNISIAN_GOVERNORATES;

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10 sm:py-12">
      <StorefrontPageHeader
        title={t('checkout.title')}
        breadcrumbLabel={t('actions.checkout')}
        badge={
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs uppercase tracking-widest font-bold text-[var(--royal-gold-dark)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
            <span>{t('checkout.badge')}</span>
          </div>
        }
        rightSlot={
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#0C1A14]/70 bg-white px-4 py-2 rounded-full border border-[#EFECE6]">
            <Lock className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
            <span>{t('checkout.ssl_badge')}</span>
          </div>
        }
      />

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Form (Steps) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Contact Information */}
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-7 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold">
                    {t('checkout.step1')}
                  </h2>
                </div>
                {prefilledFromProfile && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('checkout.prefilled')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                    {t('checkout.first_name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ex: Mehdi"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                    {t('checkout.last_name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ex: Trabelsi"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                    {t('checkout.email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="votre.email@domaine.tn"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                    {t('checkout.phone')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+216 98 123 456"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Address */}
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold">
                  {t('checkout.step2')}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                    Complément d&apos;adresse (étage, résidence, repère — Optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.street2}
                    onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                    placeholder="Ex: Résidence Les Palmiers, Bloc B, Apt 12"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                      Pays *
                    </label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => {
                        const nextC = e.target.value;
                        const nextStates = geoCountries.find((c) => c.code === nextC)?.states || [];
                        setFormData({
                          ...formData,
                          country: nextC,
                          state: nextStates[0]?.name || (nextC === 'TN' ? 'Mahdia' : ''),
                        });
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                    >
                      {(geoCountries.length > 0
                        ? geoCountries
                        : [{ code: 'TN', nameFr: 'Tunisie', states: [] }]
                      ).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.nameFr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                      Gouvernorat / État *
                    </label>
                    <select
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                    >
                      {stateOptions.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                      Ville / Municipalité *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Ex: Mahdia"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                      Code Postal (Optionnel)
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="5100"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Delivery Options (Carrier Calculation vs Showroom Pickup) */}
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold">
                    {t('checkout.step3')}
                  </h2>
                </div>
                {loadingDeliveryOptions && (
                  <span className="text-[11px] font-semibold text-[#9A7414]">Calcul en cours...</span>
                )}
              </div>

              {/* Fulfillment Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('DELIVERY')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                    fulfillmentType === 'DELIVERY'
                      ? 'border-[#D4AF37] bg-[#FBF9F5] ring-2 ring-[#D4AF37]/20'
                      : 'border-[#EFECE6] bg-white hover:border-[#D4AF37]/50'
                  }`}
                >
                  <Truck className="w-5 h-5 text-[#9A7414] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm text-[#0C1A14]">Livraison par Transporteur</div>
                    <div className="text-[11px] text-[#0C1A14]/60 mt-0.5">
                      Tarif dynamique selon Distance, Poids ou Forfait
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('SHOWROOM_PICKUP')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                    fulfillmentType === 'SHOWROOM_PICKUP'
                      ? 'border-[#D4AF37] bg-[#FBF9F5] ring-2 ring-[#D4AF37]/20'
                      : 'border-[#EFECE6] bg-white hover:border-[#D4AF37]/50'
                  }`}
                >
                  <Store className="w-5 h-5 text-[#9A7414] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm text-[#0C1A14] flex items-center gap-2">
                      <span>Retrait en Showroom</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        GRATUIT
                      </span>
                    </div>
                    <div className="text-[11px] text-[#0C1A14]/60 mt-0.5">
                      Retirez dans un magasin Royal (réassort auto si nécessaire)
                    </div>
                  </div>
                </button>
              </div>

              {fulfillmentType === 'DELIVERY' ? (
                <div className="space-y-3">
                  {deliveryQuotes.length === 0 ? (
                    <label className="p-5 rounded-2xl border border-[#D4AF37] bg-[#FBF9F5] cursor-pointer transition flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-[#0C1A14]" />
                            <span className="font-semibold text-sm text-[#0C1A14]">Livraison Standard</span>
                          </div>
                          <p className="text-xs text-[#0C1A14]/60 mt-1">Délai estimé 24h à 48h partout en Tunisie</p>
                        </div>
                        <span className="text-xs font-bold text-[#0C1A14]">
                          {subtotalAfterDiscount >= shippingThreshold ? 'GRATUIT' : `${standardShippingFee.toFixed(3)} TND`}
                        </span>
                      </div>
                    </label>
                  ) : (
                    deliveryQuotes.map((q) => {
                      const isSelected = selectedDeliveryCompanyId === q.companyId;
                      return (
                        <label
                          key={q.companyId}
                          onClick={() => q.available && setSelectedDeliveryCompanyId(q.companyId)}
                          className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            !q.available
                              ? 'border-rose-200 bg-rose-50/40 opacity-75 cursor-not-allowed'
                              : isSelected
                                ? 'border-[#D4AF37] bg-[#FBF9F5] ring-2 ring-[#D4AF37]/20 cursor-pointer'
                                : 'border-[#EFECE6] bg-white hover:border-[#D4AF37]/60 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="deliveryCompanyId"
                              checked={isSelected}
                              disabled={!q.available}
                              onChange={() => q.available && setSelectedDeliveryCompanyId(q.companyId)}
                              className="accent-[var(--royal-primary)] mt-1"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-[#0C1A14]">{q.name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E6D6A6] text-[#9A7414]">
                                  {q.method === 'DISTANCE'
                                    ? `Distance ${q.distanceKm} km`
                                    : q.method === 'WEIGHT'
                                      ? `Poids ${q.totalWeightKg} kg`
                                      : 'Tarif Fixe'}
                                </span>
                                {q.estimatedDays && (
                                  <span className="text-[11px] text-[#0C1A14]/60">({q.estimatedDays})</span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#0C1A14]/60 flex items-center gap-1.5 flex-wrap">
                                <MapPin className="w-3 h-3 text-[#C59B27]" />
                                <span>
                                  Expédition {q.originState} ➔ {formData.state}
                                </span>
                                <span>•</span>
                                <span>{q.matchedBracketLabel}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {!q.available ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Hors plage
                              </span>
                            ) : q.feeTnd === 0 ? (
                              <div className="flex flex-col items-end">
                                {Number(q.originalFeeTnd || 0) > 0 && (
                                  <span className="text-[11px] font-mono line-through text-[#0C1A14]/40">
                                    {Number(q.originalFeeTnd).toFixed(3)} TND
                                  </span>
                                )}
                                <span className="text-sm font-black text-emerald-700 uppercase">Gratuit</span>
                              </div>
                            ) : (
                              <span className="text-sm font-black font-mono text-[#0C1A14]">
                                {Number(q.feeTnd).toFixed(3)} TND
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {showrooms.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 text-xs text-amber-900">
                      Aucun showroom actif trouvé. Choisissez la livraison par transporteur ou contactez le support.
                    </div>
                  ) : (
                    showrooms.map((sh) => {
                      const isSelected = selectedShowroomId === sh.id;
                      return (
                        <label
                          key={sh.id}
                          onClick={() => setSelectedShowroomId(sh.id)}
                          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#FBF9F5] ring-2 ring-[#D4AF37]/20'
                              : 'border-[#EFECE6] bg-white hover:border-[#D4AF37]/60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="pickupShowroomId"
                              checked={isSelected}
                              onChange={() => setSelectedShowroomId(sh.id)}
                              className="accent-[var(--royal-primary)] mt-1"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-[#0C1A14]">{sh.name}</span>
                                {sh.inShowroomStock ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    En Stock Immédiat
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    Transfert Inter-Dépôts Automatique (DTR)
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#0C1A14]/60">
                                {sh.address || sh.city} {sh.phone ? `• ${sh.phone}` : ''}
                              </div>
                              {!sh.inShowroomStock && sh.requiresTransferRequest && (
                                <p className="text-[11px] text-amber-800 font-medium">
                                  Votre commande est enregistrée immédiatement et déclenche une demande de transfert vers ce showroom.
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-700 uppercase">0.000 TND</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Payment Options */}
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 text-xs font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold">
                  {t('checkout.step4')}
                </h2>
              </div>

              <div className="space-y-4">
                <label className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition flex items-start gap-3 sm:gap-4 ${selectedGatewayCode === 'CASH_ON_DELIVERY' ? 'border-[#D4AF37] bg-[#FBF9F5]' : 'border-[#EFECE6] bg-white'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    checked={selectedGatewayCode === 'CASH_ON_DELIVERY'}
                    onChange={() => setSelectedGatewayCode('CASH_ON_DELIVERY')}
                    className="accent-[var(--royal-primary)] mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span className="font-semibold text-sm text-[#0C1A14]">
                        {fulfillmentType === 'SHOWROOM_PICKUP'
                          ? 'Payer sur place (au showroom)'
                          : t('checkout.cod')}
                      </span>
                    </div>
                    <p className="text-xs text-[#0C1A14]/60 mt-1">
                      {fulfillmentType === 'SHOWROOM_PICKUP'
                        ? 'Réglez directement sur place lors du retrait de votre commande au showroom choisi.'
                        : t('cart.cod_note')}
                    </p>
                  </div>
                </label>

                {publicGateways.flouci?.isPubliclyVisible && (
                  <label className={`p-5 rounded-2xl border cursor-pointer transition flex items-start gap-4 ${selectedGatewayCode === 'FLOUCI' ? 'border-[#D4AF37] bg-[#FBF9F5]' : 'border-[#EFECE6] bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="FLOUCI"
                      checked={selectedGatewayCode === 'FLOUCI'}
                      onChange={() => setSelectedGatewayCode('FLOUCI')}
                      className="accent-[var(--royal-primary)] mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-[#C59B27]" />
                        <span className="font-semibold text-sm text-[#0C1A14]">
                          {publicGateways.flouci.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#0C1A14]/60 mt-1">
                        {publicGateways.flouci.description}
                      </p>
                    </div>
                  </label>
                )}

                {publicGateways.clictopay?.isPubliclyVisible && (
                  <label className={`p-5 rounded-2xl border cursor-pointer transition flex items-start gap-4 ${selectedGatewayCode === 'CLICTOPAY' ? 'border-[#D4AF37] bg-[#FBF9F5]' : 'border-[#EFECE6] bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CLICTOPAY"
                      checked={selectedGatewayCode === 'CLICTOPAY'}
                      onChange={() => setSelectedGatewayCode('CLICTOPAY')}
                      className="accent-[var(--royal-primary)] mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[#C59B27]" />
                        <span className="font-semibold text-sm text-[#0C1A14]">
                          {publicGateways.clictopay.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#0C1A14]/60 mt-1">
                        {publicGateways.clictopay.description}
                      </p>
                    </div>
                  </label>
                )}

                {publicGateways.bankTransferEnabled && (
                  <label className={`p-5 rounded-2xl border cursor-pointer transition flex items-start gap-4 ${selectedGatewayCode === 'BANK_TRANSFER' ? 'border-[#D4AF37] bg-[#FBF9F5]' : 'border-[#EFECE6] bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={selectedGatewayCode === 'BANK_TRANSFER'}
                      onChange={() => setSelectedGatewayCode('BANK_TRANSFER')}
                      className="accent-[var(--royal-primary)] mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-slate-700" />
                        <span className="font-semibold text-sm text-[#0C1A14]">
                          Virement Bancaire (RIB Société)
                        </span>
                      </div>
                      <p className="text-xs text-[#0C1A14]/60 mt-1">
                        {publicGateways.bankRib ? `RIB : ${publicGateways.bankRib}` : 'Les coordonnées bancaires sont transmises sur votre bon de commande.'}
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Step 5: Customer Notes */}
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-7 shadow-sm">
              <label className="block text-xs font-semibold text-[#0C1A14] mb-2 uppercase tracking-wider">
                {fulfillmentType === 'SHOWROOM_PICKUP'
                  ? 'Instructions particulières pour le retrait en showroom (Optionnel)'
                  : 'Instructions particulières pour le livreur (Optionnel)'}
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ex: Sonner à l'interphone 4B ou appeler 10 min avant votre arrivée..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-7 shadow-sm sticky top-28">
              <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold pb-4 border-b border-[#EFECE6] flex items-center justify-between">
                <span>{t('cart.summary_title')}</span>
                <span className="text-xs font-sans text-[#0C1A14]/50">{items.length} {t('catalog.articles_word')}</span>
              </h2>

              {/* Items List Snapshot */}
              {!loadingCart && items.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="text-xs text-neutral-500">{t('cart.empty')}</p>
                  <Link
                    href="/articles"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] hover:bg-[var(--royal-primary-hover)] text-xs font-bold"
                  >
                    <span>{t('wishlist.discover_catalog')}</span>
                  </Link>
                </div>
              ) : (
                <div className="py-4 divide-y divide-[#EFECE6]">
                  {items.map((it) => (
                    <div key={it.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#FBF9F5] border border-[#EFECE6] flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                          <img src={getSafeImageUrl(it.image)} alt={it.productName} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[#0C1A14] line-clamp-1">{it.productName}</div>
                          <div className="text-[11px] text-[#0C1A14]/50 font-mono">{t('common.qty')} : {it.quantity}</div>
                        </div>
                      </div>
                      <div className="font-semibold text-[#0C1A14] shrink-0">
                        {it.lineTotal.toFixed(3)} {t('common.currency')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Promo code */}
              <div className="pt-4 pb-4 border-t border-[#EFECE6]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder={t('cart.coupon_placeholder')}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs font-mono uppercase focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-semibold hover:bg-[var(--royal-primary-hover)] transition shrink-0"
                  >
                    {t('auth.validate')}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isFreeShippingCoupon && discount <= 0 ? (
                        <>
                          Code promo <strong>{appliedCoupon.code}</strong> (Livraison offerte)
                        </>
                      ) : (
                        <>
                          {t('cart.discount')} <strong>{appliedCoupon.code}</strong> (-{appliedCoupon.discountAmount.toFixed(3)} {t('common.currency')})
                        </>
                      )}
                    </span>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-xs text-red-600">{couponError}</p>
                )}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-2.5 py-4 border-t border-[#EFECE6] text-xs text-[#0C1A14]/70">
                <div className="flex justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-medium text-[#0C1A14]">{(subtotalAfterDiscount / (1 + vatRate / 100)).toFixed(3)} {t('common.currency')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>{isFreeShippingCoupon && discount <= 0 ? 'Avantage Livraison' : t('cart.discount')}</span>
                    <span>
                      {isFreeShippingCoupon && discount <= 0
                        ? 'Livraison offerte'
                        : `-${discount.toFixed(3)} ${t('common.currency')}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('cart.tax')}</span>
                  <span className="font-medium text-[#0C1A14]">{taxAmount.toFixed(3)} {t('common.currency')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cart.shipping')}</span>
                  {shippingCost === 0 ? (
                    <span className="text-emerald-700 font-semibold uppercase">{t('cart.free')}</span>
                  ) : (
                    <span className="font-semibold text-[#0C1A14]">{shippingCost.toFixed(3)} {t('common.currency')}</span>
                  )}
                </div>
              </div>

              {/* Total & Submit */}
              <div className="pt-4 border-t border-[#EFECE6] space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-sans font-bold tracking-tight text-base font-bold text-[#0C1A14]">{t('cart.total')}</span>
                  <span className="font-sans font-bold tracking-tight text-3xl font-extrabold text-[#0C1A14]">
                    {finalTotal.toFixed(3)} <span className="text-base font-normal">{t('common.currency')}</span>
                  </span>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs uppercase font-bold tracking-widest hover:bg-[var(--royal-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                >
                  {submitting ? (
                    <span>{t('checkout.processing')}</span>
                  ) : (
                    <>
                      <span>{t('checkout.confirm_order')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-[11px] text-center text-[#0C1A14]/50 leading-relaxed space-y-1">
                  <p>En confirmant, vous acceptez les conditions générales de vente Maison Royal.</p>
                  <p className="flex items-center justify-center gap-1.5 text-emerald-800 font-medium pt-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Paiement garanti et protection acheteur intégrée</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
