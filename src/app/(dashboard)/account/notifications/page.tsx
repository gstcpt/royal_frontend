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
import { useI18nStore } from '@/stores/i18n.store';

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
  const { t: tr, locale } = useI18nStore();
  const dateLoc = locale === 'ar' ? 'ar-TN' : 'fr-TN';
  const [notifications, setNotifications] = React.useState<PersonalNotif[]>([]);
  const [catalogFeed, setCatalogFeed] = React.useState<CatalogFeedItem[]>([]);
  const [personalTotal, setPersonalTotal] = React.useState(0);
  const [unreadTotal, setUnreadTotal] = React.useState(0);
  const [personalHasMore, setPersonalHasMore] = React.useState(false);
  const [feedTotal, setFeedTotal] = React.useState(0);
  const [feedHasMore, setFeedHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadingMorePersonal, setLoadingMorePersonal] = React.useState(false);
  const [loadingMoreFeed, setLoadingMoreFeed] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const personalSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const feedSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const personalOffsetRef = React.useRef(0);
  const feedOffsetRef = React.useRef(0);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    personalOffsetRef.current = 0;
    feedOffsetRef.current = 0;
    try {
      const res = await fetchApi('/storefront-cms/my-notifications?limit=10&offset=0&feedLimit=10&feedOffset=0');
      const d = res?.data || res;
      const personalList: PersonalNotif[] = d?.notifications || [];
      const feedList: CatalogFeedItem[] = d?.catalogFeed || [];
      setNotifications(personalList);
      setCatalogFeed(feedList);
      personalOffsetRef.current = personalList.length;
      feedOffsetRef.current = feedList.length;
      setPersonalTotal(Number(d?.personalTotal ?? personalList.length));
      setUnreadTotal(Number(d?.unreadCount ?? personalList.filter((n) => !n.isRead).length));
      setPersonalHasMore(Boolean(d?.personalHasMore));
      setFeedTotal(Number(d?.feedTotal ?? feedList.length));
      setFeedHasMore(Boolean(d?.feedHasMore));
    } catch {
      setNotifications([]);
      setCatalogFeed([]);
      setPersonalHasMore(false);
      setFeedHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMorePersonal = React.useCallback(async () => {
    if (!personalHasMore || loadingMorePersonal || loading) return;
    setLoadingMorePersonal(true);
    try {
      const off = personalOffsetRef.current;
      const res = await fetchApi(`/storefront-cms/my-notifications?limit=10&offset=${off}&feedLimit=0&feedOffset=0`);
      const d = res?.data || res;
      const next: PersonalNotif[] = d?.notifications || [];
      if (next.length > 0) {
        setNotifications((prev) => {
          const seen = new Set(prev.map((x) => x.id));
          return [...prev, ...next.filter((x) => !seen.has(x.id))];
        });
        personalOffsetRef.current = off + next.length;
      }
      setPersonalHasMore(Boolean(d?.personalHasMore && next.length > 0));
      if (d?.personalTotal !== undefined) setPersonalTotal(Number(d.personalTotal));
    } finally {
      setLoadingMorePersonal(false);
    }
  }, [personalHasMore, loadingMorePersonal, loading]);

  const loadMoreFeed = React.useCallback(async () => {
    if (!feedHasMore || loadingMoreFeed || loading) return;
    setLoadingMoreFeed(true);
    try {
      const off = feedOffsetRef.current;
      const res = await fetchApi(`/storefront-cms/my-notifications?limit=0&offset=0&feedLimit=10&feedOffset=${off}`);
      const d = res?.data || res;
      const next: CatalogFeedItem[] = d?.catalogFeed || [];
      if (next.length > 0) {
        setCatalogFeed((prev) => {
          const seen = new Set(prev.map((x) => x.id));
          return [...prev, ...next.filter((x) => !seen.has(x.id))];
        });
        feedOffsetRef.current = off + next.length;
      }
      setFeedHasMore(Boolean(d?.feedHasMore && next.length > 0));
      if (d?.feedTotal !== undefined) setFeedTotal(Number(d.feedTotal));
    } finally {
      setLoadingMoreFeed(false);
    }
  }, [feedHasMore, loadingMoreFeed, loading]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    const el = personalSentinelRef.current;
    if (!el || !personalHasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMorePersonal();
      },
      { rootMargin: '140px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [personalHasMore, loadMorePersonal]);

  React.useEffect(() => {
    const el = feedSentinelRef.current;
    if (!el || !feedHasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreFeed();
      },
      { rootMargin: '140px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [feedHasMore, loadMoreFeed]);

  const handleToggleRead = async (id: string) => {
    const t = notifications.find((n) => n.id === id);
    try {
      await fetchApi(`/storefront-cms/my-notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
      if (t) setUnreadTotal((c) => Math.max(0, c + (t.isRead ? 1 : -1)));
    } catch {
      await loadData();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetchApi('/storefront-cms/my-notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadTotal(0);
    } catch {
      await loadData();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchApi(`/storefront-cms/my-notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      setPersonalTotal((c) => Math.max(0, c - 1));
    } catch {
      await loadData();
    }
  };

  const handleBulkAction = async (action: 'MARK_READ' | 'MARK_UNREAD' | 'DELETE') => {
    if (selectedIds.length === 0) return;
    const ids = [...selectedIds];
    try {
      await fetchApi('/storefront-cms/my-notifications/bulk-action', {
        method: 'POST',
        body: JSON.stringify({ ids, action }),
      });
      setSelectedIds([]);
    } finally {
      await loadData();
    }
  };

  const unreadCount = unreadTotal;
  const getCatLabel = (cat: string) =>
    tr(`account.notif_cat_${cat}`, (CAT_BADGE[cat] || CAT_BADGE.ORDER).label);

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: tr('account.dashboard_crumb'), href: '/dashboard' },
          { label: tr('account.notif_crumb') },
        ]}
      />

      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
              {tr('account.notif_title')}
            </h1>
            <p className="text-xs text-neutral-500">
              {tr('account.notif_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs">
              <CheckCheck className="w-3.5 h-3.5 me-1.5 text-emerald-600" />
              {tr('account.mark_all_read')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`} />
            {tr('account.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal DB Alerts */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              {tr('account.personal_alerts')} ({notifications.length}/{personalTotal})
            </h2>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === notifications.length}
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? notifications.map((x) => x.id) : [])
                    }
                    className="rounded border-neutral-300 w-3.5 h-3.5"
                  />
                  <span>{tr('account.select_all_short')}</span>
                </label>
              )}
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {unreadCount} {tr('account.unread_count')}
                </span>
              )}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-xs">
              <span className="font-bold text-[#1D232E]">
                {selectedIds.length} {tr('account.selected_count')}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleBulkAction('MARK_READ')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 font-bold text-[11px] cursor-pointer"
                >
                  {tr('account.mark_read_bulk')}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('MARK_UNREAD')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-800 font-bold text-[11px] cursor-pointer"
                >
                  {tr('account.mark_unread_bulk')}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('DELETE')}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                >
                  {tr('account.delete_btn')}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-xs text-neutral-500">{tr('account.loading_short')}</div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
              {tr('account.notif_empty')}
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
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(n.id)}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(n.id) ? prev.filter((x) => x !== n.id) : [...prev, n.id],
                            )
                          }
                          className="rounded border-neutral-300 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.cls}`}
                        >
                          <Icon className="w-3 h-3" />
                          {getCatLabel(n.category)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(n.createdAt).toLocaleDateString(dateLoc, {
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
                          <span>{tr('account.consult_link')}</span>
                          <ArrowUpRight className="w-3 h-3 rtl:-scale-x-100" />
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(n.id)}
                        title={n.isRead ? tr('account.mark_unread_title') : tr('account.mark_read_btn')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[10px] font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      >
                        {n.isRead ? tr('account.read_done') : tr('account.mark_read_btn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        title={tr('account.delete_btn')}
                        className="p-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div ref={personalSentinelRef} className="pt-2 flex flex-col items-center gap-2">
                {loadingMorePersonal && (
                  <span className="text-xs text-neutral-500">{tr('account.loading_more_10')}</span>
                )}
                {!loadingMorePersonal && personalHasMore && (
                  <button
                    type="button"
                    onClick={loadMorePersonal}
                    className="px-4 py-1.5 rounded-full border border-neutral-200 bg-[#FBF9F4] text-xs font-bold text-neutral-700 hover:border-[var(--royal-primary)] cursor-pointer"
                  >
                    {tr('account.load_older_10')} ({notifications.length}/{personalTotal})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Order / Promos / New Articles / Price Changes Feed */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              {tr('account.feed_news_title')} ({catalogFeed.length}/{feedTotal})
            </h2>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-neutral-500">{tr('account.loading_short')}</div>
          ) : catalogFeed.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
              {tr('account.feed_news_empty')}
            </div>
          ) : (
            <div className="space-y-3 max-h-[680px] overflow-y-auto pe-1">
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
                        {getCatLabel(item.category)}
                        {item.badge ? ` • ${item.badge}` : ''}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString(dateLoc)}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-neutral-900">{item.title}</div>
                    <p className="text-[11px] text-neutral-600">{item.message}</p>
                  </Link>
                );
              })}
              <div ref={feedSentinelRef} className="pt-2 flex flex-col items-center gap-2">
                {loadingMoreFeed && (
                  <span className="text-xs text-neutral-500">{tr('account.loading_more_10')}</span>
                )}
                {!loadingMoreFeed && feedHasMore && (
                  <button
                    type="button"
                    onClick={loadMoreFeed}
                    className="px-4 py-1.5 rounded-full border border-neutral-200 bg-[#FBF9F4] text-xs font-bold text-neutral-700 hover:border-[var(--royal-primary)] cursor-pointer"
                  >
                    {tr('account.load_next_10')} ({catalogFeed.length}/{feedTotal})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
