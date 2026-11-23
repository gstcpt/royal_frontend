'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  User,
  Printer,
  Tag,
  Eye,
  XCircle,
  ExternalLink,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal, DeleteConfirmModal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Select } from '@/components/ui/select';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';

export interface OrderItemProduct {
  id: string;
  name: string;
  variantName?: string | null;
  sku: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderMasterItem {
  id: string;
  reference: string;
  channel: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isGuest: boolean;
  shippingAddress: string;
  city: string;
  subtotalAmount: number;
  taxAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItemProduct[];
  notes?: string | null;
}

const ORDER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'En attente (PENDING)' },
  { value: 'CONFIRMED', label: 'Confirmée (CONFIRMED)' },
  { value: 'PREPARING', label: 'En préparation (PREPARING)' },
  { value: 'READY_FOR_SHIPMENT', label: 'Prête à expédier' },
  { value: 'SHIPPED', label: 'Expédiée (SHIPPED)' },
  { value: 'OUT_FOR_DELIVERY', label: 'En cours de livraison' },
  { value: 'DELIVERED', label: 'Livrée (DELIVERED)' },
  { value: 'CANCELLED', label: 'Annulée (CANCELLED)' },
  { value: 'REFUNDED', label: 'Remboursée (REFUNDED)' },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: 'Paiement à la livraison (COD)',
  CARD: 'Carte Bancaire (ClicToPay)',
  BANK_TRANSFER: 'Virement Bancaire',
  CASH: 'Espèces Caisse',
  CHECK: 'Chèque',
};

function mapOrderFromApi(o: any): OrderMasterItem {
  const addr = (o.shippingAddressJson || {}) as any;
  const firstPayment = Array.isArray(o.payments) && o.payments.length > 0 ? o.payments[0] : null;
  const fullName = o.customer
    ? `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim()
    : o.guestName ||
      `${addr.firstName || ''} ${addr.lastName || ''}`.trim() ||
      'Client';

  return {
    id: o.id,
    reference: o.reference,
    channel: o.channel || 'ONLINE',
    status: o.status || 'PENDING',
    paymentStatus: firstPayment?.status || 'PENDING',
    paymentMethod:
      PAYMENT_METHOD_LABELS[firstPayment?.method] ||
      firstPayment?.method ||
      'Paiement à la livraison',
    customerName: fullName,
    customerEmail: o.customer?.email || o.guestEmail || '—',
    customerPhone: o.customer?.phone || o.guestPhone || addr.phone || '—',
    isGuest: !o.customer?.userId && Boolean(o.guestEmail || o.guestName),
    shippingAddress: [addr.street, addr.street2].filter(Boolean).join(', ') || 'Non renseignée',
    city: [addr.city, addr.state].filter(Boolean).join(' — ') || 'Tunisie',
    subtotalAmount: Number(o.subtotalAmount || 0),
    taxAmount: Number(o.taxAmount || 0),
    shippingFee: Number(o.shippingAmount || 0),
    discountAmount: Number(o.discountAmount || 0),
    totalAmount: Number(o.totalAmount || 0),
    createdAt: o.createdAt || new Date().toISOString(),
    notes: o.notes || null,
    items: Array.isArray(o.items)
      ? o.items.map((it: any) => ({
          id: it.id,
          name: it.productName || it.name || 'Article',
          variantName: it.variantName || null,
          sku: it.sku || '',
          imageUrl: it.imageUrl || undefined,
          unitPrice: Number(it.unitPrice || 0),
          quantity: Number(it.quantity || 1),
          totalPrice: Number(it.totalPrice || 0),
        }))
      : [],
  };
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<OrderMasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [selectedOrder, setSelectedOrder] = useState<OrderMasterItem | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkDeleteOrderIds, setBulkDeleteOrderIds] = useState<string[]>([]);
  const [nextStatus, setNextStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Manual Email FAC/BL Prompt when status transitions to DELIVERED
  const [emailPromptOrder, setEmailPromptOrder] = useState<OrderMasterItem | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [sendInvoiceChecked, setSendInvoiceChecked] = useState(true);
  const [sendBlChecked, setSendBlChecked] = useState(true);
  const [emailCustomNote, setEmailCustomNote] = useState('');
  const [isSendingDocs, setIsSendingDocs] = useState(false);

  const [statusFilter, setStatusFilter] = useState('');

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedbackType(type);
    setFeedbackMessage(msg);
  };

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { items: rawList } = await fetchAllPaginated<any>('/orders', 200);
      setOrders((Array.isArray(rawList) ? rawList : []).map(mapOrderFromApi));
    } catch (err: any) {
      showFeedback('error', err?.message || 'Impossible de charger les commandes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBulkOrderStatus = async (status: string) => {
    if (selectedOrderIds.length === 0 || !status) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetchApi('/orders/bulk-action', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedOrderIds, action: 'STATUS', status }),
      });
      const updatedCount = res?.updatedCount ?? res?.data?.updatedCount ?? selectedOrderIds.length;
      const failedCount = res?.failedCount ?? res?.data?.failedCount ?? 0;
      showFeedback(
        failedCount > 0 && updatedCount === 0 ? 'error' : 'success',
        `${updatedCount} commande(s) passée(s) en ${status}${failedCount > 0 ? ` (${failedCount} transition non autorisée)` : ''}.`
      );
      setSelectedOrderIds([]);
      await loadOrders();
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erreur lors de la mise à jour groupée.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const confirmBulkDeleteOrders = async () => {
    if (bulkDeleteOrderIds.length === 0) return;
    setIsUpdatingStatus(true);
    try {
      await fetchApi('/orders/bulk-action', {
        method: 'POST',
        body: JSON.stringify({ ids: bulkDeleteOrderIds, action: 'DELETE' }),
      });
      showFeedback('success', `${bulkDeleteOrderIds.length} commande(s) archivée(s) avec succès.`);
      setBulkDeleteOrderIds([]);
      setSelectedOrderIds([]);
      await loadOrders();
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erreur lors de la suppression multiple.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openOrderModal = (order: OrderMasterItem) => {
    setSelectedOrder(order);
    setNextStatus(order.status);
    setStatusComment('');
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !nextStatus) return;
    setIsUpdatingStatus(true);
    try {
      await fetchApi(`/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          comment: statusComment.trim() || undefined,
        }),
      });
      const prevOrder = selectedOrder;
      const updatedOrder = { ...prevOrder, status: nextStatus };
      showFeedback(
        'success',
        `Statut de la commande ${prevOrder.reference} mis à jour vers ${nextStatus}.`
      );
      setSelectedOrder(updatedOrder);
      setStatusComment('');
      await loadOrders();

      if (nextStatus === 'DELIVERED' && prevOrder.status !== 'DELIVERED') {
        const cleanEmail =
          prevOrder.customerEmail && prevOrder.customerEmail !== '—' ? prevOrder.customerEmail : '';
        setEmailPromptOrder(updatedOrder);
        setEmailRecipient(cleanEmail);
        setSendInvoiceChecked(true);
        setSendBlChecked(true);
        setEmailCustomNote('');
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Impossible de modifier le statut.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendDeliveryDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailPromptOrder) return;
    setIsSendingDocs(true);
    try {
      const res = await fetchApi(`/storefront-cms/orders/${emailPromptOrder.id}/send-delivery-documents`, {
        method: 'POST',
        body: JSON.stringify({
          sendInvoice: sendInvoiceChecked,
          sendDeliverySlip: sendBlChecked,
          customEmail: emailRecipient.trim() || undefined,
          customNote: emailCustomNote.trim() || undefined,
        }),
      });
      setEmailPromptOrder(null);
      showFeedback('success', res?.message || 'Documents envoyés au client avec succès.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Échec lors de l’envoi des documents.');
    } finally {
      setIsSendingDocs(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PROCESSING', 'PREPARING', 'READY_FOR_SHIPMENT'].includes(o.status)
    ).length;
    const completed = orders.filter((o) => o.status === 'DELIVERED').length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((acc, o) => acc + o.totalAmount, 0);
    return { total, pending, completed, totalRevenue };
  }, [orders]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Livrée
          </span>
        );
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            {status === 'OUT_FOR_DELIVERY' ? 'En livraison' : 'Expédiée'}
          </span>
        );
      case 'PREPARING':
      case 'PROCESSING':
      case 'READY_FOR_SHIPMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            {status === 'READY_FOR_SHIPMENT' ? 'Prête' : 'En Préparation'}
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            Confirmée
          </span>
        );
      case 'CANCELLED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {status === 'CANCELLED' ? 'Annulée' : 'Échouée'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            En attente
          </span>
        );
    }
  };

  const columns: ColumnDef<OrderMasterItem>[] = [
    {
      key: 'reference',
      header: 'Réf. Commande',
      sortable: true,
      sortValue: (row) => row.reference,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            CMD
          </div>
          <div>
            <span className="font-mono font-bold text-neutral-900 text-xs block">
              {row.reference}
            </span>
            <span className="text-[10px] text-neutral-500">
              {row.channel === 'ONLINE' && 'Storefront Web'}
              {row.channel === 'POS' && 'Caisse Showroom'}
              {row.channel === 'PHONE' && 'Téléphone / B2B'}
              {!['ONLINE', 'POS', 'PHONE'].includes(row.channel) && row.channel}
            </span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.reference} (${row.channel})`,
    },
    {
      key: 'customer',
      header: 'Client Acheteur',
      sortable: true,
      sortValue: (row) => row.customerName,
      render: (row) => (
        <div>
          <div className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <span>{row.customerName}</span>
            {row.isGuest ? (
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-neutral-100 text-neutral-600 border">
                Invité
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Client
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-[220px]">
            {row.customerPhone} • {row.city}
          </div>
        </div>
      ),
      printRender: (row) => `${row.customerName} (${row.customerPhone}, ${row.city})`,
    },
    {
      key: 'status',
      header: 'Statut Commercial',
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => renderStatusBadge(row.status),
      printRender: (row) => row.status,
    },
    {
      key: 'paymentStatus',
      header: 'Règlement',
      sortable: true,
      sortValue: (row) => row.paymentStatus,
      render: (row) => (
        <div>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border',
              row.paymentStatus === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            )}
          >
            {row.paymentStatus === 'PAID' ? '✓ Payé' : 'En attente'}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5 truncate max-w-[160px]">
            {row.paymentMethod}
          </span>
        </div>
      ),
      printRender: (row) => `${row.paymentStatus} (${row.paymentMethod})`,
    },
    {
      key: 'totalAmount',
      header: 'Total TTC',
      sortable: true,
      sortValue: (row) => row.totalAmount,
      render: (row) => (
        <span className="font-mono text-xs font-black text-neutral-900">
          {formatTndCurrency(row.totalAmount)}
        </span>
      ),
      printRender: (row) => formatTndCurrency(row.totalAmount),
    },
    {
      key: 'createdAt',
      header: 'Date de Commande',
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-neutral-900">
            {new Date(row.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            {new Date(row.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
      printRender: (row) => new Date(row.createdAt).toLocaleString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openOrderModal(row)}
            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs cursor-pointer"
            title="Consulter et gérer la commande"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/dashboard/orders/${row.id}`}
            className="p-1.5 rounded-lg text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition shadow-2xs"
            title="Ouvrir le dossier complet"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage || ''}
        type={feedbackType}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Header Card with Breadcrumbs */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
                Commandes Clients & Ventes
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Suivi centralisé des commandes omnicanales (Storefront Web, Showrooms et B2B), préparation et évolution des statuts.
              </p>
            </div>
          </div>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Gestion Commerciale', href: '/dashboard' },
              { label: 'Commandes Omnicanales' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadOrders}
            variant="outline"
            className="text-xs py-2 px-3 border-neutral-200 shadow-sm hover:bg-neutral-50 flex items-center gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 KPIs Master Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Commandes Totales</span>
            <ShoppingBag className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">En base PostgreSQL</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>En Cours / Préparation</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.pending}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">À traiter ou expédier</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Livrées & Clôturées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {stats.completed}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Livrées au client</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Chiffre d’Affaires TTC</span>
            <Tag className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {formatTndCurrency(stats.totalRevenue)}
          </div>
          <div className="text-[11px] text-neutral-500">Hors commandes annulées</div>
        </div>
      </div>

      {/* 3. Main DataTable */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedOrderIds}
        onSelectionChange={setSelectedOrderIds}
        onBulkDelete={(keys) => setBulkDeleteOrderIds(keys)}
        renderBulkActions={() => (
          <select
            value=""
            disabled={isUpdatingStatus}
            onChange={(e) => {
              const st = e.target.value;
              if (st) handleBulkOrderStatus(st);
            }}
            aria-label="Changer statut commande"
            className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
          >
            <option value="">Changer statut...</option>
            <option value="CONFIRMED">CONFIRMED (Confirmée)</option>
            <option value="PREPARING">PREPARING (En préparation)</option>
            <option value="SHIPPED">SHIPPED (Expédiée)</option>
            <option value="DELIVERED">DELIVERED (Livrée)</option>
            <option value="CANCELLED">CANCELLED (Annulée)</option>
          </select>
        )}
        searchPlaceholder="Rechercher par référence CMD-..., client, ville, téléphone..."
        searchKeys={['reference', 'customerName', 'customerPhone', 'customerEmail', 'city', 'channel', 'paymentMethod']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        isLoading={isLoading}
        onRefresh={loadOrders}
        printTitle="Commandes Omnicanales & Ventes — Royal"
        exportFileName="commandes_royal"
        customFilters={[
          {
            key: 'status',
            label: 'Statut',
            value: statusFilter || 'ALL',
            onChange: (val) => setStatusFilter(val === 'ALL' ? '' : val),
            allLabel: 'Tous les statuts',
            options: [
              { value: 'PENDING', label: 'PENDING (En attente)' },
              { value: 'CONFIRMED', label: 'CONFIRMED (Confirmée)' },
              { value: 'PREPARING', label: 'PREPARING (En préparation)' },
              { value: 'SHIPPED', label: 'SHIPPED (Expédiée)' },
              { value: 'DELIVERED', label: 'DELIVERED (Livrée)' },
              { value: 'CANCELLED', label: 'CANCELLED (Annulée)' },
            ],
          },
        ]}
      />

      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          size="4xl"
          title={
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg text-neutral-900">
                    Fiche Commande — {selectedOrder.reference}
                  </span>
                  {renderStatusBadge(selectedOrder.status)}
                </div>
                <div className="text-xs text-neutral-500">
                  Client : {selectedOrder.customerName} ({selectedOrder.customerPhone}) — {selectedOrder.customerEmail}
                </div>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </Button>
                <Link
                  href={`/dashboard/orders/${selectedOrder.id}`}
                  className="text-xs px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 font-semibold text-neutral-800 inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Vue Complète</span>
                </Link>
              </div>
              <Button
                variant="gold"
                onClick={() => setSelectedOrder(null)}
                className="text-xs px-4 py-2"
              >
                Fermer
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-5 text-xs">
            {/* Status Workflow Bar */}
            <form
              onSubmit={handleUpdateOrderStatus}
              className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                  Statut de la commande
                </label>
                <Select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-5">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                  Note de suivi (optionnel)
                </label>
                <input
                  type="text"
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Ex: Colis confié au transporteur..."
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="md:col-span-3">
                <Button
                  type="submit"
                  variant="gold"
                  isLoading={isUpdatingStatus}
                  disabled={nextStatus === selectedOrder.status || selectedOrder.status === 'CANCELLED'}
                  className="w-full h-10 text-xs"
                >
                  Mettre à jour
                </Button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">
                  Adresse de Livraison
                </span>
                <div className="font-bold text-neutral-900">{selectedOrder.customerName}</div>
                <div className="text-neutral-700">{selectedOrder.shippingAddress}</div>
                <div className="font-semibold text-neutral-900">{selectedOrder.city}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">
                  Paiement & Canal
                </span>
                <div className="font-bold text-neutral-900">{selectedOrder.paymentMethod}</div>
                <div className="text-neutral-600">Statut : {selectedOrder.paymentStatus}</div>
                <div className="text-neutral-500">Canal : {selectedOrder.channel}</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-neutral-900 mb-2">Articles Commandés</h4>
              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase text-neutral-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                      <th className="py-2.5 px-3 text-center">Quantité</th>
                      <th className="py-2.5 px-3 text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedOrder.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3 font-medium text-neutral-900">
                          {it.name}
                          {it.variantName && (
                            <span className="text-[10px] text-neutral-400 block">{it.variantName}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-500">{it.sku}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatTndCurrency(it.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                          {formatTndCurrency(it.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-end">
              <div className="w-64 space-y-1.5 font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>Sous-total :</span>
                  <span>{formatTndCurrency(selectedOrder.subtotalAmount)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Remise :</span>
                    <span>-{formatTndCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600">
                  <span>Livraison :</span>
                  <span>
                    {selectedOrder.shippingFee > 0 ? formatTndCurrency(selectedOrder.shippingFee) : 'Offerte'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm text-neutral-900 border-t border-neutral-300 pt-1.5">
                  <span>Total Net TTC :</span>
                  <span>{formatTndCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Email Prompt Modal after DELIVERED */}
      <Modal
        isOpen={!!emailPromptOrder}
        onClose={() => setEmailPromptOrder(null)}
        title="Envoi Manuel — Facture & Bon de Livraison"
        subtitle={
          emailPromptOrder
            ? `Commande ${emailPromptOrder.reference} livrée — Confirmer l'envoi client`
            : ''
        }
        type="details"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmailPromptOrder(null)}
            >
              Ignorer (Ne pas envoyer)
            </Button>
            <Button
              type="submit"
              form="orders-send-docs-form"
              variant="gold"
              size="sm"
              isLoading={isSendingDocs}
              disabled={(!sendInvoiceChecked && !sendBlChecked) || !emailRecipient.trim()}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Envoyer par E-mail</span>
            </Button>
          </div>
        }
      >
        <form id="orders-send-docs-form" onSubmit={handleSendDeliveryDocs} className="p-6 space-y-4 text-xs">
          <p className="text-neutral-600 leading-relaxed">
            La commande est passée au statut <strong className="text-emerald-700">Livrée</strong>. Choisissez manuellement les documents PDF à transmettre au client :
          </p>

          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
              Adresse E-mail du Client *
            </label>
            <input
              type="email"
              required
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder="client@exemple.tn"
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvoiceChecked}
                onChange={(e) => setSendInvoiceChecked(e.target.checked)}
                className="accent-[#C59B27] h-4 w-4"
              />
              <span className="font-bold text-neutral-900">Facture Client (FAC)</span>
            </label>
            <label className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendBlChecked}
                onChange={(e) => setSendBlChecked(e.target.checked)}
                className="accent-[#C59B27] h-4 w-4"
              />
              <span className="font-bold text-neutral-900">Bon de Livraison (BL)</span>
            </label>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
              Message Personnalisé (Optionnel)
            </label>
            <input
              type="text"
              value={emailCustomNote}
              onChange={(e) => setEmailCustomNote(e.target.value)}
              placeholder="Ex: Merci pour votre achat, garantie 24 mois incluse..."
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900"
            />
          </div>
        </form>
      </Modal>
      <DeleteConfirmModal
        isOpen={bulkDeleteOrderIds.length > 0}
        onClose={() => setBulkDeleteOrderIds([])}
        onConfirm={confirmBulkDeleteOrders}
        isDeleting={isUpdatingStatus}
        title="Archiver les commandes sélectionnées"
        description={`Confirmez-vous la suppression / l’archivage des ${bulkDeleteOrderIds.length} commande(s) sélectionnée(s) ?`}
      />
    </div>
  );
}
