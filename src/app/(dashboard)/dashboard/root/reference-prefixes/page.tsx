'use client';

import * as React from 'react';
import {
  Hash,
  Save,
  Plus,
  Edit3,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Badge,
  DataTable,
  ColumnDef,
  Breadcrumb,
  Modal,
  Input,
  Toggle,
  DeleteConfirmModal,
  Toast,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';

interface PrefixItem {
  id: string;
  code: string;
  docType: string;
  format: string;
  nextSeq: number;
  preview: string;
  printTemplateCode?: string;
  isActive: boolean;
  createdAt: string;
}

function computePreview(code: string, format: string, seq: number) {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return format
    .replace('{PREFIX}', code.toUpperCase())
    .replace('{YYYY}', yyyy)
    .replace('{YY}', yy)
    .replace('{MM}', mm)
    .replace('{DD}', dd)
    .replace('{YYYYMMDD}', `${yyyy}${mm}${dd}`)
    .replace('{SEQ5}', String(seq).padStart(5, '0'))
    .replace('{SEQ4}', String(seq).padStart(4, '0'));
}

export default function ReferencePrefixesPage() {
  const [prefixes, setPrefixes] = React.useState<PrefixItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PrefixItem | null>(null);
  const [inspecting, setInspecting] = React.useState<PrefixItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PrefixItem | null>(null);
  const [bulkDeleteKeys, setBulkDeleteKeys] = React.useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);

  const [form, setForm] = React.useState({
    code: 'CMD',
    docType: '',
    format: '{PREFIX}-{YYYY}{MM}-{SEQ4}',
    nextSeq: 1,
    printTemplateCode: 'TPL-BON-CMD',
    isActive: true,
  });
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/prefixes');
      setPrefixes(Array.isArray(res?.value) ? res.value : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const persist = async (next: PrefixItem[], msg: string) => {
    setPrefixes(next);
    await fetchApi('/storefront-cms/sys-config/prefixes', {
      method: 'PUT',
      body: JSON.stringify({ value: next }),
    });
    setToastMsg(msg);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', docType: '', format: '{PREFIX}-{YYYY}{MM}-{SEQ4}', nextSeq: 1, printTemplateCode: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (item: PrefixItem) => {
    setEditing(item);
    setForm({
      code: item.code,
      docType: item.docType,
      format: item.format,
      nextSeq: item.nextSeq,
      printTemplateCode: item.printTemplateCode || '',
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.docType.trim()) return;
    setModalOpen(false);
    const preview = computePreview(form.code, form.format, Number(form.nextSeq || 1));
    if (editing) {
      await persist(
        prefixes.map((p) => (p.id === editing.id ? { ...p, ...form, code: form.code.toUpperCase(), preview } : p)),
        'Règle de codification mise à jour.'
      );
    } else {
      const item: PrefixItem = {
        id: `pref-${Date.now()}`,
        code: form.code.toUpperCase(),
        docType: form.docType,
        format: form.format,
        nextSeq: Number(form.nextSeq || 1),
        preview,
        printTemplateCode: form.printTemplateCode,
        isActive: form.isActive,
        createdAt: new Date().toISOString(),
      };
      await persist([item, ...prefixes], 'Nouveau préfixe créé dans PostgreSQL.');
    }
  };

  const handleToggle = async (item: PrefixItem) => {
    await persist(
      prefixes.map((p) => (p.id === item.id ? { ...p, isActive: !p.isActive } : p)),
      `Préfixe ${item.code} ${!item.isActive ? 'activé' : 'désactivé'}.`
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await persist(prefixes.filter((p) => p.id !== deleteTarget.id), 'Préfixe supprimé.');
    setDeleteTarget(null);
  };

  const columns: ColumnDef<PrefixItem>[] = [
    {
      key: 'code',
      header: 'Préfixe',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
          {p.code}
        </span>
      ),
      printRender: (p) => p.code,
    },
    {
      key: 'docType',
      header: 'Document Lié',
      sortable: true,
      render: (p) => <span className="text-xs font-bold text-[#1D232E]">{p.docType}</span>,
      printRender: (p) => p.docType,
    },
    {
      key: 'format',
      header: 'Masque & Séquence',
      render: (p) => (
        <div className="space-y-0.5 text-[11px]">
          <div className="font-mono text-slate-600">{p.format}</div>
          <div className="text-[#9A7414] font-bold">Prochain : #{p.nextSeq} ({p.preview})</div>
        </div>
      ),
      printRender: (p) => `${p.format} -> ${p.preview}`,
    },
    {
      key: 'printTemplateCode',
      header: 'Modèle d’Impression',
      render: (p) => <Badge variant="neutral" size="sm">{p.printTemplateCode || 'Standard'}</Badge>,
      printRender: (p) => p.printTemplateCode || 'Standard',
    },
    {
      key: 'isActive',
      header: 'Statut',
      render: (p) => (
        <Toggle checked={p.isActive} onChange={() => handleToggle(p)} activeLabel="Actif" inactiveLabel="Inactif" />
      ),
      printRender: (p) => (p.isActive ? 'Actif' : 'Inactif'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap no-print',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <button type="button" onClick={() => setInspecting(p)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer" title="Voir">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => openEdit(p)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer" title="Modifier">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer" title="Supprimer">
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
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Préfixes &amp; Codification des Documents ERP
              </h1>
              <p className="text-xs text-slate-500">
                Numérotation chronologique liée directement aux modèles d&apos;impression PDF/A4/80mm.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="gold" size="sm" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un Préfixe</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb items={[{ label: 'Système & CMS', href: '/dashboard/section/system' }, { label: 'Codification & Préfixes' }]} />
        </div>
      </div>

      <DataTable
        data={prefixes}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['code', 'docType', 'format', 'preview']}
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
                  prefixes.map((p) => (s.has(p.id) ? { ...p, isActive: true } : p)),
                  `${selectedKeys.length} préfixe(s) activé(s).`
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
                  prefixes.map((p) => (s.has(p.id) ? { ...p, isActive: false } : p)),
                  `${selectedKeys.length} préfixe(s) désactivé(s).`
                );
                setSelectedKeys([]);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer"
            >
              Désactiver
            </button>
          </>
        )}
        printTitle="Règles de Numérotation ERP — Royal"
        exportFileName="prefixes-codification"
      />

      <Modal
        isOpen={!!inspecting}
        onClose={() => setInspecting(null)}
        title={`Aperçu Codification — ${inspecting?.code || ''}`}
        type="details"
        size="md"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setInspecting(null)}>
              Fermer
            </Button>
          </div>
        }
      >
        {inspecting && (
          <div className="p-6 space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6]">
              <div className="font-bold text-[#1D232E]">{inspecting.docType}</div>
              <div className="text-lg font-mono font-black text-[#9A7414] mt-1">{inspecting.preview}</div>
              <div className="text-slate-500 mt-1">Masque : {inspecting.format}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier Préfixe' : 'Nouvelle Règle de Numérotation'}
        type={editing ? 'edit' : 'create'}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="gold" size="sm" type="submit" form="reference-prefix-form"><Save className="w-3.5 h-3.5" /><span>Enregistrer</span></Button>
          </div>
        }
      >
        <form id="reference-prefix-form" onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Préfixe *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CMD" />
            <Input label="Compteur Initial *" type="number" required value={form.nextSeq} onChange={(e) => setForm({ ...form, nextSeq: Number(e.target.value) })} />
          </div>
          <Input label="Type de Document *" required value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })} />
          <Input label="Masque de Format *" required value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} />
          <Input label="Code Modèle d'Impression Lié" value={form.printTemplateCode} onChange={(e) => setForm({ ...form, printTemplateCode: e.target.value })} placeholder="TPL-FACTURE-A4" />
          <Toggle label="Règle active" checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
        </form>
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer cette règle ?"
        description={`Supprimer le préfixe ${deleteTarget?.code} ?`}
      />

      <DeleteConfirmModal
        isOpen={bulkDeleteKeys.length > 0}
        onClose={() => setBulkDeleteKeys([])}
        onConfirm={async () => {
          const s = new Set(bulkDeleteKeys);
          await persist(prefixes.filter((p) => !s.has(p.id)), `${bulkDeleteKeys.length} règle(s) supprimée(s).`);
          setBulkDeleteKeys([]);
          setSelectedKeys([]);
        }}
        title="Suppression Groupée des Préfixes"
        description={`Confirmez-vous la suppression des ${bulkDeleteKeys.length} règle(s) sélectionnée(s) ?`}
      />

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
    </div>
  );
}
