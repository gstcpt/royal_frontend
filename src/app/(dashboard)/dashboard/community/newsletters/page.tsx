'use client';

import * as React from 'react';
import {
  Send,
  Trash2,
  Clock,
  Mail,
  UserCheck,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { EmailTemplateComposer, EmailComposerLocale } from '@/components/dashboard/EmailTemplateComposer';
import {
  Button,
  Badge,
  Modal,
  Toast,
  Breadcrumb,
  DeleteConfirmModal,
  DateRangePicker,
  DateRange,
  FilterDropdown,
} from '@/components/ui';

interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  isActive: boolean;
  campaignsReceived: number;
  createdAt: string;
}

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'À l’instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return new Date(dateString).toLocaleDateString('fr-FR');
}

export default function NewslettersPage() {
  const [subscribers, setSubscribers] = React.useState<NewsletterSubscriber[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = React.useState(false);
  const [campaignLocale, setCampaignLocale] = React.useState<EmailComposerLocale>('FR');
  const [campaignTemplateId, setCampaignTemplateId] = React.useState<string>('');
  const [campaignSubject, setCampaignSubject] = React.useState('');
  const [campaignBody, setCampaignBody] = React.useState('');
  const [campaignPromoCode, setCampaignPromoCode] = React.useState('ROYALVIP');
  const [campaignDiscountPercent, setCampaignDiscountPercent] = React.useState('15');
  const [campaignUrl, setCampaignUrl] = React.useState('https://royal.com.tn/articles');
  const [campaignTarget, setCampaignTarget] = React.useState<'ACTIVE' | 'SELECTED' | 'TEST'>('ACTIVE');
  const [campaignTestEmail, setCampaignTestEmail] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'info' | 'error'>('success');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [singleDeleteId, setSingleDeleteId] = React.useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [dateRange, setDateRange] = React.useState<DateRange>({ startDate: '', endDate: '' });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);

  const loadSubscribers = React.useCallback(async () => {
    try {
      const res = await fetchApi('/storefront-cms/newsletters');
      const list = Array.isArray(res) ? res : res?.data || [];
      if (Array.isArray(list)) {
        setSubscribers(
          list.map((s: any) => ({
            id: s.id,
            email: s.email,
            source: s.source || 'Storefront Royal',
            isActive: Boolean(s.isActive),
            campaignsReceived: Number(s.campaignsReceived || 0),
            createdAt: s.createdAt,
          }))
        );
      }
    } catch {
      setToastType('error');
      setToastMessage('Impossible de charger les abonnés newsletter depuis PostgreSQL.');
    }
  }, []);

  React.useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  const activeCount = subscribers.filter((s) => s.isActive).length;

  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await fetchApi(`/storefront-cms/newsletters/${id}`, { method: 'PATCH' });
      const nextState = updated?.data?.isActive ?? updated?.isActive;
      setSubscribers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: typeof nextState === 'boolean' ? nextState : !s.isActive } : s))
      );
      setToastType('info');
      setToastMessage('Statut abonné mis à jour.');
    } catch {
      setToastType('error');
      setToastMessage('Erreur lors du changement de statut.');
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignSubject.trim() || !campaignBody.trim()) return;
    if (campaignTarget === 'TEST' && !campaignTestEmail.trim()) {
      setToastType('error');
      setToastMessage('Saisissez une adresse e-mail de test.');
      return;
    }
    setIsSending(true);
    try {
      const res = await fetchApi('/storefront-cms/newsletters/send-campaign', {
        method: 'POST',
        body: JSON.stringify({
          templateId: campaignTemplateId || undefined,
          locale: campaignLocale,
          subject: campaignSubject.trim(),
          bodyHtml: campaignBody.trim(),
          promoCode: campaignPromoCode.trim() || undefined,
          discountPercent: campaignDiscountPercent.trim() || undefined,
          campaignUrl: campaignUrl.trim() || undefined,
          target: campaignTarget,
          subscriberIds: campaignTarget === 'SELECTED' ? selectedIds : undefined,
          testEmail: campaignTarget === 'TEST' ? campaignTestEmail.trim() : undefined,
        }),
      });
      await loadSubscribers();
      if (campaignTarget !== 'TEST') {
        setIsCampaignModalOpen(false);
      }
      setToastType('success');
      setToastMessage(res?.message || `Campagne (${campaignLocale}) envoyée avec succès.`);
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Erreur lors de la diffusion SMTP de la campagne.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSubscribers.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const toDelete = [...selectedIds];
    setSubscribers((prev) => prev.filter((s) => !toDelete.includes(s.id)));
    setSelectedIds([]);
    setDeleteConfirmOpen(false);
    await Promise.all(
      toDelete.map((id) => fetchApi(`/storefront-cms/newsletters/${id}`, { method: 'DELETE' }).catch(() => null))
    );
    setToastType('info');
    setToastMessage('Les abonnés sélectionnés ont été supprimés.');
  };

  const handleBulkNewsletterStatus = async (targetActive: boolean) => {
    if (selectedIds.length === 0) return;
    const toToggle = subscribers.filter(
      (s) => selectedIds.includes(s.id) && s.isActive !== targetActive
    );
    await Promise.allSettled(
      toToggle.map((s) => fetchApi(`/storefront-cms/newsletters/${s.id}`, { method: 'PATCH' }))
    );
    setSubscribers((prev) =>
      prev.map((s) => (selectedIds.includes(s.id) ? { ...s, isActive: targetActive } : s))
    );
    setToastType('success');
    setToastMessage(
      `${selectedIds.length} abonné(s) ${targetActive ? 'activé(s)' : 'désabonné(s)'}.`
    );
    setSelectedIds([]);
  };

  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteId) return;
    const id = singleDeleteId;
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    setSingleDeleteId(null);
    await fetchApi(`/storefront-cms/newsletters/${id}`, { method: 'DELETE' }).catch(() => null);
    setToastType('info');
    setToastMessage('Abonné supprimé.');
  };

  // Filtered subscribers
  const filteredSubscribers = React.useMemo(() => {
    return subscribers.filter((s) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = s.email.toLowerCase().includes(q) || s.source.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status
      if (statusFilter === 'ACTIVE' && !s.isActive) return false;
      if (statusFilter === 'INACTIVE' && s.isActive) return false;

      // Date & Time Range
      if (dateRange.startDate) {
        const start = new Date(dateRange.startDate);
        if (!dateRange.startDate.includes('T')) start.setHours(0, 0, 0, 0);
        if (new Date(s.createdAt) < start) return false;
      }
      if (dateRange.endDate) {
        const end = new Date(dateRange.endDate);
        if (!dateRange.endDate.includes('T')) end.setHours(23, 59, 59, 999);
        if (new Date(s.createdAt) > end) return false;
      }

      return true;
    });
  }, [subscribers, search, statusFilter, dateRange]);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateRange.startDate, dateRange.endDate, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredSubscribers.length / pageSize));
  const paginatedSubscribers = React.useMemo(
    () => filteredSubscribers.slice((page - 1) * pageSize, page * pageSize),
    [filteredSubscribers, page, pageSize]
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[var(--royal-primary)] border border-[#E6D6A6] rounded-2xl shadow-sm">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
                  Gestion des Abonnés Newsletter
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
                  {activeCount} actif{activeCount > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Audience marketing opt-in, envois de campagnes promotionnelles et fidélisation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkNewsletterStatus(true)}
                  className="text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Activer ({selectedIds.length})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkNewsletterStatus(false)}
                  className="text-xs font-semibold text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  <span>Désabonner ({selectedIds.length})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Supprimer ({selectedIds.length})</span>
                </Button>
              </>
            )}

            <Button
              variant="gold"
              size="sm"
              onClick={() => setIsCampaignModalOpen(true)}
              className="text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Créer une Campagne</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await loadSubscribers();
                setToastType('info');
                setToastMessage('Liste des abonnés actualisée.');
              }}
              className="text-xs font-semibold"
              title="Actualiser"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Communauté', href: '/dashboard/section/community' },
              { label: 'Abonnés Newsletter' },
            ]}
          />
        </div>
      </div>

      {/* Unified Filter Bar: Search + DateRangePicker + Status + Reset */}
      <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm relative z-20 overflow-visible">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par adresse email, provenance..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
            />
          </div>

          {/* Unified Single DateRangePicker (with Date & Time) */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            onClear={() => setDateRange({ startDate: '', endDate: '' })}
            label="Période"
            className="shrink-0"
          />

          {/* Status Dropdown */}
          <FilterDropdown
            label="Statut"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              { label: `Actifs (${activeCount})`, value: 'ACTIVE' },
              { label: `Désabonnés (${subscribers.length - activeCount})`, value: 'INACTIVE' },
            ]}
            allLabel={`Tous (${subscribers.length})`}
          />

          {/* Reset Filters */}
          {(search || statusFilter !== 'ALL' || dateRange.startDate || dateRange.endDate) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="shrink-0 text-xs text-neutral-500 hover:text-neutral-900 font-semibold px-2.5 py-2 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
              title="Réinitialiser filtres"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Single Exclusive LIST VIEW DISPLAY */}
      <div className="space-y-3">
        {/* Bulk Selection Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-100/70 rounded-2xl border border-neutral-200/80 text-xs text-neutral-600 font-medium">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={
                filteredSubscribers.length > 0 &&
                selectedIds.length === filteredSubscribers.length
              }
              onChange={handleSelectAll}
              className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950 w-4 h-4 cursor-pointer"
            />
            <span>
              Sélectionner tout ({selectedIds.length}/{filteredSubscribers.length})
            </span>
          </label>
          <span className="text-[11px] text-neutral-400">
            {filteredSubscribers.length} abonné{filteredSubscribers.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Subscriber List Cards */}
        {filteredSubscribers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div className="font-bold text-neutral-800 text-sm">Aucun abonné trouvé</div>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Aucun contact ne correspond à vos filtres de recherche ou de statut.
            </p>
          </div>
        ) : (
          paginatedSubscribers.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={cn(
                  'group p-5 rounded-3xl border transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
                  item.isActive
                    ? 'bg-white border-neutral-200/80 hover:border-neutral-300 shadow-xs'
                    : 'bg-neutral-50/70 border-neutral-200/60 opacity-75'
                )}
              >
                {/* Left Area: Checkbox + Email + Source + Campaigns + Date */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={(e) => handleSelectOne(item.id, e)}
                    className="mt-0.5 sm:mt-0 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950 w-4 h-4 cursor-pointer shrink-0"
                  />

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-neutral-900 tracking-tight break-all">
                        {item.email}
                      </span>

                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Actif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                          <XCircle className="w-3 h-3" />
                          <span>Désabonné</span>
                        </span>
                      )}

                      <span className="text-neutral-300">•</span>

                      <span className="text-[11px] text-neutral-500 font-medium">
                        Source : <strong>{item.source}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 font-light">
                      <div className="flex items-center gap-1">
                        <Send className="w-3 h-3 text-neutral-400" />
                        <span>
                          <strong>{item.campaignsReceived}</strong> campagne{item.campaignsReceived > 1 ? 's' : ''} reçue{item.campaignsReceived > 1 ? 's' : ''}
                        </span>
                      </div>

                      <span className="text-neutral-300">•</span>

                      <div
                        className="flex items-center gap-1 font-mono text-[11px]"
                        title={new Date(item.createdAt).toLocaleString('fr-FR')}
                      >
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>Inscrit {formatRelativeTime(item.createdAt)}</span>
                        <span className="text-[10px] text-neutral-400 hidden sm:inline">
                          ({new Date(item.createdAt).toLocaleDateString('fr-FR')})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action Icons: Toggle Active/Unsubscribed + Delete */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => handleToggleStatus(item.id, e)}
                    title={item.isActive ? 'Désabonner ce contact' : 'Réactiver l’abonnement'}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer',
                      item.isActive
                        ? 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    )}
                  >
                    {item.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">Actif</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-neutral-400" />
                        <span className="hidden sm:inline">Désabonné</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSingleDeleteId(item.id)}
                    title="Supprimer cet abonné"
                    className="p-2 rounded-xl border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {filteredSubscribers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white rounded-2xl border border-neutral-200 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <span>Par page :</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-800 cursor-pointer"
              >
                {[6, 12, 24, 48, 96].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer font-semibold"
              >
                Précédent
              </button>
              <span className="font-semibold text-neutral-800">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer font-semibold"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GENEROUS 2-COLUMN MODAL WITH LIVE EMAIL PREVIEW & NO INNER SCROLLBAR */}
      {isCampaignModalOpen && (
        <Modal
          isOpen={isCampaignModalOpen}
          onClose={() => setIsCampaignModalOpen(false)}
          size="5xl"
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FBF6E8] text-[var(--royal-primary)] border border-[#E6D6A6] flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-lg text-neutral-900 tracking-tight">
                  Diffuser une Nouvelle Campagne Marketing
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Diffusion SMTP réelle (FR / AR RTL) — <strong>{activeCount} abonnés actifs</strong>{selectedIds.length > 0 ? ` • ${selectedIds.length} sélectionné(s)` : ''}.
                </p>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-xs"
              >
                Annuler
              </Button>

              <Button
                variant="gold"
                size="sm"
                onClick={handleSendCampaign}
                disabled={
                  isSending ||
                  !campaignSubject.trim() ||
                  !campaignBody.trim() ||
                  (campaignTarget === 'TEST' && !campaignTestEmail.trim()) ||
                  (campaignTarget === 'SELECTED' && selectedIds.length === 0)
                }
                className="text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>
                  {isSending
                    ? 'Transmission SMTP en cours...'
                    : campaignTarget === 'TEST'
                    ? 'Envoyer E-mail Test'
                    : campaignTarget === 'SELECTED'
                    ? `Envoyer à ${selectedIds.length} sélectionné(s)`
                    : `Diffuser à ${activeCount} abonné(s)`}
                </span>
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-4 text-xs">
            {/* Target & Campaign Promo Params */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] items-end">
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Destinataires *
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {([
                    { id: 'ACTIVE', label: `Actifs (${activeCount})` },
                    { id: 'SELECTED', label: `Coche (${selectedIds.length})` },
                    { id: 'TEST', label: 'Test' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={opt.id === 'SELECTED' && selectedIds.length === 0}
                      onClick={() => setCampaignTarget(opt.id)}
                      className={cn(
                        'py-2 px-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer disabled:opacity-40',
                        campaignTarget === opt.id
                          ? 'bg-[#C59B27] border-[#C59B27] text-white'
                          : 'bg-white border-[#E6E1D6] text-slate-700',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {campaignTarget === 'TEST' ? (
                <div className="md:col-span-4 space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Adresse E-mail de Test *
                  </label>
                  <input
                    type="email"
                    value={campaignTestEmail}
                    onChange={(e) => setCampaignTestEmail(e.target.value)}
                    placeholder="exemple@domaine.tn"
                    className="w-full h-9 px-3 rounded-xl border border-[#E6E1D6] bg-white text-xs"
                  />
                </div>
              ) : (
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Code Promo
                  </label>
                  <input
                    type="text"
                    value={campaignPromoCode}
                    onChange={(e) => setCampaignPromoCode(e.target.value)}
                    placeholder="ROYALVIP"
                    className="w-full h-9 px-3 rounded-xl border border-[#E6E1D6] bg-white text-xs font-mono"
                  />
                </div>
              )}

              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Remise %
                </label>
                <input
                  type="text"
                  value={campaignDiscountPercent}
                  onChange={(e) => setCampaignDiscountPercent(e.target.value)}
                  placeholder="15"
                  className="w-full h-9 px-3 rounded-xl border border-[#E6E1D6] bg-white text-xs"
                />
              </div>

              <div className={campaignTarget === 'TEST' ? 'md:col-span-2 space-y-1' : 'md:col-span-3 space-y-1'}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Lien Offre (URL)
                </label>
                <input
                  type="text"
                  value={campaignUrl}
                  onChange={(e) => setCampaignUrl(e.target.value)}
                  placeholder="https://royal.com.tn/articles"
                  className="w-full h-9 px-3 rounded-xl border border-[#E6E1D6] bg-white text-xs"
                />
              </div>
            </div>

            <EmailTemplateComposer
              category="campaign"
              locale={campaignLocale}
              onLocaleChange={setCampaignLocale}
              selectedTemplateId={campaignTemplateId}
              onTemplateChange={(tpl) => {
                setCampaignTemplateId(tpl?.id || '');
                if (tpl && !campaignSubject.trim()) {
                  setCampaignSubject(campaignLocale === 'AR' ? tpl.subjectAr || tpl.subject : tpl.subject);
                }
                if (tpl && !campaignBody.trim()) {
                  setCampaignBody(campaignLocale === 'AR' ? tpl.bodyHtmlAr || tpl.bodyHtml : tpl.bodyHtml);
                }
              }}
              subject={campaignSubject}
              onSubjectChange={setCampaignSubject}
              bodyText={campaignBody}
              onBodyTextChange={setCampaignBody}
              bodyRows={6}
              recipientSummary={
                campaignTarget === 'TEST'
                  ? `Test -> ${campaignTestEmail || '...'}`
                  : campaignTarget === 'SELECTED'
                  ? `${selectedIds.length} sélectionné(s)`
                  : `${activeCount} abonnés actifs`
              }
              previewVariables={{
                firstName: campaignLocale === 'AR' ? 'حريفنا الكريم' : 'Sami',
                promoCode: campaignPromoCode || 'ROYALVIP',
                discountPercent: campaignDiscountPercent || '15',
                campaignUrl: campaignUrl || 'https://royal.com.tn/articles',
              }}
            />
          </div>
        </Modal>
      )}

      {/* Confirmation Modal Multiple Delete */}
      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteSelected}
        itemName={`${selectedIds.length} abonné(s)`}
      />

      {/* Confirmation Modal Single Delete */}
      <DeleteConfirmModal
        isOpen={Boolean(singleDeleteId)}
        onClose={() => setSingleDeleteId(null)}
        onConfirm={handleConfirmSingleDelete}
        itemName="cet abonné"
      />

      {/* Feedback Toast */}
      {toastMessage && (
        <Toast
          isOpen={Boolean(toastMessage)}
          onClose={() => setToastMessage(null)}
          message={toastMessage}
          type={toastType}
        />
      )}
    </div>
  );
}
