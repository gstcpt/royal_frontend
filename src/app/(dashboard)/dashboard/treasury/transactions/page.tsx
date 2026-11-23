'use client';

import * as React from 'react';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Plus,
  Eye,
  Printer,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';
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

interface TreasuryTransaction {
  id: string;
  reference: string;
  type: 'INFLOW' | 'OUTFLOW';
  method: 'CASH' | 'CHECK' | 'CARD' | 'TRANSFER' | 'BILL';
  amount: number;
  label: string;
  account: string;
  operator: string;
  createdAt: string;
}

const METHOD_LABELS: Record<TreasuryTransaction['method'], string> = {
  CARD: 'Carte / TPE',
  CASH: 'Espèces',
  CHECK: 'Chèque',
  TRANSFER: 'Virement',
  BILL: 'Traite',
};

export default function TreasuryTransactionsPage() {
  const [transactions, setTransactions] = React.useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [previewItem, setPreviewItem] = React.useState<TreasuryTransaction | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<TreasuryTransaction | null>(null);
  const [selectedTxIds, setSelectedTxIds] = React.useState<string[]>([]);
  const [bulkDeleteTxIds, setBulkDeleteTxIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [newType, setNewType] = React.useState<'INFLOW' | 'OUTFLOW'>('INFLOW');
  const [newMethod, setNewMethod] = React.useState<TreasuryTransaction['method']>('CASH');
  const [newAmount, setNewAmount] = React.useState('');
  const [newLabel, setNewLabel] = React.useState('');
  const [newAccount, setNewAccount] = React.useState('Caisse Principale Lac 2');
  const [newOperator, setNewOperator] = React.useState('Administrateur Royal');

  const loadTransactions = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/treasuryTransactions');
      const raw = res?.value ?? res?.data?.value ?? res?.data ?? res;
      setTransactions(Array.isArray(raw) ? raw : []);
    } catch {
      setToast({ msg: 'Impossible de charger le journal des transactions.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const persistTransactions = async (next: TreasuryTransaction[], successMsg: string) => {
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/treasuryTransactions', {
        method: 'PUT',
        body: JSON.stringify({ value: next }),
      });
      setTransactions(next);
      setToast({ msg: successMsg, type: 'success' });
    } catch (err: any) {
      setToast({ msg: err?.message || 'Erreur lors de la sauvegarde en base PostgreSQL.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const parsedAmount = Number(newAmount);
    if (!newLabel.trim() || !parsedAmount || parsedAmount <= 0) return;

    const item: TreasuryTransaction = {
      id: `tx-${Date.now()}`,
      reference: `TX-${new Date().getFullYear()}-${String(transactions.length + 892).padStart(4, '0')}`,
      type: newType,
      method: newMethod,
      amount: parsedAmount,
      label: newLabel.trim(),
      account: newAccount.trim() || 'Caisse Principale Lac 2',
      operator: newOperator.trim() || 'Administrateur Royal',
      createdAt: new Date().toISOString(),
    };

    await persistTransactions([item, ...transactions], 'Transaction enregistrée dans le journal de trésorerie.');
    setIsAddModalOpen(false);
    setNewAmount('');
    setNewLabel('');
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const next = transactions.filter((t) => t.id !== deleteItem.id);
    setDeleteItem(null);
    await persistTransactions(next, 'Mouvement supprimé du journal.');
  };

  const handleBulkTxPatch = async (patch: Partial<TreasuryTransaction>, label: string) => {
    if (selectedTxIds.length === 0) return;
    const idSet = new Set(selectedTxIds);
    const next = transactions.map((t) => (idSet.has(t.id) ? { ...t, ...patch } : t));
    await persistTransactions(next, `${selectedTxIds.length} mouvement(s) ${label}.`);
    setSelectedTxIds([]);
  };

  const confirmBulkDeleteTxs = async () => {
    if (bulkDeleteTxIds.length === 0) return;
    const idSet = new Set(bulkDeleteTxIds);
    const next = transactions.filter((t) => !idSet.has(t.id));
    setBulkDeleteTxIds([]);
    setSelectedTxIds([]);
    await persistTransactions(next, `${idSet.size} mouvement(s) supprimé(s) du journal.`);
  };

  const totalInflow = transactions
    .filter((t) => t.type === 'INFLOW')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalOutflow = transactions
    .filter((t) => t.type === 'OUTFLOW')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const columns: ColumnDef<TreasuryTransaction>[] = [
    {
      key: 'reference',
      header: 'Réf. Mouvement',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-bold text-neutral-900 font-mono">
          {item.reference}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Sens de Flux',
      sortable: true,
      render: (item) =>
        item.type === 'INFLOW' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
            <span>Encaissement (+)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <ArrowUpRight className="h-3 w-3 text-rose-600" />
            <span>Décaissement (-)</span>
          </span>
        ),
    },
    {
      key: 'label',
      header: 'Motif & Libellé',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-neutral-900">{item.label}</div>
          <div className="text-[11px] text-neutral-500 font-mono">Compte : {item.account}</div>
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Mode',
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="text-[10px] uppercase font-bold text-neutral-700">
          {METHOD_LABELS[item.method] || item.method}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Montant (TND)',
      sortable: true,
      render: (item) => (
        <span
          className={cn(
            'text-xs font-black font-mono',
            item.type === 'INFLOW' ? 'text-emerald-700' : 'text-neutral-900'
          )}
        >
          {item.type === 'INFLOW' ? '+' : '-'} {formatTndCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: 'operator',
      header: 'Opérateur',
      render: (item) => (
        <span className="text-xs text-neutral-600 font-medium">{item.operator}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Horodatage',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
          <Clock className="h-3 w-3 text-neutral-400" />
          <span>{new Date(item.createdAt).toLocaleString('fr-FR')}</span>
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
            title="Aperçu & Impression du Justificatif"
            onClick={() => setPreviewItem(item)}
            className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-[#8C6400] hover:border-[#E6D6A6] hover:bg-[#FBF6E8] transition-colors cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Supprimer la ligne"
            onClick={() => setDeleteItem(item)}
            className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast
        isOpen={!!toast}
        message={toast?.msg || ''}
        type={toast?.type === 'error' ? 'error' : 'success'}
        onClose={() => setToast(null)}
      />

      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
                Journal des Transactions de Trésorerie
              </h1>
              <p className="text-xs text-neutral-500">
                Enregistrement chronologique et persistant de tous les flux financiers (caisses et banques).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadTransactions}
              disabled={loading}
              className="text-xs"
              title="Actualiser"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Nouvelle Transaction</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#FBF6E8]/70 border border-[#E6D6A6] flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">Total Encaissements</span>
            <span className="text-sm font-black font-mono text-emerald-700">
              + {formatTndCurrency(totalInflow)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">Total Décaissements</span>
            <span className="text-sm font-black font-mono text-rose-700">
              - {formatTndCurrency(totalOutflow)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">Solde Net Période</span>
            <span className="text-sm font-black font-mono text-neutral-900">
              {formatTndCurrency(totalInflow - totalOutflow)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Trésorerie', href: '/dashboard/treasury' },
              { label: 'Journal' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={transactions}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        enableMultiSelect={true}
        selectedKeys={selectedTxIds}
        onSelectionChange={setSelectedTxIds}
        onBulkDelete={(keys) => setBulkDeleteTxIds(keys)}
        renderBulkActions={() => (
          <>
            <select
              value=""
              disabled={saving}
              onChange={(e) => {
                const tp = e.target.value as TreasuryTransaction['type'];
                if (tp) handleBulkTxPatch({ type: tp }, tp === 'INFLOW' ? 'passé(s) en Encaissement' : 'passé(s) en Décaissement');
              }}
              aria-label="Changer sens flux"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Type flux...</option>
              <option value="INFLOW">Encaissement (+ Entrée)</option>
              <option value="OUTFLOW">Décaissement (- Sortie)</option>
            </select>
            <select
              value=""
              disabled={saving}
              onChange={(e) => {
                const m = e.target.value as TreasuryTransaction['method'];
                if (m) handleBulkTxPatch({ method: m }, `passé(s) en mode ${METHOD_LABELS[m]}`);
              }}
              aria-label="Changer mode règlement"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Mode règlement...</option>
              <option value="CASH">Espèces</option>
              <option value="CARD">Carte / TPE</option>
              <option value="CHECK">Chèque</option>
              <option value="TRANSFER">Virement</option>
              <option value="BILL">Traite</option>
            </select>
          </>
        )}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['reference', 'label', 'account', 'operator']}
        exportFileName="transactions_tresorerie_royal"
        printTitle="Journal des Transactions de Trésorerie Royal"
      />

      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Enregistrer un Mouvement de Trésorerie"
          size="4xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handleCreate}
                disabled={saving || !newLabel.trim() || !newAmount || Number(newAmount) <= 0}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer le Mouvement'}
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Sens de Flux"
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'INFLOW' | 'OUTFLOW')}
                options={[
                  { value: 'INFLOW', label: 'Encaissement (+ Entrée)' },
                  { value: 'OUTFLOW', label: 'Décaissement (- Sortie)' },
                ]}
              />
              <Select
                label="Mode de Paiement"
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value as TreasuryTransaction['method'])}
                options={[
                  { value: 'CASH', label: 'Espèces' },
                  { value: 'CARD', label: 'Carte Bancaire / TPE' },
                  { value: 'CHECK', label: 'Chèque' },
                  { value: 'TRANSFER', label: 'Virement Bancaire' },
                  { value: 'BILL', label: 'Traite' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Montant (TND)"
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="Ex: 1450"
              />
              <Input
                label="Compte / Caisse"
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                placeholder="Ex: Caisse Principale Lac 2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Motif & Libellé de l'opération"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Règlement commande #CMD-2026-0098"
              />
              <Input
                label="Opérateur"
                value={newOperator}
                onChange={(e) => setNewOperator(e.target.value)}
                placeholder="Nom du responsable"
              />
            </div>
          </div>
        </Modal>
      )}

      {previewItem && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          title={`Justificatif de Mouvement : ${previewItem.reference}`}
          size="4xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Imprimer le Justificatif
              </Button>
              <Button variant="gold" size="sm" onClick={() => setPreviewItem(null)}>
                Fermer
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-5 text-xs">
            <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--royal-primary)] text-[var(--royal-primary-text)] flex items-center justify-center font-black text-sm">
                    R
                  </div>
                  <span className="font-heading font-black text-base text-neutral-900">
                    ROYAL LUXURY HOME
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Pièce Comptable de Trésorerie — Flux Caisse & Banque
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] font-black">
                  {previewItem.reference}
                </span>
                <div className="text-[11px] text-neutral-500 mt-1">
                  {new Date(previewItem.createdAt).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Sens de Flux
                </span>
                <span className="font-bold text-neutral-900">
                  {previewItem.type === 'INFLOW' ? 'Encaissement (+)' : 'Décaissement (-)'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Mode de Règlement
                </span>
                <span className="font-bold text-neutral-900">
                  {METHOD_LABELS[previewItem.method] || previewItem.method}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Compte / Caisse Imputé
                </span>
                <span className="font-bold text-neutral-900 font-mono">{previewItem.account}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Opérateur
                </span>
                <span className="font-bold text-neutral-900">{previewItem.operator}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Motif & Libellé
              </span>
              <p className="text-sm font-semibold text-neutral-900">{previewItem.label}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] flex items-center justify-between font-mono">
              <span className="text-xs font-bold uppercase text-[#8C6400]">Montant Certifié</span>
              <span className="text-lg font-black text-neutral-950">
                {previewItem.type === 'INFLOW' ? '+' : '-'} {formatTndCurrency(previewItem.amount)}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {deleteItem && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          title="Supprimer le mouvement"
          message={`Êtes-vous certain de vouloir supprimer le mouvement "${deleteItem.reference}" ?`}
        />
      )}
      {bulkDeleteTxIds.length > 0 && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setBulkDeleteTxIds([])}
          onConfirm={confirmBulkDeleteTxs}
          isDeleting={saving}
          title="Supprimer les mouvements sélectionnés"
          description={`Confirmez-vous la suppression des ${bulkDeleteTxIds.length} transaction(s) sélectionnée(s) ?`}
        />
      )}
    </div>
  );
}
