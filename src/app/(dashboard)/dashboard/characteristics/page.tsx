'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sliders,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Layers,
  Tag,
  Hash,
  Type,
  ListFilter,
  ToggleLeft,
  X,
  Check,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  FolderTree,
  Folder,
  Package,
  Boxes,
  Eye,
  EyeOff,
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
  MultiSelect,
} from '@/components/ui';
import { ModalArticlesTable, RelatedArticlesModal } from '@/components/dashboard';
import { fetchApi, fetchAllPaginated, API_BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export type CharacteristicType =
  | 'NUMBER'
  | 'TEXT'
  | 'DATE'
  | 'DATE_RANGE'
  | 'BOOLEAN'
  | 'MULTI_SELECT'
  | 'SELECT';

export interface CharacteristicItem {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  type: CharacteristicType;
  unit?: string;
  iconUrl?: string;
  options?: string[];
  categoryIds: string[];
  isRequired?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
  articlesCount?: number;

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

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: CategoryOption[];
}

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  category?: { id: string; name: string };
  brand?: { name: string };
}

// Unit presets categorized by domain
const UNIT_PRESETS = [
  {
    category: 'Prix & Monnaie',
    units: ['TND', '€', '$', 'DZD', 'MAD'],
  },
  {
    category: 'Pourcentage',
    units: ['%'],
  },
  {
    category: 'Dimensions & Longueur',
    units: ['mm', 'cm', 'm', 'pouces (")'],
  },
  {
    category: 'Capacité & Liquide',
    units: ['ml', 'cl', 'L', 'm³'],
  },
  {
    category: 'Masse & Poids',
    units: ['mg', 'g', 'kg', 'tonne'],
  },
  {
    category: 'Durée & Temps',
    units: ['minutes', 'heures', 'jours', 'semaines', 'mois', 'années'],
  },
  {
    category: 'Puissance & Technique',
    units: ['W', 'kW', 'V', 'A', 'Bars', '°C', 'Hz', 'dB', 'tr/min'],
  },
];

export default function DashboardCharacteristicsPage() {
  const canDeleteChar = useAuthStore((s) => s.hasPermission('characteristics.delete'));
  const [characteristics, setCharacteristics] = React.useState<CharacteristicItem[]>([]);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedCharIds, setSelectedCharIds] = React.useState<string[]>([]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CharacteristicItem | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<CharacteristicItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [categoriesModalItem, setCategoriesModalItem] = React.useState<CharacteristicItem | null>(null);
  const [articlesModalItem, setArticlesModalItem] = React.useState<CharacteristicItem | null>(null);

  // Toast feedback
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formName, setFormName] = React.useState('');
  const [formNameAr, setFormNameAr] = React.useState('');
  const [formIconUrl, setFormIconUrl] = React.useState('');
  const [isDraggingIcon, setIsDraggingIcon] = React.useState(false);
  const iconFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [formType, setFormType] = React.useState<CharacteristicType>('TEXT');
  const [formUnit, setFormUnit] = React.useState('');
  const [formCustomUnit, setFormCustomUnit] = React.useState('');
  const [formOptions, setFormOptions] = React.useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = React.useState('');
  const [formCategoryScope, setFormCategoryScope] = React.useState<'ALL' | 'SPECIFIC'>('ALL');
  const [formSelectedCategoryIds, setFormSelectedCategoryIds] = React.useState<string[]>([]);
  const [formIsRequired, setFormIsRequired] = React.useState(false);
  const [formIsFilterable, setFormIsFilterable] = React.useState(true);
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});

  // Dynamic Toolbar Filters
  const [filterType, setFilterType] = React.useState('ALL');
  const [filterRequired, setFilterRequired] = React.useState('ALL');
  const [filterFilterable, setFilterFilterable] = React.useState('ALL');
  const [filterCategory, setFilterCategory] = React.useState('ALL');

  // Articles Modal pagination
  const [modalArticlesPage, setModalArticlesPage] = React.useState(1);
  const [modalArticlesSearch, setModalArticlesSearch] = React.useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleUploadCharIcon = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = typeof window !== 'undefined' ? localStorage.getItem('royal_token') : null;
      const res = await fetch(`${API_BASE_URL}/storefront-cms/cms/upload-image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
        credentials: 'include',
      });
      const json = await res.json().catch(() => null);
      const url = json?.data?.url || json?.url;
      if (!res.ok || !url) {
        throw new Error(json?.message || "Échec d'envoi de l'icône.");
      }
      setFormIconUrl(url);
      showToast('success', 'Icône importée et sauvegardée.');
    } catch (err: any) {
      showToast('error', err?.message || "Impossible d'importer l'icône.");
    }
  };

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const productsPromise = fetchAllPaginated('/products', 200)
        .then((prodRes) => {
          if (prodRes?.items) setProducts(prodRes.items);
        })
        .catch(() => null);

      const [charRes, catRes] = await Promise.all([
        fetchApi('/characteristics'),
        fetchApi('/categories?tree=false'),
      ]);

      const cList = Array.isArray(catRes) ? catRes : catRes?.data || [];
      setCategories(Array.isArray(cList) ? cList : []);

      const chList = Array.isArray(charRes) ? charRes : charRes?.data || [];
      setCharacteristics(Array.isArray(chList) ? chList : []);
      setIsLoading(false);
      await productsPromise;
    } catch {
      setCharacteristics([]);
      setCategories([]);
      setIsLoading(false);
      showToast('error', 'Erreur lors du chargement des caractéristiques depuis le serveur.');
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Clickable toggle for Filterable badge
  const handleToggleFilterable = async (item: CharacteristicItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextVal = !item.isFilterable;
    setCharacteristics((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, isFilterable: nextVal } : c))
    );
    try {
      await fetchApi(`/characteristics/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isFilterable: nextVal }),
      });
      showToast(
        'success',
        `Filtre catalogue "${item.name}" : ${nextVal ? 'Activé dans les filtres storefront' : 'Désactivé des filtres'}.`
      );
    } catch (err: any) {
      setCharacteristics((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isFilterable: item.isFilterable } : c))
      );
      showToast('error', err?.message || 'Erreur lors de la mise à jour.');
    }
  };

  // Clickable toggle for Required badge
  const handleToggleRequired = async (item: CharacteristicItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextVal = !item.isRequired;
    setCharacteristics((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, isRequired: nextVal } : c))
    );
    try {
      await fetchApi(`/characteristics/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRequired: nextVal }),
      });
      showToast(
        'success',
        `Champ "${item.name}" : ${nextVal ? 'Défini comme OBLIGATOIRE lors de la création d’article' : 'Optionnel'}.`
      );
    } catch (err: any) {
      setCharacteristics((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isRequired: item.isRequired } : c))
      );
      showToast('error', err?.message || 'Erreur lors de la mise à jour.');
    }
  };

  const getInitials = (text: string) => {
    if (!text) return 'CT';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const filteredCharacteristics = React.useMemo(() => {
    return characteristics.filter((c) => {
      if (filterType !== 'ALL' && c.type !== filterType) return false;
      if (filterRequired === 'YES' && !c.isRequired) return false;
      if (filterRequired === 'NO' && c.isRequired) return false;
      if (filterFilterable === 'YES' && !c.isFilterable) return false;
      if (filterFilterable === 'NO' && c.isFilterable) return false;
      if (filterCategory !== 'ALL') {
        if (c.categoryIds && c.categoryIds.length > 0 && !c.categoryIds.includes(filterCategory)) {
          return false;
        }
      }
      return true;
    });
  }, [characteristics, filterType, filterRequired, filterFilterable, filterCategory]);

  // Modal Open Handlers
  const openNewModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormNameAr('');
    setFormIconUrl('');
    setFormType('TEXT');
    setFormUnit('');
    setFormCustomUnit('');
    setFormOptions([]);
    setNewOptionInput('');
    setFormCategoryScope('ALL');
    setFormSelectedCategoryIds([]);
    setFormIsRequired(false);
    setFormIsFilterable(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: CharacteristicItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormNameAr(item.nameAr || '');
    setFormIconUrl(item.iconUrl || '');
    setFormType(item.type);
    setFormUnit(item.unit || '');
    setFormCustomUnit('');
    setFormOptions(item.options ? [...item.options] : []);
    setNewOptionInput('');
    setFormCategoryScope(item.categoryIds && item.categoryIds.length > 0 ? 'SPECIFIC' : 'ALL');
    setFormSelectedCategoryIds(item.categoryIds || []);
    setFormIsRequired(!!item.isRequired);
    setFormIsFilterable(item.isFilterable !== false);
    setIsModalOpen(true);
  };

  // Helper to format Type Label and Icon
  const getTypeInfo = (type: CharacteristicType) => {
    switch (type) {
      case 'NUMBER':
        return { label: 'Nombre / Numérique', icon: <Hash className="w-3.5 h-3.5 text-blue-600" /> };
      case 'TEXT':
        return { label: 'Texte Libre', icon: <Type className="w-3.5 h-3.5 text-neutral-600" /> };
      case 'DATE':
        return { label: 'Date Picker', icon: <Calendar className="w-3.5 h-3.5 text-amber-600" /> };
      case 'DATE_RANGE':
        return { label: 'Période (Début — Fin)', icon: <Clock className="w-3.5 h-3.5 text-orange-600" /> };
      case 'BOOLEAN':
        return { label: 'Booléen (Oui / Non)', icon: <ToggleLeft className="w-3.5 h-3.5 text-emerald-600" /> };
      case 'MULTI_SELECT':
        return { label: 'Multi-sélection', icon: <ListFilter className="w-3.5 h-3.5 text-purple-600" /> };
      case 'SELECT':
        return { label: 'Liste Déroulante (Choix unique)', icon: <ListFilter className="w-3.5 h-3.5 text-indigo-600" /> };
      default:
        return { label: type, icon: <Sliders className="w-3.5 h-3.5" /> };
    }
  };

  // Add Option to List
  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;
    if (formOptions.includes(newOptionInput.trim())) return;
    setFormOptions([...formOptions, newOptionInput.trim()]);
    setNewOptionInput('');
  };

  const handleRemoveOption = (index: number) => {
    setFormOptions(formOptions.filter((_, i) => i !== index));
  };

  // Category Multi-Selection
  const toggleCategorySelection = (catId: string) => {
    if (formSelectedCategoryIds.includes(catId)) {
      setFormSelectedCategoryIds(formSelectedCategoryIds.filter((id) => id !== catId));
    } else {
      setFormSelectedCategoryIds([...formSelectedCategoryIds, catId]);
    }
  };

  // Form Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('error', 'Le nom de la caractéristique est obligatoire.');
      return;
    }

    // Auto-generate technical code internally without bothering the user
    const autoCode = (editingItem?.code || formName)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)+/g, '');

    const resolvedUnit =
      formType === 'NUMBER' ? (formCustomUnit.trim() ? formCustomUnit.trim() : formUnit) : undefined;

    const payload: Record<string, any> = {
      name: formName.trim(),
      code: autoCode,
      type: formType,
      categoryIds: formCategoryScope === 'ALL' ? [] : formSelectedCategoryIds,
      isRequired: formIsRequired,
      isFilterable: formIsFilterable,
    };
    if (formNameAr.trim()) payload.nameAr = formNameAr.trim();
    if (resolvedUnit) payload.unit = resolvedUnit;
    if (formIconUrl.trim()) payload.iconUrl = formIconUrl.trim();
    if (['SELECT', 'MULTI_SELECT'].includes(formType)) payload.options = formOptions;

    try {
      if (editingItem) {
        await fetchApi(`/characteristics/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', `Caractéristique "${payload.name}" mise à jour avec succès.`);
      } else {
        await fetchApi('/characteristics', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', `Caractéristique "${payload.name}" créée avec succès.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de l’enregistrement.');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await fetchApi(`/characteristics/${itemToDelete.id}`, { method: 'DELETE' });
      setCharacteristics((prev) => prev.filter((c) => c.id !== itemToDelete.id));
      setSelectedCharIds((prev) => prev.filter((id) => id !== itemToDelete.id));
      showToast('success', `Caractéristique "${itemToDelete.name}" supprimée.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Impossible de supprimer cette caractéristique.');
    } finally {
      setItemToDelete(null);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedCharIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        selectedCharIds.map((id) => fetchApi(`/characteristics/${id}`, { method: 'DELETE' })),
      );
      const deletedCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.length - deletedCount;
      setSelectedCharIds([]);
      setIsBulkDeleteModalOpen(false);
      await loadData();
      if (failedCount === 0) {
        showToast('success', `${deletedCount} caractéristique(s) supprimée(s) avec succès.`);
      } else {
        showToast('error', `${deletedCount} supprimée(s), ${failedCount} erreur(s) lors de la suppression.`);
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Reusable Actions Renderer with Toggles
  const renderActions = (item: CharacteristicItem) => (
    <div className="flex items-center justify-end gap-1.5 no-print">
      {/* 1. Toggle Filtre Catalogue */}
      <button
        type="button"
        onClick={(e) => handleToggleFilterable(item, e)}
        className={cn(
          'p-1.5 rounded-lg border transition shadow-2xs cursor-pointer',
          item.isFilterable
            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'
        )}
        title={item.isFilterable ? 'Filtre catalogue actif (cliquer pour désactiver)' : 'Filtre catalogue inactif (cliquer pour activer)'}
      >
        <Filter className="w-3.5 h-3.5" />
      </button>

      {/* 2. Toggle Obligatoire */}
      <button
        type="button"
        onClick={(e) => handleToggleRequired(item, e)}
        className={cn(
          'p-1.5 rounded-lg border transition shadow-2xs cursor-pointer',
          item.isRequired
            ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
            : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'
        )}
        title={item.isRequired ? 'Champ obligatoire (cliquer pour rendre facultatif)' : 'Champ facultatif (cliquer pour rendre obligatoire)'}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
      </button>

      {/* 3. Edit (Amber) */}
      <button
        type="button"
        onClick={() => openEditModal(item)}
        className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition shadow-2xs cursor-pointer"
        title="Modifier la caractéristique"
      >
        <Edit className="w-3.5 h-3.5" />
      </button>

      {/* 4. Delete (Rose) */}
      {canDeleteChar && (
        <button
          type="button"
          onClick={() => setItemToDelete(item)}
          className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition shadow-2xs cursor-pointer"
          title="Supprimer la caractéristique"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  // Table Columns Definition (Removed Type, Obligatoire, Filtre as standalone columns)
  const columns: ColumnDef<CharacteristicItem>[] = [
    {
      key: 'name',
      header: 'Caractéristique Technique',
      sortable: true,
      sortValue: (c) => c.name,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 text-neutral-800 overflow-hidden">
            {item.iconUrl ? (
              <Image src={item.iconUrl} alt={item.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-black text-xs">
                {getInitials(item.name)}
              </div>
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
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
              <span className="font-medium text-neutral-700">{getTypeInfo(item.type).label}</span>
              {item.unit && (
                <>
                  <span>•</span>
                  <span className="font-mono font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                    {item.unit}
                  </span>
                </>
              )}
              {item.options && item.options.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-neutral-400">{item.options.length} options</span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
      printRender: (item) => (
        <div className="flex items-center gap-2">
          {item.iconUrl ? (
            <img src={item.iconUrl} alt="" className="w-7 h-7 rounded object-contain border border-neutral-300 p-0.5 bg-white" />
          ) : (
            <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 flex items-center justify-center text-[9px] font-bold text-neutral-700">
              {getInitials(item.name)}
            </div>
          )}
          <div>
            <div className="font-bold text-neutral-900">{item.name}</div>
            <div className="text-[10px] text-neutral-500">
              {getTypeInfo(item.type).label} {item.unit ? `• ${item.unit}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'categories',
      header: 'Rayons / Catégories Liées',
      render: (item) => {
        if (!item.categoryIds || item.categoryIds.length === 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Tous les Rayons (Global)</span>
            </span>
          );
        }

        const firstCat = categories.find((c) => c.id === item.categoryIds[0])?.name || item.categoryIds[0];
        const remainingCount = item.categoryIds.length - 1;

        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
              <Layers className="w-3 h-3 text-neutral-500" />
              <span>{firstCat}</span>
            </span>
            {remainingCount > 0 && (
              <button
                type="button"
                onClick={() => setCategoriesModalItem(item)}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 transition cursor-pointer"
                title="Consulter toutes les catégories liées"
              >
                +{remainingCount} autre{remainingCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        );
      },
      printRender: (item) => (!item.categoryIds || item.categoryIds.length === 0 ? 'Tous les rayons (Global)' : item.categoryIds.join(', ')),
    },
    {
      key: 'articlesCount',
      header: 'Articles Liés',
      sortable: true,
      sortValue: (c) => Number(c.articlesCount || 0),
      className: 'text-center',
      render: (item) => (
        <button
          type="button"
          onClick={() => {
            setArticlesModalItem(item);
            setModalArticlesPage(1);
          }}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition cursor-pointer group"
          title="Cliquez pour consulter les articles utilisant cette caractéristique"
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
      sortValue: (c) => (c.createdAt ? new Date(c.createdAt).getTime() : 0),
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
            Caractéristiques Techniques
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Fiches techniques dynamiques, typage des données, filtres de recherche et unités de mesure.
          </p>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Catalogue Commercial', href: '/dashboard/articles' },
              { label: 'Caractéristiques Techniques' },
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
            Nouvelle Caractéristique
          </Button>
        </div>
      </div>

      {/* 2. KPI Stats Cards (Second under Header) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Caractéristiques
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {characteristics.length}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Attributs techniques</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Filtres Storefront
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {characteristics.filter((c) => c.isFilterable).length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Facettes actives</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Filter className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Champs Obligatoires
            </span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">
              {characteristics.filter((c) => c.isRequired).length}
            </span>
            <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">Requis à la saisie</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Articles Équipés
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              {characteristics.reduce((acc, c) => acc + (c.articlesCount || 0), 0)}
            </span>
            <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">Valeurs renseignées</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main DataTable (Third with Filters) */}
      <DataTable<CharacteristicItem>
        data={filteredCharacteristics}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher une caractéristique par nom, type, unité..."
        searchKeys={['name', 'code', 'unit']}
        customFilters={[
          {
            key: 'type',
            label: 'Type de Donnée',
            value: filterType,
            onChange: setFilterType,
            allLabel: 'Tous les types',
            options: [
              { label: 'Nombre / Numérique', value: 'NUMBER' },
              { label: 'Texte Libre', value: 'TEXT' },
              { label: 'Date Picker', value: 'DATE' },
              { label: 'Période Date (Début — Fin)', value: 'DATE_RANGE' },
              { label: 'Booléen (Oui / Non)', value: 'BOOLEAN' },
              { label: 'Liste Déroulante (Choix unique)', value: 'SELECT' },
              { label: 'Multi-sélection', value: 'MULTI_SELECT' },
            ],
          },
          {
            key: 'required',
            label: 'Obligatoire',
            value: filterRequired,
            onChange: setFilterRequired,
            allLabel: 'Tous',
            options: [
              { label: 'Obligatoire (Oui)', value: 'YES' },
              { label: 'Facultatif (Non)', value: 'NO' },
            ],
          },
          {
            key: 'filterable',
            label: 'Filtre Catalogue',
            value: filterFilterable,
            onChange: setFilterFilterable,
            allLabel: 'Tous',
            options: [
              { label: 'Filtre actif', value: 'YES' },
              { label: 'Filtre désactivé', value: 'NO' },
            ],
          },
          {
            key: 'category',
            label: 'Catégorie',
            value: filterCategory,
            onChange: setFilterCategory,
            allLabel: 'Toutes les catégories',
            options: categories.map((c) => ({ label: c.name, value: c.id })),
          },
        ]}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        isLoading={isLoading}
        onRefresh={loadData}
        enableMultiSelect={true}
        selectedKeys={selectedCharIds}
        onSelectionChange={setSelectedCharIds}
        onBulkDelete={canDeleteChar ? () => setIsBulkDeleteModalOpen(true) : undefined}
        renderBulkActions={(keys, clearSel) => (
          <>
            <button
              type="button"
              onClick={async () => {
                const results = await Promise.allSettled(
                  keys.map((id) =>
                    fetchApi(`/characteristics/${id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ isRequired: true }),
                    }),
                  ),
                );
                const failed = results.filter((r) => r.status === 'rejected').length;
                clearSel();
                await loadData();
                if (failed > 0) {
                  showToast('error', `${failed} mise(s) à jour ont échoué.`);
                } else {
                  showToast('success', `${keys.length} caractéristique(s) marquée(s) obligatoires.`);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 cursor-pointer"
            >
              Requis : Oui
            </button>
            <button
              type="button"
              onClick={async () => {
                const results = await Promise.allSettled(
                  keys.map((id) =>
                    fetchApi(`/characteristics/${id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ isRequired: false }),
                    }),
                  ),
                );
                const failed = results.filter((r) => r.status === 'rejected').length;
                clearSel();
                await loadData();
                if (failed > 0) {
                  showToast('error', `${failed} mise(s) à jour ont échoué.`);
                } else {
                  showToast('success', `${keys.length} caractéristique(s) marquée(s) optionnelles.`);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
            >
              Optionnel
            </button>
            <button
              type="button"
              onClick={async () => {
                const results = await Promise.allSettled(
                  keys.map((id) =>
                    fetchApi(`/characteristics/${id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ isFilterable: true }),
                    }),
                  ),
                );
                const failed = results.filter((r) => r.status === 'rejected').length;
                clearSel();
                await loadData();
                if (failed > 0) {
                  showToast('error', `${failed} mise(s) à jour ont échoué.`);
                } else {
                  showToast('success', `${keys.length} caractéristique(s) activée(s) en filtre.`);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 cursor-pointer"
            >
              Filtre : Actif
            </button>
            <select
              aria-label="Changer type en masse"
              defaultValue=""
              onChange={async (e) => {
                const typeVal = e.target.value;
                if (!typeVal) return;
                const results = await Promise.allSettled(
                  keys.map((id) =>
                    fetchApi(`/characteristics/${id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ type: typeVal }),
                    }),
                  ),
                );
                const failed = results.filter((r) => r.status === 'rejected').length;
                clearSel();
                await loadData();
                if (failed > 0) {
                  showToast('error', `${failed} changement(s) de type ont échoué.`);
                } else {
                  showToast('success', `Type mis à jour vers ${typeVal} sur ${keys.length} caractéristique(s).`);
                }
                e.target.value = '';
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E6D6A6] text-xs font-bold text-[#1D232E] cursor-pointer"
            >
              <option value="">Changer type...</option>
              <option value="TEXT">Texte Libre</option>
              <option value="NUMBER">Nombre / Numérique</option>
              <option value="BOOLEAN">Booléen (Oui / Non)</option>
              <option value="SELECT">Liste Déroulante</option>
              <option value="MULTI_SELECT">Multi-sélection</option>
              <option value="DATE">Date</option>
            </select>
          </>
        )}
        printTitle="Référentiel des Caractéristiques Techniques — Royal"
        exportFileName="caractéristiques"
        /* Mode Matrix (Grid Cards) */
        renderMatrixCard={(item, isChecked, onToggleCheck) => (
          <div className={cn(
            'bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group',
            isChecked ? 'border-[var(--royal-primary)] ring-2 ring-[var(--royal-primary)]/30 bg-[#FBF9F4]' : 'border-neutral-200'
          )}>
            <div className="p-4 sm:p-5 space-y-3.5 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onToggleCheck}
                    aria-label={`Sélectionner ${item.name}`}
                    className="text-neutral-400 hover:text-[var(--royal-primary)] shrink-0 cursor-pointer"
                  >
                    {isChecked ? <CheckSquare className="w-4 h-4 text-[var(--royal-primary)]" /> : <Square className="w-4 h-4" />}
                  </button>
                  <div className="relative w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 text-neutral-800 overflow-hidden">
                    {item.iconUrl ? (
                      <Image src={item.iconUrl} alt={item.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-black text-xs">
                        {getInitials(item.name)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <Badge variant={item.isRequired ? 'danger' : 'neutral'} size="sm">
                    {item.isRequired ? 'Requis' : 'Optionnel'}
                  </Badge>
                  <Badge variant={item.isFilterable ? 'success' : 'neutral'} size="sm">
                    {item.isFilterable ? 'Filtre Actif' : 'Non filtrable'}
                  </Badge>
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-neutral-900 text-sm break-words">{item.name}</h3>
                <span className="text-xs text-neutral-500 mt-1 block">
                  {getTypeInfo(item.type).label} {item.unit && `(${item.unit})`}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-neutral-400">Articles liés :</span>
                <button
                  type="button"
                  onClick={() => {
                    setArticlesModalItem(item);
                    setModalArticlesPage(1);
                  }}
                  className="font-bold text-neutral-900 hover:underline cursor-pointer"
                >
                  {item.articlesCount || 0} articles
                </button>
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
              <div className="relative w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 text-neutral-800 overflow-hidden">
                {item.iconUrl ? (
                  <Image src={item.iconUrl} alt={item.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-black text-xs">
                    {getInitials(item.name)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-neutral-900 text-xs truncate">{item.name}</div>
                <div className="text-[11px] text-neutral-400 truncate max-w-md">
                  {getTypeInfo(item.type).label} {item.unit && `• ${item.unit}`}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setArticlesModalItem(item);
                  setModalArticlesPage(1);
                }}
                className="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
              >
                {item.articlesCount || 0} articles
              </button>
              {renderActions(item)}
            </div>
          </div>
        )}
      />

      {/* MODAL 1: CONSULTATION DES CATÉGORIES LIÉES */}
      <Modal
        isOpen={!!categoriesModalItem}
        onClose={() => setCategoriesModalItem(null)}
        title={categoriesModalItem ? `Catégories Liées : ${categoriesModalItem.name}` : ''}
        subtitle={`${categoriesModalItem?.categoryIds.length || 0} rayon(s) associé(s)`}
        type="custom"
        size="md"
        footer={
          <div className="flex justify-end w-full">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCategoriesModalItem(null)}
              className="text-xs py-1.5 px-4"
            >
              Fermer
            </Button>
          </div>
        }
      >
        {categoriesModalItem && (
          <div className="p-6 space-y-4">
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700">
              Cette caractéristique technique est demandée lors de la création d'articles dans les rayons suivants :
            </div>

            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden bg-white max-h-80 overflow-y-auto">
              {categoriesModalItem.categoryIds.map((catId) => {
                const cat = categories.find((c) => c.id === catId);
                return (
                  <div key={catId} className="p-3 flex items-center justify-between hover:bg-neutral-50 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-neutral-500" />
                      <span className="font-bold text-neutral-900">{cat ? cat.name : catId}</span>
                    </div>
                    <span className="font-mono text-neutral-400 text-[11px]">/{cat?.slug || catId}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: ARTICLES UTILISANT CETTE CARACTÉRISTIQUE (REUSABLE WIDE MODAL) */}
      <RelatedArticlesModal
        isOpen={!!articlesModalItem}
        onClose={() => setArticlesModalItem(null)}
        title={articlesModalItem ? `Articles avec "${articlesModalItem.name}"` : ''}
        subtitle="Articles au catalogue renseignant cet attribut technique"
        articles={
          articlesModalItem
            ? products.filter(
                (p: any) =>
                  p.dimensionsJson &&
                  p.dimensionsJson[articlesModalItem.code] !== undefined &&
                  String(p.dimensionsJson[articlesModalItem.code]).trim() !== ''
              )
            : []
        }
      />

      {/* MODAL 3: CRÉATION / MODIFICATION CARACTÉRISTIQUE */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Modifier : ${editingItem.name}` : 'Nouvelle Caractéristique Technique'}
        subtitle="Définissez l'intitulé, l'icône, le format de données et les rayons associés"
        type="custom"
        size="4xl"
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
              onClick={handleSave}
              className="text-xs py-2 px-5"
            >
              {editingItem ? 'Enregistrer les modifications' : 'Créer la caractéristique'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="p-6 pb-24 space-y-5 text-xs">
          {/* Icon upload / URL for characteristic */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Icône de la Caractéristique (Glisser-déposer ou URL)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingIcon(true);
              }}
              onDragLeave={() => setIsDraggingIcon(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingIcon(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  void handleUploadCharIcon(file);
                }
              }}
              className={cn(
                'p-3.5 rounded-xl border-2 border-dashed flex items-center justify-between gap-4 transition-all',
                isDraggingIcon
                  ? 'border-neutral-900 bg-neutral-100'
                  : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
                  {formIconUrl ? (
                    <Image src={formIconUrl} alt="Preview" width={40} height={40} className="object-cover" unoptimized />
                  ) : (
                    <div className="font-bold text-xs text-neutral-400">
                      {formName ? getInitials(formName) : <Sliders className="w-4 h-4 text-neutral-300" />}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-800">
                    Glissez-déposez une icône SVG/PNG ici
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Ou collez une URL ci-dessous
                  </p>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  ref={iconFileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleUploadCharIcon(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => iconFileInputRef.current?.click()}
                  className="text-xs py-1 px-3"
                >
                  Parcourir...
                </Button>
              </div>
            </div>

            <div className="mt-2">
              <Input
                placeholder="https://... (URL directe de l'icône)"
                value={formIconUrl}
                onChange={(e) => setFormIconUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom de la Caractéristique (FR) *"
              placeholder="ex: Puissance Moteur"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <Input
              label="Intitulé en Arabe (Optionnel)"
              placeholder="ex: قوة المحرك"
              value={formNameAr}
              onChange={(e) => setFormNameAr(e.target.value)}
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Type de Donnée Requis *"
              value={formType}
              onChange={(e) => {
                setFormType(e.target.value as CharacteristicType);
                if (e.target.value !== 'NUMBER') {
                  setFormUnit('');
                  setFormCustomUnit('');
                }
              }}
              options={[
                { label: 'Nombre / Numérique (Unités configurables)', value: 'NUMBER' },
                { label: 'Texte Libre (Court ou Long)', value: 'TEXT' },
                { label: 'Date Simple (Date Picker)', value: 'DATE' },
                { label: 'Période Date (Début — Fin)', value: 'DATE_RANGE' },
                { label: 'Booléen (Oui / Non)', value: 'BOOLEAN' },
                { label: 'Liste Déroulante (Choix unique)', value: 'SELECT' },
                { label: 'Multi-sélection (Choix multiples)', value: 'MULTI_SELECT' },
              ]}
            />

            {/* Units only for NUMBER type */}
            {formType === 'NUMBER' ? (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Unité de Mesure Applicable
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formUnit}
                    onChange={(e) => {
                      setFormUnit(e.target.value);
                      if (e.target.value !== 'CUSTOM') setFormCustomUnit('');
                    }}
                    className="w-full py-2 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-950"
                  >
                    <option value="">Sans unité</option>
                    {UNIT_PRESETS.map((group) => (
                      <optgroup key={group.category} label={group.category}>
                        {group.units.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="CUSTOM">Autre unité personnalisée...</option>
                  </select>

                  {formUnit === 'CUSTOM' ? (
                    <Input
                      placeholder="ex: RPM, N.m"
                      value={formCustomUnit}
                      onChange={(e) => setFormCustomUnit(e.target.value)}
                    />
                  ) : (
                    <div className="p-2 text-center bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-500 font-mono font-bold text-xs flex items-center justify-center">
                      {formUnit || 'Aucune'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-2 text-neutral-500 text-xs">
                <Info className="w-4 h-4 shrink-0 text-neutral-400" />
                <span>Les unités de mesure sont réservées aux types numériques.</span>
              </div>
            )}
          </div>

          {/* Options for SELECT / MULTI_SELECT */}
          {['SELECT', 'MULTI_SELECT'].includes(formType) && (
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
              <span className="font-bold text-neutral-900 block text-xs">
                Valeurs Possibles du Menu
              </span>
              <div className="flex gap-2">
                <Input
                  placeholder="ex: Inox 18/10"
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddOption} className="shrink-0 text-xs">
                  Ajouter
                </Button>
              </div>

              {formOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formOptions.map((opt, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-neutral-900 shadow-2xs"
                    >
                      <span>{opt}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(i)}
                        className="text-neutral-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories Scope */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <span className="font-bold text-neutral-900 block text-xs">
              Périmètre des Rayons & Catégories Liés
            </span>
            <div className="flex gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="categoryScope"
                  checked={formCategoryScope === 'ALL'}
                  onChange={() => setFormCategoryScope('ALL')}
                  className="accent-neutral-950"
                />
                <span>Global à tous les rayons du catalogue</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="categoryScope"
                  checked={formCategoryScope === 'SPECIFIC'}
                  onChange={() => setFormCategoryScope('SPECIFIC')}
                  className="accent-neutral-950"
                />
                <span>Rayons spécifiques sélectionnés</span>
              </label>
            </div>

            {formCategoryScope === 'SPECIFIC' && (
              <div className="pt-2">
                <MultiSelect
                  label="Sélectionnez les Rayons Concernés"
                  placeholder="Rechercher et sélectionner des rayons..."
                  values={formSelectedCategoryIds}
                  onChange={setFormSelectedCategoryIds}
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                    description: `/${cat.slug}`,
                  }))}
                />
              </div>
            )}
          </div>

          {/* Flags: Required & Filterable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-900 block text-xs">Champ Obligatoire</span>
                <span className="text-[11px] text-neutral-500">Exigé lors de la saisie d'article</span>
              </div>
              <button
                type="button"
                onClick={() => setFormIsRequired(!formIsRequired)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                  formIsRequired ? 'bg-[var(--royal-primary)]' : 'bg-neutral-300'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transition-transform shadow-xs absolute top-0.5',
                    formIsRequired ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-900 block text-xs">Filtre Catalogue</span>
                <span className="text-[11px] text-neutral-500">Actif dans la recherche storefront</span>
              </div>
              <button
                type="button"
                onClick={() => setFormIsFilterable(!formIsFilterable)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                  formIsFilterable ? 'bg-[var(--royal-primary)]' : 'bg-neutral-300'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transition-transform shadow-xs absolute top-0.5',
                    formIsFilterable ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CONFIRMATION SUPPRESSION */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer la Caractéristique"
        message={
          itemToDelete
            ? `Êtes-vous certain de vouloir supprimer la caractéristique "${itemToDelete.name}" ? Les articles existants conservent leurs données historiques.`
            : ''
        }
      />

      {/* MODAL 5: CONFIRMATION SUPPRESSION GROUPÉE */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Suppression Groupée des Caractéristiques"
        description={`Êtes-vous certain de vouloir supprimer les ${selectedCharIds.length} caractéristique(s) sélectionnée(s) ?`}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
}
