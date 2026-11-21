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
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Modal } from '@/components/ui';
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

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('royal_token') : null;
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.data) {
        setOrder(data.data);
        setSelectedStatus(data.data.status);
      }
    } catch (e) {
      console.error('Error fetching order', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setUpdating(true);
    setErrorMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('royal_token') : null;
      const res = await fetch(`/api/v1/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: selectedStatus,
          comment: statusComment || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowStatusModal(false);
        setStatusComment('');
        fetchOrder();
      } else {
        setErrorMsg(data.message || 'Impossible de mettre à jour le statut.');
      }
    } catch {
      setErrorMsg('Erreur réseau lors de la mise à jour.');
    } finally {
      setUpdating(false);
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            <span>Imprimer Bon de Préparation</span>
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

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Adresse de Livraison</span>
            </h3>
            <div className="text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-900">
                {order.shippingAddressJson?.firstName} {order.shippingAddressJson?.lastName}
              </p>
              <p>{order.shippingAddressJson?.street}</p>
              {order.shippingAddressJson?.street2 && <p>{order.shippingAddressJson?.street2}</p>}
              <p>{order.shippingAddressJson?.city}, {order.shippingAddressJson?.state} {order.shippingAddressJson?.postalCode}</p>
              <p className="text-gray-400 font-mono mt-1">Tél : {order.shippingAddressJson?.phone}</p>
            </div>
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
        subtitle={order ? `Commande ${order.orderNumber}` : ''}
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
      </div>
    </div>
  );
}
