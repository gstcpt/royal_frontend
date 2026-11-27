'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  Building2,
  Calendar,
  Truck,
  Edit3,
  Printer,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { formatTndCurrency } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import { useSystemDocumentConfig } from '@/hooks/useSystemDocumentConfig';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';
import {
  DataTable,
  ColumnDef,
  Button,
  Badge,
  Modal,
  DeleteConfirmModal,
  Input,
  Select,
  Breadcrumb,
  Toast,
} from '@/components/ui';

export interface PurchaseOrderLine {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unitPriceHt: number;
  taxRate: number;
}

export interface PurchaseOrderItem {
  id: string;
  orderNumber: string;
  supplierName: string;
  totalHt: number;
  totalTtc: number;
  itemsCount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  expectedDeliveryDate: string;
  notes?: string;
  items?: PurchaseOrderLine[];
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Brouillon', cls: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
  CONFIRMED: { label: 'Confirmé Fournisseur', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  PARTIALLY_RECEIVED: { label: 'Réception Partielle', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  COMPLETED: { label: 'Réceptionné Total', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: 'Annulé', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
};

function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sysDoc = useSystemDocumentConfig();
  const { isRouteVisible } = useRouteVisibility();
  const canCreateReceipt = isRouteVisible('/dashboard/purchases/receipts');
  const [orders, setOrders] = React.useState<PurchaseOrderItem[]>([]);
  const [suppliers, setSuppliers] = React.useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingOrder, setEditingOrder] = React.useState<PurchaseOrderItem | null>(null);
  const [selectedOrder, setSelectedOrder] = React.useState<PurchaseOrderItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<PurchaseOrderItem | null>(null);
  const [selectedPoIds, setSelectedPoIds] = React.useState<string[]>([]);
  const [bulkDeletePoIds, setBulkDeletePoIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Add/Edit form state
  const [formSupplier, setFormSupplier] = React.useState('');
  const [formExpectedDate, setFormExpectedDate] = React.useState(() =>
    new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  );
  const [formStatus, setFormStatus] = React.useState<PurchaseOrderItem['status']>('CONFIRMED');
  const [formNotes, setFormNotes] = React.useState('');
  const [formLines, setFormLines] = React.useState<PurchaseOrderLine[]>([]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [poRes, supRes] = await Promise.all([
        fetchApi('/storefront-cms/sys-config/purchaseOrders').catch(() => null),
        fetchApi('/suppliers').catch(() => []),
      ]);
      const rawPo = poRes?.value ?? poRes?.data?.value ?? poRes?.data ?? poRes;
      const poList = Array.isArray(rawPo) ? rawPo : [];
      const supList = Array.isArray(supRes?.data) ? supRes.data : Array.isArray(supRes) ? supRes : [];
      setOrders(poList);
      setSuppliers(supList.map((s: any) => ({ id: s.id, name: s.name })));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    const fromProspect = searchParams.get('fromProspect');
    if (fromProspect) {
      setEditingOrder(null);
      setFormSupplier(fromProspect);
      setFormStatus('CONFIRMED');
      setFormNotes(`Issu du prospect qualifié : ${fromProspect}`);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const persistOrders = async (next: PurchaseOrderItem[], msg: string) => {
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/purchaseOrders', {
        method: 'PUT',
        body: JSON.stringify({ value: next }),
      });
      setOrders(next);
      setToast({ msg, type: 'success' });
    } catch (e: any) {
      setToast({ msg: e?.message || 'Erreur lors de la sauvegarde PostgreSQL.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPoStatus = async (status: PurchaseOrderItem['status']) => {
    if (selectedPoIds.length === 0) return;
    const set = new Set(selectedPoIds);
    await persistOrders(
      orders.map((o) => (set.has(o.id) ? { ...o, status } : o)),
      `${selectedPoIds.length} bon(s) de commande passé(s) en ${status}.`
    );
    setSelectedPoIds([]);
  };

  const confirmBulkDeletePos = async () => {
    if (bulkDeletePoIds.length === 0) return;
    const set = new Set(bulkDeletePoIds);
    await persistOrders(
      orders.filter((o) => !set.has(o.id)),
      `${bulkDeletePoIds.length} bon(s) de commande supprimé(s).`
    );
    setBulkDeletePoIds([]);
    setSelectedPoIds([]);
  };

  const openCreateModal = () => {
    setEditingOrder(null);
    setFormSupplier(suppliers[0]?.name || '');
    setFormExpectedDate(new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
    setFormStatus('CONFIRMED');
    setFormNotes('');
    setFormLines([
      { id: `ln-${Date.now()}`, sku: '', name: '', qty: 1, unitPriceHt: 0, taxRate: sysDoc.defaultVatRate || 19 },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (po: PurchaseOrderItem) => {
    setEditingOrder(po);
    setFormSupplier(po.supplierName);
    setFormExpectedDate(po.expectedDeliveryDate || new Date().toISOString().slice(0, 10));
    setFormStatus(po.status);
    setFormNotes(po.notes || '');
    setFormLines(
      Array.isArray(po.items) && po.items.length > 0
        ? po.items.map((it: any, idx: number) => ({
            id: it.id || `ln-${idx}-${Date.now()}`,
            sku: it.sku || 'RYL',
            name: it.name || 'Article',
            qty: Number(it.qty ?? it.quantity ?? 1),
            unitPriceHt: Number(it.unitPriceHt || 0),
            taxRate: Number(it.taxRate || 19),
          }))
        : [{ id: `ln-${Date.now()}`, sku: 'RYL-LOT-01', name: 'Lot Approvisionnement Catalogue', qty: po.itemsCount || 1, unitPriceHt: Number((po.totalHt / Math.max(1, po.itemsCount || 1)).toFixed(2)), taxRate: 19 }]
    );
    setIsModalOpen(true);
  };

  const formHt = formLines.reduce((acc, l) => acc + l.qty * l.unitPriceHt, 0);
  const formTtc = formLines.reduce((acc, l) => acc + l.qty * l.unitPriceHt * (1 + (l.taxRate ?? sysDoc.defaultVatRate) / 100), 0);
  const formQtySum = formLines.reduce((acc, l) => acc + l.qty, 0);

  const handleSave = async () => {
    if (!formSupplier.trim() || formLines.length === 0) return;
    if (editingOrder) {
      const next = orders.map((o) =>
        o.id === editingOrder.id
          ? {
              ...o,
              supplierName: formSupplier.trim(),
              expectedDeliveryDate: formExpectedDate,
              status: formStatus,
              notes: formNotes,
              items: formLines,
              itemsCount: formQtySum,
              totalHt: Number(formHt.toFixed(2)),
              totalTtc: Number(formTtc.toFixed(2)),
            }
          : o
      );
      await persistOrders(next, `Bon de Commande ${editingOrder.orderNumber} mis à jour.`);
    } else {
      const newOrder: PurchaseOrderItem = {
        id: `po-${Date.now()}`,
        orderNumber: sysDoc.generateNextRef('BC', orders.length + 46),
        supplierName: formSupplier.trim(),
        expectedDeliveryDate: formExpectedDate,
        status: formStatus,
        notes: formNotes,
        items: formLines,
        itemsCount: formQtySum,
        totalHt: Number(formHt.toFixed(2)),
        totalTtc: Number(formTtc.toFixed(2)),
        createdAt: new Date().toISOString(),
      };
      await persistOrders([newOrder, ...orders], `Bon de Commande ${newOrder.orderNumber} créé.`);
    }
    setIsModalOpen(false);
  };

  const columns: ColumnDef<PurchaseOrderItem>[] = [
    {
      key: 'orderNumber',
      header: 'N° Bon de Commande',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-bold text-[#1D232E] font-mono">{item.orderNumber}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut Commande',
      sortable: true,
      render: (item) => {
        const meta = STATUS_META[item.status] || STATUS_META.DRAFT;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.cls}`}>
            <Clock className="h-3 w-3" />
            <span>{meta.label}</span>
          </span>
        );
      },
    },
    {
      key: 'supplierName',
      header: 'Fournisseur & Articles',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D232E]">
            <Building2 className="h-3.5 w-3.5 text-[#C59B27] shrink-0" />
            <span className="truncate max-w-[260px]">{item.supplierName}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">{item.itemsCount} unité(s) commandée(s)</div>
        </div>
      ),
    },
    {
      key: 'totalTtc',
      header: 'Montant TTC (TND)',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-black text-[#1D232E] font-mono">{formatTndCurrency(item.totalTtc)}</div>
          <div className="text-[10px] text-slate-400 font-mono">HT : {formatTndCurrency(item.totalHt)}</div>
        </div>
      ),
    },
    {
      key: 'expectedDeliveryDate',
      header: 'Livraison Prévue',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-[#C59B27]" />
          <span>{new Date(item.expectedDeliveryDate).toLocaleDateString('fr-FR')}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions & Conversion',
      className: 'text-right no-print',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {canCreateReceipt && (
            <Link
              href={`/dashboard/purchases/receipts?fromBc=${encodeURIComponent(item.orderNumber)}`}
              title="Convertir en Bon de Réception (BR)"
              className="h-8 px-2.5 rounded-lg bg-[#FBF6E8] hover:bg-[#C59B27] text-[#9A7414] hover:text-white border border-[#E6D6A6] text-[11px] font-bold flex items-center gap-1 transition"
            >
              <span>Réception (BR)</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          <button
            type="button"
            title="Prévisualiser le Bon de Commande"
            onClick={() => setSelectedOrder(item)}
            className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#9A7414] hover:bg-[#FBF6E8] transition cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Modifier le Bon de Commande"
            onClick={() => openEditModal(item)}
            className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#9A7414] hover:bg-[#FBF6E8] transition cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Supprimer"
            onClick={() => setDeleteItem(item)}
            className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Bons de Commande Fournisseurs (Achat BC)
              </h1>
              <p className="text-xs text-slate-500">
                Chaîne connectée BC → Bon de Réception (BR) → Bon d&apos;Entrée Stock (BE) persistée en PostgreSQL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            <Button variant="gold" size="sm" onClick={openCreateModal}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Nouveau Bon de Commande</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Achats et approvisionnement', href: '/dashboard/suppliers' },
              { label: 'Bon de commande (BC)' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        enableMultiSelect={true}
        selectedKeys={selectedPoIds}
        onSelectionChange={setSelectedPoIds}
        onBulkDelete={(keys) => setBulkDeletePoIds(keys)}
        renderBulkActions={() => (
          <select
            value=""
            disabled={saving}
            onChange={(e) => {
              const st = e.target.value as PurchaseOrderItem['status'];
              if (st) handleBulkPoStatus(st);
            }}
            aria-label="Changer statut BC"
            className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
          >
            <option value="">Statut BC...</option>
            <option value="DRAFT">Brouillon</option>
            <option value="CONFIRMED">Confirmé Fournisseur</option>
            <option value="PARTIALLY_RECEIVED">Réception Partielle</option>
            <option value="COMPLETED">Réceptionné Total</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        )}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['orderNumber', 'supplierName', 'status']}
        exportFileName="commandes_achat_royal"
        printTitle="Bons de Commande Fournisseurs — Royal"
      />

      {/* Preview Document Modal (BC -> BR) */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Bon de Commande Fournisseur — ${selectedOrder?.orderNumber || ''}`}
        subtitle="Document officiel d'engagement d'achat Royal"
        type="details"
        size="5xl"
        footer={
          selectedOrder && (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Imprimer BC
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const target = selectedOrder;
                    setSelectedOrder(null);
                    openEditModal(target);
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  Modifier
                </Button>
                {canCreateReceipt && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      const ref = selectedOrder.orderNumber;
                      setSelectedOrder(null);
                      router.push(`/dashboard/purchases/receipts?fromBc=${encodeURIComponent(ref)}`);
                    }}
                  >
                    <Truck className="h-3.5 w-3.5 mr-1" />
                    Générer Bon de Réception (BR)
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Fermer
              </Button>
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="p-6 space-y-5 text-xs">
            <DocumentPrintHeader
              docCode="BC"
              docTitle="BON DE COMMANDE FOURNISSEUR"
              reference={selectedOrder.orderNumber}
              date={selectedOrder.createdAt}
              status={selectedOrder.status}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6]">
              <div>
                <div className="text-[10px] font-bold uppercase text-[#9A7414]">Fournisseur</div>
                <div className="font-black text-sm text-[#1D232E] mt-0.5">{selectedOrder.supplierName}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-[#9A7414]">Date Émission / Livraison</div>
                <div className="font-bold text-[#1D232E] mt-0.5">
                  Émis le {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')} • Prévue le{' '}
                  {new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div className="md:text-right">
                <div className="text-[10px] font-bold uppercase text-[#9A7414]">Statut Actuel</div>
                <div className="mt-1">
                  <Badge variant="warning" size="md">{STATUS_META[selectedOrder.status]?.label || selectedOrder.status}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6E1D6] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F5F7] border-b border-[#E6E1D6] text-[#1D232E] font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Désignation Article</th>
                    <th className="px-4 py-3 text-right">Qté</th>
                    <th className="px-4 py-3 text-right">PU HT</th>
                    <th className="px-4 py-3 text-right">TVA</th>
                    <th className="px-4 py-3 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedOrder.items || []).map((ln: any, idx: number) => {
                    const q = Number(ln.qty ?? ln.quantity ?? 0);
                    return (
                      <tr key={ln.id || idx}>
                        <td className="px-4 py-3 font-mono font-bold">{ln.sku}</td>
                        <td className="px-4 py-3 font-semibold text-[#1D232E]">{ln.name}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{q}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatTndCurrency(ln.unitPriceHt)}</td>
                        <td className="px-4 py-3 text-right font-mono">{ln.taxRate || 19}%</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{formatTndCurrency(q * Number(ln.unitPriceHt || 0))}</td>
                      </tr>
                    );
                  })}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        Lot global ({selectedOrder.itemsCount} unités commandées)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6]">
              <div className="text-slate-600">{selectedOrder.notes || 'Conditions standards Royal — Paiement selon accord fournisseur.'}</div>
              <div className="text-right space-y-1 shrink-0">
                <div className="text-slate-600 font-mono">Total HT : <strong>{formatTndCurrency(selectedOrder.totalHt)}</strong></div>
                <div className="text-lg font-black text-[#1D232E] font-mono">Total TTC : {formatTndCurrency(selectedOrder.totalTtc)}</div>
              </div>
            </div>
            <DocumentPrintFooter docCode="BC" reference={selectedOrder.orderNumber} />
          </div>
        )}
      </Modal>

      {/* Add / Edit Purchase Order Modal (5xl Light Luxury Gold & Silver) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? `Modifier Bon de Commande — ${editingOrder.orderNumber}` : 'Nouveau Bon de Commande Fournisseur (BC)'}
        subtitle="Renseignez le fournisseur, les lignes d'articles et les conditions de livraison"
        type={editingOrder ? 'edit' : 'create'}
        size="5xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs font-mono font-bold text-[#9A7414]">
              Total estimé : {formQtySum} unité(s) • TTC {formatTndCurrency(formTtc)}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button variant="gold" size="sm" isLoading={saving} onClick={handleSave}>
                {editingOrder ? 'Enregistrer BC' : 'Valider le Bon de Commande'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Fournisseur *"
              value={formSupplier}
              onChange={(e) => setFormSupplier(e.target.value)}
              options={Array.from(
                new Set([
                  formSupplier,
                  ...suppliers.map((s) => s.name),
                  'Comptoir Tunisien de l’Électroménager (CTE)',
                  'Distribution Moderne d’Électroménager (DME)',
                  'Société Beko Tunisie',
                ])
              )
                .filter(Boolean)
                .map((n) => ({ value: n, label: n }))}
            />
            <Input
              label="Date de livraison prévue"
              type="date"
              value={formExpectedDate}
              onChange={(e) => setFormExpectedDate(e.target.value)}
            />
            <Select
              label="Statut"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
              options={[
                { value: 'DRAFT', label: 'Brouillon' },
                { value: 'CONFIRMED', label: 'Confirmé Fournisseur' },
                { value: 'PARTIALLY_RECEIVED', label: 'Réception Partielle' },
                { value: 'COMPLETED', label: 'Réceptionné Total' },
                { value: 'CANCELLED', label: 'Annulé' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#1D232E]">Lignes Articles Commandés</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormLines((prev) => [
                    ...prev,
                    { id: `ln-${Date.now()}`, sku: `RYL-${prev.length + 10}`, name: 'Nouvel Article', qty: 5, unitPriceHt: 100, taxRate: 19 },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter Ligne</span>
              </Button>
            </div>
            {/* Mobile Stacked Cards (Zero squish & zero horizontal overflow) */}
            <div className="sm:hidden space-y-2.5">
              {formLines.map((ln, idx) => (
                <div key={ln.id} className="p-3 rounded-2xl border border-[#E6E1D6] bg-[#FBF9F4] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-[#9A7414]">Ligne #{idx + 1}</span>
                    {formLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormLines((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">SKU</label>
                      <input
                        value={ln.sku}
                        onChange={(e) => {
                          const next = [...formLines];
                          next[idx] = { ...next[idx], sku: e.target.value };
                          setFormLines(next);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E6E1D6] font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Qté</label>
                      <input
                        type="number"
                        min={1}
                        value={ln.qty}
                        onChange={(e) => {
                          const next = [...formLines];
                          next[idx] = { ...next[idx], qty: Number(e.target.value) || 1 };
                          setFormLines(next);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E6E1D6] font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Désignation</label>
                    <input
                      value={ln.name}
                      onChange={(e) => {
                        const next = [...formLines];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setFormLines(next);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E6E1D6] text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">PU HT (TND)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ln.unitPriceHt}
                        onChange={(e) => {
                          const next = [...formLines];
                          next[idx] = { ...next[idx], unitPriceHt: Number(e.target.value) || 0 };
                          setFormLines(next);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E6E1D6] font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">TVA %</label>
                      <input
                        type="number"
                        value={ln.taxRate}
                        onChange={(e) => {
                          const next = [...formLines];
                          next[idx] = { ...next[idx], taxRate: Number(e.target.value) || 0 };
                          setFormLines(next);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E6E1D6] font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block rounded-2xl border border-[#E6E1D6] overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FBF9F4] border-b border-[#E6E1D6] font-bold">
                  <tr>
                    <th className="px-3 py-2.5">SKU</th>
                    <th className="px-3 py-2.5">Désignation</th>
                    <th className="px-3 py-2.5 w-24">Qté</th>
                    <th className="px-3 py-2.5 w-32">PU HT (TND)</th>
                    <th className="px-3 py-2.5 w-20">TVA %</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formLines.map((ln, idx) => (
                    <tr key={ln.id}>
                      <td className="px-3 py-2">
                        <input
                          value={ln.sku}
                          onChange={(e) => {
                            const next = [...formLines];
                            next[idx] = { ...next[idx], sku: e.target.value };
                            setFormLines(next);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] border border-[#E6E1D6] font-mono text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={ln.name}
                          onChange={(e) => {
                            const next = [...formLines];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setFormLines(next);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] border border-[#E6E1D6] text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={ln.qty}
                          onChange={(e) => {
                            const next = [...formLines];
                            next[idx] = { ...next[idx], qty: Number(e.target.value) || 1 };
                            setFormLines(next);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] border border-[#E6E1D6] font-mono text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={ln.unitPriceHt}
                          onChange={(e) => {
                            const next = [...formLines];
                            next[idx] = { ...next[idx], unitPriceHt: Number(e.target.value) || 0 };
                            setFormLines(next);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] border border-[#E6E1D6] font-mono text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={ln.taxRate}
                          onChange={(e) => {
                            const next = [...formLines];
                            next[idx] = { ...next[idx], taxRate: Number(e.target.value) || 0 };
                            setFormLines(next);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] border border-[#E6E1D6] font-mono text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFormLines((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Input label="Remarques & Conditions" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Délai de paiement, port payé..." />
        </div>
      </Modal>

      {deleteItem && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteItem(null)}
          onConfirm={async () => {
            await persistOrders(
              orders.filter((o) => o.id !== deleteItem.id),
              `Bon de commande ${deleteItem.orderNumber} supprimé.`
            );
            setDeleteItem(null);
          }}
          title="Supprimer le bon de commande"
          message={`Êtes-vous certain de vouloir supprimer le bon de commande "${deleteItem.orderNumber}" ?`}
        />
      )}

      {bulkDeletePoIds.length > 0 && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setBulkDeletePoIds([])}
          onConfirm={confirmBulkDeletePos}
          isDeleting={saving}
          title="Supprimer les bons de commande sélectionnés"
          description={`Confirmez-vous la suppression des ${bulkDeletePoIds.length} bon(s) de commande sélectionné(s) ?`}
        />
      )}

      {toast && <Toast isOpen={true} message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement Bons de Commande...</div>}>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
