'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FileCode,
  Save,
  Eye,
  Plus,
  Trash2,
  Mail,
  Send,
  ShoppingBag,
  ShieldCheck,
  Code2,
  Image as ImageIcon,
  Sparkles,
  Table,
  Check,
  Download,
  Languages,
  RotateCcw,
  History,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button, Input, Textarea, Badge, Modal, DeleteConfirmModal, Breadcrumb, Toast, Toggle } from '@/components/ui';
import { fetchApi } from '@/lib/api';

interface EmailTemplateItem {
  id: string;
  key: string;
  category: 'auth' | 'campaign' | 'messages' | 'orders';
  name: string;
  subject: string;
  subjectAr?: string | null;
  bodyHtml: string;
  bodyHtmlAr?: string | null;
  variables: string[];
  isActive: boolean;
}

interface EmailLogItem {
  id: string;
  to: string;
  subject: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
  error?: string | null;
  sentAt?: string | null;
  createdAt: string;
  template?: { id: string; key: string; name: string } | null;
}

const CAT_TABS = [
  { id: 'auth', label: 'Authentification', icon: ShieldCheck, desc: 'Bienvenue, Code OTP, Mot de passe oublié, Réinitialisation...' },
  { id: 'campaign', label: 'Campagne', icon: Send, desc: 'Promos articles, Ventes privées VIP, Offres flash...' },
  { id: 'messages', label: 'Messages', icon: Mail, desc: 'Réponses Support client et Formulaire Contact' },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag, desc: 'Confirmation livraison, Suivi statut, PDF FAC & BL...' },
];

const EMPTY_FORM = {
  name: '',
  key: '',
  subject: '',
  subjectAr: '',
  bodyHtml: '<p>Bonjour <strong>{{firstName}}</strong>,</p><p>...</p>',
  bodyHtmlAr: '<p>مرحباً <strong>{{firstName}}</strong>،</p><p>...</p>',
  variablesStr: '{{appName}}, {{firstName}}',
  isActive: true,
};

function EmailTemplatesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCat = (searchParams.get('cat') as 'auth' | 'campaign' | 'messages' | 'orders') || 'auth';

  const [templates, setTemplates] = React.useState<EmailTemplateItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [activeLang, setActiveLang] = React.useState<'FR' | 'AR'>('FR');
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [compiledPreviewHtml, setCompiledPreviewHtml] = React.useState<string>('');
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [testModalOpen, setTestModalOpen] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState('');
  const [testLocale, setTestLocale] = React.useState<'FR' | 'AR'>('FR');
  const [sendingTest, setSendingTest] = React.useState(false);
  const [logsOpen, setLogsOpen] = React.useState(false);
  const [emailLogs, setEmailLogs] = React.useState<EmailLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [resettingDefault, setResettingDefault] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadTemplates = React.useCallback(async () => {
    const res = await fetchApi('/storefront-cms/cms/email-templates').catch(() => []);
    const list: EmailTemplateItem[] = Array.isArray(res) ? res : [];
    setTemplates(list);
    return list;
  }, []);

  const selectTemplate = React.useCallback((tpl: EmailTemplateItem) => {
    setSelectedId(tpl.id);
    setForm({
      name: tpl.name,
      key: tpl.key,
      subject: tpl.subject || '',
      subjectAr: tpl.subjectAr || '',
      bodyHtml: tpl.bodyHtml || '',
      bodyHtmlAr: tpl.bodyHtmlAr || '',
      variablesStr: Array.isArray(tpl.variables) ? tpl.variables.join(', ') : '',
      isActive: tpl.isActive !== false,
    });
  }, []);

  React.useEffect(() => {
    loadTemplates().then((list) => {
      const catList = list.filter((t) => t.category === activeCat);
      if (catList[0]) {
        selectTemplate(catList[0]);
      } else {
        setSelectedId('');
        setForm({
          ...EMPTY_FORM,
          key: `${activeCat}:custom_${Date.now()}`,
        });
      }
    });
  }, [activeCat, loadTemplates, selectTemplate]);

  // Compile server Light Luxury email shell preview dynamically for activeLang (FR / AR)
  const activeSubject = activeLang === 'AR' ? form.subjectAr : form.subject;
  const activeBodyHtml = activeLang === 'AR' ? form.bodyHtmlAr : form.bodyHtml;

  React.useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetchApi('/storefront-cms/cms/email-templates/preview', {
          method: 'POST',
          body: JSON.stringify({
            templateId: selectedId || undefined,
            templateKey: form.key || undefined,
            locale: activeLang,
            customSubject: activeSubject || undefined,
            customBodyHtml: activeBodyHtml || '<p></p>',
          }),
        });
        if (!cancelled && res?.htmlBody) {
          setCompiledPreviewHtml(res.htmlBody);
        }
      } catch {
        if (!cancelled) setCompiledPreviewHtml(activeBodyHtml);
      }
    }, 240);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedId, form.key, activeLang, activeSubject, activeBodyHtml]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim()) {
      setToastMsg({ text: 'Le nom et l’objet (FR) sont obligatoires.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category: activeCat,
        key: form.key.trim() || `${activeCat}:${Date.now()}`,
        name: form.name.trim(),
        subject: form.subject.trim(),
        subjectAr: form.subjectAr.trim(),
        bodyHtml: form.bodyHtml,
        bodyHtmlAr: form.bodyHtmlAr,
        variables: form.variablesStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: form.isActive,
      };
      if (selectedId) {
        await fetchApi(`/storefront-cms/cms/email-templates/${selectedId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setToastMsg({ text: 'Modèle HTML (FR & AR) enregistré dans PostgreSQL.', type: 'success' });
      } else {
        const created = await fetchApi('/storefront-cms/cms/email-templates', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (created?.id) setSelectedId(created.id);
        setToastMsg({ text: 'Nouveau modèle Light Luxury créé.', type: 'success' });
      }
      await loadTemplates();
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Erreur lors de la sauvegarde.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetFactoryDefault = async () => {
    if (!selectedId) return;
    setResettingDefault(true);
    try {
      const updated = await fetchApi(`/storefront-cms/cms/email-templates/${selectedId}/reset-default`, {
        method: 'POST',
      });
      await loadTemplates();
      if (updated?.id) selectTemplate(updated);
      setToastMsg({ text: 'Version Light Luxury FR/AR par défaut restaurée.', type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Aucun gabarit usine pour ce modèle personnalisé.', type: 'error' });
    } finally {
      setResettingDefault(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;
    setSendingTest(true);
    try {
      const testSub = testLocale === 'AR' ? form.subjectAr || form.subject : form.subject;
      const testBody = testLocale === 'AR' ? form.bodyHtmlAr || form.bodyHtml : form.bodyHtml;
      const res = await fetchApi('/storefront-cms/cms/email-templates/send-test', {
        method: 'POST',
        body: JSON.stringify({
          to: testEmail.trim(),
          templateId: selectedId || undefined,
          templateKey: form.key || undefined,
          locale: testLocale,
          customSubject: testSub,
          customBodyHtml: testBody,
        }),
      });
      setTestModalOpen(false);
      setToastMsg({ text: res?.message || `E-mail de test envoyé à ${testEmail}.`, type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Échec lors de l’envoi du test SMTP.', type: 'error' });
    } finally {
      setSendingTest(false);
    }
  };

  const openLogsModal = async () => {
    setLogsOpen(true);
    setLoadingLogs(true);
    try {
      const list = await fetchApi('/storefront-cms/cms/email-logs?limit=40');
      setEmailLogs(Array.isArray(list) ? list : []);
    } catch {
      setEmailLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetchApi(`/storefront-cms/cms/email-templates/${id}`, { method: 'DELETE' });
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setToastMsg({ text: 'Modèle supprimé.', type: 'success' });
    const list = await loadTemplates();
    const next = list.find((t) => t.category === activeCat);
    if (next) selectTemplate(next);
    else setSelectedId('');
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await Promise.allSettled(
      selectedIds.map((id) => fetchApi(`/storefront-cms/cms/email-templates/${id}`, { method: 'DELETE' })),
    );
    const count = selectedIds.length;
    setSelectedIds([]);
    setBulkDeleteOpen(false);
    setToastMsg({ text: `${count} modèle(s) supprimé(s).`, type: 'success' });
    const list = await loadTemplates();
    const next = list.find((t) => t.category === activeCat);
    if (next) selectTemplate(next);
    else setSelectedId('');
  };

  const handleExportSelected = () => {
    const sel = templates.filter((t) => selectedIds.includes(t.id));
    if (sel.length === 0) return;
    const blob = new Blob([JSON.stringify(sel, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_templates_${activeCat}_${sel.length}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMsg({ text: `${sel.length} modèle(s) exporté(s).`, type: 'success' });
  };

  const insertSnippet = (frSnippet: string, arSnippet: string, prepend = false) => {
    const chunk = activeLang === 'AR' ? arSnippet : frSnippet;
    setForm((prev) => {
      const current = activeLang === 'AR' ? prev.bodyHtmlAr : prev.bodyHtml;
      const next = prepend ? `${chunk}\n${current}` : `${current}\n${chunk}`;
      return activeLang === 'AR' ? { ...prev, bodyHtmlAr: next } : { ...prev, bodyHtml: next };
    });
  };

  const filtered = templates.filter((t) => t.category === activeCat);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);

  React.useEffect(() => {
    setPage(1);
  }, [activeCat, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedTemplates = filtered.slice((page - 1) * pageSize, page * pageSize);
  const currentTabMeta = CAT_TABS.find((c) => c.id === activeCat) || CAT_TABS[0];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                CMS — Modèles HTML Light Luxury : {currentTabMeta.label}
              </h1>
              <p className="text-xs text-slate-500">{currentTabMeta.desc}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={openLogsModal}>
              <History className="w-3.5 h-3.5" />
              <span>Historique SMTP</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestLocale(activeLang);
                setTestModalOpen(true);
              }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer Test</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedId('');
                setForm({
                  ...EMPTY_FORM,
                  key: `${activeCat}:modele_${Date.now()}`,
                });
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Modèle</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu Plein Écran</span>
            </Button>
            <Button variant="gold" size="sm" onClick={handleSave} isLoading={saving}>
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Modèles de courriels' },
              { label: currentTabMeta.label },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-4">
          <aside className="bg-white p-3 rounded-3xl border border-[#E6E1D6] shadow-xs space-y-1.5">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Familles d&apos;Emails
            </div>
            {CAT_TABS.map((t) => {
              const Icon = t.icon;
              const active = activeCat === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => router.replace(`/dashboard/root/email-templates?cat=${t.id}`, { scroll: false })}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition cursor-pointer ${
                    active
                      ? 'bg-[var(--royal-primary)] text-white shadow-xs'
                      : 'text-[#1D232E] hover:bg-[#FBF6E8]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[var(--royal-primary)]'}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </aside>

          <div className="space-y-2.5">
            {filtered.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white border border-[#E6E1D6] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = filtered.every((t) => selectedIds.includes(t.id));
                    setSelectedIds(allSelected ? [] : filtered.map((t) => t.id));
                  }}
                  className="inline-flex items-center gap-2 font-bold text-[#1D232E] cursor-pointer"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id))
                        ? 'bg-[#C59B27] border-[#C59B27] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id)) && <Check className="w-3 h-3" />}
                  </span>
                  <span>Tout ({filtered.length})</span>
                </button>
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={handleExportSelected}>
                      <Download className="w-3 h-3 mr-1" />
                      <span>JSON ({selectedIds.length})</span>
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      <span>({selectedIds.length})</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {paginatedTemplates.map((tpl) => {
              const isChecked = selectedIds.includes(tpl.id);
              const hasAr = Boolean(tpl.subjectAr && tpl.bodyHtmlAr);
              return (
                <div
                  key={tpl.id}
                  onClick={() => selectTemplate(tpl)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-2 ${
                    selectedId === tpl.id
                      ? 'bg-[#FBF6E8] border-[#C59B27] shadow-sm'
                      : 'bg-white border-[#E6E1D6] hover:border-[#C59B27]/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds((prev) =>
                          prev.includes(tpl.id) ? prev.filter((x) => x !== tpl.id) : [...prev, tpl.id],
                        );
                      }}
                      aria-label={`Sélectionner ${tpl.name}`}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                        isChecked ? 'bg-[#C59B27] border-[#C59B27] text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#1D232E] truncate">{tpl.name}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{tpl.subject}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-[#E6E1D6] text-[#9A7414]">
                          {tpl.key}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#E6E1D6] text-slate-600">
                          FR{hasAr ? ' + AR' : ''}
                        </span>
                        {tpl.isActive === false && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            Inactif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(tpl.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {filtered.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-white border border-[#E6E1D6] text-xs text-slate-600">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  aria-label="Modèles par page"
                  className="rounded-lg border border-[#E6E1D6] bg-white px-2 py-1 text-xs font-semibold text-[#1D232E] cursor-pointer"
                >
                  {[6, 12, 24, 48, 96].map((n) => (
                    <option key={n} value={n}>
                      {n} / p
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 rounded-lg border border-[#E6E1D6] hover:bg-[#FBF9F4] disabled:opacity-40 cursor-pointer font-semibold"
                  >
                    Préc.
                  </button>
                  <span className="font-bold text-[#1D232E]">
                    {page}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2 py-1 rounded-lg border border-[#E6E1D6] hover:bg-[#FBF9F4] disabled:opacity-40 cursor-pointer font-semibold"
                  >
                    Suiv.
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-5">
          {/* Meta & Language Toggle Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFECE6]">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#C59B27]" />
              <div className="inline-flex rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] p-1">
                {(['FR', 'AR'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      activeLang === lang
                        ? 'bg-[#C59B27] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#1D232E]'
                    }`}
                  >
                    {lang === 'FR' ? 'Français (Défaut)' : 'العربية (RTL)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1D232E]">
                <span>Actif</span>
                <Toggle
                  compact
                  size="sm"
                  checked={form.isActive}
                  onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                />
              </div>
              {selectedId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFactoryDefault}
                  isLoading={resettingDefault}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Gabarit Usine</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom du Modèle *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Clé Technique"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
            />
          </div>

          <Input
            label={activeLang === 'AR' ? 'Objet Arabe (موضوع الرسالة) *' : 'Objet Français (Subject) *'}
            dir={activeLang === 'AR' ? 'rtl' : 'ltr'}
            value={activeSubject}
            onChange={(e) =>
              setForm((f) =>
                activeLang === 'AR' ? { ...f, subjectAr: e.target.value } : { ...f, subject: e.target.value },
              )
            }
          />

          <Input
            label="Variables Dynamiques (séparées par virgule)"
            value={form.variablesStr}
            onChange={(e) => setForm({ ...form, variablesStr: e.target.value })}
            placeholder="{{appName}}, {{firstName}}, {{orderNumber}}, {{statusLabel}}"
          />

          {/* HTML Code Toolbar + Side-by-Side Live Compiled Light Luxury Preview */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>Code HTML ({activeLang}) &amp; Blocs Light Luxury</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    insertSnippet(
                      '<div style="margin:20px 0"><a href="{{storeUrl}}" style="display:inline-block;background:#C59B27;color:#FFFFFF;padding:12px 26px;border-radius:999px;text-decoration:none;font-weight:700;font-size:13px;">Découvrir la Sélection Royal</a></div>',
                      '<div style="margin:20px 0"><a href="{{storeUrl}}" style="display:inline-block;background:#C59B27;color:#FFFFFF;padding:12px 26px;border-radius:999px;text-decoration:none;font-weight:700;font-size:13px;">اكتشف التشكيلة الآن</a></div>',
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] border border-[#E6D6A6] text-[11px] font-bold text-[#9A7414] hover:bg-[#C59B27] hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> + Bouton Or
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertSnippet(
                      '<div style="margin:18px 0;padding:18px;border-radius:14px;background:#FBF6E8;border:1px solid #E6D6A6;text-align:center;"><div style="font-size:11px;font-weight:800;color:#9A7414;text-transform:uppercase;margin-bottom:6px;">Code Privilège</div><span style="font-family:monospace;font-size:24px;font-weight:900;letter-spacing:4px;color:#1D232E;">{{promoCode}}</span></div>',
                      '<div style="margin:18px 0;padding:18px;border-radius:14px;background:#FBF6E8;border:1px solid #E6D6A6;text-align:center;"><div style="font-size:11px;font-weight:800;color:#9A7414;margin-bottom:6px;">الرمز الخاص</div><span style="font-family:monospace;font-size:24px;font-weight:900;letter-spacing:4px;color:#1D232E;direction:ltr;unicode-bidi:embed;">{{promoCode}}</span></div>',
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] border border-[#E6D6A6] text-[11px] font-bold text-[#9A7414] hover:bg-[#C59B27] hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3" /> + Carte Code
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertSnippet(
                      '<table style="width:100%;border-collapse:collapse;margin-top:14px;background:#FBF9F4;border:1px solid #E6E1D6;"><tr><td style="padding:10px 14px;border-bottom:1px solid #E6E1D6;font-weight:700;">Référence</td><td style="padding:10px 14px;border-bottom:1px solid #E6E1D6;text-align:right;font-weight:800;">#{{orderNumber}}</td></tr><tr><td style="padding:10px 14px;font-weight:700;">Statut</td><td style="padding:10px 14px;text-align:right;color:#9A7414;font-weight:800;">{{statusLabel}}</td></tr></table>',
                      '<table style="width:100%;border-collapse:collapse;margin-top:14px;background:#FBF9F4;border:1px solid #E6E1D6;"><tr><td style="padding:10px 14px;border-bottom:1px solid #E6E1D6;font-weight:700;">المرجع</td><td style="padding:10px 14px;border-bottom:1px solid #E6E1D6;text-align:left;font-weight:800;direction:ltr;">#{{orderNumber}}</td></tr><tr><td style="padding:10px 14px;font-weight:700;">الحالة</td><td style="padding:10px 14px;text-align:left;color:#9A7414;font-weight:800;">{{statusLabel}}</td></tr></table>',
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] border border-[#E6D6A6] text-[11px] font-bold text-[#9A7414] hover:bg-[#C59B27] hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Table className="w-3 h-3" /> + Tableau Récap
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Textarea
                label={activeLang === 'AR' ? 'Éditeur Code Source HTML (AR RTL) *' : 'Éditeur Code Source HTML (FR) *'}
                rows={14}
                dir="ltr"
                value={activeBodyHtml}
                onChange={(e) =>
                  setForm((f) =>
                    activeLang === 'AR' ? { ...f, bodyHtmlAr: e.target.value } : { ...f, bodyHtml: e.target.value },
                  )
                }
                className="font-mono text-xs"
              />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D232E] block">
                  Rendu Visuel Coque Light Luxury ({activeLang})
                </label>
                <div className="rounded-2xl border border-[#E6E1D6] bg-[#F7F5EE] min-h-[300px] max-h-[340px] overflow-y-auto p-2">
                  <div dangerouslySetInnerHTML={{ __html: compiledPreviewHtml || activeBodyHtml }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {form.variablesStr
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
              .map((v) => (
                <Badge key={v} variant="warning" size="sm">
                  {v}
                </Badge>
              ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Compiled Preview Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Aperçu Complet (${activeLang}) — ${form.name || 'Modèle'}`}
        type="details"
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="inline-flex rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] p-0.5">
              {(['FR', 'AR'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    activeLang === lang ? 'bg-[#C59B27] text-white' : 'text-slate-600'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div
            dir={activeLang === 'AR' ? 'rtl' : 'ltr'}
            className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6] text-xs"
          >
            <strong className="text-[#9A7414]">{activeLang === 'AR' ? 'الموضوع:' : 'Objet :'}</strong> {activeSubject}
          </div>
          <div className="rounded-2xl border border-[#E6E1D6] bg-[#F7F5EE] p-3">
            <div dangerouslySetInnerHTML={{ __html: compiledPreviewHtml || activeBodyHtml }} />
          </div>
        </div>
      </Modal>

      {/* Send Test Email Modal */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Envoyer un E-mail de Test (SMTP)"
        subtitle={`Modèle : ${form.name || form.key || 'Personnalisé'}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setTestModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" form="email-tpl-test-form" variant="gold" size="sm" isLoading={sendingTest}>
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer le Test</span>
            </Button>
          </div>
        }
      >
        <form id="email-tpl-test-form" onSubmit={handleSendTest} className="p-6 space-y-4 text-xs">
          <Input
            label="Adresse E-mail Destinataire *"
            type="email"
            required
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="royaltn24@gmail.com"
          />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              Langue du Test
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['FR', 'AR'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setTestLocale(lang)}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    testLocale === lang
                      ? 'bg-[#FBF6E8] border-[#C59B27] text-[#9A7414]'
                      : 'bg-white border-[#E6E1D6] text-slate-600'
                  }`}
                >
                  {lang === 'FR' ? 'FR — Français (Défaut)' : 'AR — العربية (RTL)'}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Email Logs History Modal */}
      <Modal
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
        title="Journal des Envois SMTP (email_logs)"
        subtitle="Dernières transmissions réelles enregistrées dans PostgreSQL"
        size="xl"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setLogsOpen(false)}>
              Fermer
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-3 text-xs">
          {loadingLogs ? (
            <div className="py-8 text-center text-slate-400">Chargement de l&apos;historique...</div>
          ) : emailLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400">Aucun envoi e-mail enregistré pour le moment.</div>
          ) : (
            <div className="divide-y divide-[#EFECE6] border border-[#E6E1D6] rounded-2xl overflow-hidden bg-white">
              {emailLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-bold text-[#1D232E] truncate">{log.subject}</div>
                    <div className="text-[11px] text-slate-500">
                      À : <span className="font-mono text-[#1D232E]">{log.to}</span>
                      {log.template?.key && <span className="ml-2 text-[#9A7414]">• {log.template.key}</span>}
                    </div>
                    {log.error && <div className="text-[11px] text-rose-600">{log.error}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.status === 'SENT' ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> SENT
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        <XCircle className="w-3 h-3 mr-1" /> {log.status}
                      </Badge>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(log.sentAt || log.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Supprimer les modèles sélectionnés ?"
        description={`Confirmez-vous la suppression de ${selectedIds.length} modèle(s) de courriel ?`}
      />

      <Toast
        isOpen={!!toastMsg}
        message={toastMsg?.text || ''}
        type={toastMsg?.type || 'success'}
        onClose={() => setToastMsg(null)}
      />
    </div>
  );
}

export default function EmailTemplatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement Modèles...</div>}>
      <EmailTemplatesContent />
    </Suspense>
  );
}
