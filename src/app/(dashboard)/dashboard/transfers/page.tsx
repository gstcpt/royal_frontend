'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  Printer,
  Eye,
  Warehouse,
  Truck,
  Package,
  ArrowRight,
  User,
  Calendar,
  Check,
  X,
  ExternalLink,
  Zap,
  ListChecks,
} from 'lucide-react';
import Link from 'next/link';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Select } from '@/components/ui/select';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';
import { useSystemDocumentConfig } from '@/hooks/useSystemDocumentConfig';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';

export interface TransferLine {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

export interface StockTransferMasterItem {
  id: string;
  reference: string; // ex: TRF-2026-0001
  requestRef?: string | null; // ex: DTR-2026-0001
  requestType?: string;
  acceptanceMode?: string | null;
  orderReference?: string | null;
  orderId?: string | null;
  showroomName?: string | null;
  sourceWarehouseName: string;
  targetWarehouseName: string;
  status: 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  carrierName: string;
  totalPieces: number;
  requestedBy: string;
  createdAt: string;
  completedAt?: string | null;
  items: TransferLine[];
}

export default function StockTransfersPage() {
  const sysDoc = useSystemDocumentConfig();
  const [transfers, setTransfers] = useState<StockTransferMasterItem[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [catalogVariants, setCatalogVariants] = useState<Array<{ id: string; sku: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransferMasterItem | null>(null);
  const [acceptTarget, setAcceptTarget] = useState<StockTransferMasterItem | null>(null);
  const [acceptMode, setAcceptMode] = useState<'IMMEDIATE' | 'STEP_BY_STEP'>('IMMEDIATE');
  const [selectedTransferIds, setSelectedTransferIds] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [fromWhId, setFromWhId] = useState('');
  const [toWhId, setToWhId] = useState('');
  const [transferVariantId, setTransferVariantId] = useState('');
  const [transferQty, setTransferQty] = useState(2);

  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [trfRes, whRes, rawProds] = await Promise.all([
        fetchApi('/transfers').catch(() => []),
        fetchApi('/warehouses').catch(() => []),
        fetchAllPaginated<any>('/products?status=ACTIVE', 200).then((r) => r.items).catch(() => []),
      ]);
      const whList = Array.isArray(whRes) ? whRes : whRes?.data || [];
      setWarehouses(whList);
      if (whList.length >= 2) {
        setFromWhId((prev) => prev || whList[0].id);
        setToWhId((prev) => prev || whList[1].id);
      }
      const variantMap = new Map<string, { id: string; sku: string; name: string }>();
      const variantsArr: Array<{ id: string; sku: string; name: string }> = [];
      for (const p of Array.isArray(rawProds) ? rawProds : []) {
        for (const v of p.variants || []) {
          const rec = { id: v.id, sku: v.sku || p.sku, name: p.name };
          variantMap.set(v.id, rec);
          variantsArr.push(rec);
        }
      }
      setCatalogVariants(variantsArr);
      if (variantsArr.length > 0) setTransferVariantId((prev) => prev || variantsArr[0].id);

      const rawTrf = Array.isArray(trfRes) ? trfRes : trfRes?.data || trfRes?.items || [];
      const mapped: StockTransferMasterItem[] = (Array.isArray(rawTrf) ? rawTrf : []).map((t: any) => {
        const items = (t.items || []).map((it: any) => {
          const matched = variantMap.get(it.variantId);
          return {
            id: it.id,
            name: matched?.name || `Variante ${it.variantId}`,
            sku: matched?.sku || it.variantId,
            quantity: Number(it.requestedQty || it.transferredQty || 1),
          };
        });
        return {
          id: t.id,
          reference: t.reference || 'TRF-2026-0001',
          requestRef: t.requestRef || null,
          requestType: t.requestType || 'INTERNAL',
          acceptanceMode: t.acceptanceMode || null,
          orderReference: t.order?.reference || null,
          orderId: t.order?.id || t.orderId || null,
          showroomName: t.showroom?.name || null,
          sourceWarehouseName: t.fromWarehouse?.name || 'Entrepôt Source',
          targetWarehouseName: t.toWarehouse?.name || 'Entrepôt Cible',
          status: t.status || 'PENDING',
          carrierName: t.showroom?.name ? `Réassort Showroom (${t.showroom.name})` : 'Flotte Interne Royal',
          totalPieces: items.reduce((s: number, it: any) => s + it.quantity, 0),
          requestedBy: t.requestedBy || 'Équipe Logistique',
          createdAt: t.createdAt || new Date().toISOString(),
          completedAt: t.completedAt || null,
          items,
        };
      });
      setTransfers(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWhId || !toWhId || fromWhId === toWhId || !transferVariantId) return;
    setSaving(true);
    try {
      await fetchApi('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          fromWarehouseId: fromWhId,
          toWarehouseId: toWhId,
          notes: 'Transfert créé depuis Dashboard Logistique',
          items: [{ variantId: transferVariantId, requestedQty: Number(transferQty || 1) }],
        }),
      });
      setIsCreateOpen(false);
      setFeedbackMessage('Ordre de transfert créé en base PostgreSQL.');
      await loadData();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de la création du transfert.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkTransferAction = async (
    action: 'approve' | 'dispatch' | 'receive' | 'cancel',
    label: string
  ) => {
    if (selectedTransferIds.length === 0) return;
    setSaving(true);
    try {
      const results = await Promise.allSettled(
        selectedTransferIds.map((id) => fetchApi(`/transfers/${id}/${action}`, { method: 'POST' }))
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      setFeedbackMessage(
        `${ok}/${selectedTransferIds.length} transfert(s) ${label}.`
      );
      setSelectedTransferIds([]);
      await loadData();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de l’action groupée.');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchTransfer = async (trf: StockTransferMasterItem) => {
    setSaving(true);
    try {
      await fetchApi(`/transfers/${trf.id}/dispatch`, { method: 'POST' });
      setFeedbackMessage(`Transfert ${trf.reference} expédié (stock source déduit).`);
      setSelectedTransfer(null);
      await loadData();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur expédition transfert.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReception = async (trf: StockTransferMasterItem) => {
    setSaving(true);
    try {
      await fetchApi(`/transfers/${trf.id}/receive`, { method: 'POST' });
      setFeedbackMessage(`Transfert ${trf.reference} réceptionné à destination. Stock réaligné en base.`);
      setSelectedTransfer(null);
      await loadData();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur réception transfert.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAcceptMode = async () => {
    if (!acceptTarget) return;
    setSaving(true);
    try {
      await fetchApi(`/transfers/${acceptTarget.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ mode: acceptMode }),
      });
      setFeedbackMessage(
        acceptMode === 'IMMEDIATE'
          ? `Transfert ${acceptTarget.reference} exécuté immédiatement (Sortie BS + Entrée BE).`
          : `Demande ${acceptTarget.requestRef || acceptTarget.reference} approuvée en mode Suivi par Étapes.`,
      );
      setAcceptTarget(null);
      setSelectedTransfer(null);
      await loadData();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de la validation.');
    } finally {
      setSaving(false);
    }
  };

  const filteredTransfers = useMemo(() => {
    if (statusFilter === 'ALL') return transfers;
    return transfers.filter((t) => t.status === statusFilter);
  }, [transfers, statusFilter]);

  // Stats KPIs
  const stats = useMemo(() => {
    const total = transfers.length;
    const inTransit = transfers.filter((t) => t.status === 'IN_TRANSIT').length;
    const completed = transfers.filter((t) => t.status === 'COMPLETED').length;
    const totalPieces = transfers.reduce((acc, t) => acc + t.totalPieces, 0);
    return { total, inTransit, completed, totalPieces };
  }, [transfers]);

  // Validation de réception (héritée supprimée — utiliser l'API backend POST /transfers/:id/receive ci-dessus)

  // Colonnes DataTable Master
  const columns: ColumnDef<StockTransferMasterItem>[] = [
    {
      key: 'reference',
      header: 'N° Bon de Transfert',
      sortable: true,
      sortValue: (row) => row.reference,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            TRF
          </div>
          <div>
            <span className="font-mono font-bold text-neutral-900 text-xs block">
              {row.requestRef || row.reference}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              {row.requestRef ? `${row.reference} ` : ''}
              {row.orderReference ? `• Cmd ${row.orderReference}` : '• Inter-Dépôts'}
            </span>
          </div>
        </div>
      ),
      printRender: (row) => row.reference,
    },
    {
      key: 'route',
      header: 'Acheminement (Départ ➔ Arrivée)',
      sortable: true,
      sortValue: (row) => `${row.sourceWarehouseName} -> ${row.targetWarehouseName}`,
      render: (row) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-neutral-900">{row.sourceWarehouseName}</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="font-semibold text-neutral-900">{row.targetWarehouseName}</span>
        </div>
      ),
      printRender: (row) => `${row.sourceWarehouseName} ➔ ${row.targetWarehouseName}`,
    },
    {
      key: 'status',
      header: 'Statut du Transfert',
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => {
        if (row.status === 'COMPLETED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Réceptionné Conforme
            </span>
          );
        }
        if (row.status === 'IN_TRANSIT') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              En Transit (BS)
            </span>
          );
        }
        if (row.status === 'APPROVED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
              <ListChecks className="w-3.5 h-3.5 text-sky-600" />
              Approuvé (Étapes)
            </span>
          );
        }
        if (row.status === 'CANCELLED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Annulé
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            En Attente Validation (DTR)
          </span>
        );
      },
      printRender: (row) => row.status,
    },
    {
      key: 'totalPieces',
      header: 'Volume Transféré',
      sortable: true,
      sortValue: (row) => row.totalPieces,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-neutral-900">
          {row.totalPieces} pièces
        </span>
      ),
      printRender: (row) => `${row.totalPieces} pièces`,
    },
    {
      key: 'carrierName',
      header: 'Transporteur / Chauffeur',
      sortable: true,
      sortValue: (row) => row.carrierName,
      render: (row) => (
        <span className="text-xs text-neutral-700 truncate max-w-[200px] block">
          {row.carrierName}
        </span>
      ),
      printRender: (row) => row.carrierName,
    },
    {
      key: 'createdAt',
      header: 'Date d’Ordre',
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
          {row.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => {
                setAcceptMode('IMMEDIATE');
                setAcceptTarget(row);
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] hover:bg-[#C59B27] hover:text-white transition cursor-pointer"
              title="Accepter la demande (Immédiat ou par Étapes)"
            >
              Accepter
            </button>
          )}
          <Link
            href={`/dashboard/transfers/${row.id}`}
            className="p-1.5 rounded-lg text-[#9A7414] bg-[#FBF6E8] hover:bg-[#F3E7C4] border border-[#E6D6A6] transition shadow-2xs"
            title="Ouvrir la fiche complète et workflow"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setSelectedTransfer(row)}
            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs cursor-pointer"
            title="Aperçu rapide & impression bon"
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
        message={feedbackMessage || ''}
        type="success"
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Header Card with Breadcrumbs */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
              <ArrowLeftRight className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
                Transferts Inter-Dépôts & Réapprovisionnement
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Orchestrez les transferts de marchandise entre le hub central et les showrooms de vente avec double validation au départ et à l'arrivée.
              </p>
            </div>
          </div>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Gestion des Stocks', href: '/dashboard/section/stock' },
              { label: 'Transferts Inter-Dépôts' },
            ]}
          />
        </div>
        <Button
          variant="gold"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs px-4 py-2.5 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Transfert (TRF)</span>
        </Button>
      </div>

      {/* 2. 4 KPIs Master Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Ordres de Transfert</span>
            <ArrowLeftRight className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">Flux logistiques internes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>En Cours d'Acheminement</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.inTransit}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Marchandise en camion</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Réceptionnés & Clôturés</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {stats.completed}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Entrés au showroom cible</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Total Pièces Déplacées</span>
            <Package className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.totalPieces} pcs
          </div>
          <div className="text-[11px] text-neutral-500">Volume consolidé</div>
        </div>
      </div>

      {/* 3. DataTable Master */}
      <DataTable
        data={filteredTransfers}
        isLoading={loading}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedTransferIds}
        onSelectionChange={setSelectedTransferIds}
        renderBulkActions={() => (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleBulkTransferAction('approve', 'approuvé(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Approuver
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleBulkTransferAction('dispatch', 'expédié(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Expédier
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleBulkTransferAction('receive', 'réceptionné(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Réceptionner
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleBulkTransferAction('cancel', 'annulé(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
          </>
        )}
        searchPlaceholder="Rechercher par N° DTR/TRF, commande, entrepôt source, cible, transporteur..."
        searchKeys={['requestRef', 'reference', 'orderReference', 'sourceWarehouseName', 'targetWarehouseName', 'carrierName', 'requestedBy']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Transferts Inter-Dépôts — Royal"
        exportFileName="transferts_royal"
        customFilters={[
          {
            key: 'status',
            label: 'Statut',
            value: statusFilter,
            onChange: setStatusFilter,
            allLabel: 'Tous les statuts',
            options: [
              { value: 'PENDING', label: 'PENDING (En attente DTR)' },
              { value: 'APPROVED', label: 'APPROVED (Approuvé par étapes)' },
              { value: 'IN_TRANSIT', label: 'IN_TRANSIT (En transit BS)' },
              { value: 'COMPLETED', label: 'COMPLETED (Réceptionné BE)' },
              { value: 'CANCELLED', label: 'CANCELLED (Annulé)' },
            ],
          },
        ]}
      />

      {/* Modale Bon de Transfert */}
      {selectedTransfer && (
        <Modal
          isOpen={!!selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
          size="4xl"
          title={
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg text-neutral-900">
                    Bon de Transfert — {selectedTransfer.reference}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 border">
                    {selectedTransfer.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  Demandeur : {selectedTransfer.requestedBy}
                </div>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer Bon de Transfert</span>
              </Button>
              <div className="flex items-center gap-2">
                {selectedTransfer.status === 'PENDING' && (
                  <Button
                    variant="gold"
                    disabled={saving}
                    onClick={() => {
                      setAcceptMode('IMMEDIATE');
                      setAcceptTarget(selectedTransfer);
                    }}
                    className="text-xs px-4 py-2"
                  >
                    Accepter &amp; Choisir Mode
                  </Button>
                )}
                {(selectedTransfer.status === 'PENDING' || selectedTransfer.status === 'APPROVED') && (
                  <Button
                    variant="primary"
                    disabled={saving}
                    onClick={() => handleDispatchTransfer(selectedTransfer)}
                    className="text-xs px-4 py-2 bg-amber-600 text-white hover:bg-amber-700"
                  >
                    Expédier Transfert
                  </Button>
                )}
                {selectedTransfer.status === 'IN_TRANSIT' && (
                  <Button
                    variant="primary"
                    disabled={saving}
                    onClick={() => handleConfirmReception(selectedTransfer)}
                    className="text-xs px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    Valider Réception au Quai
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedTransfer(null)}
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
              docCode="TRF"
              docTitle="Bordereau de Transfert"
              reference={selectedTransfer.reference}
              date={selectedTransfer.createdAt}
              status={selectedTransfer.status}
            />
            {/* Trajet */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                  Départ (Source)
                </span>
                <div className="font-bold text-neutral-900">{selectedTransfer.sourceWarehouseName}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400" />
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                  Arrivée (Cible)
                </span>
                <div className="font-bold text-neutral-900">{selectedTransfer.targetWarehouseName}</div>
              </div>
            </div>

            {/* Articles */}
            <div>
              <h4 className="font-bold text-neutral-900 mb-2">Marchandise Transférée</h4>
              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase text-neutral-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Quantité Transférée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedTransfer.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">{it.name}</td>
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
            <DocumentPrintFooter docCode="TRF" reference={selectedTransfer.reference} />
          </div>
        </Modal>
      )}

      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          size="2xl"
          title="Nouveau Transfert Inter-Dépôts"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs px-4 py-2">
                Annuler
              </Button>
              <Button variant="gold" disabled={saving} onClick={handleCreateTransfer} className="text-xs px-5 py-2">
                {saving ? 'Création...' : 'Créer le Transfert'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateTransfer} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Dépôt Source</label>
                <select
                  value={fromWhId}
                  onChange={(e) => setFromWhId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Dépôt Destination</label>
                <select
                  value={toWhId}
                  onChange={(e) => setToWhId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block font-bold text-neutral-700 mb-1">Article Catalogue</label>
                  <select
                    value={transferVariantId}
                    onChange={(e) => setTransferVariantId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                  >
                    {catalogVariants.map((cv) => (
                      <option key={cv.id} value={cv.id}>{cv.sku} — {cv.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    value={transferQty}
                    onChange={(e) => setTransferQty(Number(e.target.value || 1))}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {acceptTarget && (
        <Modal
          isOpen={!!acceptTarget}
          onClose={() => setAcceptTarget(null)}
          size="2xl"
          title={`Accepter Demande — ${acceptTarget.requestRef || acceptTarget.reference}`}
          subtitle="Exécuter immédiatement le transfert (BS + BE) ou suivre les étapes manuelles."
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setAcceptTarget(null)} className="text-xs px-4 py-2">
                Annuler
              </Button>
              <Button variant="gold" disabled={saving} onClick={handleConfirmAcceptMode} className="text-xs px-5 py-2">
                {saving ? 'Validation...' : 'Confirmer Validation'}
              </Button>
            </div>
          }
        >
          <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setAcceptMode('IMMEDIATE')}
              className={cn(
                'p-4 rounded-2xl border text-left space-y-1.5 transition cursor-pointer',
                acceptMode === 'IMMEDIATE'
                  ? 'bg-[#FBF9F4] border-[#C59B27] ring-2 ring-[#C59B27]/20'
                  : 'bg-white border-neutral-200 hover:border-neutral-300',
              )}
            >
              <div className="flex items-center gap-2 font-heading font-bold text-sm text-[#1D232E]">
                <Zap className="w-4 h-4 text-[#C59B27]" />
                <span>Exécution Immédiate</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                Sortie BS ({acceptTarget.sourceWarehouseName}) + Entrée BE ({acceptTarget.targetWarehouseName}) immédiate (`COMPLETED`).
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAcceptMode('STEP_BY_STEP')}
              className={cn(
                'p-4 rounded-2xl border text-left space-y-1.5 transition cursor-pointer',
                acceptMode === 'STEP_BY_STEP'
                  ? 'bg-[#FBF9F4] border-[#C59B27] ring-2 ring-[#C59B27]/20'
                  : 'bg-white border-neutral-200 hover:border-neutral-300',
              )}
            >
              <div className="flex items-center gap-2 font-heading font-bold text-sm text-[#1D232E]">
                <ListChecks className="w-4 h-4 text-sky-600" />
                <span>Suivi par Étapes</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                Approuve la demande (`APPROVED`), puis permet Expédier (`IN_TRANSIT`) et Réceptionner (`COMPLETED`).
              </p>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
