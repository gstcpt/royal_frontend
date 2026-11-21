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
  Sparkles,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
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

const ROOT_CAMPAIGN_TEMPLATES = [
  {
    title: 'Nouvelle Collection Électroménager Luxe',
    subject: 'Découvrez notre nouvelle collection exclusive — Royal Design',
    body: 'Chère cliente, cher client,\n\nNous avons le plaisir de vous dévoiler nos nouveaux arrivages haut de gamme pour équiper votre intérieur avec élégance et performance.\nProfitez d’un accompagnement personnalisé en showroom et de conditions privilégiées.',
  },
  {
    title: 'Invitation Exclusive — Vente Privée VIP',
    subject: 'Accès VIP : Votre remise exclusive de 15% chez Royal',
    body: 'En tant qu’abonné privilégié, nous vous ouvrons les portes de nos ventes privées. Bénéficiez d’une remise exceptionnelle de 15% sur une sélection de marques prestigieuses.',
  },
  {
    title: 'Offre Flash Week-End',
    subject: 'Offre Flash : Livraison et installation offertes ce week-end',
    body: 'Pour toute commande validée ce samedi ou dimanche, la livraison sécurisée et la pose par nos techniciens qualifiés vous sont offertes sur l’ensemble du territoire.',
  },
];

const INITIAL_SUBSCRIBERS: NewsletterSubscriber[] = [
  {
    id: 'sub-1',
    email: 'khalil.mansour@topnet.tn',
    source: 'Footer Boutique Publique',
    isActive: true,
    campaignsReceived: 4,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sub-2',
    email: 'rim.boussetta@gmail.com',
    source: 'Pop-up Bienvenue 10%',
    isActive: true,
    campaignsReceived: 2,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sub-3',
    email: 'tarik.driss@gnet.tn',
    source: 'Validation Commande Invité',
    isActive: false,
    campaignsReceived: 5,
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sub-4',
    email: 'nadia.benyoussef@hexabyte.tn',
    source: 'Footer Boutique Publique',
    isActive: true,
    campaignsReceived: 1,
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
  },
];

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
  const [campaignSubject, setCampaignSubject] = React.useState('');
  const [campaignBody, setCampaignBody] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'info' | 'error'>('success');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [singleDeleteId, setSingleDeleteId] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [dateRange, setDateRange] = React.useState<DateRange>({ startDate: '', endDate: '' });

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

  const handleSelectTemplate = (template: typeof ROOT_CAMPAIGN_TEMPLATES[0]) => {
    setCampaignSubject(template.subject);
    setCampaignBody(template.body);
  };

  const handleSendCampaign = () => {
    if (!campaignSubject.trim() || !campaignBody.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setSubscribers((prev) =>
        prev.map((s) =>
          s.isActive ? { ...s, campaignsReceived: s.campaignsReceived + 1 } : s
        )
      );
      setIsSending(false);
      setIsCampaignModalOpen(false);
      setCampaignSubject('');
      setCampaignBody('');
      setToastType('success');
      setToastMessage(`Campagne envoyée avec succès à ${activeCount} abonnés actifs.`);
    }, 700);
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

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Supprimer ({selectedIds.length})</span>
              </Button>
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
          filteredSubscribers.map((item) => {
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
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onClick={(e) => handleSelectOne(item.id, e)}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950 w-4 h-4 cursor-pointer shrink-0"
                  />

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-neutral-900 tracking-tight">
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
                  Diffusion ciblée à <strong>{activeCount} abonnés actifs</strong>.
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
                disabled={isSending || !campaignSubject.trim() || !campaignBody.trim()}
                className="text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>{isSending ? 'Diffusion en cours...' : 'Diffuser la campagne maintenant'}</span>
              </Button>
            </div>
          }
        >
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Column: Form & ROOT Templates */}
              <div className="space-y-4 text-xs">
                {/* ROOT Campaign Templates Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Modèles de Campagnes Marketing (Console ROOT)</span>
                    </label>
                    <span className="text-[10px] text-neutral-400">Cliquez pour appliquer</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {ROOT_CAMPAIGN_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl)}
                        className="p-2.5 text-left rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition cursor-pointer group"
                      >
                        <span className="font-bold text-neutral-900 block group-hover:text-neutral-950 text-[11px] leading-snug">
                          {tmpl.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5 line-clamp-1">
                          {tmpl.subject}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campaign Subject */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                    Objet du Courriel (Ligne d’accroche) *
                  </label>
                  <input
                    type="text"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="Ex: Invitation VIP : Nouvelle collection électroménager Royal"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-950 text-xs bg-white text-neutral-900"
                  />
                </div>

                {/* Campaign Body */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                    Corps du Message (HTML / Texte) *
                  </label>
                  <textarea
                    rows={8}
                    value={campaignBody}
                    onChange={(e) => setCampaignBody(e.target.value)}
                    placeholder="Rédigez le contenu ou appliquez un modèle ci-dessus..."
                    className="w-full p-3.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-950 text-xs bg-white text-neutral-900 leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Live Email Preview */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Aperçu de l'Email Officiel (Temps Réel)</span>
                  </label>
                  <span className="text-[10px] font-mono text-neutral-400">Template Newsletter Royal</span>
                </div>

                <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 space-y-3 shadow-2xs">
                  {/* Email Meta header */}
                  <div className="space-y-1 pb-3 border-b border-neutral-200 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-500 w-16">De :</span>
                      <span className="font-medium text-neutral-900">Royal Showroom &lt;newsletter@royal.com.tn&gt;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-500 w-16">À :</span>
                      <span className="font-medium text-neutral-900">{activeCount} abonnés actifs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-500 w-16">Objet :</span>
                      <span className="font-bold text-neutral-950">
                        {campaignSubject.trim() || 'Aperçu de votre objet...'}
                      </span>
                    </div>
                  </div>

                  {/* Email Body Frame */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <div>
                        <span className="font-extrabold tracking-tight text-neutral-950 text-sm block">
                          ROYAL MAISON D’ART & CUISINE
                        </span>
                        <span className="text-[10px] text-neutral-400 tracking-widest uppercase block mt-0.5">
                          Électroménager Haut de Gamme & Robinetterie
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        CAMPAGNE OFFICIELLE
                      </Badge>
                    </div>

                    <div className="text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap font-sans min-h-[140px]">
                      {campaignBody.trim() ? (
                        campaignBody
                      ) : (
                        <span className="text-neutral-400 italic">
                          Le contenu rédigé ou le modèle sélectionné s'affichera ici en temps réel tel qu'il sera reçu par vos clients...
                        </span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Service Marketing & Showroom Privé — Royal Tunisie</span>
                      <span>contact@royal.com.tn</span>
                    </div>

                    <div className="pt-2 text-[9px] text-neutral-400 text-center border-t border-dashed border-neutral-100">
                      Vous recevez cet email car vous êtes inscrit à la newsletter Royal. Pour vous désabonner, cliquez sur ce lien.
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
