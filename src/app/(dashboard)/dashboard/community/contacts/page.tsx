'use client';

import * as React from 'react';
import {
  Mail,
  Send,
  Trash2,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Search,
  Printer,
  Inbox,
  Archive,
  RefreshCw,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  X,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import {
  Button,
  Badge,
  Toast,
  Breadcrumb,
  Modal,
  DeleteConfirmModal,
  DateRangePicker,
  DateRange,
  FilterDropdown,
} from '@/components/ui';

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'NEW' | 'REPLIED' | 'ARCHIVED';
  isRead: boolean;
  replyContent?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface ContactDiscussion {
  email: string;
  fullName: string;
  phone?: string;
  messages: ContactMessage[];
  latestMessage: ContactMessage;
  unreadCount: number;
  status: 'NEW' | 'REPLIED' | 'ARCHIVED';
}

const ROOT_REPLY_TEMPLATES = [
  {
    title: 'Devis Personnalisé & Remise Pack',
    text: (name: string) =>
      `Bonjour ${name},\n\nNous vous remercions pour votre confiance. Nous avons le plaisir de vous transmettre notre proposition chiffrée avec une remise exclusive de 10% sur le pack complet ainsi que la livraison offerte sur toute la Tunisie.\n\nRestant à votre entière disposition,\nLa Direction Commerciale Royal`,
  },
  {
    title: 'Disponibilité Immédiate en Showroom',
    text: (name: string) =>
      `Bonjour ${name},\n\nNous vous confirmons que les articles sollicités sont immédiatement disponibles en stock et visibles dans nos showrooms (Lac 2 et Charguia II).\nVous pouvez réserver votre retrait dès aujourd'hui.\n\nBien cordialement,\nService Client Royal`,
  },
  {
    title: 'Assistance Technique & Suivi Commande',
    text: (name: string) =>
      `Bonjour ${name},\n\nNotre équipe logistique et technique a bien pris en charge votre demande. Un conseiller dédié prendra contact avec vous dans les plus brefs délais pour convenir des modalités.\n\nExcellente journée,\nSupport Technique Royal`,
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
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Date(dateString).toLocaleDateString('fr-FR');
}

export default function ContactsPage() {
  const [contacts, setContacts] = React.useState<ContactMessage[]>([]);
  const [currentTab, setCurrentTab] = React.useState<'INBOX' | 'TRASH'>('INBOX');
  const [selectedEmails, setSelectedEmails] = React.useState<string[]>([]);
  const [activeDiscussionEmail, setActiveDiscussionEmail] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [isSendingReply, setIsSendingReply] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'info' | 'error'>('success');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [emailToDelete, setEmailToDelete] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Filters & Pagination
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'NEW' | 'REPLIED' | 'ARCHIVED'>('ALL');
  const [dateRange, setDateRange] = React.useState<DateRange>({ startDate: '', endDate: '' });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);

  const loadContacts = React.useCallback(async () => {
    try {
      const res = await fetchApi('/storefront-cms/contacts');
      const list = Array.isArray(res) ? res : res?.data || [];
      if (Array.isArray(list)) {
        setContacts(
          list.map((c: any) => ({
            id: c.id,
            fullName: c.fullName,
            email: c.email || `${c.phone || c.id}@client.royal.com.tn`,
            phone: c.phone || undefined,
            subject: c.subject,
            message: c.message,
            status: (c.status || 'NEW') as 'NEW' | 'REPLIED' | 'ARCHIVED',
            isRead: Boolean(c.isRead),
            replyContent: c.replyContent || undefined,
            repliedAt: c.repliedAt || undefined,
            createdAt: c.createdAt,
          }))
        );
      } else {
        setContacts([]);
      }
    } catch {
      setContacts([]);
      setToastType('error');
      setToastMessage('Impossible de charger les messages de contact depuis le serveur.');
    }
  }, []);

  React.useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Group contacts by email into discussions
  const discussions: ContactDiscussion[] = React.useMemo(() => {
    const map = new Map<string, ContactMessage[]>();
    contacts.forEach((c) => {
      const key = c.email.toLowerCase().trim();
      const list = map.get(key) || [];
      list.push(c);
      map.set(key, list);
    });

    const result: ContactDiscussion[] = [];
    map.forEach((msgs, email) => {
      // Sort messages chronologically
      const sorted = [...msgs].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const latest = sorted[sorted.length - 1];
      const unreadCount = sorted.filter((m) => !m.isRead && m.status !== 'ARCHIVED').length;

      // Status of discussion: if any is NEW, overall NEW; if all ARCHIVED, ARCHIVED; else REPLIED
      let discStatus: 'NEW' | 'REPLIED' | 'ARCHIVED' = 'REPLIED';
      if (sorted.every((m) => m.status === 'ARCHIVED')) {
        discStatus = 'ARCHIVED';
      } else if (sorted.some((m) => m.status === 'NEW')) {
        discStatus = 'NEW';
      }

      result.push({
        email,
        fullName: latest.fullName,
        phone: latest.phone || sorted.find((m) => m.phone)?.phone,
        messages: sorted,
        latestMessage: latest,
        unreadCount,
        status: discStatus,
      });
    });

    // Sort discussions by latest message date desc
    return result.sort(
      (a, b) =>
        new Date(b.latestMessage.createdAt).getTime() -
        new Date(a.latestMessage.createdAt).getTime()
    );
  }, [contacts]);

  // Tab counters
  const inboxDiscussions = discussions.filter((d) => d.status !== 'ARCHIVED');
  const trashDiscussions = discussions.filter((d) => d.status === 'ARCHIVED');

  const inboxCount = inboxDiscussions.length;
  const unreadTotal = inboxDiscussions.reduce((sum, d) => sum + d.unreadCount, 0);
  const trashCount = trashDiscussions.length;

  // Filtered discussions according to active tab, search, status, and date
  const displayedDiscussions = React.useMemo(() => {
    const source = currentTab === 'INBOX' ? inboxDiscussions : trashDiscussions;

    return source.filter((disc) => {
      // Search by name, email, phone, subject, or message content
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesInfo =
          disc.fullName.toLowerCase().includes(q) ||
          disc.email.toLowerCase().includes(q) ||
          (disc.phone && disc.phone.toLowerCase().includes(q));
        const matchesContent = disc.messages.some(
          (m) =>
            m.subject.toLowerCase().includes(q) ||
            m.message.toLowerCase().includes(q) ||
            (m.replyContent && m.replyContent.toLowerCase().includes(q))
        );
        if (!matchesInfo && !matchesContent) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && disc.status !== statusFilter) {
        return false;
      }

      // Date Range filter (check if latest message falls in range)
      const latestTime = new Date(disc.latestMessage.createdAt).getTime();
      if (dateRange.startDate) {
        const start = new Date(dateRange.startDate).getTime();
        if (latestTime < start) return false;
      }
      if (dateRange.endDate) {
        const end = new Date(dateRange.endDate).getTime();
        if (latestTime > end) return false;
      }

      return true;
    });
  }, [currentTab, inboxDiscussions, trashDiscussions, search, statusFilter, dateRange]);

  React.useEffect(() => {
    setPage(1);
  }, [currentTab, search, statusFilter, dateRange.startDate, dateRange.endDate, pageSize]);

  const totalPages = Math.max(1, Math.ceil(displayedDiscussions.length / pageSize));
  const paginatedDiscussions = React.useMemo(
    () => displayedDiscussions.slice((page - 1) * pageSize, page * pageSize),
    [displayedDiscussions, page, pageSize]
  );

  // Active selected discussion
  const activeDiscussion = React.useMemo(() => {
    if (!activeDiscussionEmail) return null;
    return discussions.find((d) => d.email === activeDiscussionEmail) || null;
  }, [discussions, activeDiscussionEmail]);

  const handleOpenDiscussion = (disc: ContactDiscussion) => {
    setActiveDiscussionEmail(disc.email);
    setReplyText('');
    const unreadMsgs = disc.messages.filter((m) => !m.isRead);
    unreadMsgs.forEach((m) => {
      fetchApi(`/storefront-cms/contacts/${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: true }),
      }).catch(() => null);
    });
    setContacts((prev) =>
      prev.map((c) =>
        c.email.toLowerCase().trim() === disc.email.toLowerCase().trim()
          ? { ...c, isRead: true }
          : c
      )
    );
  };

  const handleCloseSplit = () => {
    setActiveDiscussionEmail(null);
    setReplyText('');
  };

  const handleSelectTemplate = (templateGenerator: (name: string) => string) => {
    if (!activeDiscussion) return;
    setReplyText(templateGenerator(activeDiscussion.fullName));
  };

  const handleSendReply = async () => {
    if (!activeDiscussion || !replyText.trim()) return;
    setIsSendingReply(true);
    const latestMsg = activeDiscussion.messages[activeDiscussion.messages.length - 1];
    try {
      await fetchApi(`/storefront-cms/contacts/${latestMsg.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ replyContent: replyText.trim(), status: 'REPLIED', isRead: true }),
      });
      await loadContacts();
      setReplyText('');
      setToastType('success');
      setToastMessage('Votre réponse officielle a été enregistrée avec succès.');
    } catch {
      setToastType('error');
      setToastMessage('Erreur lors de l’envoi de la réponse.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleArchiveDiscussion = async (email: string) => {
    const target = email.toLowerCase().trim();
    const msgs = contacts.filter((c) => c.email.toLowerCase().trim() === target);
    await Promise.all(
      msgs.map((m) =>
        fetchApi(`/storefront-cms/contacts/${m.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'ARCHIVED' }),
        }).catch(() => null)
      )
    );
    setContacts((prev) =>
      prev.map((c) =>
        c.email.toLowerCase().trim() === target ? { ...c, status: 'ARCHIVED' } : c
      )
    );
    if (activeDiscussionEmail === email) {
      setActiveDiscussionEmail(null);
    }
    setToastType('info');
    setToastMessage('La discussion a été déplacée vers la corbeille.');
  };

  const handleRestoreDiscussion = async (email: string) => {
    const target = email.toLowerCase().trim();
    const msgs = contacts.filter((c) => c.email.toLowerCase().trim() === target);
    await Promise.all(
      msgs.map((m) =>
        fetchApi(`/storefront-cms/contacts/${m.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'NEW' }),
        }).catch(() => null)
      )
    );
    setContacts((prev) =>
      prev.map((c) =>
        c.email.toLowerCase().trim() === target ? { ...c, status: 'NEW' } : c
      )
    );
    setToastType('success');
    setToastMessage('La discussion a été restaurée dans la boîte de réception.');
  };

  const handleDeletePermanent = async (email: string) => {
    const target = email.toLowerCase().trim();
    const msgs = contacts.filter((c) => c.email.toLowerCase().trim() === target);
    await Promise.all(
      msgs.map((m) =>
        fetchApi(`/storefront-cms/contacts/${m.id}`, { method: 'DELETE' }).catch(() => null)
      )
    );
    setContacts((prev) => prev.filter((c) => c.email.toLowerCase().trim() !== target));
    if (activeDiscussionEmail === email) {
      setActiveDiscussionEmail(null);
    }
    setSelectedEmails((prev) => prev.filter((e) => e !== email));
    setEmailToDelete(null);
    setDeleteConfirmOpen(false);
    setToastType('info');
    setToastMessage('La discussion a été supprimée définitivement.');
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedEmails(displayedDiscussions.map((d) => d.email));
    } else {
      setSelectedEmails([]);
    }
  };

  const handleToggleSelectEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((item) => item !== email) : [...prev, email]
    );
  };

  const handlePrintDiscussion = () => {
    window.print();
  };

  const handleBulkAction = async (
    action: 'MARK_READ' | 'MARK_UNREAD' | 'TRASH' | 'RESTORE' | 'DELETE',
  ) => {
    if (selectedEmails.length === 0) return;
    const targets = selectedEmails.map((e) => e.toLowerCase().trim());
    const ids = contacts
      .filter((c) => targets.includes(c.email.toLowerCase().trim()))
      .map((c) => c.id);
    if (ids.length === 0) return;
    await fetchApi('/storefront-cms/contacts/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ ids, action }),
    }).catch(() => null);
    setSelectedEmails([]);
    if (
      (action === 'DELETE' || action === 'TRASH') &&
      activeDiscussionEmail &&
      targets.includes(activeDiscussionEmail.toLowerCase().trim())
    ) {
      setActiveDiscussionEmail(null);
    }
    await loadContacts();
    setToastType(action === 'DELETE' ? 'info' : 'success');
    const labels: Record<string, string> = {
      MARK_READ: 'Discussions marquées comme lues.',
      MARK_UNREAD: 'Discussions marquées comme non lues.',
      TRASH: 'Discussions déplacées vers la corbeille.',
      RESTORE: 'Discussions restaurées dans la boîte de réception.',
      DELETE: 'Discussions sélectionnées supprimées définitivement.',
    };
    setToastMessage(labels[action] || 'Action groupée effectuée.');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Toast Feedback */}
      {toastMessage && (
        <Toast
          isOpen={Boolean(toastMessage)}
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setEmailToDelete(null);
        }}
        onConfirm={async () => {
          if (emailToDelete) {
            await handleDeletePermanent(emailToDelete);
          } else if (selectedEmails.length > 0) {
            await handleBulkAction('DELETE');
            setDeleteConfirmOpen(false);
          }
        }}
        title="Supprimer définitivement la discussion"
        description="Cette action est irréversible. L'historique complet des échanges avec ce contact sera définitivement effacé."
      />

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-3 no-print print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[var(--royal-primary)] border border-[#E6D6A6] rounded-2xl shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
                  Discussions & Messages de Contact
                </h1>
                {unreadTotal > 0 && (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full border border-amber-200">
                    {unreadTotal} non lu{unreadTotal > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Échanges clients groupés par expéditeur avec volet de discussion interactif et réponses officielles.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedEmails.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('MARK_READ')}
                  className="text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  <span>Marquer lu</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('MARK_UNREAD')}
                  className="text-xs font-semibold text-amber-800 border-amber-200 hover:bg-amber-50"
                >
                  <span>Non lu</span>
                </Button>
                {currentTab === 'INBOX' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('TRASH')}
                    className="text-xs font-semibold text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                  >
                    <Archive className="h-3.5 w-3.5 mr-1" />
                    <span>Archiver</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('RESTORE')}
                    className="text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    <span>Restaurer</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Supprimer ({selectedEmails.length})</span>
                </Button>
              </>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await loadContacts();
                setActiveDiscussionEmail(null);
                setSelectedEmails([]);
                setToastType('info');
                setToastMessage('Liste des discussions actualisée.');
              }}
              className="text-xs font-semibold"
              title="Actualiser"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              <span>Actualiser</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Communauté', href: '/dashboard/section/community' },
              { label: 'Discussions & Messages de Contact' },
            ]}
          />
        </div>
      </div>

      {/* MAIN CONTAINER: VERTICAL TABS ON LEFT + DISCUSSIONS TABLE/SPLIT ON RIGHT */}
      <div className="flex flex-col lg:flex-row items-start gap-5">
        {/* 1. VERTICAL TABS SIDEBAR (Inbox and Trash only) */}
        <aside className="w-full lg:w-56 shrink-0 bg-white rounded-3xl border border-neutral-200 shadow-sm p-3 space-y-1.5 no-print print:hidden">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Dossiers
          </div>

          {/* Boîte de Réception */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('INBOX');
              setSelectedEmails([]);
              setActiveDiscussionEmail(null);
            }}
            className={cn(
              'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer select-none',
              currentTab === 'INBOX'
                ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Inbox className="w-4 h-4 shrink-0" />
              <span className="truncate">Boîte de réception</span>
            </div>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-extrabold shrink-0',
                currentTab === 'INBOX'
                  ? 'bg-white/25 text-white'
                  : unreadTotal > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-neutral-100 text-neutral-600'
              )}
            >
              {inboxCount}
            </span>
          </button>

          {/* Corbeille */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('TRASH');
              setSelectedEmails([]);
              setActiveDiscussionEmail(null);
            }}
            className={cn(
              'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer select-none',
              currentTab === 'TRASH'
                ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Trash2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Corbeille</span>
            </div>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-extrabold shrink-0',
                currentTab === 'TRASH' ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-600'
              )}
            >
              {trashCount}
            </span>
          </button>
        </aside>

        {/* 2. MAIN WORKSPACE: DISCUSSIONS LIST + OPTIONAL SPLIT CONVERSATION PANEL */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {/* Unified Filter Bar (Search + DateRangePicker + Status + Reset) */}
          <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm relative z-20 overflow-visible no-print print:hidden">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, email, objet, contenu..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
                />
              </div>

              {/* Unified Single DateRangePicker (Du / Jusqu'à) */}
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                onClear={() => setDateRange({ startDate: '', endDate: '' })}
                label="Période"
                className="shrink-0"
              />

              {/* Status Filter Dropdown */}
              <FilterDropdown
                label="État"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                options={[
                  { label: 'Nouveau', value: 'NEW' },
                  { label: 'Répondu', value: 'REPLIED' },
                  { label: 'Archivé', value: 'ARCHIVED' },
                ]}
                allLabel="Tous les états"
              />

              {/* Reset Filters */}
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setDateRange({ startDate: '', endDate: '' });
                }}
                className="shrink-0 text-xs text-neutral-500 hover:text-neutral-900 font-semibold px-2.5 py-2 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
                title="Réinitialiser les filtres"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* SPLIT VIEW WORKSPACE CONTAINER */}
          <div className="flex flex-col lg:flex-row items-start gap-4">
            {/* LEFT / MASTER PANE: DISCUSSIONS LIST */}
            <div
              className={cn(
                'w-full transition-all duration-200 space-y-3 no-print print:hidden',
                activeDiscussion ? 'lg:w-5/12 xl:w-4/12' : 'w-full'
              )}
            >
              {/* Bulk Selection Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-neutral-100/70 rounded-2xl border border-neutral-200/80 text-xs text-neutral-600 font-medium no-print print:hidden">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      displayedDiscussions.length > 0 &&
                      selectedEmails.length === displayedDiscussions.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    Sélectionner ({selectedEmails.length}/{displayedDiscussions.length})
                  </span>
                </label>
                <span className="text-[11px] text-neutral-400">
                  {displayedDiscussions.length} discussion{displayedDiscussions.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* List of Grouped Discussions */}
              {displayedDiscussions.length === 0 ? (
                <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-neutral-800 text-sm">Aucune discussion trouvée</div>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Aucun message ne correspond à vos critères de recherche actuels.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paginatedDiscussions.map((disc) => {
                    const isSelected = selectedEmails.includes(disc.email);
                    const isActive = activeDiscussionEmail === disc.email;
                    const hasUnread = disc.unreadCount > 0;
                    const msgCount = disc.messages.length;

                    return (
                      <div
                        key={disc.email}
                        onClick={() => handleOpenDiscussion(disc)}
                        className={cn(
                          'p-4 rounded-3xl border transition-all duration-150 cursor-pointer flex items-start gap-3 relative group',
                          isActive
                            ? 'bg-[#FBF6E8] text-neutral-900 border-[var(--royal-primary)] shadow-sm ring-1 ring-[var(--royal-primary)]/30'
                            : hasUnread
                            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400 shadow-2xs'
                            : 'bg-white border-neutral-200/90 hover:border-neutral-300 hover:shadow-2xs'
                        )}
                      >
                        {/* Checkbox */}
                        <div
                          onClick={(e) => handleToggleSelectEmail(disc.email, e)}
                          className="pt-1 shrink-0 no-print print:hidden"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-neutral-300 text-[var(--royal-primary)] focus:ring-[var(--royal-primary)] w-4 h-4 cursor-pointer"
                          />
                        </div>

                        {/* Customer Avatar */}
                        <div
                          className={cn(
                            'w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs',
                            isActive
                              ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)]'
                              : 'bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6]'
                          )}
                        >
                          {disc.fullName.charAt(0).toUpperCase()}
                        </div>

                        {/* Summary Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                'font-bold text-xs truncate',
                                isActive ? 'text-white' : 'text-neutral-900'
                              )}
                            >
                              {disc.fullName}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-mono shrink-0',
                                isActive ? 'text-neutral-300' : 'text-neutral-400'
                              )}
                            >
                              {formatRelativeTime(disc.latestMessage.createdAt)}
                            </span>
                          </div>

                          <div
                            className={cn(
                              'text-[11px] truncate font-medium',
                              isActive ? 'text-[#1D232E]' : 'text-neutral-600'
                            )}
                          >
                            {disc.latestMessage.subject}
                          </div>

                          <p
                            className={cn(
                              'text-[11px] line-clamp-1',
                              isActive ? 'text-neutral-600' : 'text-neutral-400'
                            )}
                          >
                            {disc.latestMessage.message}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                                  isActive
                                    ? 'bg-white text-[#9A7414] border-[#C59B27]/50'
                                    : disc.status === 'NEW'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : disc.status === 'REPLIED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                )}
                              >
                                {disc.status === 'NEW'
                                  ? 'Nouveau'
                                  : disc.status === 'REPLIED'
                                  ? 'Répondu'
                                  : 'Archivé'}
                              </span>

                              {msgCount > 1 && (
                                <span
                                  className={cn(
                                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1',
                                    isActive
                                      ? 'bg-white text-[#1D232E] border border-[#E6D6A6]'
                                      : 'bg-neutral-100 text-neutral-500'
                                  )}
                                >
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  <span>{msgCount}</span>
                                </span>
                              )}
                            </div>

                            {hasUnread && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white rounded-2xl border border-neutral-200/80 text-xs text-neutral-600 no-print print:hidden">
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
                    className="px-2.5 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer font-semibold"
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
                    className="px-2.5 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer font-semibold"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT / DETAIL PANE: CONVERSATION SPLIT VIEW (Desktop only) */}
            {activeDiscussion && (
              <div
                id="royal-printable-thread"
                className="hidden lg:block w-full lg:w-7/12 xl:w-8/12 bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-6 print-card-content animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Print Header Letterhead (Visible ONLY on print) */}
                <div className="hidden print:block pb-4 mb-4 border-b border-neutral-300">
                  <div className="text-base font-black tracking-widest uppercase text-neutral-900">
                    ROYAL ÉLECTROMÉNAGER & CUISINES HAUT DE GAMME
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Historique de Correspondance Commerciale & Suivi Client Officiel
                  </div>
                </div>

                {/* Top Split Header: Return Button + Contact Meta + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 no-print print:hidden">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCloseSplit}
                      className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      title="Fermer le volet et revenir à la liste complète"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Fermer le volet</span>
                    </button>

                    <div>
                      <h2 className="font-heading font-black text-base text-neutral-900 flex items-center gap-2">
                        <span>{activeDiscussion.fullName}</span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            activeDiscussion.status === 'NEW'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : activeDiscussion.status === 'REPLIED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          )}
                        >
                          {activeDiscussion.status === 'NEW'
                            ? 'Nouveau'
                            : activeDiscussion.status === 'REPLIED'
                            ? 'Répondu'
                            : 'Archivé'}
                        </span>
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{activeDiscussion.email}</span>
                        </span>
                        {activeDiscussion.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{activeDiscussion.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintDiscussion}
                      className="text-xs font-semibold"
                      title="Imprimer toute la conversation"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5 text-neutral-700" />
                      <span>Imprimer la discussion</span>
                    </Button>

                    {activeDiscussion.status !== 'ARCHIVED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchiveDiscussion(activeDiscussion.email)}
                        className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                        title="Déplacer vers la corbeille"
                      >
                        <Archive className="w-3.5 h-3.5 mr-1.5" />
                        <span>Archiver</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreDiscussion(activeDiscussion.email)}
                        className="text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        title="Restaurer dans la boîte de réception"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        <span>Restaurer</span>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmailToDelete(activeDiscussion.email);
                        setDeleteConfirmOpen(true);
                      }}
                      className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Print Letterhead Details for Print Engine */}
                <div className="hidden print:grid grid-cols-2 gap-4 pb-4 border-b border-neutral-200 text-xs font-mono">
                  <div>
                    <span className="font-bold block text-neutral-700">Client / Expéditeur :</span>
                    <span className="text-neutral-900 font-bold">{activeDiscussion.fullName}</span>
                    <span className="block text-neutral-600">{activeDiscussion.email}</span>
                    {activeDiscussion.phone && <span className="block text-neutral-600">{activeDiscussion.phone}</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold block text-neutral-700">Date d’impression :</span>
                    <span>{new Date().toLocaleString('fr-FR')}</span>
                    <span className="block text-neutral-500 font-bold">Total échanges : {activeDiscussion.messages.length} message(s)</span>
                  </div>
                </div>

                {/* CONVERSATION THREAD: CHRONOLOGICAL MESSAGE BUBBLES */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between no-print print:hidden">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Fil des Échanges ({activeDiscussion.messages.length} message{activeDiscussion.messages.length > 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="space-y-4">
                    {activeDiscussion.messages.map((msg, index) => (
                      <React.Fragment key={msg.id}>
                        {/* 1. Customer Message Bubble */}
                        <div className="p-5 rounded-3xl bg-neutral-50 border border-neutral-200/90 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] flex items-center justify-center font-bold text-[10px]">
                                {msg.fullName.charAt(0)}
                              </span>
                              <span className="font-bold text-xs text-neutral-900">
                                {msg.fullName}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                (Message client #{index + 1})
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {new Date(msg.createdAt).toLocaleString('fr-FR')}
                            </span>
                          </div>

                          <div className="font-bold text-xs text-neutral-800">
                            Objet : {msg.subject}
                          </div>

                          <div className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </div>
                        </div>

                        {/* 2. Official Royal Reply Bubble (if replied) */}
                        {msg.replyContent && (
                          <div className="p-5 rounded-3xl bg-[#FBF6E8] text-neutral-900 border border-[#E6D6A6] space-y-2.5 ml-6 sm:ml-12 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-[var(--royal-primary)] text-[var(--royal-primary-text)] flex items-center justify-center font-extrabold text-[10px]">
                                  R
                                </div>
                                <span className="font-bold text-xs text-neutral-900">
                                  Direction Commerciale Royal
                                </span>
                                <span className="text-[10px] bg-[var(--royal-primary)] text-white px-2 py-0.5 rounded-full font-bold">
                                  Officiel
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {msg.repliedAt ? new Date(msg.repliedAt).toLocaleString('fr-FR') : 'Envoyé'}
                              </span>
                            </div>

                            <div className="text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap border-t border-[#E6D6A6] pt-2.5">
                              {msg.replyContent}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* REPLY COMPOSER AREA (Hidden on print) */}
                <div className="pt-4 border-t border-neutral-200 space-y-4 no-print print:hidden">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Rédiger une Réponse Officielle</span>
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      Sera envoyée à : <strong>{activeDiscussion.email}</strong>
                    </span>
                  </div>

                  {/* Fast Reply Templates Shortcuts */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Modèles de réponse rapide (Console ROOT) :
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {ROOT_REPLY_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectTemplate(tmpl.text)}
                          className="p-2.5 text-left rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition cursor-pointer group"
                        >
                          <span className="font-bold text-neutral-900 block group-hover:text-neutral-950 text-xs truncate">
                            {tmpl.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 block mt-0.5 line-clamp-1">
                            {tmpl.text(activeDiscussion.fullName)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="space-y-1.5">
                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Écrivez votre réponse personnalisée pour ${activeDiscussion.fullName}...`}
                      className="w-full p-4 rounded-2xl border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 text-xs text-neutral-900 leading-relaxed"
                    />
                  </div>

                  {/* Real-time Official Email Preview Card */}
                  {replyText.trim() && (
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Aperçu de l'Email Envoyé au Client</span>
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          Template Officiel Royal
                        </span>
                      </div>

                      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                          <span className="font-extrabold tracking-tight text-neutral-950 text-xs">
                            ROYAL MAISON D’ART & CUISINE
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            Destinataire : {activeDiscussion.email}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap font-sans">
                          {replyText}
                        </div>
                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                          <span>Service Clientèle & Showroom Privé — Royal Tunisie</span>
                          <span>support@royal.com.tn</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Send Button */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={handleSendReply}
                      disabled={isSendingReply || !replyText.trim()}
                      className="text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      <span>{isSendingReply ? 'Transmission en cours...' : 'Envoyer la Réponse Officielle'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Conversation Modal */}
      {activeDiscussion && (
        <Modal
          isOpen={isMobile && Boolean(activeDiscussion)}
          onClose={handleCloseSplit}
          title={activeDiscussion.fullName}
          subtitle={`${activeDiscussion.email}${activeDiscussion.phone ? ` • ${activeDiscussion.phone}` : ''}`}
          size="3xl"
        >
          <div className="p-5 space-y-5">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-neutral-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintDiscussion}
                className="text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-neutral-700" />
                <span>Imprimer</span>
              </Button>
              {activeDiscussion.status !== 'ARCHIVED' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleArchiveDiscussion(activeDiscussion.email)}
                  className="text-xs font-semibold text-neutral-600"
                >
                  <Archive className="w-3.5 h-3.5 mr-1.5" />
                  <span>Archiver</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestoreDiscussion(activeDiscussion.email)}
                  className="text-xs font-semibold text-emerald-700 border-emerald-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Restaurer</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmailToDelete(activeDiscussion.email);
                  setDeleteConfirmOpen(true);
                }}
                className="text-xs font-semibold text-rose-600 border-rose-200 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>Supprimer</span>
              </Button>
            </div>

            <div className="space-y-3">
              {activeDiscussion.messages.map((msg, index) => (
                <React.Fragment key={msg.id}>
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-bold text-neutral-900">
                        {msg.fullName} (#{index + 1})
                      </span>
                      <span className="text-neutral-400 font-mono">
                        {new Date(msg.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-neutral-800">{msg.subject}</div>
                    <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                  {msg.replyContent && (
                    <div className="p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] space-y-2 ml-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-xs text-neutral-900">
                          Direction Commerciale Royal
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {msg.repliedAt ? new Date(msg.repliedAt).toLocaleString('fr-FR') : 'Envoyé'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap border-t border-[#E6D6A6] pt-2">
                        {msg.replyContent}
                      </p>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {ROOT_REPLY_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.text)}
                    className="px-2.5 py-1 rounded-full border border-neutral-200 bg-white text-[11px] font-bold text-neutral-800 cursor-pointer"
                  >
                    + {tmpl.title}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Écrivez votre réponse pour ${activeDiscussion.fullName}...`}
                className="w-full p-3.5 rounded-2xl border border-neutral-200 bg-[#F8F9FA] text-xs text-neutral-900 focus:outline-none focus:border-[var(--royal-primary)]"
              />
              <div className="flex justify-end">
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleSendReply}
                  disabled={isSendingReply || !replyText.trim()}
                  className="text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>{isSendingReply ? 'Transmission...' : 'Envoyer la Réponse'}</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Print Isolation Stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          aside,
          header,
          nav,
          .no-print,
          .print\\:hidden,
          [role="status"],
          [role="alert"] {
            display: none !important;
            visibility: hidden !important;
          }
          /* Hide everything in page except royal-printable-thread */
          body > *:not(#royal-printable-thread) {
            /* standard visibility containment */
          }
          #royal-printable-thread {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            padding: 20px !important;
            margin: 0 !important;
            display: block !important;
            visibility: visible !important;
          }
          #royal-printable-thread * {
            visibility: visible !important;
          }
          #royal-printable-thread .no-print,
          #royal-printable-thread .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
