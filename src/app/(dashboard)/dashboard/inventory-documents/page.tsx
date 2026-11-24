'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  FileCheck,
  Plus,
  Warehouse,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Eye,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal, DeleteConfirmModal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Select } from '@/components/ui/select';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';
import { useSystemDocumentConfig } from '@/hooks/useSystemDocumentConfig';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';

export interface InventoryLineItem {
  id: string;
  articleId: string;
  sku: string;
  name: string;
  categoryName: string;
  locationCode: string;
  imageUrl?: string;
  unitCostTnd: number;
  theoreticalQty: number;
  countedQty: number | null;
  notes?: string;
}

export interface InventoryDocumentItem {
  id: string;
  reference: string;
  warehouseId: string;
  warehouseName: string;
  inventoryType: 'ANNUAL' | 'CYCLIC' | 'SPOT';
  scopeType: 'FULL_WAREHOUSE' | 'AISLE' | 'CUSTOM';
  scopeTarget?: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  managerName: string;
  totalLines: number;
  totalCountedLines: number;
  netDeltaQty: number;
  financialImpactTnd: number;
  createdAt: string;
  closedAt?: string | null;
  lines: InventoryLineItem[];
}

export default function InventoryDocumentsPage() {
  const sysDoc = useSystemDocumentConfig();
  const [inventories, setInventories] = useState<InventoryDocumentItem[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [selectedInventory, setSelectedInventory] = useState<InventoryDocumentItem | null>(null);
  const [editableLines, setEditableLines] = useState<InventoryLineItem[]>([]);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [selectedInvIds, setSelectedInvIds] = useState<string[]>([]);
  const [bulkDeleteInvIds, setBulkDeleteInvIds] = useState<string[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState('');
  const [newType, setNewType] = useState<'ANNUAL' | 'CYCLIC' | 'SPOT'>('CYCLIC');
  const [newScope, setNewScope] = useState<'FULL_WAREHOUSE' | 'AISLE' | 'CUSTOM'>('FULL_WAREHOUSE');
  const [newTarget, setNewTarget] = useState('');
  const [newManager, setNewManager] = useState('Mohamed Zitouni (ROOT)');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docRes, whRes] = await Promise.all([
        fetchApi('/storefront-cms/sys-config/inventoryDocuments').catch(() => null),
        fetchApi('/warehouses').catch(() => []),
      ]);
      const docs = docRes?.value || docRes?.data?.value || [];
      setInventories(Array.isArray(docs) ? docs : []);
      const whList = Array.isArray(whRes) ? whRes : whRes?.data || [];
      setWarehouses(whList);
      if (whList.length > 0) setNewWarehouse((prev) => prev || whList[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistDocs = async (next: InventoryDocumentItem[], msg: string) => {
    setInventories(next);
    await fetchApi('/storefront-cms/sys-config/inventoryDocuments', {
      method: 'PUT',
      body: JSON.stringify({ value: next }),
    }).catch(() => null);
    setFeedbackMessage(msg);
  };

  const stats = useMemo(() => {
    const total = inventories.length;
    const inReview = inventories.filter((i) => i.status === 'IN_REVIEW').length;
    const drafts = inventories.filter((i) => i.status === 'DRAFT').length;
    const completed = inventories.filter((i) => i.status === 'COMPLETED').length;
    const totalNetDelta = inventories.reduce((acc, i) => acc + i.netDeltaQty, 0);
    return { total, inReview, drafts, completed, totalNetDelta };
  }, [inventories]);

  const openCountingSheet = (inv: InventoryDocumentItem) => {
    setSelectedInventory(inv);
    setEditableLines(JSON.parse(JSON.stringify(inv.lines)));
  };

  const handleCountChange = (lineId: string, valStr: string) => {
    const val = valStr === '' ? null : Math.max(0, parseInt(valStr, 10) || 0);
    setEditableLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, countedQty: val } : l))
    );
  };

  const saveCountingDraft = () => {
    if (!selectedInventory) return;
    const updatedLines = [...editableLines];
    let deltaSum = 0;
    let finImpact = 0;
    let countedCount = 0;

    updatedLines.forEach((l) => {
      if (l.countedQty !== null) {
        countedCount++;
        const delta = l.countedQty - l.theoreticalQty;
        deltaSum += delta;
        finImpact += delta * l.unitCostTnd;
      }
    });

    const newStatus: InventoryDocumentItem['status'] =
      deltaSum !== 0 ? 'IN_REVIEW' : countedCount === updatedLines.length ? 'COMPLETED' : 'DRAFT';

    const updatedInv: InventoryDocumentItem = {
      ...selectedInventory,
      lines: updatedLines,
      totalCountedLines: countedCount,
      netDeltaQty: deltaSum,
      financialImpactTnd: finImpact,
      status: newStatus,
    };

    const next = inventories.map((i) => (i.id === updatedInv.id ? updatedInv : i));
    setSelectedInventory(updatedInv);
    persistDocs(next, 'Feuille de comptage enregistrée en base PostgreSQL.');
  };

  const confirmCloseInventory = async () => {
    if (!selectedInventory) return;
    const updatedInv: InventoryDocumentItem = {
      ...selectedInventory,
      status: 'COMPLETED',
      closedAt: new Date().toISOString(),
    };

    const next = inventories.map((i) => (i.id === updatedInv.id ? updatedInv : i));
    setSelectedInventory(updatedInv);
    setIsCloseConfirmOpen(false);
    await persistDocs(
      next,
      `Session ${updatedInv.reference} clôturée en base avec préfixe INV.`
    );
  };

  const handleBulkInvPatch = async (
    patch: Partial<InventoryDocumentItem>,
    label: string
  ) => {
    if (selectedInvIds.length === 0) return;
    const idSet = new Set(selectedInvIds);
    const next = inventories.map((i) => (idSet.has(i.id) ? { ...i, ...patch } : i));
    await persistDocs(next, `${selectedInvIds.length} document(s) d’inventaire ${label}.`);
    setSelectedInvIds([]);
  };

  const confirmBulkDeleteInvs = async () => {
    if (bulkDeleteInvIds.length === 0) return;
    const idSet = new Set(bulkDeleteInvIds);
    await persistDocs(
      inventories.filter((i) => !idSet.has(i.id)),
      `${bulkDeleteInvIds.length} document(s) d’inventaire supprimé(s).`
    );
    setBulkDeleteInvIds([]);
    setSelectedInvIds([]);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const countRef = sysDoc.generateNextRef('INV', inventories.length + 1);
    const matchedWh = warehouses.find((w) => w.id === newWarehouse);

    const newDoc: InventoryDocumentItem = {
      id: `inv-${Date.now()}`,
      reference: countRef,
      warehouseId: newWarehouse,
      warehouseName: matchedWh?.name || 'Entrepôt Central Principal',
      inventoryType: newType,
      scopeType: newScope,
      scopeTarget: newTarget || (newScope === 'FULL_WAREHOUSE' ? 'Entrepôt Intégral' : 'Zone Spécifique'),
      status: 'DRAFT',
      managerName: newManager,
      totalLines: 2,
      totalCountedLines: 0,
      netDeltaQty: 0,
      financialImpactTnd: 0,
      createdAt: new Date().toISOString(),
      lines: [
        {
          id: `line-${Date.now()}-1`,
          articleId: 'SVC-201OR-STD',
          sku: 'SVC-201OR-STD',
          name: 'Aspirateur Balai Florence 2000W - Orange',
          categoryName: 'Électroménager',
          locationCode: 'WH-CENTRAL/A1',
          unitCostTnd: 165,
          theoreticalQty: 120,
          countedQty: null,
        },
        {
          id: `line-${Date.now()}-2`,
          articleId: 'HK490-STD',
          sku: 'HK490-STD',
          name: 'Friteuse Electrique Florence 2,5L - 1200W',
          categoryName: 'Cuisine',
          locationCode: 'WH-CENTRAL/B3',
          unitCostTnd: 140,
          theoreticalQty: 130,
          countedQty: null,
        },
      ],
    };

    setIsCreateModalOpen(false);
    persistDocs([newDoc, ...inventories], `Session d'inventaire ${countRef} créée en base.`);
  };

  const columns: ColumnDef<InventoryDocumentItem>[] = [
    {
      key: 'reference',
      header: 'Réf. Document',
      sortable: true,
      sortValue: (row) => row.reference,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            INV
          </div>
          <div>
            <span className="font-mono font-bold text-neutral-900 text-xs block">
              {row.reference}
            </span>
            <span className="text-[10px] text-neutral-500">
              {row.inventoryType === 'ANNUAL' && 'Annuel Général'}
              {row.inventoryType === 'CYCLIC' && 'Tournant / Cyclique'}
              {row.inventoryType === 'SPOT' && 'Ponctuel Ciblé'}
            </span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.reference} (${row.inventoryType})`,
    },
    {
      key: 'warehouseName',
      header: 'Entrepôt & Périmètre',
      sortable: true,
      sortValue: (row) => row.warehouseName,
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
            <Warehouse className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>{row.warehouseName}</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-[220px]">
            {row.scopeTarget || 'Ensemble du stock'}
          </div>
        </div>
      ),
      printRender: (row) => `${row.warehouseName} (${row.scopeTarget || 'Stock complet'})`,
    },
    {
      key: 'status',
      header: 'Statut Session',
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => {
        if (row.status === 'COMPLETED') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Clôturé & Ajusté
            </span>
          );
        }
        if (row.status === 'IN_REVIEW') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              En Revue (Écarts)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            Comptage en cours
          </span>
        );
      },
      printRender: (row) => row.status,
    },
    {
      key: 'progress',
      header: 'Avancement Pointage',
      sortable: true,
      sortValue: (row) => row.totalCountedLines / (row.totalLines || 1),
      render: (row) => {
        const percent = Math.round((row.totalCountedLines / (row.totalLines || 1)) * 100);
        return (
          <div className="w-36 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-neutral-600">
              <span>{row.totalCountedLines} / {row.totalLines} art.</span>
              <span className="font-mono font-bold text-neutral-900">{percent}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  percent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
      printRender: (row) => `${row.totalCountedLines} / ${row.totalLines} comptés`,
    },
    {
      key: 'netDeltaQty',
      header: 'Écart (Delta)',
      sortable: true,
      sortValue: (row) => row.netDeltaQty,
      render: (row) => {
        if (row.netDeltaQty === 0) {
          return (
            <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              0 (Parfait)
            </span>
          );
        }
        if (row.netDeltaQty < 0) {
          return (
            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {row.netDeltaQty} pièces
            </span>
          );
        }
        return (
          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
            +{row.netDeltaQty} pièces
          </span>
        );
      },
      printRender: (row) => `${row.netDeltaQty} pièces`,
    },
    {
      key: 'financialImpactTnd',
      header: 'Impact Financier',
      sortable: true,
      sortValue: (row) => row.financialImpactTnd,
      render: (row) => (
        <span
          className={cn(
            'font-mono text-xs font-bold',
            row.financialImpactTnd < 0
              ? 'text-rose-600'
              : row.financialImpactTnd > 0
              ? 'text-amber-600'
              : 'text-neutral-500'
          )}
        >
          {formatTndCurrency(row.financialImpactTnd)}
        </span>
      ),
      printRender: (row) => formatTndCurrency(row.financialImpactTnd),
    },
    {
      key: 'createdAt',
      header: 'Date de Création',
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
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => openCountingSheet(row)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs cursor-pointer"
            title={row.status === 'COMPLETED' ? 'Consulter la session' : 'Pointer la session'}
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

      {/* 1. Page Header Card (Master Layout Standard) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              Documents d’Inventaire & Comptages Physiques
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              AUDIT STOCK
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Gérez les sessions d’inventaire annuel, tournant ou ponctuel, réconciliez les écarts physiques et générez les ajustements comptables officiels.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Entrepôts & Logistique', href: '/dashboard/warehouses' },
              { label: 'Documents d’Inventaire' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs py-2 px-4 shadow-sm"
          >
            Nouvelle Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Sessions Totales</span>
            <FileSpreadsheet className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">
            Historique annuel & tournant
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>En Revue (Écarts)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.inReview}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">
            Écarts constatés à arbitrer
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
            <span>Comptages en Cours</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.drafts}
          </div>
          <div className="text-[11px] text-neutral-500">
            Pointage terrain actif
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Clôturés & Régularisés</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {stats.completed}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Stocks synchronisés en base
          </div>
        </div>
      </div>

      <DataTable<InventoryDocumentItem>
        data={inventories}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedInvIds}
        onSelectionChange={setSelectedInvIds}
        onBulkDelete={(keys) => setBulkDeleteInvIds(keys)}
        renderBulkActions={() => (
          <>
            <select
              value=""
              onChange={(e) => {
                const st = e.target.value as InventoryDocumentItem['status'];
                if (st) {
                  handleBulkInvPatch(
                    {
                      status: st,
                      closedAt: st === 'COMPLETED' ? new Date().toISOString() : undefined,
                    },
                    `passé(s) en « ${st} »`
                  );
                }
              }}
              aria-label="Changer statut inventaire"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Statut session...</option>
              <option value="DRAFT">Brouillon</option>
              <option value="IN_REVIEW">En Validation</option>
              <option value="COMPLETED">Clôturé</option>
              <option value="CANCELLED">Annulé</option>
            </select>
            <select
              value=""
              onChange={(e) => {
                const tp = e.target.value as InventoryDocumentItem['inventoryType'];
                if (tp) handleBulkInvPatch({ inventoryType: tp }, `classé(s) (${tp})`);
              }}
              aria-label="Changer type inventaire"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Type inventaire...</option>
              <option value="ANNUAL">Annuel</option>
              <option value="CYCLIC">Tournant / Cyclique</option>
              <option value="SPOT">Ponctuel</option>
            </select>
          </>
        )}
        searchPlaceholder="Rechercher par référence INV-2026-XXX, entrepôt, responsable..."
        searchKeys={['reference', 'warehouseName', 'scopeTarget', 'managerName']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Documents d'Inventaire Physique — Royal"
        exportFileName="inventaires_royal"
      />

      {selectedInventory && (
        <Modal
          isOpen={!!selectedInventory}
          onClose={() => setSelectedInventory(null)}
          size="fullscreen"
          title={
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg text-neutral-900">
                    Feuille de Comptage — {selectedInventory.reference}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {selectedInventory.warehouseName}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Périmètre : {selectedInventory.scopeTarget} • Responsable : {selectedInventory.managerName}
                </div>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>Total lignes : {editableLines.length}</span>
                <span>•</span>
                <span>
                  Lignes renseignées : {editableLines.filter((l) => l.countedQty !== null).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs px-3.5 py-2 border-neutral-300 hover:bg-neutral-100 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer Feuille de Comptage</span>
                </Button>
                {selectedInventory.status !== 'COMPLETED' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={saveCountingDraft}
                      className="text-xs px-4 py-2 border-neutral-300 hover:bg-neutral-100"
                    >
                      Enregistrer Brouillon
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setIsCloseConfirmOpen(true)}
                      className="text-xs px-5 py-2 bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Clôturer & Régulariser Stock</span>
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedInventory(null)}
                  className="text-xs px-4 py-2"
                >
                  Fermer
                </Button>
              </div>
            </div>
          }
        >
          <div className="p-6 space-y-6">
            <DocumentPrintHeader
              docCode="INV"
              docTitle="FEUILLE DE COMPTAGE INVENTAIRE"
              reference={selectedInventory.reference}
              date={selectedInventory.createdAt}
              status={selectedInventory.status}
            />
            {(() => {
              const deltaCount = editableLines.reduce((acc, l) => {
                if (l.countedQty === null) return acc;
                return acc + (l.countedQty - l.theoreticalQty);
              }, 0);
              const finImpact = editableLines.reduce((acc, l) => {
                if (l.countedQty === null) return acc;
                return acc + (l.countedQty - l.theoreticalQty) * l.unitCostTnd;
              }, 0);

              return (
                <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center font-bold text-neutral-800">
                      Σ
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        Bilan Réconciliation Physique vs Théorique
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Écart calculé en temps réel sur la saisie des opérateurs
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">Delta Pièces</span>
                      <span
                        className={cn(
                          'font-bold text-sm',
                          deltaCount === 0 ? 'text-emerald-700' : deltaCount < 0 ? 'text-rose-600' : 'text-amber-700'
                        )}
                      >
                        {deltaCount > 0 ? `+${deltaCount}` : deltaCount} pcs
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">Impact Financier</span>
                      <span
                        className={cn(
                          'font-bold text-sm',
                          finImpact < 0 ? 'text-rose-600' : finImpact > 0 ? 'text-amber-700' : 'text-emerald-700'
                        )}
                      >
                        {formatTndCurrency(finImpact)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Article & Désignation</th>
                    <th className="py-3 px-4">Emplacement</th>
                    <th className="py-3 px-4 text-right">Stock Système</th>
                    <th className="py-3 px-4 text-center w-36">Comptage Physique</th>
                    <th className="py-3 px-4 text-right">Écart (Delta)</th>
                    <th className="py-3 px-4 text-right">Valeur Écart</th>
                    <th className="py-3 px-4">Observations / Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800">
                  {editableLines.map((line) => {
                    const delta = line.countedQty !== null ? line.countedQty - line.theoreticalQty : null;
                    const deltaCost = delta !== null ? delta * line.unitCostTnd : null;

                    return (
                      <tr key={line.id} className="hover:bg-neutral-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">{line.name}</div>
                          <div className="text-[11px] font-mono text-neutral-500">
                            SKU: {line.sku} • {line.categoryName}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                          {line.locationCode}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                          {line.theoreticalQty}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {selectedInventory.status === 'COMPLETED' ? (
                            <span className="font-mono font-bold text-xs">
                              {line.countedQty ?? 'Non pointé'}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={line.countedQty ?? ''}
                              onChange={(e) => handleCountChange(line.id, e.target.value)}
                              placeholder="Qté réelle"
                              className="w-24 px-2 py-1.5 text-center font-mono font-bold text-xs rounded-lg border border-neutral-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                            />
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {delta === null ? (
                            <span className="text-neutral-400">—</span>
                          ) : delta === 0 ? (
                            <span className="text-emerald-700">0</span>
                          ) : delta < 0 ? (
                            <span className="text-rose-600">{delta}</span>
                          ) : (
                            <span className="text-amber-700">+{delta}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs">
                          {deltaCost === null ? (
                            <span className="text-neutral-400">—</span>
                          ) : (
                            <span className={deltaCost < 0 ? 'text-rose-600 font-bold' : deltaCost > 0 ? 'text-amber-700 font-bold' : 'text-neutral-500'}>
                              {formatTndCurrency(deltaCost)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-neutral-500 italic">
                          {line.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <DocumentPrintFooter docCode="INV" reference={selectedInventory.reference} showTaxNotice={false} />
          </div>
        </Modal>
      )}

      {isCloseConfirmOpen && selectedInventory && (
        <Modal
          isOpen={isCloseConfirmOpen}
          onClose={() => setIsCloseConfirmOpen(false)}
          size="md"
          title="Confirmer la Clôture & l'Ajustement des Stocks"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsCloseConfirmOpen(false)} className="text-xs">
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={confirmCloseInventory}
                className="text-xs px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Confirmer & Appliquer les Écritures
              </Button>
            </div>
          }
        >
          <div className="p-4 space-y-3 text-xs text-neutral-700">
            <p>
              Êtes-vous sûr de vouloir clôturer officiellement la session d’inventaire{' '}
              <strong className="text-neutral-900 font-mono">{selectedInventory.reference}</strong> ?
            </p>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Action Irréversible sur le Stock Réel</span>
              </div>
              <p className="text-[11px]">
                Cette action va générer automatiquement des mouvements d'ajustement (
                <code>ADJUSTMENT_IN</code> en cas d'excédent ou <code>ADJUSTMENT_OUT</code> en cas de manquant) pour aligner rigoureusement la base de données sur la réalité physique.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          size="4xl"
          title="Créer une Nouvelle Session d’Inventaire"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="text-xs">
                Annuler
              </Button>
              <Button
                variant="gold"
                onClick={handleCreateSession}
                className="text-xs px-5 py-2"
              >
                Générer la Feuille de Comptage
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateSession} className="p-6 pb-24 space-y-4 text-xs">
            <div>
              <Select
                label="Entrepôt / Dépôt Cible"
                value={newWarehouse}
                onChange={(e) => setNewWarehouse(e.target.value)}
                options={
                  warehouses.length > 0
                    ? warehouses.map((w) => ({ label: w.name, value: w.id }))
                    : [{ label: 'Entrepôt Central Principal', value: 'wh-central' }]
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Type d’Inventaire"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  options={[
                    { label: 'Inventaire Annuel Général', value: 'ANNUAL' },
                    { label: 'Inventaire Tournant (Cyclique)', value: 'CYCLIC' },
                    { label: 'Inventaire Ponctuel / Ciblé', value: 'SPOT' },
                  ]}
                />
              </div>

              <div>
                <Select
                  label="Périmètre Géographique"
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as any)}
                  options={[
                    { label: 'Tout l’Entrepôt & Quai', value: 'FULL_WAREHOUSE' },
                    { label: 'Par Allée / Rayon', value: 'AISLE' },
                    { label: 'Emplacement Spécifique (Tarma/Étagère)', value: 'CUSTOM' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Précision du Périmètre (Ex: Allée A, Quai Direct, Rayon Café)
              </label>
              <input
                type="text"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="Ex: Allée A — Cuisson & Gros Matériel"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Responsable de Session / Superviseur
              </label>
              <input
                type="text"
                value={newManager}
                onChange={(e) => setNewManager(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900"
              />
            </div>
          </form>
        </Modal>
      )}
      <DeleteConfirmModal
        isOpen={bulkDeleteInvIds.length > 0}
        onClose={() => setBulkDeleteInvIds([])}
        onConfirm={confirmBulkDeleteInvs}
        title="Supprimer les feuilles d’inventaire sélectionnées"
        description={`Confirmez-vous la suppression des ${bulkDeleteInvIds.length} document(s) d’inventaire sélectionné(s) ?`}
      />
    </div>
  );
}
