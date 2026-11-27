'use client';

import React, { useEffect, useState } from 'react';
import { getSafeImageUrl } from '@/lib/cart-session';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';

export const NINE_ORDER_STATUSES = [
  { key: 'PENDING', step: 1, label: 'Reçue / En attente', sub: 'Enregistrement initial' },
  { key: 'CONFIRMED', step: 2, label: 'Confirmée', sub: 'Validation commerciale' },
  { key: 'PROCESSING', step: 3, label: 'Traitement', sub: 'Affectation dossier' },
  { key: 'PREPARING', step: 4, label: 'Préparation', sub: 'Prélèvement & emballage' },
  { key: 'READY_FOR_SHIPMENT', step: 5, label: 'Prête à expédier', sub: 'Colis scellé en quai' },
  { key: 'SHIPPED', step: 6, label: 'Expédiée', sub: 'Prise en charge transporteur' },
  { key: 'OUT_FOR_DELIVERY', step: 7, label: 'En cours de livraison', sub: 'Tournée livreur' },
  { key: 'DELIVERED', step: 8, label: 'Livrée', sub: 'Remise au client' },
  { key: 'CANCELLED', step: 9, label: 'Annulée', sub: 'Commande annulée' },
] as const;

export const ORDER_STATUS_LABEL_MAP: Record<string, string> = {
  PENDING: 'Reçue / En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'Traitement',
  PREPARING: 'En préparation',
  READY_FOR_SHIPMENT: 'Prête à expédier',
  SHIPPED: 'Expédiée',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  RETURN_REQUESTED: 'Retour demandé',
  RETURNED: 'Retournée',
  REFUNDED: 'Remboursée',
  FAILED: 'Échouée',
};

export function PrintableOrderSheet({
  order,
  docTitle,
}: {
  order: any;
  docTitle?: string;
}) {
  const { config } = useCmsConfig();
  const { t, locale } = useI18nStore();
  const [printMeta, setPrintMeta] = useState<{ headerText?: string; footerText?: string } | null>(null);
  const curr = t('common.currency');
  const resolvedTitle = docTitle || t('print_sheet.doc_title');

  useEffect(() => {
    fetch('/api/v1/storefront-cms/public-print-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const d = json?.data || json;
        const tpls = Array.isArray(d?.printTemplates) ? d.printTemplates : [];
        const matched =
          tpls.find((tpl: any) => tpl.isActive && order?.reference?.startsWith(tpl.prefixCode)) ||
          tpls.find((tpl: any) => tpl.isActive && tpl.paperFormat === 'A4');
        if (matched) setPrintMeta(matched);
      })
      .catch(() => null);
  }, [order?.reference]);

  if (!order) return null;

  const clientName = order.customer
    ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
    : order.guestName ||
      `${order.shippingAddressJson?.firstName || ''} ${order.shippingAddressJson?.lastName || ''}`.trim() ||
      t('print_sheet.client_fallback');

  const clientPhone = order.customer?.phone || order.guestPhone || order.shippingAddressJson?.phone || '—';
  const clientEmail = order.customer?.email || order.guestEmail || '—';
  const addr = order.shippingAddressJson || {};
  const payMethod = order.payments?.[0]?.method || order.paymentMethod || 'CASH_ON_DELIVERY';

  return (
    <div
      id="royal-print-bon"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="hidden print:block bg-white text-black w-full font-sans text-[11px] leading-snug"
    >
      {/* Compact Brand Letterhead */}
      <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
        <div className="flex items-center gap-3">
          <img
            src={config.logoUrl || '/images/royal-logo.jpg'}
            alt={config.appName || 'Royal Electro de Maison'}
            style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #d4af37' }}
          />
          <div>
            <div className="text-base font-black tracking-tight uppercase">
              {config.contact?.companyName ||
                (locale === 'ar'
                  ? t('print_sheet.company_fallback')
                  : `${config.appName || 'ROYAL'} — ÉLECTRO DE MAISON`)}
            </div>
            <div className="text-[10px] text-neutral-700">
              {printMeta?.headerText ||
                `${config.identity.address || 'Mahdia 5100, Tunisie'} • ${t('print_sheet.phone_prefix')} ${config.identity.phone || '48 091 914'} • ${config.identity.email || 'royaltn24@gmail.com'}`}
            </div>
            <div className="text-[10px] text-neutral-600">{t('print_sheet.official_site')} https://royal.com.tn</div>
          </div>
        </div>

        <div className="text-end">
          <div className="text-sm font-black uppercase tracking-wider">{resolvedTitle}</div>
          <div className="font-mono font-bold text-xs mt-0.5" dir="ltr">{order.reference}</div>
          <div className="text-[10px] text-neutral-600 mt-0.5">
            {t('print_sheet.date_label')} {new Date(order.createdAt).toLocaleString(locale === 'ar' ? 'ar-TN' : 'fr-FR')}
          </div>
          <div className="text-[10px] font-bold uppercase mt-1 px-2 py-0.5 border border-black inline-block rounded">
            {t('print_sheet.status_prefix')}{' '}
            {t(`order_status.${order.status}`, ORDER_STATUS_LABEL_MAP[order.status] || order.status)}
          </div>
        </div>
      </div>

      {/* Compact 2-Column Client & Shipping Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-neutral-300 rounded-lg p-3">
          <div className="text-[10px] font-black uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1.5">
            {t('print_sheet.client_info')}
          </div>
          <div className="font-bold text-xs">{clientName}</div>
          <div>
            {t('print_sheet.phone_prefix')} <span className="font-mono" dir="ltr">{clientPhone}</span>
          </div>
          <div>
            {t('print_sheet.email_label')} <span dir="ltr">{clientEmail}</span>
          </div>
          <div>
            {t('print_sheet.channel_label')} {order.channel || 'ONLINE'}
          </div>
        </div>

        <div className="border border-neutral-300 rounded-lg p-3">
          <div className="text-[10px] font-black uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1.5">
            {t('print_sheet.delivery_payment')}
          </div>
          {order.fulfillmentType === 'SHOWROOM_PICKUP' ? (
            <>
              <div className="font-bold text-xs">
                {order.pickupShowroom?.name || t('print_sheet.showroom_fallback')}
              </div>
              {(order.pickupShowroom?.address || order.pickupShowroom?.city) && (
                <div>{order.pickupShowroom?.address || order.pickupShowroom?.city}</div>
              )}
              <div>
                {t('print_sheet.mode_label')} {t('print_sheet.pickup_showroom')} &bull;{' '}
                {payMethod === 'CASH_ON_DELIVERY'
                  ? t('print_sheet.pay_at_showroom')
                  : payMethod === 'BANK_TRANSFER'
                  ? t('print_sheet.bank_transfer')
                  : t('print_sheet.online_payment')}
              </div>
            </>
          ) : (
            <>
              <div className="font-bold text-xs">
                {addr.firstName || clientName} {addr.lastName || ''}
              </div>
              {addr.street && <div>{addr.street}</div>}
              {addr.street2 && <div>{addr.street2}</div>}
              <div>
                {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ') || t('print_sheet.country_fallback')}
              </div>
              <div>
                {t('print_sheet.mode_label')} {t('print_sheet.home_delivery')}
                {order.deliveryCompany?.name ? ` (${order.deliveryCompany.name})` : ''} &bull;{' '}
                {payMethod === 'CASH_ON_DELIVERY'
                  ? t('print_sheet.cash_on_delivery')
                  : payMethod === 'BANK_TRANSFER'
                  ? t('print_sheet.bank_transfer')
                  : t('print_sheet.online_payment')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-4 text-[11px]">
        <thead>
          <tr className="bg-neutral-100">
            <th className="border border-neutral-300 px-2.5 py-1.5 text-start font-bold">{t('print_sheet.col_item')}</th>
            <th className="border border-neutral-300 px-2 py-1.5 text-start font-bold">{t('print_sheet.col_sku')}</th>
            <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">{t('print_sheet.col_qty')}</th>
            <th className="border border-neutral-300 px-2.5 py-1.5 text-end font-bold">
              {t('print_sheet.col_unit_price')} ({curr})
            </th>
            <th className="border border-neutral-300 px-2.5 py-1.5 text-end font-bold">
              {t('print_sheet.col_total')} ({curr})
            </th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((it: any) => {
            const displayProductName =
              locale === 'ar' && (it.productNameAr || it.product?.nameAr)
                ? it.productNameAr || it.product?.nameAr
                : it.productName || it.name;
            return (
              <tr key={it.id} style={{ breakInside: 'avoid' }}>
                <td className="border border-neutral-300 px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    {it.imageUrl && (
                      <img
                        src={getSafeImageUrl(it.imageUrl)}
                        alt=""
                        style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    )}
                    <div>
                      <div className="font-bold">{displayProductName}</div>
                      {it.variantName && <div className="text-[10px] text-neutral-600">{it.variantName}</div>}
                    </div>
                  </div>
                </td>
                <td className="border border-neutral-300 px-2 py-1.5 font-mono text-[10px]">{it.sku}</td>
                <td className="border border-neutral-300 px-2 py-1.5 text-center font-mono font-bold">{it.quantity}</td>
                <td className="border border-neutral-300 px-2.5 py-1.5 text-end font-mono">
                  {Number(it.unitPrice || 0).toFixed(3)}
                </td>
                <td className="border border-neutral-300 px-2.5 py-1.5 text-end font-mono font-bold">
                  {Number(it.totalPrice || 0).toFixed(3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals & Footer Signature Block (Always grouped together on 1 page) */}
      <div className="flex items-start justify-between gap-6" style={{ breakInside: 'avoid' }}>
        <div className="flex-1 text-[10px] text-neutral-700 border border-neutral-300 rounded-lg p-3">
          <div className="font-bold uppercase mb-1">{t('print_sheet.notes_heading')}</div>
          <div>{printMeta?.footerText || t('print_sheet.default_footer')}</div>
          <div className="mt-4 pt-2 border-t border-dashed border-neutral-300 flex justify-between text-[9px] text-neutral-500">
            <span>{t('print_sheet.store_stamp')}</span>
            <span>{t('print_sheet.client_signature')}</span>
          </div>
        </div>

        <div className="w-64 border border-black rounded-lg p-3 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>{t('print_sheet.subtotal_items')}</span>
            <span className="font-mono font-semibold">{Number(order.subtotalAmount || 0).toFixed(3)} {curr}</span>
          </div>
          {Number(order.discountAmount || 0) > 0 && (
            <div className="flex justify-between">
              <span>{t('print_sheet.discount')} ({order.couponCode || t('print_sheet.promo')}) :</span>
              <span className="font-mono">-{Number(order.discountAmount).toFixed(3)} {curr}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{t('print_sheet.shipping_fee')}</span>
            <span className="font-mono">
              {Number(order.shippingAmount || 0) === 0
                ? t('print_sheet.shipping_free')
                : `${Number(order.shippingAmount).toFixed(3)} ${curr}`}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>{t('print_sheet.vat_included')}</span>
            <span className="font-mono">{Number(order.taxAmount || 0).toFixed(3)} {curr}</span>
          </div>
          <div className="flex justify-between border-t-2 border-black pt-1.5 mt-1.5 text-xs font-black">
            <span>{t('print_sheet.net_total')}</span>
            <span className="font-mono">{Number(order.totalAmount || 0).toFixed(3)} {curr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
