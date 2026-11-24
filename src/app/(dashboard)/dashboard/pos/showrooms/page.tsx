'use client';

import * as React from 'react';
import { Building2, Plus, Phone, MapPin, Save, CheckCircle2, XCircle, RefreshCw, Trash2, Edit3 } from 'lucide-react';
import { Button, Input, Modal, Badge, Breadcrumb, Toast, DeleteConfirmModal, DataTable, ColumnDef } from '@/components/ui';
import { fetchApi } from '@/lib/api';

interface ShowroomItem {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  cashRegisters?: Array<{ id: string; name: string; isActive: boolean }>;
}

export default function ShowroomsPage() {
  const [items, setItems] = React.useState<ShowroomItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ShowroomItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ShowroomItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', code: '', address: '', city: 'Tunis', phone: '' });
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/cms/showrooms').catch(() => []);
      setItems(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({ name: '', code: '', address: '', city: 'Tunis', phone: '' });
    setModalOpen(true);
  };

  const openEditModal = (sh: ShowroomItem) => {
    setEditingItem(sh);
    setForm({
      name: sh.name || '',
      code: sh.code || '',
      address: sh.address || '',
      city: '',
      phone: sh.phone || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    if (editingItem) {
      await fetchApi(`/storefront-cms/cms/showrooms/${editingItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          address: form.address,
          ...(form.city.trim() ? { city: form.city.trim() } : {}),
          phone: form.phone,
        }),
      });
      setToastMsg('Salle d’exposition mise à jour.');
    } else {
      await fetchApi('/storefront-cms/cms/showrooms', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setToastMsg('Salle d’exposition créée en base PostgreSQL.');
    }
    setModalOpen(false);
    setEditingItem(null);
    setForm({ name: '', code: '', address: '', city: 'Tunis', phone: '' });
    await loadData();
  };

  const handleBulkShowroomStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    await fetchApi('/storefront-cms/cms/showrooms/bulk-action', {
      method: 'POST',
      body: JSON.stringify({
        ids: selectedIds,
        action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      }),
    }).catch(async () => {
      await Promise.allSettled(
        selectedIds.map((id) =>
          fetchApi(`/storefront-cms/cms/showrooms/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
          }),
        ),
      );
    });
    setToastMsg(`${selectedIds.length} salle(s) ${isActive ? 'ouverte(s)' : 'désactivée(s)'}.`);
    setSelectedIds([]);
    await loadData();
  };

  const confirmDeleteSingle = async () => {
    if (!deleteTarget) return;
    const res: any = await fetchApi(`/storefront-cms/cms/showrooms/${deleteTarget.id}`, {
      method: 'DELETE',
    }).catch(() => null);
    setToastMsg(
      res?.softDeactivated
        ? 'Salle désactivée (historique caisses/commandes conservé).'
        : 'Salle d’exposition supprimée.',
    );
    setDeleteTarget(null);
    setSelectedIds((prev) => prev.filter((x) => x !== deleteTarget.id));
    await loadData();
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await fetchApi('/storefront-cms/cms/showrooms/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds, action: 'DELETE' }),
    }).catch(() => null);
    setToastMsg(`${selectedIds.length} salle(s) traitée(s) (suppression/archivage).`);
    setSelectedIds([]);
    setBulkDeleteOpen(false);
    await loadData();
  };

  const columns: ColumnDef<ShowroomItem>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      sortValue: (s) => s.code,
      render: (s) => (
        <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
          {s.code}
        </span>
      ),
      printRender: (s) => s.code,
    },
    {
      key: 'name',
      header: 'Nom Showroom',
      sortable: true,
      sortValue: (s) => s.name,
      render: (s) => <span className="font-bold text-xs text-[#1D232E]">{s.name}</span>,
      printRender: (s) => s.name,
    },
    {
      key: 'address',
      header: 'Adresse & Téléphone',
      render: (s) => (
        <div className="space-y-0.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
            <span>{s.address || 'Adresse à compléter'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
            <span>{s.phone || '—'}</span>
          </div>
        </div>
      ),
      printRender: (s) => `${s.address || ''} ${s.phone || ''}`,
    },
    {
      key: 'cashRegisters',
      header: 'Caisses POS',
      className: 'text-center',
      render: (s) => (
        <span className="font-mono font-bold text-xs text-[#1D232E]">
          {(s.cashRegisters || []).length} caisse(s)
        </span>
      ),
      printRender: (s) => `${(s.cashRegisters || []).length}`,
    },
    {
      key: 'isActive',
      header: 'Statut',
      sortable: true,
      sortValue: (s) => (s.isActive ? 'Ouvert' : 'Inactif'),
      render: (s) => (
        <Badge variant={s.isActive ? 'success' : 'neutral'} size="sm">
          {s.isActive ? 'Ouvert' : 'Inactif'}
        </Badge>
      ),
      printRender: (s) => (s.isActive ? 'Ouvert' : 'Inactif'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(s)}
            title="Modifier ce showroom"
            className="w-8 h-8 rounded-lg border border-neutral-200 bg-white hover:bg-[#FBF6E8] text-amber-700 inline-flex items-center justify-center transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(s)}
            title="Supprimer ce showroom"
            className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex items-center justify-center transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Gestion des Salles d&apos;Exposition (Showrooms POS)
              </h1>
              <p className="text-xs text-slate-500">
                Points de vente physiques rattachés à vos entrepôts et caisses enregistreuses tactiles.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            <Button variant="gold" size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              <span>Nouvelle Salle</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Point de vente', href: '/dashboard/pos' },
              { label: "Salles d'exposition" },
            ]}
          />
        </div>
      </div>

      <DataTable<ShowroomItem>
        data={items}
        columns={columns}
        keyExtractor={(s) => s.id}
        isLoading={loading}
        onRefresh={loadData}
        searchPlaceholder="Rechercher par nom, code, adresse ou téléphone..."
        searchKeys={['name', 'code', 'address', 'phone']}
        statusOptions={[
          { value: 'true', label: 'Ouverts' },
          { value: 'false', label: 'Inactifs' },
        ]}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        defaultPageSize={12}
        pageSizeOptions={[6, 12, 24, 48, 96]}
        enableMultiSelect={true}
        selectedKeys={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDelete={() => setBulkDeleteOpen(true)}
        renderBulkActions={() => (
          <>
            <Button variant="outline" size="sm" onClick={() => handleBulkShowroomStatus(true)}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              <span>Ouvrir ({selectedIds.length})</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkShowroomStatus(false)}>
              <XCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
              <span>Désactiver ({selectedIds.length})</span>
            </Button>
          </>
        )}
        renderMatrixCard={(sh) => (
          <div className="bg-white p-5 rounded-3xl border border-[#E6E1D6] shadow-xs space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                    {sh.code}
                  </span>
                  <h3 className="text-base font-heading font-black text-[#1D232E] mt-2">{sh.name}</h3>
                </div>
                <Badge variant={sh.isActive ? 'success' : 'neutral'} size="sm">
                  {sh.isActive ? 'Ouvert' : 'Inactif'}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#C59B27]" /><span>{sh.address || 'Adresse à compléter'}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#C59B27]" /><span>{sh.phone || '—'}</span></div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-[#1D232E]">
                {(sh.cashRegisters || []).length} caisse(s)
              </span>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => openEditModal(sh)} title="Modifier" className="w-7 h-7 rounded-lg border border-neutral-200 text-amber-700 inline-flex items-center justify-center cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(sh)} title="Supprimer" className="w-7 h-7 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 inline-flex items-center justify-center cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
        printTitle="Salles d'Exposition (Showrooms POS) — Royal"
        exportFileName="showrooms_pos_royal"
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteSingle}
        title="Supprimer cette salle d'exposition ?"
        description={`Voulez-vous supprimer ou désactiver "${deleteTarget?.name || ''}" (${deleteTarget?.code || ''}) ?`}
      />

      <DeleteConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Supprimer les showrooms sélectionnés ?"
        description={`Confirmez-vous la suppression / désactivation des ${selectedIds.length} salle(s) sélectionnée(s) ?`}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Modifier la Salle d'Exposition" : "Créer une Salle d'Exposition"}
        type={editingItem ? 'edit' : 'create'}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="gold" type="submit" form="showroom-create-form"><Save className="w-4 h-4" /><span>{editingItem ? 'Enregistrer' : 'Créer Showroom'}</span></Button>
          </div>
        }
      >
        <form id="showroom-create-form" onSubmit={handleSave} className="p-6 space-y-4">
          <Input label="Nom du Showroom *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Showroom Sousse" />
          <Input label="Code Unique *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="POS-SOUSSE" />
          <Input label="Adresse *" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
    </div>
  );
}
