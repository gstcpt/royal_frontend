'use client';

import * as React from 'react';
import { Building2, Plus, Phone, MapPin, Save, CheckCircle2, RefreshCw } from 'lucide-react';
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((sh) => (
          <div key={sh.id} className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
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
        ))}
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
