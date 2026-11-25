'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Package,
  Printer,
  ShoppingCart,
  Truck,
  Warehouse,
  XCircle,
  Zap,
  ListChecks,
} from 'lucide-react';
import { Breadcrumb, Button, Modal, Toast } from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { cn, formatTndCurrency } from '@/lib/utils';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En Attente Validation (DTR)', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Approuvé — Prêt à Expédier', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  IN_TRANSIT: { label: 'En Transit (Sortie BS Effectuée)', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  COMPLETED: { label: 'Réceptionné & Clôturé (Entrée BE)', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: 'Annulé', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function TransferDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const { hasAnyRole } = useAuthStore();

  const canDecideTransfer = hasAnyRole(['ROOT', 'SUPER_ADMIN', 'WEBSITE_MANAGER', 'ADMIN']);

  const [transfer, setTransfer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'IMMEDIATE' | 'STEP_BY_STEP'>('IMMEDIATE');
  const [acceptNote, setAcceptNote] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    type: 'success',
  });

  const loadTransfer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchApi(`/transfers/${id}`);
      setTransfer(data);
    } catch {
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTransfer();
  }, [loadTransfer]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ open: true, message, type });
  };

  const handleAcceptRequest = async () => {
    if (!transfer) return;
    setSubmitting(true);
    try {
      await fetchApi(`/transfers/${transfer.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({
          mode: selectedMode,
          note: acceptNote.trim() || undefined,
        }),
      });
      setAcceptModalOpen(false);
      showToast(
        selectedMode === 'IMMEDIATE'
          ? 'Transfert exécuté immédiatement (Sortie BS + Entrée BE effectuées).'
          : 'Demande approuvée en mode Suivi par Étapes (prête pour expédition).',
      );
      await loadTransfer();
    } catch (err: any) {
      showToast(err?.message || 'Impossible de valider la demande de transfert.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepAction = async (action: 'dispatch' | 'receive' | 'cancel', successText: string) => {
    if (!transfer) return;
    setSubmitting(true);
    try {
      await fetchApi(`/transfers/${transfer.id}/${action}`, { method: 'POST' });
      showToast(successText, action === 'cancel' ? 'info' : 'success');
      await loadTransfer();
    } catch (err: any) {
      showToast(err?.message || 'Erreur lors de la mise à jour du statut.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-semibold text-neutral-500">
        Chargement de la fiche transfert...
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-sm font-bold text-neutral-700">Demande / Bon de Transfert introuvable.</p>
        <Link href="/dashboard/transfers" className="text-xs font-bold text-[#9A7414] hover:underline">
          ← Retour à la liste des transferts
        </Link>
      </div>
    );
  }

  const badge = STATUS_STYLE[transfer.status] || STATUS_STYLE.PENDING;
  const orderCustomerName = transfer.order?.customer
    ? `${transfer.order.customer.firstName} ${transfer.order.customer.lastName}`
    : transfer.order?.guestName || null;

  return (
    <div className="space-y-6 max-w-[1620px] mx-auto">
      <Toast
        isOpen={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      {/* Screen Header */}
      <div className="bg-white rounded-2xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/transfers"
            className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-[#FBF9F4] text-neutral-700 transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-heading font-black text-[#1D232E] font-mono">
                {transfer.requestRef || transfer.reference}
              </h1>
              {transfer.requestRef && (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                  Bon TRF : {transfer.reference}
                </span>
              )}
              <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border', badge.cls)}>
                {badge.label}
              </span>
              {transfer.requestType === 'SHOWROOM_PICKUP' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                  RÉASSORT RETRAIT SHOWROOM
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Créé le {new Date(transfer.createdAt).toLocaleString('fr-FR')}
              {transfer.acceptanceMode && ` • Mode choisi : ${transfer.acceptanceMode === 'IMMEDIATE' ? 'Exécution Immédiate' : 'Suivi par Étapes'}`}
            </p>
            <Breadcrumb
              className="mt-2"
              items={[
                { label: 'Stocks & Entrepôts', href: '/dashboard/section/stock' },
                { label: 'Mouvements de stock', href: '/dashboard/transfers' },
                { label: transfer.requestRef || transfer.reference },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => window.print()} className="text-xs px-3.5 py-2 flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer {transfer.status === 'PENDING' ? 'DTR' : 'TRF'}</span>
          </Button>

          {transfer.status === 'PENDING' && canDecideTransfer && (
            <Button
              variant="gold"
              disabled={submitting}
              onClick={() => setAcceptModalOpen(true)}
              className="text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accepter &amp; Choisir Mode</span>
            </Button>
          )}

          {(transfer.status === 'PENDING' || transfer.status === 'APPROVED') && (
            <Button
              variant="primary"
              disabled={submitting}
              onClick={() => handleStepAction('dispatch', `Transfert ${transfer.reference} expédié (Sortie BS effectuée).`)}
              className="text-xs px-4 py-2 bg-amber-600 text-white hover:bg-amber-700"
            >
              Expédier (BS ➔ En Transit)
            </Button>
          )}

          {transfer.status === 'IN_TRANSIT' && (
            <Button
              variant="primary"
              disabled={submitting}
              onClick={() => handleStepAction('receive', `Réception confirmée au dépôt cible (${transfer.reference}).`)}
              className="text-xs px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
            >
              Réceptionner au Quai Cible (BE)
            </Button>
          )}

          {(transfer.status === 'PENDING' || transfer.status === 'APPROVED') && canDecideTransfer && (
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => handleStepAction('cancel', 'Demande de transfert annulée.')}
              className="text-xs px-3.5 py-2 text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Annuler</span>
            </Button>
          )}
        </div>
      </div>

      {/* Printable Header */}
      <div className="bg-white rounded-2xl border border-[#E6E1D6] p-6 space-y-5 shadow-xs">
        <DocumentPrintHeader
          docCode={transfer.status === 'PENDING' ? 'DTR' : 'TRF'}
          docTitle={
            transfer.status === 'PENDING'
              ? 'Demande de Transfert Inter-Dépôts'
              : 'Bordereau de Transfert Inter-Dépôts'
          }
          reference={transfer.status === 'PENDING' ? transfer.requestRef || transfer.reference : transfer.reference}
          date={transfer.createdAt}
          status={transfer.status}
        />

        {/* Source -> Target Warehouses & Order / Showroom Context */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
          <div className="lg:col-span-7 p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-1">
                <Warehouse className="w-3 h-3" /> Dépôt Source (Expéditeur)
              </span>
              <div className="text-sm font-black text-neutral-900">{transfer.fromWarehouse?.name}</div>
              <div className="text-[11px] text-neutral-500 font-mono">
                {transfer.fromWarehouse?.code} • {transfer.fromWarehouse?.city}
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-[#C59B27] shrink-0" />

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Dépôt Cible (Récepteur)
              </span>
              <div className="text-sm font-black text-neutral-900">{transfer.toWarehouse?.name}</div>
              <div className="text-[11px] text-neutral-500 font-mono">
                {transfer.toWarehouse?.code} • {transfer.toWarehouse?.city}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
            {transfer.order ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ShoppingCart className="w-4 h-4 text-[#C59B27] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-neutral-900 truncate">
                      Commande : <span className="font-mono">{transfer.order.reference}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">
                      {orderCustomerName} • {formatTndCurrency(Number(transfer.order.totalAmount || 0))}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/dashboard/orders/${transfer.order.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[11px] font-bold text-[#9A7414] hover:border-[#C59B27] shrink-0"
                >
                  <span>Voir</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="text-neutral-500">Transfert logistique interne (hors commande client).</div>
            )}

            {transfer.showroom && (
              <div className="pt-2 border-t border-neutral-200 text-[11px] text-neutral-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  Showroom Retrait : <strong>{transfer.showroom.name}</strong> ({transfer.showroom.city})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {transfer.notes && (
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs text-neutral-700">
            <strong>Motif / Note :</strong> {transfer.notes}
          </div>
        )}

        {/* Items Table with Source & Target Stocks */}
        <div>
          <h2 className="font-bold text-sm text-[#1D232E] mb-2.5 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#C59B27]" />
            <span>Lignes de Transfert &amp; Disponibilités Stock ({transfer.items?.length || 0})</span>
          </h2>
          <div className="rounded-xl border border-neutral-200 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase text-neutral-500 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Article &amp; Variante</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Stock Dépôt Source</th>
                  <th className="py-2.5 px-3 text-right">Stock Showroom Cible</th>
                  <th className="py-2.5 px-3 text-right">Qté Demandée</th>
                  <th className="py-2.5 px-3 text-right">Qté Transférée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(transfer.items || []).map((it: any) => (
                  <tr key={it.id}>
                    <td className="py-2.5 px-3 font-semibold text-neutral-900">
                      {it.productName}
                      {it.variantName && it.variantName !== 'Standard' ? ` (${it.variantName})` : ''}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-500">{it.sku}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-neutral-800">
                      {it.sourceAvailableQty ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                      {it.targetAvailableQty ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#9A7414]">
                      {it.requestedQty}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {it.transferredQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Movements Audit */}
        {Array.isArray(transfer.movements) && transfer.movements.length > 0 && (
          <div>
            <h2 className="font-bold text-sm text-[#1D232E] mb-2.5 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#C59B27]" />
              <span>Journal Comptable Stock Associé (Sortie BS / Entrée BE)</span>
            </h2>
            <div className="rounded-xl border border-neutral-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase text-neutral-500 font-bold">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Dépôt</th>
                    <th className="py-2 px-3 text-right">Quantité</th>
                    <th className="py-2 px-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {transfer.movements.map((mv: any) => (
                    <tr key={mv.id}>
                      <td className="py-2 px-3 font-mono text-neutral-500">
                        {new Date(mv.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-neutral-900">{mv.type}</td>
                      <td className="py-2 px-3">{mv.stock?.warehouse?.name || '—'}</td>
                      <td className={cn('py-2 px-3 text-right font-mono font-bold', mv.quantityDelta < 0 ? 'text-rose-700' : 'text-emerald-700')}>
                        {mv.quantityDelta > 0 ? `+${mv.quantityDelta}` : mv.quantityDelta}
                      </td>
                      <td className="py-2 px-3 text-neutral-600">{mv.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DocumentPrintFooter
          docCode={transfer.status === 'PENDING' ? 'DTR' : 'TRF'}
          reference={transfer.status === 'PENDING' ? transfer.requestRef || transfer.reference : transfer.reference}
        />
      </div>

      {/* Accept Mode Choice Modal */}
      {acceptModalOpen && (
        <Modal
          isOpen={acceptModalOpen}
          onClose={() => setAcceptModalOpen(false)}
          size="2xl"
          title="Accepter la Demande de Transfert"
          subtitle="Choisissez entre l’exécution immédiate (BS + BE automatiques) ou le workflow séquentiel par étapes."
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setAcceptModalOpen(false)} className="text-xs px-4 py-2">
                Annuler
              </Button>
              <Button variant="gold" onClick={handleAcceptRequest} isLoading={submitting} className="text-xs px-5 py-2">
                Confirmer Validation
              </Button>
            </div>
          }
        >
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMode('IMMEDIATE')}
                className={cn(
                  'p-4 rounded-2xl border text-left space-y-1.5 transition cursor-pointer',
                  selectedMode === 'IMMEDIATE'
                    ? 'bg-[#FBF9F4] border-[#C59B27] ring-2 ring-[#C59B27]/20'
                    : 'bg-white border-neutral-200 hover:border-neutral-300',
                )}
              >
                <div className="flex items-center gap-2 font-heading font-bold text-sm text-[#1D232E]">
                  <Zap className="w-4 h-4 text-[#C59B27]" />
                  <span>Exécution Immédiate</span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Confirme le Bon de Transfert ({transfer.reference}), exécute la Sortie BS ({transfer.fromWarehouse?.name}) et l’Entrée BE ({transfer.toWarehouse?.name}) instantanément (`COMPLETED`).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('STEP_BY_STEP')}
                className={cn(
                  'p-4 rounded-2xl border text-left space-y-1.5 transition cursor-pointer',
                  selectedMode === 'STEP_BY_STEP'
                    ? 'bg-[#FBF9F4] border-[#C59B27] ring-2 ring-[#C59B27]/20'
                    : 'bg-white border-neutral-200 hover:border-neutral-300',
                )}
              >
                <div className="flex items-center gap-2 font-heading font-bold text-sm text-[#1D232E]">
                  <ListChecks className="w-4 h-4 text-sky-600" />
                  <span>Suivi par Étapes</span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Passe la demande à l’état <strong>APPROUVÉ</strong>, puis les équipes logistiques valident successivement <strong>Expédié (IN_TRANSIT)</strong> et <strong>Réceptionné (COMPLETED)</strong>.
                </p>
              </button>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Note d’instruction logistique (optionnelle)</label>
              <input
                type="text"
                value={acceptNote}
                onChange={(e) => setAcceptNote(e.target.value)}
                placeholder="Ex: Priorité préparation client pour retrait ce soir..."
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-neutral-900"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
