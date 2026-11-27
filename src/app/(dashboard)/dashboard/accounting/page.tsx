'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  Calendar,
  BookOpen,
  DollarSign,
  Printer,
  Eye,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal, DeleteConfirmModal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Select } from '@/components/ui/select';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';

export interface AccountingEntryItem {
  id: string;
  entryNumber: string; // ex: ECR-2026-042
  journalType: 'VENTES' | 'ACHATS' | 'BANQUE' | 'CAISSE' | 'OD';
  accountCode: string; // Plan comptable tunisien (ex: 707100, 411000, 532000)
  accountLabel: string;
  pieceReference: string; // ex: FACT-2026-001 ou BE-2026-001
  label: string;
  debitTnd: number;
  creditTnd: number;
  entryDate: string;
  createdAt: string;
}

export default function AccountingLedgerPage() {
  const [entries, setEntries] = useState<AccountingEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [previewEntry, setPreviewEntry] = useState<AccountingEntryItem | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [bulkDeleteEntryIds, setBulkDeleteEntryIds] = useState<string[]>([]);

  const [filterJournal, setFilterJournal] = useState<string>('ALL');

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/accountingEntries');
      const list = res?.value || res?.data?.value || [];
      setEntries(Array.isArray(list) ? list : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const persistEntries = async (next: AccountingEntryItem[], msg: string) => {
    const previous = entries;
    setEntries(next);
    try {
      await fetchApi('/storefront-cms/sys-config/accountingEntries', {
        method: 'PUT',
        body: JSON.stringify({ value: next }),
      });
      setFeedbackMessage({ text: msg, type: 'success' });
    } catch (err: any) {
      setEntries(previous);
      setFeedbackMessage({
        text: err?.message || 'Erreur lors de la sauvegarde des écritures.',
        type: 'error',
      });
    }
  };

  const handleBulkJournalChange = async (journalType: AccountingEntryItem['journalType']) => {
    if (selectedEntryIds.length === 0) return;
    const idSet = new Set(selectedEntryIds);
    await persistEntries(
      entries.map((e) => (idSet.has(e.id) ? { ...e, journalType } : e)),
      `${selectedEntryIds.length} écriture(s) réaffectée(s) au journal ${journalType}.`
    );
    setSelectedEntryIds([]);
  };

  const confirmBulkDeleteEntries = async () => {
    if (bulkDeleteEntryIds.length === 0) return;
    const idSet = new Set(bulkDeleteEntryIds);
    await persistEntries(
      entries.filter((e) => !idSet.has(e.id)),
      `${bulkDeleteEntryIds.length} écriture(s) comptable(s) supprimée(s).`
    );
    setBulkDeleteEntryIds([]);
    setSelectedEntryIds([]);
  };

  // Stats KPIs
  const stats = useMemo(() => {
    const total = entries.length;
    const totalDebit = entries.reduce((acc, e) => acc + e.debitTnd, 0);
    const totalCredit = entries.reduce((acc, e) => acc + e.creditTnd, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    return { total, totalDebit, totalCredit, isBalanced };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (filterJournal === 'ALL') return entries;
    return entries.filter((e) => e.journalType === filterJournal);
  }, [entries, filterJournal]);

  // Colonnes DataTable Master
  const columns: ColumnDef<AccountingEntryItem>[] = [
    {
      key: 'entryNumber',
      header: 'N° Écriture',
      sortable: true,
      sortValue: (row) => row.entryNumber,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            ECR
          </div>
          <div>
            <span className="font-mono font-bold text-neutral-900 text-xs block">
              {row.entryNumber}
            </span>
            <span className="text-[10px] text-neutral-500">
              Journal {row.journalType}
            </span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.entryNumber} (${row.journalType})`,
    },
    {
      key: 'accountCode',
      header: 'Compte Général',
      sortable: true,
      sortValue: (row) => row.accountCode,
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 text-xs block">
            {row.accountCode}
          </span>
          <span className="text-[11px] text-neutral-500 truncate max-w-[200px] block">
            {row.accountLabel}
          </span>
        </div>
      ),
      printRender: (row) => `${row.accountCode} - ${row.accountLabel}`,
    },
    {
      key: 'label',
      header: 'Libellé de l’Écriture & Pièce',
      sortable: true,
      sortValue: (row) => row.label,
      render: (row) => (
        <div>
          <div className="font-medium text-neutral-900 text-xs">{row.label}</div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            Pièce : {row.pieceReference}
          </div>
        </div>
      ),
      printRender: (row) => `${row.label} (Réf: ${row.pieceReference})`,
    },
    {
      key: 'debitTnd',
      header: 'Débit (TND)',
      sortable: true,
      sortValue: (row) => row.debitTnd,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-neutral-900">
          {row.debitTnd > 0 ? formatTndCurrency(row.debitTnd) : '—'}
        </span>
      ),
      printRender: (row) => (row.debitTnd > 0 ? formatTndCurrency(row.debitTnd) : '0 TND'),
    },
    {
      key: 'creditTnd',
      header: 'Crédit (TND)',
      sortable: true,
      sortValue: (row) => row.creditTnd,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-neutral-900">
          {row.creditTnd > 0 ? formatTndCurrency(row.creditTnd) : '—'}
        </span>
      ),
      printRender: (row) => (row.creditTnd > 0 ? formatTndCurrency(row.creditTnd) : '0 TND'),
    },
    {
      key: 'createdAt',
      header: 'Date d’Écriture',
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
            onClick={() => setPreviewEntry(row)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-[#FBF6E8] hover:border-[#E6D6A6] text-neutral-700 hover:text-[#8C6400] transition shadow-2xs cursor-pointer"
            title="Consulter et imprimer la pièce comptable"
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
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type || 'success'}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Page Header Card (Master Layout Standard) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              Grand Livre & Journaux Comptables
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              PLAN COMPTABLE TUNISIEN
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Écritures en partie double conformes au plan comptable général, journaux de ventes, achats, trésorerie et clôtures.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Finance & Comptabilité', href: '/dashboard/treasury' },
              { label: 'Grand Livre' },
            ]}
          />
        </div>
      </div>

      {/* 4 KPIs Master */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Écritures Passées</span>
            <BookOpen className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">Lignes comptables</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Total Débit</span>
            <DollarSign className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {formatTndCurrency(stats.totalDebit)}
          </div>
          <div className="text-[11px] text-neutral-500">Total mouvements débit</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Total Crédit</span>
            <DollarSign className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {formatTndCurrency(stats.totalCredit)}
          </div>
          <div className="text-[11px] text-neutral-500">Total mouvements crédit</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Équilibre de Balance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {stats.isBalanced ? 'Équilibrée' : 'Écart Détecté'}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Partie double stricte</div>
        </div>
      </div>

      {/* DataTable Master */}
      <DataTable<AccountingEntryItem>
        data={filteredEntries}
        isLoading={loading}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedEntryIds}
        onSelectionChange={setSelectedEntryIds}
        onBulkDelete={(keys) => setBulkDeleteEntryIds(keys)}
        renderBulkActions={() => (
          <select
            value=""
            onChange={(e) => {
              const j = e.target.value as AccountingEntryItem['journalType'];
              if (j) handleBulkJournalChange(j);
            }}
            aria-label="Réaffecter au journal"
            className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
          >
            <option value="">Journal comptable...</option>
            <option value="VENTES">Journal Ventes</option>
            <option value="ACHATS">Journal Achats</option>
            <option value="BANQUE">Journal Banque</option>
            <option value="CAISSE">Journal Caisse</option>
            <option value="OD">Opérations Diverses</option>
          </select>
        )}
        searchPlaceholder="Rechercher par écriture ECR, compte général, pièce, libellé..."
        searchKeys={['entryNumber', 'accountCode', 'accountLabel', 'pieceReference', 'label']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Grand Livre & Écritures Comptables — Royal"
        exportFileName="grand_livre_royal"
        customFilters={[
          {
            key: 'journal',
            label: 'Journal',
            value: filterJournal,
            onChange: setFilterJournal,
            allLabel: 'Tous les journaux',
            options: [
              { value: 'VENTES', label: 'Journal Ventes' },
              { value: 'ACHATS', label: 'Journal Achats' },
              { value: 'BANQUE', label: 'Journal Banque' },
              { value: 'CAISSE', label: 'Journal Caisse' },
              { value: 'OD', label: 'Opérations Diverses' },
            ],
          },
        ]}
      />

      {previewEntry && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewEntry(null)}
          title={`Pièce Comptable : ${previewEntry.entryNumber}`}
          size="4xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Imprimer la Pièce
              </Button>
              <Button variant="gold" size="sm" onClick={() => setPreviewEntry(null)}>
                Fermer
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-5 text-xs">
            <DocumentPrintHeader
              docCode="ECR"
              docTitle="Pièce Comptable"
              reference={previewEntry.entryNumber}
              date={previewEntry.entryDate}
              status={`Journal ${previewEntry.journalType}`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Compte Général
                </span>
                <span className="font-bold text-neutral-900 font-mono">
                  {previewEntry.accountCode} — {previewEntry.accountLabel}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Pièce Justificative
                </span>
                <span className="font-bold text-neutral-900 font-mono">
                  {previewEntry.pieceReference}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Libellé de l&apos;Écriture
              </span>
              <p className="text-sm font-semibold text-neutral-900">{previewEntry.label}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono">
              <div className="p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] flex items-center justify-between">
                <span className="font-bold uppercase text-[#8C6400]">Débit</span>
                <span className="text-base font-black text-neutral-950">
                  {formatTndCurrency(previewEntry.debitTnd)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <span className="font-bold uppercase text-neutral-600">Crédit</span>
                <span className="text-base font-black text-neutral-950">
                  {formatTndCurrency(previewEntry.creditTnd)}
                </span>
              </div>
            </div>

            <DocumentPrintFooter docCode="ECR" reference={previewEntry.entryNumber} />
          </div>
        </Modal>
      )}
      <DeleteConfirmModal
        isOpen={bulkDeleteEntryIds.length > 0}
        onClose={() => setBulkDeleteEntryIds([])}
        onConfirm={confirmBulkDeleteEntries}
        title="Supprimer les écritures sélectionnées"
        description={`Confirmez-vous la suppression des ${bulkDeleteEntryIds.length} écriture(s) comptable(s) ?`}
      />
    </div>
  );
}
