'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  Building2,
  Warehouse,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Edit3,
  Printer,
  RefreshCw,
} from 'lucide-react';
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

export interface ReceiptLineItem {
  id: string;
  sku: string;
  name: string;
  expectedQty: number;
  receivedQty: number;
}

export interface PurchaseReceiptItem {
  id: string;
  receiptNumber: string;
  purchaseOrderRef: string;
  supplierName: string;
  warehouseName: string;
  supplierDeliveryNoteNumber: string;
  receivedQuantity: number;
  expectedQuantity: number;
  discrepancyCount: number;
  status: 'PENDING_INSPECTION' | 'VERIFIED' | 'CONVERTED_TO_STOCK_IN';
  notes?: string;
  items?: ReceiptLineItem[];
  receivedAt: string;
}

function PurchaseReceiptsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sysDoc = useSystemDocumentConfig();
  const { isRouteVisible } = useRouteVisibility();
  const canCreateStockIn = isRouteVisible('/dashboard/stock-in');
  const [receipts, setReceipts] = React.useState<PurchaseReceiptItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingReceipt, setEditingReceipt] = React.useState<PurchaseReceiptItem | null>(null);
  const [selectedReceipt, setSelectedReceipt] = React.useState<PurchaseReceiptItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<PurchaseReceiptItem | null>(null);
  const [selectedReceiptIds, setSelectedReceiptIds] = React.useState<string[]>([]);
  const [bulkDeleteReceiptIds, setBulkDeleteReceiptIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [formBcRef, setFormBcRef] = React.useState('');
  const [formSupplier, setFormSupplier] = React.useState('Comptoir Tunisien de l’Électroménager (CTE)');
  const [formWarehouse, setFormWarehouse] = React.useState('Dépôt Central Sousse (Quai A)');
  const [formBlNumber, setFormBlNumber] = React.useState('');
  const [formStatus, setFormStatus] = React.useState<PurchaseReceiptItem['status']>('VERIFIED');
  const [formNotes, setFormNotes] = React.useState('');
  const [formLines, setFormLines] = React.useState<ReceiptLineItem[]>([
    { id: 'rln-1', sku: 'RYL-APP-01', name: 'Appareil Royal Réceptionné', expectedQty: 10, receivedQty: 10 },
  ]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [brRes, bcRes] = await Promise.all([
        fetchApi('/storefront-cms/sys-config/purchaseReceipts').catch(() => null),
        fetchApi('/storefront-cms/sys-config/purchaseOrders').catch(() => null),
      ]);
      const rawBr = brRes?.value ?? brRes?.data?.value ?? brRes?.data ?? brRes;
      const rawBc = bcRes?.value ?? bcRes?.data?.value ?? bcRes?.data ?? bcRes;
      setReceipts(Array.isArray(rawBr) ? rawBr : []);
      setPurchaseOrders(Array.isArray(rawBc) ? rawBc : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-prefill when coming from BC (?fromBc=BC-2026-0045)
  React.useEffect(() => {
    const fromBc = searchParams.get('fromBc');
    if (!fromBc || loading) return;
    const match = purchaseOrders.find((bc) => bc.orderNumber === fromBc);
    setEditingReceipt(null);
    setFormBcRef(fromBc);
    setFormSupplier(match?.supplierName || 'Comptoir Tunisien de l’Électroménager (CTE)');
    setFormWarehouse('Dépôt Central Sousse (Quai A)');
    setFormBlNumber(`BL-FOURN-${Date.now().toString().slice(-4)}`);
    setFormStatus('VERIFIED');
    setFormNotes(`Réception générée depuis le Bon de Commande ${fromBc}`);
    if (match?.items && Array.isArray(match.items) && match.items.length > 0) {
      setFormLines(
        match.items.map((it: any, idx: number) => ({
          id: `rln-${idx}-${Date.now()}`,
          sku: it.sku,
          name: it.name,
          expectedQty: Number(it.qty ?? it.quantity ?? 1),
          receivedQty: Number(it.qty ?? it.quantity ?? 1),
        }))
      );
    }
    setIsModalOpen(true);
  }, [searchParams, purchaseOrders, loading]);

  const persistReceipts = async (next: PurchaseReceiptItem[], msg: string) => {
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/purchaseReceipts', {
        method: 'PUT',
        body: JSON.stringify({ value: next }),
      });
      setReceipts(next);
      setToast({ msg, type: 'success' });
    } catch (e: any) {
      setToast({ msg: e?.message || 'Erreur lors de la sauvegarde PostgreSQL.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkReceiptStatus = async (status: PurchaseReceiptItem['status']) => {
    if (selectedReceiptIds.length === 0) return;
    const set = new Set(selectedReceiptIds);
    await persistReceipts(
      receipts.map((r) => (set.has(r.id) ? { ...r, status } : r)),
      `${selectedReceiptIds.length} bon(s) de réception passé(s) en ${status}.`
    );
    setSelectedReceiptIds([]);
  };

  const confirmBulkDeleteReceipts = async () => {
    if (bulkDeleteReceiptIds.length === 0) return;
    const set = new Set(bulkDeleteReceiptIds);
    await persistReceipts(
      receipts.filter((r) => !set.has(r.id)),
      `${bulkDeleteReceiptIds.length} bon(s) de réception supprimé(s).`
    );
    setBulkDeleteReceiptIds([]);
    setSelectedReceiptIds([]);
  };

  const openCreateModal = () => {
    setEditingReceipt(null);
    setFormBcRef(purchaseOrders[0]?.orderNumber || 'BC-2026-0045');
    setFormSupplier(purchaseOrders[0]?.supplierName || 'Comptoir Tunisien de l’Électroménager (CTE)');
    setFormWarehouse('Dépôt Central Sousse (Quai A)');
    setFormBlNumber(`BL-SUP-${Date.now().toString().slice(-4)}`);
    setFormStatus('PENDING_INSPECTION');
    setFormNotes('');
    setFormLines([{ id: `rln-${Date.now()}`, sku: 'RYL-APP-01', name: 'Lot Marchandise Quai', expectedQty: 12, receivedQty: 12 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (br: PurchaseReceiptItem) => {
    setEditingReceipt(br);
    setFormBcRef(br.purchaseOrderRef);
    setFormSupplier(br.supplierName);
    setFormWarehouse(br.warehouseName);
    setFormBlNumber(br.supplierDeliveryNoteNumber);
    setFormStatus(br.status);
    setFormNotes(br.notes || '');
    setFormLines(
      Array.isArray(br.items) && br.items.length > 0
        ? br.items
        : [{ id: `rln-${Date.now()}`, sku: 'RYL-LOT', name: `Réception ${br.purchaseOrderRef}`, expectedQty: br.expectedQuantity, receivedQty: br.receivedQuantity }]
    );
    setIsModalOpen(true);
  };

  const expectedSum = formLines.reduce((acc, l) => acc + l.expectedQty, 0);
  const receivedSum = formLines.reduce((acc, l) => acc + l.receivedQty, 0);
  const discrepancySum = Math.abs(expectedSum - receivedSum);

  const handleSave = async () => {
    if (!formBcRef.trim() || !formSupplier.trim()) return;
    if (editingReceipt) {
      const next = receipts.map((r) =>
        r.id === editingReceipt.id
          ? {
              ...r,
              purchaseOrderRef: formBcRef.trim(),
              supplierName: formSupplier.trim(),
              warehouseName: formWarehouse.trim(),
              supplierDeliveryNoteNumber: formBlNumber.trim(),
              expectedQuantity: expectedSum,
              receivedQuantity: receivedSum,
              discrepancyCount: discrepancySum,
              status: formStatus,
              notes: formNotes,
              items: formLines,
            }
          : r
      );
      await persistReceipts(next, `Bon de Réception ${editingReceipt.receiptNumber} mis à jour.`);
    } else {
      const newBr: PurchaseReceiptItem = {
        id: `br-${Date.now()}`,
        receiptNumber: sysDoc.generateNextRef('BR', receipts.length + 39),
        purchaseOrderRef: formBcRef.trim(),
        supplierName: formSupplier.trim(),
        warehouseName: formWarehouse.trim(),
        supplierDeliveryNoteNumber: formBlNumber.trim() || 'BL-NON-RENSEIGNE',
        expectedQuantity: expectedSum,
        receivedQuantity: receivedSum,
        discrepancyCount: discrepancySum,
        status: formStatus,
        notes: formNotes,
        items: formLines,
        receivedAt: new Date().toISOString(),
      };
      await persistReceipts([newBr, ...receipts], `Bon de Réception ${newBr.receiptNumber} enregistré.`);
    }
    setIsModalOpen(false);
  };

  const columns: ColumnDef<PurchaseReceiptItem>[] = [
    {
      key: 'receiptNumber',
      header: 'N° Bon de Réception',
      sortable: true,
      render: (item) => <span className="text-xs font-bold text-[#1D232E] font-mono">{item.receiptNumber}</span>,
    },
    {
      key: 'status',
      header: 'Statut Contrôle Quai',
      sortable: true,
      render: (item) => {
        switch (item.status) {
          case 'VERIFIED':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                <span>Conforme &amp; Vérifié</span>
              </span>
            );
          case 'CONVERTED_TO_STOCK_IN':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <FileCheck className="h-3 w-3" />
                <span>Intégré en Stock (BE)</span>
              </span>
            );
          default:
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="h-3 w-3" />
                <span>En Contrôle Quai</span>
              </span>
            );
        }
      },
    },
    {
      key: 'purchaseOrderRef',
      header: 'Réf. BC & BL Fournisseur',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5 font-mono text-xs">
          <div className="font-bold text-[#9A7414]">{item.purchaseOrderRef}</div>
          <div className="text-[11px] text-slate-500">{item.supplierDeliveryNoteNumber}</div>
        </div>
      ),
    },
    {
      key: 'supplierName',
      header: 'Fournisseur & Dépôt',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#1D232E] flex items-center gap-1">
            <Building2 className="h-3 w-3 text-[#C59B27]" />
            <span className="truncate max-w-[220px]">{item.supplierName}</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Warehouse className="h-3 w-3 text-[#C59B27]" />
            <span>{item.warehouseName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'receivedQuantity',
      header: 'Quantités (Reçu / Attendu)',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-[#1D232E] font-mono">
            {item.receivedQuantity} / {item.expectedQuantity} unités
          </div>
          {item.discrepancyCount > 0 && (
            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>{item.discrepancyCount} écart constaté</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions & Stock (BE)',
      className: 'text-right no-print',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {canCreateStockIn && (
            <Link
              href={`/dashboard/stock-in?fromBr=${encodeURIComponent(item.receiptNumber)}`}
              title="Convertir en Bon d’Entrée Stock (BE)"
              className="h-8 px-2.5 rounded-lg bg-[var(--royal-primary)] hover:opacity-90 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
            >
              <span>Créer BE</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          <button
            type="button"
            title="Consulter le Bon de Réception"
            onClick={() => setSelectedReceipt(item)}
            className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#9A7414] hover:bg-[#FBF6E8] transition cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Modifier le BR"
            onClick={() => openEditModal(item)}
            className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#9A7414] hover:bg-[#FBF6E8] transition cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Supprimer la réception"
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
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Bons de Réception Quai (Achat BR)
              </h1>
              <p className="text-xs text-slate-500">
                Pointage des livraisons depuis les Bons de Commande (BC), gestion des écarts et bascule en Bon d&apos;Entrée Stock (BE).
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
              <span>Nouveau Bon de Réception</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Achats et approvisionnement', href: '/dashboard/suppliers' },
              { label: 'Bon de réception (BR)' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={receipts}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        enableMultiSelect={true}
        selectedKeys={selectedReceiptIds}
        onSelectionChange={setSelectedReceiptIds}
        onBulkDelete={(keys) => setBulkDeleteReceiptIds(keys)}
        renderBulkActions={() => (
          <select
            value=""
            disabled={saving}
            onChange={(e) => {
              const st = e.target.value as PurchaseReceiptItem['status'];
              if (st) handleBulkReceiptStatus(st);
            }}
            aria-label="Changer statut BR"
            className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
          >
            <option value="">Statut BR...</option>
            <option value="PENDING_INSPECTION">Contrôle Quai en attente</option>
            <option value="VERIFIED">Vérifié / Conforme</option>
            <option value="CONVERTED_TO_STOCK_IN">Converti en Bon d&apos;Entrée</option>
          </select>
        )}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['receiptNumber', 'purchaseOrderRef', 'supplierName', 'supplierDeliveryNoteNumber']}
        exportFileName="receptions_achat_royal"
        printTitle="Bons de Réception Quai — Royal"
      />

      {/* Preview BR Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title={`Bon de Réception Quai — ${selectedReceipt?.receiptNumber || ''}`}
        subtitle={`Origine BC : ${selectedReceipt?.purchaseOrderRef || '—'} • BL Fournisseur : ${selectedReceipt?.supplierDeliveryNoteNumber || '—'}`}
        type="details"
        size="5xl"
        footer={
          selectedReceipt && (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Imprimer BR
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const target = selectedReceipt;
                    setSelectedReceipt(null);
                    openEditModal(target);
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  Modifier Pointage
                </Button>
                {canCreateStockIn && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      const ref = selectedReceipt.receiptNumber;
                      setSelectedReceipt(null);
                      router.push(`/dashboard/stock-in?fromBr=${encodeURIComponent(ref)}`);
                    }}
                  >
                    <FileCheck className="h-3.5 w-3.5 mr-1" />
                    Convertir en Bon d&apos;Entrée Stock (BE)
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(null)}>
                Fermer
              </Button>
            </div>
          )
        }
      >
        {selectedReceipt && (
          <div className="p-6 space-y-5 text-xs">
            <DocumentPrintHeader
              docCode="BR"
              docTitle="BON DE RÉCEPTION FOURNISSEUR"
              reference={selectedReceipt.receiptNumber}
              date={selectedReceipt.receivedAt}
              status={selectedReceipt.status}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6]">
              <div>
                <div className="text-[10px] font-bold uppercase text-[#9A7414]">Fournisseur</div>
                <div className="font-black text-sm text-[#1D232E] mt-0.5">{selectedReceipt.supplierName}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-[#9A7414]">Entrepôt Quai &amp; Date</div>
                <div className="font-bold text-[#1D232E] mt-0.5">
                  {selectedReceipt.warehouseName} • {new Date(selectedReceipt.receivedAt).toLocaleString('fr-FR')}
                </div>
              </div>
              <div className="md:text-right">
                <div className="text-[10px] font-bold uppercase text-[#9A7414]">Conformité Quantités</div>
                <div className="font-black font-mono text-sm mt-0.5 text-[#1D232E]">
                  {selectedReceipt.receivedQuantity} / {selectedReceipt.expectedQuantity} unités
                  {selectedReceipt.discrepancyCount > 0 && (
                    <span className="text-rose-600 ml-2">({selectedReceipt.discrepancyCount} écart)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6E1D6] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F5F7] border-b border-[#E6E1D6] text-[#1D232E] font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Désignation</th>
                    <th className="px-4 py-3 text-right">Qté Attendue</th>
                    <th className="px-4 py-3 text-right">Qté Reçue</th>
                    <th className="px-4 py-3 text-right">Écart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedReceipt.items || []).map((ln) => {
                    const diff = ln.receivedQty - ln.expectedQty;
                    return (
                      <tr key={ln.id}>
                        <td className="px-4 py-3 font-mono font-bold">{ln.sku}</td>
                        <td className="px-4 py-3 font-semibold">{ln.name}</td>
                        <td className="px-4 py-3 text-right font-mono">{ln.expectedQty}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{ln.receivedQty}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${diff !== 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {diff === 0 ? 'Conforme' : diff}
                        </td>
                      </tr>
                    );
                  })}
                  {(!selectedReceipt.items || selectedReceipt.items.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        Lot global contrôlé sur quai ({selectedReceipt.receivedQuantity} reçus / {selectedReceipt.expectedQuantity} attendus)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <DocumentPrintFooter docCode="BR" reference={selectedReceipt.receiptNumber} />
          </div>
        )}
      </Modal>

      {/* Create / Edit BR Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReceipt ? `Modifier Bon de Réception — ${editingReceipt.receiptNumber}` : 'Nouveau Bon de Réception Quai (BR)'}
        subtitle="Pointage physique à l'arrivée fournisseur et détection automatique des écarts"
        type={editingReceipt ? 'edit' : 'create'}
        size="5xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs font-mono font-bold text-[#9A7414]">
              Total pointé : {receivedSum} / {expectedSum} unité(s) {discrepancySum > 0 ? `• ${discrepancySum} écart détecté` : '• 100% Conforme'}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button variant="gold" size="sm" isLoading={saving} onClick={handleSave}>
                {editingReceipt ? 'Enregistrer Pointage' : 'Valider le Bon de Réception'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input label="Réf. Bon de Commande (BC)" value={formBcRef} onChange={(e) => setFormBcRef(e.target.value)} />
            <Input label="N° BL Fournisseur" value={formBlNumber} onChange={(e) => setFormBlNumber(e.target.value)} />
            <Input label="Fournisseur" value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)} />
            <Select
              label="Statut Contrôle"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
              options={[
                { value: 'PENDING_INSPECTION', label: 'En Contrôle Quai' },
                { value: 'VERIFIED', label: 'Conforme & Vérifié' },
                { value: 'CONVERTED_TO_STOCK_IN', label: 'Intégré en Stock (BE)' },
              ]}
            />
          </div>

          <Input label="Entrepôt / Quai de Réception" value={formWarehouse} onChange={(e) => setFormWarehouse(e.target.value)} />

          <div className="rounded-2xl border border-[#E6E1D6] overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FBF9F4] border-b border-[#E6E1D6] font-bold">
                <tr>
                  <th className="px-3 py-2.5">SKU</th>
                  <th className="px-3 py-2.5">Désignation</th>
                  <th className="px-3 py-2.5 w-28">Attendue</th>
                  <th className="px-3 py-2.5 w-28">Reçue</th>
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
                        value={ln.expectedQty}
                        onChange={(e) => {
                          const next = [...formLines];
                          next[idx] = { ...next[idx], expectedQty: Number(e.target.value) || 0 };
                          setFormLines(next);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] border border-[#E6E1D6] font-mono text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={ln.receivedQty}
                        onChange={(e) => {
                          const next = [...formLines];
                          next[idx] = { ...next[idx], receivedQty: Number(e.target.value) || 0 };
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
      </Modal>

      {deleteItem && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteItem(null)}
          onConfirm={async () => {
            await persistReceipts(
              receipts.filter((r) => r.id !== deleteItem.id),
              `Bon de Réception ${deleteItem.receiptNumber} supprimé.`
            );
            setDeleteItem(null);
          }}
          title="Supprimer le bon de réception"
          message={`Êtes-vous certain de vouloir supprimer le bon de réception "${deleteItem.receiptNumber}" ?`}
        />
      )}

      {bulkDeleteReceiptIds.length > 0 && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setBulkDeleteReceiptIds([])}
          onConfirm={confirmBulkDeleteReceipts}
          isDeleting={saving}
          title="Supprimer les bons de réception sélectionnés"
          description={`Confirmez-vous la suppression des ${bulkDeleteReceiptIds.length} bon(s) de réception sélectionné(s) ?`}
        />
      )}

      {toast && <Toast isOpen={true} message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function PurchaseReceiptsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement Bons de Réception...</div>}>
      <PurchaseReceiptsContent />
    </Suspense>
  );
}
