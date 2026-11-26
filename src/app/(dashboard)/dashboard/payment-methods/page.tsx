'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Banknote,
  Calendar,
  Settings2,
  Check,
  X,
  Printer,
  Wallet,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui';
import { Modal, DeleteConfirmModal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { SystemRole } from '@royal/shared-types';
import { PaymentGatewaysPanel } from '@/components/dashboard/PaymentGatewaysPanel';

export interface PaymentMethodItem {
  id: string;
  code: string;
  name: string;
  type: 'CASH' | 'CARD_ONLINE' | 'BANK_TRANSFER' | 'CHECK' | 'INSTALLMENT';
  channels: Array<'WEB_STORE' | 'POS_STORE' | 'PHONE_B2B'>;
  feePercent: number;
  maxAmountTnd: number;
  settlementDelay: string;
  isActive: boolean;
  requiresValidation: boolean;
  createdAt: string;
  description: string;
}

function PaymentMethodsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const isRoot = hasRole(SystemRole.ROOT);
  const tabParam = searchParams.get('tab') === 'gateways' && isRoot ? 'gateways' : 'methods';

  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodItem | null>(null);
  const [savingMethod, setSavingMethod] = useState(false);
  const [selectedMethodIds, setSelectedMethodIds] = useState<string[]>([]);
  const [bulkDeleteMethodIds, setBulkDeleteMethodIds] = useState<string[]>([]);

  const handlePanelFeedback = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setFeedbackType(type);
    setFeedbackMessage(msg);
  }, []);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/paymentMethods');
      const list = res?.value || res?.data?.value || [];
      setMethods(Array.isArray(list) ? list : []);
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const stats = useMemo(() => {
    const total = methods.length;
    const active = methods.filter((m) => m.isActive).length;
    const online = methods.filter((m) => m.type === 'CARD_ONLINE').length;
    const installments = methods.filter((m) => m.type === 'INSTALLMENT').length;
    return { total, active, online, installments };
  }, [methods]);

  const toggleActive = async (id: string) => {
    const next = methods.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m));
    setMethods(next);
    const changed = next.find((m) => m.id === id);
    await fetchApi('/storefront-cms/sys-config/paymentMethods', {
      method: 'PUT',
      body: JSON.stringify({ value: next }),
    }).catch(() => null);
    if (changed) {
      setFeedbackMessage(
        `Modalité "${changed.name}" ${changed.isActive ? 'activée' : 'désactivée'} en base.`
      );
    }
  };

  const handleBulkMethodPatch = async (
    patch: Partial<PaymentMethodItem>,
    label: string
  ) => {
    if (selectedMethodIds.length === 0) return;
    const idSet = new Set(selectedMethodIds);
    const next = methods.map((m) => (idSet.has(m.id) ? { ...m, ...patch } : m));
    setMethods(next);
    await fetchApi('/storefront-cms/sys-config/paymentMethods', {
      method: 'PUT',
      body: JSON.stringify({ value: next }),
    }).catch(() => null);
    setFeedbackMessage(`${selectedMethodIds.length} modalité(s) ${label}.`);
    setSelectedMethodIds([]);
  };

  const confirmBulkDeleteMethods = async () => {
    if (bulkDeleteMethodIds.length === 0) return;
    const idSet = new Set(bulkDeleteMethodIds);
    const next = methods.filter((m) => !idSet.has(m.id));
    setMethods(next);
    await fetchApi('/storefront-cms/sys-config/paymentMethods', {
      method: 'PUT',
      body: JSON.stringify({ value: next }),
    }).catch(() => null);
    setFeedbackMessage(`${bulkDeleteMethodIds.length} modalité(s) supprimée(s).`);
    setBulkDeleteMethodIds([]);
    setSelectedMethodIds([]);
  };

  const columns: ColumnDef<PaymentMethodItem>[] = [
    {
      key: 'name',
      header: 'Modalité & Intitulé',
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <span className="font-semibold text-neutral-900 text-xs block">{row.name}</span>
            <span className="text-[10px] font-mono text-neutral-500">{row.code}</span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.name} (${row.code})`,
    },
    {
      key: 'channels',
      header: 'Canaux Autorisés',
      render: (row) => (
        <div className="flex items-center gap-1 flex-wrap">
          {row.channels.map((ch) => (
            <span
              key={ch}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200"
            >
              {ch === 'WEB_STORE' && 'Web E-Commerce'}
              {ch === 'POS_STORE' && 'Caisse Magasin'}
              {ch === 'PHONE_B2B' && 'B2B & Devis'}
            </span>
          ))}
        </div>
      ),
      printRender: (row) => row.channels.join(', '),
    },
    {
      key: 'settlementDelay',
      header: 'Délai d’Encaissement',
      sortable: true,
      sortValue: (row) => row.settlementDelay,
      render: (row) => (
        <div className="text-xs text-neutral-800 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>{row.settlementDelay}</span>
        </div>
      ),
      printRender: (row) => row.settlementDelay,
    },
    {
      key: 'maxAmountTnd',
      header: 'Plafond Transaction',
      sortable: true,
      sortValue: (row) => row.maxAmountTnd,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-neutral-900">
          {formatTndCurrency(row.maxAmountTnd)}
        </span>
      ),
      printRender: (row) => formatTndCurrency(row.maxAmountTnd),
    },
    {
      key: 'feePercent',
      header: 'Commission / Frais',
      sortable: true,
      sortValue: (row) => row.feePercent,
      render: (row) => (
        <span className="font-mono text-xs text-neutral-600">
          {row.feePercent > 0 ? `${row.feePercent}%` : 'Sans frais'}
        </span>
      ),
      printRender: (row) => (row.feePercent > 0 ? `${row.feePercent}%` : '0%'),
    },
    {
      key: 'status',
      header: 'Visibilité & Statut',
      sortable: true,
      sortValue: (row) => (row.isActive ? 1 : 0),
      render: (row) => (
        <button
          type="button"
          onClick={() => toggleActive(row.id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition border cursor-pointer',
            row.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
          )}
        >
          {row.isActive ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-neutral-400" />}
          <span>{row.isActive ? 'Actif' : 'Désactivé'}</span>
        </button>
      ),
      printRender: (row) => (row.isActive ? 'Actif' : 'Désactivé'),
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
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              setEditingMethod(row);
              setIsEditModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition shadow-2xs cursor-pointer"
            title="Configurer les paramètres de cette modalité de paiement"
          >
            <Settings2 className="w-3.5 h-3.5" />
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
        type={feedbackType}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Header Card with Breadcrumbs + Merged Tabs */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
                Modalités de Paiement &amp; Passerelles (Flouci / ClicToPay)
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configurez les conditions commerciales en caisse/boutique et les identifiants API Flouci / ClicToPay.
              </p>
            </div>
          </div>
          {isRoot && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.replace('/dashboard/payment-methods', { scroll: false })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tabParam === 'methods'
                    ? 'bg-[var(--royal-primary)] text-white shadow-xs'
                    : 'bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Modalités Commerciales</span>
              </button>
              <button
                type="button"
                onClick={() => router.replace('/dashboard/payment-methods?tab=gateways', { scroll: false })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tabParam === 'gateways'
                    ? 'bg-[var(--royal-primary)] text-white shadow-xs'
                    : 'bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Passerelles En Ligne (ROOT)</span>
              </button>
            </div>
          )}
        </div>
        <Breadcrumb
          items={[
            { label: 'Configuration & Finances', href: '/dashboard/treasury' },
            { label: 'Modalités & Passerelles Paiement' },
          ]}
        />
      </div>

      {tabParam === 'gateways' && isRoot ? (
        <PaymentGatewaysPanel onFeedback={handlePanelFeedback} />
      ) : (
        <>

      {/* 2. 4 KPIs Master Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Modalités Actives</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.active} / {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">Disponibles aux acheteurs</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Paiement en Ligne (SMT)</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.online}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Cartes bancaires GIE / Visa</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Comptant & Caisse</span>
            <Banknote className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            Espèces & COD
          </div>
          <div className="text-[11px] text-neutral-500">Règlement à la livraison</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Facilités de Paiement</span>
            <Calendar className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            3x Sans Frais
          </div>
          <div className="text-[11px] text-neutral-500">Dossiers de crédit client</div>
        </div>
      </div>

      {/* 3. Main DataTable */}
      <DataTable
        data={methods}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedMethodIds}
        onSelectionChange={setSelectedMethodIds}
        onBulkDelete={(keys) => setBulkDeleteMethodIds(keys)}
        renderBulkActions={() => (
          <>
            <button
              type="button"
              onClick={() => handleBulkMethodPatch({ isActive: true }, 'activée(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
            >
              Activer
            </button>
            <button
              type="button"
              onClick={() => handleBulkMethodPatch({ isActive: false }, 'désactivée(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer"
            >
              Désactiver
            </button>
            <select
              value=""
              onChange={(e) => {
                const tp = e.target.value as PaymentMethodItem['type'];
                if (tp) handleBulkMethodPatch({ type: tp }, `classée(s) (${tp})`);
              }}
              aria-label="Changer type de paiement"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Type modalité...</option>
              <option value="CASH">Espèces / COD</option>
              <option value="CARD_ONLINE">Carte en Ligne</option>
              <option value="BANK_TRANSFER">Virement Bancaire</option>
              <option value="CHECK">Chèque Bancaire</option>
              <option value="INSTALLMENT">Facilités / Échéances</option>
            </select>
          </>
        )}
        searchPlaceholder="Rechercher une modalité de paiement par nom, code, délai..."
        searchKeys={['name', 'code', 'description', 'settlementDelay']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Modalités de Paiement & Passerelles — Royal"
        exportFileName="modalites_paiement_royal"
      />

      {editingMethod && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => !savingMethod && setIsEditModalOpen(false)}
          size="md"
          title={`Paramétrage — ${editingMethod.code}`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                disabled={savingMethod}
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs"
              >
                Fermer
              </Button>
              <Button
                variant="gold"
                disabled={savingMethod}
                onClick={async () => {
                  if (!editingMethod || savingMethod) return;
                  setSavingMethod(true);
                  try {
                    const sanitized: PaymentMethodItem = {
                      ...editingMethod,
                      name: editingMethod.name.trim() || editingMethod.code,
                      description: editingMethod.description.trim(),
                      settlementDelay: editingMethod.settlementDelay.trim() || 'Immédiat',
                      maxAmountTnd: Math.max(0, Number(editingMethod.maxAmountTnd) || 0),
                      feePercent: Math.max(0, Number(editingMethod.feePercent) || 0),
                      channels:
                        editingMethod.channels.length > 0 ? editingMethod.channels : ['WEB_STORE'],
                    };
                    const next = methods.map((m) => (m.id === sanitized.id ? sanitized : m));
                    await fetchApi('/storefront-cms/sys-config/paymentMethods', {
                      method: 'PUT',
                      body: JSON.stringify({ value: next }),
                    });
                    setMethods(next);
                    setIsEditModalOpen(false);
                    setFeedbackType('success');
                    setFeedbackMessage(`Modalité « ${sanitized.name} » enregistrée en base.`);
                  } catch {
                    setFeedbackType('error');
                    setFeedbackMessage('Impossible d’enregistrer cette modalité de paiement.');
                  } finally {
                    setSavingMethod(false);
                  }
                }}
                className="text-xs px-4 py-2"
              >
                {savingMethod ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          }
        >
          <div className="p-4 sm:p-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Libellé affiché
                </label>
                <input
                  type="text"
                  value={editingMethod.name}
                  onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Délai de Règlement / Encaissement
                </label>
                <input
                  type="text"
                  value={editingMethod.settlementDelay}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, settlementDelay: e.target.value })
                  }
                  placeholder="Immédiat / J+1 ouvré"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Description commerciale
              </label>
              <input
                type="text"
                value={editingMethod.description}
                onChange={(e) =>
                  setEditingMethod({ ...editingMethod, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Plafond Maximum (TND)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingMethod.maxAmountTnd}
                  onChange={(e) =>
                    setEditingMethod({
                      ...editingMethod,
                      maxAmountTnd: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-xs text-neutral-900 bg-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Frais de Transaction (%)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={editingMethod.feePercent}
                  onChange={(e) =>
                    setEditingMethod({
                      ...editingMethod,
                      feePercent: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-xs text-neutral-900 bg-white focus:outline-none focus:border-[#C59B27]"
                />
              </div>
            </div>

            <div>
              <span className="font-semibold text-neutral-700 block mb-1.5">
                Canaux autorisés
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: 'WEB_STORE', label: 'Boutique Web' },
                    { key: 'POS_STORE', label: 'Caisse POS Showroom' },
                    { key: 'PHONE_B2B', label: 'Vente Téléphone / B2B' },
                  ] as const
                ).map((ch) => {
                  const active = editingMethod.channels.includes(ch.key);
                  return (
                    <button
                      key={ch.key}
                      type="button"
                      onClick={() => {
                        const nextChannels = active
                          ? editingMethod.channels.filter((c) => c !== ch.key)
                          : [...editingMethod.channels, ch.key];
                        setEditingMethod({ ...editingMethod, channels: nextChannels });
                      }}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer',
                        active
                          ? 'bg-[#FBF6E8] text-[#9A7414] border-[#C59B27]'
                          : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                      )}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#1D232E]">Validation requise</span>
                <Toggle
                  compact
                  size="sm"
                  checked={editingMethod.requiresValidation}
                  onChange={(v) => setEditingMethod({ ...editingMethod, requiresValidation: v })}
                />
              </div>
              <div className="p-2.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#1D232E]">Modalité active</span>
                <Toggle
                  compact
                  size="sm"
                  checked={editingMethod.isActive}
                  onChange={(v) => setEditingMethod({ ...editingMethod, isActive: v })}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
      <DeleteConfirmModal
        isOpen={bulkDeleteMethodIds.length > 0}
        onClose={() => setBulkDeleteMethodIds([])}
        onConfirm={confirmBulkDeleteMethods}
        title="Supprimer les modalités sélectionnées"
        description={`Confirmez-vous la suppression des ${bulkDeleteMethodIds.length} modalité(s) de paiement ?`}
      />
        </>
      )}
    </div>
  );
}

export default function PaymentMethodsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement Modalités &amp; Passerelles...</div>}>
      <PaymentMethodsContent />
    </Suspense>
  );
}
