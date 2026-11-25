'use client';

import React, { useEffect, useState } from 'react';
import { getSafeImageUrl } from '@/lib/cart-session';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

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
  docTitle = 'BON DE COMMANDE',
}: {
  order: any;
  docTitle?: string;
}) {
  const { config } = useCmsConfig();
  const [printMeta, setPrintMeta] = useState<{ headerText?: string; footerText?: string } | null>(null);

  useEffect(() => {
    fetch('/api/v1/storefront-cms/public-print-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const d = json?.data || json;
        const tpls = Array.isArray(d?.printTemplates) ? d.printTemplates : [];
        const matched =
          tpls.find((t: any) => t.isActive && order?.reference?.startsWith(t.prefixCode)) ||
          tpls.find((t: any) => t.isActive && t.paperFormat === 'A4');
        if (matched) setPrintMeta(matched);
      })
      .catch(() => null);
  }, [order?.reference]);

  if (!order) return null;

  const clientName = order.customer
    ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
    : order.guestName ||
      `${order.shippingAddressJson?.firstName || ''} ${order.shippingAddressJson?.lastName || ''}`.trim() ||
      'Client';

  const clientPhone = order.customer?.phone || order.guestPhone || order.shippingAddressJson?.phone || '—';
  const clientEmail = order.customer?.email || order.guestEmail || '—';
  const addr = order.shippingAddressJson || {};

  return (
    <div id="royal-print-bon" className="hidden print:block bg-white text-black w-full font-sans text-[11px] leading-snug">
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
              {config.contact?.companyName || `${config.appName || 'ROYAL'} — ÉLECTRO DE MAISON`}
            </div>
            <div className="text-[10px] text-neutral-700">
              {printMeta?.headerText ||
                `${config.identity.address || 'Mahdia 5100, Tunisie'} • Tél : ${config.identity.phone || '48 091 914'} • ${config.identity.email || 'royaltn24@gmail.com'}`}
            </div>
            <div className="text-[10px] text-neutral-600">Site Officiel : https://royal.com.tn</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-black uppercase tracking-wider">{docTitle}</div>
          <div className="font-mono font-bold text-xs mt-0.5">{order.reference}</div>
          <div className="text-[10px] text-neutral-600 mt-0.5">
            Date : {new Date(order.createdAt).toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] font-bold uppercase mt-1 px-2 py-0.5 border border-black inline-block rounded">
            Statut : {ORDER_STATUS_LABEL_MAP[order.status] || order.status}
          </div>
        </div>
      </div>

      {/* Compact 2-Column Client & Shipping Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-neutral-300 rounded-lg p-3">
          <div className="text-[10px] font-black uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1.5">
            Informations Client
          </div>
          <div className="font-bold text-xs">{clientName}</div>
          <div>Tél : <span className="font-mono">{clientPhone}</span></div>
          <div>E-mail : {clientEmail}</div>
          <div>Canal : {order.channel || 'ONLINE'}</div>
        </div>

        <div className="border border-neutral-300 rounded-lg p-3">
          <div className="text-[10px] font-black uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1.5">
            Livraison &amp; Règlement
          </div>
          {order.fulfillmentType === 'SHOWROOM_PICKUP' ? (
            <>
              <div className="font-bold text-xs">
                {order.pickupShowroom?.name || 'Showroom Royal'}
              </div>
              {(order.pickupShowroom?.address || order.pickupShowroom?.city) && (
                <div>{order.pickupShowroom?.address || order.pickupShowroom?.city}</div>
              )}
              <div>
                Mode : Retrait en Showroom &bull;{' '}
                {(order.payments?.[0]?.method || order.paymentMethod || 'CASH_ON_DELIVERY') === 'CASH_ON_DELIVERY'
                  ? 'Payer sur place (au showroom)'
                  : order.payments?.[0]?.method === 'BANK_TRANSFER'
                  ? 'Virement Bancaire'
                  : 'Paiement en ligne'}
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
                {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ') || 'Tunisie'}
              </div>
              <div>
                Mode : Livraison à Domicile
                {order.deliveryCompany?.name ? ` (${order.deliveryCompany.name})` : ''} &bull;{' '}
                {(order.payments?.[0]?.method || order.paymentMethod || 'CASH_ON_DELIVERY') === 'CASH_ON_DELIVERY'
                  ? 'Paiement à la livraison (Espèces)'
                  : order.payments?.[0]?.method === 'BANK_TRANSFER'
                  ? 'Virement Bancaire'
                  : 'Paiement en ligne'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-4 text-[11px]">
        <thead>
          <tr className="bg-neutral-100">
            <th className="border border-neutral-300 px-2.5 py-1.5 text-left font-bold">Article &amp; Variante</th>
            <th className="border border-neutral-300 px-2 py-1.5 text-left font-bold">SKU</th>
            <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">Qté</th>
            <th className="border border-neutral-300 px-2.5 py-1.5 text-right font-bold">P.U. (TND)</th>
            <th className="border border-neutral-300 px-2.5 py-1.5 text-right font-bold">Total (TND)</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((it: any) => (
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
                    <div className="font-bold">{it.productName || it.name}</div>
                    {it.variantName && <div className="text-[10px] text-neutral-600">{it.variantName}</div>}
                  </div>
                </div>
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 font-mono text-[10px]">{it.sku}</td>
              <td className="border border-neutral-300 px-2 py-1.5 text-center font-mono font-bold">{it.quantity}</td>
              <td className="border border-neutral-300 px-2.5 py-1.5 text-right font-mono">
                {Number(it.unitPrice || 0).toFixed(3)}
              </td>
              <td className="border border-neutral-300 px-2.5 py-1.5 text-right font-mono font-bold">
                {Number(it.totalPrice || 0).toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Footer Signature Block (Always grouped together on 1 page) */}
      <div className="flex items-start justify-between gap-6" style={{ breakInside: 'avoid' }}>
        <div className="flex-1 text-[10px] text-neutral-700 border border-neutral-300 rounded-lg p-3">
          <div className="font-bold uppercase mb-1">Observations &amp; Visa</div>
          <div>{printMeta?.footerText || 'Merci pour votre confiance en Royal — Électro de Maison.'}</div>
          <div className="mt-4 pt-2 border-t border-dashed border-neutral-300 flex justify-between text-[9px] text-neutral-500">
            <span>Cachet &amp; Signature Magasin</span>
            <span>Signature Client à Réception</span>
          </div>
        </div>

        <div className="w-64 border border-black rounded-lg p-3 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Sous-total articles :</span>
            <span className="font-mono font-semibold">{Number(order.subtotalAmount || 0).toFixed(3)} TND</span>
          </div>
          {Number(order.discountAmount || 0) > 0 && (
            <div className="flex justify-between">
              <span>Remise ({order.couponCode || 'Promo'}) :</span>
              <span className="font-mono">-{Number(order.discountAmount).toFixed(3)} TND</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Frais de livraison :</span>
            <span className="font-mono">
              {Number(order.shippingAmount || 0) === 0
                ? 'OFFERTS'
                : `${Number(order.shippingAmount).toFixed(3)} TND`}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>TVA incluse (19%) :</span>
            <span className="font-mono">{Number(order.taxAmount || 0).toFixed(3)} TND</span>
          </div>
          <div className="flex justify-between border-t-2 border-black pt-1.5 mt-1.5 text-xs font-black">
            <span>TOTAL NET :</span>
            <span className="font-mono">{Number(order.totalAmount || 0).toFixed(3)} TND</span>
          </div>
        </div>
      </div>
    </div>
  );
}
