'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Eye,
  Tag,
  Trash2,
  Building2,
  User,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal, DeleteConfirmModal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';
import { useSystemDocumentConfig } from '@/hooks/useSystemDocumentConfig';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';

export interface InvoiceLine {
  id: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPriceHt: number;
  tvaRate: number; // ex: 19%
  totalHt: number;
  totalTtc: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string; // ex: FACT-2026-001
  orderReference: string; // ex: #CMD-2026-402
  customerName: string;
  customerType: 'INDIVIDUAL' | 'COMPANY';
  customerTaxId?: string; // Matricule fiscal
  customerCin?: string; // CIN
  customerAddress: string;
  customerCity: string;
  type: 'STANDARD' | 'CREDIT_NOTE' | 'PROFORMA';
  status: 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERDUE';
  warehouseId?: string;
  stockApplied?: boolean;
  totalHt: number;
  totalTva: number;
  fiscalStampTnd: number; // 1.000 TND
  totalTtc: number;
  createdAt: string;
  dueDate: string;
  paidAt?: string | null;
  lines: InvoiceLine[];
}

export default function InvoicesPage() {
  const sysDoc = useSystemDocumentConfig();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [catalogVariants, setCatalogVariants] = useState<
    Array<{ variantId: string; productName: string; sku: string; priceTtc: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [bulkDeleteInvoiceIds, setBulkDeleteInvoiceIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerType, setFormCustomerType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [formTaxOrCin, setFormTaxOrCin] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Tunis');
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formLines, setFormLines] = useState<Array<{ variantId: string; name: string; sku: string; quantity: number; unitPriceTtc: number }>>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, ordList, whRes, rawProds] = await Promise.all([
        fetchApi('/storefront-cms/sys-config/invoicesList').catch(() => null),
        fetchAllPaginated<any>('/orders', 200).then((r) => r.items).catch(() => []),
        fetchApi('/warehouses').catch(() => []),
        fetchAllPaginated<any>('/products?status=ACTIVE', 200).then((r) => r.items).catch(() => []),
      ]);

      const cfgList = cfgRes?.value || cfgRes?.data?.value || [];
      setInvoices(Array.isArray(cfgList) ? cfgList : []);

      setOrders(Array.isArray(ordList) ? ordList : []);

      const whList = Array.isArray(whRes) ? whRes : whRes?.data || [];
      setWarehouses(whList);
      if (whList.length > 0) setFormWarehouseId((prev) => prev || whList[0].id);

      const flat: Array<{ variantId: string; productName: string; sku: string; priceTtc: number }> = [];
      for (const p of Array.isArray(rawProds) ? rawProds : []) {
        for (const v of p.variants || []) {
          flat.push({
            variantId: v.id,
            productName: `${p.name}${v.name && v.name !== 'Standard' ? ` (${v.name})` : ''}`,
            sku: v.sku || p.sku,
            priceTtc: Number(v.sellingPrice || p.discountPrice || p.sellingPrice || 0),
          });
        }
      }
      setCatalogVariants(flat);
      if (flat.length > 0) {
        setFormLines((prev) =>
          prev.length === 0
            ? [{ variantId: flat[0].variantId, name: flat[0].productName, sku: flat[0].sku, quantity: 1, unitPriceTtc: flat[0].priceTtc }]
            : prev
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistInvoices = async (nextList: InvoiceItem[]) => {
    await fetchApi('/storefront-cms/sys-config/invoicesList', {
      method: 'PUT',
      body: JSON.stringify({ value: nextList }),
    });
    setInvoices(nextList);
  };

  const handleBulkInvoicePatch = async (patch: Partial<InvoiceItem>, label: string) => {
    if (selectedInvoiceIds.length === 0) return;
    setSaving(true);
    try {
      const idSet = new Set(selectedInvoiceIds);
      const nextList = invoices.map((inv) =>
        idSet.has(inv.id)
          ? {
              ...inv,
              ...patch,
              paidAt: patch.status === 'PAID' ? inv.paidAt || new Date().toISOString() : inv.paidAt,
            }
          : inv
      );
      await persistInvoices(nextList);
      setFeedbackMessage({
        text: `${selectedInvoiceIds.length} facture(s) ${label}.`,
        type: 'success',
      });
      setSelectedInvoiceIds([]);
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur mise à jour groupée.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmBulkDeleteInvoices = async () => {
    if (bulkDeleteInvoiceIds.length === 0) return;
    setSaving(true);
    try {
      const idSet = new Set(bulkDeleteInvoiceIds);
      await persistInvoices(invoices.filter((inv) => !idSet.has(inv.id)));
      setFeedbackMessage({
        text: `${bulkDeleteInvoiceIds.length} facture(s) supprimée(s).`,
        type: 'success',
      });
      setBulkDeleteInvoiceIds([]);
      setSelectedInvoiceIds([]);
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur suppression factures.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleImportOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;
    const cust = ord.customer;
    setFormCustomerName(cust ? `${cust.firstName || ''} ${cust.lastName || ''}`.trim() : ord.customerName || 'Client Royal');
    setFormAddress(ord.shippingAddress || cust?.address || '');
    setFormCity(ord.shippingCity || cust?.city || 'Tunis');
    const lines = (ord.items || []).map((it: any) => ({
      variantId: it.variantId || it.productVariantId || '',
      name: it.productName || it.name || 'Article',
      sku: it.sku || '',
      quantity: Number(it.quantity || 1),
      unitPriceTtc: Number(it.unitPrice || it.price || 0),
    }));
    if (lines.length > 0) setFormLines(lines);
  };

  const handleStatusUpdate = async (inv: InvoiceItem, nextStatus: InvoiceItem['status'], syncStock: boolean) => {
    setSaving(true);
    try {
      let stockApplied = Boolean(inv.stockApplied);
      if (syncStock && nextStatus === 'PAID' && !stockApplied) {
        await fetchApi('/storefront-cms/stock-lifecycle/apply', {
          method: 'POST',
          body: JSON.stringify({
            docType: 'FACT',
            docReference: inv.invoiceNumber,
            warehouseId: inv.warehouseId || warehouses[0]?.id,
            restore: false,
            items: inv.lines.map((l) => ({
              variantId: l.variantId,
              sku: l.sku,
              quantity: l.quantity,
            })),
          }),
        });
        stockApplied = true;
      }

      const updated: InvoiceItem = {
        ...inv,
        status: nextStatus,
        stockApplied,
        paidAt: nextStatus === 'PAID' ? new Date().toISOString() : inv.paidAt,
      };
      const nextList = invoices.map((i) => (i.id === inv.id ? updated : i));
      await persistInvoices(nextList);
      setSelectedInvoice(updated);
      setFeedbackMessage({
        text: `Facture ${inv.invoiceNumber} mise à jour (${nextStatus})${syncStock && nextStatus === 'PAID' ? ' avec décrémentation stock.' : '.'}`,
        type: 'success',
      });
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur mise à jour facture.', type: 'error' });
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
      const vat = Number(sysDoc.defaultVatRate ?? 19);
      const divisor = 1 + vat / 100;
      const lines: InvoiceLine[] = formLines.map((l, idx) => {
        const lineTtc = Number(l.unitPriceTtc || 0) * Number(l.quantity || 1);
        const lineHt = lineTtc / divisor;
        const unitHt = Number(l.unitPriceTtc || 0) / divisor;
        return {
          id: `il-${Date.now()}-${idx}`,
          variantId: l.variantId,
          name: l.name,
          sku: l.sku,
          quantity: Number(l.quantity || 1),
          unitPriceHt: unitHt,
          tvaRate: vat,
          totalHt: lineHt,
          totalTtc: lineTtc,
        };
      });
      const sumTtcBeforeStamp = lines.reduce((s, l) => s + l.totalTtc, 0);
      const sumHt = lines.reduce((s, l) => s + l.totalHt, 0);
      const sumTva = sumTtcBeforeStamp - sumHt;
      const fiscalStamp = Number(sysDoc.generalSettings.fiscalStamp ?? 1.0);
      const nextNum = sysDoc.generateNextRef('FAC', invoices.length + 1);

      const newInv: InvoiceItem = {
        id: `inv-${Date.now()}`,
        invoiceNumber: nextNum,
        orderReference: ord ? `#${ord.reference}` : `#CMD-${Date.now().toString().slice(-4)}`,
        customerName: formCustomerName.trim() || 'Client Royal',
        customerType: formCustomerType,
        customerTaxId: formCustomerType === 'COMPANY' ? formTaxOrCin.trim() : undefined,
        customerCin: formCustomerType === 'INDIVIDUAL' ? formTaxOrCin.trim() : undefined,
        customerAddress: formAddress.trim() || 'Tunis',
        customerCity: formCity.trim() || 'Tunis',
        type: 'STANDARD',
        status: 'UNPAID',
        warehouseId: formWarehouseId || warehouses[0]?.id,
        stockApplied: false,
        totalHt: sumHt,
        totalTva: sumTva,
        fiscalStampTnd: fiscalStamp,
        totalTtc: sumTtcBeforeStamp + fiscalStamp,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        lines,
      };
      await persistInvoices([newInv, ...invoices]);
      setIsCreateOpen(false);
      setSelectedOrderId('');
      setFeedbackMessage({ text: `Facture ${nextNum} émise avec calcul TVA 19% + Timbre Fiscal.`, type: 'success' });
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur lors de la création de la facture.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Stats KPIs
  const stats = useMemo(() => {
    const total = invoices.length;
    const totalTtc = invoices.reduce((acc, i) => acc + i.totalTtc, 0);
    const paidTtc = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((acc, i) => acc + i.totalTtc, 0);
    const unpaidCount = invoices.filter((i) => i.status === 'UNPAID' || i.status === 'PARTIAL').length;
    return { total, totalTtc, paidTtc, unpaidCount };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (filterStatus === 'ALL') return invoices;
    return invoices.filter((i) => i.status === filterStatus);
  }, [invoices, filterStatus]);

  // Colonnes DataTable Master
  const columns: ColumnDef<InvoiceItem>[] = [
    {
      key: 'invoiceNumber',
      header: 'N° Facture Légale',
      sortable: true,
      sortValue: (row) => row.invoiceNumber,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            FAC
          </div>
          <div>
            <span className="font-mono font-bold text-neutral-900 text-xs block">
              {row.invoiceNumber}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              CMD : {row.orderReference}
            </span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.invoiceNumber} (${row.orderReference})`,
    },
    {
      key: 'customer',
      header: 'Client / Raison Sociale',
      sortable: true,
      sortValue: (row) => row.customerName,
      render: (row) => (
        <div>
          <div className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5">
            {row.customerType === 'COMPANY' ? (
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <User className="w-3.5 h-3.5 text-neutral-400" />
            )}
            <span>{row.customerName}</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            {row.customerTaxId ? `MF: ${row.customerTaxId}` : row.customerCin ? `CIN: ${row.customerCin}` : row.customerCity}
          </div>
        </div>
      ),
      printRender: (row) => `${row.customerName} (${row.customerTaxId || row.customerCin || row.customerCity})`,
    },
    {
      key: 'status',
      header: 'État d’Encaissement',
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => {
        if (row.status === 'PAID') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Payée / Soldée
            </span>
          );
        }
        if (row.status === 'PARTIAL') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
              <Clock className="w-3 h-3 text-amber-600" />
              Acompte Versé
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            En Attente
          </span>
        );
      },
      printRender: (row) => row.status,
    },
    {
      key: 'totalHt',
      header: 'Total HT',
      sortable: true,
      sortValue: (row) => row.totalHt,
      render: (row) => (
        <span className="font-mono text-xs text-neutral-600">
          {formatTndCurrency(row.totalHt)}
        </span>
      ),
      printRender: (row) => formatTndCurrency(row.totalHt),
    },
    {
      key: 'totalTtc',
      header: 'Total Net TTC',
      sortable: true,
      sortValue: (row) => row.totalTtc,
      render: (row) => (
        <span className="font-mono text-xs font-black text-neutral-900">
          {formatTndCurrency(row.totalTtc)}
        </span>
      ),
      printRender: (row) => formatTndCurrency(row.totalTtc),
    },
    {
      key: 'createdAt',
      header: 'Date d’Émission',
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
            Échéance : {row.dueDate}
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
            onClick={() => setSelectedInvoice(row)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs cursor-pointer"
            title="Consulter et imprimer la facture légale"
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
              Factures Officielles &amp; Avoirs Légaux
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              FISCALITÉ TUNISIENNE
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Émission conforme à la réglementation fiscale tunisienne (TVA 19%, timbre fiscal 1.000 DT), suivi des créances et synchronisation stock.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Ventes & Distribution', href: '/dashboard/section/sales' },
              { label: 'Factures Légales' },
            ]}
          />
        </div>
        <Button
          variant="gold"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs px-4 py-2.5 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Facture Officielle</span>
        </Button>
      </div>

      {/* 4 KPIs Master */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Factures Émises</span>
            <FileSpreadsheet className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">Numérotation chronologique</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Chiffre Facturé TTC</span>
            <Tag className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {formatTndCurrency(stats.totalTtc)}
          </div>
          <div className="text-[11px] text-neutral-500">Total facturé</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Total Encaissé</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {formatTndCurrency(stats.paidTtc)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Fonds reçus en banque/caisse</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Factures en Attente</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.unpaidCount}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Solde restant dû</div>
        </div>
      </div>

      {/* DataTable Master */}
      <DataTable<InvoiceItem>
        data={filteredInvoices}
        isLoading={loading}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedInvoiceIds}
        onSelectionChange={setSelectedInvoiceIds}
        onBulkDelete={(keys) => setBulkDeleteInvoiceIds(keys)}
        renderBulkActions={() => (
          <>
            <select
              value=""
              disabled={saving}
              onChange={(e) => {
                const st = e.target.value as InvoiceItem['status'];
                if (st) handleBulkInvoicePatch({ status: st }, `marquée(s) ${st}`);
              }}
              aria-label="Changer état facture"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">État facture...</option>
              <option value="PAID">Payée / Soldée</option>
              <option value="PARTIAL">Acompte Versé</option>
              <option value="UNPAID">En Attente</option>
              <option value="OVERDUE">En Retard</option>
            </select>
            <select
              value=""
              disabled={saving}
              onChange={(e) => {
                const tp = e.target.value as InvoiceItem['type'];
                if (tp) handleBulkInvoicePatch({ type: tp }, `passée(s) en ${tp}`);
              }}
              aria-label="Changer type document"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Type pièce...</option>
              <option value="STANDARD">Facture Standard</option>
              <option value="PROFORMA">Devis / Proforma</option>
              <option value="CREDIT_NOTE">Avoir</option>
            </select>
          </>
        )}
        searchPlaceholder="Rechercher par N° FACT-2026-XXX, commande, client, matricule..."
        searchKeys={['invoiceNumber', 'orderReference', 'customerName', 'customerTaxId', 'customerCin', 'customerCity']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Facturation Légale & Avoirs — Royal"
        exportFileName="factures_royal"
        customFilters={[
          {
            key: 'status',
            label: 'État Facture',
            value: filterStatus,
            onChange: setFilterStatus,
            allLabel: 'Tous les états',
            options: [
              { value: 'PAID', label: 'Payée / Soldée' },
              { value: 'PARTIAL', label: 'Acompte Versé' },
              { value: 'UNPAID', label: 'En Attente' },
            ],
          },
        ]}
      />

      {/* Modale Facture Officielle Luxury */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          size="4xl"
          title={
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg text-neutral-900">
                    Facture Légale — {selectedInvoice.invoiceNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedInvoice.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  Émise le {new Date(selectedInvoice.createdAt).toLocaleDateString('fr-FR')} • Commande {selectedInvoice.orderReference}
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
                <span>Imprimer Facture Officielle</span>
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                {selectedInvoice.status !== 'PAID' && (
                  <>
                    <Button
                      variant="outline"
                      disabled={saving}
                      onClick={() => handleStatusUpdate(selectedInvoice, 'PARTIAL', false)}
                      className="text-xs px-3 py-2"
                    >
                      Acompte Versé
                    </Button>
                    <Button
                      variant="primary"
                      disabled={saving}
                      onClick={() => handleStatusUpdate(selectedInvoice, 'PAID', !selectedInvoice.stockApplied)}
                      className="text-xs px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
                    >
                      {saving ? 'Validation...' : 'Valider Paiement & Stock (-)'}
                    </Button>
                  </>
                )}
                <Button
                  variant="gold"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-xs px-4 py-2"
                >
                  Fermer
                </Button>
              </div>
            </div>
          }
        >
          <div className="p-6 pb-24 space-y-6 text-xs bg-white">
            <DocumentPrintHeader
              docCode="FAC"
              docTitle="FACTURE COMMERCIALE"
              reference={selectedInvoice.invoiceNumber}
              date={selectedInvoice.createdAt}
              status={selectedInvoice.status}
            />
            {/* En-tête légal émetteur vs destinataire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-neutral-200">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mb-1">
                  Émetteur (Société Venderesse)
                </span>
                <div className="text-sm font-black text-neutral-900 font-heading">
                  {sysDoc.generalSettings.companyName || sysDoc.identity.companyName}
                </div>
                <div className="text-neutral-600">{sysDoc.identity.address}</div>
                <div className="text-neutral-600">Tél : {sysDoc.identity.phone} • {sysDoc.identity.email}</div>
                <div className="font-mono text-neutral-700 mt-1">MF : {sysDoc.generalSettings.taxId}</div>
                <div className="font-mono text-neutral-500 text-[11px]">RC : {sysDoc.generalSettings.rcNumber}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                  Client Destinataire
                </span>
                <div className="text-sm font-bold text-neutral-900">
                  {selectedInvoice.customerName}
                </div>
                <div className="text-neutral-600">{selectedInvoice.customerAddress}</div>
                <div className="text-neutral-600">{selectedInvoice.customerCity}</div>
                {selectedInvoice.customerTaxId && (
                  <div className="font-mono text-neutral-700 mt-1">
                    MF Client : {selectedInvoice.customerTaxId}
                  </div>
                )}
                {selectedInvoice.customerCin && (
                  <div className="font-mono text-neutral-700 mt-1">
                    CIN : {selectedInvoice.customerCin}
                  </div>
                )}
              </div>
            </div>

            {/* Tableau des lignes */}
            <div>
              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase text-neutral-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Désignation</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">PU HT</th>
                      <th className="py-2.5 px-3 text-center">Qté</th>
                      <th className="py-2.5 px-3 text-center">TVA</th>
                      <th className="py-2.5 px-3 text-right">Total HT</th>
                      <th className="py-2.5 px-3 text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedInvoice.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">{l.name}</td>
                        <td className="py-2.5 px-3 font-mono text-neutral-500">{l.sku}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatTndCurrency(l.unitPriceHt)}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{l.quantity}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-neutral-500">{l.tvaRate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-700">{formatTndCurrency(l.totalHt)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">{formatTndCurrency(l.totalTtc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Récapitulatif Fiscal */}
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Total Brut HT :</span>
                  <span>{formatTndCurrency(selectedInvoice.totalHt)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Total TVA ({selectedInvoice.lines[0]?.tvaRate ?? sysDoc.defaultVatRate}%) :</span>
                  <span>{formatTndCurrency(selectedInvoice.totalTva)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Droit de Timbre Fiscal :</span>
                  <span>{formatTndCurrency(selectedInvoice.fiscalStampTnd)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-neutral-900 border-t border-neutral-300 pt-2">
                  <span>Net à Payer TTC :</span>
                  <span>{formatTndCurrency(selectedInvoice.totalTtc)}</span>
                </div>
              </div>
            </div>
            <DocumentPrintFooter docCode="FAC" reference={selectedInvoice.invoiceNumber} />
          </div>
        </Modal>
      )}

      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          size="3xl"
          title="Nouvelle Facture Officielle (TVA 19% + Timbre 1.000 DT)"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs px-4 py-2">
                Annuler
              </Button>
              <Button variant="gold" disabled={saving} onClick={handleCreateSubmit} className="text-xs px-5 py-2">
                {saving ? 'Émission...' : 'Émettre la Facture'}
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
                  <option value="">— Facture libre —</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.reference} — {o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : o.customerName || 'Client'} ({formatTndCurrency(Number(o.totalAmount || 0))})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Entrepôt Associé</label>
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
                <label className="block font-bold text-neutral-700 mb-1">Client / Société</label>
                <input
                  type="text"
                  required
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  placeholder="Nom complet ou Raison sociale"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Type Client</label>
                  <select
                    value={formCustomerType}
                    onChange={(e) => setFormCustomerType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                  >
                    <option value="INDIVIDUAL">Particulier (CIN)</option>
                    <option value="COMPANY">Société (MF)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    {formCustomerType === 'COMPANY' ? 'Matricule Fiscal' : 'N° CIN'}
                  </label>
                  <input
                    type="text"
                    value={formTaxOrCin}
                    onChange={(e) => setFormTaxOrCin(e.target.value)}
                    placeholder={formCustomerType === 'COMPANY' ? '1234567/A/M/000' : '08123456'}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800">Lignes de facturation (Prix unitaires TTC)</span>
                <button
                  type="button"
                  onClick={() => {
                    const first = catalogVariants[0];
                    if (!first) return;
                    setFormLines((prev) => [
                      ...prev,
                      { variantId: first.variantId, name: first.productName, sku: first.sku, quantity: 1, unitPriceTtc: first.priceTtc },
                    ]);
                  }}
                  className="text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  + Ajouter une ligne
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
                        prev.map((x, i) =>
                          i === idx ? { ...x, variantId: v.variantId, name: v.productName, sku: v.sku, unitPriceTtc: v.priceTtc } : x
                        )
                      );
                    }}
                    className="col-span-7 h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                  >
                    {catalogVariants.map((cv) => (
                      <option key={cv.variantId} value={cv.variantId}>
                        {cv.sku} — {cv.productName} ({formatTndCurrency(cv.priceTtc)})
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
                  <input
                    type="number"
                    step="0.001"
                    value={ln.unitPriceTtc}
                    onChange={(e) =>
                      setFormLines((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, unitPriceTtc: Number(e.target.value || 0) } : x))
                      )
                    }
                    className="col-span-2 h-10 px-2 rounded-xl border border-neutral-200 text-right font-mono"
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
      <DeleteConfirmModal
        isOpen={bulkDeleteInvoiceIds.length > 0}
        onClose={() => setBulkDeleteInvoiceIds([])}
        onConfirm={confirmBulkDeleteInvoices}
        isDeleting={saving}
        title="Supprimer les factures sélectionnées"
        description={`Confirmez-vous la suppression des ${bulkDeleteInvoiceIds.length} facture(s) sélectionnée(s) ?`}
      />
    </div>
  );
}
