'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Printer,
  Save,
  Plus,
  Edit3,
  Trash2,
  Eye,
  RefreshCw,
  Code2,
  FileText,
} from 'lucide-react';
import {
  Button,
  Badge,
  DataTable,
  ColumnDef,
  Breadcrumb,
  Modal,
  Input,
  Textarea,
  Select,
  Toggle,
  DeleteConfirmModal,
  Toast,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { SystemRole } from '@royal/shared-types';
import { PrintersConfigPanel } from '@/components/dashboard/PrintersConfigPanel';

interface PrintTemplateItem {
  id: string;
  code: string;
  name: string;
  paperFormat: 'A4' | 'A5' | '80mm';
  prefixCode: string;
  headerText: string;
  footerText: string;
  htmlBody: string;
  cssStyles: string;
  showLogo: boolean;
  showTaxBreakdown: boolean;
  showQr: boolean;
  isActive: boolean;
  createdAt: string;
}

function PrintTemplatesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const isRoot = hasRole(SystemRole.ROOT);
  const activeTab = searchParams.get('tab') === 'printers' && isRoot ? 'printers' : 'templates';

  const [templates, setTemplates] = React.useState<PrintTemplateItem[]>([]);
  const [prefixes, setPrefixes] = React.useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PrintTemplateItem | null>(null);
  const [inspecting, setInspecting] = React.useState<PrintTemplateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PrintTemplateItem | null>(null);
  const [bulkDeleteKeys, setBulkDeleteKeys] = React.useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);

  const [form, setForm] = React.useState<Omit<PrintTemplateItem, 'id' | 'createdAt'>>({
    code: '',
    name: '',
    paperFormat: 'A4',
    prefixCode: 'CMD',
    headerText: 'Royal — Électro de Maison | Mahdia 5100',
    footerText: 'Merci pour votre confiance.',
    htmlBody: '<div class="royal-doc"><h1>{{companyName}}</h1><p>Référence : {{reference}}</p></div>',
    cssStyles: '.royal-doc { font-family: Poppins, sans-serif; color: #1D232E; border-top: 4px solid #C59B27; padding: 20px; }',
    showLogo: true,
    showTaxBreakdown: true,
    showQr: true,
    isActive: true,
  });
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, prefRes] = await Promise.all([
        fetchApi('/storefront-cms/sys-config/printTemplates'),
        fetchApi('/storefront-cms/sys-config/prefixes').catch(() => null),
      ]);
      setTemplates(Array.isArray(tplRes?.value) ? tplRes.value : []);
      const prefList = Array.isArray(prefRes?.value) ? prefRes.value : [];
      setPrefixes(prefList.map((p: any) => ({ value: p.code, label: `${p.code} — ${p.docType}` })));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const persist = async (next: PrintTemplateItem[], msg: string) => {
    setTemplates(next);
    await fetchApi('/storefront-cms/sys-config/printTemplates', {
      method: 'PUT',
      body: JSON.stringify({ value: next }),
    });
    setToastMsg(msg);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: '',
      name: '',
      paperFormat: 'A4',
      prefixCode: prefixes[0]?.value || 'CMD',
      headerText: 'Royal — Électro de Maison | Mahdia 5100',
      footerText: 'Merci pour votre confiance.',
      htmlBody: '<div class="royal-doc"><h1>{{companyName}}</h1><p>Document {{reference}}</p></div>',
      cssStyles: '.royal-doc { font-family: Poppins, sans-serif; color: #1D232E; border-top: 4px solid #C59B27; padding: 20px; }',
      showLogo: true,
      showTaxBreakdown: true,
      showQr: true,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (item: PrintTemplateItem) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      paperFormat: item.paperFormat,
      prefixCode: item.prefixCode,
      headerText: item.headerText,
      footerText: item.footerText,
      htmlBody: item.htmlBody || '',
      cssStyles: item.cssStyles || '',
      showLogo: item.showLogo,
      showTaxBreakdown: item.showTaxBreakdown,
      showQr: item.showQr,
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) return;
    setModalOpen(false);
    if (editing) {
      await persist(
        templates.map((t) => (t.id === editing.id ? { ...t, ...form, code: form.code.toUpperCase() } : t)),
        'Modèle d’impression mis à jour en base.'
      );
    } else {
      const created: PrintTemplateItem = {
        id: `tpl-${Date.now()}`,
        ...form,
        code: form.code.toUpperCase(),
        createdAt: new Date().toISOString(),
      };
      await persist([created, ...templates], 'Nouveau modèle d’impression créé.');
    }
  };

  const handleToggle = async (item: PrintTemplateItem) => {
    await persist(
      templates.map((t) => (t.id === item.id ? { ...t, isActive: !t.isActive } : t)),
      `Modèle ${item.code} ${!item.isActive ? 'activé' : 'désactivé'}.`
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await persist(templates.filter((t) => t.id !== deleteTarget.id), 'Modèle supprimé.');
    setDeleteTarget(null);
  };

  const columns: ColumnDef<PrintTemplateItem>[] = [
    {
      key: 'code',
      header: 'Code Modèle',
      sortable: true,
      render: (t) => (
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
          {t.code}
        </span>
      ),
      printRender: (t) => t.code,
    },
    {
      key: 'name',
      header: 'Intitulé',
      sortable: true,
      render: (t) => <span className="text-xs font-bold text-[#1D232E]">{t.name}</span>,
      printRender: (t) => t.name,
    },
    {
      key: 'paperFormat',
      header: 'Format & Préfixe',
      render: (t) => (
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="neutral" size="sm">{t.paperFormat}</Badge>
          <span className="font-mono font-bold text-[#9A7414]">{t.prefixCode}</span>
        </div>
      ),
      printRender: (t) => `${t.paperFormat} (${t.prefixCode})`,
    },
    {
      key: 'isActive',
      header: 'Statut',
      render: (t) => (
        <Toggle checked={t.isActive} onChange={() => handleToggle(t)} activeLabel="Actif" inactiveLabel="Inactif" />
      ),
      printRender: (t) => (t.isActive ? 'Actif' : 'Inactif'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap no-print',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          <button type="button" onClick={() => setInspecting(t)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer" title="Aperçu Code & Rendu">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => openEdit(t)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer" title="Modifier HTML / CSS">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer" title="Supprimer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      printRender: () => '',
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6]">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Documents d&apos;Impression &amp; Imprimantes POS
              </h1>
              <p className="text-xs text-slate-500">
                Gabarits HTML/CSS (Factures, BL, Tickets) et configuration matérielle des imprimantes POS.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isRoot && (
              <div className="flex items-center gap-1.5 mr-1">
                <button
                  type="button"
                  onClick={() => router.replace('/dashboard/root/print-templates', { scroll: false })}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'templates'
                      ? 'bg-[var(--royal-primary)] text-white shadow-xs'
                      : 'bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Gabarits HTML/CSS</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.replace('/dashboard/root/print-templates?tab=printers', { scroll: false })}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'printers'
                      ? 'bg-[var(--royal-primary)] text-white shadow-xs'
                      : 'bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimantes &amp; Pont POS</span>
                </button>
              </div>
            )}
            {activeTab === 'templates' && (
              <>
                <Button variant="outline" size="sm" onClick={loadData}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="gold" size="sm" onClick={openCreate}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau Modèle</span>
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb items={[{ label: 'Système & CMS', href: '/dashboard/section/system' }, { label: 'Documents & Imprimantes POS' }]} />
        </div>
      </div>

      {activeTab === 'printers' && isRoot ? (
        <PrintersConfigPanel onFeedback={(msg) => setToastMsg(msg)} />
      ) : (
        <>
      <DataTable
        data={templates}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['code', 'name', 'prefixCode', 'paperFormat']}
        enableMultiSelect
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        onBulkDelete={(keys) => setBulkDeleteKeys(keys)}
        renderBulkActions={() => (
          <>
            <button
              type="button"
              onClick={async () => {
                const s = new Set(selectedKeys);
                await persist(
                  templates.map((t) => (s.has(t.id) ? { ...t, isActive: true } : t)),
                  `${selectedKeys.length} modèle(s) activé(s).`
                );
                setSelectedKeys([]);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
            >
              Activer
            </button>
            <button
              type="button"
              onClick={async () => {
                const s = new Set(selectedKeys);
                await persist(
                  templates.map((t) => (s.has(t.id) ? { ...t, isActive: false } : t)),
                  `${selectedKeys.length} modèle(s) désactivé(s).`
                );
                setSelectedKeys([]);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer"
            >
              Désactiver
            </button>
            <select
              value=""
              onChange={async (e) => {
                const fmt = e.target.value as PrintTemplateItem['paperFormat'];
                if (!fmt) return;
                const s = new Set(selectedKeys);
                await persist(
                  templates.map((t) => (s.has(t.id) ? { ...t, paperFormat: fmt } : t)),
                  `${selectedKeys.length} modèle(s) passé(s) en ${fmt}.`
                );
                setSelectedKeys([]);
              }}
              aria-label="Changer format papier"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Format papier...</option>
              <option value="A4">Format A4</option>
              <option value="80mm">Ticket 80mm POS</option>
              <option value="A5">Format A5</option>
            </select>
          </>
        )}
        printTitle="Modèles d'Impression ERP — Royal"
        exportFileName="modeles-impression"
      />

      <Modal
        isOpen={!!inspecting}
        onClose={() => setInspecting(null)}
        title={`Aperçu Modèle — ${inspecting?.name || ''}`}
        type="details"
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setInspecting(null)}>
              Fermer
            </Button>
          </div>
        }
      >
        {inspecting && (
          <div className="p-6 space-y-4 text-xs">
            <style dangerouslySetInnerHTML={{ __html: inspecting.cssStyles || '' }} />
            <div
              className="p-6 rounded-2xl border border-[#E6E1D6] bg-white"
              dangerouslySetInnerHTML={{
                __html: (inspecting.htmlBody || '')
                  .replace(/\{\{companyName\}\}/g, 'ROYAL — ÉLECTRO DE MAISON')
                  .replace(/\{\{reference\}\}/g, `${inspecting.prefixCode}-2026-00418`)
                  .replace(/\{\{customerName\}\}/g, 'Sami Ben Salem')
                  .replace(/\{\{phone\}\}/g, '48 091 914'),
              }}
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier Gabarit HTML/CSS' : "Créer Modèle d'Impression"}
        type={editing ? 'edit' : 'create'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="gold" size="sm" type="submit" form="print-template-form"><Save className="w-3.5 h-3.5" /><span>Enregistrer Gabarit</span></Button>
          </div>
        }
      >
        <form id="print-template-form" onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Code *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="TPL-FACTURE-A4" />
            <Select
              label="Format Papier"
              value={form.paperFormat}
              onChange={(e) => setForm({ ...form, paperFormat: e.target.value as any })}
              options={[
                { value: 'A4', label: 'Format A4 Standard' },
                { value: 'A5', label: 'Format A5 Compact' },
                { value: '80mm', label: 'Ticket Thermique 80mm' },
              ]}
            />
            <Select
              label="Préfixe Document Lié"
              value={form.prefixCode}
              onChange={(e) => setForm({ ...form, prefixCode: e.target.value })}
              options={prefixes.length > 0 ? prefixes : [{ value: 'CMD', label: 'CMD — Commande' }]}
            />
          </div>
          <Input label="Nom du Modèle *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Entête (Header)" value={form.headerText} onChange={(e) => setForm({ ...form, headerText: e.target.value })} />
            <Input label="Pied de page (Footer)" value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Textarea
              label="Template Code HTML ({{reference}}, {{customerName}}...)"
              rows={7}
              value={form.htmlBody}
              onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
              className="font-mono text-xs"
            />
            <Textarea
              label="Styles CSS Personnalisés"
              rows={7}
              value={form.cssStyles}
              onChange={(e) => setForm({ ...form, cssStyles: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-5 pt-1">
            <Toggle label="Afficher Logo" checked={form.showLogo} onChange={(v) => setForm({ ...form, showLogo: v })} />
            <Toggle label="Ventilation TVA" checked={form.showTaxBreakdown} onChange={(v) => setForm({ ...form, showTaxBreakdown: v })} />
            <Toggle label="QR Code" checked={form.showQr} onChange={(v) => setForm({ ...form, showQr: v })} />
            <Toggle label="Actif" checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer ce modèle ?"
        description={`Supprimer ${deleteTarget?.code} ?`}
      />

      <DeleteConfirmModal
        isOpen={bulkDeleteKeys.length > 0}
        onClose={() => setBulkDeleteKeys([])}
        onConfirm={async () => {
          const s = new Set(bulkDeleteKeys);
          await persist(templates.filter((t) => !s.has(t.id)), `${bulkDeleteKeys.length} modèle(s) supprimé(s).`);
          setBulkDeleteKeys([]);
          setSelectedKeys([]);
        }}
        title="Suppression Groupée des Modèles"
        description={`Confirmez-vous la suppression des ${bulkDeleteKeys.length} modèle(s) sélectionné(s) ?`}
      />
        </>
      )}

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
    </div>
  );
}

export default function PrintTemplatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement Documents &amp; Imprimantes...</div>}>
      <PrintTemplatesContent />
    </Suspense>
  );
}
