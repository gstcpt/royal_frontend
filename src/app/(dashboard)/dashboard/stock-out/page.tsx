'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileOutput,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  Warehouse,
  Package,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal, DeleteConfirmModal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { useSystemDocumentConfig } from '@/hooks/useSystemDocumentConfig';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';

export interface StockOutItem {
  id: string;
  reference: string;
  warehouseId?: string;
  warehouseName: string;
  destinationType: 'CUSTOMER_DELIVERY' | 'INTER_WAREHOUSE_TRANSFER' | 'DAMAGED_SCRAP';
  destinationReference: string;
  destinationRecipient: string;
  status: 'PICKING' | 'PACKED' | 'DISPATCHED' | 'CANCELLED';
  operatorName: string;
  totalPieces: number;
  packageCount: number;
  stockApplied?: boolean;
  createdAt: string;
  dispatchedAt?: string | null;
  items: Array<{
    variantId?: string;
    name: string;
    sku: string;
    locationCode: string;
    quantity: number;
  }>;
}

export default function StockOutPage() {
  const sysDoc = useSystemDocumentConfig();
  const [stockOuts, setStockOuts] = useState<StockOutItem[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [catalogVariants, setCatalogVariants] = useState<
    Array<{ variantId: string; productName: string; sku: string; totalQty: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedStockOut, setSelectedStockOut] = useState<StockOutItem | null>(null);
  const [selectedStockOutIds, setSelectedStockOutIds] = useState<string[]>([]);
  const [bulkDeleteStockOutIds, setBulkDeleteStockOutIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formDestType, setFormDestType] = useState<StockOutItem['destinationType']>('CUSTOMER_DELIVERY');
  const [formDestRef, setFormDestRef] = useState('');
  const [formRecipient, setFormRecipient] = useState('');
  const [formOperator, setFormOperator] = useState('Tarek Cherif (Magasinier)');
  const [formLines, setFormLines] = useState<Array<{ variantId: string; quantity: number; locationCode: string }>>([
    { variantId: '', quantity: 1, locationCode: 'ZONE-A/R1' },
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, whRes, rawProds] = await Promise.all([
        fetchApi('/storefront-cms/sys-config/stockOuts').catch(() => null),
        fetchApi('/warehouses').catch(() => []),
        fetchAllPaginated<any>('/products?status=ACTIVE', 200).then((r) => r.items).catch(() => []),
      ]);

      const cfgList = cfgRes?.value || cfgRes?.data?.value || [];
      setStockOuts(Array.isArray(cfgList) ? cfgList : []);

      const whList = Array.isArray(whRes) ? whRes : whRes?.data || [];
      setWarehouses(whList);
      if (whList.length > 0) {
        setFormWarehouseId((prev) => prev || whList[0].id);
      }

      const flat: Array<{ variantId: string; productName: string; sku: string; totalQty: number }> = [];
      for (const p of Array.isArray(rawProds) ? rawProds : []) {
        for (const v of p.variants || []) {
          const qty = (v.stock || v.stocks || []).reduce(
            (s: number, st: any) => s + Math.max(0, (st.physicalQty || 0) - (st.reservedQty || 0)),
            0
          );
          flat.push({
            variantId: v.id,
            productName: `${p.name}${v.name && v.name !== 'Standard' ? ` (${v.name})` : ''}`,
            sku: v.sku || p.sku,
            totalQty: qty,
          });
        }
      }
      setCatalogVariants(flat);
      if (flat.length > 0) {
        setFormLines((prev) =>
          prev.map((l, i) => (i === 0 && !l.variantId ? { ...l, variantId: flat[0].variantId } : l))
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistStockOuts = async (nextList: StockOutItem[]) => {
    await fetchApi('/storefront-cms/sys-config/stockOuts', {
      method: 'PUT',
      body: JSON.stringify({ value: nextList }),
    });
    setStockOuts(nextList);
  };

  const handleBulkStockOutPatch = async (patch: Partial<StockOutItem>, label: string) => {
    if (selectedStockOutIds.length === 0) return;
    setSaving(true);
    try {
      const idSet = new Set(selectedStockOutIds);
      const nextList = stockOuts.map((s) =>
        idSet.has(s.id)
          ? {
              ...s,
              ...patch,
              dispatchedAt: patch.status === 'DISPATCHED' ? s.dispatchedAt || new Date().toISOString() : s.dispatchedAt,
            }
          : s
      );
      await persistStockOuts(nextList);
      setFeedbackMessage({ text: `${selectedStockOutIds.length} bon(s) de sortie ${label}.`, type: 'success' });
      setSelectedStockOutIds([]);
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur mise à jour groupée.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmBulkDeleteStockOuts = async () => {
    if (bulkDeleteStockOutIds.length === 0) return;
    setSaving(true);
    try {
      const idSet = new Set(bulkDeleteStockOutIds);
      await persistStockOuts(stockOuts.filter((s) => !idSet.has(s.id)));
      setFeedbackMessage({ text: `${bulkDeleteStockOutIds.length} bon(s) de sortie supprimé(s).`, type: 'success' });
      setBulkDeleteStockOutIds([]);
      setSelectedStockOutIds([]);
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur suppression bons de sortie.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filteredStockOuts = useMemo(() => {
    if (statusFilter === 'ALL') return stockOuts;
    return stockOuts.filter((s) => s.status === statusFilter);
  }, [stockOuts, statusFilter]);

  const stats = useMemo(() => {
    const total = stockOuts.length;
    const inPicking = stockOuts.filter((s) => s.status === 'PICKING' || s.status === 'PACKED').length;
    const dispatched = stockOuts.filter((s) => s.status === 'DISPATCHED').length;
    const totalPieces = stockOuts
      .filter((s) => s.status === 'DISPATCHED')
      .reduce((acc, s) => acc + (s.totalPieces || 0), 0);
    return { total, inPicking, dispatched, totalPieces };
  }, [stockOuts]);

  const handleConfirmDispatch = async (so: StockOutItem) => {
    setSaving(true);
    try {
      if (!so.stockApplied) {
        await fetchApi('/storefront-cms/stock-lifecycle/apply', {
          method: 'POST',
          body: JSON.stringify({
            docType: 'BS',
            docReference: so.reference,
            warehouseId: so.warehouseId || warehouses[0]?.id,
            restore: false,
            items: so.items.map((it) => ({
              variantId: it.variantId,
              sku: it.sku,
              quantity: it.quantity,
            })),
          }),
        });
      }

      const updated: StockOutItem = {
        ...so,
        status: 'DISPATCHED',
        stockApplied: true,
        dispatchedAt: new Date().toISOString(),
      };
      const nextList = stockOuts.map((s) => (s.id === updated.id ? updated : s));
      await persistStockOuts(nextList);
      setSelectedStockOut(updated);
      setFeedbackMessage({
        text: `Bon de Sortie ${so.reference} expédié : stock physique décrémenté dans PostgreSQL.`,
        type: 'success',
      });
      loadData();
    } catch (err: any) {
      setFeedbackMessage({
        text: err?.message || 'Erreur lors de la décrémentation du stock.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAndRestore = async (so: StockOutItem) => {
    setSaving(true);
    try {
      if (so.stockApplied) {
        await fetchApi('/storefront-cms/stock-lifecycle/apply', {
          method: 'POST',
          body: JSON.stringify({
            docType: 'BS',
            docReference: so.reference,
            warehouseId: so.warehouseId || warehouses[0]?.id,
            restore: true,
            items: so.items.map((it) => ({
              variantId: it.variantId,
              sku: it.sku,
              quantity: it.quantity,
            })),
          }),
        });
      }

      const updated: StockOutItem = {
        ...so,
        status: 'CANCELLED',
        stockApplied: false,
      };
      const nextList = stockOuts.map((s) => (s.id === updated.id ? updated : s));
      await persistStockOuts(nextList);
      setSelectedStockOut(updated);
      setFeedbackMessage({
        text: `Bon de Sortie ${so.reference} annulé : quantités réintégrées en stock.`,
        type: 'success',
      });
      loadData();
    } catch (err: any) {
      setFeedbackMessage({
        text: err?.message || 'Erreur lors de l’annulation.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = formLines.filter((l) => l.variantId && l.quantity > 0);
    if (validLines.length === 0) return;

    setSaving(true);
    try {
      const wh = warehouses.find((w) => w.id === formWarehouseId) || warehouses[0];
      const items = validLines.map((l) => {
        const v = catalogVariants.find((cv) => cv.variantId === l.variantId);
        return {
          variantId: l.variantId,
          name: v?.productName || 'Article Royal',
          sku: v?.sku || 'SKU',
          locationCode: l.locationCode || 'ZONE-A',
          quantity: Number(l.quantity),
        };
      });
      const totalPieces = items.reduce((s, it) => s + it.quantity, 0);
      const nextRef = sysDoc.generateNextRef('BS', stockOuts.length + 1);
      const newDoc: StockOutItem = {
        id: `so-${Date.now()}`,
        reference: nextRef,
        warehouseId: wh?.id,
        warehouseName: wh?.name || 'Dépôt Central Royal',
        destinationType: formDestType,
        destinationReference: formDestRef.trim() || `#CMD-${Date.now().toString().slice(-4)}`,
        destinationRecipient: formRecipient.trim() || 'Client / Destination Showroom',
        status: 'PICKING',
        operatorName: formOperator.trim() || 'Magasinier Royal',
        totalPieces,
        packageCount: Math.max(1, Math.ceil(totalPieces / 2)),
        stockApplied: false,
        createdAt: new Date().toISOString(),
        items,
      };
      await persistStockOuts([newDoc, ...stockOuts]);
      setIsCreateOpen(false);
      setFormDestRef('');
      setFormRecipient('');
      setFeedbackMessage({ text: `Bon de Sortie ${nextRef} créé (prêt pour picking et validation).`, type: 'success' });
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Erreur de création du bon de sortie.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<StockOutItem>[] = [
    {
      key: 'reference',
      header: 'N° Bon de Sortie',
      sortable: true,
      sortValue: (row) => row.reference,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            BS
          </div>
          <div>
            <span className="font-mono font-bold text-neutral-900 text-xs block">
              {row.reference}
            </span>
            <span className="text-[10px] text-neutral-500">
              {row.destinationType === 'CUSTOMER_DELIVERY' && 'Livraison Client'}
              {row.destinationType === 'INTER_WAREHOUSE_TRANSFER' && 'Transfert Inter-Dépôts'}
              {row.destinationType === 'DAMAGED_SCRAP' && 'Mise au Rebut'}
            </span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.reference} (${row.destinationType})`,
    },
    {
      key: 'destination',
      header: 'Destination & Commande',
      sortable: true,
      sortValue: (row) => row.destinationRecipient,
      render: (row) => (
        <div>
          <div className="font-semibold text-neutral-900 text-xs">
            {row.destinationRecipient}
          </div>
          <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
            Réf : {row.destinationReference}
          </div>
        </div>
      ),
      printRender: (row) => `${row.destinationRecipient} (Réf : ${row.destinationReference})`,
    },
    {
      key: 'warehouseName',
      header: 'Entrepôt Expéditeur',
      sortable: true,
      sortValue: (row) => row.warehouseName,
      render: (row) => (
        <div className="text-xs text-neutral-800 flex items-center gap-1.5">
          <Warehouse className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>{row.warehouseName}</span>
        </div>
      ),
      printRender: (row) => row.warehouseName,
    },
    {
      key: 'status',
      header: 'Statut Colisage',
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => {
        if (row.status === 'DISPATCHED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Expédié ({row.stockApplied ? 'Stock Déduit' : 'Validé'})
            </span>
          );
        }
        if (row.status === 'CANCELLED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Annulé / Rétabli
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {row.status === 'PACKED' ? 'Colisé Quai' : 'En Picking'}
          </span>
        );
      },
      printRender: (row) => row.status,
    },
    {
      key: 'totalPieces',
      header: 'Pièces',
      sortable: true,
      sortValue: (row) => row.totalPieces,
      render: (row) => (
        <span className="font-mono font-bold text-xs text-neutral-900">
          {row.totalPieces} pcs
        </span>
      ),
      printRender: (row) => `${row.totalPieces} pcs`,
    },
    {
      key: 'createdAt',
      header: 'Date & Heure',
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
            onClick={() => setSelectedStockOut(row)}
            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs cursor-pointer"
            title="Consulter le bon de sortie et liste de picking"
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

      {/* 1. Header Card with Breadcrumbs + Create BS CTA */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
              <FileOutput className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
                Bons de Sortie d’Entrepôt &amp; Colisage
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Générez les listes de prélèvement (picking) et déclenchez la décrémentation réelle du stock PostgreSQL.
              </p>
            </div>
          </div>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Gestion des Stocks', href: '/dashboard/section/stock' },
              { label: 'Bons de Sortie' },
            ]}
          />
        </div>

        <Button
          variant="gold"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs px-4 py-2.5 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Bon de Sortie (BS)</span>
        </Button>
      </div>

      {/* 2. 4 KPIs Master Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Bons de Sortie</span>
            <FileOutput className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">Total préparés</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>En Cours de Picking</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.inPicking}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">En attente validation quai</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Expédiés au Quai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {stats.dispatched}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Sorties validées en stock</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Pièces Décrémentées</span>
            <Package className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.totalPieces} pcs
          </div>
          <div className="text-[11px] text-neutral-500">Mouvements SALE_OUT validés</div>
        </div>
      </div>

      {/* 3. Main DataTable */}
      <DataTable
        data={filteredStockOuts}
        isLoading={loading}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedStockOutIds}
        onSelectionChange={setSelectedStockOutIds}
        onBulkDelete={(keys) => setBulkDeleteStockOutIds(keys)}
        renderBulkActions={() => (
          <>
            <select
              value=""
              disabled={saving}
              onChange={(e) => {
                const st = e.target.value as StockOutItem['status'];
                if (st) handleBulkStockOutPatch({ status: st }, `passé(s) en ${st}`);
              }}
              aria-label="Changer statut bon de sortie"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Statut sortie...</option>
              <option value="PICKING">PICKING (En picking)</option>
              <option value="PACKED">PACKED (Colisé quai)</option>
              <option value="DISPATCHED">DISPATCHED (Expédié)</option>
              <option value="CANCELLED">CANCELLED (Annulé)</option>
            </select>
            <select
              value=""
              disabled={saving}
              onChange={(e) => {
                const dt = e.target.value as StockOutItem['destinationType'];
                if (dt) handleBulkStockOutPatch({ destinationType: dt }, `classé(s) (${dt})`);
              }}
              aria-label="Changer type destination"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Type destination...</option>
              <option value="CUSTOMER_DELIVERY">Livraison Client</option>
              <option value="INTER_WAREHOUSE_TRANSFER">Transfert Inter-Dépôt</option>
              <option value="DAMAGED_SCRAP">Rebut / Avarie</option>
            </select>
          </>
        )}
        searchPlaceholder="Rechercher par référence BS, commande, destinataire, entrepôt..."
        searchKeys={['reference', 'destinationRecipient', 'destinationReference', 'warehouseName', 'operatorName']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Bons de Sortie d’Entrepôt & Colisage — Royal"
        exportFileName="bons_sortie_royal"
        customFilters={[
          {
            key: 'status',
            label: 'Statut',
            value: statusFilter,
            onChange: setStatusFilter,
            allLabel: 'Tous les statuts',
            options: [
              { value: 'PICKING', label: 'PICKING (En picking)' },
              { value: 'PACKED', label: 'PACKED (Colisé quai)' },
              { value: 'DISPATCHED', label: 'DISPATCHED (Expédié)' },
              { value: 'CANCELLED', label: 'CANCELLED (Annulé)' },
            ],
          },
        ]}
      />

      {/* Inspect & Confirm Stock Deduction Modal */}
      {selectedStockOut && (
        <Modal
          isOpen={!!selectedStockOut}
          onClose={() => setSelectedStockOut(null)}
          size="4xl"
          title={
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                <FileOutput className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg text-neutral-900">
                    Bon de Sortie — {selectedStockOut.reference}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 border">
                    {selectedStockOut.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  {selectedStockOut.warehouseName} ➔ {selectedStockOut.destinationRecipient}
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
                <span>Imprimer Bon de Prélèvement</span>
              </Button>
              <div className="flex items-center gap-2">
                {selectedStockOut.status !== 'DISPATCHED' && selectedStockOut.status !== 'CANCELLED' && (
                  <Button
                    variant="primary"
                    disabled={saving}
                    onClick={() => handleConfirmDispatch(selectedStockOut)}
                    className="text-xs px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    {saving ? 'Décrémentation...' : 'Confirmer Sortie Physique (Stock -)'}
                  </Button>
                )}
                {selectedStockOut.status === 'DISPATCHED' && (
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => handleCancelAndRestore(selectedStockOut)}
                    className="text-xs px-3.5 py-2 flex items-center gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Annuler &amp; Rétablir Stock (+)</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedStockOut(null)}
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
              docCode="BS"
              docTitle="BON DE SORTIE D'ENTREPÔT"
              reference={selectedStockOut.reference}
              date={selectedStockOut.createdAt}
              status={selectedStockOut.status}
            />
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                  Destination
                </span>
                <div className="font-bold text-neutral-900">{selectedStockOut.destinationRecipient}</div>
                <div className="text-neutral-500">Réf : {selectedStockOut.destinationReference}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                  Magasinier Référent
                </span>
                <div className="font-bold text-neutral-900">{selectedStockOut.operatorName}</div>
                <div className="text-neutral-500">
                  Colisage : {selectedStockOut.packageCount} cartons • Stock DB :{' '}
                  {selectedStockOut.stockApplied ? 'Décrémenté' : 'En attente'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-neutral-900 mb-2">Instructions de Prélèvement (Picking)</h4>
              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase text-neutral-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Emplacement</th>
                      <th className="py-2.5 px-3 text-right">Quantité à Sortir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedStockOut.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-neutral-900">{it.name}</td>
                        <td className="py-2.5 px-3 font-mono text-neutral-500">{it.sku}</td>
                        <td className="py-2.5 px-3 font-mono text-amber-700 font-bold">
                          {it.locationCode}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-neutral-900">
                          {it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <DocumentPrintFooter docCode="BS" reference={selectedStockOut.reference} showTaxNotice={false} />
          </div>
        </Modal>
      )}

      {/* Create Stock Out Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          size="3xl"
          title="Nouveau Bon de Sortie (BS)"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs px-4 py-2">
                Annuler
              </Button>
              <Button
                variant="gold"
                disabled={saving}
                onClick={handleCreateSubmit}
                className="text-xs px-5 py-2"
              >
                {saving ? 'Enregistrement...' : 'Créer le Bon de Sortie'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Entrepôt Expéditeur</label>
                <select
                  value={formWarehouseId}
                  onChange={(e) => setFormWarehouseId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Type de Sortie</label>
                <select
                  value={formDestType}
                  onChange={(e) => setFormDestType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                >
                  <option value="CUSTOMER_DELIVERY">Livraison Client (Commande)</option>
                  <option value="INTER_WAREHOUSE_TRANSFER">Transfert Showroom / Inter-Dépôt</option>
                  <option value="DAMAGED_SCRAP">Mise au Rebut / Casse</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Référence Associée (#CMD / TRF)</label>
                <input
                  type="text"
                  value={formDestRef}
                  onChange={(e) => setFormDestRef(e.target.value)}
                  placeholder="Ex: #CMD-2026-410"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Destinataire / Client / Showroom</label>
                <input
                  type="text"
                  required
                  value={formRecipient}
                  onChange={(e) => setFormRecipient(e.target.value)}
                  placeholder="Ex: Showroom La Marsa / Client"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800">Articles à prélever (Stock en base)</span>
                <button
                  type="button"
                  onClick={() =>
                    setFormLines((prev) => [
                      ...prev,
                      { variantId: catalogVariants[0]?.variantId || '', quantity: 1, locationCode: 'ZONE-A' },
                    ])
                  }
                  className="text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  + Ajouter une ligne
                </button>
              </div>
              {formLines.map((ln, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={ln.variantId}
                    onChange={(e) =>
                      setFormLines((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, variantId: e.target.value } : x))
                      )
                    }
                    className="col-span-7 h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                  >
                    {catalogVariants.map((cv) => (
                      <option key={cv.variantId} value={cv.variantId}>
                        {cv.sku} — {cv.productName} ({cv.totalQty} disp.)
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
                    type="text"
                    value={ln.locationCode}
                    onChange={(e) =>
                      setFormLines((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, locationCode: e.target.value } : x))
                      )
                    }
                    placeholder="Allée"
                    className="col-span-2 h-10 px-2 rounded-xl border border-neutral-200 font-mono"
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
        isOpen={bulkDeleteStockOutIds.length > 0}
        onClose={() => setBulkDeleteStockOutIds([])}
        onConfirm={confirmBulkDeleteStockOuts}
        isDeleting={saving}
        title="Supprimer les bons de sortie sélectionnés"
        description={`Confirmez-vous la suppression des ${bulkDeleteStockOutIds.length} bon(s) de sortie sélectionné(s) ?`}
      />
    </div>
  );
}
