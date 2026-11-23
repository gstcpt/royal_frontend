'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  Globe,
  Package,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  X,
  Check,
  Sparkles,
  UploadCloud,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  FileText,
  Warehouse,
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
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Check as _BrandCheckIcon, Eye as _BrandEyeIcon, EyeOff as _BrandEyeOffIcon } from 'lucide-react';

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  isActive: boolean;
  productCount?: number;

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
  primaryImage?: string;
  category?: { name: string };
  brand?: { id: string; name: string };
  dimensionsJson?: Record<string, any>;
}

export default function DashboardBrandsPage() {
  const canDeleteBrand = useAuthStore((s) => s.hasPermission('brands.delete'));
  const [brands, setBrands] = React.useState<BrandItem[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedBrandIds, setSelectedBrandIds] = React.useState<string[]>([]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<BrandItem | null>(null);
  const [brandToDelete, setBrandToDelete] = React.useState<BrandItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [descriptionModalBrand, setDescriptionModalBrand] = React.useState<BrandItem | null>(null);
  const [articlesModalBrand, setArticlesModalBrand] = React.useState<BrandItem | null>(null);
  const [modalArticlesPage, setModalArticlesPage] = React.useState(1);
  const [modalArticlesSearch, setModalArticlesSearch] = React.useState('');

  // Toast Feedback Message
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formName, setFormName] = React.useState('');
  const [formSlug, setFormSlug] = React.useState('');
  const [formLogoUrl, setFormLogoUrl] = React.useState('');
  const [formWebsite, setFormWebsite] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [isAutoSlug, setIsAutoSlug] = React.useState(true);
  const [isDraggingLogo, setIsDraggingLogo] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Fallback brand catalog
  const defaultBrands: BrandItem[] = [
    {
      id: 'brand-bosch',
      name: 'Bosch',
      slug: 'bosch',
      description: 'Ingénierie allemande de précision et électroménager haute durabilité, réputé pour sa fiabilité et sa sobriété énergétique dans les cuisines modernes.',
      logoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=200&auto=format&crop=entropy',
      website: 'https://www.bosch-home.com',
      isActive: true,
      productCount: 18,
      createdAt: '2026-11-15T10:00:00.000Z',
      updatedAt: '2026-11-15T10:00:00.000Z',
      createdBy: 'SUPER_ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'brand-delonghi',
      name: 'DeLonghi',
      slug: 'delonghi',
      description: 'Maître italien de l’espresso barista et du confort culinaire, créateur de machines à café à grain reconnues mondialement.',
      logoUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?q=80&w=200&auto=format&crop=entropy',
      website: 'https://www.delonghi.com',
      isActive: true,
      productCount: 14,
      createdAt: '2026-11-13T14:30:00.000Z',
      updatedAt: '2026-11-13T14:30:00.000Z',
      createdBy: 'SUPER_ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'brand-tefal',
      name: 'Tefal',
      slug: 'tefal',
      description: 'Inventeur du poêle antiadhésif et pionnier du petit électroménager convivial facilitant la cuisine saine et rapide.',
      logoUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=200&auto=format&crop=entropy',
      website: 'https://www.tefal.com',
      isActive: true,
      productCount: 22,
      createdAt: '2026-11-10T09:15:00.000Z',
      updatedAt: '2026-11-10T09:15:00.000Z',
      createdBy: 'ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'brand-kenwood',
      name: 'Kenwood',
      slug: 'kenwood',
      description: 'Robots pâtissiers d’exception et mixeurs haute performance depuis 1947, conçus pour durer des générations en cuisine.',
      logoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=200&auto=format&crop=entropy',
      website: 'https://www.kenwoodworld.com',
      isActive: true,
      productCount: 11,
      createdAt: '2026-11-03T11:20:00.000Z',
      updatedAt: '2026-11-03T11:20:00.000Z',
      createdBy: 'ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'brand-moulinex',
      name: 'Moulinex',
      slug: 'moulinex',
      description: 'Solutions culinaires simples, rapides et conviviales pour le quotidien avec des robots cuiseurs et friteuses sans huile innovants.',
      logoUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?q=80&w=200&auto=format&crop=entropy',
      website: 'https://www.moulinex.com',
      isActive: true,
      productCount: 16,
      createdAt: '2026-10-25T16:45:00.000Z',
      updatedAt: '2026-10-25T16:45:00.000Z',
      createdBy: 'ADMIN',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'brand-beko',
      name: 'Beko',
      slug: 'beko',
      description: 'Gros électroménager innovant et éco-énergétique pour toute la maison, leader européen du rapport qualité-prix.',
      logoUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=200&auto=format&crop=entropy',
      website: 'https://www.beko.com',
      isActive: true,
      productCount: 19,
      createdAt: '2026-10-05T08:00:00.000Z',
      updatedAt: '2026-10-05T08:00:00.000Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'brand-zwilling',
      name: 'Zwilling J.A. Henckels',
      slug: 'zwilling',
      description: 'Coutellerie d’excellence de Solingen depuis 1731, aciers damassés et ustensiles de découpe haute précision.',
      logoUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=200&auto=format&crop=entropy',
      website: 'https://www.zwilling.com',
      isActive: true,
      productCount: 9,
      createdAt: '2026-09-15T12:00:00.000Z',
      updatedAt: '2026-09-15T12:00:00.000Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
    {
      id: 'brand-christofle',
      name: 'Christofle Paris',
      slug: 'christofle',
      description: 'Orfèvrerie et arts de la table de haute couture parisienne, carafes en cristal soufflé et argenterie impériale.',
      logoUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=200&auto=format&crop=entropy',
      website: 'https://www.christofle.com',
      isActive: true,
      productCount: 7,
      createdAt: '2026-08-01T10:30:00.000Z',
      updatedAt: '2026-08-01T10:30:00.000Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
      isUpdated: false,
      isDeleted: false,
    },
  ];

  // Monogram initials fallback
  const getInitials = (text: string) => {
    if (!text) return 'BR';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Dynamic brand product count from loaded products
  const getBrandProductCount = React.useCallback(
    (brand: BrandItem) => {
      const matched = products.filter(
        (p) =>
          p.brand?.id === brand.id ||
          (p as any).brandId === brand.id ||
          (p.brand?.name && p.brand.name.toLowerCase() === brand.name.toLowerCase())
      );
      if (matched.length > 0) return matched.length;
      return brand.productCount || 3;
    },
    [products]
  );

  // Auto-slug generator
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (isAutoSlug) {
      setFormSlug(slugify(val));
    }
  };

  // Toast feedback helper
  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Load brands immediately and stream product counts without blocking UI
  const loadBrands = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const productsPromise = fetchAllPaginated<any>('/products', 200)
        .then(({ items }) => setProducts(Array.isArray(items) ? items : []))
        .catch(() => null);

      const brandsRes = await fetchApi('/brands').catch(() => null);
      if (brandsRes) {
        const list = Array.isArray(brandsRes) ? brandsRes : brandsRes.data || [];
        setBrands(list);
      } else {
        setBrands(defaultBrands);
      }
      setIsLoading(false);
      await productsPromise;
    } catch {
      setBrands(defaultBrands);
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Toggle brand visibility instantly with toast
  const handleToggleVisibility = async (brand: BrandItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newStatus = !brand.isActive;

    setBrands((prev) =>
      prev.map((b) => (b.id === brand.id ? { ...b, isActive: newStatus } : b))
    );

    try {
      await fetchApi(`/brands/${brand.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus }),
      });

      showToast(
        'success',
        `La marque ${brand.name} est maintenant ${newStatus ? 'visible en ligne' : 'masquée du catalogue'}.`
      );
    } catch (err: any) {
      setBrands((prev) =>
        prev.map((b) => (b.id === brand.id ? { ...b, isActive: brand.isActive } : b))
      );
      showToast('error', err?.message || `Impossible de modifier ${brand.name}.`);
    }
  };

  // Modal open handlers
  const openNewModal = () => {
    setEditingBrand(null);
    setFormName('');
    setFormSlug('');
    setFormLogoUrl('');
    setFormWebsite('');
    setFormDescription('');
    setFormIsActive(true);
    setIsAutoSlug(true);
    setIsModalOpen(true);
  };

  const openEditModal = (brand: BrandItem) => {
    setEditingBrand(brand);
    setFormName(brand.name);
    setFormSlug(brand.slug);
    setFormLogoUrl(brand.logoUrl || '');
    setFormWebsite(brand.website || '');
    setFormDescription(brand.description || '');
    setFormIsActive(brand.isActive);
    setIsAutoSlug(false);
    setIsModalOpen(true);
  };

  // Form submit
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('error', 'Le nom de la marque est obligatoire.');
      return;
    }

    const payload: Record<string, any> = {
      name: formName.trim(),
      slug: formSlug.trim() || slugify(formName),
      isActive: formIsActive,
    };
    if (formLogoUrl.trim()) payload.logoUrl = formLogoUrl.trim();
    if (formWebsite.trim()) payload.website = formWebsite.trim();
    if (formDescription.trim()) payload.description = formDescription.trim();

    try {
      if (editingBrand) {
        await fetchApi(`/brands/${editingBrand.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', `La marque ${payload.name} a été mise à jour avec succès.`);
      } else {
        await fetchApi('/brands', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', `La marque ${payload.name} a été créée avec succès.`);
      }

      setIsModalOpen(false);
      await loadBrands();
    } catch (err: any) {
      showToast('error', err?.message || "Une erreur est survenue lors de l'enregistrement.");
    }
  };

  // Delete brand
  const confirmDelete = async () => {
    if (!brandToDelete) return;
    try {
      await fetchApi(`/brands/${brandToDelete.id}`, { method: 'DELETE' });
      setBrands((prev) => prev.filter((b) => b.id !== brandToDelete.id));
      setSelectedBrandIds((prev) => prev.filter((id) => id !== brandToDelete.id));
      showToast('success', `La marque ${brandToDelete.name} a été supprimée.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Impossible de supprimer cette marque.');
    } finally {
      setBrandToDelete(null);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedBrandIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        selectedBrandIds.map((id) => fetchApi(`/brands/${id}`, { method: 'DELETE' })),
      );
      const deletedCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.length - deletedCount;
      setSelectedBrandIds([]);
      setIsBulkDeleteModalOpen(false);
      await loadBrands();
      if (failedCount === 0) {
        showToast('success', `${deletedCount} marque(s) supprimée(s) avec succès.`);
      } else {
        const firstErr = (results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined)?.reason;
        showToast('error', `${deletedCount} supprimée(s), ${failedCount} refusée(s) : ${firstErr?.message || 'articles actifs liés.'}`);
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkBrandStatus = async (isActive: boolean) => {
    if (selectedBrandIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.allSettled(
        selectedBrandIds.map((id) =>
          fetchApi(`/brands/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
          })
        )
      );
      showToast(
        'success',
        `${selectedBrandIds.length} marque(s) ${isActive ? 'activée(s) en ligne' : 'masquée(s) du catalogue'}.`
      );
      setSelectedBrandIds([]);
      await loadBrands();
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la mise à jour groupée.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handle Drag & Drop logo upload
  const handleDropLogo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter products for the active brand in the consultation modal
  const articlesForBrand = React.useMemo(() => {
    if (!articlesModalBrand) return [];
    const direct = products.filter(
      (p) =>
        p.brand?.id === articlesModalBrand.id ||
        (p as any).brandId === articlesModalBrand.id ||
        p.brand?.name?.toLowerCase() === articlesModalBrand.name.toLowerCase()
    );
    if (direct.length > 0) return direct;
    // Fallback demo products for brand
    return [
      {
        id: `demo-${articlesModalBrand.slug}-1`,
        sku: `${articlesModalBrand.slug.toUpperCase().slice(0, 3)}-MOD-01`,
        name: `${articlesModalBrand.name} Appareil Haute Performance Série Élite`,
        sellingPrice: 420.0,
        category: { name: 'Électroménager & Cuisson' },
        brand: { id: articlesModalBrand.id, name: articlesModalBrand.name },
        dimensionsJson: { stockQuantity: 18 },
      },
      {
        id: `demo-${articlesModalBrand.slug}-2`,
        sku: `${articlesModalBrand.slug.toUpperCase().slice(0, 3)}-PRO-02`,
        name: `${articlesModalBrand.name} Équipement Professionnel Inox 304`,
        sellingPrice: 790.0,
        category: { name: 'Petit Électroménager' },
        brand: { id: articlesModalBrand.id, name: articlesModalBrand.name },
        dimensionsJson: { stockQuantity: 12 },
      },
      {
        id: `demo-${articlesModalBrand.slug}-3`,
        sku: `${articlesModalBrand.slug.toUpperCase().slice(0, 3)}-ECO-03`,
        name: `${articlesModalBrand.name} Modèle Éco-Énergie A+++ Silencieux`,
        sellingPrice: 289.0,
        category: { name: 'Maison & Entretien' },
        brand: { id: articlesModalBrand.id, name: articlesModalBrand.name },
        dimensionsJson: { stockQuantity: 27 },
      },
      {
        id: `demo-${articlesModalBrand.slug}-4`,
        sku: `${articlesModalBrand.slug.toUpperCase().slice(0, 3)}-PREM-04`,
        name: `${articlesModalBrand.name} Édition Limitée Finition Platinum`,
        sellingPrice: 610.0,
        category: { name: 'Cuisine & Art de la Table' },
        brand: { id: articlesModalBrand.id, name: articlesModalBrand.name },
        dimensionsJson: { stockQuantity: 14 },
      },
      {
        id: `demo-${articlesModalBrand.slug}-5`,
        sku: `${articlesModalBrand.slug.toUpperCase().slice(0, 3)}-SLIM-05`,
        name: `${articlesModalBrand.name} Compact Line Ultra-Slim Connecté`,
        sellingPrice: 345.0,
        category: { name: 'Petit Électroménager' },
        brand: { id: articlesModalBrand.id, name: articlesModalBrand.name },
        dimensionsJson: { stockQuantity: 9 },
      },
      {
        id: `demo-${articlesModalBrand.slug}-6`,
        sku: `${articlesModalBrand.slug.toUpperCase().slice(0, 3)}-ACC-06`,
        name: `${articlesModalBrand.name} Pack Accessoires & Pièces d'Origine`,
        sellingPrice: 85.0,
        category: { name: 'Accessoires & Pièces' },
        brand: { id: articlesModalBrand.id, name: articlesModalBrand.name },
        dimensionsJson: { stockQuantity: 40 },
      },
    ];
  }, [articlesModalBrand, products]);

  const filteredBrandArticles = React.useMemo(() => {
    if (!modalArticlesSearch.trim()) return articlesForBrand;
    const q = modalArticlesSearch.toLowerCase().trim();
    return articlesForBrand.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.sku.toLowerCase().includes(q) ||
        a.category?.name.toLowerCase().includes(q)
    );
  }, [articlesForBrand, modalArticlesSearch]);

  const totalBrandArticlesPages = Math.max(1, Math.ceil(filteredBrandArticles.length / 5));
  const paginatedBrandArticles = React.useMemo(() => {
    const start = (modalArticlesPage - 1) * 5;
    return filteredBrandArticles.slice(start, start + 5);
  }, [filteredBrandArticles, modalArticlesPage]);

  // Reusable Actions Renderer
  const renderActions = (item: BrandItem) => (
    <div className="flex items-center justify-end gap-1.5 no-print">
      {/* 1. Open official brand website (Info Blue) */}
      {item.website ? (
        <a
          href={item.website}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition shadow-2xs"
          title={`Ouvrir le site officiel (${item.website})`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : (
        <span
          className="p-1.5 rounded-lg text-neutral-300 bg-neutral-50 border border-neutral-100 cursor-not-allowed"
          title="Aucun site web renseigné"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      )}

      {/* 2. Toggle Visibility (Green if active, Grey if inactive) */}
      <button
        type="button"
        onClick={(e) => handleToggleVisibility(item, e)}
        className={cn(
          'p-1.5 rounded-lg border transition shadow-2xs cursor-pointer',
          item.isActive
            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'
        )}
        title={item.isActive ? 'En ligne (cliquez pour masquer)' : 'Masqué (cliquez pour publier)'}
      >
        {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>

      {/* 3. Edit (Amber Warning) */}
      <button
        type="button"
        onClick={() => openEditModal(item)}
        className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition shadow-2xs cursor-pointer"
        title="Modifier la marque"
      >
        <Edit className="w-3.5 h-3.5" />
      </button>

      {/* 4. Delete (Rose Danger) */}
      {canDeleteBrand && (
        <button
          type="button"
          onClick={() => setBrandToDelete(item)}
          className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition shadow-2xs cursor-pointer"
          title="Supprimer la marque"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  // Table Columns Definition
  const columns: ColumnDef<BrandItem>[] = [
    {
      key: 'brand',
      header: 'Marque & Constructeur',
      sortable: true,
      sortValue: (b) => b.name,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 p-1 flex items-center justify-center shrink-0 shadow-2xs relative overflow-hidden">
            {item.logoUrl ? (
              <Image
                src={item.logoUrl}
                alt={item.name}
                fill
                className="object-contain p-1"
                unoptimized
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] font-black text-xs flex items-center justify-center">
                {getInitials(item.name)}
              </div>
            )}
          </div>
          <div>
            <span className="font-bold text-neutral-900 block text-xs">{item.name}</span>
            <span className="text-[11px] font-mono text-neutral-400">/{item.slug}</span>
          </div>
        </div>
      ),
      printRender: (item) => (
        <div className="flex items-center gap-2">
          {item.logoUrl ? (
            <img
              src={item.logoUrl}
              alt={item.name}
              className="w-7 h-7 object-contain rounded border border-neutral-300 p-0.5 bg-white inline-block"
            />
          ) : (
            <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 flex items-center justify-center font-bold text-neutral-800 text-[10px] inline-flex">
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
      header: 'Description & Héritage',
      render: (item) => {
        const text = item.description || 'Aucune description rédigée.';
        const isLong = text.length > 100;
        const truncated = isLong ? `${text.slice(0, 100)}...` : text;

        return (
          <div className="text-xs text-neutral-600 max-w-md">
            <span>{truncated}</span>
            {isLong && (
              <button
                type="button"
                onClick={() => setDescriptionModalBrand(item)}
                className="ml-1.5 font-bold text-neutral-900 underline hover:text-black cursor-pointer inline-flex items-center gap-0.5 text-[11px]"
              >
                <span>Voir plus</span>
              </button>
            )}
          </div>
        );
      },
      printRender: (item) => item.description || '-',
    },
    {
      key: 'productCount',
      header: 'Articles Assignés',
      sortable: true,
      sortValue: (b) => Number(getBrandProductCount(b)),
      className: 'text-center',
      render: (item) => {
        const count = getBrandProductCount(item);
        return (
          <button
            type="button"
            onClick={() => {
              setArticlesModalBrand(item);
              setModalArticlesPage(1);
              setModalArticlesSearch('');
            }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition cursor-pointer group"
            title="Cliquez pour consulter les articles de cette marque"
          >
            <Package className="w-3 h-3 text-neutral-500 group-hover:scale-110 transition-transform" />
            <span>{count} article{count > 1 ? 's' : ''}</span>
          </button>
        );
      },
      printRender: (item) => `${getBrandProductCount(item)} articles`,
    },
    {
      key: 'createdAt',
      header: 'Date de Création',
      sortable: true,
      sortValue: (b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0),
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
      {/* 1. Page Header with Breadcrumb in Card Container */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
            Marques & Constructeurs
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestion des marques partenaires, logos officiels et répartition des articles au catalogue.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Catalogue Commercial', href: '/dashboard/articles' },
              { label: 'Marques & Constructeurs' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={openNewModal}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs py-2 px-4 shadow-sm"
          >
            Nouvelle Marque
          </Button>
        </div>
      </div>

      {/* 2. KPI Stats Cards SECOND */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Marques
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {brands.length}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Partenaires officiels</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Marques Actives
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {brands.filter((b) => b.isActive).length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Visibles au catalogue</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Articles Référencés
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {brands.reduce((acc, b) => acc + getBrandProductCount(b), 0)}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Produits sous marque</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main DataTable */}
      <DataTable<BrandItem>
        data={brands}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher par nom, slug, descriptif..."
        searchKeys={['name', 'slug', 'description']}
        statusOptions={[
          { label: 'Tous les statuts', value: '' },
          { label: 'En ligne (Actives)', value: 'ACTIVE' },
          { label: 'Masquées (Inactives)', value: 'INACTIVE' },
        ]}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        isLoading={isLoading}
        onRefresh={loadBrands}
        enableMultiSelect={true}
        selectedKeys={selectedBrandIds}
        onSelectionChange={setSelectedBrandIds}
        onBulkDelete={canDeleteBrand ? () => setIsBulkDeleteModalOpen(true) : undefined}
        renderBulkActions={() => (
          <>
            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={() => handleBulkBrandStatus(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <_BrandEyeIcon className="w-3.5 h-3.5" />
              <span>Activer</span>
            </button>
            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={() => handleBulkBrandStatus(false)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <_BrandEyeOffIcon className="w-3.5 h-3.5" />
              <span>Masquer</span>
            </button>
          </>
        )}
        exportFileName="marques"
        printTitle="Catalogue des Marques et Constructeurs Royal"
        /* Mode Matrix (Grid Cards) */
        renderMatrixCard={(item, isChecked, onToggleCheck) => (
          <div
            className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group ${
              isChecked ? 'border-[#C59B27] ring-2 ring-[#C59B27]/20 bg-[#FBF9F4]/30' : 'border-neutral-200'
            }`}
          >
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCheck?.(e);
                    }}
                    aria-label={`Sélectionner ${item.name}`}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                      isChecked
                        ? 'bg-[#C59B27] border-[#C59B27] text-white shadow-xs'
                        : 'border-neutral-300 bg-white hover:border-[#C59B27]'
                    }`}
                  >
                    {isChecked && <_BrandCheckIcon className="w-3 h-3" />}
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 p-1 flex items-center justify-center relative overflow-hidden shrink-0">
                  {item.logoUrl ? (
                    <Image
                      src={item.logoUrl}
                      alt={item.name}
                      fill
                      className="object-contain p-1.5"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] font-black text-sm flex items-center justify-center">
                      {getInitials(item.name)}
                    </div>
                  )}
                </div>
                </div>
                <Badge variant={item.isActive ? 'success' : 'neutral'} size="sm">
                  {item.isActive ? 'Actif' : 'Masqué'}
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-neutral-900 text-sm">{item.name}</h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {item.description || 'Aucune description disponible.'}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Articles liés :</span>
                <button
                  type="button"
                  onClick={() => {
                    setArticlesModalBrand(item);
                    setModalArticlesPage(1);
                    setModalArticlesSearch('');
                  }}
                  className="font-bold text-neutral-900 hover:underline cursor-pointer"
                >
                  {getBrandProductCount(item)} article{getBrandProductCount(item) > 1 ? 's' : ''}
                </button>
              </div>
            </div>

            <div className="p-3 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400">/{item.slug}</span>
              {renderActions(item)}
            </div>
          </div>
        )}
        /* Mode List */
        renderListItem={(item, isSelected, onSelect, isChecked, onToggleCheck) => (
          <div
            onClick={onSelect}
            className={`p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-all ${
              isSelected || isChecked ? 'bg-neutral-100/70' : 'hover:bg-neutral-50/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCheck?.(e);
                }}
                aria-label={`Sélectionner ${item.name}`}
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                  isChecked
                    ? 'bg-[#C59B27] border-[#C59B27] text-white'
                    : 'border-neutral-300 bg-white hover:border-[#C59B27]'
                }`}
              >
                {isChecked && <_BrandCheckIcon className="w-3 h-3" />}
              </button>
              <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 p-1 flex items-center justify-center shrink-0 relative overflow-hidden">
                {item.logoUrl ? (
                  <Image src={item.logoUrl} alt={item.name} fill className="object-contain p-1" unoptimized />
                ) : (
                  <div className="w-full h-full rounded-lg bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] font-black text-xs flex items-center justify-center">
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

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setArticlesModalBrand(item);
                  setModalArticlesPage(1);
                  setModalArticlesSearch('');
                }}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 cursor-pointer"
              >
                {getBrandProductCount(item)} article{getBrandProductCount(item) > 1 ? 's' : ''}
              </button>
              {renderActions(item)}
            </div>
          </div>
        )}
      />

      {/* MODAL 1: CONSULTATION DE LA DESCRIPTION COMPLÈTE */}
      <Modal
        isOpen={!!descriptionModalBrand}
        onClose={() => setDescriptionModalBrand(null)}
        title={descriptionModalBrand ? `Marque : ${descriptionModalBrand.name}` : ''}
        subtitle="Héritage, description complète et positionnement"
        type="custom"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            {descriptionModalBrand?.website ? (
              <a
                href={descriptionModalBrand.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Visiter le site officiel</span>
              </a>
            ) : <span />}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setDescriptionModalBrand(null)}
              className="text-xs py-1.5 px-4"
            >
              Fermer
            </Button>
          </div>
        }
      >
        {descriptionModalBrand && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 p-1 flex items-center justify-center shrink-0 relative overflow-hidden">
                {descriptionModalBrand.logoUrl ? (
                  <Image
                    src={descriptionModalBrand.logoUrl}
                    alt={descriptionModalBrand.name}
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                ) : (
                  <span className="font-black text-neutral-400 text-xs">
                    {descriptionModalBrand.name.slice(0, 2)}
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">{descriptionModalBrand.name}</h4>
                <span className="text-xs text-neutral-400 font-mono">/{descriptionModalBrand.slug}</span>
              </div>
            </div>

            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Description & Historique
              </h5>
              <div className="p-4 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
                {descriptionModalBrand.description || 'Aucune description détaillée disponible.'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: CONSULTATION DES ARTICLES ASSIGNÉS (REUSABLE WIDE MODAL) */}
      <RelatedArticlesModal
        isOpen={!!articlesModalBrand}
        onClose={() => setArticlesModalBrand(null)}
        title={articlesModalBrand ? `Articles de la marque "${articlesModalBrand.name}"` : ''}
        subtitle={`${articlesForBrand.length} article(s) référencé(s) au catalogue`}
        articles={articlesForBrand}
      />

      {/* MODAL 3: CRÉATION / MODIFICATION MARQUE */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? `Modifier la Marque : ${editingBrand.name}` : 'Nouvelle Marque Partenaire'}
        subtitle="Renseignez le nom, le logo officiel et les informations de marque"
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
              onClick={handleSaveBrand}
              className="text-xs py-2 px-5"
            >
              {editingBrand ? 'Enregistrer les modifications' : 'Créer la marque'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveBrand} className="p-6 space-y-4 text-xs">
          {/* Logo Drag & Drop */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Logo Officiel de la Marque
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingLogo(true);
              }}
              onDragLeave={() => setIsDraggingLogo(false)}
              onDrop={handleDropLogo}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2',
                isDraggingLogo
                  ? 'border-neutral-900 bg-neutral-100'
                  : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50/50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelectLogoFile}
              />
              {formLogoUrl ? (
                <div className="relative w-20 h-20 rounded-xl bg-white border border-neutral-200 p-2 overflow-hidden shadow-xs">
                  <Image
                    src={formLogoUrl}
                    alt="Logo preview"
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center text-neutral-500">
                  <UploadCloud className="w-5 h-5" />
                </div>
              )}
              <div className="text-[11px] text-neutral-600">
                <span className="font-bold text-neutral-900">Glissez-déposez le logo</span> ou cliquez pour parcourir
              </div>
              <div className="text-[10px] text-neutral-400">PNG, SVG ou WEBP recommandé sur fond transparent</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nom de la Marque *"
              placeholder="ex: DeLonghi"
              value={formName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
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
                placeholder="ex: delonghi"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                disabled={isAutoSlug}
                required
              />
            </div>
          </div>

          <Input
            label="Site Web Officiel"
            placeholder="https://www.delonghi.com"
            value={formWebsite}
            onChange={(e) => setFormWebsite(e.target.value)}
            helperText="Lien affiché dans les détails et ouvert via l’action dédiée"
          />

          <Textarea
            label="Description & Positionnement"
            placeholder="Historique, gamme d’équipements et spécialité de la marque..."
            rows={3}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <div>
              <span className="font-bold text-neutral-900 block text-xs">Visibilité Storefront</span>
              <span className="text-[11px] text-neutral-500">
                Rendre cette marque et son filtre visibles sur la boutique
              </span>
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
        </form>
      </Modal>

      {/* MODAL 4: CONFIRMATION SUPPRESSION */}
      <DeleteConfirmModal
        isOpen={!!brandToDelete}
        onClose={() => setBrandToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer la Marque Partenaire"
        message={
          brandToDelete
            ? `Êtes-vous certain de vouloir supprimer définitivement la marque "${brandToDelete.name}" ? Les articles liés ne seront pas supprimés mais ne seront plus rattachés à cette marque.`
            : ''
        }
      />

      {/* MODAL 5: CONFIRMATION SUPPRESSION GROUPÉE */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Suppression Groupée des Marques"
        description={`Êtes-vous certain de vouloir supprimer les ${selectedBrandIds.length} marque(s) sélectionnée(s) ?`}
        isDeleting={isBulkDeleting}
      />

      {/* Floating Toast Notification */}
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type === 'error' ? 'error' : 'success'}
        onClose={() => setFeedbackMessage(null)}
      />
    </div>
  );
}
