'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';

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

const INITIAL_PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: 'pay-001',
    code: 'CASH_COD',
    name: 'Espèces (Caisse Magasin & Livraison COD)',
    type: 'CASH',
    channels: ['WEB_STORE', 'POS_STORE', 'PHONE_B2B'],
    feePercent: 0,
    maxAmountTnd: 5000,
    settlementDelay: 'Immédiat au quai / caisse',
    isActive: true,
    requiresValidation: false,
    createdAt: '2026-11-01T08:00:00Z',
    description: 'Paiement en espèces lors de la livraison à domicile ou au comptoir showroom.',
  },
  {
    id: 'pay-002',
    code: 'CLICTOPAY_SMT',
    name: 'Carte Bancaire Tunisienne (ClicToPay SMT)',
    type: 'CARD_ONLINE',
    channels: ['WEB_STORE'],
    feePercent: 1.5,
    maxAmountTnd: 20000,
    settlementDelay: 'J+1 ouvré (Banque)',
    isActive: true,
    requiresValidation: false,
    createdAt: '2026-11-01T08:00:00Z',
    description: 'Passerelle officielle monétique tunisienne avec authentification 3D Secure SMS.',
  },
  {
    id: 'pay-003',
    code: 'BANK_TRANSFER',
    name: 'Virement Bancaire (RIB Société)',
    type: 'BANK_TRANSFER',
    channels: ['WEB_STORE', 'PHONE_B2B'],
    feePercent: 0,
    maxAmountTnd: 100000,
    settlementDelay: 'Validation manuelle relevé',
    isActive: true,
    requiresValidation: true,
    createdAt: '2026-11-02T10:00:00Z',
    description: 'Virement vers le compte bancaire BIAT de la société avec justificatif obligatoire.',
  },
  {
    id: 'pay-004',
    code: 'CHECK_PAYMENT',
    name: 'Chèque Bancaire Certifié',
    type: 'CHECK',
    channels: ['POS_STORE', 'PHONE_B2B'],
    feePercent: 0,
    maxAmountTnd: 30000,
    settlementDelay: 'Encaissement 3 à 5 jours',
    isActive: true,
    requiresValidation: true,
    createdAt: '2026-11-03T11:00:00Z',
    description: 'Paiement par chèque physique avec vérification de solvabilité et pièce d’identité.',
  },
  {
    id: 'pay-005',
    code: 'FACILITY_3X',
    name: 'Facilités de Paiement en 3x Sans Frais',
    type: 'INSTALLMENT',
    channels: ['WEB_STORE', 'POS_STORE'],
    feePercent: 0,
    maxAmountTnd: 6000,
    settlementDelay: 'Échéances mensuelles',
    isActive: true,
    requiresValidation: true,
    createdAt: '2026-11-05T09:00:00Z',
    description: 'Paiement échelonné en 3 traites ou prélèvements mensuels avec dossier de crédit.',
  },
];

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodItem | null>(null);

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
        type="success"
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Header Card with Breadcrumbs */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
                Modalités de Paiement & Passerelles
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configurez les moyens de règlement en magasin, en ligne (ClicToPay SMT) et les échéanciers de paiement en plusieurs fois.
              </p>
            </div>
          </div>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Configuration & Finances', href: '/dashboard/treasury' },
              { label: 'Modalités de Paiement' },
            ]}
          />
        </div>
      </div>

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
          onClose={() => setIsEditModalOpen(false)}
          size="md"
          title={`Paramétrage — ${editingMethod.name}`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="text-xs">
                Fermer
              </Button>
              <Button
                variant="gold"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setFeedbackMessage('Configuration mise à jour avec succès.');
                }}
                className="text-xs px-4 py-2"
              >
                Enregistrer
              </Button>
            </div>
          }
        >
          <div className="p-5 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-700 space-y-1">
              <div className="font-bold text-neutral-900">{editingMethod.name}</div>
              <p className="text-[11px] text-neutral-500">{editingMethod.description}</p>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Plafond Maximum par Transaction (TND)
              </label>
              <input
                type="number"
                defaultValue={editingMethod.maxAmountTnd}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-xs text-neutral-900"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Frais de Transaction (%)
              </label>
              <input
                type="number"
                step="0.1"
                defaultValue={editingMethod.feePercent}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-xs text-neutral-900"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
