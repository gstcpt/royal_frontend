'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Truck,
  Printer,
  ArrowRight,
  ShoppingBag,
  MapPin,
  CreditCard,
  XCircle,
} from 'lucide-react';
import {
  NINE_ORDER_STATUSES,
  ORDER_STATUS_LABEL_MAP,
  PrintableOrderSheet,
} from '@/components/common/PrintableOrderSheet';
import { getSafeImageUrl } from '@/lib/cart-session';
import { useI18nStore } from '@/stores/i18n.store';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderRef = params?.orderNumber as string;
  const { t } = useI18nStore();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderRef) return;
      try {
        const res = await fetch(`/api/v1/orders/${orderRef}`);
        const data = await res.json();
        if (data.data) {
          setOrder(data.data);
        }
      } catch (e) {
        console.error('Error fetching order', e);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderRef]);

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="w-12 h-12 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#0C1A14]/70">{t('order_confirm.loading')}</p>
      </div>
    );
  }

  const currentStatus = order?.status || 'PENDING';
  const currentStepIdx = NINE_ORDER_STATUSES.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 print:p-0 print:m-0 print:max-w-full">
      {/* Dedicated Clean 1-Page A4 Print Slip */}
      <PrintableOrderSheet order={order} docTitle="BON DE COMMANDE ROYAL" />

      {/* Confirmation Screen Card (Hidden during print) */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] p-6 sm:p-10 shadow-sm text-center print:hidden">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isCancelled ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {isCancelled ? <XCircle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
        </div>

        <span className="text-xs uppercase font-semibold text-[#D4AF37] tracking-widest block mb-2">
          {t('order_confirm.brand_eyebrow')}
        </span>

        <h1 className="font-heading font-bold tracking-tight text-2xl sm:text-4xl text-[#0C1A14] mb-3">
          {isCancelled ? t('order_confirm.cancelled_title') : t('order_confirm.title')}
        </h1>

        <p className="text-sm text-[#0C1A14]/70 max-w-lg mx-auto mb-6">
          {t('order_confirm.status_current')} <strong className="text-[#0C1A14]">{ORDER_STATUS_LABEL_MAP[currentStatus] || currentStatus}</strong>. {t('order_confirm.status_desc')}
        </p>

        {/* Order Reference Pill */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-[#FBF9F5] border border-[#EFECE6] px-5 sm:px-6 py-3 rounded-full mb-7 max-w-full">
          <span className="text-xs text-[#0C1A14]/60 uppercase tracking-wider">{t('order_confirm.reference')}</span>
          <span className="font-mono text-sm sm:text-base font-bold text-[#0C1A14] break-all">{orderRef}</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 border-b border-[#EFECE6] pb-7 mb-8 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#EFECE6] bg-white text-xs font-semibold text-[#0C1A14] hover:bg-[#FBF9F5] transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D4AF37]" />
            <span>Imprimer le Bon de Commande</span>
          </button>

          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-semibold uppercase tracking-wider hover:bg-[var(--royal-primary-hover)] transition shadow-sm"
          >
            <span>Retour à la Boutique</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Order Details Breakdown */}
        {order && (
          <div className="text-left space-y-8">
            {/* Complete 9-Status Stepper */}
            <div className="bg-[#FBF9F5] rounded-2xl p-5 sm:p-6 border border-[#EFECE6]">
              <h2 className="text-xs uppercase font-bold text-[#0C1A14] tracking-wider mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#D4AF37]" />
                <span>Les 9 Étapes de Suivi de la Commande</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 text-center text-[11px]">
                {NINE_ORDER_STATUSES.map((st, idx) => {
                  const isCancelStep = st.key === 'CANCELLED';
                  const active = isCancelled
                    ? isCancelStep
                    : !isCancelStep && currentStepIdx >= idx;
                  const isCurrent = st.key === currentStatus;

                  return (
                    <div
                      key={st.key}
                      className={`p-2.5 rounded-xl border transition ${
                        isCurrent && isCancelled
                          ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                          : isCurrent
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                          : active
                          ? 'bg-white border-emerald-200 text-emerald-800'
                          : 'bg-white border-[#EFECE6] text-neutral-400 opacity-75'
                      }`}
                    >
                      <div className="font-bold leading-tight">
                        {st.step}. {st.label}
                      </div>
                      <div className="text-[9px] mt-0.5 opacity-80 leading-tight">{st.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="font-heading font-bold tracking-tight text-lg text-[#0C1A14] mb-4">
                Articles Commandés
              </h3>
              <div className="bg-[#FBF9F5] rounded-2xl border border-[#EFECE6] divide-y divide-[#EFECE6] overflow-hidden">
                {order.items?.map((it: any) => (
                  <div key={it.id} className="p-4 flex items-center justify-between text-xs gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white border border-[#EFECE6] overflow-hidden shrink-0">
                        {it.imageUrl ? (
                          <img src={getSafeImageUrl(it.imageUrl)} alt={it.productName} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-[#0C1A14]/20 m-auto mt-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#0C1A14] truncate">{it.productName}</div>
                        <div className="text-[11px] text-[#0C1A14]/60 font-mono">
                          SKU : {it.sku} &bull; Qté : {it.quantity} &times; {Number(it.unitPrice).toFixed(3)} TND
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-[#0C1A14] font-mono shrink-0">
                      {Number(it.totalPrice).toFixed(3)} TND
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial & Delivery Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="bg-[#FBF9F5] rounded-2xl p-6 border border-[#EFECE6] space-y-2">
                <h4 className="font-bold text-[#0C1A14] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    {order.fulfillmentType === 'SHOWROOM_PICKUP'
                      ? 'Retrait en Showroom Royal'
                      : "Adresse & Mode d'Expédition"}
                  </span>
                </h4>
                {order.fulfillmentType === 'SHOWROOM_PICKUP' ? (
                  <div className="text-[#0C1A14]/80 space-y-1">
                    <p className="font-semibold text-[#0C1A14]">
                      {order.pickupShowroom?.name || 'Showroom Royal'}
                    </p>
                    <p>{order.pickupShowroom?.address || order.pickupShowroom?.city || ''}</p>
                    {Array.isArray(order.stockTransfers) && order.stockTransfers.length > 0 && (
                      <p className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 mt-1">
                        Réassort interne programmé ({order.stockTransfers[0].requestRef || order.stockTransfers[0].reference}) — Notre équipe vous avertira dès disponibilité en showroom.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-[#0C1A14]/80 space-y-0.5">
                    {order.deliveryCompany && (
                      <p className="font-bold text-[#9A7414] mb-1">
                        Transporteur : {order.deliveryCompany.name}
                      </p>
                    )}
                    <p className="font-semibold">{order.shippingAddressJson?.firstName} {order.shippingAddressJson?.lastName}</p>
                    {order.shippingAddressJson?.street && <p>{order.shippingAddressJson.street}</p>}
                    {order.shippingAddressJson?.street2 && <p>{order.shippingAddressJson.street2}</p>}
                    <p>{order.shippingAddressJson?.city}, {order.shippingAddressJson?.state} {order.shippingAddressJson?.postalCode}</p>
                    <p className="mt-1 font-mono text-[#0C1A14]/60">Tél : {order.shippingAddressJson?.phone}</p>
                  </div>
                )}
              </div>

              <div className="bg-[#FBF9F5] rounded-2xl p-6 border border-[#EFECE6] space-y-2">
                <h4 className="font-bold text-[#0C1A14] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                  <span>Total &amp; Règlement</span>
                </h4>
                <div className="space-y-1.5 text-[#0C1A14]/80">
                  <div className="flex justify-between">
                    <span>Sous-total :</span>
                    <span className="font-semibold text-[#0C1A14]">{Number(order.subtotalAmount).toFixed(3)} TND</span>
                  </div>
                  {Number(order.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Remise ({order.couponCode}) :</span>
                      <span>-{Number(order.discountAmount).toFixed(3)} TND</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Frais d&apos;expédition :</span>
                    <span>{Number(order.shippingAmount) === 0 ? 'OFFERTS' : `${Number(order.shippingAmount).toFixed(3)} TND`}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#EFECE6] pt-2 text-sm font-bold text-[#0C1A14]">
                    <span>Net Payé / Dû :</span>
                    <span className="text-[#0C1A14] font-bold tracking-tight text-base font-mono">{Number(order.totalAmount).toFixed(3)} TND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
