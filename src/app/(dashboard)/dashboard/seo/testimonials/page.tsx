'use client';

import * as React from 'react';
import { Sparkles, Plus, Trash2, Star, Save } from 'lucide-react';
import { Button, Input, Textarea, Modal, Badge, Breadcrumb, Toast } from '@/components/ui';
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
  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', city: 'Tunis', dateLabel: "Aujourd'hui", stars: 5, comment: '' });
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    const res = await fetchApi('/storefront-cms/cms/testimonials').catch(() => []);
    setItems(Array.isArray(res) ? res : []);
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

  const handleDelete = async (id: string) => {
    await fetchApi(`/storefront-cms/cms/testimonials/${id}`, { method: 'DELETE' });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
    setToastMsg('Témoignage supprimé.');
    await loadData();
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((t) => (
          <div key={t.id} className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
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
              <Badge variant="success" size="sm">Visible Accueil</Badge>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        ))}
      </div>

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
