'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Printer,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FolderTree,
  Warehouse,
  Boxes,
  Store,
  Grid,
  List,
  Columns,
  Sliders,
  Check,
  Copy,
  Info,
  Maximize2,
  Minimize2,
  Truck,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  DisplayMode,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  DeleteConfirmModal,
  Breadcrumb,
  Toast,
  Textarea,
  Toggle,
  StatusToggle,
} from '@/components/ui';
import { RelatedArticlesModal, ModalProductItem } from '@/components/dashboard/modal-articles-table';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { Check as _WhCheck, CheckCircle2 as _WhActive, XCircle as _WhPause } from 'lucide-react';
import { cn } from '@/lib/utils';

// ══════════════════════════════════════════════════════════════════════════════════
// TYPES & DATA STRUCTURES: HIERARCHICAL STORAGE ARBORESCENCE
// ══════════════════════════════════════════════════════════════════════════════════

export interface StorageArticle {
  id: string;
  sku: string;
  name: string;
  nameAr?: string;
  imageUrl?: string;
  sellingPrice: number;
  physicalQty: number;
  reservedQty: number;
  reorderPoint?: number;
  categoryName?: string;
}

export interface ShelfNode {
  id: string;
  code: string; // ex: DEP-SOUSSE/A1-T1-E02
  name: string; // ex: Étagère 02 — Niveau Médian
  levelNumber: number; // 1, 2, 3...
  maxWeightKg?: number;
  articles: StorageArticle[];
}

export interface TarmaNode {
  id: string;
  code: string; // ex: TARMA-A.1
  name: string; // ex: Tarma A.1 — Râtelier Mi-Lourd
  equipmentType: 'RACK_HEAVY' | 'RACK_MEDIUM' | 'SHELVING' | 'PALLET_RACK';
  shelves: ShelfNode[];
}

export interface AisleNode {
  id: string;
  code: string; // ex: ALLEE-A
  name: string; // ex: Allée A — Cuisson & Gros Matériel
  zoneType: 'PALLET' | 'PARTS' | 'SECURED' | 'TRANSIT_DOCK';
  directArticles?: StorageArticle[];
  tarmas: TarmaNode[];
}

export interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  type: 'CENTRAL_HUB' | 'SECONDARY' | 'STORE_RESERVE' | 'TRANSIT';
  address: string | null;
  city: string;
  country: string;
  phone: string | null;
  email: string | null;
  managerName?: string;
  surfaceM2?: number;
  maxPallets?: number;
  usedPallets?: number;
  occupancyPercent?: number;
  isActive: boolean;
  isDefault: boolean;
  directArticles?: StorageArticle[];
  aisles: AisleNode[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  isUpdated?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

// ══════════════════════════════════════════════════════════════════════════════════
// AGGREGATION UTILS: CALCULATE TOTAL STOCK GROUPED AT ANY HIERARCHICAL LEVEL
// ══════════════════════════════════════════════════════════════════════════════════

function getTarmaTotalPhysicalQty(t: TarmaNode): number {
  return t.shelves.reduce(
    (acc, s) => acc + s.articles.reduce((a2, art) => a2 + art.physicalQty, 0),
    0
  );
}

function getAisleTotalPhysicalQty(a: AisleNode): number {
  const direct = a.directArticles?.reduce((acc, art) => acc + art.physicalQty, 0) || 0;
  const fromTarmas = a.tarmas.reduce((acc, t) => acc + getTarmaTotalPhysicalQty(t), 0);
  return direct + fromTarmas;
}

function getWarehouseTotalPhysicalQty(w: WarehouseItem): number {
  const direct = w.directArticles?.reduce((acc, a) => acc + a.physicalQty, 0) || 0;
  const fromAisles = w.aisles.reduce((acc, a) => acc + getAisleTotalPhysicalQty(a), 0);
  return direct + fromAisles;
}

// ══════════════════════════════════════════════════════════════════════════════════
// DEFAULT COMPREHENSIVE STORAGE REPOSITORIES (HEADLINED BY DÉPÔT SOUSSE)
// ══════════════════════════════════════════════════════════════════════════════════

const CITY_OPTIONS = [
  { code: 'ALL', label: 'Toutes les villes' },
  { code: 'Sousse', label: 'Sousse (Hub Logistique)' },
  { code: 'Tunis', label: 'Tunis & Charguia' },
  { code: 'La Marsa', label: 'La Marsa' },
];

export default function WarehousesDashboardPage() {
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingWarehouse, setEditingWarehouse] = React.useState<WarehouseItem | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = React.useState<WarehouseItem | null>(null);
  const [selectedWarehouseIds, setSelectedWarehouseIds] = React.useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);
  const [inspectingWarehouse, setInspectingWarehouse] = React.useState<WarehouseItem | null>(null);
  const [articlesModalWarehouse, setArticlesModalWarehouse] = React.useState<WarehouseItem | null>(null);
  const [modalArticles, setModalArticles] = React.useState<ModalProductItem[]>([]);

  // Tree interactive state
  const [expandedNodes, setExpandedNodes] = React.useState<Record<string, boolean>>({
    'wh-depot-sousse-01': true,
    'aisle-sousse-a': true,
    'tarma-sousse-a1': true,
  });
  const [treeSearchQuery, setTreeSearchQuery] = React.useState('');

  // Form State
  const [formName, setFormName] = React.useState('');
  const [formCode, setFormCode] = React.useState('');
  const [formType, setFormType] = React.useState<'CENTRAL_HUB' | 'SECONDARY' | 'STORE_RESERVE' | 'TRANSIT'>('CENTRAL_HUB');
  const [formCity, setFormCity] = React.useState('Sousse');
  const [formAddress, setFormAddress] = React.useState('');
  const [formPhone, setFormPhone] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [formManagerName, setFormManagerName] = React.useState('');
  const [formSurfaceM2, setFormSurfaceM2] = React.useState('2000');
  const [formMaxPallets, setFormMaxPallets] = React.useState('1000');
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [formIsDefault, setFormIsDefault] = React.useState(false);

  // Toolbar Filters State
  const [establishmentFilter, setEstablishmentFilter] = React.useState<'ALL' | 'DEPOTS' | 'SHOWROOMS'>('ALL');
  const [filterCity, setFilterCity] = React.useState('ALL');
  const [filterStatus, setFilterStatus] = React.useState('ALL');
  const [filterType, setFilterType] = React.useState('ALL');

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleBulkWarehousePatch = async (
    patch: { isActive?: boolean; type?: 'CENTRAL_HUB' | 'SECONDARY' | 'STORE_RESERVE' | 'TRANSIT' },
    label: string
  ) => {
    if (selectedWarehouseIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await Promise.allSettled(
        selectedWarehouseIds.map((id) =>
          fetchApi(`/warehouses/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
          })
        )
      );
      setWarehouses((prev) =>
        prev.map((w) => (selectedWarehouseIds.includes(w.id) ? { ...w, ...patch } : w))
      );
      showToast('success', `${selectedWarehouseIds.length} établissement(s) ${label}.`);
      setSelectedWarehouseIds([]);
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la modification groupée.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const confirmBulkDeleteWarehouses = async () => {
    if (selectedWarehouseIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const deletable = warehouses.filter((w) => selectedWarehouseIds.includes(w.id) && !w.isDefault);
      const skipped = selectedWarehouseIds.length - deletable.length;
      await Promise.allSettled(
        deletable.map((w) => fetchApi(`/warehouses/${w.id}`, { method: 'DELETE' }))
      );
      const delSet = new Set(deletable.map((w) => w.id));
      setWarehouses((prev) => prev.filter((w) => !delSet.has(w.id)));
      setSelectedWarehouseIds([]);
      setIsBulkDeleteOpen(false);
      showToast(
        'success',
        `${deletable.length} établissement(s) supprimé(s)${skipped > 0 ? ` (${skipped} principal ignoré)` : ''}.`
      );
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la suppression groupée.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Toggle node in tree
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAllTree = () => {
    const all: Record<string, boolean> = {};
    warehouses.forEach((w) => {
      all[w.id] = true;
      w.aisles.forEach((a) => {
        all[a.id] = true;
        a.tarmas.forEach((t) => {
          all[t.id] = true;
          t.shelves.forEach((s) => {
            all[s.id] = true;
          });
        });
      });
    });
    setExpandedNodes(all);
  };

  const collapseAllTree = () => {
    setExpandedNodes({});
  };

  // Load real warehouses and PostgreSQL Stock rows
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [whRes, rawStock] = await Promise.all([
        fetchApi('/warehouses').catch(() => []),
        fetchAllPaginated<any>('/inventory/stock', 200).then((r) => r.items).catch(() => []),
      ]);
      const rawWh = Array.isArray(whRes) ? whRes : whRes?.data || [];

      if (Array.isArray(rawWh) && rawWh.length > 0) {
        const stockByWh = new Map<string, StorageArticle[]>();
        for (const s of Array.isArray(rawStock) ? rawStock : []) {
          const whId = s.warehouseId || s.warehouse?.id;
          if (!whId) continue;
          const prod = s.variant?.product;
          const art: StorageArticle = {
            id: s.id || s.variantId,
            sku: s.variant?.sku || prod?.sku || 'SKU',
            name: `${prod?.name || 'Article'}${s.variant?.name && s.variant.name !== 'Standard' ? ` (${s.variant.name})` : ''}`,
            imageUrl: prod?.images?.[0]?.url || undefined,
            sellingPrice: Number(s.variant?.sellingPrice || prod?.discountPrice || prod?.sellingPrice || 0),
            physicalQty: Number(s.physicalQty || 0),
            reservedQty: Number(s.reservedQty || 0),
            reorderPoint: Number(s.reorderPoint || 10),
            categoryName: prod?.category?.name || 'Catalogue Royal',
          };
          if (!stockByWh.has(whId)) stockByWh.set(whId, []);
          stockByWh.get(whId)!.push(art);
        }

        const merged: WarehouseItem[] = rawWh.map((item: any) => {
          const whArts = stockByWh.get(item.id) || [];
          const totalQty = whArts.reduce((sum, a) => sum + a.physicalQty, 0);
          const surface = Number(item.surfaceM2 || 0);
          const maxCap = Number(item.maxPallets || 0);
          const used = maxCap > 0 ? Math.min(maxCap, Math.round(totalQty / 80)) : Math.round(totalQty / 80);
          return {
            id: item.id,
            name: item.name,
            code: item.code,
            type: item.isDefault ? 'CENTRAL_HUB' : 'STORE_RESERVE',
            address: item.address || 'Adresse à compléter',
            city: item.city || 'Tunis',
            country: item.country || 'TN',
            phone: item.phone || null,
            email: item.email || null,
            managerName: item.manager
              ? `${item.manager.firstName} ${item.manager.lastName}`
              : 'Gestionnaire Logistique',
            surfaceM2: surface,
            maxPallets: maxCap,
            usedPallets: used,
            occupancyPercent: maxCap > 0 ? Math.min(100, Math.round((used / maxCap) * 100)) : 0,
            isActive: item.isActive ?? true,
            isDefault: item.isDefault ?? false,
            directArticles: whArts,
            aisles: [],
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
            createdBy: item.createdBy || 'SYSTEM',
            isUpdated: item.isUpdated || false,
            isDeleted: item.isDeleted || false,
          };
        });
        setWarehouses(merged);
      } else {
        setWarehouses([]);
      }
    } catch {
      setWarehouses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modals
  const openNewModal = (presetType: 'DEPOT' | 'SHOWROOM' = 'DEPOT') => {
    setEditingWarehouse(null);
    const count = warehouses.length + 1;
    if (presetType === 'SHOWROOM') {
      setFormName('');
      setFormCode(`SHR-FLR-${String(count).padStart(2, '0')}`);
      setFormType('STORE_RESERVE');
      setFormCity('Tunis');
      setFormAddress('Avenue Habib Bourguiba');
      setFormSurfaceM2('400');
      setFormMaxPallets('150');
    } else {
      setFormName('');
      setFormCode(`DEP-FLR-${String(count).padStart(2, '0')}`);
      setFormType('SECONDARY');
      setFormCity('Sousse');
      setFormAddress('');
      setFormSurfaceM2('1500');
      setFormMaxPallets('750');
    }
    setFormPhone('');
    setFormEmail('');
    setFormManagerName('');
    setFormIsActive(true);
    setFormIsDefault(false);
    setIsModalOpen(true);
  };

  const openEditModal = (w: WarehouseItem) => {
    setEditingWarehouse(w);
    setFormName(w.name);
    setFormCode(w.code);
    setFormType(w.type);
    setFormCity(w.city);
    setFormAddress(w.address || '');
    setFormPhone(w.phone || '');
    setFormEmail(w.email || '');
    setFormManagerName(w.managerName || '');
    setFormSurfaceM2(String(w.surfaceM2 || 1500));
    setFormMaxPallets(String(w.maxPallets || 800));
    setFormIsActive(w.isActive);
    setFormIsDefault(w.isDefault);
    setIsModalOpen(true);
  };

  // Open Articles Modal for a Warehouse (aggregates direct depot articles + all aisles)
  const openWarehouseArticlesModal = (w: WarehouseItem) => {
    setArticlesModalWarehouse(w);
    const gathered: ModalProductItem[] = [];

    // 1. Direct Depot articles
    if (w.directArticles) {
      w.directArticles.forEach((art) => {
        gathered.push({
          id: art.id,
          sku: art.sku,
          name: `${art.name} (Stock Direct Dépôt)`,
          sellingPrice: art.sellingPrice,
          status: 'PUBLISHED',
          primaryImage: art.imageUrl || '/images/products/placeholder.jpg',
          category: art.categoryName ? { name: art.categoryName } : undefined,
        });
      });
    }

    // 2. Articles in Aisles & Racks
    w.aisles.forEach((a) => {
      if (a.directArticles) {
        a.directArticles.forEach((art) => {
          gathered.push({
            id: art.id,
            sku: art.sku,
            name: `${art.name} (${a.code})`,
            sellingPrice: art.sellingPrice,
            status: 'PUBLISHED',
            primaryImage: art.imageUrl || '/images/products/placeholder.jpg',
            category: art.categoryName ? { name: art.categoryName } : undefined,
          });
        });
      }
      a.tarmas.forEach((t) => {
        t.shelves.forEach((s) => {
          s.articles.forEach((art) => {
            gathered.push({
              id: art.id,
              sku: art.sku,
              name: art.name,
              sellingPrice: art.sellingPrice,
              status: 'PUBLISHED',
              primaryImage: art.imageUrl || '/images/products/placeholder.jpg',
              category: art.categoryName ? { name: art.categoryName } : undefined,
            });
          });
        });
      });
    });
    setModalArticles(gathered);
  };

  // Save warehouse handler
  const handleSaveWarehouse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      showToast('error', 'Le nom et le code de l’entrepôt sont obligatoires.');
      return;
    }

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      city: formCity.trim(),
      address: formAddress.trim() || null,
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
      isActive: formIsActive,
      isDefault: formIsDefault,
    };

    try {
      if (editingWarehouse) {
        await fetchApi(`/warehouses/${editingWarehouse.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });

        setWarehouses((prev) =>
          prev.map((w) =>
            w.id === editingWarehouse.id
              ? {
                  ...w,
                  ...payload,
                  type: formType,
                  managerName: formManagerName || w.managerName,
                  surfaceM2: parseInt(formSurfaceM2, 10) || w.surfaceM2,
                  maxPallets: parseInt(formMaxPallets, 10) || w.maxPallets,
                  updatedAt: new Date().toISOString(),
                  isUpdated: true,
                }
              : w
          )
        );
        showToast('success', `Entrepôt "${payload.name}" mis à jour avec succès.`);
      } else {
        const created = await fetchApi('/warehouses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!created?.id) {
          throw new Error('Réponse serveur invalide lors de la création de l’entrepôt.');
        }

        const newWh: WarehouseItem = {
          id: created.id,
          ...payload,
          ...created,
          type: formType,
          country: created.country || 'TN',
          managerName: formManagerName || 'Responsable Logistique',
          surfaceM2: Number(created.surfaceM2 ?? (parseInt(formSurfaceM2, 10) || 0)),
          maxPallets: Number(created.maxPallets ?? (parseInt(formMaxPallets, 10) || 0)),
          usedPallets: 0,
          occupancyPercent: 0,
          aisles: [],
          createdAt: created.createdAt || new Date().toISOString(),
          updatedAt: created.updatedAt || new Date().toISOString(),
          createdBy: created.createdBy || 'SYSTEM',
          isUpdated: false,
          isDeleted: false,
        };
        setWarehouses((prev) => [newWh, ...prev]);
        showToast('success', `Nouvel entrepôt "${payload.name}" créé avec succès.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de l’enregistrement de l’entrepôt.');
    }
  };

  // Toggle active status
  const handleToggleActive = async (w: WarehouseItem) => {
    const nextState = !w.isActive;
    setWarehouses((prev) =>
      prev.map((item) => (item.id === w.id ? { ...item, isActive: nextState } : item))
    );

    try {
      await fetchApi(`/warehouses/${w.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextState }),
      });

      showToast(
        'success',
        `L’entrepôt "${w.name}" est désormais ${nextState ? 'actif' : 'suspendu'}.`
      );
    } catch (err: any) {
      setWarehouses((prev) =>
        prev.map((item) => (item.id === w.id ? { ...item, isActive: w.isActive } : item))
      );
      showToast('error', err?.message || 'Erreur lors de la mise à jour du statut.');
    }
  };

  // Delete warehouse
  const handleDeleteWarehouse = async () => {
    if (!warehouseToDelete) return;

    if (warehouseToDelete.isDefault) {
      showToast('error', 'Impossible de supprimer le Dépôt principal par défaut.');
      setWarehouseToDelete(null);
      return;
    }

    try {
      await fetchApi(`/warehouses/${warehouseToDelete.id}`, {
        method: 'DELETE',
      });

      setWarehouses((prev) => prev.filter((w) => w.id !== warehouseToDelete.id));
      showToast('success', `Entrepôt "${warehouseToDelete.name}" supprimé.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la suppression.');
    } finally {
      setWarehouseToDelete(null);
    }
  };

  // Filtered warehouses
  const filteredWarehouses = React.useMemo(() => {
    return warehouses.filter((w) => {
      if (establishmentFilter === 'DEPOTS' && w.type === 'STORE_RESERVE') return false;
      if (establishmentFilter === 'SHOWROOMS' && w.type !== 'STORE_RESERVE') return false;
      if (filterCity !== 'ALL' && w.city !== filterCity) return false;
      if (filterStatus === 'ACTIVE' && !w.isActive) return false;
      if (filterStatus === 'INACTIVE' && w.isActive) return false;
      if (filterType !== 'ALL' && w.type !== filterType) return false;
      return true;
    });
  }, [warehouses, establishmentFilter, filterCity, filterStatus, filterType]);

  // Aggregate KPIs
  const totalWarehouses = warehouses.length;
  const depotsCount = warehouses.filter((w) => w.type !== 'STORE_RESERVE').length;
  const showroomsCount = warehouses.filter((w) => w.type === 'STORE_RESERVE').length;
  const activeWarehouses = warehouses.filter((w) => w.isActive).length;
  const totalAisles = warehouses.reduce((acc, w) => acc + w.aisles.length, 0);
  const totalTarmas = warehouses.reduce(
    (acc, w) => acc + w.aisles.reduce((a2, a) => a2 + a.tarmas.length, 0),
    0
  );
  const totalShelves = warehouses.reduce(
    (acc, w) =>
      acc +
      w.aisles.reduce(
        (a2, a) => a2 + a.tarmas.reduce((t2, t) => t2 + t.shelves.length, 0),
        0
      ),
    0
  );
  const avgOccupancy = (
    warehouses.reduce((acc, w) => acc + (w.occupancyPercent || 0), 0) / (warehouses.length || 1)
  ).toFixed(1);

  // Table Columns Definition (Code folded cleanly under Name to prevent horizontal scroll)
  const columns: ColumnDef<WarehouseItem>[] = [
    {
      key: 'name',
      header: 'Établissement & Code',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-neutral-950 text-xs flex-wrap">
            {item.type === 'STORE_RESERVE' ? (
              <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : (
              <Warehouse className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            )}
            <span className="truncate max-w-[230px]" title={item.name}>
              {item.name}
            </span>
            {item.isDefault && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Principal
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-sans flex-wrap">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
              {item.code}
            </span>
            <span>• {item.managerName || 'Non assigné'}</span>
            {item.surfaceM2 && (
              <span className="text-[10px] text-neutral-400 font-mono">
                • {item.surfaceM2.toLocaleString()} m²
              </span>
            )}
          </div>
        </div>
      ),
      printRender: (item) => `${item.code} - ${item.name}`,
    },
    {
      key: 'city',
      header: 'Ville & Localisation',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span>{item.city}</span>
          </div>
          <div className="text-[11px] text-neutral-400 truncate max-w-[220px]" title={item.address || ''}>
            {item.address || 'Adresse principale'}
          </div>
        </div>
      ),
      printRender: (item) => `${item.city} (${item.address || ''})`,
    },
    {
      key: 'arborescence',
      header: 'Arborescence Physique',
      sortable: true,
      sortValue: (item) => item.aisles.length,
      className: 'text-center whitespace-nowrap',
      render: (item) => {
        const aislesCount = item.aisles.length;
        const tarmasCount = item.aisles.reduce((acc, a) => acc + a.tarmas.length, 0);
        const shelvesCount = item.aisles.reduce(
          (acc, a) => acc + a.tarmas.reduce((t2, t) => t2 + t.shelves.length, 0),
          0
        );
        return (
          <button
            type="button"
            onClick={() => openWarehouseArticlesModal(item)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer border border-neutral-200/80"
            title="Consulter l'inventaire physique et les articles de ce dépôt"
          >
            <FolderTree className="w-3 h-3 text-amber-600" />
            <span>
              {aislesCount} Allées • {tarmasCount} Tarmas • {shelvesCount} Étagères
            </span>
          </button>
        );
      },
      printRender: (item) => `${item.aisles.length} allées`,
    },
    {
      key: 'occupancy',
      header: 'Taux Remplissage',
      sortable: true,
      sortValue: (item) => item.occupancyPercent || 0,
      className: 'text-center whitespace-nowrap',
      render: (item) => {
        const pct = item.occupancyPercent || 0;
        return (
          <div className="inline-flex flex-col items-center gap-1 min-w-[90px]">
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                pct < 50 && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                pct >= 50 && pct < 85 && 'bg-amber-50 text-amber-800 border-amber-200',
                pct >= 85 && 'bg-rose-50 text-rose-800 border-rose-200'
              )}
            >
              {pct}%
            </span>
            <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  pct < 50 && 'bg-emerald-500',
                  pct >= 50 && pct < 85 && 'bg-amber-500',
                  pct >= 85 && 'bg-rose-500'
                )}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
      printRender: (item) => `${item.occupancyPercent || 0}%`,
    },
    {
      key: 'status',
      header: 'Statut Opérationnel',
      sortable: true,
      sortValue: (item) => (item.isActive ? 1 : 0),
      className: 'text-center whitespace-nowrap',
      render: (item) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider',
            item.isActive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
          )}
        >
          {item.isActive ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Opérationnel</span>
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 text-neutral-400" />
              <span>Suspendu</span>
            </>
          )}
        </span>
      ),
      printRender: (item) => (item.isActive ? 'Opérationnel' : 'Suspendu'),
    },
    {
      key: 'createdAt',
      header: 'Date Création',
      sortable: true,
      sortValue: (item) => new Date(item.createdAt).getTime(),
      className: 'whitespace-nowrap text-neutral-500 font-mono text-[11px]',
      render: (item) =>
        new Date(item.createdAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      printRender: (item) => new Date(item.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap no-print',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* 1. View / Inspect Arborescence Modal */}
          <button
            type="button"
            onClick={() => setInspectingWarehouse(item)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs cursor-pointer"
            title="Inspecter la structure et les râteliers"
          >
            <FolderTree className="w-3.5 h-3.5 text-neutral-600" />
          </button>

          {/* 2. Toggle Active Status */}
          <button
            type="button"
            onClick={() => handleToggleActive(item)}
            className={cn(
              'p-1.5 rounded-lg border transition shadow-2xs cursor-pointer',
              item.isActive
                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100'
                : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
            )}
            title={item.isActive ? 'Désactiver l’entrepôt' : 'Activer l’entrepôt'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>

          {/* 3. Edit Warehouse */}
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs cursor-pointer"
            title="Modifier les paramètres"
          >
            <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
          </button>

          {/* 4. Delete Warehouse */}
          {!item.isDefault && (
            <button
              type="button"
              onClick={() => setWarehouseToDelete(item)}
              className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-rose-50 text-rose-600 hover:border-rose-200 transition shadow-2xs cursor-pointer"
              title="Supprimer l'entrepôt"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
      printRender: () => '',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback Notification */}
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type === 'error' ? 'error' : 'success'}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Unified Card Header with Actions */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-black text-xl text-neutral-950 tracking-tight">
              Entrepôts, Hubs & Showrooms Commerciaux
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
              MULTI-SITES ROYAL
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            Cartographie physique des dépôts de transit, entrepôts régionaux et réserves des boutiques/showrooms Royal avec gestion des râteliers Tarma et allées.
          </p>
          <Breadcrumb
            className="mt-2 text-xs"
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Approvisionnement & Stock', href: '/dashboard/suppliers' },
              { label: 'Entrepôts & Showrooms', href: '/dashboard/warehouses' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => openNewModal('DEPOT')}
            variant="outline"
            leftIcon={<Warehouse className="w-3.5 h-3.5 text-neutral-600" />}
            className="text-xs py-2 px-3.5 shadow-2xs bg-white text-neutral-800 hover:bg-neutral-50"
          >
            Nouveau Dépôt
          </Button>
          <Button
            onClick={() => openNewModal('SHOWROOM')}
            variant="gold"
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs py-2 px-4 shadow-sm"
          >
            Nouveau Showroom
          </Button>
        </div>
      </div>

      {/* 2. KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Établissements
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {totalWarehouses}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Dépôts & Showrooms</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Dépôts Logistiques
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              {depotsCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Hubs & Entrepôts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Showrooms & Boutiques
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {showroomsCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Points de vente physiques</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Allées & Tarmas
            </span>
            <span className="text-2xl font-black text-purple-600 mt-1 block">
              {totalAisles} / {totalTarmas}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Équipements & Râteliers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Taux Remplissage
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {avgOccupancy}%
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Capacité globale exploitée</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2.5 Segmented Filter Tabs for Establishment Categories */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 no-print overflow-x-auto">
        <button
          type="button"
          onClick={() => setEstablishmentFilter('ALL')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            establishmentFilter === 'ALL'
              ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-2xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <span>Tous les Établissements</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-inherit font-mono">
            {warehouses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEstablishmentFilter('DEPOTS')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            establishmentFilter === 'DEPOTS'
              ? 'bg-neutral-800 text-white shadow-2xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <Warehouse className="w-3.5 h-3.5 text-amber-500" />
          <span>Dépôts & Hubs Logistiques</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-inherit font-mono">
            {depotsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEstablishmentFilter('SHOWROOMS')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            establishmentFilter === 'SHOWROOMS'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Showrooms & Boutiques Commerciales</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-inherit font-mono">
            {showroomsCount}
          </span>
        </button>
      </div>

      {/* 3. Main Data Table with Isolated Filters & Supported Modes */}
      <DataTable<WarehouseItem>
        data={filteredWarehouses}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedWarehouseIds}
        onSelectionChange={setSelectedWarehouseIds}
        onBulkDelete={() => setIsBulkDeleteOpen(true)}
        renderBulkActions={() => (
          <>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkWarehousePatch({ isActive: true }, 'activé(s)')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <_WhActive className="w-3.5 h-3.5" />
              <span>Activer</span>
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkWarehousePatch({ isActive: false }, 'suspendu(s)')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <_WhPause className="w-3.5 h-3.5" />
              <span>Suspendre</span>
            </button>
            <select
              value=""
              disabled={isBulkUpdating}
              onChange={(e) => {
                const t = e.target.value as 'CENTRAL_HUB' | 'SECONDARY' | 'STORE_RESERVE' | 'TRANSIT';
                if (t) handleBulkWarehousePatch({ type: t }, 'changé(s) de type');
              }}
              aria-label="Changer le type d’établissement"
              className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
            >
              <option value="">Type...</option>
              <option value="CENTRAL_HUB">Hub Central</option>
              <option value="SECONDARY">Dépôt Secondaire</option>
              <option value="STORE_RESERVE">Showroom / Réserve</option>
              <option value="TRANSIT">Transit</option>
            </select>
          </>
        )}
        searchPlaceholder="Rechercher par nom, code, ville, responsable ou adresse..."
        searchKeys={['name', 'code', 'city', 'address', 'managerName']}
        supportedModes={['table', 'list', 'matrix', 'tree']}
        defaultMode="table"
        exportFileName="entrepots_arborescence_royal"
        customFilters={[
          {
            key: 'city',
            label: 'Ville',
            value: filterCity,
            onChange: setFilterCity,
            allLabel: 'Toutes les villes',
            options: CITY_OPTIONS.map((c) => ({ value: c.code, label: c.label })),
          },
          {
            key: 'type',
            label: 'Type',
            value: filterType,
            onChange: setFilterType,
            allLabel: 'Tous les types',
            options: [
              { value: 'CENTRAL_HUB', label: 'Hubs Principaux' },
              { value: 'SECONDARY', label: 'Entrepôts Secondaires' },
              { value: 'STORE_RESERVE', label: 'Réserves Boutiques' },
            ],
          },
          {
            key: 'status',
            label: 'Statut',
            value: filterStatus,
            onChange: setFilterStatus,
            allLabel: 'Tous statuts',
            options: [
              { value: 'ACTIVE', label: 'Opérationnels' },
              { value: 'INACTIVE', label: 'Suspendus' },
            ],
          },
        ]}
        /* Mode Liste */
        renderListItem={(item, isSelected, onSelect, isChecked, onToggleCheck) => (
          <div
            onClick={onSelect}
            className={`p-4 bg-white rounded-2xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-amber-300 transition ${
              isChecked ? 'border-[#C59B27] ring-2 ring-[#C59B27]/20 bg-[#FBF9F4]/30' : 'border-neutral-200/80'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 w-full md:w-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCheck?.(e);
                }}
                aria-label={`Sélectionner ${item.name}`}
                className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                  isChecked
                    ? 'bg-[#C59B27] border-[#C59B27] text-white'
                    : 'border-neutral-300 bg-white hover:border-[#C59B27]'
                }`}
              >
                {isChecked && <_WhCheck className="w-3 h-3" />}
              </button>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <Warehouse className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                    {item.code}
                  </span>
                  <h3 className="font-bold text-sm text-neutral-900">{item.name}</h3>
                  {item.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      Hub Principal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {item.city} ({item.address || 'Adresse'})
                  </span>
                  <span>•</span>
                  <span>Responsable: {item.managerName || 'N/A'}</span>
                  <span>•</span>
                  <span>{item.surfaceM2 || 1200} m²</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end md:self-center">
              <div className="text-right">
                <span className="text-[11px] text-neutral-400 block">Remplissage</span>
                <span className="text-xs font-bold text-neutral-900 font-mono">
                  {item.occupancyPercent || 0}% ({item.usedPallets || 0} / {item.maxPallets || 0} pal.)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingWarehouse(item)}
                className="text-xs px-3 py-1.5"
                leftIcon={<FolderTree className="w-3.5 h-3.5" />}
              >
                Arborescence
              </Button>
            </div>
          </div>
        )}
        /* Mode Matrix / Grid */
        renderMatrixCard={(item, isChecked, onToggleCheck) => (
          <div
            className={`p-4 sm:p-5 bg-white rounded-2xl border shadow-xs flex flex-col justify-between hover:border-amber-300 transition space-y-4 ${
              isChecked ? 'border-[#C59B27] ring-2 ring-[#C59B27]/20 bg-[#FBF9F4]/30' : 'border-neutral-200/80'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
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
                      ? 'bg-[#C59B27] border-[#C59B27] text-white'
                      : 'border-neutral-300 bg-white hover:border-[#C59B27]'
                  }`}
                >
                  {isChecked && <_WhCheck className="w-3 h-3" />}
                </button>
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold shrink-0">
                  <Warehouse className="w-5 h-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {item.code}
                  </span>
                  <h4 className="font-bold text-xs text-neutral-900 mt-1 line-clamp-1">{item.name}</h4>
                </div>
              </div>
              {item.isDefault && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  Principal
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs text-neutral-600 bg-neutral-50/60 p-3 rounded-xl border border-neutral-100 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Ville :</span>
                <span className="font-semibold text-neutral-800">{item.city}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Allées & Zones :</span>
                <span className="font-bold text-neutral-800">{item.aisles.length} allée(s)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Tarmas / Râteliers :</span>
                <span className="font-bold text-neutral-800">
                  {item.aisles.reduce((acc, a) => acc + a.tarmas.length, 0)} tarmas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Occupation :</span>
                <span className="font-mono font-bold text-amber-700">{item.occupancyPercent || 0}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingWarehouse(item)}
                className="w-full text-xs py-1.5 flex items-center justify-center gap-1.5"
              >
                <FolderTree className="w-3.5 h-3.5 text-neutral-600" />
                <span>Explorer l'Arborescence</span>
              </Button>
            </div>
          </div>
        )}
        /* Mode Tree: Hierarchical Storage Explorer (Entrepôt ➔ Allées ➔ Tarmas ➔ Étagères ➔ Articles) */
        renderTreeMode={() => (
          <div className="space-y-4">
            {/* Tree Toolbar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <FolderTree className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-neutral-900">
                    Arborescence Hiérarchique Physique des Stocks
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Structure complète : Entrepôt ➔ Allée / Emplacement ➔ Râtelier Tarma ➔ Étagère ➔ Articles
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Filtrer un râtelier, SKU ou allée..."
                    value={treeSearchQuery}
                    onChange={(e) => setTreeSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-neutral-950"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAllTree}
                  className="text-xs py-1.5 px-2.5"
                  title="Déplier tout"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAllTree}
                  className="text-xs py-1.5 px-2.5"
                  title="Replier tout"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Tree Branches */}
            <div className="space-y-4 pt-1">
              {filteredWarehouses.map((wh) => {
                const isWhExpanded = !!expandedNodes[wh.id];
                return (
                  <div
                    key={wh.id}
                    className="rounded-2xl border border-neutral-200/90 bg-white overflow-hidden shadow-xs"
                  >
                    {/* LEVEL 1: WAREHOUSE ROW */}
                    <div
                      onClick={() => toggleNode(wh.id)}
                      className="p-3.5 bg-gradient-to-r from-amber-50/70 via-neutral-50/60 to-white flex items-center justify-between cursor-pointer border-b border-neutral-200/80 hover:bg-amber-50/90 transition select-none"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="w-6 h-6 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
                        >
                          {isWhExpanded ? (
                            <ChevronDown className="w-4 h-4 text-amber-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                          <Warehouse className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-200/80 text-amber-950 border border-amber-300">
                              {wh.code}
                            </span>
                            <span className="font-heading font-black text-sm text-neutral-900">
                              {wh.name}
                            </span>
                            {wh.isDefault && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-600 text-white">
                                Hub Principal
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 font-sans">
                            {wh.city} • {wh.surfaceM2} m² • Responsable: {wh.managerName || 'N/A'} • {wh.aisles.length} Allée(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                          {getWarehouseTotalPhysicalQty(wh)} unités au dépôt
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-neutral-800 border border-neutral-200 font-mono">
                          {wh.occupancyPercent || 0}% Occupé
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWarehouseArticlesModal(wh);
                          }}
                          className="text-xs py-1 px-2.5 bg-white text-neutral-700"
                        >
                          Voir Articles
                        </Button>
                      </div>
                    </div>

                    {/* LEVEL 2: AISLES / ZONES & DIRECT GENERAL DEPOT STORAGE */}
                    {isWhExpanded && (
                      <div className="p-3 sm:p-5 space-y-3 bg-neutral-50/30">
                        {/* DIRECT DEPOT GENERAL STOCK BRANCH (NON AFFECTÉ AUX ALLÉES) */}
                        {wh.directArticles && wh.directArticles.length > 0 && (
                          <div className="rounded-xl border border-amber-200/90 bg-amber-50/40 p-3 sm:p-4 shadow-2xs ml-2 sm:ml-5 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center text-xs shrink-0 font-bold">
                                  <Package className="w-3.5 h-3.5 text-amber-900" />
                                </div>
                                <div>
                                  <span className="font-heading font-black text-xs text-neutral-900">
                                    Stock Dépôt Général (Non affecté aux allées)
                                  </span>
                                  <span className="text-[10px] text-amber-800 block">
                                    Articles stockés directement dans le dépôt sans affectation d'allée spécifique
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-amber-900 border border-amber-300 font-mono">
                                {wh.directArticles.reduce((acc, a) => acc + a.physicalQty, 0)} unités directes
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                              {wh.directArticles.map((art) => (
                                <div
                                  key={art.id}
                                  className="p-2.5 rounded-lg border border-amber-200/80 bg-white flex items-center justify-between gap-2 shadow-2xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 shrink-0 overflow-hidden flex items-center justify-center">
                                      {art.imageUrl ? (
                                        <img src={art.imageUrl} alt={art.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package className="w-4 h-4 text-amber-600" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-mono text-[9px] font-bold text-neutral-500 block truncate">
                                        {art.sku}
                                      </span>
                                      <span className="font-bold text-xs text-neutral-900 block truncate" title={art.name}>
                                        {art.name}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 block">
                                      {art.physicalQty} en stock
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {wh.aisles.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-neutral-200 text-center text-xs text-neutral-400 font-mono">
                            Aucune allée ou zone physique configurée pour cet entrepôt.
                          </div>
                        ) : (
                          wh.aisles.map((aisle) => {
                            const isAisleExpanded = !!expandedNodes[aisle.id];
                            return (
                              <div
                                key={aisle.id}
                                className="rounded-xl border border-neutral-200/80 bg-white overflow-hidden shadow-2xs ml-2 sm:ml-5"
                              >
                                {/* AISLE HEADER */}
                                <div
                                  onClick={() => toggleNode(aisle.id)}
                                  className="px-4 py-2.5 bg-neutral-50/80 flex items-center justify-between cursor-pointer border-b border-neutral-200/70 hover:bg-neutral-100/60 transition select-none"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="button"
                                      className="w-5 h-5 rounded-md bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
                                    >
                                      {isAisleExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-blue-700" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                                      )}
                                    </button>
                                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs shrink-0">
                                      <Columns className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-mono text-xs font-bold text-blue-950 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                                      {aisle.code}
                                    </span>
                                    <span className="text-xs font-bold text-neutral-900">
                                      {aisle.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                                      {getAisleTotalPhysicalQty(aisle)} unités en allée
                                    </span>
                                    <span className="text-[11px] font-mono text-neutral-400">
                                      {aisle.tarmas.length} Tarma(s)
                                    </span>
                                  </div>
                                </div>

                                {/* LEVEL 3: TARMAS / RACKS */}
                                {isAisleExpanded && (
                                  <div className="p-3 sm:p-4 space-y-2.5 bg-neutral-50/20 ml-2 sm:ml-4">
                                    {aisle.tarmas.length === 0 ? (
                                      <div className="p-3 text-center text-[11px] text-neutral-400 font-mono italic">
                                        Aucun équipement Tarma dans cette allée.
                                      </div>
                                    ) : (
                                      aisle.tarmas.map((tarma) => {
                                        const isTarmaExpanded = !!expandedNodes[tarma.id];
                                        return (
                                          <div
                                            key={tarma.id}
                                            className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs"
                                          >
                                            {/* TARMA HEADER */}
                                            <div
                                              onClick={() => toggleNode(tarma.id)}
                                              className="px-3.5 py-2 bg-purple-50/40 flex items-center justify-between cursor-pointer border-b border-neutral-200/60 hover:bg-purple-50/70 transition select-none"
                                            >
                                              <div className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  className="w-4 h-4 rounded bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 shrink-0"
                                                >
                                                  {isTarmaExpanded ? (
                                                    <ChevronDown className="w-3 h-3 text-purple-700" />
                                                  ) : (
                                                    <ChevronRight className="w-3 h-3 text-neutral-400" />
                                                  )}
                                                </button>
                                                <Boxes className="w-3.5 h-3.5 text-purple-700" />
                                                <span className="font-mono text-[11px] font-bold text-purple-900 px-1.5 py-0.2 rounded bg-purple-100 border border-purple-200">
                                                  {tarma.code}
                                                </span>
                                                <span className="text-xs font-semibold text-neutral-800">
                                                  {tarma.name}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono font-bold text-purple-900 bg-purple-100/90 px-2 py-0.5 rounded-md border border-purple-200">
                                                  {getTarmaTotalPhysicalQty(tarma)} unités
                                                </span>
                                                <span className="text-[10px] font-mono text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                                  {tarma.shelves.length} Étagère(s)
                                                </span>
                                              </div>
                                            </div>

                                            {/* LEVEL 4: SHELVES & ARTICLES */}
                                            {isTarmaExpanded && (
                                              <div className="p-3 space-y-2 bg-white">
                                                {tarma.shelves.length === 0 ? (
                                                  <div className="p-2 text-center text-[10px] text-neutral-400 font-mono">
                                                    Aucune étagère configurée sur ce râtelier.
                                                  </div>
                                                ) : (
                                                  tarma.shelves.map((shelf) => (
                                                    <div
                                                      key={shelf.id}
                                                      className="p-2.5 rounded-lg border border-neutral-200/70 bg-neutral-50/50 space-y-2"
                                                    >
                                                      <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                          <Layers className="w-3.5 h-3.5 text-emerald-700" />
                                                          <span className="font-mono text-[11px] font-bold text-emerald-900 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200">
                                                            {shelf.code}
                                                          </span>
                                                          <span className="text-xs font-medium text-neutral-800">
                                                            {shelf.name}
                                                          </span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-neutral-500">
                                                          Max: {shelf.maxWeightKg || 800} kg • {shelf.articles.length} article(s)
                                                        </span>
                                                      </div>

                                                      {/* LEVEL 5: ARTICLES TILES */}
                                                      {shelf.articles.length > 0 && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                                          {shelf.articles.map((art) => (
                                                            <div
                                                              key={art.id}
                                                              className="p-2.5 rounded-lg border border-neutral-200 bg-white flex items-center justify-between gap-2 shadow-2xs"
                                                            >
                                                              <div className="flex items-center gap-2 min-w-0">
                                                                <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                                                                  {art.imageUrl ? (
                                                                    <img
                                                                      src={art.imageUrl}
                                                                      alt={art.name}
                                                                      className="w-full h-full object-cover"
                                                                    />
                                                                  ) : (
                                                                    <Package className="w-4 h-4 text-neutral-400" />
                                                                  )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                  <span className="font-mono text-[9px] font-bold text-neutral-500 block truncate">
                                                                    {art.sku}
                                                                  </span>
                                                                  <span
                                                                    className="font-bold text-xs text-neutral-900 block truncate"
                                                                    title={art.name}
                                                                  >
                                                                    {art.name}
                                                                  </span>
                                                                </div>
                                                              </div>

                                                              <div className="text-right shrink-0">
                                                                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 block">
                                                                  {art.physicalQty} en stock
                                                                </span>
                                                                {art.reservedQty > 0 && (
                                                                  <span className="text-[9px] font-mono text-amber-600 block mt-0.5">
                                                                    ({art.reservedQty} rés.)
                                                                  </span>
                                                                )}
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      />

      {/* ══════════════════════════════════════════════════════════════════════════════════
          REUSABLE WIDE ARTICLES MODAL FOR WAREHOUSE
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <RelatedArticlesModal
        isOpen={!!articlesModalWarehouse}
        onClose={() => {
          setArticlesModalWarehouse(null);
          setModalArticles([]);
        }}
        title={articlesModalWarehouse ? `Inventaire & Articles — ${articlesModalWarehouse.name}` : ''}
        subtitle={`${modalArticles.length} article(s) localisé(s) dans l’arborescence physique de ce dépôt`}
        articles={modalArticles}
      />

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL: INSPECTER L’ARBORESCENCE D’UN ENTREPÔT
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!inspectingWarehouse}
        onClose={() => setInspectingWarehouse(null)}
        title={inspectingWarehouse ? `Fiche Technique Dépôt : ${inspectingWarehouse.code}` : ''}
        subtitle={inspectingWarehouse ? `${inspectingWarehouse.name} (${inspectingWarehouse.city})` : ''}
        type="details"
        size="lg"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectingWarehouse(null)}
              className="text-xs"
            >
              Fermer
            </Button>
          </div>
        }
      >
        {inspectingWarehouse && (
          <div className="p-6 space-y-5 text-xs">
            {/* Top Stat Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Surface Utile
                </span>
                <span className="text-lg font-black text-neutral-900 mt-0.5 block font-mono">
                  {inspectingWarehouse.surfaceM2 || 1200} m²
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Capacité Palettes
                </span>
                <span className="text-lg font-black text-neutral-900 mt-0.5 block font-mono">
                  {inspectingWarehouse.maxPallets || 800} pal.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Palettes Occupées
                </span>
                <span className="text-lg font-black text-amber-700 mt-0.5 block font-mono">
                  {inspectingWarehouse.usedPallets || 0} pal. ({inspectingWarehouse.occupancyPercent || 0}%)
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Responsable
                </span>
                <span className="text-xs font-bold text-neutral-900 mt-1 block truncate">
                  {inspectingWarehouse.managerName || 'Non assigné'}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-4 rounded-xl bg-white border border-neutral-200 space-y-2">
              <h4 className="font-bold text-neutral-900">Coordonnées & Accès Quai</h4>
              <p className="text-neutral-600">
                <strong>Adresse :</strong> {inspectingWarehouse.address || 'Non renseignée'}
              </p>
              <div className="flex items-center gap-4 text-neutral-600 flex-wrap">
                <span>
                  <strong>Téléphone :</strong> {inspectingWarehouse.phone || '+216 73 300 400'}
                </span>
                <span>
                  <strong>Email :</strong> {inspectingWarehouse.email || 'depot@royal.com.tn'}
                </span>
              </div>
            </div>

            {/* Visual Scheme / Location Overview */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-neutral-900">Schéma des Allées & Équipements Tarma</h4>
                <span className="text-[10px] font-mono text-neutral-500">
                  {inspectingWarehouse.aisles.length} Allées au plan
                </span>
              </div>

              <div className="space-y-2">
                {inspectingWarehouse.aisles.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-white border border-neutral-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-900 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                          {a.code}
                        </span>
                        <span className="font-bold text-neutral-900">{a.name}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {a.tarmas.length} râtelier(s) Tarma
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {a.tarmas.map((t) => (
                        <span
                          key={t.id}
                          className="px-2 py-1 rounded bg-purple-50 border border-purple-200 text-purple-900 font-mono text-[10px]"
                        >
                          {t.code} ({t.shelves.length} étagères)
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

          {/* MODAL: CRÉER / MODIFIER ENTREPÔT */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDeleteWarehouses}
        isDeleting={isBulkUpdating}
        title="Supprimer les établissements sélectionnés"
        description={`Confirmez-vous la suppression de ${selectedWarehouseIds.length} établissement(s) ? Les dépôts principaux par défaut sont protégés et conservés.`}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingWarehouse
            ? `Modifier ${editingWarehouse.type === 'STORE_RESERVE' ? 'le Showroom' : 'l’Entrepôt'} ${editingWarehouse.code}`
            : 'Créer un Nouvel Établissement (Dépôt ou Showroom)'
        }
        subtitle="Renseignez les paramètres logistiques et l'affectation territoriale."
        type={editingWarehouse ? 'edit' : 'create'}
        size="4xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="warehouse-form"
              variant="gold"
              size="sm"
              className="text-xs py-2 px-5"
            >
              {editingWarehouse ? 'Enregistrer les Modifications' : 'Créer l’Entrepôt'}
            </Button>
          </div>
        }
      >
        <form id="warehouse-form" onSubmit={handleSaveWarehouse} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={formType === 'STORE_RESERVE' ? "Nom du Showroom / Boutique *" : "Nom du Dépôt / Entrepôt *"}
              placeholder={formType === 'STORE_RESERVE' ? "ex: Showroom Tunis — Les Berges du Lac II" : "ex: Dépôt Sousse — Hub Central"}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <Input
              label="Code Logistique Unique *"
              placeholder={formType === 'STORE_RESERVE' ? "ex: SHR-LAC2-01" : "ex: DEP-SOUSSE-01"}
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Select
                label="Type d’Établissement"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                options={[
                  { value: 'STORE_RESERVE', label: 'Showroom Commercial & Boutique de Vente' },
                  { value: 'CENTRAL_HUB', label: 'Hub Logistique Central' },
                  { value: 'SECONDARY', label: 'Entrepôt Régional Secondaire' },
                  { value: 'TRANSIT', label: 'Plateforme de Transit' },
                ]}
              />
            </div>

            <div>
              <Select
                label="Ville d’Implantation"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                options={[
                  { value: 'Sousse', label: 'Sousse' },
                  { value: 'Tunis', label: 'Tunis' },
                  { value: 'La Marsa', label: 'La Marsa' },
                  { value: 'Sfax', label: 'Sfax' },
                  { value: 'Nabeul', label: 'Nabeul' },
                ]}
              />
            </div>

            <Input
              label="Responsable du Dépôt"
              placeholder="ex: Mounir Zitouni"
              value={formManagerName}
              onChange={(e) => setFormManagerName(e.target.value)}
            />
          </div>

          <Input
            label="Adresse & Zone Industrielle"
            placeholder="ex: Zone Industrielle Sidi Abdelhamid, Sousse"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Téléphone Poste Logistique"
              placeholder="ex: +216 73 300 400"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
            />
            <Input
              label="Email de Réception / Quai"
              placeholder="ex: depot.sousse@royal.com.tn"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Surface Totale (m²)"
              type="number"
              placeholder="ex: 2400"
              value={formSurfaceM2}
              onChange={(e) => setFormSurfaceM2(e.target.value)}
            />
            <Input
              label="Capacité Palettes Max"
              type="number"
              placeholder="ex: 1200"
              value={formMaxPallets}
              onChange={(e) => setFormMaxPallets(e.target.value)}
            />
          </div>

          {/* Visibility / Operational Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <div>
                <span className="font-bold text-neutral-900 block text-xs">Entrepôt Actif</span>
                <span className="text-[11px] text-neutral-500">Autoriser les réceptions et sorties</span>
              </div>
              <Toggle
                checked={formIsActive}
                onChange={setFormIsActive}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <div>
                <span className="font-bold text-neutral-900 block text-xs">Hub Principal</span>
                <span className="text-[11px] text-neutral-500">Destination par défaut des réceptions</span>
              </div>
              <Toggle
                checked={formIsDefault}
                onChange={setFormIsDefault}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL: CONFIRMATION SUPPRESSION
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <DeleteConfirmModal
        isOpen={!!warehouseToDelete}
        onClose={() => setWarehouseToDelete(null)}
        onConfirm={handleDeleteWarehouse}
        title="Supprimer l'entrepôt"
        description={
          warehouseToDelete
            ? `Êtes-vous certain de vouloir supprimer l'entrepôt "${warehouseToDelete.name} (${warehouseToDelete.code})" ? Cette action est irréversible si le dépôt ne contient pas d'articles.`
            : undefined
        }
      />
    </div>
  );
}
