'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { Modal } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useI18nStore } from '@/stores/i18n.store';
import { getCartHeaders, getSafeImageUrl } from '@/lib/cart-session';
import { formatTndCurrency } from '@/lib/utils';
import { trackMarketingEvent } from './MarketingPixelsTracker';
import type { StorefrontProduct, StorefrontVariant } from './ProductCard';

export const TUNISIAN_GOVERNORATES = [
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

interface PublicGatewaysState {
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  bankRib?: string;
  flouci?: { enabled: boolean; isPubliclyVisible: boolean; label: string; description: string };
  clictopay?: { enabled: boolean; isPubliclyVisible: boolean; label: string; description: string };
}

export interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: StorefrontProduct;
  initialVariantId?: string;
  initialQuantity?: number;
}

export function QuickOrderModal({
  isOpen,
  onClose,
  product,
  initialVariantId,
  initialQuantity = 1,
}: QuickOrderModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useI18nStore();

  const [variants, setVariants] = useState<StorefrontVariant[]>(product.variants || []);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialVariantId || product.variants?.[0]?.id || '',
  );
  const [quantity, setQuantity] = useState<number>(Math.max(1, initialQuantity || 1));

  const [shippingThreshold, setShippingThreshold] = useState<number>(150.0);
  const [standardShippingFee, setStandardShippingFee] = useState<number>(7.0);
  const [publicGateways, setPublicGateways] = useState<PublicGatewaysState>({
    codEnabled: true,
    bankTransferEnabled: false,
  });
  const [selectedGatewayCode, setSelectedGatewayCode] = useState<
    'CASH_ON_DELIVERY' | 'FLOUCI' | 'CLICTOPAY' | 'BANK_TRANSFER'
  >('CASH_ON_DELIVERY');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '+216 ',
    email: '',
    state: 'Mahdia',
    city: '',
    street: '',
    postalCode: '',
    notes: '',
  });
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Sync variant & initial quantity when opened on a product
  useEffect(() => {
    if (!isOpen) return;
    setSubmitError('');
    setCouponError('');
    setAppliedCoupon(null);
    setQuantity(Math.max(1, initialQuantity || 1));
    const initVars = product.variants || [];
    setVariants(initVars);
    setSelectedVariantId(initialVariantId || initVars[0]?.id || '');

    // Ensure full variants exist if lightweight card object omitted variants
    if (initVars.length === 0 && product.slug) {
      fetch(`/api/v1/products/slug/${encodeURIComponent(product.slug)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          const full = res?.data || res;
          if (full?.variants && Array.isArray(full.variants) && full.variants.length > 0) {
            setVariants(full.variants);
            setSelectedVariantId(initialVariantId || full.variants[0].id);
          }
        })
        .catch(() => null);
    }

    // Fetch storefront shipping threshold & active gateways
    Promise.all([
      fetch('/api/v1/storefront-cms/config').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/v1/storefront-cms/public-payment-gateways').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([cfgJson, gwJson]) => {
      const cfg = cfgJson?.data || cfgJson;
      if (cfg?.freeShippingThreshold !== undefined) {
        setShippingThreshold(Number(cfg.freeShippingThreshold));
      }
      if (cfg?.standardShippingFee !== undefined) {
        setStandardShippingFee(Number(cfg.standardShippingFee));
      }
      const gw = gwJson?.data || gwJson;
      if (gw) setPublicGateways(gw);
    });
  }, [isOpen, product.id, product.slug, product.variants, initialVariantId, initialQuantity]);

  // Prefill from authenticated customer profile when available
  useEffect(() => {
    if (!isOpen || !user) return;
    setFormData((prev) => ({
      ...prev,
      email: prev.email || user.email || '',
      firstName: prev.firstName || user.firstName || '',
      lastName: prev.lastName || user.lastName || '',
      phone:
        (prev.phone === '+216 ' || !prev.phone.trim()) && user.phone
          ? user.phone
          : prev.phone,
    }));

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
  }, [isOpen, user]);

  const activeVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) || variants[0] || null,
    [variants, selectedVariantId],
  );

  const hasPromo =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    Number(product.discountPrice) > 0 &&
    Number(product.discountPrice) < Number(product.sellingPrice);

  const baseUnitPrice = hasPromo
    ? Number(product.discountPrice)
    : Number(product.sellingPrice || 0);

  const unitPrice = useMemo(() => {
    if (activeVariant?.sellingPrice && Number(activeVariant.sellingPrice) > 0) {
      return Number(activeVariant.sellingPrice);
    }
    return baseUnitPrice;
  }, [activeVariant, baseUnitPrice]);

  const subtotal = Number((unitPrice * quantity).toFixed(3));
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const shippingCost =
    subtotalAfterDiscount >= shippingThreshold || subtotal === 0 ? 0 : standardShippingFee;
  const taxAmount = Number((subtotalAfterDiscount * 0.19).toFixed(3));
  const finalTotal = Number((subtotalAfterDiscount + shippingCost).toFixed(3));

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    try {
      const res = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim().toUpperCase(),
          orderAmount: subtotal,
          customerEmail: formData.email.trim() || undefined,
          items: [
            {
              productId: product.id,
              variantId: activeVariant?.id,
              quantity,
              unitPrice,
            },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.data?.valid) {
        setAppliedCoupon({
          code: data.data.coupon.code,
          discountAmount: data.data.discountAmount,
        });
        setCouponInput(data.data.coupon.code);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || 'Code promo invalide.');
      }
    } catch {
      setCouponError('Erreur de validation du code promo.');
    }
  };

  const handleSubmitQuickOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVariant?.id) {
      setSubmitError('Aucune variante disponible pour cet article.');
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      setSubmitError('Veuillez saisir votre nom complet et votre numéro de téléphone.');
      return;
    }
    if (!formData.city.trim() || !formData.street.trim()) {
      setSubmitError('Veuillez renseigner la ville/délégation et l’adresse de livraison.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        items: [{ variantId: activeVariant.id, quantity }],
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
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state,
          ...(formData.postalCode.trim() ? { postalCode: formData.postalCode.trim() } : {}),
          country: 'TN',
        },
        paymentMethod:
          selectedGatewayCode === 'FLOUCI' || selectedGatewayCode === 'CLICTOPAY'
            ? 'CARD_ONLINE'
            : selectedGatewayCode === 'BANK_TRANSFER'
            ? 'BANK_TRANSFER'
            : 'CASH_ON_DELIVERY',
        deliveryMethod: 'STANDARD_HOME',
        couponCode: appliedCoupon?.code || undefined,
        notes:
          [
            '[Commande Rapide]',
            formData.notes,
            selectedGatewayCode === 'FLOUCI'
              ? '[Passerelle Flouci TND]'
              : selectedGatewayCode === 'CLICTOPAY'
              ? '[Passerelle ClicToPay SMT]'
              : '',
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
        trackMarketingEvent('Purchase', {
          value: subtotalAfterDiscount,
          transaction_id: data.data.reference,
          content_ids: [product.id],
        });

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
              onClose();
              window.location.href = paymentUrl;
              return;
            }
          } catch {
            // fallback cleanly to confirmation page
          }
        }

        onClose();
        router.push(`/order-confirmation/${data.data.reference}`);
      } else {
        setSubmitError(
          data.message || 'Impossible de valider cette commande rapide. Vérifiez vos champs.',
        );
      }
    } catch {
      setSubmitError('Erreur réseau lors de la soumission de la commande.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('actions.quick_order')}
      subtitle={`${product.name} • SKU ${activeVariant?.sku || product.sku}`}
      size="4xl"
      type="custom"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
            <span>Achat direct sans modifier votre panier actuel</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold cursor-pointer"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              form="royal-quick-order-form"
              disabled={submitting || !activeVariant?.id}
              className="px-5 py-2.5 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('checkout.processing')}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    {t('checkout.confirm_order')} • {formatTndCurrency(finalTotal)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="royal-quick-order-form"
        onSubmit={handleSubmitQuickOrder}
        className="p-4 sm:p-6 overflow-x-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Variant + Qty + Shipping Form + Payment */}
          <div className="lg:col-span-7 space-y-5 min-w-0">
            {/* Article Snapshot, Variants & Quantity */}
            <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#EFECE6] space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#EFECE6] overflow-hidden shrink-0">
                  <img
                    src={getSafeImageUrl(product.primaryImage)}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--royal-primary)] block">
                    {product.brand?.name || 'Royal'} • {activeVariant?.sku || product.sku}
                  </span>
                  <h4 className="font-heading font-bold text-sm text-neutral-950 line-clamp-2">
                    {product.name}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-black text-sm text-neutral-950 font-mono">
                      {formatTndCurrency(unitPrice)}
                    </span>
                    {hasPromo && (
                      <span className="text-xs text-neutral-400 line-through font-mono">
                        {formatTndCurrency(product.sellingPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {variants.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#EFECE6]">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block">
                    {t('storefront.variant_finish')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {variants.map((v) => {
                      const isSel = activeVariant?.id === v.id;
                      const colHex = v.attributesJson?.colorHex;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                            isSel
                              ? 'border-[var(--royal-primary)] bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold shadow-xs'
                              : 'border-[#EFECE6] bg-white text-neutral-800 hover:border-[var(--royal-primary)]/50'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {colHex && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: colHex }}
                              />
                            )}
                            <span className="truncate">{v.name}</span>
                          </span>
                          {v.sellingPrice ? (
                            <span className="font-mono text-[11px] shrink-0">
                              {formatTndCurrency(v.sellingPrice)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#EFECE6]">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  {t('common.qty')}
                </span>
                <div className="flex items-center gap-3 bg-white rounded-full px-3 py-1.5 border border-[#EFECE6]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 rounded-full hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-black text-neutral-950 font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 rounded-full hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Client Contact & Delivery Address */}
            <div className="p-4 rounded-2xl bg-white border border-[#EFECE6] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#0C1A14] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
                  <span>Coordonnées &amp; Adresse de Livraison</span>
                </h5>
                {prefilledFromProfile && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t('checkout.prefilled')}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    {t('checkout.first_name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ex: Mehdi"
                    className="w-full min-w-0 px-3.5 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    {t('checkout.last_name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ex: Trabelsi"
                    className="w-full min-w-0 px-3.5 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    {t('checkout.phone')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+216 XX XXX XXX"
                    className="w-full min-w-0 px-3.5 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    {t('checkout.email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@exemple.tn"
                    className="w-full min-w-0 px-3.5 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Gouvernorat *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full min-w-0 px-3 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    {TUNISIAN_GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Ville / Délégation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: Mahdia"
                    className="w-full min-w-0 px-3.5 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Code Postal
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="5100"
                    className="w-full min-w-0 px-3.5 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  <MapPin className="w-3 h-3 inline mr-1 text-[var(--royal-primary)]" />
                  Adresse complète (Rue, Immeuble, Appartement) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Ex: Avenue Habib Bourguiba, Résidence El Amen Apt 4"
                  className="w-full min-w-0 px-3.5 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Notes pour le livreur (Optionnel)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Appeler 15 min avant la livraison..."
                  className="w-full min-w-0 px-3.5 py-2 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Payment Gateways */}
            <div className="p-4 rounded-2xl bg-white border border-[#EFECE6] space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#0C1A14]">
                {t('checkout.step4')}
              </h5>
              <div className="grid grid-cols-1 gap-2">
                <label
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition ${
                    selectedGatewayCode === 'CASH_ON_DELIVERY'
                      ? 'border-[#D4AF37] bg-[#FBF9F5]'
                      : 'border-[#EFECE6] bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="quickOrderPayment"
                    checked={selectedGatewayCode === 'CASH_ON_DELIVERY'}
                    onChange={() => setSelectedGatewayCode('CASH_ON_DELIVERY')}
                    className="accent-[var(--royal-primary)]"
                  />
                  <Banknote className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-xs font-semibold text-[#0C1A14]">
                    {t('checkout.cod')}
                  </span>
                </label>

                {publicGateways.flouci?.isPubliclyVisible && (
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition ${
                      selectedGatewayCode === 'FLOUCI'
                        ? 'border-[#D4AF37] bg-[#FBF9F5]'
                        : 'border-[#EFECE6] bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quickOrderPayment"
                      checked={selectedGatewayCode === 'FLOUCI'}
                      onChange={() => setSelectedGatewayCode('FLOUCI')}
                      className="accent-[var(--royal-primary)]"
                    />
                    <Wallet className="w-4 h-4 text-[#C59B27] shrink-0" />
                    <span className="text-xs font-semibold text-[#0C1A14]">
                      {publicGateways.flouci.label}
                    </span>
                  </label>
                )}

                {publicGateways.clictopay?.isPubliclyVisible && (
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition ${
                      selectedGatewayCode === 'CLICTOPAY'
                        ? 'border-[#D4AF37] bg-[#FBF9F5]'
                        : 'border-[#EFECE6] bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quickOrderPayment"
                      checked={selectedGatewayCode === 'CLICTOPAY'}
                      onChange={() => setSelectedGatewayCode('CLICTOPAY')}
                      className="accent-[var(--royal-primary)]"
                    />
                    <CreditCard className="w-4 h-4 text-[#C59B27] shrink-0" />
                    <span className="text-xs font-semibold text-[#0C1A14]">
                      {publicGateways.clictopay.label}
                    </span>
                  </label>
                )}

                {publicGateways.bankTransferEnabled && (
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition ${
                      selectedGatewayCode === 'BANK_TRANSFER'
                        ? 'border-[#D4AF37] bg-[#FBF9F5]'
                        : 'border-[#EFECE6] bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quickOrderPayment"
                      checked={selectedGatewayCode === 'BANK_TRANSFER'}
                      onChange={() => setSelectedGatewayCode('BANK_TRANSFER')}
                      className="accent-[var(--royal-primary)]"
                    />
                    <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                    <span className="text-xs font-semibold text-[#0C1A14]">
                      Virement Bancaire (RIB Société)
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Coupon, Delivery & Financial Summary */}
          <div className="lg:col-span-5 space-y-4 min-w-0">
            <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#EFECE6] space-y-4">
              <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
                <span className="text-sm font-bold text-[#0C1A14] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[var(--royal-primary)]" />
                  {t('cart.summary_title')}
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  {quantity} × {unitPrice.toFixed(3)} TND
                </span>
              </div>

              {/* Coupon Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-700 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[var(--royal-primary)]" />
                  <span>{t('cart.coupon_label')}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder={t('cart.coupon_placeholder')}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#EFECE6] bg-white text-xs font-mono uppercase focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3.5 py-2 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold hover:bg-[var(--royal-primary-hover)] transition shrink-0 cursor-pointer"
                  >
                    {t('auth.validate')}
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {appliedCoupon.code} (-{appliedCoupon.discountAmount.toFixed(3)} TND)
                    </span>
                  </p>
                )}
                {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}
              </div>

              {/* Shipping Info */}
              <div className="p-3 rounded-xl bg-white border border-[#EFECE6] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Truck className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-[#0C1A14]">Livraison à Domicile</div>
                    <div className="text-[10px] text-neutral-500">Délai estimé 24h à 48h</div>
                  </div>
                </div>
                <span
                  className={`font-bold font-mono shrink-0 ${
                    shippingCost === 0 ? 'text-emerald-700' : 'text-[#0C1A14]'
                  }`}
                >
                  {shippingCost === 0 ? 'GRATUIT' : `${shippingCost.toFixed(3)} TND`}
                </span>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2 pt-2 border-t border-[#EFECE6] text-xs text-neutral-700">
                <div className="flex justify-between">
                  <span>{t('cart.subtotal')} HT</span>
                  <span className="font-mono font-semibold">
                    {(subtotalAfterDiscount / 1.19).toFixed(3)} {t('common.currency')}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>{t('cart.discount')}</span>
                    <span className="font-mono">
                      -{discount.toFixed(3)} {t('common.currency')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('cart.tax')}</span>
                  <span className="font-mono font-semibold">
                    {taxAmount.toFixed(3)} {t('common.currency')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cart.shipping')}</span>
                  <span className="font-mono font-semibold">
                    {shippingCost === 0
                      ? t('cart.free')
                      : `${shippingCost.toFixed(3)} ${t('common.currency')}`}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-[#EFECE6] flex justify-between items-baseline text-sm font-black text-[#0C1A14]">
                  <span>{t('cart.total')}</span>
                  <span className="font-mono text-lg text-[var(--royal-gold-dark)]">
                    {finalTotal.toFixed(3)} {t('common.currency')}
                  </span>
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {submitError}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
