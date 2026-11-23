'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Percent,
  Truck,
  CheckCircle2,
  Calendar,
  Sparkles,
  DollarSign,
  Ticket,
  Search,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Select } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DeleteConfirmModal } from '@/components/ui/modal';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';

export interface CouponItem {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  targetType?: string;
  targetIds?: string[] | null;
  minQuantity?: number | null;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface RealArticleOption {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  sellingPrice: number;
}

interface RealSimpleOption {
  id: string;
  name: string;
}

export default function DashboardCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [realArticles, setRealArticles] = useState<RealArticleOption[]>([]);
  const [realCategories, setRealCategories] = useState<RealSimpleOption[]>([]);
  const [realBrands, setRealBrands] = useState<RealSimpleOption[]>([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [bulkDeleteCouponIds, setBulkDeleteCouponIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<string>('150');
  const [standardShippingFee, setStandardShippingFee] = useState<string>('7');
  const [savingShipping, setSavingShipping] = useState(false);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [minQuantityArticle, setMinQuantityArticle] = useState(2);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING',
    value: 10,
    minOrderAmount: 50,
    maxDiscount: 100,
    usageLimit: 500,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
    targetType: 'ALL' as 'ALL' | 'ARTICLE' | 'CATEGORY' | 'BRAND' | 'CART_TOTAL' | 'QUANTITY' | 'CUSTOMER',
    targetValue: '',
    isActive: true,
  });

  const filteredArticles = useMemo(() => {
    if (!articleSearchQuery.trim()) return realArticles.slice(0, 80);
    const q = articleSearchQuery.toLowerCase();
    return realArticles
      .filter((a) => a.name.toLowerCase().includes(q) || a.sku.toLowerCase().includes(q) || a.categoryName.toLowerCase().includes(q))
      .slice(0, 80);
  }, [realArticles, articleSearchQuery]);

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive).length;
    const totalUsages = coupons.reduce((acc, c) => acc + c.usageCount, 0);
    const percentageCount = coupons.filter((c) => c.type === 'PERCENTAGE').length;
    return { total, active, totalUsages, percentageCount };
  }, [coupons]);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const { items: list } = await fetchAllPaginated<any>('/coupons', 200);
      setCoupons(
        (Array.isArray(list) ? list : []).map((c: any) => ({
          ...c,
          value: Number(c.value || 0),
          minOrderAmount: c.minOrderAmount !== null && c.minOrderAmount !== undefined ? Number(c.minOrderAmount) : null,
          maxDiscount: c.maxDiscount !== null && c.maxDiscount !== undefined ? Number(c.maxDiscount) : null,
        }))
      );
    } catch {
      // keep fallback if unauthorized/offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchApi('/storefront-cms/config')
      .then((res) => {
        const cfg = res?.data || res;
        if (cfg?.freeShippingThreshold !== undefined) setFreeShippingThreshold(String(cfg.freeShippingThreshold));
        if (cfg?.standardShippingFee !== undefined) setStandardShippingFee(String(cfg.standardShippingFee));
      })
      .catch(() => null);
    fetchAllPaginated<any>('/products', 200)
      .then(({ items: list }) => {
        if (Array.isArray(list)) {
          setRealArticles(
            list.map((p: any) => ({
              id: p.id,
              sku: p.sku || '',
              name: p.name || '',
              categoryName: p.category?.name || 'Catalogue',
              sellingPrice: Number(p.discountPrice || p.sellingPrice || 0),
            }))
          );
        }
      })
      .catch(() => null);
    fetchApi('/categories?tree=false')
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list)) {
          setRealCategories(
            list
              .filter((c: any) => c.isActive !== false && Number(c.productsCount ?? c._count?.products ?? 0) > 0)
              .map((c: any) => ({ id: c.id, name: c.name }))
          );
        }
      })
      .catch(() => null);
    fetchApi('/brands')
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list)) {
          setRealBrands(list.filter((b: any) => b.isActive !== false).map((b: any) => ({ id: b.id, name: b.name })));
        }
      })
      .catch(() => null);
  }, []);

  const handleSaveShippingConfig = async () => {
    setSavingShipping(true);
    try {
      await fetchApi('/storefront-cms/shipping-config', {
        method: 'PATCH',
        body: JSON.stringify({
          freeShippingThreshold: Number(freeShippingThreshold) || 0,
          standardShippingFee: Number(standardShippingFee) || 0,
        }),
      });
      setFeedbackMessage(`Seuil livraison gratuite mis à jour à ${freeShippingThreshold} TND.`);
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de la mise à jour du seuil.');
    } finally {
      setSavingShipping(false);
    }
  };

  const openEditCoupon = (row: CouponItem) => {
    setEditingCouponId(row.id);
    const savedTargets = Array.isArray(row.targetIds) ? row.targetIds.map(String) : [];
    setSelectedTargetIds(savedTargets);
    setMinQuantityArticle(row.minQuantity ? Number(row.minQuantity) : 2);
    setArticleSearchQuery('');
    setFormData({
      code: row.code,
      description: row.description || '',
      type: row.type,
      value: Number(row.value || 0),
      minOrderAmount: row.minOrderAmount ? Number(row.minOrderAmount) : 0,
      maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : 100,
      usageLimit: row.usageLimit ? Number(row.usageLimit) : 500,
      startDate: row.startsAt ? new Date(row.startsAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: row.expiresAt ? new Date(row.expiresAt).toISOString().slice(0, 16) : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      targetType: (row.targetType as any) || 'ALL',
      targetValue: savedTargets[0] || '',
      isActive: row.isActive,
    });
    setShowModal(true);
  };

  const toggleArticleTarget = (prodId: string) => {
    setSelectedTargetIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFeedbackMessage('Le code promo est obligatoire.');
      return;
    }
    setCreating(true);

    try {
      const resolvedTargets =
        formData.targetType === 'ARTICLE' || formData.targetType === 'QUANTITY'
          ? selectedTargetIds
          : formData.targetType === 'CATEGORY' || formData.targetType === 'BRAND' || formData.targetType === 'CUSTOMER'
          ? formData.targetValue.trim()
            ? [formData.targetValue.trim()]
            : []
          : [];

      const payload: Record<string, any> = {
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: Number(formData.value) || 0,
        targetType: formData.targetType,
        targetIds: resolvedTargets,
        isActive: formData.isActive,
      };
      if (formData.targetType === 'QUANTITY') payload.minQuantity = Number(minQuantityArticle) || 1;
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.minOrderAmount) payload.minOrderAmount = Number(formData.minOrderAmount);
      if (formData.maxDiscount && formData.type === 'PERCENTAGE') payload.maxDiscount = Number(formData.maxDiscount);
      if (formData.usageLimit) payload.usageLimit = Number(formData.usageLimit);
      if (formData.startDate) payload.startsAt = new Date(formData.startDate).toISOString();
      if (formData.endDate) payload.expiresAt = new Date(formData.endDate).toISOString();

      if (editingCouponId) {
        await fetchApi(`/coupons/${editingCouponId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setFeedbackMessage(`Code promo "${payload.code}" mis à jour avec succès.`);
      } else {
        await fetchApi('/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFeedbackMessage(`Code promo "${payload.code}" créé avec succès.`);
      }

      setShowModal(false);
      setEditingCouponId(null);
      setSelectedTargetIds([]);
      setArticleSearchQuery('');
      setFormData({
        code: '',
        description: '',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 50,
        maxDiscount: 100,
        usageLimit: 500,
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
        targetType: 'ALL',
        targetValue: '',
        isActive: true,
      });
      await fetchCoupons();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de l’enregistrement.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleCoupon = async (coupon: CouponItem) => {
    const next = !coupon.isActive;
    setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, isActive: next } : c)));
    try {
      await fetchApi(`/coupons/${coupon.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      });
      setFeedbackMessage(`Code promo "${coupon.code}" ${next ? 'activé' : 'désactivé'}.`);
    } catch (err: any) {
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, isActive: coupon.isActive } : c)));
      setFeedbackMessage(err?.message || 'Erreur lors de la modification.');
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    try {
      await fetchApi(`/coupons/${id}`, { method: 'DELETE' });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setFeedbackMessage(`Code promo "${code}" supprimé.`);
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleBulkCouponPatch = async (
    patch: { isActive?: boolean; type?: CouponItem['type'] },
    label: string
  ) => {
    if (selectedCouponIds.length === 0) return;
    try {
      await Promise.allSettled(
        selectedCouponIds.map((id) =>
          fetchApi(`/coupons/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
          })
        )
      );
      setFeedbackMessage(`${selectedCouponIds.length} code(s) promo ${label}.`);
      setSelectedCouponIds([]);
      await fetchCoupons();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de la mise à jour groupée.');
    }
  };

  const confirmBulkDeleteCoupons = async () => {
    if (bulkDeleteCouponIds.length === 0) return;
    try {
      await Promise.allSettled(
        bulkDeleteCouponIds.map((id) => fetchApi(`/coupons/${id}`, { method: 'DELETE' }))
      );
      setFeedbackMessage(`${bulkDeleteCouponIds.length} code(s) promo supprimé(s).`);
      setBulkDeleteCouponIds([]);
      setSelectedCouponIds([]);
      await fetchCoupons();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur suppression codes promo.');
    }
  };

  const columns: ColumnDef<CouponItem>[] = [
    {
      key: 'code',
      header: 'Code Promo & Campagne',
      sortable: true,
      sortValue: (row) => row.code,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-black text-neutral-900 text-xs block tracking-wide">
              {row.code}
            </span>
            <span className="text-[11px] text-neutral-500 truncate max-w-[240px] block mt-0.5">
              {row.description || 'Offre promotionnelle'}
            </span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.code} - ${row.description || ''}`,
    },
    {
      key: 'type',
      header: 'Avantage & Remise',
      sortable: true,
      sortValue: (row) => row.value,
      render: (row) => {
        if (row.type === 'PERCENTAGE') {
          return (
            <span className="font-mono font-bold text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              -{row.value}%
            </span>
          );
        }
        if (row.type === 'FIXED_AMOUNT') {
          return (
            <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              -{formatTndCurrency(row.value)}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 font-bold text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <Truck className="w-3.5 h-3.5" />
            <span>Frais Port Offerts</span>
          </span>
        );
      },
      printRender: (row) => row.type === 'PERCENTAGE' ? `-${row.value}%` : row.type === 'FIXED_AMOUNT' ? `-${row.value} TND` : 'Livraison Offerte',
    },
    {
      key: 'minOrderAmount',
      header: 'Min. Panier Requis',
      sortable: true,
      sortValue: (row) => row.minOrderAmount || 0,
      render: (row) => (
        <span className="font-mono text-xs text-neutral-700">
          {row.minOrderAmount ? formatTndCurrency(row.minOrderAmount) : 'Sans minimum'}
        </span>
      ),
      printRender: (row) => row.minOrderAmount ? `${row.minOrderAmount} TND` : 'Sans minimum',
    },
    {
      key: 'usageCount',
      header: 'Utilisations & Plafond',
      sortable: true,
      sortValue: (row) => row.usageCount,
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold font-mono text-neutral-900">{row.usageCount}</span>
          <span className="text-neutral-400 font-mono"> / {row.usageLimit || 'Illimité'}</span>
        </div>
      ),
      printRender: (row) => `${row.usageCount} / ${row.usageLimit || 'Illimité'}`,
    },
    {
      key: 'isActive',
      header: 'Statut',
      sortable: true,
      sortValue: (row) => (row.isActive ? 1 : 0),
      render: (row) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
            row.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
          )}
        >
          {row.isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null}
          <span>{row.isActive ? 'Actif' : 'Désactivé'}</span>
        </span>
      ),
      printRender: (row) => row.isActive ? 'Actif' : 'Désactivé',
    },
    {
      key: 'createdAt',
      header: 'Date de Création',
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => (
        <div className="text-xs text-neutral-600">
          {new Date(row.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      ),
      printRender: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleToggleCoupon(row)}
            className={cn(
              'p-1.5 rounded-lg border transition shadow-2xs cursor-pointer',
              row.isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
            )}
            title={row.isActive ? 'Désactiver ce code promo' : 'Activer ce code promo'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => openEditCoupon(row)}
            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 transition shadow-2xs cursor-pointer"
            title="Modifier ce code promo"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteCoupon(row.id, row.code)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-rose-50 text-neutral-500 hover:text-rose-600 hover:border-rose-200 transition shadow-2xs cursor-pointer"
            title="Supprimer ce code promo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage || ''}
        type="success"
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Page Header Card (Master Layout Standard) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              Codes Promo & Campagnes Promotionnelles
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              COMMERCIAL
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Gérez les remises en pourcentage, bons d’achat en dinars et gratuité des frais de livraison pour le storefront et le checkout.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Marketing & Ventes', href: '/dashboard/orders' },
              { label: 'Codes Promo' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setEditingCouponId(null);
              setSelectedTargetIds([]);
              setArticleSearchQuery('');
              setShowModal(true);
            }}
            variant="gold"
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs py-2 px-5 shadow-sm"
          >
            Nouveau Code Promo
          </Button>
        </div>
      </div>

      {/* Livraison Gratuite Dynamic Threshold Config */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
              Seuil de Livraison Gratuite & Frais Standards (Storefront / Panier)
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Définit le montant minimum de commande qui affiche « Plus que X TND pour débloquer la livraison gratuite » dans le panier.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-3 py-1.5 rounded-xl border border-neutral-200 text-xs">
            <span className="font-semibold text-neutral-600">Seuil gratuit :</span>
            <input
              type="number"
              min="0"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
              className="w-20 px-2 py-1 rounded-lg border border-neutral-300 bg-white font-bold text-neutral-900 text-xs"
            />
            <span className="font-bold text-neutral-500">TND</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-3 py-1.5 rounded-xl border border-neutral-200 text-xs">
            <span className="font-semibold text-neutral-600">Frais livraison :</span>
            <input
              type="number"
              min="0"
              value={standardShippingFee}
              onChange={(e) => setStandardShippingFee(e.target.value)}
              className="w-16 px-2 py-1 rounded-lg border border-neutral-300 bg-white font-bold text-neutral-900 text-xs"
            />
            <span className="font-bold text-neutral-500">TND</span>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={handleSaveShippingConfig}
            disabled={savingShipping}
            className="text-xs px-4 py-2"
          >
            {savingShipping ? 'Enregistrement...' : 'Appliquer'}
          </Button>
        </div>
      </div>

      {/* 4 KPIs Master */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Codes Déclarés</span>
            <Ticket className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">Toutes campagnes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Codes Actifs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {stats.active}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Valides au checkout</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Utilisations Totales</span>
            <Sparkles className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.totalUsages}
          </div>
          <div className="text-[11px] text-neutral-500">Commandes bénéficiaires</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Remises en %</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.percentageCount}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Bons de réduction directe</div>
        </div>
      </div>

      {/* DataTable Master */}
      <DataTable<CouponItem>
        data={coupons}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedCouponIds}
        onSelectionChange={setSelectedCouponIds}
        onBulkDelete={(keys) => setBulkDeleteCouponIds(keys)}
        renderBulkActions={() => (
          <>
            <button
              type="button"
              onClick={() => handleBulkCouponPatch({ isActive: true }, 'activé(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
            >
              Activer
            </button>
            <button
              type="button"
              onClick={() => handleBulkCouponPatch({ isActive: false }, 'désactivé(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer"
            >
              Désactiver
            </button>
          </>
        )}
        searchPlaceholder="Rechercher par code promo, description..."
        searchKeys={['code', 'description', 'type']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        isLoading={isLoading}
        onRefresh={fetchCoupons}
        printTitle="Référentiel des Codes Promotionnels — Royal"
        exportFileName="codes_promo_royal"
      />

      {/* Modale Nouveau Code Promo avec Période Date & Heure + Sélecteur de Cible */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          size="5xl"
          title={
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <span className="font-heading font-black text-lg text-neutral-900 block">
                  {editingCouponId ? 'Modifier le Code Promo' : 'Nouveau Code Promo & Rabais Commercial'}
                </span>
                <span className="text-xs text-neutral-500">
                  Définissez la réduction, la période de validité et la cible d’éligibilité
                </span>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(false)}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handleCreateCoupon}
                disabled={creating || !formData.code.trim()}
                className="text-xs"
              >
                {creating ? 'Enregistrement...' : editingCouponId ? 'Enregistrer les modifications' : 'Créer et activer le Coupon'}
              </Button>
            </div>
          }
        >
          <div className="p-5 sm:p-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Column: Code, Description, Avantage & Période */}
              <div className="space-y-4">
                {/* Code & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                      Code Promotionnel *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="EX: FETE15"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-mono uppercase focus:outline-none focus:border-neutral-950 text-xs font-bold bg-white text-neutral-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                      Campagne Commerciale
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: 15% de remise"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-950 text-xs bg-white text-neutral-900"
                    />
                  </div>
                </div>

                {/* Type d'Avantage, Valeur & Plafond */}
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2.5">
                  <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] block">
                    Type de Réduction & Avantage
                  </span>
                  <div className="grid grid-cols-3 gap-2.5 items-end">
                    <div>
                      <Select
                        label="Type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        options={[
                          { label: 'Pourcentage (%)', value: 'PERCENTAGE', badge: '%' },
                          { label: 'Montant Fixe (TND)', value: 'FIXED_AMOUNT', badge: 'DT' },
                          { label: 'Livraison Offerte', value: 'FREE_SHIPPING', badge: 'GRATUIT' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-bold text-[10px] uppercase tracking-wider mb-1">
                        Valeur {formData.type === 'PERCENTAGE' ? '(%)' : '(DT)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 font-mono text-xs bg-white font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-bold text-[10px] uppercase tracking-wider mb-1">
                        Plafond Max (DT)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxDiscount || ''}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value ? Number(e.target.value) : 100 })}
                        placeholder="Illimité"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 font-mono text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                      />
                    </div>
                  </div>
                </div>

                {/* Période de Validité - Zéro Popover, Zéro Scroll */}
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Période de Validité du Coupon</span>
                    </span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const pad = (n: number) => String(n).padStart(2, '0');
                          const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                          const end30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
                          const end30Str = `${end30.getFullYear()}-${pad(end30.getMonth() + 1)}-${pad(end30.getDate())}T23:59`;
                          setFormData({ ...formData, startDate: nowStr, endDate: end30Str });
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-semibold cursor-pointer shadow-2xs"
                      >
                        30 Jours
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const pad = (n: number) => String(n).padStart(2, '0');
                          const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                          const end90 = new Date(now.getTime() + 90 * 24 * 3600 * 1000);
                          const end90Str = `${end90.getFullYear()}-${pad(end90.getMonth() + 1)}-${pad(end90.getDate())}T23:59`;
                          setFormData({ ...formData, startDate: nowStr, endDate: end90Str });
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-semibold cursor-pointer shadow-2xs"
                      >
                        90 Jours
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const pad = (n: number) => String(n).padStart(2, '0');
                          const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                          setFormData({ ...formData, startDate: nowStr, endDate: '' });
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-semibold cursor-pointer shadow-2xs"
                      >
                        Permanent
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Date & Heure de Début *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 font-mono text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Date & Heure d'Expiration
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        min={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        placeholder="Laisser vide si permanent"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 font-mono text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Cibles d'éligibilité, Articles par rayons, Quotas */}
              <div className="space-y-4">
                {/* Cible d'Application */}
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-3">
                  <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cible d’Application du Code Promo</span>
                  </span>

                  <div className="space-y-2.5">
                    <Select
                      label="Critère de Ciblage *"
                      value={formData.targetType}
                      onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                      options={[
                        { label: 'Tout le panier (Aucune restriction)', value: 'ALL' },
                        { label: 'Par Article spécifique', value: 'ARTICLE', description: 'Cibler un produit du catalogue' },
                        { label: 'Par Rayon / Catégorie', value: 'CATEGORY', description: 'Cibler une famille d’articles' },
                        { label: 'Par Marque / Fabricant', value: 'BRAND', description: 'Cibler les produits d’une marque' },
                        { label: 'Par Montant Total Panier (Seuil min)', value: 'CART_TOTAL' },
                        { label: 'Par Quantité Minimale d’Articles', value: 'QUANTITY', description: 'Exige un quota d’exemplaires' },
                        { label: 'Par Client Spécifique (VIP)', value: 'CUSTOMER', description: 'Restreint à un client donné' },
                      ]}
                    />

                    {formData.targetType === 'ALL' ? (
                      <div className="p-2.5 bg-white rounded-lg border border-neutral-200 text-neutral-500 text-xs italic">
                        Applicable sur l’intégralité de la commande sans restriction d&apos;article.
                      </div>
                    ) : formData.targetType === 'CATEGORY' ? (
                      <Select
                        label="Sélectionnez le Rayon / Catégorie (avec articles)"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                        placeholder="Choisir une catégorie..."
                        searchable={true}
                        options={realCategories.map((c) => ({
                          label: c.name,
                          value: c.id,
                        }))}
                      />
                    ) : formData.targetType === 'BRAND' ? (
                      <Select
                        label="Sélectionnez la Marque Officielle"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                        placeholder="Choisir une marque..."
                        options={realBrands.map((b) => ({
                          label: b.name,
                          value: b.id,
                        }))}
                      />
                    ) : formData.targetType === 'ARTICLE' || formData.targetType === 'QUANTITY' ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                            Articles Ciblés ({selectedTargetIds.length} sélectionné{selectedTargetIds.length > 1 ? 's' : ''})
                          </label>
                          {selectedTargetIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedTargetIds([])}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Vider sélection
                            </button>
                          )}
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={articleSearchQuery}
                            onChange={(e) => setArticleSearchQuery(e.target.value)}
                            placeholder="Rechercher un article par nom, SKU..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                          />
                        </div>

                        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 max-h-40 overflow-y-auto">
                          {filteredArticles.length === 0 ? (
                            <div className="p-3 text-center text-[11px] text-neutral-400">
                              Aucun article trouvé.
                            </div>
                          ) : (
                            filteredArticles.map((art) => {
                              const checked = selectedTargetIds.includes(art.id);
                              return (
                                <label
                                  key={art.id}
                                  className={cn(
                                    'flex items-center justify-between gap-2 px-3 py-2 text-xs cursor-pointer transition',
                                    checked ? 'bg-amber-50/80 font-bold text-neutral-950' : 'hover:bg-neutral-50 text-neutral-700'
                                  )}
                                >
                                  <span className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleArticleTarget(art.id)}
                                      className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-950 shrink-0 cursor-pointer"
                                    />
                                    <span className="truncate">{art.name}</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                                    {art.sku} • {formatTndCurrency(art.sellingPrice)}
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>

                        {formData.targetType === 'QUANTITY' && (
                          <div className="flex items-center gap-2 pt-1.5 border-t border-neutral-200/70">
                            <span className="text-[11px] text-neutral-600 font-bold shrink-0">
                              Quantité min. requise :
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={minQuantityArticle}
                              onChange={(e) => setMinQuantityArticle(Math.max(1, Number(e.target.value)))}
                              className="w-20 px-2.5 py-1 rounded-lg border border-neutral-200 bg-white font-mono text-xs font-bold"
                            />
                            <span className="text-[11px] text-neutral-400 font-medium">unités</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                          {formData.targetType === 'CART_TOTAL' ? 'Montant minimum requis (DT)' : 'Email du Client VIP'}
                        </label>
                        <input
                          type="text"
                          value={formData.targetValue}
                          onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                          placeholder={
                            formData.targetType === 'CART_TOTAL'
                              ? 'Ex: 350.000'
                              : 'Ex: client.vip@royal.com.tn'
                          }
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Quotas, Seuil Minimum & Statut */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                      Seuil Min. (DT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-mono text-xs bg-white text-neutral-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                      Quota Total
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-mono text-xs bg-white text-neutral-900"
                    />
                  </div>

                  <div>
                    <Toggle
                      label="Statut"
                      checked={formData.isActive}
                      onChange={(val) => setFormData({ ...formData, isActive: val })}
                      activeLabel="Actif"
                      inactiveLabel="Inactif"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
      <DeleteConfirmModal
        isOpen={bulkDeleteCouponIds.length > 0}
        onClose={() => setBulkDeleteCouponIds([])}
        onConfirm={confirmBulkDeleteCoupons}
        title="Supprimer les codes promo sélectionnés"
        description={`Confirmez-vous la suppression des ${bulkDeleteCouponIds.length} code(s) promotionnel(s) sélectionné(s) ?`}
      />
    </div>
  );
}
