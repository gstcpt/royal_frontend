'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Search,
  Printer,
  Inbox,
  Archive,
  RefreshCw,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Headphones,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import {
  Button,
  Badge,
  Toast,
  Breadcrumb,
  DateRangePicker,
  DateRange,
  FilterDropdown,
} from '@/components/ui';

export interface SupportMessageItem {
  id: string;
  senderId?: string | null;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface AdminSupportThreadItem {
  id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  messages: SupportMessageItem[];
}

const SUPPORT_QUICK_TEMPLATES = [
  {
    label: 'Prise en charge SAV',
    text: 'Bonjour,\n\nVotre ticket a bien été pris en charge par notre service support client Royal. Nous vérifions les informations de votre dossier et revenons vers vous très rapidement.',
  },
  {
    label: 'Suivi expédition colis',
    text: 'Bonjour,\n\nVotre commande est en cours de préparation / acheminement avec notre partenaire logistique. Notre livreur vous contactera par téléphone avant passage.',
  },
  {
    label: 'Demande complément',
    text: 'Bonjour,\n\nAfin de finaliser le traitement de votre demande, pourriez-vous nous confirmer votre référence de commande (#CMD) ou nous communiquer un créneau de disponibilité ?',
  },
  {
    label: 'Résolution & clôture',
    text: 'Bonjour,\n\nLe nécessaire a été effectué sur votre dossier. N’hésitez pas à rouvrir ce fil ou à nous solliciter depuis votre Espace Client pour toute autre assistance.',
  },
];

const STATUS_META: Record<
  AdminSupportThreadItem['status'],
  { label: string; badgeVariant: 'warning' | 'info' | 'success' }
> = {
  OPEN: { label: 'Ouvert · Non traité', badgeVariant: 'warning' },
  IN_PROGRESS: { label: 'En cours', badgeVariant: 'info' },
  RESOLVED: { label: 'Résolu / Clôturé', badgeVariant: 'success' },
};

export default function SupportMessagesPage() {
  const [threads, setThreads] = React.useState<AdminSupportThreadItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeFolder, setActiveFolder] = React.useState<'INBOX' | 'IN_PROGRESS' | 'RESOLVED' | 'ALL'>('INBOX');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [dateRange, setDateRange] = React.useState<DateRange>({ startDate: '', endDate: '' });
  const [selectedThreadId, setSelectedThreadId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [statusUpdating, setStatusUpdating] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [toast, setToast] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadThreads = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/support/admin/threads');
      const list: AdminSupportThreadItem[] = Array.isArray(res) ? res : res?.data || [];
      setThreads(list);
      setSelectedThreadId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id || null;
      });
    } catch (err: any) {
      setToast({ text: err?.message || 'Erreur lors du chargement des tickets support.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const counts = React.useMemo(() => {
    const inbox = threads.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const open = threads.filter((t) => t.status === 'OPEN').length;
    const inProgress = threads.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = threads.filter((t) => t.status === 'RESOLVED').length;
    return { inbox, open, inProgress, resolved, all: threads.length };
  }, [threads]);

  const filteredThreads = React.useMemo(() => {
    return threads.filter((t) => {
      if (activeFolder === 'INBOX' && t.status === 'RESOLVED') return false;
      if (activeFolder === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
      if (activeFolder === 'RESOLVED' && t.status !== 'RESOLVED') return false;

      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const customerName = `${t.customer?.firstName || ''} ${t.customer?.lastName || ''}`.toLowerCase();
        const hay = `${t.subject} ${customerName} ${t.customer?.email || ''} ${t.customer?.phone || ''} ${t.messages
          .map((m) => m.body)
          .join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (dateRange.startDate || dateRange.endDate) {
        const ts = new Date(t.updatedAt || t.createdAt).getTime();
        if (dateRange.startDate) {
          const start = new Date(dateRange.startDate).getTime();
          if (ts < start) return false;
        }
        if (dateRange.endDate) {
          const end = new Date(dateRange.endDate).getTime() + 86400000;
          if (ts > end) return false;
        }
      }

      return true;
    });
  }, [threads, activeFolder, statusFilter, searchQuery, dateRange]);

  const activeThread = React.useMemo(() => {
    return (
      filteredThreads.find((t) => t.id === selectedThreadId) ||
      threads.find((t) => t.id === selectedThreadId) ||
      filteredThreads[0] ||
      null
    );
  }, [filteredThreads, threads, selectedThreadId]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await fetchApi(`/storefront-cms/support/admin/threads/${activeThread.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim() }),
      });
      setReplyText('');
      setShowPreview(false);
      setToast({ text: 'Réponse officielle enregistrée dans la discussion client.', type: 'success' });
      await loadThreads();
    } catch (err: any) {
      setToast({ text: err?.message || 'Impossible d’envoyer la réponse.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (threadId: string, status: AdminSupportThreadItem['status']) => {
    setStatusUpdating(true);
    try {
      await fetchApi(`/storefront-cms/support/admin/threads/${threadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setToast({ text: `Statut du ticket mis à jour (${STATUS_META[status].label}).`, type: 'success' });
      await loadThreads();
    } catch (err: any) {
      setToast({ text: err?.message || 'Erreur lors de la mise à jour du statut.', type: 'error' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setDateRange({ startDate: '', endDate: '' });
  };

  const customerDisplay = activeThread?.customer
    ? `${activeThread.customer.firstName} ${activeThread.customer.lastName}`.trim()
    : 'Client Boutique Royal';

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto">
      <Toast
        isOpen={!!toast}
        message={toast?.text || ''}
        type={toast?.type || 'success'}
        onClose={() => setToast(null)}
      />

      {/* 1. Header Card + Source Distinction */}
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                  Messagerie Support &amp; SAV Clients
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Source : Espace Client Connecté
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fils de discussion multi-tours ouverts par vos clients connectés (SAV, suivi commande, litiges), distincts du{' '}
                <Link href="/dashboard/community/contacts" className="text-[#9A7414] font-semibold hover:underline">
                  formulaire Contact public
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/community/contacts"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E6E1D6] bg-[#FBF9F4] hover:border-[#C59B27] text-xs font-bold text-[#1D232E] transition"
            >
              <Mail className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Voir Messages Contact Public</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
            <Button
              variant="outline"
              onClick={loadThreads}
              className="text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Actualiser</span>
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <Breadcrumb
            items={[
              { label: 'Communauté', href: '/dashboard/section/community' },
              { label: 'Support Clients' },
            ]}
          />
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <AlertCircle className="w-3.5 h-3.5" />
              {counts.open} ticket(s) ouvert(s)
            </span>
            <span>•</span>
            <span>{counts.inProgress} en cours</span>
            <span>•</span>
            <span className="text-emerald-700">{counts.resolved} résolu(s)</span>
          </div>
        </div>
      </div>

      {/* 2. Unified Filter Bar (Aligned with Contacts Inbox) */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E1D6] shadow-xs flex flex-wrap items-center gap-3 no-print">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par sujet, nom client, email, téléphone ou contenu..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E6E1D6] bg-[#FBF9F4] text-xs text-[#1D232E] focus:outline-none focus:border-[#C59B27] focus:bg-white transition"
          />
        </div>

        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          onClear={() => setDateRange({ startDate: '', endDate: '' })}
          label="Période ticket"
          showTime={false}
        />

        <FilterDropdown
          label="Statut"
          value={statusFilter}
          onChange={setStatusFilter}
          allLabel="Tous les statuts"
          options={[
            { value: 'OPEN', label: 'Ouverts (Nouveau)' },
            { value: 'IN_PROGRESS', label: 'En cours' },
            { value: 'RESOLVED', label: 'Résolus' },
          ]}
        />

        {(searchQuery || statusFilter !== 'ALL' || dateRange.startDate || dateRange.endDate) && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#1D232E] hover:bg-slate-100 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      {/* 3. Master-Detail Split Inbox (Dossiers Sidebar + Thread List + Discussion Thread) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Dossiers Sidebar + Filtered Tickets List */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 no-print">
          {/* Dossiers Navigation */}
          <div className="bg-white p-3 rounded-2xl border border-[#E6E1D6] shadow-xs grid grid-cols-2 gap-2">
            {[
              { id: 'INBOX' as const, label: 'Boîte de réception', count: counts.inbox, icon: Inbox },
              { id: 'IN_PROGRESS' as const, label: 'En traitement', count: counts.inProgress, icon: Clock },
              { id: 'RESOLVED' as const, label: 'Tickets résolus', count: counts.resolved, icon: Archive },
              { id: 'ALL' as const, label: 'Tous les tickets', count: counts.all, icon: MessageSquare },
            ].map((f) => {
              const Icon = f.icon;
              const isActive = activeFolder === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFolder(f.id)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border',
                    isActive
                      ? 'bg-[#FBF6E8] text-[#9A7414] border-[#C59B27]'
                      : 'bg-white text-slate-600 border-transparent hover:bg-[#FBF9F4]'
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{f.label}</span>
                  </span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-full bg-white border border-[#E6E1D6] text-[#1D232E]">
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-[#FBF9F4]">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9A7414]">
                Fils Support ({filteredThreads.length})
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Authentifiés · Multi-tours
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
              {loading && (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chargement des discussions support...
                </div>
              )}

              {!loading && filteredThreads.length === 0 && (
                <div className="p-8 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">
                    Aucun ticket support dans ce dossier.
                  </p>
                </div>
              )}

              {!loading &&
                filteredThreads.map((t) => {
                  const isSelected = activeThread?.id === t.id;
                  const cName = t.customer
                    ? `${t.customer.firstName} ${t.customer.lastName}`.trim()
                    : 'Client Royal';
                  const lastMsg = t.messages?.[t.messages.length - 1];
                  const meta = STATUS_META[t.status] || STATUS_META.OPEN;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedThreadId(t.id)}
                      className={cn(
                        'w-full text-left p-4 transition cursor-pointer block border-l-4',
                        isSelected
                          ? 'bg-[#FBF6E8]/70 border-l-[#C59B27]'
                          : 'bg-white border-l-transparent hover:bg-[#FBF9F4]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] flex items-center justify-center font-black text-xs shrink-0">
                            {cName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#1D232E] truncate">
                              {cName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {t.customer?.email || t.customer?.phone || 'Compte Espace Client'}
                            </div>
                          </div>
                        </div>
                        <Badge variant={meta.badgeVariant} size="sm">
                          {t.status === 'OPEN' ? 'Ouvert' : t.status === 'IN_PROGRESS' ? 'En cours' : 'Résolu'}
                        </Badge>
                      </div>

                      <div className="mt-2.5">
                        <div className="text-xs font-bold text-[#1D232E] line-clamp-1">
                          {t.subject}
                        </div>
                        {lastMsg && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            <span className="font-semibold text-slate-700">{lastMsg.senderName} :</span>{' '}
                            {lastMsg.body}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          Espace Client • {t.messages.length} msg
                        </span>
                        <span>
                          {new Date(t.updatedAt || t.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right: Active Conversation & Staff Support Reply */}
        <div className="lg:col-span-7 xl:col-span-8">
          {!activeThread ? (
            <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#C59B27] flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-heading font-extrabold text-[#1D232E]">
                Sélectionnez une discussion support
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Choisissez un ticket client dans la liste de gauche pour consulter l’historique complet et répondre directement dans son Espace Client.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm overflow-hidden flex flex-col">
              {/* Ticket Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-[#FBF9F4]/60 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                        Ticket Support · Espace Client
                      </span>
                      <Badge
                        variant={(STATUS_META[activeThread.status] || STATUS_META.OPEN).badgeVariant}
                        size="sm"
                      >
                        {(STATUS_META[activeThread.status] || STATUS_META.OPEN).label}
                      </Badge>
                    </div>
                    <h2 className="text-lg font-heading font-black text-[#1D232E]">
                      {activeThread.subject}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 no-print">
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                      className="text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer</span>
                    </Button>
                    {activeThread.status !== 'IN_PROGRESS' && (
                      <Button
                        variant="outline"
                        disabled={statusUpdating}
                        onClick={() => handleStatusChange(activeThread.id, 'IN_PROGRESS')}
                        className="text-xs px-3 py-1.5"
                      >
                        Marquer En cours
                      </Button>
                    )}
                    {activeThread.status !== 'RESOLVED' ? (
                      <Button
                        variant="primary"
                        disabled={statusUpdating}
                        onClick={() => handleStatusChange(activeThread.id, 'RESOLVED')}
                        className="text-xs px-3.5 py-1.5 flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Clôturer Résolu</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        disabled={statusUpdating}
                        onClick={() => handleStatusChange(activeThread.id, 'OPEN')}
                        className="text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Rouvrir Ticket</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Customer Info Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-[#E6E1D6]/60">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#1D232E]">
                    <User className="w-3.5 h-3.5 text-[#C59B27]" />
                    {customerDisplay}
                  </span>
                  {activeThread.customer?.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {activeThread.customer.email}
                    </span>
                  )}
                  {activeThread.customer?.phone && (
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {activeThread.customer.phone}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    Créé le {new Date(activeThread.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Chronological Messages Feed */}
              <div className="p-5 sm:p-6 space-y-4 max-h-[420px] overflow-y-auto bg-white">
                {(activeThread.messages || []).map((msg) => {
                  const isClient = msg.senderRole === 'CLIENT';
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex flex-col max-w-[85%] rounded-2xl p-4 text-xs border shadow-2xs',
                        isClient
                          ? 'mr-auto bg-slate-50 border-slate-200 text-[#1D232E]'
                          : 'ml-auto bg-[#FBF6E8] border-[#E6D6A6] text-[#1D232E]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#1D232E]">{msg.senderName}</span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                              isClient
                                ? 'bg-white border border-slate-200 text-slate-600'
                                : 'bg-[#C59B27] text-white'
                            )}
                          >
                            {isClient ? 'Client' : msg.senderRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{msg.body}</p>
                    </div>
                  );
                })}
              </div>

              {/* Official Support Reply Box */}
              <form
                onSubmit={handleReplySubmit}
                className="p-5 sm:p-6 border-t border-slate-100 bg-[#FBF9F4] space-y-3 no-print"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9A7414] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Modèles Rapides Support Officiel
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPreview((p) => !p)}
                    className="text-[11px] font-bold text-slate-600 hover:text-[#9A7414] cursor-pointer"
                  >
                    {showPreview ? 'Masquer l’aperçu' : 'Aperçu message client'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SUPPORT_QUICK_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setReplyText(tpl.text)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white border border-[#E6E1D6] hover:border-[#C59B27] text-[#1D232E] transition cursor-pointer"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>

                {showPreview && replyText.trim() && (
                  <div className="p-4 rounded-2xl bg-white border border-[#E6D6A6] text-xs space-y-1">
                    <div className="text-[10px] font-bold uppercase text-[#9A7414]">
                      Aperçu visible par le client ({customerDisplay}) :
                    </div>
                    <p className="whitespace-pre-wrap text-slate-700">{replyText}</p>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Rédigez votre réponse officielle au client (synchronisée immédiatement dans son Espace Client)..."
                  className="w-full p-3.5 rounded-2xl border border-[#E6E1D6] bg-white text-xs text-[#1D232E] focus:outline-none focus:border-[#C59B27] resize-y"
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    La réponse fait automatiquement passer le ticket en statut « En cours ».
                  </span>
                  <Button
                    type="submit"
                    variant="gold"
                    disabled={submitting || !replyText.trim()}
                    className="text-xs px-5 py-2.5 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Envoi...' : 'Envoyer Réponse Support'}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
