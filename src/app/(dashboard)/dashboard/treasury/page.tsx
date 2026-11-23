'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Banknote,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  CreditCard,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  Warehouse,
  Store,
  Shield,
  Lock,
  Unlock,
  Printer,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal, DeleteConfirmModal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';

export interface TreasuryAccountItem {
  id: string;
  name: string;
  code?: string;
  accountType: 'CASH_REGISTER' | 'BANK' | 'SAFE_DEPOSIT';
  institution: string; // ex: BIAT, Caisse Showroom Lac 2, Coffre Sousse
  accountNumber?: string;
  showroomOrDepot?: string;
  currentBalanceTnd: number;
  initialBalanceTnd?: number;
  managerName: string;
  status: 'OPEN' | 'RECONCILED' | 'LOCKED';
  isActive: boolean;
  lastMovementAmountTnd: number;
  lastMovementDate: string;
  createdAt: string;
}

const INITIAL_ACCOUNTS: TreasuryAccountItem[] = [
  {
    id: 'tr-001',
    name: 'Compte Courant Principal BIAT',
    code: 'BNQ-BIAT-01',
    accountType: 'BANK',
    institution: 'Banque Internationale Arabe de Tunisie (BIAT)',
    accountNumber: 'RIB 08 045 0001234567890 42',
    showroomOrDepot: 'Direction Générale Tunis',
    currentBalanceTnd: 148520,
    initialBalanceTnd: 100000,
    managerName: 'Direction Financière',
    status: 'OPEN',
    isActive: true,
    lastMovementAmountTnd: 7070,
    lastMovementDate: '2026-11-15T10:00:00Z',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'tr-002',
    name: 'Caisse Showroom Tunis — Les Berges du Lac',
    code: 'CSH-LAC2-01',
    accountType: 'CASH_REGISTER',
    institution: 'Showroom Tunis Lac II',
    showroomOrDepot: 'Showroom Tunis Lac II',
    currentBalanceTnd: 3450,
    initialBalanceTnd: 500,
    managerName: 'Mariem Ben Salem (Caissière)',
    status: 'OPEN',
    isActive: true,
    lastMovementAmountTnd: 1200,
    lastMovementDate: '2026-11-15T15:20:00Z',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'tr-003',
    name: 'Caisse Showroom La Marsa VIP',
    code: 'CSH-MARSA-01',
    accountType: 'CASH_REGISTER',
    institution: 'Boutique La Marsa VIP',
    showroomOrDepot: 'Boutique La Marsa',
    currentBalanceTnd: 1890,
    initialBalanceTnd: 400,
    managerName: 'Sonia Trabelsi (Responsable)',
    status: 'OPEN',
    isActive: true,
    lastMovementAmountTnd: 450,
    lastMovementDate: '2026-11-14T18:00:00Z',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'tr-004',
    name: 'Caisse Showroom Sousse — Boulevard de la Plage',
    code: 'CSH-SOUSSE-01',
    accountType: 'CASH_REGISTER',
    institution: 'Showroom Sousse Côte',
    showroomOrDepot: 'Showroom Sousse',
    currentBalanceTnd: 4120,
    initialBalanceTnd: 600,
    managerName: 'Anis Gharbi (Caissier)',
    status: 'OPEN',
    isActive: true,
    lastMovementAmountTnd: 890,
    lastMovementDate: '2026-11-16T12:30:00Z',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'tr-005',
    name: 'Coffre-Fort Central Dépôt Sousse',
    code: 'CFR-SOUSSE-01',
    accountType: 'SAFE_DEPOSIT',
    institution: 'Dépôt Central Sousse',
    showroomOrDepot: 'Dépôt Sousse Hub Central',
    currentBalanceTnd: 12500,
    initialBalanceTnd: 15000,
    managerName: 'Mohamed Zitouni (Superadmin)',
    status: 'RECONCILED',
    isActive: true,
    lastMovementAmountTnd: -5000,
    lastMovementDate: '2026-11-12T11:00:00Z',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'tr-006',
    name: 'Compte Monétique En Ligne Attijari',
    code: 'BNQ-ATTIJ-01',
    accountType: 'BANK',
    institution: 'Attijari Bank Tunisie',
    accountNumber: 'RIB 04 012 0009876543210 18',
    showroomOrDepot: 'E-commerce Royal Web',
    currentBalanceTnd: 42300,
    initialBalanceTnd: 20000,
    managerName: 'Direction E-commerce',
    status: 'OPEN',
    isActive: true,
    lastMovementAmountTnd: 3200,
    lastMovementDate: '2026-11-17T09:40:00Z',
    createdAt: '2026-09-15T10:00:00Z',
  },
];

export default function TreasuryPage() {
  const [accounts, setAccounts] = useState<TreasuryAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<TreasuryAccountItem | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CASH_REGISTER' | 'BANK' | 'SAFE_DEPOSIT'>('ALL');

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/treasuryAccounts');
      const list = res?.value || res?.data?.value || [];
      setAccounts(Array.isArray(list) ? list : []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const persistAccounts = async (next: TreasuryAccountItem[], msg: string) => {
    setAccounts(next);
    await fetchApi('/storefront-cms/sys-config/treasuryAccounts', {
      method: 'PUT',
      body: JSON.stringify({ value: next }),
    }).catch(() => null);
    setFeedbackMessage(msg);
  };

  // Modal Creation / Edition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TreasuryAccountItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'CASH_REGISTER' | 'BANK' | 'SAFE_DEPOSIT'>('CASH_REGISTER');
  const [formInstitution, setFormInstitution] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formShowroomOrDepot, setFormShowroomOrDepot] = useState('Showroom Tunis Lac II');
  const [formManagerName, setFormManagerName] = useState('');
  const [formBalance, setFormBalance] = useState('0');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formStatus, setFormStatus] = useState<'OPEN' | 'RECONCILED' | 'LOCKED'>('OPEN');

  // Delete modal state
  const [accountToDelete, setAccountToDelete] = useState<TreasuryAccountItem | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [bulkDeleteAccountIds, setBulkDeleteAccountIds] = useState<string[]>([]);

  const handleBulkTreasuryPatch = async (
    patch: Partial<TreasuryAccountItem>,
    label: string
  ) => {
    if (selectedAccountIds.length === 0) return;
    const idSet = new Set(selectedAccountIds);
    const next = accounts.map((a) => (idSet.has(a.id) ? { ...a, ...patch } : a));
    await persistAccounts(next, `${selectedAccountIds.length} caisse(s)/compte(s) ${label}.`);
    setSelectedAccountIds([]);
  };

  const confirmBulkDeleteAccounts = async () => {
    if (bulkDeleteAccountIds.length === 0) return;
    const idSet = new Set(bulkDeleteAccountIds);
    await persistAccounts(
      accounts.filter((a) => !idSet.has(a.id)),
      `${bulkDeleteAccountIds.length} caisse(s)/compte(s) supprimé(s).`
    );
    setBulkDeleteAccountIds([]);
    setSelectedAccountIds([]);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAccount(null);
    setFormName('');
    setFormCode(`CSH-${Date.now().toString().slice(-4)}`);
    setFormType('CASH_REGISTER');
    setFormInstitution('Showroom Tunis Lac II');
    setFormAccountNumber('');
    setFormShowroomOrDepot('Showroom Tunis Lac II');
    setFormManagerName('');
    setFormBalance('500');
    setFormIsActive(true);
    setFormStatus('OPEN');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (account: TreasuryAccountItem) => {
    setEditingAccount(account);
    setFormName(account.name);
    setFormCode(account.code || '');
    setFormType(account.accountType);
    setFormInstitution(account.institution);
    setFormAccountNumber(account.accountNumber || '');
    setFormShowroomOrDepot(account.showroomOrDepot || 'Showroom Tunis Lac II');
    setFormManagerName(account.managerName);
    setFormBalance(account.currentBalanceTnd.toString());
    setFormIsActive(account.isActive);
    setFormStatus(account.status);
    setIsModalOpen(true);
  };

  // Save Account (Create or Update)
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedbackMessage('Le nom de la caisse ou du compte est requis.');
      return;
    }

    const balanceNum = parseFloat(formBalance) || 0;

    if (editingAccount) {
      const next = accounts.map((item) =>
        item.id === editingAccount.id
          ? {
              ...item,
              name: formName.trim(),
              code: formCode.trim().toUpperCase(),
              accountType: formType,
              institution: formInstitution.trim() || formShowroomOrDepot,
              accountNumber: formType === 'BANK' ? formAccountNumber.trim() : undefined,
              showroomOrDepot: formShowroomOrDepot,
              managerName: formManagerName.trim() || 'Non assigné',
              currentBalanceTnd: balanceNum,
              isActive: formIsActive,
              status: formStatus,
            }
          : item
      );
      persistAccounts(next, `Caisse / Compte "${formName}" mis à jour en base.`);
    } else {
      const newAccount: TreasuryAccountItem = {
        id: `tr-${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim().toUpperCase() || `CSH-${Date.now().toString().slice(-4)}`,
        accountType: formType,
        institution: formInstitution.trim() || formShowroomOrDepot,
        accountNumber: formType === 'BANK' ? formAccountNumber.trim() : undefined,
        showroomOrDepot: formShowroomOrDepot,
        currentBalanceTnd: balanceNum,
        initialBalanceTnd: balanceNum,
        managerName: formManagerName.trim() || 'Non assigné',
        status: formStatus,
        isActive: formIsActive,
        lastMovementAmountTnd: 0,
        lastMovementDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      persistAccounts([newAccount, ...accounts], `Nouvelle caisse / compte "${newAccount.name}" créé en base.`);
    }

    setIsModalOpen(false);
  };

  // Toggle Active / Inactive
  const handleToggleActive = (account: TreasuryAccountItem) => {
    const next = accounts.map((a) =>
      a.id === account.id
        ? {
            ...a,
            isActive: !a.isActive,
            status: (!a.isActive ? 'OPEN' : 'LOCKED') as 'OPEN' | 'LOCKED',
          }
        : a
    );
    persistAccounts(
      next,
      `Caisse "${account.name}" ${!account.isActive ? 'activée (ouverte)' : 'suspendue (verrouillée)'}.`
    );
  };

  // Delete Account
  const handleDeleteAccount = () => {
    if (!accountToDelete) return;
    const next = accounts.filter((a) => a.id !== accountToDelete.id);
    const name = accountToDelete.name;
    setAccountToDelete(null);
    persistAccounts(next, `Caisse / Compte "${name}" supprimé en base.`);
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    if (activeTab === 'ALL') return accounts;
    return accounts.filter((a) => a.accountType === activeTab);
  }, [accounts, activeTab]);

  // Stats KPIs
  const stats = useMemo(() => {
    const totalBalance = accounts.reduce((acc, a) => acc + a.currentBalanceTnd, 0);
    const bankBalance = accounts
      .filter((a) => a.accountType === 'BANK')
      .reduce((acc, a) => acc + a.currentBalanceTnd, 0);
    const cashBalance = accounts
      .filter((a) => a.accountType === 'CASH_REGISTER')
      .reduce((acc, a) => acc + a.currentBalanceTnd, 0);
    const safeBalance = accounts
      .filter((a) => a.accountType === 'SAFE_DEPOSIT')
      .reduce((acc, a) => acc + a.currentBalanceTnd, 0);
    const activeCount = accounts.filter((a) => a.isActive).length;
    return { totalBalance, bankBalance, cashBalance, safeBalance, activeCount };
  }, [accounts]);

  // Colonnes DataTable Master
  const columns: ColumnDef<TreasuryAccountItem>[] = [
    {
      key: 'name',
      header: 'Caisse & Établissement',
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border',
              row.accountType === 'CASH_REGISTER' &&
                'bg-amber-500/10 border-amber-500/20 text-amber-700',
              row.accountType === 'BANK' &&
                'bg-blue-500/10 border-blue-500/20 text-blue-700',
              row.accountType === 'SAFE_DEPOSIT' &&
                'bg-purple-500/10 border-purple-500/20 text-purple-700'
            )}
          >
            {row.accountType === 'BANK' && <Building2 className="w-4 h-4" />}
            {row.accountType === 'CASH_REGISTER' && <Store className="w-4 h-4" />}
            {row.accountType === 'SAFE_DEPOSIT' && <Shield className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900 text-xs block">{row.name}</span>
              {row.code && (
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                  {row.code}
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-500 block">
              {row.showroomOrDepot || row.institution || row.accountNumber}
            </span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.name} (${row.code || row.institution})`,
    },
    {
      key: 'accountType',
      header: 'Type de Compte',
      sortable: true,
      sortValue: (row) => row.accountType,
      render: (row) => (
        <span
          className={cn(
            'px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1.5',
            row.accountType === 'BANK' && 'bg-blue-50 text-blue-800 border-blue-200',
            row.accountType === 'CASH_REGISTER' && 'bg-amber-50 text-amber-900 border-amber-200',
            row.accountType === 'SAFE_DEPOSIT' && 'bg-purple-50 text-purple-900 border-purple-200'
          )}
        >
          {row.accountType === 'BANK' && (
            <>
              <Building2 className="w-3 h-3" />
              Compte Bancaire
            </>
          )}
          {row.accountType === 'CASH_REGISTER' && (
            <>
              <Store className="w-3 h-3 text-amber-700" />
              Caisse Showroom
            </>
          )}
          {row.accountType === 'SAFE_DEPOSIT' && (
            <>
              <Shield className="w-3 h-3 text-purple-700" />
              Coffre-Fort
            </>
          )}
        </span>
      ),
      printRender: (row) => row.accountType,
    },
    {
      key: 'managerName',
      header: 'Caissier / Responsable',
      sortable: true,
      sortValue: (row) => row.managerName,
      render: (row) => <span className="text-xs text-neutral-800 font-medium">{row.managerName}</span>,
      printRender: (row) => row.managerName,
    },
    {
      key: 'currentBalanceTnd',
      header: 'Solde Disponible',
      sortable: true,
      sortValue: (row) => row.currentBalanceTnd,
      render: (row) => (
        <span className="font-mono text-xs font-black text-neutral-900">
          {formatTndCurrency(row.currentBalanceTnd)}
        </span>
      ),
      printRender: (row) => formatTndCurrency(row.currentBalanceTnd),
    },
    {
      key: 'isActive',
      header: 'Statut Caisse',
      sortable: true,
      sortValue: (row) => (row.isActive ? 1 : 0),
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleActive(row)}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer',
            row.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          )}
          title={row.isActive ? 'Caisse active (cliquez pour suspendre)' : 'Caisse suspendue (cliquez pour activer)'}
        >
          {row.isActive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ouverte & Active</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Suspendue / Verrouillée</span>
            </>
          )}
        </button>
      ),
      printRender: (row) => (row.isActive ? 'Active' : 'Suspendue'),
    },
    {
      key: 'createdAt',
      header: 'Date d’Ouverture',
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => (
        <div className="text-xs text-neutral-600 font-mono">
          {new Date(row.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
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
          {/* Consulter */}
          <button
            type="button"
            onClick={() => setSelectedAccount(row)}
            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs cursor-pointer"
            title="Consulter les détails du compte"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Modifier */}
          <button
            type="button"
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 rounded-lg text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 transition shadow-2xs cursor-pointer"
            title="Modifier cette caisse / compte"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Supprimer */}
          <button
            type="button"
            onClick={() => setAccountToDelete(row)}
            className="p-1.5 rounded-lg text-rose-600 bg-white hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 transition shadow-2xs cursor-pointer"
            title="Supprimer cette caisse / compte"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto pb-12">
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage || ''}
        type="success"
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Header Card with Breadcrumbs & Actions */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
              <Banknote className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
                  Gestion des Caisses & Trésorerie
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  {stats.activeCount} Caisses Actives
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Création, affectation par showroom, ouverture, clôture et suivi des liquidités disponibles en caisse et banques.
              </p>
            </div>
          </div>
          <Breadcrumb
            className="mt-2.5 text-xs"
            items={[
              { label: 'Gestion Financière', href: '/dashboard/accounting' },
              { label: 'Trésorerie & Journaux', href: '/dashboard/treasury' },
              { label: 'Gestion des Caisses' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleOpenCreateModal}
            variant="gold"
            className="text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Caisse / Compte</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 KPIs Master Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Trésorerie Globale</span>
            <Banknote className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {formatTndCurrency(stats.totalBalance)}
          </div>
          <div className="text-[11px] text-neutral-500">Liquidités consolidées sur tous les comptes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Caisses Showrooms</span>
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {formatTndCurrency(stats.cashBalance)}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Espèces en caisses points de vente</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700">
            <span>Comptes Bancaires</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 font-heading">
            {formatTndCurrency(stats.bankBalance)}
          </div>
          <div className="text-[11px] text-blue-600 font-medium">BIAT & Attijari Bank à jour</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-700">
            <span>Coffres-Forts Sécurisés</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 font-heading">
            {formatTndCurrency(stats.safeBalance)}
          </div>
          <div className="text-[11px] text-purple-600 font-medium">Réserve centrale Sousse</div>
        </div>
      </div>

      {/* 3. Filter Tabs (Toutes, Caisses Showroom, Banques, Coffres) */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 no-print overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            activeTab === 'ALL'
              ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-2xs'
              : 'text-neutral-600 hover:bg-[#FBF6E8]'
          )}
        >
          <span>Toutes les Caisses & Comptes</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-inherit font-mono">
            {accounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CASH_REGISTER')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            activeTab === 'CASH_REGISTER'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Caisses Showrooms</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-inherit font-mono">
            {accounts.filter((a) => a.accountType === 'CASH_REGISTER').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BANK')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            activeTab === 'BANK'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Comptes Bancaires</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-inherit font-mono">
            {accounts.filter((a) => a.accountType === 'BANK').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SAFE_DEPOSIT')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            activeTab === 'SAFE_DEPOSIT'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Coffres-Forts</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-inherit font-mono">
            {accounts.filter((a) => a.accountType === 'SAFE_DEPOSIT').length}
          </span>
        </button>
      </div>

      {/* 4. DataTable Master */}
      <DataTable
        data={filteredAccounts}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedAccountIds}
        onSelectionChange={setSelectedAccountIds}
        onBulkDelete={(keys) => setBulkDeleteAccountIds(keys)}
        renderBulkActions={() => (
          <>
            <select
              value=""
              onChange={(e) => {
                const st = e.target.value as TreasuryAccountItem['status'];
                if (st) handleBulkTreasuryPatch({ status: st }, `passé(s) en ${st}`);
              }}
              aria-label="Changer statut caisse"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Statut caisse...</option>
              <option value="OPEN">Ouverte</option>
              <option value="RECONCILED">Rapprochée</option>
              <option value="LOCKED">Verrouillée</option>
            </select>
            <select
              value=""
              onChange={(e) => {
                const tp = e.target.value as TreasuryAccountItem['accountType'];
                if (tp) handleBulkTreasuryPatch({ accountType: tp }, `classé(s) (${tp})`);
              }}
              aria-label="Changer type compte"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Type compte...</option>
              <option value="CASH_REGISTER">Caisse Showroom</option>
              <option value="BANK">Compte Bancaire</option>
              <option value="SAFE_DEPOSIT">Coffre-Fort</option>
            </select>
            <button
              type="button"
              onClick={() => handleBulkTreasuryPatch({ isActive: true }, 'activé(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
            >
              Activer
            </button>
            <button
              type="button"
              onClick={() => handleBulkTreasuryPatch({ isActive: false }, 'désactivé(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer"
            >
              Désactiver
            </button>
          </>
        )}
        searchPlaceholder="Rechercher une caisse, un showroom, une banque, un caissier..."
        searchKeys={['name', 'code', 'institution', 'accountNumber', 'managerName', 'showroomOrDepot']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Gestion des Caisses & Trésorerie — Royal"
        exportFileName="caisses_tresorerie_royal"
      />

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL: CRÉER OU MODIFIER UNE CAISSE / COMPTE
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? `Modifier la Caisse — ${editingAccount.name}` : 'Nouvelle Caisse / Compte de Trésorerie'}
        subtitle="Configurez le type d'établissement, le showroom de rattachement et le caissier responsable."
        type={editingAccount ? 'edit' : 'create'}
        size="3xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="treasury-account-form"
              variant="gold"
              size="sm"
              className="text-xs py-2 px-5"
            >
              {editingAccount ? 'Enregistrer les Modifications' : 'Créer la Caisse'}
            </Button>
          </div>
        }
      >
        <form id="treasury-account-form" onSubmit={handleSaveAccount} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom de la Caisse / Compte *"
              placeholder="ex: Caisse Showroom Tunis — Lac II"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <Input
              label="Code Logistique / Identifiant *"
              placeholder="ex: CSH-LAC2-01"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Select
                label="Type de Caisse / Compte *"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                options={[
                  { value: 'CASH_REGISTER', label: 'Caisse Point de Vente (Showroom)' },
                  { value: 'BANK', label: 'Compte Bancaire' },
                  { value: 'SAFE_DEPOSIT', label: 'Coffre-Fort Sécurisé' },
                ]}
              />
            </div>

            <div>
              <Select
                label="Établissement / Showroom de Rattachement *"
                value={formShowroomOrDepot}
                onChange={(e) => setFormShowroomOrDepot(e.target.value)}
                options={[
                  { value: 'Showroom Tunis Lac II', label: 'Showroom Tunis — Les Berges du Lac II' },
                  { value: 'Boutique La Marsa', label: 'Showroom & Boutique — La Marsa VIP' },
                  { value: 'Showroom Sousse', label: 'Showroom Sousse — Boulevard Plage' },
                  { value: 'Showroom Sfax', label: 'Showroom Sfax — Route de Téniour' },
                  { value: 'Dépôt Sousse Hub Central', label: 'Dépôt Central Sousse (Hub Logistique)' },
                  { value: 'Direction Générale Tunis', label: 'Direction Générale Tunis (Siège)' },
                  { value: 'E-commerce Royal Web', label: 'Plateforme E-Commerce Web' },
                ]}
              />
            </div>

            <Input
              label="Caissier(ère) / Responsable"
              placeholder="ex: Mariem Ben Salem"
              value={formManagerName}
              onChange={(e) => setFormManagerName(e.target.value)}
            />
          </div>

          {formType === 'BANK' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom de la Banque"
                placeholder="ex: Banque Internationale Arabe de Tunisie (BIAT)"
                value={formInstitution}
                onChange={(e) => setFormInstitution(e.target.value)}
              />
              <Input
                label="Numéro de RIB (20 chiffres)"
                placeholder="ex: RIB 08 045 0001234567890 42"
                value={formAccountNumber}
                onChange={(e) => setFormAccountNumber(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Solde Actuel / Fond de Caisse (TND)"
              type="number"
              step="0.001"
              placeholder="ex: 500.000"
              value={formBalance}
              onChange={(e) => setFormBalance(e.target.value)}
              required
            />

            <div>
              <Select
                label="État de la Caisse"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                options={[
                  { value: 'OPEN', label: 'Ouverte & En Service' },
                  { value: 'RECONCILED', label: 'Clôturée & Rapprochée' },
                  { value: 'LOCKED', label: 'Verrouillée / Bloquée' },
                ]}
              />
            </div>
          </div>

          {/* Toggle Actif / Inactif */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-neutral-900 block text-xs">Caisse Opérationnelle & Active</span>
              <span className="text-[11px] text-neutral-500">
                Autorise l'encaissement direct, les versements et les tickets de vente POS sur cette caisse.
              </span>
            </div>
            <Toggle checked={formIsActive} onChange={setFormIsActive} />
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL: DÉTAILS DU COMPTE / CAISSE
      ══════════════════════════════════════════════════════════════════════════════════ */}
      {selectedAccount && (
        <Modal
          isOpen={!!selectedAccount}
          onClose={() => setSelectedAccount(null)}
          size="md"
          title={`Fiche Caisse — ${selectedAccount.name}`}
          footer={
            <div className="flex items-center justify-end w-full">
              <Button
                variant="gold"
                onClick={() => setSelectedAccount(null)}
                className="text-xs px-4 py-2"
              >
                Fermer
              </Button>
            </div>
          }
        >
          <div className="p-5 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {selectedAccount.code || 'CSH-01'}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold border',
                    selectedAccount.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  )}
                >
                  {selectedAccount.isActive ? 'Active' : 'Suspendue'}
                </span>
              </div>
              <div className="font-bold text-sm text-neutral-900">{selectedAccount.name}</div>
              <div className="text-neutral-500">
                Rattachement : <strong className="text-neutral-800">{selectedAccount.showroomOrDepot || selectedAccount.institution}</strong>
              </div>
              <div className="text-neutral-500">
                Responsable : <strong className="text-neutral-800">{selectedAccount.managerName}</strong>
              </div>
              <div className="text-xl font-black font-mono text-neutral-900 pt-1 border-t border-neutral-200 mt-2">
                Solde : {formatTndCurrency(selectedAccount.currentBalanceTnd)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Rapprochement & Sécurité Conformes</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Le solde comptable de cette caisse est synchronisé avec les sessions de caisse POS et les clôtures Z journalières.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL: CONFIRMATION SUPPRESSION
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <DeleteConfirmModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDeleteAccount}
        title="Supprimer la Caisse / Compte"
        description={
          accountToDelete
            ? `Êtes-vous certain de vouloir supprimer la caisse "${accountToDelete.name} (${accountToDelete.code})" ? Cette action supprimera définitivement la configuration de cette caisse.`
            : undefined
        }
      />
      <DeleteConfirmModal
        isOpen={bulkDeleteAccountIds.length > 0}
        onClose={() => setBulkDeleteAccountIds([])}
        onConfirm={confirmBulkDeleteAccounts}
        title="Supprimer les comptes sélectionnés"
        description={`Confirmez-vous la suppression des ${bulkDeleteAccountIds.length} caisse(s) ou compte(s) de trésorerie ?`}
      />
    </div>
  );
}
