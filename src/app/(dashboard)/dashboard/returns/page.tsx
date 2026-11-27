'use client';

import * as React from 'react';
import {
  Undo2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Warehouse,
  ShoppingBag,
  Ticket,
  AlertTriangle,
  Printer,
} from 'lucide-react';
import { formatTndCurrency } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import { useSystemDocumentConfig } from '@/hooks/useSystemDocumentConfig';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';
import {
  DataTable,
  ColumnDef,
  Button,
  Badge,
  Modal,
  DeleteConfirmModal,
  Input,
  Select,
  Textarea,
  Breadcrumb,
  Toast,
} from '@/components/ui';

interface ReturnOrderItem {
  id: string;
  returnNumber: string; // ex: RET-2026-0012
  deliveryNumber: string; // ex: LIV-2026-0042
  orderNumber: string; // ex: CMD-2026-0042
  customerName: string;
  reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CHANGE_OF_MIND' | 'DAMAGED_IN_TRANSIT';
  action: 'CREDIT_NOTE' | 'VOUCHER' | 'EXCHANGE' | 'REFUND'; // Avoir, Bon d'achat, Échange
  refundAmount: number;
  warehouseDestination: string; // Entrepôt de réintégration
  status: 'PENDING_APPROVAL' | 'INSPECTED' | 'RESTOCKED' | 'REJECTED';
  createdAt: string;
}

export default function ReturnsPage() {
  const sysDoc = useSystemDocumentConfig();
  const [returns, setReturns] = React.useState<ReturnOrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedReturn, setSelectedReturn] = React.useState<ReturnOrderItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<ReturnOrderItem | null>(null);
  const [selectedReturnIds, setSelectedReturnIds] = React.useState<string[]>([]);
  const [bulkDeleteIds, setBulkDeleteIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // New Return form
  const [newDeliveryRef, setNewDeliveryRef] = React.useState('');
  const [newOrderRef, setNewOrderRef] = React.useState('');
  const [newCustomer, setNewCustomer] = React.useState('');
  const [newAmount, setNewAmount] = React.useState('');
  const [newReason, setNewReason] = React.useState<ReturnOrderItem['reason']>('DEFECTIVE');
  const [newAction, setNewAction] = React.useState<ReturnOrderItem['action']>('VOUCHER');

  const loadReturns = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/customerReturns');
      const list = res?.value || res?.data?.value || [];
      setReturns(Array.isArray(list) ? list : []);
    } catch {
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const persistReturns = async (next: ReturnOrderItem[], successMsg?: string): Promise<boolean> => {
    const previous = returns;
    setReturns(next);
    try {
      await fetchApi('/storefront-cms/sys-config/customerReturns', {
        method: 'PUT',
        body: JSON.stringify({ value: next }),
      });
      if (successMsg) setToast({ msg: successMsg, type: 'success' });
      return true;
    } catch (err: any) {
      setReturns(previous);
      setToast({ msg: err?.message || 'Erreur lors de la sauvegarde des retours.', type: 'error' });
      return false;
    }
  };

  const handleCreate = async () => {
    if (!newCustomer.trim() || !newAmount) return;
    const item: ReturnOrderItem = {
      id: `ret-${Date.now()}`,
      returnNumber: sysDoc.generateNextRef('RET', returns.length + 1),
      deliveryNumber: newDeliveryRef,
      orderNumber: newOrderRef,
      customerName: newCustomer,
      reason: newReason,
      action: newAction,
      refundAmount: Number(newAmount) || 0,
      warehouseDestination: 'Entrepôt Central Principal',
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
    };
    const ok = await persistReturns([item, ...returns], `Bon de retour ${item.returnNumber} enregistré.`);
    if (ok) {
      setIsModalOpen(false);
      setNewCustomer('');
      setNewAmount('');
    }
  };

  const handleRestockReturn = async (ret: any) => {
    try {
      const retItems = Array.isArray(ret.items) ? ret.items.filter((it: any) => it?.sku || it?.productId) : [];
      if (retItems.length > 0) {
        await fetchApi('/storefront-cms/stock-lifecycle/apply', {
          method: 'POST',
          body: JSON.stringify({
            docType: 'RET',
            docReference: ret.returnNumber,
            restore: false,
            items: retItems,
          }),
        });
      }
      const updated = { ...ret, status: 'RESTOCKED' as const, stockRestored: true };
      const ok = await persistReturns(
        returns.map((r) => (r.id === ret.id ? updated : r)),
        `Retour ${ret.returnNumber} réintégré en stock.`
      );
      if (ok) setSelectedReturn(updated);
    } catch (err: any) {
      setToast({ msg: err?.message || 'Impossible de réintégrer ce retour en stock.', type: 'error' });
    }
  };

  const handleBulkReturnStatus = async (status: ReturnOrderItem['status']) => {
    if (selectedReturnIds.length === 0) return;
    const set = new Set(selectedReturnIds);
    await persistReturns(returns.map((r) => (set.has(r.id) ? { ...r, status } : r)));
    setSelectedReturnIds([]);
  };

  const handleBulkReturnAction = async (action: ReturnOrderItem['action']) => {
    if (selectedReturnIds.length === 0) return;
    const set = new Set(selectedReturnIds);
    await persistReturns(returns.map((r) => (set.has(r.id) ? { ...r, action } : r)));
    setSelectedReturnIds([]);
  };

  const handleConfirmBulkDeleteReturns = async () => {
    if (bulkDeleteIds.length === 0) return;
    const set = new Set(bulkDeleteIds);
    await persistReturns(returns.filter((r) => !set.has(r.id)));
    setBulkDeleteIds([]);
    setSelectedReturnIds([]);
  };

  const columns: ColumnDef<ReturnOrderItem>[] = [
    {
      key: 'returnNumber',
      header: 'N° Bon de Retour',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-bold text-neutral-900 font-mono">
          {item.returnNumber}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut SAV',
      sortable: true,
      render: (item) => {
        switch (item.status) {
          case 'RESTOCKED':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                <span>Réintégré en Stock</span>
              </span>
            );
          case 'INSPECTED':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <Clock className="h-3 w-3" />
                <span>Expertise Conforme</span>
              </span>
            );
          default:
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="h-3 w-3" />
                <span>En attente d’accord</span>
              </span>
            );
        }
      },
    },
    {
      key: 'orderNumber',
      header: 'Origine (BL & Commande)',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5 font-mono text-xs">
          <div className="font-bold text-neutral-900">{item.deliveryNumber}</div>
          <div className="text-[11px] text-neutral-500">Cmd : {item.orderNumber}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Client & Motif',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-neutral-900">{item.customerName}</div>
          <Badge variant="outline" className="text-[10px] text-neutral-600">
            {item.reason === 'DEFECTIVE'
              ? 'Défaut Technique SAV'
              : item.reason === 'CUSTOMER_CHANGE_OF_MIND'
              ? 'Rétractation Client'
              : 'Endommagé Transport'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Compensation',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-neutral-900 font-mono">
            {formatTndCurrency(item.refundAmount)}
          </span>
          <div className="text-[10px] uppercase font-bold text-amber-700">
            {item.action === 'VOUCHER'
              ? 'Bon d’Achat'
              : item.action === 'CREDIT_NOTE'
              ? 'Avoir Comptable'
              : 'Échange Standard'}
          </div>
        </div>
      ),
    },
    {
      key: 'warehouseDestination',
      header: 'Dépôt Réintégration',
      render: (item) => (
        <div className="flex items-center gap-1 text-xs text-neutral-600">
          <Warehouse className="h-3.5 w-3.5 text-neutral-400" />
          <span>{item.warehouseDestination}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            title="Consulter le Bon de Retour"
            onClick={() => setSelectedReturn(item)}
            className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Supprimer le bon"
            onClick={() => setDeleteItem(item)}
            className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
              <Undo2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
                Bons de Retour &amp; SAV
              </h1>
              <p className="text-xs text-neutral-500">
                Traçabilité des retours clients, réintégration de stock et génération d&apos;avoirs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="gold"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Nouveau Bon de Retour</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Ventes et distribution', href: '/dashboard/orders' },
              { label: 'Bon de retour' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={returns}
        isLoading={loading}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedReturnIds}
        onSelectionChange={setSelectedReturnIds}
        onBulkDelete={(keys) => setBulkDeleteIds(keys)}
        renderBulkActions={() => (
          <>
            <select
              value=""
              onChange={(e) => {
                const st = e.target.value as ReturnOrderItem['status'];
                if (st) handleBulkReturnStatus(st);
              }}
              aria-label="Changer statut SAV"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Statut SAV...</option>
              <option value="PENDING_APPROVAL">En attente d&apos;accord</option>
              <option value="INSPECTED">Expertise Conforme</option>
              <option value="RESTOCKED">Réintégré en Stock</option>
              <option value="REJECTED">Rejeté</option>
            </select>
            <select
              value=""
              onChange={(e) => {
                const act = e.target.value as ReturnOrderItem['action'];
                if (act) handleBulkReturnAction(act);
              }}
              aria-label="Changer type compensation"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Type action...</option>
              <option value="VOUCHER">Bon d&apos;achat</option>
              <option value="CREDIT_NOTE">Avoir</option>
              <option value="EXCHANGE">Échange</option>
              <option value="REFUND">Remboursement</option>
            </select>
          </>
        )}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['returnNumber', 'deliveryNumber', 'orderNumber', 'customerName']}
        exportFileName="bons_retour_royal"
        printTitle="Bons de Retour Royal"
      />

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Créer un Bon de Retour (SAV)"
        type="create"
        size="xl"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleCreate}
              disabled={!newCustomer.trim() || !newAmount}
            >
              <span>Émettre le Bon de Retour</span>
            </Button>
          </div>
        }
      >
        <div className="p-6 pb-20 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Réf. Bon de Livraison"
              value={newDeliveryRef}
              onChange={(e) => setNewDeliveryRef(e.target.value)}
              placeholder="LIV-2026-0042"
            />
            <Input
              label="Réf. Commande"
              value={newOrderRef}
              onChange={(e) => setNewOrderRef(e.target.value)}
              placeholder="CMD-2026-0042"
            />
          </div>

          <Input
            label="Nom du Client"
            value={newCustomer}
            onChange={(e) => setNewCustomer(e.target.value)}
            placeholder="Ex: Moncef Ben Ali"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Motif du retour"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value as any)}
              options={[
                { value: 'DEFECTIVE', label: 'Panne / Défaut SAV' },
                { value: 'CUSTOMER_CHANGE_OF_MIND', label: 'Rétractation Client' },
                { value: 'DAMAGED_IN_TRANSIT', label: 'Avarié Transport' },
              ]}
            />
            <Select
              label="Mode de compensation"
              value={newAction}
              onChange={(e) => setNewAction(e.target.value as any)}
              options={[
                { value: 'VOUCHER', label: 'Bon d’Achat (Code Promo)' },
                { value: 'CREDIT_NOTE', label: 'Avoir Comptable Légal' },
                { value: 'EXCHANGE', label: 'Échange Produit Standard' },
              ]}
            />
          </div>

          <Input
            label="Montant à compenser (TND)"
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="850"
          />
        </div>
      </Modal>

      {/* Preview Bon de Retour Modal (4xl + Print inside Preview) */}
      <Modal
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title={`Bon de Retour SAV — ${selectedReturn?.returnNumber || ''}`}
        subtitle={`Origine BL : ${selectedReturn?.deliveryNumber || '—'} • Commande : ${selectedReturn?.orderNumber || '—'}`}
        type="details"
        size="4xl"
        footer={
          selectedReturn && (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                <span>Imprimer le Bon de Retour</span>
              </Button>
              <div className="flex items-center gap-2">
                {selectedReturn.status !== 'RESTOCKED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRestockReturn(selectedReturn)}
                    className="bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    Valider &amp; Réintégrer Stock (+)
                  </Button>
                )}
                <Button variant="gold" size="sm" onClick={() => setSelectedReturn(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )
        }
      >
        {selectedReturn && (
          <div className="p-6 space-y-5 text-xs">
            <DocumentPrintHeader
              docCode="RET"
              docTitle="Bon de Retour SAV"
              reference={selectedReturn.returnNumber}
              date={selectedReturn.createdAt}
              status={selectedReturn.status}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6]">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#9A7414] block">Client</span>
                <span className="font-black text-sm text-[#1D232E]">{selectedReturn.customerName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#9A7414] block">Dépôt Réintégration</span>
                <span className="font-bold text-[#1D232E]">{selectedReturn.warehouseDestination}</span>
              </div>
              <div className="md:text-right">
                <span className="text-[10px] font-bold uppercase text-[#9A7414] block">Montant Compensé</span>
                <span className="font-black font-mono text-base text-[#1D232E]">{formatTndCurrency(selectedReturn.refundAmount)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E6E1D6]">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Motif SAV</span>
                <span className="font-bold text-[#1D232E]">{selectedReturn.reason}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E6E1D6]">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Compensation Choisie</span>
                <span className="font-bold text-[#9A7414]">{selectedReturn.action}</span>
              </div>
            </div>
            <DocumentPrintFooter docCode="RET" reference={selectedReturn.returnNumber} />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteItem(null)}
          onConfirm={async () => {
            await persistReturns(returns.filter((r) => r.id !== deleteItem.id));
            setDeleteItem(null);
          }}
          title="Supprimer le bon de retour"
          message={`Êtes-vous certain de vouloir supprimer le bon de retour "${deleteItem.returnNumber}" ?`}
        />
      )}
      {bulkDeleteIds.length > 0 && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setBulkDeleteIds([])}
          onConfirm={handleConfirmBulkDeleteReturns}
          title="Supprimer les bons de retour sélectionnés"
          message={`Confirmez-vous la suppression des ${bulkDeleteIds.length} bon(s) de retour sélectionné(s) ?`}
        />
      )}
      <Toast
        isOpen={!!toast}
        message={toast?.msg || ''}
        type={toast?.type === 'error' ? 'error' : 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
