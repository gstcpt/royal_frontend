'use client';

import * as React from 'react';
import {
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Calendar,
  Eye,
  Trash2,
  Plus,
  Printer,
  RefreshCw,
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

interface PaymentItem {
  id: string;
  reference: string;
  instrumentType: 'CHECK' | 'BILL';
  checkNumber: string;
  bankName: string;
  emitterName: string;
  amount: number;
  dueDate: string;
  status: 'IN_PORTFOLIO' | 'DEPOSITED' | 'CLEARED' | 'REJECTED';
  notes?: string;
  createdAt: string;
}

const STATUS_META: Record<PaymentItem['status'], { label: string; cls: string }> = {
  IN_PORTFOLIO: { label: 'En Portefeuille', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  DEPOSITED: { label: 'Déposé en Banque', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  CLEARED: { label: 'Encaissé Définitivement', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Rejeté / Impayé', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export default function PaymentsTrackingPage() {
  const [payments, setPayments] = React.useState<PaymentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [previewItem, setPreviewItem] = React.useState<PaymentItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<PaymentItem | null>(null);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [newNumber, setNewNumber] = React.useState('');
  const [newBank, setNewBank] = React.useState('');
  const [newEmitter, setNewEmitter] = React.useState('');
  const [newAmount, setNewAmount] = React.useState('');
  const [newDue, setNewDue] = React.useState('');
  const [newType, setNewType] = React.useState<'CHECK' | 'BILL'>('CHECK');
  const [newNotes, setNewNotes] = React.useState('');

  const loadPayments = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/treasuryPayments');
      const raw = res?.value ?? res?.data?.value ?? res?.data ?? res;
      setPayments(Array.isArray(raw) ? raw : []);
    } catch {
      setToast({ msg: 'Impossible de charger les règlements depuis PostgreSQL.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const persistPayments = async (next: PaymentItem[], successMsg: string) => {
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/treasuryPayments', {
        method: 'PUT',
        body: JSON.stringify({ value: next }),
      });
      setPayments(next);
      setToast({ msg: successMsg, type: 'success' });
    } catch (err: any) {
      setToast({ msg: err?.message || 'Erreur lors de la sauvegarde en base PostgreSQL.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newNumber.trim() || !newAmount) return;
    const item: PaymentItem = {
      id: `pay-${Date.now()}`,
      reference: `REG-${new Date().getFullYear()}-${String(payments.length + 121).padStart(4, '0')}`,
      instrumentType: newType,
      checkNumber: newNumber.trim(),
      bankName: newBank.trim() || 'Banque Tunisienne',
      emitterName: newEmitter.trim() || 'Client Royal',
      amount: Number(newAmount) || 0,
      dueDate: newDue || new Date().toISOString().split('T')[0],
      status: 'IN_PORTFOLIO',
      notes: newNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await persistPayments([item, ...payments], 'Règlement enregistré au portefeuille.');
    setIsModalOpen(false);
    setNewNumber('');
    setNewBank('');
    setNewEmitter('');
    setNewAmount('');
    setNewNotes('');
  };

  const handleStatusChange = async (id: string, status: PaymentItem['status']) => {
    const next = payments.map((p) => (p.id === id ? { ...p, status } : p));
    await persistPayments(next, `Statut mis à jour : ${STATUS_META[status].label}.`);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const next = payments.filter((p) => p.id !== deleteItem.id);
    setDeleteItem(null);
    await persistPayments(next, 'Règlement supprimé du portefeuille.');
  };

  const columns: ColumnDef<PaymentItem>[] = [
    {
      key: 'status',
      header: 'Statut Règlement',
      sortable: true,
      render: (item) => {
        switch (item.status) {
          case 'IN_PORTFOLIO':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="h-3 w-3" />
                <span>En Portefeuille</span>
              </span>
            );
          case 'DEPOSITED':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <Building2 className="h-3 w-3" />
                <span>Déposé en Banque</span>
              </span>
            );
          case 'CLEARED':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                <span>Encaissé Définitivement</span>
              </span>
            );
          default:
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                <XCircle className="h-3 w-3" />
                <span>Rejeté / Impayé</span>
              </span>
            );
        }
      },
    },
    {
      key: 'checkNumber',
      header: 'N° Document & Banque',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 font-mono">
              {item.checkNumber}
            </span>
            <Badge variant="outline" className="text-[9px] uppercase font-bold text-neutral-700">
              {item.instrumentType === 'CHECK' ? 'Chèque' : 'Traite'}
            </Badge>
          </div>
          <div className="text-[11px] text-neutral-500">{item.bankName}</div>
        </div>
      ),
    },
    {
      key: 'emitterName',
      header: 'Émetteur (Tireur)',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-neutral-900">{item.emitterName}</div>
          {item.notes && <div className="text-[10px] text-neutral-400 italic line-clamp-1">{item.notes}</div>}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Montant (TND)',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-black text-neutral-900 font-mono">
          {formatTndCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Date d’Échéance',
      sortable: true,
      render: (item) => {
        const isPast = new Date(item.dueDate) < new Date();
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
            <span className={cn(isPast && item.status === 'IN_PORTFOLIO' && 'text-amber-700 font-bold')}>
              {new Date(item.dueDate).toLocaleDateString('fr-FR')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Cycle & Actions',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            title="Aperçu & Impression"
            onClick={() => setPreviewItem(item)}
            className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-[#8C6400] hover:border-[#E6D6A6] hover:bg-[#FBF6E8] transition-colors cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
          {item.status === 'IN_PORTFOLIO' && (
            <button
              type="button"
              title="Marquer comme Déposé en banque"
              disabled={saving}
              onClick={() => handleStatusChange(item.id, 'DEPOSITED')}
              className="h-8 px-2.5 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Déposer
            </button>
          )}
          {item.status === 'DEPOSITED' && (
            <button
              type="button"
              title="Marquer comme Encaissé"
              disabled={saving}
              onClick={() => handleStatusChange(item.id, 'CLEARED')}
              className="h-8 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Encaisser
            </button>
          )}
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
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
                Suivi des Règlements (Chèques &amp; Traites)
              </h1>
              <p className="text-xs text-neutral-500">
                Gestion du portefeuille de chèques, alertes d&apos;échéances et rapprochement bancaire persistant.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadPayments}
              disabled={loading}
              className="text-xs"
              title="Actualiser"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Nouveau Chèque / Traite</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Trésorerie', href: '/dashboard/treasury' },
              { label: 'Suivi des règlements' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={payments}
        columns={columns}
        isLoading={loading}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['checkNumber', 'bankName', 'emitterName', 'reference']}
        exportFileName="reglements_royal"
        printTitle="Suivi des Chèques et Traites Royal"
      />

      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title="Enregistrer un Chèque ou Traite"
          size="4xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handleCreate}
                disabled={saving || !newNumber.trim() || !newAmount}
              >
                <span>{saving ? 'Enregistrement...' : 'Enregistrer au Portefeuille'}</span>
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-4">
            <Select
              label="Type d'instrument"
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'CHECK' | 'BILL')}
              options={[
                { value: 'CHECK', label: 'Chèque Bancaire' },
                { value: 'BILL', label: 'Lettre de Change / Traite' },
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Numéro du chèque / traite"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="Ex: CHQ-99120"
              />
              <Input
                label="Montant (TND)"
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="2500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Banque Émettrice & Agence"
                value={newBank}
                onChange={(e) => setNewBank(e.target.value)}
                placeholder="Ex: BIAT Agence Lac 2"
              />
              <Input
                label="Nom de l'Émetteur (Tireur)"
                value={newEmitter}
                onChange={(e) => setNewEmitter(e.target.value)}
                placeholder="Ex: Société LuxImmo"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date d'échéance d'encaissement"
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
              />
              <Input
                label="Notes / Bordereau (Optionnel)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ex: Acompte 50%"
              />
            </div>
          </div>
        </Modal>
      )}

      {previewItem && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          title={`Bordereau de Règlement : ${previewItem.reference}`}
          size="4xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Imprimer le Bordereau
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
                  Portefeuille Effets & Règlements Bancaires
                </p>
              </div>
              <div className="text-right font-mono space-y-1">
                <span className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] font-black inline-block">
                  {previewItem.reference}
                </span>
                <div>
                  <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-bold', STATUS_META[previewItem.status].cls)}>
                    {STATUS_META[previewItem.status].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Instrument & Numéro
                </span>
                <span className="font-bold text-neutral-900 font-mono">
                  {previewItem.instrumentType === 'CHECK' ? 'Chèque' : 'Traite'} — {previewItem.checkNumber}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Banque Émettrice
                </span>
                <span className="font-bold text-neutral-900">{previewItem.bankName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Tireur / Émetteur
                </span>
                <span className="font-bold text-neutral-900">{previewItem.emitterName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Échéance
                </span>
                <span className="font-bold text-neutral-900 font-mono">
                  {new Date(previewItem.dueDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {previewItem.notes && (
              <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  Observations
                </span>
                <p className="text-neutral-800">{previewItem.notes}</p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] flex items-center justify-between font-mono">
              <span className="text-xs font-bold uppercase text-[#8C6400]">Montant de l&apos;Effet</span>
              <span className="text-lg font-black text-neutral-950">
                {formatTndCurrency(previewItem.amount)}
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
          title="Supprimer le règlement"
          message={`Êtes-vous certain de vouloir supprimer le règlement "${deleteItem.checkNumber}" ?`}
        />
      )}
    </div>
  );
}
