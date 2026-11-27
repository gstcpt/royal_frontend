'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
  ShoppingBag,
  AlertCircle,
  User,
  Phone,
  Mail,
  ShieldAlert,
  Store,
  ArrowLeftRight,
  ExternalLink,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Modal, Toast } from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { EmailTemplateComposer, EmailComposerLocale } from '@/components/dashboard/EmailTemplateComposer';
import {
  NINE_ORDER_STATUSES,
  ORDER_STATUS_LABEL_MAP,
  PrintableOrderSheet,
} from '@/components/common/PrintableOrderSheet';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusComment, setStatusComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [sendInvoiceChecked, setSendInvoiceChecked] = useState(true);
  const [sendBlChecked, setSendBlChecked] = useState(true);
  const [emailLocale, setEmailLocale] = useState<EmailComposerLocale>('FR');
  const [emailTemplateId, setEmailTemplateId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailCustomNote, setEmailCustomNote] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const resData = await fetchApi<any>(`/orders/${encodeURIComponent(orderId)}`);
      if (resData) {
        setOrder(resData);
        setSelectedStatus(resData.status);
      }
    } catch (e: any) {
      console.error('Error fetching order', e);
      setToastMsg({ text: e?.message || 'Impossible de charger la commande.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const openEmailPromptForOrder = () => {
    if (!order) return;
    setEmailRecipient(order.customer?.email || order.guestEmail || '');
    setSendInvoiceChecked(true);
    setSendBlChecked(true);
    setEmailCustomNote('');
    setShowEmailPrompt(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setUpdating(true);
    setErrorMsg('');

    try {
      await fetchApi(`/orders/${encodeURIComponent(order.id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: selectedStatus,
          comment: statusComment || undefined,
        }),
      });
      const wasDelivered = order.status === 'DELIVERED';
      setShowStatusModal(false);
      setStatusComment('');
      fetchOrder();
      if (selectedStatus === 'DELIVERED' && !wasDelivered) {
        openEmailPromptForOrder();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible de mettre à jour le statut.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendDeliveryDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSendingEmail(true);
    try {
      const res = await fetchApi(`/storefront-cms/orders/${order.id}/send-delivery-documents`, {
        method: 'POST',
        body: JSON.stringify({
          sendInvoice: sendInvoiceChecked,
          sendDeliverySlip: sendBlChecked,
          customEmail: emailRecipient.trim() || undefined,
          customNote: emailCustomNote.trim() || undefined,
          locale: emailLocale,
          templateId: emailTemplateId || undefined,
          customSubject: emailSubject.trim() || undefined,
        }),
      });
      setShowEmailPrompt(false);
      setToastMsg({ text: res?.message || 'Documents transmis au client.', type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Échec envoi documents.', type: 'error' });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-500">Chargement du dossier de commande...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-500">Commande introuvable.</p>
        <Link href="/dashboard/orders" className="text-xs text-[#D4AF37] hover:underline mt-2 inline-block">
          Retour à la liste des commandes
        </Link>
      </div>
    );
  }

  const clientName = order.customer
    ? `${order.customer.firstName} ${order.customer.lastName}`
    : order.guestName || 'Client Invité';

  const clientEmail = order.customer?.email || order.guestEmail || '—';
  const clientPhone = order.customer?.phone || order.guestPhone || '—';

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Crisp 1-Page Printable A4 Sheet */}
      <PrintableOrderSheet order={order} docTitle="BON DE PRÉPARATION & COMMANDE" />

      {/* Interactive Screen Layout (Hidden during print so page 2 never orphans totals) */}
      <div className="space-y-6 print:hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-gray-900">{order.reference}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Enregistrée le {new Date(order.createdAt).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} &bull; Canal : {order.channel}
            </p>
            <Breadcrumb
              className="mt-2"
              items={[
                { label: 'Vente', href: '/dashboard/section/sales' },
                { label: 'Commandes Clients', href: '/dashboard/orders' },
                { label: order.reference },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            <span>Imprimer Bon de Préparation</span>
          </button>
          <button
            type="button"
            onClick={openEmailPromptForOrder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-xs font-bold text-[#9A7414] hover:bg-[#C59B27] hover:text-white transition shadow-xs cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-mail Client / PDF</span>
          </button>
          <button
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-semibold hover:bg-[var(--royal-primary-hover)] transition shadow-xs cursor-pointer"
          >
            <span>Modifier Statut</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Items and Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              <span>Articles Snapshot Immuable ({order.items?.length || 0})</span>
            </h2>

            <div className="divide-y divide-gray-100">
              {order.items?.map((it: any) => (
                <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden p-1">
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt={it.productName} className="w-full h-full object-contain" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{it.productName}</div>
                      {it.variantName && <div className="text-gray-500 text-[11px]">Variante : {it.variantName}</div>}
                      <div className="text-[10px] text-gray-400 font-mono">SKU : {it.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{Number(it.totalPrice).toFixed(3)} TND</div>
                    <div className="text-[11px] text-gray-400">
                      {it.quantity} &times; {Number(it.unitPrice).toFixed(3)} TND
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span>Journal d'Audit des Changements d'État</span>
            </h2>

            <div className="space-y-4">
              {order.statusHistory?.map((hist: any) => (
                <div key={hist.id} className="flex items-start gap-3 text-xs border-l-2 border-[#D4AF37] pl-3 py-0.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        {hist.fromStatus ? `${hist.fromStatus} → ${hist.toStatus}` : hist.toStatus}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        par {hist.changedBy}
                      </span>
                    </div>
                    {hist.comment && <p className="text-gray-600 mt-0.5">{hist.comment}</p>}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(hist.createdAt).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer, Addresses, Financials */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Client</span>
            </h3>
            <div className="text-xs space-y-1.5 text-gray-700">
              <div className="font-semibold text-gray-900">{clientName}</div>
              <div className="flex items-center gap-2 text-gray-500">
                <Mail className="w-3 h-3 text-gray-400" />
                <span>{clientEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 font-mono">
                <Phone className="w-3 h-3 text-gray-400" />
                <span>{clientPhone}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address & Logistics Mode */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              {order.fulfillmentType === 'SHOWROOM_PICKUP' ? (
                <>
                  <Store className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Retrait en Showroom &amp; Transfert</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Livraison &amp; Transporteur</span>
                </>
              )}
            </h3>

            {order.fulfillmentType === 'SHOWROOM_PICKUP' ? (
              <div className="space-y-2 text-gray-700">
                <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6D6A6]">
                  <div className="font-bold text-gray-900">
                    {order.pickupShowroom?.name || 'Showroom Royal'}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    {order.pickupShowroom?.address || order.pickupShowroom?.city || '—'}
                    {order.pickupShowroom?.warehouse?.name && ` • Dépôt : ${order.pickupShowroom.warehouse.name}`}
                  </div>
                </div>

                {Array.isArray(order.stockTransfers) && order.stockTransfers.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Demande(s) de Transfert Associée(s) :</span>
                    </div>
                    {order.stockTransfers.map((trf: any) => (
                      <Link
                        key={trf.id}
                        href={`/dashboard/transfers/${trf.id}`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 hover:border-[#C59B27] transition"
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-gray-900 truncate">
                            {trf.requestRef || trf.reference}
                          </div>
                          <div className="text-[10px] text-gray-600 truncate">
                            {trf.fromWarehouse?.name} ➔ {trf.toWarehouse?.name} ({trf.status})
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#9A7414] shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600 space-y-1">
                {order.deliveryCompany && (
                  <div className="p-2.5 rounded-xl bg-[#FBF9F4] border border-[#E6D6A6] mb-2">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>{order.deliveryCompany.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      Méthode : <strong>{order.deliveryMethodType || order.deliveryCompany.defaultMethod}</strong>
                      {order.deliveryDistanceKm !== null && order.deliveryDistanceKm !== undefined
                        ? ` • ${Number(order.deliveryDistanceKm).toFixed(0)} km`
                        : ''}
                      {order.deliveryTotalWeightKg !== null && order.deliveryTotalWeightKg !== undefined
                        ? ` • ${Number(order.deliveryTotalWeightKg).toFixed(2)} kg`
                        : ''}
                    </div>
                  </div>
                )}
                <p className="font-semibold text-gray-900">
                  {order.shippingAddressJson?.firstName} {order.shippingAddressJson?.lastName}
                </p>
                <p>{order.shippingAddressJson?.street}</p>
                {order.shippingAddressJson?.street2 && <p>{order.shippingAddressJson?.street2}</p>}
                <p>{order.shippingAddressJson?.city}, {order.shippingAddressJson?.state} {order.shippingAddressJson?.postalCode}</p>
                <p className="text-gray-400 font-mono mt-1">Tél : {order.shippingAddressJson?.phone}</p>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs text-xs space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Synthèse Financière</span>
            </h3>

            <div className="space-y-2 text-gray-600">
              <div className="flex justify-between">
                <span>Sous-total articles :</span>
                <span className="font-semibold text-gray-900">{Number(order.subtotalAmount).toFixed(3)} TND</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Remise ({order.couponCode}) :</span>
                  <span>-{Number(order.discountAmount).toFixed(3)} TND</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Frais d'expédition :</span>
                <span>{Number(order.shippingAmount) === 0 ? 'OFFERTS' : `${Number(order.shippingAmount).toFixed(3)} TND`}</span>
              </div>
              <div className="flex justify-between">
                <span>Mode de règlement :</span>
                <span className="font-semibold text-gray-900">
                  {order.fulfillmentType === 'SHOWROOM_PICKUP' &&
                  (order.payments?.[0]?.method || 'CASH_ON_DELIVERY') === 'CASH_ON_DELIVERY'
                    ? 'Payer sur place (au showroom)'
                    : order.payments?.[0]?.method === 'BANK_TRANSFER'
                    ? 'Virement Bancaire'
                    : order.payments?.[0]?.method === 'CARD_ONLINE'
                    ? 'Carte Bancaire en ligne'
                    : 'Paiement à la livraison (COD)'}
                </span>
              </div>
              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>TVA légale incluse (19%) :</span>
                <span>{Number(order.taxAmount).toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-bold text-gray-900">
                <span>Total Commande :</span>
                <span className="font-mono text-base">{Number(order.totalAmount).toFixed(3)} TND</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal (Centralized) */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Faire évoluer le statut de la commande"
        subtitle={order ? `Commande ${order.reference}` : ''}
        type="edit"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="order-status-form"
              disabled={updating}
              className="px-4 py-2 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-semibold hover:bg-[var(--royal-primary-hover)] transition cursor-pointer"
            >
              {updating ? 'Mise à jour...' : 'Appliquer le Statut'}
            </button>
          </div>
        }
      >
        <form id="order-status-form" onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Nouveau Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
            >
              {NINE_ORDER_STATUSES.map((st) => (
                <option key={st.key} value={st.key}>
                  {st.step}. {st.label} ({st.key})
                </option>
              ))}
              <option value="REFUNDED">Remboursée (REFUNDED)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Commentaire d&apos;audit (optionnel)</label>
            <textarea
              rows={3}
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              placeholder="Ex: Confirmation client par téléphone reçue..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}
        </form>
      </Modal>

      {/* Manual Invoice / BL Email Prompt Modal */}
      <Modal
        isOpen={showEmailPrompt}
        onClose={() => setShowEmailPrompt(false)}
        title="Envoi E-mail Client — Documents & Modèle Light Luxury"
        subtitle={`Commande ${order.reference} (${order.status})`}
        type="details"
        size="3xl"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowEmailPrompt(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="order-detail-docs-form"
              disabled={sendingEmail || (!sendInvoiceChecked && !sendBlChecked) || !emailRecipient.trim()}
              className="px-4 py-2 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-semibold hover:bg-[var(--royal-primary-hover)] transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{sendingEmail ? 'Envoi...' : `Envoyer (${emailLocale})`}</span>
            </button>
          </div>
        }
      >
        <form id="order-detail-docs-form" onSubmit={handleSendDeliveryDocs} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6">
              <label className="block text-gray-700 font-medium mb-1">Email Destinataire *</label>
              <input
                type="email"
                required
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white"
              />
            </div>
            <label className="md:col-span-3 h-9 px-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvoiceChecked}
                onChange={(e) => setSendInvoiceChecked(e.target.checked)}
                className="accent-[#C59B27] h-4 w-4"
              />
              <span className="font-bold text-gray-900">Facture (FAC)</span>
            </label>
            <label className="md:col-span-3 h-9 px-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendBlChecked}
                onChange={(e) => setSendBlChecked(e.target.checked)}
                className="accent-[#C59B27] h-4 w-4"
              />
              <span className="font-bold text-gray-900">Livraison (BL)</span>
            </label>
          </div>

          <EmailTemplateComposer
            category="orders"
            locale={emailLocale}
            onLocaleChange={setEmailLocale}
            selectedTemplateId={emailTemplateId}
            onTemplateChange={(tpl) => {
              setEmailTemplateId(tpl?.id || '');
              if (tpl) {
                setEmailSubject(emailLocale === 'AR' ? tpl.subjectAr || tpl.subject : tpl.subject);
              }
            }}
            subject={emailSubject}
            onSubjectChange={setEmailSubject}
            bodyText={emailCustomNote}
            onBodyTextChange={setEmailCustomNote}
            bodyRows={3}
            compact
            recipientSummary={emailRecipient || clientEmail}
            previewVariables={{
              customerName: clientName,
              orderNumber: order.reference,
              statusLabel: ORDER_STATUS_LABEL_MAP[order.status] || order.status,
              totalAmount: `${Number(order.totalAmount || 0).toFixed(3)} TND`,
              documentsList: [sendInvoiceChecked ? 'Facture (FAC)' : '', sendBlChecked ? 'Bon de Livraison (BL)' : '']
                .filter(Boolean)
                .join(' + ') || 'Aucun PDF',
            }}
          />
        </form>
      </Modal>

      <Toast
        isOpen={!!toastMsg}
        message={toastMsg?.text || ''}
        type={toastMsg?.type || 'success'}
        onClose={() => setToastMsg(null)}
      />
      </div>
    </div>
  );
}
