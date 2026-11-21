'use client';

import * as React from 'react';
import {
  Compass,
  Plus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Save,
  Eye,
  Edit3,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import {
  Button,
  Input,
  Modal,
  Breadcrumb,
  Toast,
  Badge,
  Select,
  DataTable,
  ColumnDef,
  DeleteConfirmModal,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';

interface ProspectItem {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  specialty: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'ARCHIVED';
  notes: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouveau Contact',
  CONTACTED: 'Contacté',
  QUALIFIED: 'Qualifié (Prêt BC)',
  ARCHIVED: 'Archivé',
};

export default function ProspectsPage() {
  const [prospects, setProspects] = React.useState<ProspectItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProspectItem | null>(null);
  const [inspecting, setInspecting] = React.useState<ProspectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ProspectItem | null>(null);

  const [form, setForm] = React.useState<Omit<ProspectItem, 'id' | 'createdAt'>>({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    city: 'Tunis',
    specialty: 'Électroménager',
    status: 'CONTACTED',
    notes: '',
  });
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/cms/prospects').catch(() => []);
      setProspects(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const persist = async (nextList: ProspectItem[], msg: string) => {
    setProspects(nextList);
    await fetchApi('/storefront-cms/cms/prospects', {
      method: 'POST',
      body: JSON.stringify({ prospects: nextList }),
    });
    setToastMsg(msg);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      city: 'Tunis',
      specialty: 'Électroménager',
      status: 'CONTACTED',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (item: ProspectItem) => {
    setEditing(item);
    setForm({
      companyName: item.companyName,
      contactName: item.contactName,
      phone: item.phone,
      email: item.email,
      city: item.city,
      specialty: item.specialty,
      status: item.status,
      notes: item.notes,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;
    setModalOpen(false);
    if (editing) {
      const updated = prospects.map((p) => (p.id === editing.id ? { ...p, ...form } : p));
      await persist(updated, 'Prospect fournisseur mis à jour.');
    } else {
      const item: ProspectItem = {
        id: `pros-${Date.now()}`,
        ...form,
        createdAt: new Date().toISOString(),
      };
      await persist([item, ...prospects], 'Prospect fournisseur enregistré en base.');
    }
  };

  const handleToggleQualify = async (item: ProspectItem) => {
    const nextStatus: ProspectItem['status'] = item.status === 'QUALIFIED' ? 'CONTACTED' : 'QUALIFIED';
    const updated = prospects.map((p) => (p.id === item.id ? { ...p, status: nextStatus } : p));
    await persist(updated, `Statut mis à jour : ${STATUS_LABELS[nextStatus]}.`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await persist(
      prospects.filter((p) => p.id !== deleteTarget.id),
      'Prospect supprimé.'
    );
    setDeleteTarget(null);
  };

  const handleBulkDelete = async (keys: string[]) => {
    if (keys.length === 0) return;
    const set = new Set(keys);
    await persist(
      prospects.filter((p) => !set.has(p.id)),
      `${keys.length} prospect(s) supprimé(s).`
    );
  };

  const columns: ColumnDef<ProspectItem>[] = [
    {
      key: 'companyName',
      header: 'Société & Interlocuteur',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-bold text-xs text-[#1D232E]">{p.companyName}</div>
          <div className="text-[11px] text-slate-500">{p.contactName || 'Contact principal'}</div>
        </div>
      ),
      printRender: (p) => `${p.companyName} (${p.contactName})`,
    },
    {
      key: 'phone',
      header: 'Coordonnées',
      render: (p) => (
        <div className="space-y-0.5 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-[#C59B27]" />
            <span>{p.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-[#C59B27]" />
            <span>{p.email || '—'}</span>
          </div>
        </div>
      ),
      printRender: (p) => `${p.phone} / ${p.email}`,
    },
    {
      key: 'city',
      header: 'Ville & Spécialité',
      sortable: true,
      render: (p) => (
        <div className="text-xs text-slate-700">
          <span className="font-semibold">{p.city}</span> • {p.specialty}
        </div>
      ),
      printRender: (p) => `${p.city} (${p.specialty})`,
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      render: (p) => (
        <Badge
          variant={p.status === 'QUALIFIED' ? 'success' : p.status === 'ARCHIVED' ? 'neutral' : 'warning'}
          size="sm"
        >
          {STATUS_LABELS[p.status] || p.status}
        </Badge>
      ),
      printRender: (p) => STATUS_LABELS[p.status] || p.status,
    },
    {
      key: 'createdAt',
      header: 'Date Création',
      sortable: true,
      sortValue: (p) => new Date(p.createdAt).getTime(),
      className: 'whitespace-nowrap font-mono text-[11px] text-slate-500',
      render: (p) => new Date(p.createdAt).toLocaleDateString('fr-FR'),
      printRender: (p) => new Date(p.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap no-print',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setInspecting(p)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-[#FBF6E8] cursor-pointer"
            title="Voir la fiche"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleQualify(p)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer"
            title="Qualifier / Basculer statut"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => openEdit(p)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-[#FBF6E8] cursor-pointer"
            title="Modifier"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(p)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 cursor-pointer"
            title="Supprimer"
          >
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
            <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Portefeuille de Prospects Fournisseurs
              </h1>
              <p className="text-xs text-slate-500">
                Contacts fournisseurs en cours de négociation avant création d&apos;une fiche officielle.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            <Button variant="gold" size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              <span>Ajouter un Prospect</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Achats et approvisionnement', href: '/dashboard/suppliers' },
              { label: 'Portefeuille de prospects' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={prospects}
        columns={columns}
        isLoading={loading}
        printTitle="Portefeuille Prospects Fournisseurs — Royal"
        exportFileName="prospects-fournisseurs"
        searchPlaceholder="Rechercher un prospect par société, contact ou ville..."
        searchKeys={['companyName', 'contactName', 'city', 'specialty', 'phone', 'email']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        enableMultiSelect
        onBulkDelete={handleBulkDelete}
        onRefresh={loadData}
        renderMatrixCard={(p, isChecked, onToggle) => (
          <div className="bg-white p-5 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onToggle(e as any)}
                    className="accent-[#C59B27]"
                  />
                  <div>
                    <h3 className="text-sm font-heading font-extrabold text-[#1D232E]">
                      {p.companyName}
                    </h3>
                    <p className="text-xs text-slate-500">Contact : {p.contactName}</p>
                  </div>
                </div>
                <Badge variant="warning" size="sm">
                  {STATUS_LABELS[p.status] || p.status}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#C59B27]" /><span>{p.phone}</span></div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#C59B27]" /><span>{p.email}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#C59B27]" /><span>{p.city} • {p.specialty}</span></div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400">
                {new Date(p.createdAt).toLocaleDateString('fr-FR')}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => openEdit(p)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={!!inspecting}
        onClose={() => setInspecting(null)}
        title="Fiche Prospect Fournisseur"
        size="4xl"
        type="details"
        footer={
          inspecting && (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const target = inspecting;
                    setInspecting(null);
                    openEdit(target);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier le Prospect</span>
                </Button>
                <Link
                  href={`/dashboard/purchases/orders?fromProspect=${encodeURIComponent(inspecting.companyName)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--royal-primary)] text-white text-xs font-bold shadow-xs hover:opacity-95 transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Créer Bon de Commande (BC)</span>
                </Link>
              </div>
              <Button variant="outline" size="sm" onClick={() => setInspecting(null)}>
                Fermer
              </Button>
            </div>
          )
        }
      >
        {inspecting && (
          <div className="p-6 space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-base font-heading font-black text-[#1D232E]">{inspecting.companyName}</div>
                <div className="text-slate-600 mt-0.5">Interlocuteur : <strong>{inspecting.contactName || '—'}</strong> • Spécialité : {inspecting.specialty}</div>
              </div>
              <Badge variant={inspecting.status === 'QUALIFIED' ? 'success' : 'warning'} size="md">
                {STATUS_LABELS[inspecting.status] || inspecting.status}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E6E1D6]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Téléphone</span>
                <span className="font-bold text-[#1D232E]">{inspecting.phone || '—'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E6E1D6]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Email</span>
                <span className="font-bold text-[#1D232E]">{inspecting.email || '—'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E6E1D6]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Ville &amp; Date</span>
                <span className="font-bold text-[#1D232E]">{inspecting.city || 'Tunis'} • {new Date(inspecting.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#EFEAD8] text-slate-700">
              <span className="text-[10px] font-bold uppercase text-[#9A7414] block mb-1">Notes de prospection &amp; Conditions</span>
              {inspecting.notes || 'Aucune note enregistrée pour ce contact.'}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier Prospect Fournisseur' : 'Nouveau Prospect Fournisseur'}
        size="3xl"
        type={editing ? 'edit' : 'create'}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="gold" type="submit" form="prospect-form"><Save className="w-4 h-4" /><span>Enregistrer</span></Button>
          </div>
        }
      >
        <form id="prospect-form" onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Raison Sociale / Marque *" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            <Input label="Interlocuteur" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            <Input label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Select
              label="Statut"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              options={[
                { value: 'NEW', label: 'Nouveau Contact' },
                { value: 'CONTACTED', label: 'Contacté' },
                { value: 'QUALIFIED', label: 'Qualifié (Prêt BC)' },
                { value: 'ARCHIVED', label: 'Archivé' },
              ]}
            />
          </div>
          <Input label="Notes de prospection" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </form>
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer ce prospect ?"
        description={`Confirmez-vous la suppression de ${deleteTarget?.companyName} ?`}
      />

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
    </div>
  );
}
