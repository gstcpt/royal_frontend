'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Package,
  FolderTree,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Folder,
  FolderOpen,
  ArrowUpDown,
  Sparkles,
  Info,
  Check,
  X,
  UploadCloud,
  Lock,
  Unlock,
  Globe,
  Boxes,
  Calendar,
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
import { fetchApi } from '@/lib/api';

export interface CategoryItem {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  children?: CategoryItem[];
  showinmenu?: boolean;
  isActive?: boolean;
  productCount?: number;
  characteristicsCount?: number;

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
  category?: { id: string; name: string };
  brand?: { name: string };
  dimensionsJson?: Record<string, any>;
}

export default function DashboardCategoriesPage() {
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>([]);
  const [isTreeViewActive, setIsTreeViewActive] = React.useState(false);
  const [expandedParents, setExpandedParents] = React.useState<Record<string, boolean>>({});

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<CategoryItem | null>(null);
  const [descriptionModalCategory, setDescriptionModalCategory] = React.useState<CategoryItem | null>(null);
  const [articlesModalCategory, setArticlesModalCategory] = React.useState<CategoryItem | null>(null);
  const [articlesModalPage, setArticlesModalPage] = React.useState(1);
  const [articlesModalSearch, setArticlesModalSearch] = React.useState('');
  const [characteristicsModalCategory, setCharacteristicsModalCategory] = React.useState<CategoryItem | null>(null);

  // Toast feedback
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formName, setFormName] = React.useState('');
  const [formNameAr, setFormNameAr] = React.useState('');
  const [formSlug, setFormSlug] = React.useState('');
  const [formParentId, setFormParentId] = React.useState<string>('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formImageUrl, setFormImageUrl] = React.useState('');
  const [formShowInMenu, setFormShowInMenu] = React.useState(true);
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [isAutoSlug, setIsAutoSlug] = React.useState(true);
  const [isDragging, setIsDragging] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Initial demo data fallback
  const defaultDemoCategories: CategoryItem[] = [
    {
      id: 'cat-gros-electro',
      name: 'Gros Électroménager',
      nameAr: 'الأجهزة الكهرومنزلية الكبيرة',
      slug: 'gros-electromenager',
      description: 'Cuisinières, fours encastrables, réfrigérateurs et lave-linges professionnels.',
      imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400&auto=format&fit=crop',
      parentId: null,
      showinmenu: true,
      isActive: true,
      productCount: 42,
      characteristicsCount: 8,
      createdAt: '2026-11-15T09:00:00.000Z',
      updatedAt: '2026-11-15T09:00:00.000Z',
      createdBy: 'SUPER_ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'cat-petit-electro',
      name: 'Petit Électroménager',
      nameAr: 'الأجهزة الكهرومنزلية الصغيرة',
      slug: 'petit-electromenager',
      description: 'Airfryers double tiroir, robots culinaires, cafetières espresso et hachoirs.',
      imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?q=80&w=400&auto=format&fit=crop',
      parentId: null,
      showinmenu: true,
      isActive: true,
      productCount: 68,
      characteristicsCount: 9,
      createdAt: '2026-11-14T11:30:00.000Z',
      updatedAt: '2026-11-14T11:30:00.000Z',
      createdBy: 'SUPER_ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'cat-cuisine-prepa',
      name: 'Cuisine & Préparation',
      nameAr: 'الطبخ والتحضير',
      slug: 'cuisine-et-preparation',
      description: 'Batteries granit antiadhésif, faitouts inox 18/10 et plats céramique.',
      imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=400&auto=format&fit=crop',
      parentId: null,
      showinmenu: true,
      isActive: true,
      productCount: 35,
      characteristicsCount: 6,
      createdAt: '2026-11-11T14:15:00.000Z',
      updatedAt: '2026-11-11T14:15:00.000Z',
      createdBy: 'ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'cat-art-table',
      name: 'Art de la Table',
      nameAr: 'فن السفرة والتقديم',
      slug: 'art-de-la-table',
      description: 'Services d’assiettes porcelaine, ménagères forgées et carafes cristal.',
      imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=400&auto=format&fit=crop',
      parentId: null,
      showinmenu: true,
      isActive: true,
      productCount: 29,
      characteristicsCount: 5,
      createdAt: '2026-11-05T10:00:00.000Z',
      updatedAt: '2026-11-05T10:00:00.000Z',
      createdBy: 'ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'cat-coutellerie',
      name: 'Coutellerie Haute Précision',
      nameAr: 'السكاكين والأدوات الحادة',
      slug: 'coutellerie-haute-precision',
      description: 'Couteaux de chef japonais, fusils d’affûtage et blocs bois massif.',
      imageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=400&auto=format&fit=crop',
      parentId: null,
      showinmenu: true,
      isActive: true,
      productCount: 19,
      characteristicsCount: 7,
      createdAt: '2026-10-28T16:20:00.000Z',
      updatedAt: '2026-10-28T16:20:00.000Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'cat-maison',
      name: 'Maison & Entretien',
      nameAr: 'المنزل والعناية',
      slug: 'maison-et-entretien',
      description: 'Aspirateurs traîneaux multicyloniques et centrales vapeur haute pression.',
      imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=400&auto=format&fit=crop',
      parentId: null,
      showinmenu: true,
      isActive: true,
      productCount: 24,
      characteristicsCount: 6,
      createdAt: '2026-10-15T08:45:00.000Z',
      updatedAt: '2026-10-15T08:45:00.000Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'cat-fours',
      name: 'Fours & Encastrables',
      nameAr: 'أفران مدمجة',
      slug: 'fours-et-encastrables',
      description: 'Fours pyrolyse 70L et tables de cuisson vitrocéramiques.',
      imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400&auto=format&fit=crop',
      parentId: 'cat-gros-electro',
      showinmenu: true,
      isActive: true,
      productCount: 15,
      characteristicsCount: 8,
      createdAt: '2026-09-20T12:00:00.000Z',
      updatedAt: '2026-09-20T12:00:00.000Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
  ];

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const getInitials = (text: string) => {
    if (!text) return 'FL';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const getDescendantCategoryIds = React.useCallback(
    (rootId: string): Set<string> => {
      const ids = new Set<string>([rootId]);
      let added = true;
      while (added) {
        added = false;
        for (const c of categories) {
          if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
            ids.add(c.id);
            added = true;
          }
        }
      }
      return ids;
    },
    [categories]
  );

  const getCategoryProductCount = (category: CategoryItem) => {
    const validIds = getDescendantCategoryIds(category.id);
    const matched = products.filter(
      (p) =>
        (p.category?.id && validIds.has(p.category.id)) ||
        ((p as any).categoryId && validIds.has((p as any).categoryId))
    );
    if (matched.length > 0) return matched.length;
    return Number((category as any).productsCount ?? category.productCount ?? 0);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (isAutoSlug) {
      setFormSlug(slugify(val));
    }
  };

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetchApi('/categories?tree=false').catch(() => null),
        fetchApi('/products?limit=1000').catch(() => null),
      ]);

      if (catRes) {
        const list = Array.isArray(catRes) ? catRes : catRes.data || [];
        setCategories(list);
      } else {
        setCategories(defaultDemoCategories);
      }

      if (prodRes) {
        const list = Array.isArray(prodRes) ? prodRes : prodRes.data || [];
        setProducts(list);
      }
    } catch {
      setCategories(defaultDemoCategories);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle category visibility instantly
  const handleToggleVisibility = async (cat: CategoryItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = !cat.isActive;

    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: next } : c))
    );

    try {
      await fetchApi(`/categories/${cat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      });

      showToast(
        'success',
        `Le rayon "${cat.name}" est maintenant ${next ? 'en ligne' : 'masqué de la boutique'}.`
      );
    } catch (err: any) {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c))
      );
      showToast('error', err?.message || `Impossible de modifier "${cat.name}".`);
    }
  };

  // Open modal handlers
  const openNewModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormNameAr('');
    setFormSlug('');
    setFormParentId('');
    setFormDescription('');
    setFormImageUrl('');
    setFormShowInMenu(true);
    setFormIsActive(true);
    setIsAutoSlug(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormNameAr(cat.nameAr || '');
    setFormSlug(cat.slug);
    setFormParentId(cat.parentId || '');
    setFormDescription(cat.description || '');
    setFormImageUrl(cat.imageUrl || '');
    setFormShowInMenu(cat.showinmenu !== false);
    setFormIsActive(cat.isActive !== false);
    setIsAutoSlug(false);
    setIsModalOpen(true);
  };

  // Drag & drop image upload
  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit form
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('error', 'Le nom du rayon est obligatoire.');
      return;
    }

    const payload: Record<string, any> = {
      name: formName.trim(),
      slug: formSlug.trim() || slugify(formName),
      showinmenu: formShowInMenu,
      isActive: formIsActive,
    };
    if (formNameAr.trim()) payload.nameAr = formNameAr.trim();
    if (formParentId) payload.parentId = formParentId;
    if (formDescription.trim()) payload.description = formDescription.trim();
    if (formImageUrl.trim()) payload.imageUrl = formImageUrl.trim();

    try {
      if (editingCategory) {
        await fetchApi(`/categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', `Le rayon "${payload.name}" a été mis à jour.`);
      } else {
        await fetchApi('/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', `Le rayon "${payload.name}" a été créé avec succès.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('error', err?.message || "Une erreur est survenue lors de l'enregistrement.");
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await fetchApi(`/categories/${categoryToDelete.id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      showToast('success', `Le rayon "${categoryToDelete.name}" a été supprimé.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Impossible de supprimer ce rayon.');
    } finally {
      setCategoryToDelete(null);
    }
  };

  // Filter products for the active category (including descendant categories)
  const articlesForCategory = React.useMemo(() => {
    if (!articlesModalCategory) return [];
    const validIds = getDescendantCategoryIds(articlesModalCategory.id);
    return products.filter(
      (p) =>
        (p.category?.id && validIds.has(p.category.id)) ||
        ((p as any).categoryId && validIds.has((p as any).categoryId)) ||
        (p.category?.name && p.category.name.toLowerCase() === articlesModalCategory.name.toLowerCase())
    );
  }, [articlesModalCategory, products, getDescendantCategoryIds]);

  // Reusable Actions Renderer
  const renderActions = (item: CategoryItem) => (
    <div className="flex items-center justify-end gap-1.5 no-print">
      {/* 1. Open on storefront (Info Blue) */}
      <Link
        href={`/articles?category=${encodeURIComponent(item.slug)}`}
        prefetch={false}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition shadow-2xs"
        title="Voir le rayon sur la boutique"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>

      {/* 2. Toggle visibility (Green eye / Grey eye-off) */}
      <button
        type="button"
        onClick={(e) => handleToggleVisibility(item, e)}
        className={cn(
          'p-1.5 rounded-lg border transition shadow-2xs cursor-pointer',
          item.isActive !== false
            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'
        )}
        title={item.isActive !== false ? 'En ligne (cliquez pour masquer)' : 'Masqué (cliquez pour publier)'}
      >
        {item.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>

      {/* 3. Edit (Amber) */}
      <button
        type="button"
        onClick={() => openEditModal(item)}
        className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition shadow-2xs cursor-pointer"
        title="Modifier le rayon"
      >
        <Edit className="w-3.5 h-3.5" />
      </button>

      {/* 4. Delete (Rose) */}
      <button
        type="button"
        onClick={() => setCategoryToDelete(item)}
        className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition shadow-2xs cursor-pointer"
        title="Supprimer le rayon"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  // Table Columns Definition
  const columns: ColumnDef<CategoryItem>[] = [
    {
      key: 'name',
      header: 'Rayon / Catégorie',
      sortable: true,
      sortValue: (c) => c.name,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-black text-xs">
                {getInitials(item.name)}
              </div>
            )}
          </div>
          <div>
            <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
              <span>{item.name}</span>
              {item.nameAr && (
                <span className="text-[10px] text-neutral-400 font-arabic" dir="rtl">
                  {item.nameAr}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
              <span className="font-mono">/{item.slug}</span>
              {item.parentId && (
                <>
                  <span>•</span>
                  <span className="text-neutral-600">
                    Parent: {categories.find((p) => p.id === item.parentId)?.name || 'Rayon principal'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
      printRender: (item) => (
        <div className="flex items-center gap-2">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="w-8 h-8 rounded object-cover border border-neutral-300" />
          ) : (
            <div className="w-8 h-8 rounded bg-neutral-100 border border-neutral-300 flex items-center justify-center text-[9px] font-bold text-neutral-700">
              {getInitials(item.name)}
            </div>
          )}
          <div>
            <div className="font-bold text-neutral-900">{item.name}</div>
            <div className="text-[10px] text-neutral-500">/{item.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description & Vocation',
      render: (item) => {
        const text = item.description || 'Rayon officiel du catalogue.';
        const isLong = text.length > 90;
        const truncated = isLong ? `${text.slice(0, 90)}...` : text;

        return (
          <div className="text-xs text-neutral-600 max-w-sm">
            <span>{truncated}</span>
            {isLong && (
              <button
                type="button"
                onClick={() => setDescriptionModalCategory(item)}
                className="ml-1.5 font-bold text-neutral-900 underline hover:text-black cursor-pointer inline-flex items-center gap-0.5 text-[11px]"
              >
                <span>Voir plus</span>
              </button>
            )}
          </div>
        );
      },
      printRender: (item) => item.description || 'Rayon officiel du catalogue.',
    },
    {
      key: 'characteristicsCount',
      header: 'Caractéristiques',
      sortable: true,
      sortValue: (c) => Number(c.characteristicsCount || 0),
      className: 'text-center',
      render: (item) => (
        <button
          type="button"
          onClick={() => setCharacteristicsModalCategory(item)}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition cursor-pointer group"
          title="Consulter les caractéristiques techniques du rayon"
        >
          <Sliders className="w-3 h-3 text-neutral-500 group-hover:scale-110 transition-transform" />
          <span>{item.characteristicsCount ?? 6} attributs</span>
        </button>
      ),
      printRender: (item) => `${item.characteristicsCount ?? 6} attributs`,
    },
    {
      key: 'productCount',
      header: 'Articles Référencés',
      sortable: true,
      sortValue: (c) => Number(getCategoryProductCount(c)),
      className: 'text-center',
      render: (item) => {
        const count = getCategoryProductCount(item);
        return (
          <button
            type="button"
            onClick={() => {
              setArticlesModalCategory(item);
              setArticlesModalPage(1);
            }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition cursor-pointer group"
            title="Consulter les articles de ce rayon"
          >
            <Package className="w-3 h-3 text-neutral-500 group-hover:scale-110 transition-transform" />
            <span>{count} article{count > 1 ? 's' : ''}</span>
          </button>
        );
      },
      printRender: (item) => `${getCategoryProductCount(item)} article(s)`,
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
            Rayons & Catégories
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Organisation arborescente du catalogue, rayons parents, sous-catégories et assignation des caractéristiques.
          </p>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Catalogue Commercial', href: '/dashboard/articles' },
              { label: 'Rayons & Catégories' },
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
            Nouveau Rayon
          </Button>
        </div>
      </div>

      {/* 2. KPI Stats Cards (Second under Header) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Catégories
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {categories.length}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Rayons & sous-familles</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Rayons Principaux
            </span>
            <span className="text-2xl font-black text-purple-600 mt-1 block">
              {categories.filter((c) => !c.parentId).length}
            </span>
            <span className="text-[11px] text-purple-600 font-medium mt-0.5 block">Niveau 1 racine</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <FolderTree className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Articles Référencés
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {products.length}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Total inventaire</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Visibilité Storefront
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {categories.filter((c) => c.isActive !== false).length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">En ligne au menu</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main DataTable (Third with All Display Modes Integrated) */}
      <DataTable<CategoryItem>
        data={categories}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher par nom, slug, descriptif..."
        searchKeys={['name', 'slug', 'description']}
        statusOptions={[
          { label: 'Tous les statuts', value: '' },
          { label: 'En ligne (Actives)', value: 'ACTIVE' },
          { label: 'Masquées (Inactives)', value: 'INACTIVE' },
        ]}
        supportedModes={['table', 'list', 'matrix', 'tree']}
        defaultMode="table"
        isLoading={isLoading}
        onRefresh={loadData}
        enableMultiSelect={true}
        selectedKeys={selectedCategoryIds}
        onSelectionChange={setSelectedCategoryIds}
        printTitle="Référentiel des Rayons et Catégories — Royal"
        exportFileName="catégories"
        /* Mode Matrix (Grid Cards) */
        renderMatrixCard={(item) => (
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-black text-sm">
                      {getInitials(item.name)}
                    </div>
                  )}
                </div>
                <Badge variant={item.isActive !== false ? 'success' : 'neutral'} size="sm">
                  {item.isActive !== false ? 'Actif' : 'Masqué'}
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-neutral-900 text-sm">{item.name}</h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {item.description || 'Rayon du catalogue.'}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Articles liés :</span>
                <button
                  type="button"
                  onClick={() => {
                    setArticlesModalCategory(item);
                    setArticlesModalPage(1);
                  }}
                  className="font-bold text-neutral-900 hover:underline"
                >
                  {getCategoryProductCount(item)} article(s)
                </button>
              </div>
            </div>

            <div className="p-3 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400">/{item.slug}</span>
              {renderActions(item)}
            </div>
          </div>
        )}
        /* Mode List (No Black Line) */
        renderListItem={(item, isSelected, onSelect) => (
          <div
            onClick={onSelect}
            className={`p-3.5 flex items-center justify-between gap-4 transition-all ${
              isSelected ? 'bg-neutral-100/70' : 'hover:bg-neutral-50/60'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-black text-xs">
                    {getInitials(item.name)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-neutral-900 text-xs truncate">{item.name}</div>
                <div className="text-[11px] text-neutral-400 truncate max-w-md">
                  {item.description || `/${item.slug}`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setArticlesModalCategory(item);
                  setArticlesModalPage(1);
                }}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
              >
                {getCategoryProductCount(item)} articles
              </button>
              {renderActions(item)}
            </div>
          </div>
        )}
        /* Mode Split: Detailed Category Panel */
        renderSplitDetail={(cat) => {
          if (!cat) return null;
          const parentCat = categories.find((c) => c.id === cat.parentId);
          const childCats = categories.filter((c) => c.parentId === cat.id);
          const count = getCategoryProductCount(cat);

          return (
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200 shadow-sm">
                    {cat.imageUrl ? (
                      <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-black text-lg">
                        {getInitials(cat.name)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">{cat.name}</h3>
                    {cat.nameAr && (
                      <div className="text-xs text-neutral-400 font-arabic mt-0.5" dir="rtl">
                        {cat.nameAr}
                      </div>
                    )}
                    <div className="text-xs font-mono text-neutral-500 mt-1">/{cat.slug}</div>
                  </div>
                </div>

                <Badge variant={cat.isActive !== false ? 'success' : 'neutral'}>
                  {cat.isActive !== false ? 'En ligne' : 'Masqué'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Niveau Rayon</span>
                  <span className="font-bold text-neutral-900 mt-1 block">
                    {parentCat ? `Sous-rayon de ${parentCat.name}` : 'Rayon Racine Principal'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Articles Enregistrés</span>
                  <span className="font-bold text-neutral-900 mt-1 block">
                    {count} articles
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Description & Vocation</h4>
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs text-neutral-600 leading-relaxed">
                  {cat.description || 'Aucune description rédigée pour ce rayon.'}
                </div>
              </div>

              {childCats.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Sous-catégories rattachées ({childCats.length})
                  </h4>
                  <div className="space-y-1.5">
                    {childCats.map((sub) => (
                      <div key={sub.id} className="p-2.5 rounded-lg bg-white border border-neutral-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800">{sub.name}</span>
                        <span className="text-neutral-400 font-mono text-[11px]">/{sub.slug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
                {renderActions(cat)}
              </div>
            </div>
          );
        }}
        /* Mode Tree: Hierarchical View Integrated directly in Display Switcher */
        renderTreeMode={() => (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-neutral-800" />
                <h3 className="font-heading font-black text-sm text-neutral-900">
                  Arborescence Hiérarchique des Rayons
                </h3>
              </div>
              <span className="text-xs text-neutral-400">
                {categories.filter((c) => !c.parentId).length} rayons principaux
              </span>
            </div>

            <div className="space-y-2">
              {categories
                .filter((c) => !c.parentId)
                .map((parent) => {
                  const subCats = categories.filter((c) => c.parentId === parent.id);
                  const isExpanded = expandedParents[parent.id] !== false;

                  return (
                    <div key={parent.id} className="border border-neutral-200 rounded-xl overflow-hidden">
                      <div
                        onClick={() =>
                          setExpandedParents((prev) => ({
                            ...prev,
                            [parent.id]: !isExpanded,
                          }))
                        }
                        className="p-3 bg-neutral-50 hover:bg-neutral-100/70 flex items-center justify-between cursor-pointer transition select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          {subCats.length > 0 ? (
                            <ChevronRight
                              className={cn(
                                'w-4 h-4 text-neutral-500 transition-transform',
                                isExpanded && 'rotate-90'
                              )}
                            />
                          ) : (
                            <Folder className="w-4 h-4 text-neutral-400 ml-1" />
                          )}
                          <span className="font-bold text-xs text-neutral-900">{parent.name}</span>
                          <span className="text-[11px] font-mono text-neutral-400">/{parent.slug}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-neutral-500 font-semibold">
                            {getCategoryProductCount(parent)} articles
                          </span>
                          {renderActions(parent)}
                        </div>
                      </div>

                      {isExpanded && subCats.length > 0 && (
                        <div className="divide-y divide-neutral-100 bg-white pl-8">
                          {subCats.map((sub) => (
                            <div key={sub.id} className="p-2.5 pr-4 flex items-center justify-between hover:bg-neutral-50/70">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-300 font-mono text-xs">└─</span>
                                <span className="text-xs font-semibold text-neutral-800">{sub.name}</span>
                                <span className="text-[11px] font-mono text-neutral-400">/{sub.slug}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-neutral-500">
                                  {getCategoryProductCount(sub)} articles
                                </span>
                                {renderActions(sub)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      />

      {/* MODAL 1: CONSULTATION DESCRIPTION */}
      <Modal
        isOpen={!!descriptionModalCategory}
        onClose={() => setDescriptionModalCategory(null)}
        title={descriptionModalCategory ? `Rayon : ${descriptionModalCategory.name}` : ''}
        subtitle="Vocation et présentation du rayon sur la boutique"
        type="custom"
        size="md"
        footer={
          <div className="flex justify-end w-full">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setDescriptionModalCategory(null)}
              className="text-xs py-1.5 px-4"
            >
              Fermer
            </Button>
          </div>
        }
      >
        {descriptionModalCategory && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="relative w-12 h-12 rounded-xl bg-white border border-neutral-200 overflow-hidden shrink-0">
                {descriptionModalCategory.imageUrl ? (
                  <Image src={descriptionModalCategory.imageUrl} alt={descriptionModalCategory.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Layers className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">{descriptionModalCategory.name}</h4>
                <span className="text-xs text-neutral-400 font-mono">/{descriptionModalCategory.slug}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
              {descriptionModalCategory.description || 'Aucune description disponible pour ce rayon.'}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: ARTICLES DU RAYON (REUSABLE WIDE MODAL) */}
      <RelatedArticlesModal
        isOpen={!!articlesModalCategory}
        onClose={() => setArticlesModalCategory(null)}
        title={articlesModalCategory ? `Articles dans "${articlesModalCategory.name}"` : ''}
        subtitle={`${articlesForCategory.length} article(s) référencé(s) dans ce rayon`}
        articles={articlesForCategory}
      />

      {/* MODAL 3: CARACTÉRISTIQUES LIÉES AU RAYON (STANDARDIZED TABLE) */}
      <Modal
        isOpen={!!characteristicsModalCategory}
        onClose={() => setCharacteristicsModalCategory(null)}
        title={characteristicsModalCategory ? `Caractéristiques : ${characteristicsModalCategory.name}` : ''}
        subtitle="Spécifications techniques requises pour ce rayon"
        type="custom"
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCharacteristicsModalCategory(null)}
              className="text-xs py-1.5 px-4 cursor-pointer"
            >
              Fermer
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-500">
            Les articles de ce rayon doivent renseigner les spécifications techniques suivantes :
          </p>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Caractéristique Technique</th>
                  <th className="py-2.5 px-3">Type de Donnée</th>
                  <th className="py-2.5 px-3">Unité / Format</th>
                  <th className="py-2.5 px-3 text-center">Obligatoire</th>
                  <th className="py-2.5 px-3 text-center">Filtre Catalogue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {[
                  { name: 'Puissance Moteur / Chauffante', code: 'puissance_w', type: 'Nombre', unit: 'Watts (W)', req: true, filter: true },
                  { name: 'Matériau Principal & Finition', code: 'materiau_principal', type: 'Liste déroulante', unit: 'Inox / Verre / Céramique', req: true, filter: true },
                  { name: 'Capacité & Volume Réservoir', code: 'capacite_vol', type: 'Nombre', unit: 'Litres (L)', req: false, filter: true },
                  { name: 'Garantie Constructeur', code: 'garantie_constructeur', type: 'Nombre', unit: 'Années', req: true, filter: false },
                  { name: 'Niveau Sonore Décibels', code: 'niveau_sonore', type: 'Nombre', unit: 'dB', req: false, filter: true },
                  { name: 'Classe Énergétique', code: 'classe_energie', type: 'Liste déroulante', unit: 'A+++ / A++ / A', req: true, filter: true },
                ].map((spec, idx) => (
                  <tr key={spec.code} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-neutral-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-neutral-900">{spec.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400">code: {spec.code}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-medium border border-neutral-200">
                        {spec.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-600 text-[11px]">{spec.unit}</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={spec.req ? 'danger' : 'neutral'} size="sm">
                        {spec.req ? 'Obligatoire' : 'Optionnel'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={spec.filter ? 'success' : 'neutral'} size="sm">
                        {spec.filter ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: CRÉATION / MODIFICATION CATÉGORIE */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? `Modifier : ${editingCategory.name}` : 'Nouveau Rayon / Catégorie'}
        subtitle="Renseignez le nom, le niveau hiérarchique et l'image de couverture"
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
              onClick={handleSaveCategory}
              className="text-xs py-2 px-5"
            >
              {editingCategory ? 'Enregistrer les modifications' : 'Créer la catégorie'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCategory} className="p-6 pb-24 space-y-4 text-xs">
          {/* Drag & Drop Cover Image */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Visuel / Couverture du Rayon
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropImage}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2',
                isDragging
                  ? 'border-neutral-900 bg-neutral-100'
                  : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50/50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelectImageFile}
              />
              {formImageUrl ? (
                <div className="relative w-full h-24 rounded-xl bg-white border border-neutral-200 overflow-hidden shadow-xs">
                  <Image src={formImageUrl} alt="Cover preview" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center text-neutral-500">
                  <UploadCloud className="w-5 h-5" />
                </div>
              )}
              <div className="text-[11px] text-neutral-600">
                <span className="font-bold text-neutral-900">Glissez-déposez une image</span> ou cliquez pour parcourir
              </div>
              <div className="text-[10px] text-neutral-400">JPG, PNG ou WEBP haute résolution</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nom du Rayon (FR) *"
              placeholder="ex: Gros Électroménager"
              value={formName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
            <Input
              label="Nom en Arabe (Optionnel)"
              placeholder="ex: الأجهزة الكهرومنزلية"
              value={formNameAr}
              onChange={(e) => setFormNameAr(e.target.value)}
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700">Slug Canonique *</label>
                <button
                  type="button"
                  onClick={() => setIsAutoSlug(!isAutoSlug)}
                  className="text-[10px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAutoSlug ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-amber-600" />}
                  <span>{isAutoSlug ? 'Auto' : 'Manuel'}</span>
                </button>
              </div>
              <Input
                placeholder="ex: gros-electromenager"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                disabled={isAutoSlug}
                required
              />
            </div>

            <Select
              label="Rayon Parent (Hiérarchie)"
              value={formParentId}
              onChange={(e) => setFormParentId(e.target.value)}
              options={[
                { label: '— Rayon Principal (Racine) —', value: '' },
                ...categories
                  .filter((c) => !editingCategory || c.id !== editingCategory.id)
                  .map((c) => ({
                    label: `${c.parentId ? '└── ' : ''}${c.name}`,
                    value: c.id,
                  })),
              ]}
              searchable={true}
            />
          </div>

          <Textarea
            label="Description & Vocation Commerciale"
            placeholder="Décrivez les types de produits inclus dans ce rayon..."
            rows={2}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />

          {/* Visibility Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-900 block text-xs">Visibilité Storefront</span>
                <span className="text-[10px] text-neutral-500">Accessible au public</span>
              </div>
              <button
                type="button"
                onClick={() => setFormIsActive(!formIsActive)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                  formIsActive ? 'bg-[var(--royal-primary)]' : 'bg-neutral-300'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transition-transform shadow-xs absolute top-0.5',
                    formIsActive ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-900 block text-xs">Afficher au Menu</span>
                <span className="text-[10px] text-neutral-500">Présent dans la navbar</span>
              </div>
              <button
                type="button"
                onClick={() => setFormShowInMenu(!formShowInMenu)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                  formShowInMenu ? 'bg-[var(--royal-primary)]' : 'bg-neutral-300'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transition-transform shadow-xs absolute top-0.5',
                    formShowInMenu ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: CONFIRMATION SUPPRESSION */}
      <DeleteConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer la Catégorie"
        message={
          categoryToDelete
            ? `Êtes-vous certain de vouloir supprimer le rayon "${categoryToDelete.name}" ? Les sous-catégories seront rattachées à la racine.`
            : ''
        }
      />
    </div>
  );
}
