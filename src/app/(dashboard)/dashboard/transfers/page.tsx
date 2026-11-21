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
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Select } from '@/components/ui/select';
import { fetchApi } from '@/lib/api';
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
  reference: string; // ex: TRF-2026-012
  sourceWarehouseName: string;
  targetWarehouseName: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  carrierName: string;
  totalPieces: number;
  requestedBy: string;
  createdAt: string;
  completedAt?: string | null;
  items: TransferLine[];
}

const INITIAL_TRANSFERS: StockTransferMasterItem[] = [
  {
    id: 'trf-001',
    reference: 'TRF-2026-012',
    sourceWarehouseName: 'Dépôt Sousse — Hub Central',
    targetWarehouseName: 'Showroom Tunis — Les Berges du Lac',
    status: 'IN_TRANSIT',
    carrierName: 'Flotte Interne Royal (Camionnette 02)',
    totalPieces: 3,
    requestedBy: 'Kamel Mansour (Resp. Lac)',
    createdAt: '2026-11-15T14:00:00Z',
    items: [
      {
        id: 'tl-1',
        name: 'Machine Espresso DeLonghi Magnifica S',
        sku: 'DELONG-MAGNIFICA-S',
        quantity: 3,
      },
    ],
  },
  {
    id: 'trf-002',
    reference: 'TRF-2026-011',
    sourceWarehouseName: 'Dépôt Sousse — Hub Central',
    targetWarehouseName: 'Showroom La Marsa VIP',
    status: 'COMPLETED',
    carrierName: 'Flotte Interne Royal (Camion 01)',
    totalPieces: 2,
    requestedBy: 'Direction Commerciale',
    createdAt: '2026-11-13T09:30:00Z',
    completedAt: '2026-11-13T17:00:00Z',
    items: [
      {
        id: 'tl-2',
        name: 'Four Encastrable Beko Multifonction',
        sku: 'BEKO-OVEN-71L',
        quantity: 2,
      },
    ],
  },
  {
    id: 'trf-003',
    reference: 'TRF-2026-010',
    sourceWarehouseName: 'Showroom Tunis — Les Berges du Lac',
    targetWarehouseName: 'Dépôt Sousse — Hub Central',
    status: 'COMPLETED',
    carrierName: 'Retour Véhicule',
    totalPieces: 1,
    requestedBy: 'SAV Central',
    createdAt: '2026-11-10T11:00:00Z',
    completedAt: '2026-11-11T10:00:00Z',
    items: [
      {
        id: 'tl-3',
        name: 'Friteuse Sans Huile Tefal Easy Fry',
        sku: 'TEFAL-AIRFRY-EY505',
        quantity: 1,
      },
    ],
  },
];

export default function StockTransfersPage() {
  const sysDoc = useSystemDocumentConfig();
  const [transfers, setTransfers] = useState<StockTransferMasterItem[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [catalogVariants, setCatalogVariants] = useState<Array<{ id: string; sku: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransferMasterItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [fromWhId, setFromWhId] = useState('');
  const [toWhId, setToWhId] = useState('');
  const [transferVariantId, setTransferVariantId] = useState('');
  const [transferQty, setTransferQty] = useState(2);

  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [trfRes, whRes, prodRes] = await Promise.all([
        fetchApi('/transfers').catch(() => []),
        fetchApi('/warehouses').catch(() => []),
        fetchApi('/products?limit=500&status=ACTIVE').catch(() => null),
      ]);
      const whList = Array.isArray(whRes) ? whRes : whRes?.data || [];
      setWarehouses(whList);
      if (whList.length >= 2) {
        setFromWhId((prev) => prev || whList[0].id);
        setToWhId((prev) => prev || whList[1].id);
      }
      const rawProds = prodRes?.data?.data || prodRes?.data?.items || prodRes?.items || prodRes?.data || (Array.isArray(prodRes) ? prodRes : []);
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
          sourceWarehouseName: t.fromWarehouse?.name || 'Entrepôt Source',
          targetWarehouseName: t.toWarehouse?.name || 'Entrepôt Cible',
          status: t.status === 'APPROVED' ? 'PENDING' : t.status,
          carrierName: 'Flotte Interne Royal',
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
              {row.reference}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Inter-Dépôts
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
              En Transit
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            En Attente Validation
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
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSelectedTransfer(row)}
            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs cursor-pointer"
            title="Consulter le bon de transfert inter-dépôts"
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
        searchPlaceholder="Rechercher par N° TRF-2026-XXX, entrepôt source, cible, transporteur..."
        searchKeys={['reference', 'sourceWarehouseName', 'targetWarehouseName', 'carrierName', 'requestedBy']}
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
              { value: 'PENDING', label: 'PENDING (En attente)' },
              { value: 'IN_TRANSIT', label: 'IN_TRANSIT (En transit)' },
              { value: 'COMPLETED', label: 'COMPLETED (Réceptionné)' },
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
    </div>
  );
}
