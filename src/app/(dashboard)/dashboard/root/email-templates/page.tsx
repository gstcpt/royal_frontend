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
} from 'lucide-react';
import { Button, Input, Textarea, Badge, Modal, DeleteConfirmModal, Breadcrumb, Toast } from '@/components/ui';
import { fetchApi } from '@/lib/api';

interface EmailTemplateItem {
  id: string;
  key: string;
  category: 'auth' | 'campaign' | 'messages' | 'orders';
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
  isActive: boolean;
}

const CAT_TABS = [
  { id: 'auth', label: 'Authentification', icon: ShieldCheck, desc: 'Bienvenue, Mot de passe oublié, Confirmation email...' },
  { id: 'campaign', label: 'Campagne', icon: Send, desc: 'Promos articles, Ventes flash, Black Friday, Fêtes...' },
  { id: 'messages', label: 'Messages', icon: Mail, desc: 'Réponses Support client et réponses Formulaire Contact' },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag, desc: 'Merci, Préparation, En livraison, Livrée, Annulée...' },
];

function EmailTemplatesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCat = (searchParams.get('cat') as 'auth' | 'campaign' | 'messages' | 'orders') || 'auth';

  const [templates, setTemplates] = React.useState<EmailTemplateItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', key: '', subject: '', bodyHtml: '', variablesStr: '' });
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const loadTemplates = React.useCallback(async () => {
    const res = await fetchApi('/storefront-cms/cms/email-templates').catch(() => []);
    const list: EmailTemplateItem[] = Array.isArray(res) ? res : [];
    setTemplates(list);
    return list;
  }, []);

  React.useEffect(() => {
    loadTemplates().then((list) => {
      const catList = list.filter((t) => t.category === activeCat);
      if (catList[0]) {
        selectTemplate(catList[0]);
      } else {
        setSelectedId('');
        setForm({ name: '', key: `${activeCat}:custom_${Date.now()}`, subject: '', bodyHtml: '<p>Bonjour {{firstName}},</p>', variablesStr: '{{firstName}}' });
      }
    });
  }, [activeCat, loadTemplates]);

  const selectTemplate = (tpl: EmailTemplateItem) => {
    setSelectedId(tpl.id);
    setForm({
      name: tpl.name,
      key: tpl.key,
      subject: tpl.subject,
      bodyHtml: tpl.bodyHtml,
      variablesStr: Array.isArray(tpl.variables) ? tpl.variables.join(', ') : '',
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim()) return;
    setSaving(true);
    try {
      const payload = {
        category: activeCat,
        key: form.key.trim() || `${activeCat}:${Date.now()}`,
        name: form.name.trim(),
        subject: form.subject.trim(),
        bodyHtml: form.bodyHtml,
        variables: form.variablesStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (selectedId) {
        await fetchApi(`/storefront-cms/cms/email-templates/${selectedId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setToastMsg('Modèle d’email mis à jour dans PostgreSQL.');
      } else {
        const created = await fetchApi('/storefront-cms/cms/email-templates', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (created?.id) setSelectedId(created.id);
        setToastMsg('Nouveau modèle d’email créé.');
      }
      await loadTemplates();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetchApi(`/storefront-cms/cms/email-templates/${id}`, { method: 'DELETE' });
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setToastMsg('Modèle supprimé.');
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
    setToastMsg(`${count} modèle(s) supprimé(s).`);
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
    setToastMsg(`${sel.length} modèle(s) exporté(s).`);
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

  const previewHtml = form.bodyHtml
    .replace(/\{\{firstName\}\}/g, 'Sami')
    .replace(/\{\{customerName\}\}/g, 'Sami Ben Salem')
    .replace(/\{\{appName\}\}/g, 'Royal — Electro de Maison')
    .replace(/\{\{orderNumber\}\}/g, 'CMD-2026-0412')
    .replace(/\{\{statusLabel\}\}/g, 'En cours de livraison')
    .replace(/\{\{promoCode\}\}/g, 'ROYALVIP')
    .replace(/\{\{discountPercent\}\}/g, '20');

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                CMS — Modèles de Courriels HTML : {currentTabMeta.label}
              </h1>
              <p className="text-xs text-slate-500">{currentTabMeta.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedId('');
                setForm({
                  name: '',
                  key: `${activeCat}:modele_${Date.now()}`,
                  subject: '',
                  bodyHtml: '<p>Bonjour {{firstName}},</p><p>...</p>',
                  variablesStr: '{{firstName}}',
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
                    <span className="inline-block mt-1.5 font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-[#E6E1D6] text-[#9A7414]">
                      {tpl.key}
                    </span>
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

        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
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
            label="Objet (Subject) *"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <Input
            label="Variables Dynamiques (séparées par virgule)"
            value={form.variablesStr}
            onChange={(e) => setForm({ ...form, variablesStr: e.target.value })}
            placeholder="{{firstName}}, {{orderNumber}}, {{statusLabel}}"
          />
          {/* HTML Code Toolbar + Side-by-Side Live Preview */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>Code HTML du Courriel &amp; Blocs Rapides</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      bodyHtml:
                        f.bodyHtml +
                        '\n<div style="margin:18px 0"><a href="https://royal.com.tn" style="background:#C59B27;color:#FFFFFF;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700;font-size:13px;">Découvrir la Sélection Royal</a></div>',
                    }))
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] border border-[#E6D6A6] text-[11px] font-bold text-[#9A7414] hover:bg-[#C59B27] hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> + Bouton Or
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      bodyHtml:
                        '<div style="text-align:center;margin-bottom:16px"><img src="https://royal.com.tn/images/royal-logo.jpg" alt="Royal" style="height:56px;border-radius:12px" /></div>\n' +
                        f.bodyHtml,
                    }))
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] border border-[#E6D6A6] text-[11px] font-bold text-[#9A7414] hover:bg-[#C59B27] hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3" /> + Logo / Image
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      bodyHtml:
                        f.bodyHtml +
                        '\n<table style="width:100%;border-collapse:collapse;margin-top:14px"><tr><th style="text-align:left;border-bottom:2px solid #C59B27;padding:8px">Référence</th><th style="text-align:right;border-bottom:2px solid #C59B27;padding:8px">Statut</th></tr><tr><td style="padding:8px">{{orderNumber}}</td><td style="text-align:right;padding:8px;color:#9A7414;font-weight:700">{{statusLabel}}</td></tr></table>',
                    }))
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] border border-[#E6D6A6] text-[11px] font-bold text-[#9A7414] hover:bg-[#C59B27] hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Table className="w-3 h-3" /> + Bloc Commande SVG/Table
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Textarea
                label="Éditeur Code Source HTML *"
                rows={13}
                value={form.bodyHtml}
                onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
                className="font-mono text-xs"
              />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D232E] block">
                  Rendu Visuel en Direct (HTML compilé)
                </label>
                <div
                  className="p-4 rounded-2xl border border-[#E6E1D6] bg-[#FBF9F4] text-xs text-[#1D232E] min-h-[265px] max-h-[300px] overflow-y-auto leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
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

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Aperçu Email — ${form.name || 'Modèle'}`}
        type="details"
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6] text-xs">
            <strong className="text-[#9A7414]">Objet :</strong> {form.subject}
          </div>
          <div
            className="p-6 rounded-2xl border border-[#E6E1D6] bg-white text-sm text-[#1D232E] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Supprimer les modèles sélectionnés ?"
        description={`Confirmez-vous la suppression de ${selectedIds.length} modèle(s) de courriel ?`}
      />

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
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
