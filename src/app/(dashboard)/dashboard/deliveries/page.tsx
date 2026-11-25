'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  MapPin,
  Package,
  User,
  XCircle,
  Plus,
  Trash2,
  Webhook,
  Copy,
  Zap,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal, DeleteConfirmModal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';
import { useSystemDocumentConfig } from '@/hooks/useSystemDocumentConfig';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';

export interface DeliveryItem {
  id: string;
  trackingNumber: string;
  orderReference: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  carrierType: 'INTERNAL_FLEET' | 'PARTNER_EXPRESS';
  carrierName: string;
  driverName?: string;
  driverPhone?: string;
  status: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED_RETURN';
  codAmountTnd: number;
  isCodCollected: boolean;
  packageCount: number;
  weightKg?: number;
  warehouseId?: string;
  stockApplied?: boolean;
  createdAt: string;
  estimatedDeliveryDate: string;
  deliveredAt?: string | null;
  items: Array<{ variantId?: string; name: string; sku: string; quantity: number }>;
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [catalogVariants, setCatalogVariants] = useState<
    Array<{ variantId: string; productName: string; sku: string }>
  >([]);
  const sysDoc = useSystemDocumentConfig();
  const { isRouteVisible } = useRouteVisibility();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
  const [bulkDeleteDeliveryIds, setBulkDeleteDeliveryIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Tunis');
  const [formCarrier, setFormCarrier] = useState('Flotte Interne Royal');
  const [formCod, setFormCod] = useState('0');
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formLines, setFormLines] = useState<Array<{ variantId: string; name: string; sku: string; quantity: number }>>([]);
  const [isWebhooksOpen, setIsWebhooksOpen] = useState(false);
  const [carrierWebhooks, setCarrierWebhooks] = useState<any[]>([]);
  const [carrierLogs, setCarrierLogs] = useState<any[]>([]);
  const [deliveryCompanies, setDeliveryCompanies] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [simTracking, setSimTracking] = useState('');
  const [simCarrier, setSimCarrier] = useState('aramex');
  const [simStatus, setSimStatus] = useState('DELIVERED');
  const [simulating, setSimulating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, slipsRes, companiesRes, ordList, whRes, rawProds, cwRes, clRes] = await Promise.all([
        fetchApi('/storefront-cms/sys-config/deliverySlips').catch(() => null),
        fetchApi('/deliveries/slips').catch(() => []),
        fetchApi('/deliveries/companies?activeOnly=true').catch(() => []),
        fetchAllPaginated<any>('/orders', 200).then((r) => r.items).catch(() => []),
        fetchApi('/warehouses').catch(() => []),
        fetchAllPaginated<any>('/products?status=ACTIVE', 200).then((r) => r.items).catch(() => []),
        fetchApi('/storefront-cms/sys-config/carrierWebhooks').catch(() => null),
        fetchApi('/storefront-cms/sys-config/carrierLogs').catch(() => null),
      ]);

      const companiesList = Array.isArray(companiesRes) ? companiesRes : [];
      setDeliveryCompanies(companiesList);
      if (companiesList.length > 0) {
        setFormCarrier((prev) => (prev === 'Flotte Interne Royal' ? companiesList[0].name : prev));
      }

      const cfgList = Array.isArray(cfgRes?.value || cfgRes?.data?.value)
        ? cfgRes?.value || cfgRes?.data?.value
        : [];
      const dbMapped: DeliveryItem[] = (Array.isArray(slipsRes) ? slipsRes : []).map((d: any) => {
        const addr = d.order?.shippingAddressJson || {};
        const cust = d.order?.customer;
        const cName = cust
          ? `${cust.firstName || ''} ${cust.lastName || ''}`.trim()
          : d.order?.guestName || 'Client Royal';
        const cPhone = cust?.phone || d.order?.guestPhone || addr?.phone || '+216';
        return {
          id: d.id,
          trackingNumber: d.trackingNumber || d.reference || `BL-${d.id.slice(-6)}`,
          orderReference: d.order?.reference ? `#${d.order.reference}` : '#CMD',
          customerName: cName,
          customerPhone: cPhone,
          deliveryAddress: [addr?.street, addr?.street2].filter(Boolean).join(', ') || 'Adresse client',
          city: addr?.state || addr?.city || 'Tunisie',
          carrierType: d.company ? 'PARTNER_EXPRESS' : 'INTERNAL_FLEET',
          carrierName: d.company?.name || 'Transporteur Royal',
          status:
            d.status === 'DELIVERED'
              ? 'DELIVERED'
              : d.status === 'IN_TRANSIT' || d.status === 'OUT_FOR_DELIVERY'
                ? 'IN_TRANSIT'
                : d.status === 'FAILED' || d.status === 'RETURNED'
                  ? 'FAILED_RETURN'
                  : 'PREPARING',
          codAmountTnd: Number(d.order?.totalAmount ?? d.shippingCost ?? 0),
          isCodCollected: d.status === 'DELIVERED',
          packageCount: 1,
          createdAt: d.createdAt || new Date().toISOString(),
          estimatedDeliveryDate: d.estimatedDate || new Date().toISOString().slice(0, 10),
          deliveredAt: d.deliveredAt || null,
          items: [],
        };
      });

      const mergedByTrack = new Map<string, DeliveryItem>();
      [...dbMapped, ...cfgList].forEach((item: DeliveryItem) => {
        if (item?.trackingNumber && !mergedByTrack.has(item.trackingNumber)) {
          mergedByTrack.set(item.trackingNumber, item);
        }
      });
      const mergedList = Array.from(mergedByTrack.values());
      setDeliveries(mergedList);
      const cwList = cwRes?.value || cwRes?.data?.value || [];
      setCarrierWebhooks(Array.isArray(cwList) ? cwList : []);
      const clList = clRes?.value || clRes?.data?.value || [];
      setCarrierLogs(Array.isArray(clList) ? clList : []);
      if (mergedList.length > 0) {
        setSimTracking((prev) => prev || mergedList[0].trackingNumber || '');
      }

      setOrders(Array.isArray(ordList) ? ordList : []);

      const whList = Array.isArray(whRes) ? whRes : whRes?.data || [];
      setWarehouses(whList);
      if (whList.length > 0) setFormWarehouseId((prev) => prev || whList[0].id);

      const flat: Array<{ variantId: string; productName: string; sku: string }> = [];
      for (const p of Array.isArray(rawProds) ? rawProds : []) {
        for (const v of p.variants || []) {
          flat.push({
            variantId: v.id,
            productName: `${p.name}${v.name && v.name !== 'Standard' ? ` (${v.name})` : ''}`,
            sku: v.sku || p.sku,
          });
        }
      }
      setCatalogVariants(flat);
      if (flat.length > 0) {
        setFormLines((prev) =>
          prev.length === 0 ? [{ variantId: flat[0].variantId, name: flat[0].productName, sku: flat[0].sku, quantity: 1 }] : prev
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveCarrierWebhooks = async (nextList: any[]) => {
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/carrierWebhooks', {
        method: 'PUT',
        body: JSON.stringify({ value: nextList }),
      });
      setCarrierWebhooks(nextList);
      setFeedbackMessage({ text: 'Webhooks transporteurs tunisiens enregistrés.', type: 'success' });
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur sauvegarde webhooks.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!simTracking.trim()) {
      setFeedbackMessage({ text: 'Sélectionnez ou saisissez un numéro de suivi BL.', type: 'error' });
      return;
    }
    setSimulating(true);
    try {
      const res = await fetchApi(`/storefront-cms/webhooks/carrier-test/${simCarrier}`, {
        method: 'POST',
        body: JSON.stringify({
          trackingNumber: simTracking.trim(),
          status: simStatus,
          note: `Test manuel depuis Dashboard (${simCarrier})`,
        }),
      });
      await loadData();
      setFeedbackMessage({
        text: res?.updatedSlip
          ? `Webhook exécuté : BL ${res.updatedSlip.trackingNumber} → ${res.updatedSlip.status}.`
          : 'Webhook journalisé (aucun BL correspondant exact trouvé).',
        type: 'success',
      });
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Échec du test webhook.', type: 'error' });
    } finally {
      setSimulating(false);
    }
  };

  const persistDeliveries = async (nextList: DeliveryItem[]) => {
    await fetchApi('/storefront-cms/sys-config/deliverySlips', {
      method: 'PUT',
      body: JSON.stringify({ value: nextList }),
    });
    setDeliveries(nextList);
  };

  const handleBulkDeliveryPatch = async (
    patch: Partial<DeliveryItem>,
    label: string
  ) => {
    if (selectedDeliveryIds.length === 0) return;
    setSaving(true);
    try {
      const idSet = new Set(selectedDeliveryIds);
      const nextList = deliveries.map((d) =>
        idSet.has(d.id)
          ? {
              ...d,
              ...patch,
              deliveredAt:
                patch.status === 'DELIVERED' ? d.deliveredAt || new Date().toISOString() : d.deliveredAt,
            }
          : d
      );
      await persistDeliveries(nextList);
      setFeedbackMessage({
        text: `${selectedDeliveryIds.length} bon(s) de livraison ${label}.`,
        type: 'success',
      });
      setSelectedDeliveryIds([]);
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur mise à jour groupée.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmBulkDeleteDeliveries = async () => {
    if (bulkDeleteDeliveryIds.length === 0) return;
    setSaving(true);
    try {
      const idSet = new Set(bulkDeleteDeliveryIds);
      await persistDeliveries(deliveries.filter((d) => !idSet.has(d.id)));
      setFeedbackMessage({
        text: `${bulkDeleteDeliveryIds.length} bon(s) de livraison supprimé(s).`,
        type: 'success',
      });
      setBulkDeleteDeliveryIds([]);
      setSelectedDeliveryIds([]);
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur lors de la suppression.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleImportOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;
    const cust = ord.customer;
    setFormCustomerName(
      cust ? `${cust.firstName || ''} ${cust.lastName || ''}`.trim() : ord.customerName || 'Client Royal'
    );
    setFormCustomerPhone(cust?.phone || ord.customerPhone || '');
    setFormAddress(ord.shippingAddress || cust?.address || '');
    setFormCity(ord.shippingCity || cust?.city || 'Tunis');
    setFormCod(ord.paymentMethod === 'COD' ? String(Number(ord.totalAmount || 0)) : '0');
    const lines = (ord.items || []).map((it: any) => ({
      variantId: it.variantId || it.productVariantId || '',
      name: it.productName || it.name || 'Article',
      sku: it.sku || '',
      quantity: Number(it.quantity || 1),
    }));
    if (lines.length > 0) setFormLines(lines);
  };

  const handleTransition = async (del: DeliveryItem, nextStatus: DeliveryItem['status'], markCodCollected?: boolean) => {
    setSaving(true);
    try {
      let nextStockApplied = Boolean(del.stockApplied);
      if (nextStatus === 'DELIVERED' && !nextStockApplied) {
        await fetchApi('/storefront-cms/stock-lifecycle/apply', {
          method: 'POST',
          body: JSON.stringify({
            docType: 'BL',
            docReference: del.trackingNumber,
            warehouseId: del.warehouseId || warehouses[0]?.id,
            restore: false,
            items: del.items.map((it) => ({
              variantId: it.variantId,
              sku: it.sku,
              quantity: it.quantity,
            })),
          }),
        });
        nextStockApplied = true;
      } else if (nextStatus === 'FAILED_RETURN' && nextStockApplied) {
        await fetchApi('/storefront-cms/stock-lifecycle/apply', {
          method: 'POST',
          body: JSON.stringify({
            docType: 'BL',
            docReference: del.trackingNumber,
            warehouseId: del.warehouseId || warehouses[0]?.id,
            restore: true,
            items: del.items.map((it) => ({
              variantId: it.variantId,
              sku: it.sku,
              quantity: it.quantity,
            })),
          }),
        });
        nextStockApplied = false;
      }

      const updated: DeliveryItem = {
        ...del,
        status: nextStatus,
        stockApplied: nextStockApplied,
        isCodCollected: markCodCollected !== undefined ? markCodCollected : del.isCodCollected,
        deliveredAt: nextStatus === 'DELIVERED' ? new Date().toISOString() : del.deliveredAt,
      };
      const nextList = deliveries.map((d) => (d.id === del.id ? updated : d));
      await persistDeliveries(nextList);
      setSelectedDelivery(updated);
      setFeedbackMessage({
        text: `Bon de Livraison ${del.trackingNumber} mis à jour (${nextStatus}).`,
        type: 'success',
      });
    } catch (err: any) {
      setFeedbackMessage({
        text: err?.message || 'Erreur lors de la mise à jour du BL.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formLines.length === 0) return;
    setSaving(true);
    try {
      const ord = orders.find((o) => o.id === selectedOrderId);
      const nextNum = sysDoc.generateNextRef('BL', deliveries.length + 1);
      const newDoc: DeliveryItem = {
        id: `del-${Date.now()}`,
        trackingNumber: nextNum,
        orderReference: ord ? `#${ord.reference}` : `#CMD-${Date.now().toString().slice(-4)}`,
        customerName: formCustomerName.trim() || 'Client Royal',
        customerPhone: formCustomerPhone.trim() || '+216',
        deliveryAddress: formAddress.trim() || 'Adresse client',
        city: formCity.trim() || 'Tunis',
        carrierType: 'INTERNAL_FLEET',
        carrierName: formCarrier,
        status: 'PREPARING',
        codAmountTnd: Number(formCod || 0),
        isCodCollected: Number(formCod || 0) === 0,
        packageCount: formLines.reduce((s, l) => s + l.quantity, 0),
        warehouseId: formWarehouseId || warehouses[0]?.id,
        stockApplied: false,
        createdAt: new Date().toISOString(),
        estimatedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        items: formLines.map((l) => ({
          variantId: l.variantId,
          name: l.name,
          sku: l.sku,
          quantity: Number(l.quantity || 1),
        })),
      };
      await persistDeliveries([newDoc, ...deliveries]);
      setIsCreateOpen(false);
      setSelectedOrderId('');
      setFeedbackMessage({ text: `Bon de Livraison ${nextNum} enregistré.`, type: 'success' });
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur lors de la création du BL.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = deliveries.length;
    const inTransit = deliveries.filter((d) => d.status === 'IN_TRANSIT').length;
    const delivered = deliveries.filter((d) => d.status === 'DELIVERED').length;
    const failed = deliveries.filter((d) => d.status === 'FAILED_RETURN').length;
    return { total, inTransit, delivered, failed };
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    if (filterStatus === 'ALL') return deliveries;
    return deliveries.filter((d) => d.status === filterStatus);
  }, [deliveries, filterStatus]);

  const columns: ColumnDef<DeliveryItem>[] = [
    {
      key: 'trackingNumber',
      header: 'N° Expédition & BL',
      sortable: true,
      sortValue: (row) => row.trackingNumber,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            LIV
          </div>
          <div>
            <span className="font-mono font-bold text-neutral-900 text-xs block">
              {row.trackingNumber}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              {row.orderReference}
            </span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.trackingNumber} (${row.orderReference})`,
    },
    {
      key: 'customer',
      header: 'Destinataire & Ville',
      sortable: true,
      sortValue: (row) => row.customerName,
      render: (row) => (
        <div>
          <div className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <span>{row.customerName}</span>
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-neutral-400" />
            <span>{row.city}</span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.customerName} - ${row.city}`,
    },
    {
      key: 'carrier',
      header: 'Transporteur & Chauffeur',
      sortable: true,
      sortValue: (row) => row.carrierName,
      render: (row) => (
        <div>
          <div className="text-xs font-medium text-neutral-800">
            {row.carrierName}
          </div>
          {row.driverName && (
            <div className="text-[11px] text-neutral-500">
              Chauffeur : {row.driverName}
            </div>
          )}
        </div>
      ),
      printRender: (row) => `${row.carrierName} (${row.driverName || 'N/A'})`,
    },
    {
      key: 'status',
      header: 'Statut Acheminement',
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => {
        if (row.status === 'DELIVERED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Livré avec Succès
            </span>
          );
        }
        if (row.status === 'IN_TRANSIT') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              En Transit
            </span>
          );
        }
        if (row.status === 'FAILED_RETURN') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Échec / Retour
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            En Préparation
          </span>
        );
      },
      printRender: (row) => row.status,
    },
    {
      key: 'codAmountTnd',
      header: 'Contre-Remboursement',
      sortable: true,
      sortValue: (row) => row.codAmountTnd,
      render: (row) => (
        <div>
          {row.codAmountTnd > 0 ? (
            <div>
              <span className="font-mono text-xs font-bold text-neutral-900 block">
                {formatTndCurrency(row.codAmountTnd)}
              </span>
              <span
                className={cn(
                  'text-[10px] font-bold',
                  row.isCodCollected ? 'text-emerald-700' : 'text-amber-700'
                )}
              >
                {row.isCodCollected ? '✓ Encaissé' : 'À Encaisser'}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-neutral-400">Payé en ligne</span>
          )}
        </div>
      ),
      printRender: (row) => row.codAmountTnd > 0 ? formatTndCurrency(row.codAmountTnd) : 'Payé en ligne',
    },
    {
      key: 'createdAt',
      header: 'Date d’Expédition',
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
      printRender: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedDelivery(row)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs cursor-pointer"
            title="Consulter le bon de livraison et suivi"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type || 'success'}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Page Header Card (Master Layout Standard) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              Gestion des Livraisons &amp; Expéditions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              LOGISTIQUE
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Pilotez les tournées, suivez la déduction de stock à la livraison confirmée et encaissez le contre-remboursement.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Ventes & Distribution', href: '/dashboard/section/sales' },
              { label: 'Bons de Livraison' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isRouteVisible('/dashboard/delivery-companies') && (
            <Link
              href="/dashboard/delivery-companies"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] bg-white hover:bg-[#FBF9F4] text-xs font-bold text-[#1D232E] transition"
            >
              <Sliders className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Sociétés &amp; Tarifs ({deliveryCompanies.length})</span>
            </Link>
          )}
          <Button
            variant="outline"
            onClick={() => setIsWebhooksOpen(true)}
            className="text-xs px-3.5 py-2.5 flex items-center gap-2"
          >
            <Webhook className="w-4 h-4 text-[#C59B27]" />
            <span>Webhooks Transporteurs ({carrierWebhooks.filter((c) => c.isActive).length})</span>
          </Button>
          <Button
            variant="gold"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs px-4 py-2.5 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Bon de Livraison (BL)</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Expéditions Totales</span>
            <Package className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">Toutes commandes confondues</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>En Transit Actuel</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.inTransit}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Camions en livraison</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Livrées avec Succès</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {stats.delivered}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Signature client obtenue</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700">
            <span>Échecs & Retours</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 font-heading">
            {stats.failed}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">Client absent ou refus</div>
        </div>
      </div>

      <DataTable<DeliveryItem>
        data={filteredDeliveries}
        isLoading={loading}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedDeliveryIds}
        onSelectionChange={setSelectedDeliveryIds}
        onBulkDelete={(keys) => setBulkDeleteDeliveryIds(keys)}
        renderBulkActions={() => (
          <>
            <select
              value=""
              disabled={saving}
              onChange={(e) => {
                const st = e.target.value as DeliveryItem['status'];
                if (st) handleBulkDeliveryPatch({ status: st }, `passé(s) en « ${st} »`);
              }}
              aria-label="Changer statut BL"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Statut BL...</option>
              <option value="PREPARING">En Préparation</option>
              <option value="IN_TRANSIT">En Transit</option>
              <option value="DELIVERED">Livré</option>
              <option value="FAILED_RETURN">Échec / Retour</option>
            </select>
            <select
              value=""
              disabled={saving}
              onChange={(e) => {
                const ct = e.target.value as DeliveryItem['carrierType'];
                if (ct) {
                  handleBulkDeliveryPatch(
                    {
                      carrierType: ct,
                      carrierName: ct === 'INTERNAL_FLEET' ? 'Flotte Interne Royal' : 'Transporteur Express Partenaire',
                    },
                    `assigné(s) (${ct})`
                  );
                }
              }}
              aria-label="Changer type transporteur"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Transporteur...</option>
              <option value="INTERNAL_FLEET">Flotte Interne</option>
              <option value="PARTNER_EXPRESS">Express Partenaire</option>
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleBulkDeliveryPatch({ isCodCollected: true }, 'marqué(s) COD encaissé')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              COD Encaissé
            </button>
          </>
        )}
        searchPlaceholder="Rechercher par N° LIV-2026-XXX, commande, client, ville..."
        searchKeys={['trackingNumber', 'orderReference', 'customerName', 'city', 'carrierName', 'driverName']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Suivi des Expéditions & Livraisons — Royal"
        exportFileName="livraisons_royal"
        customFilters={[
          {
            key: 'status',
            label: 'Statut',
            value: filterStatus,
            onChange: setFilterStatus,
            allLabel: 'Tous les statuts',
            options: [
              { value: 'PREPARING', label: 'En Préparation' },
              { value: 'IN_TRANSIT', label: 'En Transit' },
              { value: 'DELIVERED', label: 'Livré avec Succès' },
              { value: 'FAILED_RETURN', label: 'Échec / Retour' },
            ],
          },
        ]}
      />

      {selectedDelivery && (
        <Modal
          isOpen={!!selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          size="4xl"
          title={
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg text-neutral-900">
                    Bon de Livraison — {selectedDelivery.trackingNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-100 text-neutral-800 border">
                    {selectedDelivery.orderReference}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  Transporteur : {selectedDelivery.carrierName}
                </div>
              </div>
            </div>
          }
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer Bon de Livraison</span>
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                {selectedDelivery.status === 'PREPARING' && (
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => handleTransition(selectedDelivery, 'IN_TRANSIT')}
                    className="text-xs px-3.5 py-2"
                  >
                    Passer En Transit
                  </Button>
                )}
                {(selectedDelivery.status === 'PREPARING' || selectedDelivery.status === 'IN_TRANSIT') && (
                  <Button
                    variant="primary"
                    disabled={saving}
                    onClick={() => handleTransition(selectedDelivery, 'DELIVERED', true)}
                    className="text-xs px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    {saving ? 'Validation...' : 'Confirmer Livré (+ Stock)'}
                  </Button>
                )}
                {selectedDelivery.status !== 'FAILED_RETURN' && (
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => handleTransition(selectedDelivery, 'FAILED_RETURN')}
                    className="text-xs px-3.5 py-2 text-rose-700 border-rose-200 hover:bg-rose-50"
                  >
                    Échec / Retour Stock
                  </Button>
                )}
                <Button
                  variant="gold"
                  onClick={() => setSelectedDelivery(null)}
                  className="text-xs px-4 py-2"
                >
                  Fermer
                </Button>
              </div>
            </div>
          }
        >
          <div className="p-6 space-y-5 text-xs">
            <DocumentPrintHeader
              docCode="BL"
              docTitle="BON DE LIVRAISON CLIENT"
              reference={selectedDelivery.trackingNumber}
              date={selectedDelivery.createdAt}
              status={selectedDelivery.status}
            />
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                  Client & Coordonnées
                </span>
                <div className="font-bold text-neutral-900">{selectedDelivery.customerName}</div>
                <div className="text-neutral-600">{selectedDelivery.customerPhone}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                  Adresse de Livraison
                </span>
                <div className="text-neutral-800">{selectedDelivery.deliveryAddress}</div>
                <div className="font-semibold text-neutral-900">
                  {selectedDelivery.city} • Stock DB : {selectedDelivery.stockApplied ? 'Décrémenté' : 'Non déduit'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-neutral-900 mb-2">Contenu du Colis</h4>
              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase text-neutral-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Quantité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedDelivery.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-neutral-900">{it.name}</td>
                        <td className="py-2.5 px-3 font-mono text-neutral-500">{it.sku}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                          {it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <DocumentPrintFooter docCode="BL" reference={selectedDelivery.trackingNumber} showTaxNotice={false} />
          </div>
        </Modal>
      )}

      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          size="3xl"
          title="Nouveau Bon de Livraison (BL)"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs px-4 py-2">
                Annuler
              </Button>
              <Button variant="gold" disabled={saving} onClick={handleCreateSubmit} className="text-xs px-5 py-2">
                {saving ? 'Enregistrement...' : 'Créer le Bon de Livraison'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Importer depuis une Commande Client</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleImportOrder(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                >
                  <option value="">— Saisie manuelle —</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.reference} — {o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : o.customerName || 'Client'} ({formatTndCurrency(Number(o.totalAmount || 0))})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Entrepôt Source</label>
                <select
                  value={formWarehouseId}
                  onChange={(e) => setFormWarehouseId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Nom Client</label>
                <input
                  type="text"
                  required
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  placeholder="Nom complet"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  value={formCustomerPhone}
                  onChange={(e) => setFormCustomerPhone(e.target.value)}
                  placeholder="+216..."
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Adresse &amp; Ville</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Rue / Avenue..."
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">COD (TND)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={formCod}
                    onChange={(e) => setFormCod(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800">Articles à livrer</span>
                <button
                  type="button"
                  onClick={() => {
                    const first = catalogVariants[0];
                    if (!first) return;
                    setFormLines((prev) => [...prev, { variantId: first.variantId, name: first.productName, sku: first.sku, quantity: 1 }]);
                  }}
                  className="text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  + Ajouter un article
                </button>
              </div>
              {formLines.map((ln, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={ln.variantId}
                    onChange={(e) => {
                      const v = catalogVariants.find((cv) => cv.variantId === e.target.value);
                      if (!v) return;
                      setFormLines((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, variantId: v.variantId, name: v.productName, sku: v.sku } : x))
                      );
                    }}
                    className="col-span-9 h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                  >
                    {catalogVariants.map((cv) => (
                      <option key={cv.variantId} value={cv.variantId}>
                        {cv.sku} — {cv.productName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={ln.quantity}
                    onChange={(e) =>
                      setFormLines((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value || 1) } : x))
                      )
                    }
                    className="col-span-2 h-10 px-2 rounded-xl border border-neutral-200 text-center font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setFormLines((prev) => prev.filter((_, i) => i !== idx))}
                    className="col-span-1 p-2 text-rose-500 hover:bg-rose-50 rounded-lg justify-self-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </form>
        </Modal>
      )}

      {/* Tunisian Carrier Webhooks Modal */}
      <Modal
        isOpen={isWebhooksOpen}
        onClose={() => setIsWebhooksOpen(false)}
        size="4xl"
        title="Webhooks Transporteurs Tunisiens (Aramex, First Delivery, Intigo)"
        subtitle="Synchronisation automatique des statuts de livraison et encaissements COD"
        type="edit"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsWebhooksOpen(false)}>
              Fermer
            </Button>
            <Button variant="gold" size="sm" onClick={() => saveCarrierWebhooks(carrierWebhooks)} isLoading={saving}>
              Sauvegarder Webhooks
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {carrierWebhooks.map((cw) => {
              const endpointUrl =
                typeof window !== 'undefined'
                  ? `${window.location.origin}/api/v1/storefront-cms/webhooks/carrier/${cw.code}`
                  : `/api/v1/storefront-cms/webhooks/carrier/${cw.code}`;
              return (
                <div key={cw.id} className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#1D232E]">{cw.name}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(cw.isActive)}
                      onChange={(e) =>
                        setCarrierWebhooks((prev) =>
                          prev.map((x) => (x.id === cw.id ? { ...x, isActive: e.target.checked } : x)),
                        )
                      }
                      className="accent-[#C59B27] h-4 w-4 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={endpointUrl}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E6E1D6] bg-white font-mono text-[10px] text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(endpointUrl);
                        setFeedbackMessage({ text: `URL webhook ${cw.name} copiée.`, type: 'success' });
                      }}
                      className="p-1.5 rounded-lg border border-[#E6E1D6] bg-white hover:bg-slate-50 cursor-pointer"
                      title="Copier URL Webhook"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#9A7414]" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Header x-webhook-secret
                    </label>
                    <input
                      type="text"
                      value={cw.webhookSecret || ''}
                      onChange={(e) =>
                        setCarrierWebhooks((prev) =>
                          prev.map((x) => (x.id === cw.id ? { ...x, webhookSecret: e.target.value } : x)),
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6E1D6] bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E6E1D6] space-y-3">
            <div className="font-bold text-[#1D232E] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Simulateur Webhook Temps Réel</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transporteur</label>
                <select
                  value={simCarrier}
                  onChange={(e) => setSimCarrier(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#E6E1D6] bg-white"
                >
                  {carrierWebhooks.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">N° Suivi BL</label>
                <select
                  value={simTracking}
                  onChange={(e) => setSimTracking(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#E6E1D6] bg-white font-mono"
                >
                  <option value="">Sélectionner BL...</option>
                  {deliveries.map((d) => (
                    <option key={d.id} value={d.trackingNumber}>
                      {d.trackingNumber} ({d.orderReference})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Statut Reçu</label>
                <select
                  value={simStatus}
                  onChange={(e) => setSimStatus(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#E6E1D6] bg-white"
                >
                  <option value="IN_TRANSIT">En Transit (PICKED_UP)</option>
                  <option value="DELIVERED">Livré (DELIVERED)</option>
                  <option value="FAILED_RETURN">Échec / Retour (FAILED)</option>
                </select>
              </div>
              <Button variant="outline" size="sm" onClick={handleSimulateWebhook} isLoading={simulating} className="h-9">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tester Webhook</span>
              </Button>
            </div>
          </div>

          {carrierLogs.length > 0 && (
            <div className="rounded-xl border border-[#E6E1D6] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#FBF9F4] border-b border-[#E6E1D6] text-[10px] uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Transporteur</th>
                    <th className="py-2 px-3">BL / Cmd</th>
                    <th className="py-2 px-3">Statut Appliqué</th>
                    <th className="py-2 px-3">Sync Commande</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {carrierLogs.slice(0, 5).map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                        {new Date(log.receivedAt).toLocaleString('fr-TN')}
                      </td>
                      <td className="py-2 px-3 font-semibold">{log.carrierName}</td>
                      <td className="py-2 px-3 font-mono">{log.trackingNumber}</td>
                      <td className="py-2 px-3 font-bold text-[#9A7414]">{log.mappedStatus}</td>
                      <td className="py-2 px-3">{log.orderSynced ? 'Synchronisée' : 'BL seul'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
      <DeleteConfirmModal
        isOpen={bulkDeleteDeliveryIds.length > 0}
        onClose={() => setBulkDeleteDeliveryIds([])}
        onConfirm={confirmBulkDeleteDeliveries}
        isDeleting={saving}
        title="Supprimer les bons de livraison sélectionnés"
        description={`Confirmez-vous la suppression des ${bulkDeleteDeliveryIds.length} bon(s) de livraison sélectionné(s) ?`}
      />
    </div>
  );
}
