'use client';

import * as React from 'react';
import { Building2, Plus, Phone, MapPin, Save, CheckCircle2, RefreshCw, Check } from 'lucide-react';
import { Button, Input, Modal, Badge, Breadcrumb, Toast } from '@/components/ui';
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    await fetchApi('/storefront-cms/cms/showrooms', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setModalOpen(false);
    setForm({ name: '', code: '', address: '', city: 'Tunis', phone: '' });
    setToastMsg('Salle d’exposition créée en base PostgreSQL.');
    await loadData();
  };

  const handleBulkShowroomStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    await Promise.allSettled(
      selectedIds.map((id) =>
        fetchApi(`/storefront-cms/cms/showrooms/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive }),
        })
      )
    );
    setToastMsg(`${selectedIds.length} salle(s) ${isActive ? 'ouverte(s)' : 'désactivée(s)'}.`);
    setSelectedIds([]);
    await loadData();
  };

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
            <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>
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

      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 rounded-2xl border border-[#E6E1D6] shadow-xs">
          <button
            type="button"
            onClick={() =>
              setSelectedIds(selectedIds.length === items.length ? [] : items.map((s) => s.id))
            }
            className="text-xs font-bold text-[#1D232E] hover:text-[#C59B27] inline-flex items-center gap-2 cursor-pointer"
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                selectedIds.length === items.length && items.length > 0
                  ? 'bg-[#C59B27] border-[#C59B27] text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedIds.length === items.length && items.length > 0 && <Check className="w-3 h-3" />}
            </span>
            <span>
              {selectedIds.length === items.length ? 'Tout désélectionner' : `Tout sélectionner (${items.length})`}
            </span>
          </button>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkShowroomStatus(true)}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Ouvrir ({selectedIds.length})</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkShowroomStatus(false)}>
                <span>Désactiver ({selectedIds.length})</span>
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((sh) => {
          const isChecked = selectedIds.includes(sh.id);
          return (
          <div
            key={sh.id}
            className={`bg-white p-6 rounded-3xl border shadow-sm space-y-4 transition ${
              isChecked ? 'border-[#C59B27] ring-2 ring-[#C59B27]/20 bg-[#FBF9F4]/30' : 'border-[#E6E1D6]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds((prev) =>
                      prev.includes(sh.id) ? prev.filter((x) => x !== sh.id) : [...prev, sh.id]
                    )
                  }
                  aria-label={`Sélectionner ${sh.name}`}
                  className={`mt-1 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                    isChecked ? 'bg-[#C59B27] border-[#C59B27] text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3" />}
                </button>
                <div className="min-w-0">
                  <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                    {sh.code}
                  </span>
                  <h3 className="text-base font-heading font-black text-[#1D232E] mt-2">{sh.name}</h3>
                </div>
              </div>
              <Badge variant={sh.isActive ? 'success' : 'neutral'} size="sm">
                {sh.isActive ? 'Ouvert' : 'Inactif'}
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#C59B27]" /><span>{sh.address || 'Adresse à compléter'}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#C59B27]" /><span>{sh.phone || '—'}</span></div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Caisses associées :</span>
              <span className="font-mono font-bold text-[#1D232E]">
                {(sh.cashRegisters || []).length} caisse(s)
              </span>
            </div>
          </div>
          );
        })}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Créer une Salle d'Exposition"
        type="create"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="gold" type="submit" form="showroom-create-form"><Save className="w-4 h-4" /><span>Créer Showroom</span></Button>
          </div>
        }
      >
        <form id="showroom-create-form" onSubmit={handleCreate} className="p-6 space-y-4">
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
