'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Boxes,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Palette,
  Ruler,
  Zap,
  Sparkles,
  Tag,
  Layers,
  X,
  Check,
  Package,
  Eye,
  EyeOff,
  Info,
  Sliders,
  Calendar,
  CheckSquare,
  Square,
} from 'lucide-react';
import { cn, formatTndCurrency } from '@/lib/utils';
import {
  DataTable,
  ColumnDef,
  DisplayMode,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Modal,
  DeleteConfirmModal,
  Breadcrumb,
  Toast,
} from '@/components/ui';
import { ModalArticlesTable, RelatedArticlesModal } from '@/components/dashboard';
import { fetchApi, fetchAllPaginated } from '@/lib/api';

export type VariantVisualType = 'COLOR_SWATCH' | 'TEXT_PILL';

export interface VariantValue {
  id: string;
  label: string;
  labelAr?: string;
  colorHex?: string;
}

export interface VariantFamily {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  visualType: VariantVisualType;
  values: VariantValue[];
  description?: string;
  articlesCount?: number;
  isActive?: boolean;

  // Audit & Tracking Fields
  createdAt?: string | Date;
  updatedAt?: string | Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  isUpdated?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | Date | null;
  deletedBy?: string | null;
}

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  category?: { name: string };
  brand?: { name: string };
  dimensionsJson?: Record<string, any>;
}

export default function DashboardVariantsPage() {
  const [families, setFamilies] = React.useState<VariantFamily[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedFamilyIds, setSelectedFamilyIds] = React.useState<string[]>([]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingFamily, setEditingFamily] = React.useState<VariantFamily | null>(null);
  const [familyToDelete, setFamilyToDelete] = React.useState<VariantFamily | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [optionsModalFamily, setOptionsModalFamily] = React.useState<VariantFamily | null>(null);
  const [articlesModalFamily, setArticlesModalFamily] = React.useState<VariantFamily | null>(null);
  const [modalArticlesPage, setModalArticlesPage] = React.useState(1);
  const [modalArticlesSearch, setModalArticlesSearch] = React.useState('');

  // Toast feedback
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formName, setFormName] = React.useState('');
  const [formNameAr, setFormNameAr] = React.useState('');
  const [formCode, setFormCode] = React.useState('');
  const [formVisualType, setFormVisualType] = React.useState<VariantVisualType>('TEXT_PILL');
  const [formDescription, setFormDescription] = React.useState('');
  const [formValues, setFormValues] = React.useState<VariantValue[]>([]);

  // Temp Value Input
  const [valLabel, setValLabel] = React.useState('');
  const [valLabelAr, setValLabelAr] = React.useState('');
  const [valColorHex, setValColorHex] = React.useState('#18181b');

  // Fallback initial data
  const defaultFamilies: VariantFamily[] = [
    {
      id: 'fam-coloris',
      name: 'Coloris & Nuances',
      nameAr: 'الألوان والدرجات',
      code: 'couleur',
      visualType: 'COLOR_SWATCH',
      description: 'Nuancier officiel pour appareils, petit électroménager et vaisselle.',
      articlesCount: 18,
      isActive: true,
      createdAt: '2026-11-15T09:30:00.000Z',
      updatedAt: '2026-11-15T09:30:00.000Z',
      createdBy: 'SUPER_ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
      values: [
        { id: 'v-black', label: 'Noir Mat Intense', labelAr: 'أسود مطفي', colorHex: '#18181b' },
        { id: 'v-silver', label: 'Inox Brossé', labelAr: 'فولاذ مصقول', colorHex: '#94a3b8' },
        { id: 'v-white', label: 'Blanc Pur Émaillé', labelAr: 'أبيض ناصع', colorHex: '#f8fafc' },
        { id: 'v-red', label: 'Rouge Cerise Passion', labelAr: 'أحمر كرزي', colorHex: '#dc2626' },
        { id: 'v-cream', label: 'Crème Vintage', labelAr: 'كريمي كلاسيكي', colorHex: '#fef3c7' },
        { id: 'v-blue', label: 'Bleu Nuit Saphir', labelAr: 'أزرق ياقوتي', colorHex: '#1e3a8a' },
      ],
    },
    {
      id: 'fam-tailles',
      name: 'Tailles & Formats',
      nameAr: 'المقاسات والأحجام',
      code: 'taille',
      visualType: 'TEXT_PILL',
      description: 'Formats standardisés pour batteries, plats de cuisson et couteaux.',
      articlesCount: 14,
      isActive: true,
      createdAt: '2026-11-12T11:00:00.000Z',
      updatedAt: '2026-11-12T11:00:00.000Z',
      createdBy: 'ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
      values: [
        { id: 'v-s', label: '20 cm (1.5L)', labelAr: 'صغير 20 سم' },
        { id: 'v-m', label: '24 cm (3.0L)', labelAr: 'متوسط 24 سم' },
        { id: 'v-l', label: '28 cm (5.0L)', labelAr: 'كبير 28 سم' },
        { id: 'v-xl', label: '32 cm (7.5L)', labelAr: 'كبير جدا 32 سم' },
      ],
    },
    {
      id: 'fam-capacite',
      name: 'Capacité & Volume Réservoir',
      nameAr: 'السعة وحجم الخزان',
      code: 'capacite',
      visualType: 'TEXT_PILL',
      description: 'Volumes pour robots pétrins, cuves airfryer et cafetières.',
      articlesCount: 9,
      isActive: true,
      createdAt: '2026-11-04T15:30:00.000Z',
      updatedAt: '2026-11-04T15:30:00.000Z',
      createdBy: 'ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
      values: [
        { id: 'v-cap-1', label: '1.2 Litres', labelAr: '1.2 لتر' },
        { id: 'v-cap-2', label: '2.5 Litres', labelAr: '2.5 لتر' },
        { id: 'v-cap-3', label: '5.0 Litres (Grand Format)', labelAr: '5.0 لتر' },
        { id: 'v-cap-4', label: '8.5 Litres (Double Tiroir)', labelAr: '8.5 لتر' },
      ],
    },
    {
      id: 'fam-puissance',
      name: 'Puissance Moteur / Chauffante',
      nameAr: 'القوة والأداء',
      code: 'puissance',
      visualType: 'TEXT_PILL',
      description: 'Niveaux de motorisation et watts pour hachoirs, blenders et fours.',
      articlesCount: 12,
      isActive: true,
      createdAt: '2026-10-10T14:00:00.000Z',
      updatedAt: '2026-10-10T14:00:00.000Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
      values: [
        { id: 'v-p-500', label: '500 Watts (Éco)' },
        { id: 'v-p-1000', label: '1000 Watts' },
        { id: 'v-p-1600', label: '1600 Watts (Pro)' },
        { id: 'v-p-2400', label: '2400 Watts (Haute Puissance)' },
      ],
    },
  ];

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const productsPromise = fetchAllPaginated('/products', 200)
        .then((prodsRes) => {
          if (prodsRes?.items) setProducts(prodsRes.items);
        })
        .catch(() => null);

      const varRes = await fetchApi('/variants').catch(() => null);
      if (varRes) {
        const vList = Array.isArray(varRes) ? varRes : varRes.data || [];
        setFamilies(vList);
      } else {
        setFamilies(defaultFamilies);
      }
      setIsLoading(false);
      await productsPromise;
    } catch {
      setFamilies(defaultFamilies);
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle Family visibility with toast
  const handleToggleVisibility = async (family: VariantFamily, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = !family.isActive;
    setFamilies((prev) =>
      prev.map((f) => (f.id === family.id ? { ...f, isActive: next } : f))
    );
    try {
      await fetchApi(`/variants/${family.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      });
      showToast(
        'success',
        `La famille ${family.name} est maintenant ${next ? 'active au catalogue' : 'désactivée'}.`
      );
    } catch (err: any) {
      setFamilies((prev) =>
        prev.map((f) => (f.id === family.id ? { ...f, isActive: family.isActive } : f))
      );
      showToast('error', err?.message || 'Erreur lors de la mise à jour.');
    }
  };

  // Open modal handlers
  const openNewModal = () => {
    setEditingFamily(null);
    setFormName('');
    setFormNameAr('');
    setFormCode('');
    setFormVisualType('TEXT_PILL');
    setFormDescription('');
    setFormValues([]);
    setValLabel('');
    setValLabelAr('');
    setValColorHex('#18181b');
    setIsModalOpen(true);
  };

  const openEditModal = (fam: VariantFamily) => {
    setEditingFamily(fam);
    setFormName(fam.name);
    setFormNameAr(fam.nameAr || '');
    setFormCode(fam.code);
    setFormVisualType(fam.visualType);
    setFormDescription(fam.description || '');
    setFormValues([...fam.values]);
    setValLabel('');
    setValLabelAr('');
    setValColorHex('#18181b');
    setIsModalOpen(true);
  };

  // Add temporary option to form values
  const handleAddValue = () => {
    if (!valLabel.trim()) return;
    const newVal: VariantValue = {
      id: `val-${Date.now()}`,
      label: valLabel.trim(),
      labelAr: valLabelAr.trim() || undefined,
      colorHex: formVisualType === 'COLOR_SWATCH' ? valColorHex : undefined,
    };
    setFormValues((prev) => [...prev, newVal]);
    setValLabel('');
    setValLabelAr('');
  };

  const handleRemoveValue = (id: string) => {
    setFormValues((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSaveFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      showToast('error', 'Le nom et le code technique sont obligatoires.');
      return;
    }

    if (formValues.length === 0) {
      showToast('error', 'Veuillez configurer au moins une option/nuance pour cette variante.');
      return;
    }

    const payload: Record<string, any> = {
      name: formName.trim(),
      code: formCode.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      visualType: formVisualType,
      isActive: editingFamily ? editingFamily.isActive !== false : true,
      values: formValues.map((v, idx) => ({
        label: v.label,
        ...(v.labelAr ? { labelAr: v.labelAr } : {}),
        ...(v.colorHex ? { colorHex: v.colorHex } : {}),
        sortOrder: idx,
      })),
    };
    if (formNameAr.trim()) payload.nameAr = formNameAr.trim();
    if (formDescription.trim()) payload.description = formDescription.trim();

    try {
      if (editingFamily) {
        await fetchApi(`/variants/${editingFamily.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', `La variante ${payload.name} a été modifiée avec succès.`);
      } else {
        await fetchApi('/variants', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', `La variante ${payload.name} a été créée avec succès.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de l’enregistrement.');
    }
  };

  const confirmDelete = async () => {
    if (!familyToDelete) return;
    try {
      await fetchApi(`/variants/${familyToDelete.id}`, { method: 'DELETE' });
      setFamilies((prev) => prev.filter((f) => f.id !== familyToDelete.id));
      setSelectedFamilyIds((prev) => prev.filter((id) => id !== familyToDelete.id));
      showToast('success', `La variante ${familyToDelete.name} a été supprimée.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Impossible de supprimer cette famille.');
    } finally {
      setFamilyToDelete(null);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedFamilyIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        selectedFamilyIds.map((id) => fetchApi(`/variants/${id}`, { method: 'DELETE' })),
      );
      const deletedCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.length - deletedCount;
      setSelectedFamilyIds([]);
      setIsBulkDeleteModalOpen(false);
      await loadData();
      if (failedCount === 0) {
        showToast('success', `${deletedCount} famille(s) de variante supprimée(s) avec succès.`);
      } else {
        showToast('error', `${deletedCount} supprimée(s), ${failedCount} erreur(s) lors de la suppression.`);
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Render Action buttons
  const renderActions = (item: VariantFamily) => (
    <div className="flex items-center justify-end gap-1.5 no-print">
      {/* 1. Toggle Active / Catalogue Visibility */}
      <button
        type="button"
        onClick={(e) => handleToggleVisibility(item, e)}
        className={cn(
          'p-1.5 rounded-lg border transition shadow-2xs cursor-pointer',
          item.isActive !== false
            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'
        )}
        title={item.isActive !== false ? 'Actif au catalogue (cliquez pour désactiver)' : 'Désactivé (cliquez pour activer)'}
      >
        {item.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>

      {/* 2. Edit (Amber) */}
      <button
        type="button"
        onClick={() => openEditModal(item)}
        className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition shadow-2xs cursor-pointer"
        title="Modifier la famille de variante"
      >
        <Edit className="w-3.5 h-3.5" />
      </button>

      {/* 3. Delete (Rose) */}
      <button
        type="button"
        onClick={() => setFamilyToDelete(item)}
        className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition shadow-2xs cursor-pointer"
        title="Supprimer la variante"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  // Table Columns Definition
  const columns: ColumnDef<VariantFamily>[] = [
    {
      key: 'name',
      header: 'Famille de Variante',
      sortable: true,
      sortValue: (f) => f.name,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 text-neutral-800">
            {item.visualType === 'COLOR_SWATCH' ? (
              <Palette className="w-5 h-5 text-purple-600" />
            ) : (
              <Boxes className="w-5 h-5 text-neutral-700" />
            )}
          </div>
          <div>
            <div className="font-bold text-neutral-900 text-xs flex items-center gap-2">
              <span>{item.name}</span>
              {item.nameAr && (
                <span className="text-[10px] text-neutral-400 font-arabic" dir="rtl">
                  {item.nameAr}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
              <span className="font-mono">{item.code}</span>
              <span>•</span>
              <span className="font-medium text-neutral-600">
                {item.visualType === 'COLOR_SWATCH' ? 'Pastilles Couleur' : 'Boutons Textuels'}
              </span>
            </div>
          </div>
        </div>
      ),
      printRender: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 flex items-center justify-center text-[10px] font-bold text-neutral-800">
            {item.visualType === 'COLOR_SWATCH' ? '●' : '■'}
          </div>
          <div>
            <div className="font-bold text-neutral-900">{item.name}</div>
            <div className="text-[10px] text-neutral-500">
              {item.code} • {item.visualType === 'COLOR_SWATCH' ? 'Couleur' : 'Texte'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description & Rôle',
      render: (item) => (
        <span className="text-xs text-neutral-600 max-w-sm line-clamp-1">
          {item.description || 'Attribut standard de déclinaison'}
        </span>
      ),
      printRender: (item) => item.description || 'Attribut standard de déclinaison',
    },
    {
      key: 'optionsCount',
      header: 'Valeurs & Nuances',
      sortable: true,
      sortValue: (f) => f.values.length,
      className: 'text-center',
      render: (item) => (
        <button
          type="button"
          onClick={() => setOptionsModalFamily(item)}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 transition cursor-pointer group"
          title="Cliquez pour consulter le détail des options configurées"
        >
          {item.visualType === 'COLOR_SWATCH' && (
            <div className="flex items-center -space-x-1">
              {item.values.slice(0, 3).map((v) => (
                <span
                  key={v.id}
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                  style={{ backgroundColor: v.colorHex || '#ccc' }}
                />
              ))}
            </div>
          )}
          <span>{item.values.length} options</span>
        </button>
      ),
      printRender: (item) =>
        `${item.values.length} options (${item.values.map((v) => v.label).slice(0, 3).join(', ')}${
          item.values.length > 3 ? '...' : ''
        })`,
    },
    {
      key: 'articlesCount',
      header: 'Articles Liés',
      sortable: true,
      sortValue: (f) => Number(f.articlesCount || 0),
      className: 'text-center',
      render: (item) => (
        <button
          type="button"
          onClick={() => {
            setArticlesModalFamily(item);
            setModalArticlesPage(1);
          }}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition cursor-pointer group"
          title="Cliquez pour consulter les articles utilisant cette variante"
        >
          <Package className="w-3 h-3 text-neutral-500 group-hover:scale-110 transition-transform" />
          <span>{item.articlesCount || 0} articles</span>
        </button>
      ),
      printRender: (item) => `${item.articlesCount || 0} articles`,
    },
    {
      key: 'createdAt',
      header: 'Date de Création',
      sortable: true,
      sortValue: (f) => (f.createdAt ? new Date(f.createdAt).getTime() : 0),
      className: 'text-center whitespace-nowrap',
      render: (item) => {
        if (!item.createdAt) return <span className="text-neutral-400 text-xs">—</span>;
        const d = new Date(item.createdAt);
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-200/80 text-neutral-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="font-medium">{d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span className="text-[10px] text-neutral-400">{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
      printRender: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (item) => renderActions(item),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* Floating Toast Notification (Zero Layout Shift) */}
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type === 'error' ? 'error' : 'success'}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Page Header Card (First on Top) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
            Variantes & Déclinaisons
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Configuration des familles d'options, nuanciers de couleurs, dimensions et attributs de déclinaison.
          </p>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Catalogue Commercial', href: '/dashboard/articles' },
              { label: 'Variantes & Déclinaisons' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={openNewModal}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs py-2 px-4 shadow-sm cursor-pointer"
          >
            Nouvelle Variante
          </Button>
        </div>
      </div>

      {/* 2. KPI Stats Cards (Second under Header) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Familles
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {families.length}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Attributs gérés</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Options & Nuances
            </span>
            <span className="text-2xl font-black text-purple-600 mt-1 block">
              {families.reduce((acc, f) => acc + f.values.length, 0)}
            </span>
            <span className="text-[11px] text-purple-600 font-medium mt-0.5 block">Valeurs distinctes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Palette className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Articles Déclinés
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              {families.reduce((acc, f) => acc + (f.articlesCount || 0), 0)}
            </span>
            <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">Produits impactés</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Nuanciers Couleurs
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {families.filter((f) => f.visualType === 'COLOR_SWATCH').length}
            </span>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Pastilles visuelles</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main DataTable */}
      <DataTable<VariantFamily>
        data={families}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher une variante par nom, code, descriptif..."
        searchKeys={['name', 'code', 'description']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        isLoading={isLoading}
        onRefresh={loadData}
        enableMultiSelect={true}
        selectedKeys={selectedFamilyIds}
        onSelectionChange={setSelectedFamilyIds}
        onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
        renderBulkActions={(keys, clearSel) => (
          <>
            <button
              type="button"
              onClick={async () => {
                await Promise.all(
                  keys.map((id) =>
                    fetchApi(`/variants/${id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ isActive: true }),
                    }).catch(() => null),
                  ),
                );
                clearSel();
                await loadData();
                showToast('success', `${keys.length} famille(s) activée(s).`);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 cursor-pointer"
            >
              Activer
            </button>
            <button
              type="button"
              onClick={async () => {
                await Promise.all(
                  keys.map((id) =>
                    fetchApi(`/variants/${id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ isActive: false }),
                    }).catch(() => null),
                  ),
                );
                clearSel();
                await loadData();
                showToast('success', `${keys.length} famille(s) désactivée(s).`);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
            >
              Désactiver
            </button>
            <select
              aria-label="Changer type visuel"
              defaultValue=""
              onChange={async (e) => {
                const vType = e.target.value;
                if (!vType) return;
                await Promise.all(
                  keys.map((id) =>
                    fetchApi(`/variants/${id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ visualType: vType }),
                    }).catch(() => null),
                  ),
                );
                clearSel();
                await loadData();
                showToast('success', `Type visuel mis à jour sur ${keys.length} famille(s).`);
                e.target.value = '';
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E6D6A6] text-xs font-bold text-[#1D232E] cursor-pointer"
            >
              <option value="">Type visuel...</option>
              <option value="COLOR_SWATCH">Pastille Couleur</option>
              <option value="TEXT_PILL">Bouton Texte</option>
            </select>
          </>
        )}
        printTitle="Référentiel des Variantes et Déclinaisons — Royal"
        exportFileName="variantes"
        /* Mode Matrix (Grid Cards) */
        renderMatrixCard={(item, isChecked, onToggleCheck) => (
          <div className={cn(
            'bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group',
            isChecked ? 'border-[var(--royal-primary)] ring-2 ring-[var(--royal-primary)]/30 bg-[#FBF9F4]' : 'border-neutral-200'
          )}>
            <div className="p-4 sm:p-5 space-y-3.5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onToggleCheck}
                    aria-label={`Sélectionner ${item.name}`}
                    className="text-neutral-400 hover:text-[var(--royal-primary)] shrink-0 cursor-pointer"
                  >
                    {isChecked ? <CheckSquare className="w-4 h-4 text-[var(--royal-primary)]" /> : <Square className="w-4 h-4" />}
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
                    {item.visualType === 'COLOR_SWATCH' ? (
                      <Palette className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Boxes className="w-5 h-5 text-neutral-700" />
                    )}
                  </div>
                </div>
                <Badge variant={item.isActive !== false ? 'success' : 'neutral'} size="sm">
                  {item.isActive !== false ? 'Actif' : 'Désactivé'}
                </Badge>
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-neutral-900 text-sm break-words">{item.name}</h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {item.description || 'Attribut de déclinaison'}
                </p>
              </div>

              {/* Swatches preview */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.values.slice(0, 5).map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-700 border border-neutral-200"
                  >
                    {v.colorHex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: v.colorHex }}
                      />
                    )}
                    <span>{v.label}</span>
                  </span>
                ))}
                {item.values.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setOptionsModalFamily(item)}
                    className="px-2 py-0.5 rounded-md bg-neutral-200 text-[11px] font-bold text-neutral-800 hover:bg-neutral-300"
                  >
                    +{item.values.length - 5}
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 bg-neutral-50/70 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-neutral-400 truncate">/{item.code}</span>
              {renderActions(item)}
            </div>
          </div>
        )}
        /* Mode List (No Black Line) */
        renderListItem={(item, isSelected, onSelect, isChecked, onToggleCheck) => (
          <div
            onClick={onSelect}
            className={`p-3.5 flex flex-wrap items-center justify-between gap-3 transition-all ${
              isChecked ? 'bg-[#FBF6E8]/70' : isSelected ? 'bg-neutral-100/70' : 'hover:bg-neutral-50/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={onToggleCheck}
                className="text-neutral-400 hover:text-[var(--royal-primary)] shrink-0 cursor-pointer"
              >
                {isChecked ? <CheckSquare className="w-4 h-4 text-[var(--royal-primary)]" /> : <Square className="w-4 h-4" />}
              </button>
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200">
                {item.visualType === 'COLOR_SWATCH' ? (
                  <Palette className="w-5 h-5 text-purple-600" />
                ) : (
                  <Boxes className="w-5 h-5 text-neutral-700" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-neutral-900 text-xs truncate">{item.name}</div>
                <div className="text-[11px] text-neutral-400 truncate max-w-md">
                  {item.values.map((v) => v.label).join(', ')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setOptionsModalFamily(item)}
                className="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
              >
                {item.values.length} options
              </button>
              {renderActions(item)}
            </div>
          </div>
        )}
      />

      {/* MODAL 1: CONSULTATION DES OPTIONS & VALEURS (STRUCTURED TABLE) */}
      <Modal
        isOpen={!!optionsModalFamily}
        onClose={() => setOptionsModalFamily(null)}
        title={optionsModalFamily ? `Options : ${optionsModalFamily.name}` : ''}
        subtitle={`${optionsModalFamily?.values.length || 0} option(s) configurée(s)`}
        type="custom"
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setOptionsModalFamily(null)}
              className="text-xs py-1.5 px-4"
            >
              Fermer
            </Button>
          </div>
        }
      >
        {optionsModalFamily && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <div>
                <span className="font-bold text-neutral-900 text-xs block">{optionsModalFamily.name}</span>
                <span className="text-[11px] text-neutral-500 font-mono">Code: {optionsModalFamily.code}</span>
              </div>
              <Badge variant="luxury" size="sm">
                {optionsModalFamily.visualType === 'COLOR_SWATCH' ? 'Pastilles Visuelles' : 'Boutons Textuels'}
              </Badge>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Nuance & Visuel</th>
                    <th className="py-2.5 px-3">Libellé Option</th>
                    <th className="py-2.5 px-3 font-mono">Code Hex / Valeur</th>
                    <th className="py-2.5 px-3 text-right">Traduction Arabe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {optionsModalFamily.values.map((val, idx) => (
                    <tr key={val.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-neutral-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        {val.colorHex ? (
                          <span
                            className="w-5 h-5 rounded-full border border-black/20 shadow-2xs inline-block"
                            style={{ backgroundColor: val.colorHex }}
                          />
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-neutral-100 font-mono text-neutral-700 text-[11px]">
                            TXT
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{val.label}</td>
                      <td className="py-2.5 px-3 font-mono text-neutral-600 uppercase text-[11px]">{val.colorHex || val.id}</td>
                      <td className="py-2.5 px-3 text-right font-arabic text-neutral-500 text-xs" dir="rtl">{val.labelAr || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: ARTICLES UTILISANT CETTE VARIANTE (REUSABLE WIDE MODAL) */}
      <RelatedArticlesModal
        isOpen={!!articlesModalFamily}
        onClose={() => setArticlesModalFamily(null)}
        title={articlesModalFamily ? `Articles utilisant "${articlesModalFamily.name}"` : ''}
        subtitle="Articles déclinés au catalogue avec cet attribut"
        articles={
          articlesModalFamily
            ? products.filter((p: any) =>
                Array.isArray(p.variants) &&
                p.variants.some((v: any) => {
                  const attrs = v?.attributesJson || {};
                  const code = articlesModalFamily.code;
                  const val =
                    attrs[code] ??
                    (code === 'couleur' ? attrs.color : undefined) ??
                    (code === 'capacite' ? attrs.size : undefined);
                  return val !== undefined && val !== null && String(val).trim() !== '';
                })
              )
            : []
        }
      />

      {/* MODAL 3: CRÉATION / MODIFICATION FAMILLE DE VARIANTE */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFamily ? `Modifier la Variante : ${editingFamily.name}` : 'Nouvelle Famille de Variante'}
        subtitle="Configurez le nom, le type d'affichage et la liste des valeurs autorisées"
        type="custom"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs py-2 px-4"
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveFamily}
              className="text-xs py-2 px-5"
            >
              {editingFamily ? 'Enregistrer les modifications' : 'Créer la variante'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveFamily} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nom de la Famille (FR) *"
              placeholder="ex: Coloris & Teintes"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (!editingFamily) {
                  setFormCode(
                    e.target.value
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '_')
                  );
                }
              }}
              required
            />
            <Input
              label="Code Technique Unique *"
              placeholder="ex: couleur"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              helperText="Identifiant interne pour la matrice"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Type d'Affichage Visuel *"
              value={formVisualType}
              onChange={(e) => setFormVisualType(e.target.value as VariantVisualType)}
              options={[
                { label: 'Pastilles de Couleur (Color Swatch)', value: 'COLOR_SWATCH' },
                { label: 'Boutons Textuels (Pills / Boutons)', value: 'TEXT_PILL' },
              ]}
            />
            <Input
              label="Libellé en Arabe (Optionnel)"
              placeholder="ex: الألوان والدرجات"
              value={formNameAr}
              onChange={(e) => setFormNameAr(e.target.value)}
              dir="rtl"
            />
          </div>

          <Textarea
            label="Description & Conseils de Choix"
            placeholder="Précisez le rôle de cet attribut dans les fiches produits..."
            rows={2}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />

          {/* Value Builder Section */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <span className="font-bold text-neutral-900 block text-xs">
              Ajouter des Options / Nuances
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className={cn(formVisualType === 'COLOR_SWATCH' ? 'sm:col-span-6' : 'sm:col-span-9')}>
                <Input
                  label="Valeur / Libellé"
                  placeholder={formVisualType === 'COLOR_SWATCH' ? 'ex: Noir Mat' : 'ex: 28 cm'}
                  value={valLabel}
                  onChange={(e) => setValLabel(e.target.value)}
                />
              </div>

              {formVisualType === 'COLOR_SWATCH' && (
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Couleur</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={valColorHex}
                      onChange={(e) => setValColorHex(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-neutral-200 cursor-pointer p-0.5 bg-white"
                    />
                    <span className="font-mono text-[10px] text-neutral-500 uppercase">{valColorHex}</span>
                  </div>
                </div>
              )}

              <div className="sm:col-span-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddValue}
                  className="w-full text-xs py-2"
                >
                  + Ajouter
                </Button>
              </div>
            </div>

            {/* List of configured values */}
            {formValues.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {formValues.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-neutral-900 shadow-2xs"
                  >
                    {v.colorHex && (
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: v.colorHex }}
                      />
                    )}
                    <span>{v.label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(v.id)}
                      className="text-neutral-400 hover:text-rose-600 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CONFIRMATION SUPPRESSION */}
      <DeleteConfirmModal
        isOpen={!!familyToDelete}
        onClose={() => setFamilyToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer la Variante"
        message={
          familyToDelete
            ? `Êtes-vous certain de vouloir supprimer la famille "${familyToDelete.name}" ? Les déclinaisons existantes conservent leurs libellés actuels.`
            : ''
        }
      />

      {/* MODAL 5: CONFIRMATION SUPPRESSION GROUPÉE */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Suppression Groupée des Variantes"
        description={`Êtes-vous certain de vouloir supprimer les ${selectedFamilyIds.length} famille(s) de variante sélectionnée(s) ?`}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
}
