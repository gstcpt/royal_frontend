'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { getCartHeaders, getSafeImageUrl } from '@/lib/cart-session';
import { trackMarketingEvent } from '@/components/storefront/MarketingPixelsTracker';
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

const TUNISIAN_GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Béja',
  'Jendouba',
  'Le Kef',
  'Siliana',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Gabès',
  'Médenine',
  'Tataouine',
  'Gafsa',
  'Tozeur',
  'Kébili',
];

const EMPTY_CART_ITEMS: CartItem[] = [];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, fetchMe } = useAuthStore();
  const storeCart = useCartStore((s) => s.cart);
  const storeCartItems = React.useMemo(() => storeCart?.items ?? EMPTY_CART_ITEMS, [storeCart]);

  // Cart state
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [shippingThreshold, setShippingThreshold] = useState<number>(150.0);
  const [standardShippingFee, setStandardShippingFee] = useState<number>(7.0);

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
  } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
        const [res, cfgRes] = await Promise.all([
          fetch('/api/v1/cart', { headers: getCartHeaders(), credentials: 'include' }),
          fetch('/api/v1/storefront-cms/config').catch(() => null),
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
        }
      } catch (e) {
        console.error('Error fetching cart for checkout', e);
      } finally {
        setLoadingCart(false);
      }
    }

    loadCart();
  }, []);

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
        });
        setFormData((prev) => ({ ...prev, couponCode: data.data.coupon.code }));
      } else {
        setCouponError(data.message || 'Code promo invalide.');
      }
    } catch {
      setCouponError('Erreur de validation.');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setSubmitError('Votre panier est vide. Ajoutez au moins un article avant de valider.');
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
        paymentMethod: formData.paymentMethod,
        deliveryMethod: formData.deliveryMethod,
        couponCode: appliedCoupon?.code || undefined,
        notes: formData.notes || undefined,
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
  const shippingCost = subtotalAfterDiscount >= shippingThreshold || subtotal === 0 ? 0 : standardShippingFee;
  const taxAmount = Number((subtotalAfterDiscount * 0.19).toFixed(3));
  const finalTotal = Number((subtotalAfterDiscount + shippingCost).toFixed(3));

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 py-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EFECE6] pb-6 mb-10">
        <div>
          <span className="text-xs uppercase font-semibold text-[#D4AF37] tracking-widest block mb-1">
            Tunnel de Commande Sécurisé
          </span>
          <h1 className="font-sans font-bold tracking-tight text-3xl sm:text-4xl text-[#0C1A14] font-medium tracking-tight">
            Finalisation de Commande
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#0C1A14]/70 bg-white px-4 py-2 rounded-full border border-[#EFECE6]">
          <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Chiffrement bancaire SSL 256 bits</span>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Form (Steps) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Contact Information */}
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-7 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold">
                    Coordonnées &amp; Contact
                  </h2>
                </div>
                {prefilledFromProfile && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pré-rempli depuis votre compte Royal
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                    Prénom *
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
                    Nom de famille *
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
                    Adresse Email (Optionnel)
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
                    Téléphone (pour le livreur) *
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
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold">
                  Adresse de Livraison en Tunisie
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                      Gouvernorat *
                    </label>
                    <select
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-sm focus:outline-none focus:border-[#D4AF37]"
                    >
                      {TUNISIAN_GOVERNORATES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                      Ville / Délégation *
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

            {/* Step 3: Delivery Options */}
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold">
                  Mode d'Expédition
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="p-5 rounded-2xl border border-[#D4AF37] bg-[#FBF9F5] cursor-pointer transition flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#0C1A14]" />
                        <span className="font-semibold text-sm text-[#0C1A14]">Livraison à Domicile</span>
                      </div>
                      <p className="text-xs text-[#0C1A14]/60 mt-1">Délai estimé 24h à 48h partout en Tunisie</p>
                    </div>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="STANDARD_HOME"
                      checked
                      readOnly
                      className="accent-[var(--royal-primary)] mt-1"
                    />
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFECE6] text-xs font-semibold">
                    {subtotalAfterDiscount >= shippingThreshold ? (
                      <span className="text-emerald-700">GRATUIT (Commande &ge; {shippingThreshold.toFixed(0)} TND)</span>
                    ) : (
                      <span className="text-[#0C1A14]">{standardShippingFee.toFixed(3)} TND</span>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Step 4: Payment Options (Cash on Delivery Only) */}
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold">
                  Mode de Règlement Sécurisé
                </h2>
              </div>

              <div className="space-y-4">
                <label className="p-5 rounded-2xl border border-[#D4AF37] bg-[#FBF9F5] cursor-pointer transition flex items-start gap-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    checked
                    readOnly
                    className="accent-[var(--royal-primary)] mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-emerald-700" />
                      <span className="font-semibold text-sm text-[#0C1A14]">
                        Paiement à la livraison (Espèces)
                      </span>
                    </div>
                    <p className="text-xs text-[#0C1A14]/60 mt-1">
                      Réglez directement en espèces auprès du livreur lors de la réception de votre colis.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 5: Customer Notes */}
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-7 shadow-sm">
              <label className="block text-xs font-semibold text-[#0C1A14] mb-2 uppercase tracking-wider">
                Instructions particulières pour le livreur (Optionnel)
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
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-7 shadow-sm sticky top-28">
              <h2 className="font-sans font-bold tracking-tight text-xl text-[#0C1A14] font-semibold pb-4 border-b border-[#EFECE6] flex items-center justify-between">
                <span>Votre Sélection</span>
                <span className="text-xs font-sans text-[#0C1A14]/50">{items.length} article(s)</span>
              </h2>

              {/* Items List Snapshot */}
              {!loadingCart && items.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="text-xs text-neutral-500">Votre panier est actuellement vide.</p>
                  <Link
                    href="/articles"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] hover:bg-[var(--royal-primary-hover)] text-xs font-bold"
                  >
                    <span>Explorer le Catalogue</span>
                  </Link>
                </div>
              ) : (
                <div className="py-4 divide-y divide-[#EFECE6]">
                  {items.map((it) => (
                    <div key={it.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#FBF9F5] border border-[#EFECE6] flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                          <img src={getSafeImageUrl(it.image)} alt={it.productName} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="font-medium text-[#0C1A14] line-clamp-1">{it.productName}</div>
                          <div className="text-[11px] text-[#0C1A14]/50 font-mono">Qté : {it.quantity}</div>
                        </div>
                      </div>
                      <div className="font-semibold text-[#0C1A14]">
                        {it.lineTotal.toFixed(3)} TND
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
                    placeholder="Code promo (ex: ROYALVIP)"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs font-mono uppercase focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-semibold hover:bg-[var(--royal-primary-hover)] transition"
                  >
                    Valider
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> appliqué (-{appliedCoupon.discountAmount.toFixed(3)} TND)</span>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-xs text-red-600">{couponError}</p>
                )}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-2.5 py-4 border-t border-[#EFECE6] text-xs text-[#0C1A14]/70">
                <div className="flex justify-between">
                  <span>Sous-total HT estimé</span>
                  <span className="font-medium text-[#0C1A14]">{(subtotalAfterDiscount / 1.19).toFixed(3)} TND</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Remise privilège</span>
                    <span>-{discount.toFixed(3)} TND</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>TVA légale (19%)</span>
                  <span className="font-medium text-[#0C1A14]">{taxAmount.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de port</span>
                  {shippingCost === 0 ? (
                    <span className="text-emerald-700 font-semibold uppercase">Offerts</span>
                  ) : (
                    <span className="font-semibold text-[#0C1A14]">{shippingCost.toFixed(3)} TND</span>
                  )}
                </div>
              </div>

              {/* Total & Submit */}
              <div className="pt-4 border-t border-[#EFECE6] space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-sans font-bold tracking-tight text-base font-bold text-[#0C1A14]">Total TTC</span>
                  <span className="font-sans font-bold tracking-tight text-3xl font-extrabold text-[#0C1A14]">
                    {finalTotal.toFixed(3)} <span className="text-base font-normal">TND</span>
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
                    <span>Enregistrement sécurisé...</span>
                  ) : (
                    <>
                      <span>Confirmer et Commander</span>
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
