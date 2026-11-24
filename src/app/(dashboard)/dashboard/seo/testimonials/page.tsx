'use client';

import * as React from 'react';
import { Sparkles, Plus, Trash2, Star, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button, Input, Textarea, Modal, Badge, Breadcrumb, Toast, DeleteConfirmModal, DataTable, ColumnDef } from '@/components/ui';
import { fetchApi } from '@/lib/api';

interface CuratedTestimonial {
  id: string;
  name: string;
  city: string;
  dateLabel: string;
  avatar?: string;
  stars: number;
  comment: string;
  isActive: boolean;
}

export default function SeoTestimonialsPage() {
  const [items, setItems] = React.useState<CuratedTestimonial[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<CuratedTestimonial | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', city: 'Tunis', dateLabel: "Aujourd'hui", stars: 5, comment: '' });
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/cms/testimonials').catch(() => []);
      setItems(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.comment.trim()) return;
    await fetchApi('/storefront-cms/cms/testimonials', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
    setModalOpen(false);
    setForm({ name: '', city: 'Tunis', dateLabel: "Aujourd'hui", stars: 5, comment: '' });
    setToastMsg('Témoignage publié pour la Page d’Accueil Storefront.');
    await loadData();
  };

  const handleToggleStatus = async (item: CuratedTestimonial) => {
    await fetchApi(`/storefront-cms/cms/testimonials/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: item.isActive === false }),
    });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
    setToastMsg(`Témoignage ${item.isActive === false ? 'activé' : 'masqué'}.`);
    await loadData();
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    await Promise.allSettled(
      selectedIds.map((id) =>
        fetchApi(`/storefront-cms/cms/testimonials/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive }),
        }),
      ),
    );
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
    setToastMsg(`${selectedIds.length} témoignage(s) ${isActive ? 'publié(s)' : 'masqué(s)'}.`);
    setSelectedIds([]);
    await loadData();
  };

  const confirmDeleteSingle = async () => {
    if (!deleteTarget) return;
    await fetchApi(`/storefront-cms/cms/testimonials/${deleteTarget.id}`, { method: 'DELETE' });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
    setSelectedIds((prev) => prev.filter((x) => x !== deleteTarget.id));
    setToastMsg('Témoignage supprimé.');
    setDeleteTarget(null);
    await loadData();
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await Promise.allSettled(
      selectedIds.map((id) => fetchApi(`/storefront-cms/cms/testimonials/${id}`, { method: 'DELETE' })),
    );
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
    setToastMsg(`${selectedIds.length} témoignage(s) supprimé(s).`);
    setSelectedIds([]);
    setBulkDeleteOpen(false);
    await loadData();
  };

  const columns: ColumnDef<CuratedTestimonial>[] = [
    {
      key: 'name',
      header: 'Client & Ville',
      sortable: true,
      sortValue: (t) => t.name,
      render: (t) => (
        <div>
          <div className="text-xs font-bold text-[#1D232E]">{t.name}</div>
          <div className="text-[11px] text-slate-500">{t.city} &bull; {t.dateLabel}</div>
        </div>
      ),
      printRender: (t) => `${t.name} (${t.city})`,
    },
    {
      key: 'stars',
      header: 'Note',
      sortable: true,
      sortValue: (t) => t.stars || 5,
      render: (t) => (
        <div className="flex text-[#C59B27]">
          {[...Array(t.stars || 5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-current" />
          ))}
        </div>
      ),
      printRender: (t) => `${t.stars || 5}/5`,
    },
    {
      key: 'comment',
      header: 'Témoignage',
      render: (t) => <p className="text-xs text-slate-600 line-clamp-2 max-w-md">« {t.comment} »</p>,
      printRender: (t) => t.comment,
    },
    {
      key: 'isActive',
      header: 'Statut',
      sortable: true,
      sortValue: (t) => (t.isActive !== false ? 'Visible' : 'Masqué'),
      render: (t) => (
        <Badge variant={t.isActive !== false ? 'success' : 'neutral'} size="sm">
          {t.isActive !== false ? 'Visible Accueil' : 'Masqué'}
        </Badge>
      ),
      printRender: (t) => (t.isActive !== false ? 'Visible Accueil' : 'Masqué'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleToggleStatus(t)}
            title={t.isActive !== false ? 'Masquer sur la vitrine' : 'Publier sur la vitrine'}
            className="w-8 h-8 rounded-lg border border-neutral-200 bg-white hover:bg-[#FBF6E8] text-amber-700 inline-flex items-center justify-center transition cursor-pointer"
          >
            {t.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(t)}
            title="Supprimer ce témoignage"
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
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Témoignages Clients (Affichés en Page d&apos;Accueil)
              </h1>
              <p className="text-xs text-slate-500">
                Sélection officielle gérée par Super Admin / Website Manager (distincte des commentaires laissés sur chaque fiche article).
              </p>
            </div>
          </div>
          <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Ajouter un Témoignage</span>
          </Button>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'SEO & Réputation', href: '/dashboard/section/seo' },
              { label: 'Témoignages Page Accueil' },
            ]}
          />
        </div>
      </div>

      <DataTable<CuratedTestimonial>
        data={items}
        columns={columns}
        keyExtractor={(t) => t.id}
        isLoading={loading}
        onRefresh={loadData}
        searchPlaceholder="Rechercher par client, ville ou commentaire..."
        searchKeys={['name', 'city', 'comment']}
        statusOptions={[
          { value: 'true', label: 'Visible Accueil' },
          { value: 'false', label: 'Masqué' },
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
            <Button variant="outline" size="sm" onClick={() => handleBulkStatus(true)}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              <span>Publier ({selectedIds.length})</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkStatus(false)}>
              <EyeOff className="w-3.5 h-3.5 mr-1 text-amber-600" />
              <span>Masquer ({selectedIds.length})</span>
            </Button>
          </>
        )}
        renderMatrixCard={(t) => (
          <div className="bg-white p-5 rounded-3xl border border-[#E6E1D6] shadow-xs space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-heading font-bold text-[#1D232E]">{t.name}</h3>
                  <p className="text-[11px] text-slate-500">{t.city} &bull; {t.dateLabel}</p>
                </div>
                <div className="flex text-[#C59B27]">
                  {[...Array(t.stars || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">« {t.comment} »</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Badge variant={t.isActive !== false ? 'success' : 'neutral'} size="sm">
                {t.isActive !== false ? 'Visible Accueil' : 'Masqué'}
              </Badge>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => handleToggleStatus(t)} title="Basculer visibilité" className="w-7 h-7 rounded-lg border border-neutral-200 text-amber-700 inline-flex items-center justify-center cursor-pointer">
                  {t.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button type="button" onClick={() => setDeleteTarget(t)} title="Supprimer" className="w-7 h-7 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 inline-flex items-center justify-center cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
        printTitle="Témoignages Clients Page Accueil — Royal"
        exportFileName="temoignages_seo_royal"
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteSingle}
        title="Supprimer ce témoignage ?"
        description={`Confirmez-vous la suppression du témoignage de ${deleteTarget?.name || ''} ?`}
      />

      <DeleteConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Supprimer les témoignages sélectionnés"
        description={`Confirmez-vous la suppression des ${selectedIds.length} témoignage(s) sélectionné(s) ?`}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publier un Témoignage Accueil"
        type="create"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="gold" type="submit" form="seo-testimonial-form"><Save className="w-4 h-4" /><span>Publier</span></Button>
          </div>
        }
      >
        <form id="seo-testimonial-form" onSubmit={handleAdd} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom du Client *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Ville / Gouvernorat" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Libellé Date" value={form.dateLabel} onChange={(e) => setForm({ ...form, dateLabel: e.target.value })} />
            <Input label="Note (/5)" type="number" min={1} max={5} value={form.stars} onChange={(e) => setForm({ ...form, stars: Number(e.target.value) || 5 })} />
          </div>
          <Textarea label="Témoignage *" required rows={4} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        </form>
      </Modal>

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
    </div>
  );
}
