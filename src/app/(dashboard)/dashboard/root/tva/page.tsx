'use client';

import * as React from 'react';
import {
  Percent,
  Save,
  Plus,
  Trash2,
  Edit3,
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

interface VatRateItem {
  id: string;
  code: string;
  label: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function TvaRatesPage() {
  const [rates, setRates] = React.useState<VatRateItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VatRateItem | null>(null);
  const [inspecting, setInspecting] = React.useState<VatRateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<VatRateItem | null>(null);

  const [form, setForm] = React.useState({ code: '', label: '', rate: 19, isDefault: false, isActive: true });
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const loadRates = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/tva');
      setRates(Array.isArray(res?.value) ? res.value : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRates();
  }, [loadRates]);

  const persist = async (nextList: VatRateItem[], msg: string) => {
    setRates(nextList);
    await fetchApi('/storefront-cms/sys-config/tva', {
      method: 'PUT',
      body: JSON.stringify({ value: nextList }),
    });
    setToastMsg(msg);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', label: '', rate: 19, isDefault: false, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (item: VatRateItem) => {
    setEditing(item);
    setForm({ code: item.code, label: item.label, rate: item.rate, isDefault: item.isDefault, isActive: item.isActive });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.label.trim()) return;
    setModalOpen(false);
    let next = rates;
    if (editing) {
      next = rates.map((r) =>
        r.id === editing.id
          ? { ...r, ...form, code: form.code.toUpperCase() }
          : form.isDefault
            ? { ...r, isDefault: false }
            : r
      );
      await persist(next, 'Taux de TVA mis à jour en base.');
    } else {
      const created: VatRateItem = {
        id: `tva-${Date.now()}`,
        code: form.code.toUpperCase(),
        label: form.label,
        rate: Number(form.rate),
        isDefault: form.isDefault,
        isActive: form.isActive,
        createdAt: new Date().toISOString(),
      };
      const base = form.isDefault ? rates.map((r) => ({ ...r, isDefault: false })) : rates;
      await persist([created, ...base], 'Nouveau taux TVA enregistré.');
    }
  };

  const handleToggleActive = async (item: VatRateItem) => {
    const next = rates.map((r) => (r.id === item.id ? { ...r, isActive: !r.isActive } : r));
    await persist(next, `Taux ${item.code} ${!item.isActive ? 'activé' : 'désactivé'}.`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await persist(rates.filter((r) => r.id !== deleteTarget.id), 'Taux de TVA supprimé.');
    setDeleteTarget(null);
  };

  const handleBulkDelete = async (keys: string[]) => {
    const s = new Set(keys);
    await persist(rates.filter((r) => !s.has(r.id)), `${keys.length} taux supprimé(s).`);
  };

  const columns: ColumnDef<VatRateItem>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (r) => (
        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
          {r.code}
        </span>
      ),
      printRender: (r) => r.code,
    },
    {
      key: 'label',
      header: 'Libellé Fiscal',
      sortable: true,
      render: (r) => <span className="text-xs font-bold text-[#1D232E]">{r.label}</span>,
      printRender: (r) => r.label,
    },
    {
      key: 'rate',
      header: 'Taux (%)',
      sortable: true,
      render: (r) => <span className="font-mono text-sm font-black text-[#1D232E]">{r.rate}%</span>,
      printRender: (r) => `${r.rate}%`,
    },
    {
      key: 'isDefault',
      header: 'Défaut',
      render: (r) =>
        r.isDefault ? (
          <Badge variant="warning" size="sm">Par Défaut</Badge>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
      printRender: (r) => (r.isDefault ? 'Oui' : 'Non'),
    },
    {
      key: 'isActive',
      header: 'Statut',
      render: (r) => (
        <Toggle
          checked={r.isActive}
          onChange={() => handleToggleActive(r)}
          activeLabel="Actif"
          inactiveLabel="Inactif"
        />
      ),
      printRender: (r) => (r.isActive ? 'Actif' : 'Inactif'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap no-print',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button type="button" onClick={() => setInspecting(r)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer" title="Voir">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer" title="Modifier">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer" title="Supprimer">
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
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Taxes, Taux de TVA &amp; Timbre Fiscal (Tunisie)
              </h1>
              <p className="text-xs text-slate-500">
                Gestion complète des taux légaux tunisiens sauvegardés dans PostgreSQL.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadRates}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="gold" size="sm" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un Taux</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb items={[{ label: 'Système & CMS', href: '/dashboard/section/system' }, { label: 'TVA & Fiscalité' }]} />
        </div>
      </div>

      <DataTable
        data={rates}
        columns={columns}
        isLoading={loading}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['code', 'label']}
        enableMultiSelect
        onBulkDelete={handleBulkDelete}
        printTitle="Grille Fiscale TVA — Royal"
        exportFileName="tva-tunisie"
      />

      <Modal
        isOpen={!!inspecting}
        onClose={() => setInspecting(null)}
        title={`Détails Taux TVA — ${inspecting?.code || ''}`}
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
              <div className="font-black text-sm text-[#1D232E]">{inspecting.label}</div>
              <div className="font-mono text-[#9A7414] mt-1">Code : {inspecting.code} • Taux : {inspecting.rate}%</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier Taux TVA' : 'Nouveau Taux TVA'}
        type={editing ? 'edit' : 'create'}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="gold" size="sm" type="submit" form="tva-form"><Save className="w-3.5 h-3.5" /><span>Enregistrer</span></Button>
          </div>
        }
      >
        <form id="tva-form" onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="TVA19" />
            <Input label="Taux (%) *" type="number" step="0.1" required value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} />
          </div>
          <Input label="Libellé *" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <div className="flex flex-wrap gap-4">
            <Toggle label="Définir comme taux par défaut" checked={form.isDefault} onChange={(v) => setForm({ ...form, isDefault: v })} />
            <Toggle label="Actif" checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer ce taux TVA ?"
        description={`Confirmez-vous la suppression de ${deleteTarget?.code} ?`}
      />

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
    </div>
  );
}
