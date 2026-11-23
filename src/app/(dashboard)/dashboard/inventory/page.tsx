'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Boxes,
  Package,
  AlertTriangle,
  RefreshCw,
  History,
  Warehouse,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Select } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';

export interface StockRow {
  id: string;
  variantId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode?: string;
  primaryImage?: string;
  category?: string;
  brand?: string;
  sellingPrice: number;
  physicalQty: number;
  reservedQty: number;
  availableQty: number;
  reorderPoint: number;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementRow {
  id: string;
  type: 'PURCHASE_IN' | 'SALE_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'RETURN_IN';
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  performedBy: string;
  warehouseName: string;
  articleName: string;
  sku: string;
  createdAt: string;
}

const INITIAL_STOCKS: StockRow[] = [
  {
    id: 'stk-1',
    variantId: 'var-1',
    warehouseId: 'wh-sousse',
    warehouseName: 'Dépôt Sousse — Hub Central',
    warehouseCode: 'DEP-SOUSSE',
    productName: 'Lave-linge Bosch Série 6 — 9kg',
    variantName: '9kg • 1400tr • Inox Silver',
    sku: 'BOSCH-SERIE6-9KG',
    category: 'Gros Électroménager',
    brand: 'Bosch',
    sellingPrice: 1850,
    physicalQty: 14,
    reservedQty: 2,
    availableQty: 12,
    reorderPoint: 5,
    isLowStock: false,
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-14T10:30:00Z',
  },
  {
    id: 'stk-2',
    variantId: 'var-2',
    warehouseId: 'wh-sousse',
    warehouseName: 'Dépôt Sousse — Hub Central',
    warehouseCode: 'DEP-SOUSSE',
    productName: 'Réfrigérateur Samsung Multi-Portes 650L',
    variantName: '650L • Froid Ventilé Plus',
    sku: 'SAMS-RF65-INV',
    category: 'Froid & Climatisation',
    brand: 'Samsung',
    sellingPrice: 3490,
    physicalQty: 6,
    reservedQty: 1,
    availableQty: 5,
    reorderPoint: 4,
    isLowStock: false,
    createdAt: '2026-11-02T10:15:00Z',
    updatedAt: '2026-11-13T14:20:00Z',
  },
  {
    id: 'stk-3',
    variantId: 'var-3',
    warehouseId: 'wh-lac',
    warehouseName: 'Showroom Tunis — Les Berges du Lac',
    warehouseCode: 'SHOWROOM-LAC',
    productName: 'Machine Espresso DeLonghi Magnifica S',
    variantName: 'Buse Vapeur Cappuccino • Noire',
    sku: 'DELONG-MAGNIFICA-S',
    category: 'Petit Déjeuner & Café',
    brand: 'DeLonghi',
    sellingPrice: 1250,
    physicalQty: 3,
    reservedQty: 1,
    availableQty: 2,
    reorderPoint: 5,
    isLowStock: true,
    createdAt: '2026-11-03T11:00:00Z',
    updatedAt: '2026-11-15T16:00:00Z',
  },
  {
    id: 'stk-4',
    variantId: 'var-4',
    warehouseId: 'wh-sousse',
    warehouseName: 'Dépôt Sousse — Hub Central',
    warehouseCode: 'DEP-SOUSSE',
    productName: 'Friteuse Sans Huile Tefal Easy Fry 4.2L',
    variantName: '4.2L • Digitale 8 Programmes',
    sku: 'TEFAL-AIRFRY-EY505',
    category: 'Cuisson & Convivialité',
    brand: 'Tefal',
    sellingPrice: 280,
    physicalQty: 30,
    reservedQty: 4,
    availableQty: 26,
    reorderPoint: 8,
    isLowStock: false,
    createdAt: '2026-11-04T08:45:00Z',
    updatedAt: '2026-11-15T11:00:00Z',
  },
  {
    id: 'stk-5',
    variantId: 'var-5',
    warehouseId: 'wh-marsa',
    warehouseName: 'Showroom La Marsa VIP',
    warehouseCode: 'SHOWROOM-MARSA',
    productName: 'Four Encastrable Beko Multifonction Pyrolyse',
    variantName: '71L • Chaleur Tournante 3D',
    sku: 'BEKO-OVEN-71L',
    category: 'Cuisson & Convivialité',
    brand: 'Beko',
    sellingPrice: 1450,
    physicalQty: 2,
    reservedQty: 0,
    availableQty: 2,
    reorderPoint: 3,
    isLowStock: true,
    createdAt: '2026-11-05T14:30:00Z',
    updatedAt: '2026-11-14T09:15:00Z',
  },
];

const INITIAL_MOVEMENTS: StockMovementRow[] = [
  {
    id: 'mov-1',
    type: 'PURCHASE_IN',
    quantityDelta: 10,
    quantityBefore: 4,
    quantityAfter: 14,
    reason: 'Réception Bon d’Entrée Fournisseur BE-2026-001',
    referenceType: 'GOODS_RECEIPT',
    referenceId: 'BE-2026-001',
    performedBy: 'Mohamed Zitouni (Superadmin)',
    warehouseName: 'Dépôt Sousse — Hub Central',
    articleName: 'Lave-linge Bosch Série 6 — 9kg',
    sku: 'BOSCH-SERIE6-9KG',
    createdAt: '2026-11-14T10:30:00Z',
  },
  {
    id: 'mov-2',
    type: 'SALE_OUT',
    quantityDelta: -2,
    quantityBefore: 8,
    quantityAfter: 6,
    reason: 'Expédition Commande Client #CMD-2026-402',
    referenceType: 'CUSTOMER_ORDER',
    referenceId: 'CMD-2026-402',
    performedBy: 'Caisse Tunis Lac',
    warehouseName: 'Dépôt Sousse — Hub Central',
    articleName: 'Réfrigérateur Samsung Multi-Portes 650L',
    sku: 'SAMS-RF65-INV',
    createdAt: '2026-11-13T14:20:00Z',
  },
  {
    id: 'mov-3',
    type: 'TRANSFER_IN',
    quantityDelta: 3,
    quantityBefore: 0,
    quantityAfter: 3,
    reason: 'Transfert inter-dépôts TRF-2026-012 depuis Sousse',
    referenceType: 'STOCK_TRANSFER',
    referenceId: 'TRF-2026-012',
    performedBy: 'Kamel Mansour (Resp. Dépôt)',
    warehouseName: 'Showroom Tunis — Les Berges du Lac',
    articleName: 'Machine Espresso DeLonghi Magnifica S',
    sku: 'DELONG-MAGNIFICA-S',
    createdAt: '2026-11-15T16:00:00Z',
  },
  {
    id: 'mov-4',
    type: 'ADJUSTMENT_OUT',
    quantityDelta: -1,
    quantityBefore: 23,
    quantityAfter: 22,
    reason: 'Régularisation inventaire physique (casse quai)',
    referenceType: 'INVENTORY_DOCUMENT',
    referenceId: 'INV-2026-001',
    performedBy: 'Tarek Cherif (Opérateur Quai)',
    warehouseName: 'Dépôt Sousse — Hub Central',
    articleName: 'Machine Espresso DeLonghi Magnifica S',
    sku: 'DELONG-MAGNIFICA-S',
    createdAt: '2026-11-14T08:30:00Z',
  },
];

export default function InventoryLedgerPage() {
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'stocks' | 'movements'>('stocks');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [adjustItem, setAdjustItem] = useState<StockRow | null>(null);
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
  const [selectedMovementIds, setSelectedMovementIds] = useState<string[]>([]);
  const [newPhysicalQty, setNewPhysicalQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Comptage physique ponctuel');

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const [rawStk, rawMov] = await Promise.all([
        fetchAllPaginated<any>('/inventory/stock', 200).then((r) => r.items).catch(() => []),
        fetchAllPaginated<any>('/inventory/movements', 200).then((r) => r.items).catch(() => []),
      ]);
      const mappedStk: StockRow[] = (Array.isArray(rawStk) ? rawStk : []).map((s: any) => ({
        id: s.id,
        variantId: s.variantId,
        warehouseId: s.warehouseId,
        warehouseName: s.warehouseName || 'Entrepôt',
        warehouseCode: s.warehouseCode || 'WH',
        productName: s.productName || 'Article',
        variantName: s.variantName || 'Standard',
        sku: s.sku || '',
        barcode: s.barcode,
        primaryImage: s.primaryImage,
        category: s.category || 'Catalogue',
        brand: s.brand || 'Royal',
        sellingPrice: Number(s.sellingPrice || 0),
        physicalQty: Number(s.physicalQty ?? 0),
        reservedQty: Number(s.reservedQty ?? 0),
        availableQty: Number(s.availableQty ?? Math.max(0, (s.physicalQty ?? 0) - (s.reservedQty ?? 0))),
        reorderPoint: Number(s.reorderPoint ?? 10),
        isLowStock: Boolean(s.isLowStock),
        createdAt: s.updatedAt || s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
      }));
      setStocks(mappedStk);

      const mappedMov: StockMovementRow[] = (Array.isArray(rawMov) ? rawMov : []).map((m: any) => ({
        id: m.id,
        type: m.type,
        quantityDelta: Number(m.quantityDelta ?? 0),
        quantityBefore: Number(m.quantityBefore ?? 0),
        quantityAfter: Number(m.quantityAfter ?? 0),
        reason: m.reason || '',
        referenceType: m.referenceType || '',
        referenceId: m.referenceId || '',
        performedBy: m.performedBy || 'SYSTEM',
        warehouseName: m.stock?.warehouse?.name || m.warehouseName || 'Entrepôt',
        articleName: m.stock?.variant?.product?.name || m.articleName || 'Article',
        sku: m.stock?.variant?.sku || m.sku || '',
        createdAt: m.createdAt || new Date().toISOString(),
      }));
      setMovements(mappedMov);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const stats = useMemo(() => {
    const totalRef = stocks.length;
    const totalPhysical = stocks.reduce((acc, s) => acc + s.physicalQty, 0);
    const lowStockCount = stocks.filter((s) => s.isLowStock).length;
    const totalMovements = movements.length;
    return { totalRef, totalPhysical, lowStockCount, totalMovements };
  }, [stocks, movements]);

  const openAdjustModal = (item: StockRow) => {
    setAdjustItem(item);
    setNewPhysicalQty(item.physicalQty);
    setAdjustReason('Comptage physique ponctuel');
  };

  const handleBulkAdjustDelta = async (delta: number) => {
    if (selectedStockIds.length === 0) return;
    setSaving(true);
    try {
      const targets = stocks.filter((s) => selectedStockIds.includes(s.id));
      await Promise.allSettled(
        targets.map((row) =>
          fetchApi('/inventory/adjust', {
            method: 'POST',
            body: JSON.stringify({
              variantId: row.variantId,
              warehouseId: row.warehouseId,
              newPhysicalQty: Math.max(0, row.physicalQty + delta),
              reason: `Ajustement groupé (${delta >= 0 ? `+${delta}` : delta} unités)`,
            }),
          })
        )
      );
      setFeedbackMessage(
        `Stock ajusté (${delta >= 0 ? `+${delta}` : delta}) pour ${targets.length} référence(s).`
      );
      setSelectedStockIds([]);
      await loadInventory();
    } catch {
      setFeedbackMessage('Erreur lors de l’ajustement groupé des stocks.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportSelectedStocks = () => {
    const selected = stocks.filter((s) => selectedStockIds.includes(s.id));
    if (selected.length === 0) return;
    const csv = [
      ['SKU', 'Article', 'Entrepôt', 'Physique', 'Réservé', 'Disponible', 'Seuil'],
      ...selected.map((s) => [
        s.sku,
        `"${s.productName.replace(/"/g, '""')}"`,
        `"${s.warehouseName.replace(/"/g, '""')}"`,
        s.physicalQty,
        s.reservedQty,
        s.availableQty,
        s.reorderPoint,
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stocks_selection_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyAdjustment = async () => {
    if (!adjustItem) return;
    const delta = newPhysicalQty - adjustItem.physicalQty;
    if (delta === 0) {
      setAdjustItem(null);
      return;
    }

    setSaving(true);
    try {
      await fetchApi('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          variantId: adjustItem.variantId,
          warehouseId: adjustItem.warehouseId,
          newPhysicalQty,
          reason: adjustReason,
        }),
      });
      setAdjustItem(null);
      setFeedbackMessage(`Stock régularisé dans PostgreSQL (${delta > 0 ? `+${delta}` : delta} pièces).`);
      await loadInventory();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de l’ajustement de stock.');
    } finally {
      setSaving(false);
    }
  };

  const stockColumns: ColumnDef<StockRow>[] = [
    {
      key: 'article',
      header: 'Article & Référence',
      sortable: true,
      sortValue: (row) => row.productName,
      render: (row) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">
            {row.productName}
          </span>
          <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
            SKU: {row.sku} • {row.brand}
          </div>
        </div>
      ),
      printRender: (row) => `${row.productName} (SKU: ${row.sku})`,
    },
    {
      key: 'warehouseName',
      header: 'Entrepôt & Dépôt',
      sortable: true,
      sortValue: (row) => row.warehouseName,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-neutral-800">
          <Warehouse className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>{row.warehouseName}</span>
        </div>
      ),
      printRender: (row) => row.warehouseName,
    },
    {
      key: 'physicalQty',
      header: 'Stock Physique',
      sortable: true,
      sortValue: (row) => row.physicalQty,
      render: (row) => (
        <span className="font-mono text-xs font-black text-neutral-900">
          {row.physicalQty} pcs
        </span>
      ),
      printRender: (row) => `${row.physicalQty} pcs`,
    },
    {
      key: 'reservedQty',
      header: 'Réservé (Commandes)',
      sortable: true,
      sortValue: (row) => row.reservedQty,
      render: (row) => (
        <span className="font-mono text-xs text-neutral-600">
          {row.reservedQty} pcs
        </span>
      ),
      printRender: (row) => `${row.reservedQty} pcs`,
    },
    {
      key: 'availableQty',
      header: 'Disponible à la Vente',
      sortable: true,
      sortValue: (row) => row.availableQty,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {row.availableQty} pcs
        </span>
      ),
      printRender: (row) => `${row.availableQty} pcs`,
    },
    {
      key: 'isLowStock',
      header: 'Alerte Seuil',
      sortable: true,
      sortValue: (row) => (row.isLowStock ? 1 : 0),
      render: (row) => {
        if (row.isLowStock) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Critique (≤ {row.reorderPoint})
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            Normal ({row.reorderPoint})
          </span>
        );
      },
      printRender: (row) => (row.isLowStock ? 'Critique' : 'Normal'),
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
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openAdjustModal(row)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs cursor-pointer"
            title="Ajuster le stock physique manuellement"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const movementColumns: ColumnDef<StockMovementRow>[] = [
    {
      key: 'type',
      header: 'Mouvement',
      sortable: true,
      sortValue: (row) => row.type,
      render: (row) => {
        const isPositive = row.quantityDelta > 0;
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0',
                isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              )}
            >
              {isPositive ? '+' : '-'}
            </span>
            <div>
              <span className="font-mono text-xs font-bold text-neutral-900 block">
                {row.type}
              </span>
              <span className="text-[10px] text-neutral-500">{row.referenceId || 'Manuel'}</span>
            </div>
          </div>
        );
      },
      printRender: (row) => `${row.type} (${row.referenceId || 'Manuel'})`,
    },
    {
      key: 'article',
      header: 'Article & Dépôt',
      sortable: true,
      sortValue: (row) => row.articleName,
      render: (row) => (
        <div>
          <div className="font-semibold text-neutral-900 text-xs">{row.articleName}</div>
          <div className="text-[11px] text-neutral-500 font-mono">
            {row.sku} • {row.warehouseName}
          </div>
        </div>
      ),
      printRender: (row) => `${row.articleName} - ${row.warehouseName}`,
    },
    {
      key: 'delta',
      header: 'Variation (Delta)',
      sortable: true,
      sortValue: (row) => row.quantityDelta,
      render: (row) => (
        <span
          className={cn(
            'font-mono text-xs font-black',
            row.quantityDelta > 0 ? 'text-emerald-700' : 'text-rose-600'
          )}
        >
          {row.quantityDelta > 0 ? `+${row.quantityDelta}` : row.quantityDelta} pcs
        </span>
      ),
      printRender: (row) => `${row.quantityDelta > 0 ? `+${row.quantityDelta}` : row.quantityDelta} pcs`,
    },
    {
      key: 'transition',
      header: 'Avant ➔ Après',
      sortable: true,
      sortValue: (row) => row.quantityAfter,
      render: (row) => (
        <span className="font-mono text-xs text-neutral-600">
          {row.quantityBefore} ➔ <strong className="text-neutral-900">{row.quantityAfter}</strong>
        </span>
      ),
      printRender: (row) => `${row.quantityBefore} -> ${row.quantityAfter}`,
    },
    {
      key: 'reason',
      header: 'Motif & Référence',
      sortable: true,
      sortValue: (row) => row.reason || '',
      render: (row) => (
        <div className="text-xs text-neutral-700 truncate max-w-[280px]" title={row.reason}>
          {row.reason || '—'}
        </div>
      ),
      printRender: (row) => row.reason || '—',
    },
    {
      key: 'performedBy',
      header: 'Opérateur',
      sortable: true,
      sortValue: (row) => row.performedBy,
      render: (row) => (
        <span className="text-xs text-neutral-600 font-medium">{row.performedBy}</span>
      ),
      printRender: (row) => row.performedBy,
    },
    {
      key: 'createdAt',
      header: 'Horodatage',
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="text-neutral-900 font-medium">
            {new Date(row.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
            })}
          </div>
          <div className="text-[11px] text-neutral-400">
            {new Date(row.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
      printRender: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR'),
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
              Niveaux de Stock & Grand Livre des Mouvements
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              MULTI-DÉPÔTS
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Consolidation multi-dépôts en temps réel, suivi des réservations commandes et traçabilité intégrale des mouvements de stock.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Entrepôts & Logistique', href: '/dashboard/warehouses' },
              { label: 'Stocks & Mouvements' },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Références Gérées</span>
            <Package className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.totalRef}
          </div>
          <div className="text-[11px] text-neutral-500">Articles actifs en stock</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Stock Physique Global</span>
            <Warehouse className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.totalPhysical} pcs
          </div>
          <div className="text-[11px] text-neutral-500">Consolidé tous entrepôts</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700">
            <span>Alertes Seuil Critique</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 font-heading">
            {stats.lowStockCount}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">Réapprovisionnement requis</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Mouvements Traités</span>
            <History className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.totalMovements}
          </div>
          <div className="text-[11px] text-neutral-500">Entrées, sorties & transferts</div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('stocks')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            activeTab === 'stocks'
              ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <Boxes className="w-4 h-4" />
          <span>Niveaux de Stock par Entrepôt ({stocks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            activeTab === 'movements'
              ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <History className="w-4 h-4" />
          <span>Grand Livre des Mouvements ({movements.length})</span>
        </button>
      </div>

      {activeTab === 'stocks' ? (
        <DataTable<StockRow>
          data={stocks}
          isLoading={loading}
          columns={stockColumns}
          keyExtractor={(item) => item.id}
          enableMultiSelect={true}
          selectedKeys={selectedStockIds}
          onSelectionChange={setSelectedStockIds}
          renderBulkActions={() => (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleBulkAdjustDelta(1)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                +1 unité
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleBulkAdjustDelta(-1)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                -1 unité
              </button>
              <button
                type="button"
                onClick={handleExportSelectedStocks}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold transition cursor-pointer"
              >
                Exporter CSV sélection
              </button>
            </>
          )}
          searchPlaceholder="Rechercher par article, SKU, marque, entrepôt..."
          searchKeys={['productName', 'sku', 'brand', 'category', 'warehouseName']}
          supportedModes={['table', 'list', 'matrix']}
          defaultMode="table"
          printTitle="Niveaux de Stocks Multi-Dépôts — Royal"
          exportFileName="stocks_royal"
        />
      ) : (
        <DataTable<StockMovementRow>
          data={movements}
          isLoading={loading}
          columns={movementColumns}
          keyExtractor={(item) => item.id}
          enableMultiSelect={true}
          selectedKeys={selectedMovementIds}
          onSelectionChange={setSelectedMovementIds}
          renderBulkActions={() => (
            <button
              type="button"
              onClick={() => {
                const selected = movements.filter((m) => selectedMovementIds.includes(m.id));
                const csv = [
                  ['Date', 'Type', 'SKU', 'Article', 'Entrepôt', 'Delta', 'Après', 'Motif'],
                  ...selected.map((m) => [
                    m.createdAt,
                    m.type,
                    m.sku,
                    `"${m.articleName.replace(/"/g, '""')}"`,
                    `"${m.warehouseName.replace(/"/g, '""')}"`,
                    m.quantityDelta,
                    m.quantityAfter,
                    `"${(m.reason || '').replace(/"/g, '""')}"`,
                  ]),
                ]
                  .map((r) => r.join(','))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mouvements_selection_${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold transition cursor-pointer"
            >
              Exporter CSV ({selectedMovementIds.length})
            </button>
          )}
          searchPlaceholder="Filtrer les mouvements de stock par article, SKU, motif..."
          searchKeys={['articleName', 'sku', 'type', 'reason', 'performedBy', 'warehouseName']}
          supportedModes={['table', 'list', 'matrix']}
          defaultMode="table"
          printTitle="Grand Livre des Mouvements de Stock — Royal"
          exportFileName="mouvements_stock_royal"
        />
      )}

      {adjustItem && (
        <Modal
          isOpen={!!adjustItem}
          onClose={() => setAdjustItem(null)}
          size="xl"
          title={`Ajustement de Stock — ${adjustItem.productName}`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setAdjustItem(null)} className="text-xs">
                Annuler
              </Button>
              <Button
                variant="gold"
                disabled={saving}
                onClick={handleApplyAdjustment}
                className="text-xs px-4 py-2"
              >
                {saving ? 'Application...' : "Appliquer l'Ajustement"}
              </Button>
            </div>
          }
        >
          <div className="p-6 pb-24 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1 font-mono">
              <div className="font-bold text-neutral-900">{adjustItem.warehouseName}</div>
              <div className="text-neutral-500">
                SKU: {adjustItem.sku} • Stock actuel : {adjustItem.physicalQty} pcs
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Nouveau Stock Physique Réel
              </label>
              <input
                type="number"
                min="0"
                value={newPhysicalQty}
                onChange={(e) => setNewPhysicalQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono font-bold text-sm text-neutral-900"
              />
              <div className="text-[11px] text-neutral-500 mt-1">
                Variation calculée :{' '}
                <strong
                  className={newPhysicalQty - adjustItem.physicalQty >= 0 ? 'text-emerald-700' : 'text-rose-600'}
                >
                  {newPhysicalQty - adjustItem.physicalQty >= 0
                    ? `+${newPhysicalQty - adjustItem.physicalQty}`
                    : newPhysicalQty - adjustItem.physicalQty}{' '}
                  pièces
                </strong>
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Motif de Régularisation Obligatoire
              </label>
              <Select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                options={[
                  { label: 'Comptage physique ponctuel', value: 'Comptage physique ponctuel' },
                  { label: 'Casse / Avarie en rayon', value: 'Casse / Avarie en rayon' },
                  { label: 'Perte / Écart non élucidé', value: 'Perte / Écart non élucidé' },
                  { label: 'Retrouvé en entrepôt (surplus)', value: 'Retrouvé en entrepôt (surplus)' },
                  { label: 'Retour client non réintégré', value: 'Retour client non réintégré' },
                ]}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
