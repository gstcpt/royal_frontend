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
  CreditCard,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Globe,
  FileText,
  AlertTriangle,
  Truck,
  User,
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
  Breadcrumb,
  Toast,
  Textarea,
  DeleteConfirmModal,
} from '@/components/ui';
import { RelatedArticlesModal, ModalProductItem } from '@/components/dashboard/modal-articles-table';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface SupplierItem {
  id: string;
  name: string;
  code: string;
  supplierType?: 'COMPANY' | 'INDIVIDUAL';
  cin?: string | null;
  contactPerson?: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  taxId: string | null;
  paymentTerms: number | null;
  leadTimeDays?: number | null;
  notes: string | null;
  isActive: boolean;
  productsCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  isUpdated?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

const COUNTRY_OPTIONS = [
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'TR', name: 'Turquie', flag: '🇹🇷' },
  { code: 'CN', name: 'Chine', flag: '🇨🇳' },
];

export default function DashboardSuppliersPage() {
  const [suppliers, setSuppliers] = React.useState<SupplierItem[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<SupplierItem | null>(null);
  const [supplierToDelete, setSupplierToDelete] = React.useState<SupplierItem | null>(null);
  const [selectedSupplierIds, setSelectedSupplierIds] = React.useState<string[]>([]);
  const [bulkDeleteSupplierIds, setBulkDeleteSupplierIds] = React.useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);
  const [articlesModalSupplier, setArticlesModalSupplier] = React.useState<SupplierItem | null>(null);
  const [supplierArticles, setSupplierArticles] = React.useState<ModalProductItem[]>([]);
  const [isArticlesModalLoading, setIsArticlesModalLoading] = React.useState(false);

  // Form State
  const [formSupplierType, setFormSupplierType] = React.useState<'COMPANY' | 'INDIVIDUAL'>('COMPANY');
  const [formName, setFormName] = React.useState('');
  const [formCode, setFormCode] = React.useState('');
  const [formCin, setFormCin] = React.useState('');
  const [formContactPerson, setFormContactPerson] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [formPhone, setFormPhone] = React.useState('');
  const [formAddress, setFormAddress] = React.useState('');
  const [formCity, setFormCity] = React.useState('');
  const [formCountry, setFormCountry] = React.useState('TN');
  const [formTaxId, setFormTaxId] = React.useState('');
  const [formPaymentTerms, setFormPaymentTerms] = React.useState('30');
  const [formLeadTimeDays, setFormLeadTimeDays] = React.useState('7');
  const [formNotes, setFormNotes] = React.useState('');
  const [formIsActive, setFormIsActive] = React.useState(true);

  // Toolbar Filters State
  const [filterType, setFilterType] = React.useState('ALL');
  const [filterStatus, setFilterStatus] = React.useState('ALL');
  const [filterCountry, setFilterCountry] = React.useState('ALL');
  const [filterTerms, setFilterTerms] = React.useState('ALL');

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleBulkSupplierPatch = async (
    patch: { isActive?: boolean; supplierType?: 'COMPANY' | 'INDIVIDUAL' },
    label: string
  ) => {
    if (selectedSupplierIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await Promise.allSettled(
        selectedSupplierIds.map((id) =>
          fetchApi(`/suppliers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
          })
        )
      );
      const idSet = new Set(selectedSupplierIds);
      setSuppliers((prev) => prev.map((s) => (idSet.has(s.id) ? { ...s, ...patch } : s)));
      showToast('success', `${selectedSupplierIds.length} fournisseur(s) ${label}.`);
      setSelectedSupplierIds([]);
    } catch {
      showToast('error', 'Erreur lors de la mise à jour groupée.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const confirmBulkDeleteSuppliers = async () => {
    if (bulkDeleteSupplierIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const idSet = new Set(bulkDeleteSupplierIds);
      const linked = suppliers.filter((s) => idSet.has(s.id) && (s.productsCount || 0) > 0);
      const deletable = suppliers.filter((s) => idSet.has(s.id) && (s.productsCount || 0) === 0);
      await Promise.allSettled(
        deletable.map((s) => fetchApi(`/suppliers/${s.id}`, { method: 'DELETE' }))
      );
      const delSet = new Set(deletable.map((s) => s.id));
      setSuppliers((prev) => prev.filter((s) => !delSet.has(s.id)));
      setBulkDeleteSupplierIds([]);
      setSelectedSupplierIds([]);
      if (linked.length > 0) {
        showToast('error', `${deletable.length} supprimé(s), ${linked.length} ignoré(s) car liés à des articles.`);
      } else {
        showToast('success', `${deletable.length} fournisseur(s) supprimé(s).`);
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Monogram initials fallback
  const getInitials = (text: string) => {
    if (!text) return 'FR';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Load suppliers and catalog products
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [suppliersRes, productsList] = await Promise.all([
        fetchApi('/suppliers').catch(() => null),
        fetchAllPaginated<any>('/products/storefront', 200).then((r) => r.items).catch(() => []),
      ]);
      const productsRes = { data: productsList };

      if (suppliersRes && Array.isArray(suppliersRes)) {
        setSuppliers(suppliersRes);
      } else if (suppliersRes && suppliersRes.data && Array.isArray(suppliersRes.data)) {
        setSuppliers(suppliersRes.data);
      } else {
        setSuppliers([]);
      }

      if (productsRes && productsRes.data && Array.isArray(productsRes.data)) {
        setProducts(productsRes.data);
      }
    } catch {
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal handlers
  const openNewModal = () => {
    setEditingSupplier(null);
    setFormSupplierType('COMPANY');
    setFormName('');
    const nextNum = suppliers.length + 1;
    setFormCode(`SUP-FLR-${String(nextNum).padStart(2, '0')}`);
    setFormCin('');
    setFormContactPerson('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormCity('');
    setFormCountry('TN');
    setFormTaxId('');
    setFormPaymentTerms('30');
    setFormLeadTimeDays('7');
    setFormNotes('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (s: SupplierItem) => {
    setEditingSupplier(s);
    setFormSupplierType(s.supplierType || 'COMPANY');
    setFormName(s.name);
    setFormCode(s.code);
    setFormCin(s.cin || '');
    setFormContactPerson(s.contactPerson || '');
    setFormEmail(s.email || '');
    setFormPhone(s.phone || '');
    setFormAddress(s.address || '');
    setFormCity(s.city || '');
    setFormCountry(s.country || 'TN');
    setFormTaxId(s.taxId || '');
    setFormPaymentTerms(s.paymentTerms !== null ? String(s.paymentTerms) : '30');
    setFormLeadTimeDays(s.leadTimeDays !== null && s.leadTimeDays !== undefined ? String(s.leadTimeDays) : '7');
    setFormNotes(s.notes || '');
    setFormIsActive(s.isActive);
    setIsModalOpen(true);
  };

  // Save supplier handler
  const handleSaveSupplier = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      showToast('error', 'Le nom et le code du fournisseur sont obligatoires.');
      return;
    }

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      supplierType: formSupplierType,
      cin: formSupplierType === 'INDIVIDUAL' ? formCin.trim() || null : null,
      contactPerson: formSupplierType === 'COMPANY' ? formContactPerson.trim() || null : null,
      email: formEmail.trim() || null,
      phone: formPhone.trim() || null,
      address: formAddress.trim() || null,
      city: formCity.trim() || null,
      country: formCountry,
      taxId: formSupplierType === 'COMPANY' ? formTaxId.trim() || null : null,
      paymentTerms: parseInt(formPaymentTerms, 10) || 0,
      leadTimeDays: parseInt(formLeadTimeDays, 10) || 7,
      notes: formNotes.trim() || null,
      isActive: formIsActive,
    };

    try {
      if (editingSupplier) {
        // Update
        const updated = await fetchApi(`/suppliers/${editingSupplier.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });

        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === editingSupplier.id
              ? {
                  ...s,
                  ...payload,
                  ...(updated || {}),
                  updatedAt: new Date().toISOString(),
                  isUpdated: true,
                }
              : s
          )
        );
        showToast('success', `Fournisseur "${payload.name}" mis à jour avec succès.`);
      } else {
        // Create
        const created = await fetchApi('/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!created?.id) {
          throw new Error('Réponse serveur invalide lors de la création du fournisseur.');
        }

        const newSupplier: SupplierItem = {
          id: created.id,
          ...payload,
          ...created,
          productsCount: created.productsCount ?? 0,
          createdAt: created.createdAt || new Date().toISOString(),
          updatedAt: created.updatedAt || new Date().toISOString(),
          createdBy: created.createdBy || 'SYSTEM',
          isUpdated: false,
          isDeleted: false,
        };
        setSuppliers((prev) => [newSupplier, ...prev]);
        showToast('success', `Nouveau fournisseur "${payload.name}" enregistré.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de l’enregistrement du fournisseur.');
    }
  };

  // Toggle supplier active status
  const handleToggleActive = async (s: SupplierItem) => {
    const nextState = !s.isActive;
    setSuppliers((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, isActive: nextState } : item))
    );

    try {
      await fetchApi(`/suppliers/${s.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextState }),
      });

      showToast(
        'success',
        `Le fournisseur "${s.name}" est désormais ${nextState ? 'actif' : 'suspendu'}.`
      );
    } catch (err: any) {
      setSuppliers((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, isActive: s.isActive } : item))
      );
      showToast('error', err?.message || 'Erreur lors du changement de statut.');
    }
  };

  // Delete supplier
  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    if ((supplierToDelete.productsCount || 0) > 0) {
      showToast(
        'error',
        `Impossible de supprimer : ce fournisseur est rattaché à ${supplierToDelete.productsCount} article(s).`
      );
      setSupplierToDelete(null);
      return;
    }

    try {
      await fetchApi(`/suppliers/${supplierToDelete.id}`, {
        method: 'DELETE',
      });

      setSuppliers((prev) => prev.filter((s) => s.id !== supplierToDelete.id));
      showToast('success', `Fournisseur "${supplierToDelete.name}" supprimé avec succès.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la suppression.');
    } finally {
      setSupplierToDelete(null);
    }
  };

  // Filtered suppliers
  const filteredSuppliers = React.useMemo(() => {
    return suppliers.filter((s) => {
      if (filterType !== 'ALL') {
        const isIndiv = s.supplierType === 'INDIVIDUAL';
        if (filterType === 'COMPANY' && isIndiv) return false;
        if (filterType === 'INDIVIDUAL' && !isIndiv) return false;
      }
      if (filterStatus === 'ACTIVE' && !s.isActive) return false;
      if (filterStatus === 'INACTIVE' && s.isActive) return false;
      if (filterCountry !== 'ALL' && s.country !== filterCountry) return false;
      if (filterTerms !== 'ALL') {
        const termsVal = parseInt(filterTerms, 10);
        if (s.paymentTerms !== termsVal) return false;
      }
      return true;
    });
  }, [suppliers, filterType, filterStatus, filterCountry, filterTerms]);

  // Aggregate KPIs
  const totalCount = suppliers.length;
  const activeCount = suppliers.filter((s) => s.isActive).length;
  const totalSuppliedArticles = suppliers.reduce((acc, s) => acc + (s.productsCount || 0), 0);
  const avgPaymentTerms = Math.round(
    suppliers.reduce((acc, s) => acc + (s.paymentTerms || 0), 0) / (suppliers.length || 1)
  );
  const avgLeadTimeDays = (
    suppliers.reduce((acc, s) => acc + (s.leadTimeDays || 7), 0) / (suppliers.length || 1)
  ).toFixed(1);

  // Open Articles Modal with live direct API query to guarantee accurate data
  const handleOpenArticlesModal = async (supplier: SupplierItem) => {
    setArticlesModalSupplier(supplier);
    setIsArticlesModalLoading(true);
    setSupplierArticles([]);
    try {
      const { items: raw } = await fetchAllPaginated<any>(`/products?supplierId=${supplier.id}`, 200).catch(() => ({ items: [] }));
      if (raw.length > 0) {
        const mapped: ModalProductItem[] = raw.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          sellingPrice: p.sellingPrice,
          discountPrice: p.discountPrice,
          status: p.status,
          primaryImage:
            p.images?.find((img: any) => img.isPrimary)?.url ||
            p.images?.[0]?.url ||
            p.primaryImage ||
            '/images/products/placeholder.jpg',
          category: p.category,
          brand: p.brand,
        }));
        setSupplierArticles(mapped);
      } else {
        // Fallback filter if API didn't return direct items
        const fallback: ModalProductItem[] = products
          .filter(
            (p) =>
              p.supplier?.id === supplier.id ||
              (p as any).supplierId === supplier.id ||
              (p.supplier?.code && p.supplier.code === supplier.code)
          )
          .map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            sellingPrice: p.sellingPrice,
            discountPrice: p.discountPrice,
            status: p.status,
            primaryImage: p.primaryImage || '/images/products/placeholder.jpg',
            category: p.category,
            brand: p.brand,
          }));
        setSupplierArticles(fallback);
      }
    } catch {
      setSupplierArticles([]);
    } finally {
      setIsArticlesModalLoading(false);
    }
  };

  // Table Columns Definition (Compacted to 6 Columns to eliminate horizontal overflow)
  const columns: ColumnDef<SupplierItem>[] = [
    {
      key: 'name',
      header: 'Fournisseur & Code',
      sortable: true,
      render: (item) => {
        const countryObj = COUNTRY_OPTIONS.find((c) => c.code === item.country);
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
              {getInitials(item.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-neutral-900 text-xs truncate">{item.name}</span>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F4F5F7] text-[#1D232E] border border-[#E6E1D6]">
                  {item.code}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                <span>{countryObj?.flag || '🌐'}</span>
                <span className="truncate">{item.city ? `${item.city}, ` : ''}{countryObj?.name || item.country}</span>
              </div>
            </div>
          </div>
        );
      },
      printRender: (item) => `${item.code} - ${item.name} (${item.city || ''} ${item.country})`,
    },
    {
      key: 'taxId',
      header: 'Forme & Identification',
      sortable: true,
      sortValue: (item) => item.supplierType || 'COMPANY',
      render: (item) => {
        const isIndiv = item.supplierType === 'INDIVIDUAL';
        return (
          <div className="space-y-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                isIndiv
                  ? 'bg-purple-50 text-purple-900 border-purple-200'
                  : 'bg-[#FBF6E8] text-[#9A7414] border-[#E6D6A6]'
              )}
            >
              {isIndiv ? <User className="w-2.5 h-2.5 text-purple-600" /> : <Building2 className="w-2.5 h-2.5 text-[#C59B27]" />}
              <span>{isIndiv ? 'Particulier' : 'Société'}</span>
            </span>
            <div className="text-[11px] font-mono text-neutral-700">
              {isIndiv ? `CIN: ${item.cin || '—'}` : `MF: ${item.taxId || '—'}`}
            </div>
            {item.contactPerson && (
              <div className="text-[10px] text-neutral-400 truncate max-w-[160px]" title={item.contactPerson}>
                Rép: {item.contactPerson}
              </div>
            )}
          </div>
        );
      },
      printRender: (item) => `${item.supplierType === 'INDIVIDUAL' ? 'Particulier' : 'Société'} (${item.taxId || item.cin || 'N/A'})`,
    },
    {
      key: 'contact',
      header: 'Contact Commercial',
      render: (item) => (
        <div className="space-y-0.5 text-xs">
          {item.email ? (
            <div className="flex items-center gap-1.5 text-neutral-700">
              <Mail className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
              <a href={`mailto:${item.email}`} className="hover:underline truncate max-w-[165px]">
                {item.email}
              </a>
            </div>
          ) : (
            <span className="text-neutral-400 italic text-[11px]">Email non renseigné</span>
          )}
          {item.phone && (
            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
              <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{item.phone}</span>
            </div>
          )}
        </div>
      ),
      printRender: (item) => `${item.email || ''} ${item.phone || ''}`,
    },
    {
      key: 'articles',
      header: 'Délais & Catalogue',
      sortable: true,
      sortValue: (item) => item.productsCount || 0,
      render: (item) => {
        const count = item.productsCount || 0;
        const days = item.leadTimeDays ?? 7;
        const terms = item.paymentTerms || 0;
        return (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4F5F7] text-neutral-700 border border-neutral-200">
                <Truck className="w-3 h-3 text-[#C59B27]" />
                {days}j livr.
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                {terms === 0 ? 'Comptant' : `${terms}j règl.`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenArticlesModal(item)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#1D232E] bg-[#F4F5F7] hover:bg-[#FBF6E8] border border-[#E6E1D6] transition cursor-pointer"
              title="Consulter les articles approvisionnés par ce fournisseur"
            >
              <Package className="w-3 h-3 text-[#C59B27]" />
              <span>{count} article{count > 1 ? 's' : ''}</span>
            </button>
          </div>
        );
      },
      printRender: (item) => `${item.leadTimeDays ?? 7}j / ${item.paymentTerms || 0}j / ${item.productsCount || 0} articles`,
    },
    {
      key: 'status',
      header: 'Statut & Agrément',
      sortable: true,
      sortValue: (item) => (item.isActive ? 1 : 0),
      render: (item) => {
        const d = new Date(item.createdAt);
        return (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleToggleActive(item)}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition border cursor-pointer',
                item.isActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              )}
              title="Cliquer pour basculer le statut d’agrément"
            >
              {item.isActive ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>ACTIF</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-600" />
                  <span>SUSPENDU</span>
                </>
              )}
            </button>
            <div className="text-[10px] text-neutral-400 font-mono">
              {d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        );
      },
      printRender: (item) => `${item.isActive ? 'Actif' : 'Suspendu'} (${new Date(item.createdAt).toLocaleDateString('fr-FR')})`,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="p-1.5 text-neutral-600 hover:text-[#9A7414] hover:bg-[#FBF6E8] rounded-lg transition cursor-pointer"
            title="Modifier le fournisseur"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSupplierToDelete(item)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            title="Supprimer le fournisseur"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* Floating Toast Notification */}
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type === 'error' ? 'error' : 'success'}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Header Card (Master Layout Standard) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              Fournisseurs & Prestataires
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] shadow-2xs">
              CYCLE ACHATS & STOCKS
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Répertoire centralisé des fournisseurs agréés, gestion des délais de règlement, matricules fiscaux et traçabilité des flux d'approvisionnement.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Tableau de bord', href: '/dashboard' },
              { label: 'Approvisionnement & Entrepôts' },
              { label: 'Fournisseurs' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={openNewModal}
            variant="gold"
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs py-2 px-4 shadow-sm"
          >
            Nouveau Fournisseur
          </Button>
        </div>
      </div>

      {/* 2. KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Fournisseurs
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Partenaires répertoriés</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Fournisseurs Actifs
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Agréés pour commandes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Délai Moyen Livraison
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {avgLeadTimeDays} Jours
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Commande à quai entrepôt</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Délai Règlement
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              {avgPaymentTerms} Jours
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Échéance contractuelle</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Articles Fournis
            </span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {totalSuppliedArticles}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Catalogue approvisionné</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Data Table with Isolated Filters */}
      <DataTable<SupplierItem>
        data={filteredSuppliers}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedSupplierIds}
        onSelectionChange={setSelectedSupplierIds}
        onBulkDelete={(keys) => setBulkDeleteSupplierIds(keys)}
        renderBulkActions={() => (
          <>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkSupplierPatch({ isActive: true }, 'activé(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Activer
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkSupplierPatch({ isActive: false }, 'suspendu(s)')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Suspendre
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkSupplierPatch({ supplierType: 'COMPANY' }, 'classé(s) Société')}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Type Société
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkSupplierPatch({ supplierType: 'INDIVIDUAL' }, 'classé(s) Particulier')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Type Particulier
            </button>
          </>
        )}
        searchPlaceholder="Rechercher par nom, code, email, matricule fiscal ou ville..."
        searchKeys={['name', 'code', 'email', 'phone', 'city', 'country', 'taxId']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        exportFileName="fournisseurs_royal"
        customFilters={[
          {
            key: 'type',
            label: 'Forme Juridique',
            value: filterType,
            onChange: setFilterType,
            allLabel: 'Toutes les formes',
            options: [
              { value: 'COMPANY', label: 'Sociétés (Morale)' },
              { value: 'INDIVIDUAL', label: 'Particuliers (Physique)' },
            ],
          },
          {
            key: 'status',
            label: 'Statut',
            value: filterStatus,
            onChange: setFilterStatus,
            allLabel: 'Tous les statuts',
            options: [
              { value: 'ACTIVE', label: 'Actifs uniquement' },
              { value: 'INACTIVE', label: 'Suspendus' },
            ],
          },
          {
            key: 'country',
            label: 'Pays',
            value: filterCountry,
            onChange: setFilterCountry,
            allLabel: 'Tous les pays',
            options: COUNTRY_OPTIONS.map((c) => ({
              value: c.code,
              label: `${c.flag} ${c.name}`,
            })),
          },
          {
            key: 'terms',
            label: 'Règlement',
            value: filterTerms,
            onChange: setFilterTerms,
            allLabel: 'Tous règlements',
            options: [
              { value: '0', label: 'Comptant (0j)' },
              { value: '30', label: '30 Jours' },
              { value: '45', label: '45 Jours' },
              { value: '60', label: '60 Jours' },
              { value: '90', label: '90 Jours' },
            ],
          },
        ]}
      />

      {/* ══════════════════════════════════════════════════════════════════════════════════
          REUSABLE WIDE ARTICLES MODAL
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <RelatedArticlesModal
        isOpen={!!articlesModalSupplier}
        onClose={() => {
          setArticlesModalSupplier(null);
          setSupplierArticles([]);
        }}
        title={articlesModalSupplier ? `Articles approvisionnés par "${articlesModalSupplier.name}"` : ''}
        subtitle={
          isArticlesModalLoading
            ? 'Chargement des articles du fournisseur...'
            : `${supplierArticles.length} article(s) approvisionné(s) par le fournisseur #${articlesModalSupplier?.code || ''}`
        }
        articles={supplierArticles}
      />

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL: CRÉATION / MODIFICATION FOURNISSEUR
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? `Modifier le Fournisseur : ${editingSupplier.name}` : 'Nouveau Fournisseur Partenaire'}
        subtitle="Renseignez la raison sociale, les coordonnées et les conditions de règlement"
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
              variant="gold"
              size="sm"
              onClick={handleSaveSupplier}
              className="text-xs py-2 px-5"
            >
              {editingSupplier ? 'Enregistrer les modifications' : 'Créer le fournisseur'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveSupplier} className="p-6 pb-24 space-y-4 text-xs">
          {/* Forme Juridique Selector: Société vs Particulier */}
          <div className="flex items-center gap-2 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200">
            <button
              type="button"
              onClick={() => setFormSupplierType('COMPANY')}
              className={cn(
                'flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer',
                formSupplierType === 'COMPANY'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              )}
            >
              <Building2 className="w-4 h-4 text-neutral-800" />
              <span>Entreprise / Société (Personne Morale)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormSupplierType('INDIVIDUAL')}
              className={cn(
                'flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer',
                formSupplierType === 'INDIVIDUAL'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              )}
            >
              <User className="w-4 h-4 text-purple-600" />
              <span>Particulier / Artisan (Personne Physique)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={formSupplierType === 'COMPANY' ? 'Raison Sociale / Nom Entreprise *' : 'Nom & Prénom du Particulier *'}
              placeholder={formSupplierType === 'COMPANY' ? "ex: Manufacture d'Orfèvrerie" : 'ex: Mounir El Benna'}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <Input
              label="Code Unique Fournisseur *"
              placeholder={formSupplierType === 'COMPANY' ? 'ex: SUP-MEOF-01' : 'ex: ART-BENNA-01'}
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              helperText="Identifiant unique pour les commandes et bons d'entrée"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={formSupplierType === 'COMPANY' ? 'Email Professionnel' : 'Email Personnel'}
              type="email"
              placeholder="contact@fournisseur.com"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
            />
            <Input
              label={formSupplierType === 'COMPANY' ? 'Téléphone Siège' : 'Téléphone Direct / Mobile'}
              placeholder="+216 71 000 000"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Adresse"
              placeholder="ex: 14 Rue de l’Industrie"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
            />
            <Input
              label="Ville"
              placeholder="ex: Tunis"
              value={formCity}
              onChange={(e) => setFormCity(e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Pays d’Origine
              </label>
              <Select
                value={formCountry}
                onChange={(e) => setFormCountry(e.target.value)}
                className="w-full text-xs h-9 bg-neutral-50 border-neutral-200 rounded-xl"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {formSupplierType === 'COMPANY' ? (
              <Input
                label="Matricule Fiscal / Tax ID (MF)"
                placeholder="ex: 0482910/B/A/M/000"
                value={formTaxId}
                onChange={(e) => setFormTaxId(e.target.value)}
                helperText="Obligatoire pour les factures d'achat"
              />
            ) : (
              <Input
                label="Numéro CIN / Pièce d'Identité"
                placeholder="ex: 08123456"
                value={formCin}
                onChange={(e) => setFormCin(e.target.value)}
                helperText="Identifiant légal de la personne physique"
              />
            )}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Délai de Règlement Contractuel
              </label>
              <Select
                value={formPaymentTerms}
                onChange={(e) => setFormPaymentTerms(e.target.value)}
                className="w-full text-xs h-9 bg-neutral-50 border-neutral-200 rounded-xl"
              >
                <option value="0">Comptant à réception (0 jour)</option>
                <option value="30">30 Jours Net</option>
                <option value="45">45 Jours Fin de Mois</option>
                <option value="60">60 Jours</option>
                <option value="90">90 Jours</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Délai de Livraison Estimé
              </label>
              <Input
                type="number"
                min="1"
                max="180"
                placeholder="ex: 7"
                value={formLeadTimeDays}
                onChange={(e) => setFormLeadTimeDays(e.target.value)}
                helperText="Jours de la commande au quai entrepôt"
              />
            </div>
          </div>

          {formSupplierType === 'COMPANY' && (
            <Input
              label="Contact Représentant Légal (Optionnel)"
              placeholder="ex: Mounir Zitouni (Directeur Commercial)"
              value={formContactPerson}
              onChange={(e) => setFormContactPerson(e.target.value)}
            />
          )}

          <Textarea
            label="Notes & Modalités Contractuelles"
            placeholder="Informations logistiques, franco de port, remises accordées..."
            rows={3}
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />

          {/* Visibility / Active Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <div>
              <span className="font-bold text-neutral-900 block text-xs">Agrément Fournisseur Actif</span>
              <span className="text-[11px] text-neutral-500">
                Autoriser l'émission de bons de commande et la réception de stock de ce partenaire
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFormIsActive(!formIsActive)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                formIsActive ? 'bg-emerald-600' : 'bg-neutral-300'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  formIsActive ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL: SUPPRESSION FOURNISSEUR
      ══════════════════════════════════════════════════════════════════════════════════ */}
      {supplierToDelete && (
        <Modal
          isOpen={!!supplierToDelete}
          onClose={() => setSupplierToDelete(null)}
          title="Confirmer la suppression du fournisseur"
          subtitle={`Fournisseur : ${supplierToDelete.name} (#${supplierToDelete.code})`}
          type="delete"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSupplierToDelete(null)}
                className="text-xs py-2 px-4"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteSupplier}
                className="text-xs py-2 px-4"
              >
                Confirmer la suppression
              </Button>
            </div>
          }
        >
          <div className="p-5 space-y-3 text-xs">
            {(supplierToDelete.productsCount || 0) > 0 ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Suppression bloquée</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Ce fournisseur est rattaché à <strong>{supplierToDelete.productsCount} article(s)</strong> au catalogue. Vous devez d’abord réassigner ou dissocier ces articles avant de pouvoir supprimer ce fournisseur.
                </p>
              </div>
            ) : (
              <p className="text-neutral-600 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement le fournisseur <strong>{supplierToDelete.name}</strong> ? Cette action est irréversible.
              </p>
            )}
          </div>
        </Modal>
      )}
      <DeleteConfirmModal
        isOpen={bulkDeleteSupplierIds.length > 0}
        onClose={() => setBulkDeleteSupplierIds([])}
        onConfirm={confirmBulkDeleteSuppliers}
        isDeleting={isBulkUpdating}
        title="Supprimer les fournisseurs sélectionnés"
        description={`Confirmez-vous la suppression des ${bulkDeleteSupplierIds.length} fournisseur(s) sélectionné(s) ? Ceux rattachés à des articles actifs seront protégés.`}
      />
    </div>
  );
}
