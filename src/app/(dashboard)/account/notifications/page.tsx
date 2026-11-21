'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  ShoppingBag,
  Percent,
  Sparkles,
  Tag,
  ArrowUpRight,
  MessageSquare,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb, Button } from '@/components/ui';

interface PersonalNotif {
  id: string;
  category: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface CatalogFeedItem {
  id: string;
  category: 'ORDER' | 'PROMO' | 'CATALOG' | 'PRICE';
  title: string;
  message: string;
  link: string;
  badge?: string;
  createdAt: string;
}

const CAT_BADGE: Record<string, { label: string; cls: string; Icon: React.ComponentType<any> }> = {
  ORDER: { label: 'Commande', cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: ShoppingBag },
  PROMO: { label: 'Promotion', cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: Percent },
  CATALOG: { label: 'Nouveauté', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: Sparkles },
  PRICE: { label: 'Prix modifié', cls: 'bg-amber-50 text-amber-800 border-amber-200', Icon: Tag },
  SUPPORT: { label: 'Support', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', Icon: MessageSquare },
};

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = React.useState<PersonalNotif[]>([]);
  const [catalogFeed, setCatalogFeed] = React.useState<CatalogFeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/my-notifications');
      const d = res?.data || res;
      setNotifications(d?.notifications || []);
      setCatalogFeed(d?.catalogFeed || []);
    } catch {
      setNotifications([]);
      setCatalogFeed([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleRead = async (id: string) => {
    await fetchApi(`/storefront-cms/my-notifications/${id}/read`, { method: 'PATCH' }).catch(() => null);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
  };

  const handleMarkAllRead = async () => {
    await fetchApi('/storefront-cms/my-notifications/read-all', { method: 'PATCH' }).catch(() => null);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id: string) => {
    await fetchApi(`/storefront-cms/my-notifications/${id}`, { method: 'DELETE' }).catch(() => null);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: 'Tableau de bord', href: '/dashboard' },
          { label: 'Mes Notifications' },
        ]}
      />

      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
              Centre de Notifications Royal
            </h1>
            <p className="text-xs text-neutral-500">
              Suivez les évolutions de vos commandes, les réponses du Support Royal, les promotions, nouveaux articles et variations de prix.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs">
              <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Tout marquer comme lu
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal DB Alerts */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Mes Alertes Personnelles ({notifications.length})
            </h2>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {unreadCount} non lue(s)
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-neutral-500">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
              Aucune alerte personnelle reçue pour le moment. Les changements de statut de vos commandes, réponses support et promotions apparaîtront ici.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const meta = CAT_BADGE[n.category] || CAT_BADGE.ORDER;
                const Icon = meta.Icon;
                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                      n.isRead
                        ? 'bg-[#F8F9FA] border-neutral-200/70'
                        : 'bg-amber-50/40 border-amber-300 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.cls}`}
                        >
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(n.createdAt).toLocaleDateString('fr-TN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-neutral-900">{n.title}</div>
                      <p className="text-xs text-neutral-600 leading-relaxed">{n.message}</p>
                      {n.link && (
                        <Link
                          href={n.link}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline pt-1"
                        >
                          <span>Consulter</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(n.id)}
                        title={n.isRead ? 'Marquer non lu' : 'Marquer lu'}
                        className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[10px] font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      >
                        {n.isRead ? 'Lu ✓' : 'Marquer lu'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        title="Supprimer"
                        className="p-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Order / Promos / New Articles / Price Changes Feed */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Actualités Commandes, Promos, Nouveautés &amp; Tarifs ({catalogFeed.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-neutral-500">Chargement...</div>
          ) : catalogFeed.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
              Aucune mise à jour récente.
            </div>
          ) : (
            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {catalogFeed.map((item) => {
                const meta = CAT_BADGE[item.category] || CAT_BADGE.CATALOG;
                const Icon = meta.Icon;
                return (
                  <Link
                    key={item.id}
                    href={item.link}
                    className="block p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200/80 hover:border-neutral-900 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.cls}`}
                      >
                        <Icon className="w-3 h-3" />
                        {meta.label}
                        {item.badge ? ` • ${item.badge}` : ''}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString('fr-TN')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-neutral-900">{item.title}</div>
                    <p className="text-[11px] text-neutral-600">{item.message}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
