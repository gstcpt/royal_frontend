'use client';

import * as React from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
  RefreshCw,
  Search,
  CheckCheck,
  Calendar,
  Filter,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge, Toast, Breadcrumb, DeleteConfirmModal, DateRangePicker, DateRange, FilterDropdown } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { SystemRole } from '@royal/shared-types';

interface NotificationItem {
  id: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  title: string;
  message: string;
  channel: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  recipient?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'ALERT',
    title: 'Alerte Stock Faible — Airfryer Double Tiroir 8.5L',
    message: 'Le stock dans le Dépôt Sousse est descendu sous le seuil critique (2 unités restantes). Réapprovisionnement urgent requis.',
    channel: 'STOCK',
    isRead: false,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    recipient: 'Magasiniers & Direction',
  },
  {
    id: 'notif-2',
    type: 'SUCCESS',
    title: 'Paiement Confirmé — Commande #CMD-2026-0042',
    message: 'Règlement ClicToPay validé avec succès pour un montant de 2 450,000 DT. Colis prêt pour préparation logistique.',
    channel: 'ORDER',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    recipient: 'Financier & Caissier',
  },
  {
    id: 'notif-3',
    type: 'INFO',
    title: 'Nouvelle Inscription Client VIP',
    message: 'Le client VIP Slim Ben Amor a activé son compte sur la boutique et cumulé 50 points de fidélité de bienvenue.',
    channel: 'SYSTEM',
    isRead: true,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(), // 14 hours ago
    recipient: 'Website Manager',
  },
  {
    id: 'notif-4',
    type: 'WARNING',
    title: 'Tentative de Connexion Suspecte Détectée',
    message: '3 échecs consécutifs d’authentification détectés pour l’adresse IP 197.3.24.11. Compte temporairement temporisé.',
    channel: 'AUTH',
    isRead: true,
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(), // 28 hours ago
    recipient: 'ROOT Admin',
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

export default function NotificationsPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const isRootOrSuperAdmin = hasRole(SystemRole.ROOT) || hasRole(SystemRole.SUPER_ADMIN);

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'info' | 'error'>('success');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [singleDeleteId, setSingleDeleteId] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [gravityFilter, setGravityFilter] = React.useState<string>('ALL');
  const [channelFilter, setChannelFilter] = React.useState<string>('ALL');
  const [dateRange, setDateRange] = React.useState<DateRange>({ startDate: '', endDate: '' });

  const loadNotifications = React.useCallback(async () => {
    try {
      const res = await fetchApi('/storefront-cms/notifications');
      const list = Array.isArray(res) ? res : res?.data || [];
      if (Array.isArray(list)) {
        setNotifications(list);
      }
    } catch {
      // ignore if offline
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetchApi('/storefront-cms/notifications/read-all', { method: 'PATCH' });
    } catch {
      // ignore
    }
    setToastType('success');
    setToastMessage('Toutes les notifications ont été marquées comme lues.');
  };

  const handleToggleRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
    try {
      await fetchApi(`/storefront-cms/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // ignore
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const toDelete = [...selectedIds];
    setNotifications((prev) => prev.filter((n) => !toDelete.includes(n.id)));
    setSelectedIds([]);
    setDeleteConfirmOpen(false);
    await Promise.all(
      toDelete.map((id) => fetchApi(`/storefront-cms/notifications/${id}`, { method: 'DELETE' }).catch(() => null))
    );
    setToastType('info');
    setToastMessage('Les notifications sélectionnées ont été supprimées.');
  };

  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteId) return;
    const id = singleDeleteId;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    setSingleDeleteId(null);
    await fetchApi(`/storefront-cms/notifications/${id}`, { method: 'DELETE' }).catch(() => null);
    setToastType('info');
    setToastMessage('La notification a été supprimée.');
  };

  // Filtered notifications
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          item.channel.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Status
      if (statusFilter === 'UNREAD' && item.isRead) return false;
      if (statusFilter === 'READ' && !item.isRead) return false;
      // Gravity
      if (gravityFilter !== 'ALL' && item.type !== gravityFilter) return false;
      // Channel
      if (channelFilter !== 'ALL' && item.channel !== channelFilter) return false;
      // Date & Time range
      if (dateRange.startDate) {
        const start = new Date(dateRange.startDate);
        if (!dateRange.startDate.includes('T')) start.setHours(0, 0, 0, 0);
        if (new Date(item.createdAt) < start) return false;
      }
      if (dateRange.endDate) {
        const end = new Date(dateRange.endDate);
        if (!dateRange.endDate.includes('T')) end.setHours(23, 59, 59, 999);
        if (new Date(item.createdAt) > end) return false;
      }
      return true;
    });
  }, [notifications, search, statusFilter, gravityFilter, channelFilter, dateRange]);

  const renderGravityBadge = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ALERT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Critique</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Avertissement</span>
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Succès</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="h-3 w-3" />
            <span>Info</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[var(--royal-primary)] border border-[#E6D6A6] rounded-2xl shadow-sm">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
                  Centre de Notifications Système
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full border border-amber-200">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Flux d’alertes de stock, paiements, sécurité et activités clients.
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
                title="Supprimer la sélection"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Supprimer ({selectedIds.length})</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0}
              onClick={handleMarkAllAsRead}
              className="text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              <span>Tout marquer comme lu</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await loadNotifications();
                setToastType('info');
                setToastMessage('Flux de notifications actualisé.');
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
              { label: 'Notifications Système' },
            ]}
          />
        </div>
      </div>

      {/* Unified Filter Bar: Search + DateRangePicker + Status + Gravity + Channel + Reset */}
      <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm relative z-20 overflow-visible">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher titre, message..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
            />
          </div>

          {/* Unified Single DateRangePicker */}
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
              { label: `Non lues (${unreadCount})`, value: 'UNREAD' },
              { label: 'Lues', value: 'READ' },
            ]}
            allLabel="Tous"
          />

          {/* Gravity Dropdown */}
          <FilterDropdown
            label="Gravité"
            value={gravityFilter}
            onChange={(val) => setGravityFilter(val)}
            options={[
              { label: 'Critique (Alerte rouge)', value: 'ALERT' },
              { label: 'Avertissement', value: 'WARNING' },
              { label: 'Succès', value: 'SUCCESS' },
              { label: 'Information', value: 'INFO' },
            ]}
            allLabel="Toutes"
          />

          {/* Channel Dropdown */}
          <FilterDropdown
            label="Canal"
            value={channelFilter}
            onChange={(val) => setChannelFilter(val)}
            options={[
              { label: 'Stock & Entrepôt', value: 'STOCK' },
              { label: 'Commandes & Ventes', value: 'ORDER' },
              { label: 'Sécurité & Auth', value: 'AUTH' },
              { label: 'Système Global', value: 'SYSTEM' },
            ]}
            allLabel="Tous"
          />

          {/* Reset Filters */}
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setGravityFilter('ALL');
              setChannelFilter('ALL');
              setDateRange({ startDate: '', endDate: '' });
            }}
            className="shrink-0 text-xs text-neutral-500 hover:text-neutral-900 font-semibold px-2.5 py-2 hover:bg-neutral-100 rounded-xl transition"
            title="Réinitialiser tous les filtres"
          >
            Réinitialiser
          </button>
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
                filteredNotifications.length > 0 &&
                selectedIds.length === filteredNotifications.length
              }
              onChange={handleSelectAll}
              className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950 w-4 h-4 cursor-pointer"
            />
            <span>
              Sélectionner tout ({selectedIds.length}/{filteredNotifications.length})
            </span>
          </label>
          <span className="text-[11px] text-neutral-400">
            {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''} trouvée{filteredNotifications.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* List of Notification Cards */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <div className="font-bold text-neutral-800 text-sm">Aucune notification correspondante</div>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Aucun résultat ne correspond à vos critères de recherche ou de période.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleToggleRead(item.id)}
                className={cn(
                  'group p-5 rounded-3xl border transition-all duration-150 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
                  item.isRead
                    ? 'bg-white border-neutral-200/80 opacity-80 hover:opacity-100 hover:border-neutral-300'
                    : 'bg-amber-50/30 border-amber-200/90 shadow-xs hover:border-amber-400/80'
                )}
              >
                {/* Left Content Area */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pt-0.5 shrink-0"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(item.id)}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Meta row: Badges + Channel + Time */}
                    <div className="flex flex-wrap items-center gap-2">
                      {renderGravityBadge(item.type)}
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-neutral-700">
                        {item.channel}
                      </Badge>

                      {!item.isRead ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                          Non lu
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-neutral-400">
                          Lu
                        </span>
                      )}

                      <span className="text-neutral-300">•</span>

                      <div
                        className="flex items-center gap-1 text-[11px] text-neutral-500 font-medium"
                        title={new Date(item.createdAt).toLocaleString('fr-FR')}
                      >
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>{formatRelativeTime(item.createdAt)}</span>
                        <span className="text-[10px] text-neutral-400 hidden md:inline">
                          ({new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>

                      {/* Recipient Indicator restricted to ROOT and SuperAdmin */}
                      {isRootOrSuperAdmin && item.recipient && (
                        <>
                          <span className="text-neutral-300">•</span>
                          <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                            Cible : <strong>{item.recipient}</strong>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className={cn(
                        'text-sm tracking-tight',
                        item.isRead ? 'font-semibold text-neutral-800' : 'font-extrabold text-neutral-950'
                      )}
                    >
                      {item.title}
                    </h3>

                    {/* Content / Message */}
                    <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                >
                  <button
                    type="button"
                    onClick={(e) => handleToggleRead(item.id, e)}
                    title={item.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
                    className={cn(
                      'p-2 rounded-xl border text-xs transition cursor-pointer',
                      item.isRead
                        ? 'border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                        : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    {item.isRead ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSingleDeleteId(item.id)}
                    title="Supprimer la notification"
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

      {/* Confirmation Modal Multiple Delete */}
      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteSelected}
        itemName={`${selectedIds.length} notification(s)`}
      />

      {/* Confirmation Modal Single Delete */}
      <DeleteConfirmModal
        isOpen={Boolean(singleDeleteId)}
        onClose={() => setSingleDeleteId(null)}
        onConfirm={handleConfirmSingleDelete}
        itemName="cette notification"
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
