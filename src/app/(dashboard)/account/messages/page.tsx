'use client';

import * as React from 'react';
import {
  MessageSquare,
  Send,
  RefreshCw,
  ShieldCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb, Button, Input, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useI18nStore } from '@/stores/i18n.store';

interface SupportMessageItem {
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: string;
}

interface SupportThreadItem {
  id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  messages: SupportMessageItem[];
}

const ROLE_BADGE: Record<string, string> = {
  CLIENT: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  ROOT: 'bg-[#FBF6E8] text-[#9A7414] border-[#E6D6A6]',
  SUPER_ADMIN: 'bg-amber-100 text-amber-900 border-amber-300',
  WEBSITE_MANAGER: 'bg-blue-50 text-blue-800 border-blue-200',
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Ouverte', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  IN_PROGRESS: { label: 'En discussion', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  RESOLVED: { label: 'Résolue', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function ClientMessagesPage() {
  const { user } = useAuthStore();
  const { t, locale } = useI18nStore();
  const [threads, setThreads] = React.useState<SupportThreadItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [creatingNew, setCreatingNew] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [mobileModalOpen, setMobileModalOpen] = React.useState(false);
  const dateLoc = locale === 'ar' ? 'ar-TN' : 'fr-TN';

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const [newSubject, setNewSubject] = React.useState('');
  const [messageText, setMessageText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState('');

  const loadThreads = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/support/my-threads');
      const list = Array.isArray(res) ? res : res?.data || [];
      setThreads(list);
      if (list.length > 0 && !selectedId && !creatingNew) {
        setSelectedId(list[0].id);
      }
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId, creatingNew]);

  React.useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const activeThread = threads.find((th) => th.id === selectedId) || null;
  const getThreadStatusLabel = (status: string) =>
    t(`account.thread_status_${status}`, (STATUS_BADGE[status] || STATUS_BADGE.OPEN).label);

  const renderThreadOrComposer = (inModal = false) =>
    creatingNew || !activeThread ? (
      <form
        onSubmit={handleSend}
        className={inModal ? 'p-5 sm:p-6 space-y-5 flex flex-col justify-between' : 'p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-between'}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-black text-neutral-900">
                {t('account.new_msg_title')}
              </h2>
              <p className="text-[11px] text-neutral-500">
                {t('account.support_auto_recipient')}
              </p>
            </div>
          </div>

          <Input
            label={t('account.subject_label')}
            placeholder={t('account.subject_ph')}
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              {t('account.message_label')}
            </label>
            <textarea
              rows={inModal ? 5 : 7}
              required
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t('account.message_ph')}
              className="w-full p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-950"
            />
          </div>

          {sendError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {sendError}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-100">
          <Button type="submit" disabled={sending} className="text-xs px-7">
            <Send className="w-3.5 h-3.5 me-2" />
            {sending ? t('account.sending') : t('account.send_to_support')}
          </Button>
        </div>
      </form>
    ) : (
      <>
        {/* Thread Header */}
        <div className="p-5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-neutral-900">{activeThread.subject}</h2>
            <p className="text-[11px] text-neutral-500">
              {t('account.thread_discussion_with')}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-bold ${
              (STATUS_BADGE[activeThread.status] || STATUS_BADGE.OPEN).cls
            }`}
          >
            {activeThread.status === 'RESOLVED' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            {getThreadStatusLabel(activeThread.status)}
          </span>
        </div>

        {/* Conversation Messages */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[420px] bg-[#FAFBFB]">
          {activeThread.messages.map((m) => {
            const isOwn = m.senderRole === 'CLIENT' || m.senderId === user?.id;
            const roleCls = ROLE_BADGE[m.senderRole] || ROLE_BADGE.WEBSITE_MANAGER;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 border shadow-2xs space-y-1.5 ${
                    isOwn
                      ? 'bg-[#FBF6E8] text-[#1D232E] border-[#E6D6A6]'
                      : 'bg-white text-neutral-900 border-neutral-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold">{m.senderName}</span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isOwn
                          ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)]'
                          : roleCls
                      }`}
                    >
                      {m.senderRole === 'CLIENT' ? t('account.role_you') : m.senderRole}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {new Date(m.createdAt).toLocaleDateString(dateLoc, {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {m.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Reply Input */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-neutral-200 bg-white space-y-2 rounded-b-2xl"
        >
          {sendError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {sendError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <textarea
              rows={2}
              required
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t('account.reply_ph')}
              className="flex-1 w-full p-3 rounded-xl bg-[#F8F9FA] border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-950 resize-none"
            />
            <Button type="submit" disabled={sending} className="text-xs shrink-0 h-11 px-5 w-full sm:w-auto">
              <Send className="w-3.5 h-3.5 me-1.5" />
              {sending ? t('account.sending') : t('account.reply_btn')}
            </Button>
          </div>
        </form>
      </>
    );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSending(true);
    setSendError('');
    try {
      const payload = creatingNew || !activeThread
        ? {
            subject: newSubject.trim() || t('account.default_support_subject'),
            message: messageText.trim(),
          }
        : {
            threadId: activeThread.id,
            message: messageText.trim(),
          };

      const res = await fetchApi('/storefront-cms/support/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const updated = res?.data || res;
      if (updated?.id) {
        setThreads((prev) => {
          const exists = prev.some((th) => th.id === updated.id);
          return exists
            ? [updated, ...prev.filter((th) => th.id !== updated.id)]
            : [updated, ...prev];
        });
        setSelectedId(updated.id);
      }
      setCreatingNew(false);
      setNewSubject('');
      setMessageText('');
    } catch (err: any) {
      setSendError(err?.message || t('account.send_msg_err'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: t('account.dashboard_crumb'), href: '/dashboard' },
          { label: t('account.messages_crumb') },
        ]}
      />

      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
              {t('account.messages_title')}
            </h1>
            <p className="text-xs text-neutral-500">
              {t('account.messages_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCreatingNew(true);
              setSelectedId(null);
              setSendError('');
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setMobileModalOpen(true);
              }
            }}
            className="text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 me-1.5" />
            {t('account.new_thread')}
          </Button>
          <Button variant="outline" size="sm" onClick={loadThreads} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`} />
            {t('account.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Threads List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-4 space-y-3">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {t('account.threads_list_title')} ({threads.length})
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-neutral-500">{t('account.loading_short')}</div>
          ) : threads.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
              {t('account.threads_empty')}
            </div>
          ) : (
            <div className="space-y-2 max-h-[580px] overflow-y-auto">
              {threads.map((th) => {
                const isSel = !creatingNew && selectedId === th.id;
                const st = STATUS_BADGE[th.status] || STATUS_BADGE.OPEN;
                const lastMsg = th.messages?.[th.messages.length - 1];
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      setCreatingNew(false);
                      setSelectedId(th.id);
                      setSendError('');
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setMobileModalOpen(true);
                      }
                    }}
                    className={`w-full text-start p-4 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                      isSel
                        ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] shadow-sm'
                        : 'bg-[#F8F9FA] text-neutral-900 border-neutral-200/80 hover:border-[#C59B27]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate">{th.subject}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          isSel
                            ? 'bg-black/10 text-[var(--royal-primary-text)] border-black/15'
                            : st.cls
                        }`}
                      >
                        {getThreadStatusLabel(th.status)}
                      </span>
                    </div>
                    {lastMsg && (
                      <p
                        className={`text-[11px] line-clamp-1 ${
                          isSel ? 'opacity-80' : 'text-neutral-500'
                        }`}
                      >
                        {lastMsg.senderName} : {lastMsg.body}
                      </p>
                    )}
                    <div
                      className={`text-[10px] font-mono ${
                        isSel ? 'opacity-70' : 'text-neutral-400'
                      }`}
                    >
                      {th.messages?.length || 0} {t('account.messages_unit')} •{' '}
                      {new Date(th.updatedAt).toLocaleDateString(dateLoc)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Conversation or New Message Composer (Desktop inline pane + Mobile Modal) */}
        <div className="hidden lg:flex lg:col-span-8 bg-white rounded-2xl border border-neutral-200/80 shadow-sm flex-col min-h-[540px]">
          {renderThreadOrComposer(false)}
        </div>
      </div>

      <Modal
        isOpen={isMobile && mobileModalOpen}
        onClose={() => setMobileModalOpen(false)}
        title={creatingNew || !activeThread ? t('account.new_msg_modal_title') : activeThread.subject}
        subtitle={t('account.support_subtitle_short')}
        size="3xl"
      >
        <div className="flex flex-col min-h-[380px]">
          {renderThreadOrComposer(true)}
        </div>
      </Modal>
    </div>
  );
}
