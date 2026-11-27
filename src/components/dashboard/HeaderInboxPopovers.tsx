'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Mail, ArrowRight, CheckCheck, Clock } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useI18nStore } from '@/stores/i18n.store';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';

interface ContactItem {
  id: string;
  fullName: string;
  email?: string;
  subject: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export function HeaderInboxPopovers({ isClientOnly }: { isClientOnly: boolean }) {
  const router = useRouter();
  const { t } = useI18nStore();
  const { isRouteVisible } = useRouteVisibility();
  const containerRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<'contacts' | 'notifications' | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [unreadContactsTotal, setUnreadContactsTotal] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifsTotal, setUnreadNotifsTotal] = useState<number>(0);

  const allNotifsHref = isClientOnly ? '/account/notifications' : '/dashboard/community/notifications';
  const canShowContacts = !isClientOnly && isRouteVisible('/dashboard/community/contacts');
  const canShowNotifications = isRouteVisible(allNotifsHref);

  const loadFeeds = useCallback(async () => {
    try {
      const notifUrl = isClientOnly
        ? '/storefront-cms/my-notifications?limit=5&offset=0'
        : '/storefront-cms/notifications?limit=5&offset=0';
      const [notifRes, contactRes] = await Promise.all([
        canShowNotifications ? fetchApi(notifUrl).catch(() => null) : Promise.resolve(null),
        canShowContacts ? fetchApi('/storefront-cms/contacts?limit=5').catch(() => null) : Promise.resolve(null),
      ]);

      const rawNotifs = Array.isArray(notifRes)
        ? notifRes
        : notifRes?.notifications || notifRes?.data || notifRes?.items || [];
      const top5Notifs = Array.isArray(rawNotifs) ? rawNotifs.slice(0, 5) : [];
      setNotifications(top5Notifs);
      const serverNotifUnread =
        typeof notifRes?.unreadCount === 'number'
          ? notifRes.unreadCount
          : typeof notifRes?.data?.unreadCount === 'number'
          ? notifRes.data.unreadCount
          : Array.isArray(rawNotifs)
          ? rawNotifs.filter((n: any) => !n.isRead).length
          : 0;
      setUnreadNotifsTotal(serverNotifUnread);

      if (canShowContacts && contactRes) {
        const rawContacts = Array.isArray(contactRes)
          ? contactRes
          : contactRes?.items || contactRes?.data || [];
        const top5Contacts = Array.isArray(rawContacts) ? rawContacts.slice(0, 5) : [];
        setContacts(top5Contacts);
        const serverContactUnread =
          typeof contactRes?.unreadCount === 'number'
            ? contactRes.unreadCount
            : Array.isArray(rawContacts)
            ? rawContacts.filter((c: any) => !c.isRead).length
            : 0;
        setUnreadContactsTotal(serverContactUnread);
      }
    } catch {
      // ignore transient polling failure
    }
  }, [isClientOnly, canShowContacts, canShowNotifications]);

  useEffect(() => {
    if (!canShowContacts && !canShowNotifications) return;
    loadFeeds();
    const timer = setInterval(loadFeeds, 60000);
    return () => clearInterval(timer);
  }, [loadFeeds, canShowContacts, canShowNotifications]);

  useEffect(() => {
    const onOutside = (ev: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
        setOpenMenu(null);
      }
    };
    if (openMenu) {
      document.addEventListener('mousedown', onOutside);
    }
    return () => document.removeEventListener('mousedown', onOutside);
  }, [openMenu]);

  const unreadContacts = unreadContactsTotal;
  const unreadNotifs = unreadNotifsTotal;

  if (!canShowContacts && !canShowNotifications) {
    return null;
  }

  const markAllContactsRead = () => {
    setContacts((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadContactsTotal(0);
    void fetchApi('/storefront-cms/contacts/read-all', { method: 'PATCH' }).catch(() => null);
  };

  const markAllNotifsRead = () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadNotifsTotal(0);
    const url = isClientOnly
      ? '/storefront-cms/my-notifications/read-all'
      : '/storefront-cms/notifications/read-all';
    void fetchApi(url, { method: 'PATCH' }).catch(() => null);
  };

  const markNotifRead = (n: NotificationItem) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnreadNotifsTotal((prev) => Math.max(0, prev - 1));
      const endpoint = isClientOnly
        ? `/storefront-cms/my-notifications/${n.id}/read`
        : `/storefront-cms/notifications/${n.id}/read`;
      void fetchApi(endpoint, { method: 'PATCH' }).catch(() => null);
    }
    setOpenMenu(null);
    const safeTarget = n.link && isRouteVisible(n.link) ? n.link : allNotifsHref;
    router.push(safeTarget);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5">
      {/* Contact Messages Popover (Staff) */}
      {canShowContacts && (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const next = openMenu === 'contacts' ? null : 'contacts';
              setOpenMenu(next);
              if (next) loadFeeds();
            }}
            title={t('dashboard.contacts_title')}
            aria-label={t('dashboard.contacts_title')}
            className="relative p-2 rounded-full border border-[#E6E1D6] bg-white hover:bg-[#FBF6E8] text-[#1D232E] transition cursor-pointer"
          >
            <Mail className="w-4 h-4 text-[#C59B27]" />
            {unreadContacts > 0 && (
              <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-black shadow-xs">
                {unreadContacts}
              </span>
            )}
          </button>

          {openMenu === 'contacts' && (
            <div className="absolute end-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-[#E6E1D6] shadow-2xl overflow-hidden z-[9999]">
              <div className="px-4 py-3 border-b border-slate-100 bg-[#FBF9F4] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-[#1D232E] block truncate">
                    {t('dashboard.contacts_header')}
                  </span>
                  <span className="text-[10px] font-bold text-[#9A7414]">
                    {unreadContacts} {t('dashboard.unread_suffix')}
                  </span>
                </div>
                {unreadContacts > 0 && (
                  <button
                    type="button"
                    onClick={markAllContactsRead}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9A7414] hover:underline cursor-pointer shrink-0"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>{t('dashboard.mark_all_read')}</span>
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400">
                    {t('dashboard.no_recent_contacts')}
                  </div>
                ) : (
                  contacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (!c.isRead) {
                          setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, isRead: true } : x)));
                          setUnreadContactsTotal((prev) => Math.max(0, prev - 1));
                          void fetchApi(`/storefront-cms/contacts/${c.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ isRead: true }),
                          }).catch(() => null);
                        }
                        setOpenMenu(null);
                        router.push('/dashboard/community/contacts');
                      }}
                      className={`w-full text-start px-4 py-3 hover:bg-[#FBF6E8]/70 transition flex items-start gap-2.5 cursor-pointer ${
                        !c.isRead ? 'bg-[#FBF9F4]' : ''
                      }`}
                    >
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          !c.isRead ? 'bg-[#C59B27]' : 'bg-slate-200'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1D232E] truncate">{c.fullName}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-[#9A7414] truncate">{c.subject}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <Link
                href="/dashboard/community/contacts"
                onClick={() => setOpenMenu(null)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FBF9F4] border-t border-slate-100 text-xs font-bold text-[#9A7414] hover:bg-[#FBF6E8] transition"
              >
                <span>{t('dashboard.view_all_contacts')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Notifications Popover */}
      {canShowNotifications && (
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            const next = openMenu === 'notifications' ? null : 'notifications';
            setOpenMenu(next);
            if (next) loadFeeds();
          }}
          title={t('dashboard.notifications_title')}
          aria-label={t('dashboard.notifications_title')}
          className="relative p-2 rounded-full border border-[#E6E1D6] bg-white hover:bg-[#FBF6E8] text-[#1D232E] transition cursor-pointer"
        >
          <Bell className="w-4 h-4 text-[#C59B27]" />
          {unreadNotifs > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#C59B27] text-white text-[9px] font-black shadow-xs">
              {unreadNotifs}
            </span>
          )}
        </button>

        {openMenu === 'notifications' && (
          <div className="absolute end-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-[#E6E1D6] shadow-2xl overflow-hidden z-[9999]">
            <div className="px-4 py-3 border-b border-slate-100 bg-[#FBF9F4] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-[#1D232E] block truncate">
                  {t('dashboard.notifications_header')}
                </span>
                <span className="text-[10px] font-bold text-[#9A7414]">
                  {unreadNotifs} {t('dashboard.unread_suffix')}
                </span>
              </div>
              {unreadNotifs > 0 && (
                <button
                  type="button"
                  onClick={markAllNotifsRead}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9A7414] hover:underline cursor-pointer shrink-0"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>{t('dashboard.mark_all_read')}</span>
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400">
                  {t('dashboard.no_recent_notifications')}
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markNotifRead(n)}
                    className={`w-full text-start px-4 py-3 hover:bg-[#FBF6E8]/70 transition flex items-start gap-2.5 cursor-pointer ${
                      !n.isRead ? 'bg-[#FBF9F4]' : ''
                    }`}
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        !n.isRead ? 'bg-[#C59B27]' : 'bg-slate-200'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#1D232E] truncate">{n.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <Link
              href={allNotifsHref}
              onClick={() => setOpenMenu(null)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FBF9F4] border-t border-slate-100 text-xs font-bold text-[#9A7414] hover:bg-[#FBF6E8] transition"
            >
              <span>{t('dashboard.view_all_notifications')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
