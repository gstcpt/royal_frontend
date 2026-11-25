'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Scale,
  Coins,
  Calculator,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Star,
} from 'lucide-react';
import {
  Breadcrumb,
  Button,
  ColumnDef,
  DataTable,
  DeleteConfirmModal,
  GuideInfoButton,
  Modal,
  Toast,
  Toggle,
  ViewGuideModal,
  ViewGuideStep,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';

type DeliveryMethodType = 'DISTANCE' | 'WEIGHT' | 'FIXED';

interface PricingBracket {
  min: number;
  max: number | null;
  price: number;
  label?: string;
}

interface MethodRule {
  method: DeliveryMethodType;
  isEnabled: boolean;
  isDefault?: boolean;
  fixedPrice: number;
  brackets: PricingBracket[];
}

interface DeliveryCompanyRecord {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  originCountry: string;
  originState: string;
  originCity?: string | null;
  estimatedDays: string;
  defaultMethod: DeliveryMethodType;
  fixedPrice: number;
  isActive: boolean;
  deliveriesCount?: number;
  ordersCount?: number;
  methods: MethodRule[];
}

interface CountryCatalogItem {
  code: string;
  nameFr: string;
  states: Array<{ name: string; lat: number; lng: number }>;
}

const DEFAULT_DISTANCE_BRACKETS: PricingBracket[] = [
  { min: 0, max: 9.99, price: 6, label: 'Locale (< 10 km)' },
  { min: 10, max: 99.99, price: 9, label: 'Régionale (10 - 99.99 km)' },
  { min: 100, max: 599.99, price: 14, label: 'Nationale (100 - 599.99 km)' },
  { min: 600, max: null, price: 22, label: 'Longue distance (600+ km)' },
];

const DEFAULT_WEIGHT_BRACKETS: PricingBracket[] = [
  { min: 0, max: 9.99, price: 7, label: 'Petit colis (0 - 9.99 kg)' },
  { min: 10, max: 499.99, price: 18, label: 'Colis lourd (10 - 499.99 kg)' },
  { min: 500, max: null, price: 45, label: 'Fret volumineux (500+ kg)' },
];

const METHOD_BADGE: Record<DeliveryMethodType, { label: string; cls: string }> = {
  DISTANCE: {
    label: 'Par Distance (km)',
    cls: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  WEIGHT: {
    label: 'Par Poids (kg)',
    cls: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  FIXED: {
    label: 'Tarif Fixe',
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
};

const DELIVERY_COMPANIES_GUIDE: ViewGuideStep[] = [
  {
    id: 'dc-overview',
    number: '01',
    title: '3 Méthodes de Calcul Par Transporteur',
    description:
      'Chaque société active apparaît dans le Tunnel de Commande (/checkout) avec le tarif calculé selon sa méthode par défaut.',
    fields: [
      {
        label: 'Par Distance (Point A ➔ Point B)',
        example: 'TN / Tunis ➔ TN / Mahdia (~172 km)',
        steps: [
          'Le Point A est défini sur la société de livraison (Pays + Gouvernorat/État).',
          'Le Point B provient de l’adresse sélectionnée par le client au Checkout.',
          'Des tranches personnalisables (<10 km, 10–99.99 km, 100–599.99 km, 600+ km) déterminent le coût en TND.',
        ],
      },
      {
        label: 'Par Poids (kg)',
        example: '0–9.99 kg | 10–499.99 kg | 500+ kg',
        steps: [
          'Additionne le poids réel de chaque article du panier (ou le poids par défaut configurable).',
          'Évalue ensuite les tranches [min..max] kg configurées pour le transporteur.',
        ],
      },
      {
        label: 'Tarif Fixe & Activation',
        example: '8.000 TND forfaitaire',
        steps: [
          'Utilisez le bouton bascule Statut pour activer/désactiver un transporteur au Checkout.',
          'Sélectionnez 1 méthode par défaut par société (DISTANCE, WEIGHT ou FIXED).',
        ],
      },
    ],
  },
];

export default function DeliveryCompaniesPage() {
  const [companies, setCompanies] = useState<DeliveryCompanyRecord[]>([]);
  const [countries, setCountries] = useState<CountryCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    type: 'success',
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);

  // Modal Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryCompanyRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryCompanyRecord | null>(null);

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formOriginCountry, setFormOriginCountry] = useState('TN');
  const [formOriginState, setFormOriginState] = useState('Tunis');
  const [formOriginCity, setFormOriginCity] = useState('');
  const [formEstimatedDays, setFormEstimatedDays] = useState('24h - 48h');
  const [formDefaultMethod, setFormDefaultMethod] = useState<DeliveryMethodType>('DISTANCE');
  const [formFixedPrice, setFormFixedPrice] = useState('8');
  const [formActive, setFormActive] = useState(true);
  const [activeTab, setActiveTab] = useState<DeliveryMethodType>('DISTANCE');

  const [distEnabled, setDistEnabled] = useState(true);
  const [distBrackets, setDistBrackets] = useState<PricingBracket[]>(DEFAULT_DISTANCE_BRACKETS);
  const [weightEnabled, setWeightEnabled] = useState(true);
  const [weightBrackets, setWeightBrackets] = useState<PricingBracket[]>(DEFAULT_WEIGHT_BRACKETS);
  const [fixedEnabled, setFixedEnabled] = useState(true);

  // Simulator state
  const [simCountry, setSimCountry] = useState('TN');
  const [simState, setSimState] = useState('Mahdia');
  const [simWeightKg, setSimWeightKg] = useState('12');
  const [simSubtotal, setSimSubtotal] = useState('180');
  const [simulating, setSimulating] = useState(false);
  const [simQuotes, setSimQuotes] = useState<any[] | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ open: true, message, type });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, geoRes] = await Promise.all([
        fetchApi('/deliveries/companies').catch(() => []),
        fetchApi('/deliveries/geography').catch(() => ({ countries: [] })),
      ]);
      setCompanies(Array.isArray(compRes) ? compRes : []);
      const cList = Array.isArray(geoRes?.countries) ? geoRes.countries : [];
      setCountries(cList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const originStatesForCountry = useMemo(() => {
    return countries.find((c) => c.code === formOriginCountry)?.states || [];
  }, [countries, formOriginCountry]);

  const simStatesForCountry = useMemo(() => {
    return countries.find((c) => c.code === simCountry)?.states || [];
  }, [countries, simCountry]);

  const openCreateModal = () => {
    setEditing(null);
    setFormName('');
    setFormCode('');
    setFormPhone('');
    setFormEmail('');
    setFormOriginCountry('TN');
    setFormOriginState('Tunis');
    setFormOriginCity('');
    setFormEstimatedDays('24h - 48h');
    setFormDefaultMethod('DISTANCE');
    setFormFixedPrice('8');
    setFormActive(true);
    setActiveTab('DISTANCE');
    setDistEnabled(true);
    setDistBrackets(DEFAULT_DISTANCE_BRACKETS.map((b) => ({ ...b })));
    setWeightEnabled(true);
    setWeightBrackets(DEFAULT_WEIGHT_BRACKETS.map((b) => ({ ...b })));
    setFixedEnabled(true);
    setModalOpen(true);
  };

  const openEditModal = (comp: DeliveryCompanyRecord) => {
    setEditing(comp);
    setFormName(comp.name);
    setFormCode(comp.code);
    setFormPhone(comp.phone || '');
    setFormEmail(comp.email || '');
    setFormOriginCountry(comp.originCountry || 'TN');
    setFormOriginState(comp.originState || 'Tunis');
    setFormOriginCity(comp.originCity || '');
    setFormEstimatedDays(comp.estimatedDays || '24h - 48h');
    setFormDefaultMethod(comp.defaultMethod || 'DISTANCE');
    setFormFixedPrice(String(Number(comp.fixedPrice ?? 8)));
    setFormActive(comp.isActive);
    setActiveTab(comp.defaultMethod || 'DISTANCE');

    const distRule = comp.methods.find((m) => m.method === 'DISTANCE');
    const weightRule = comp.methods.find((m) => m.method === 'WEIGHT');
    const fixedRule = comp.methods.find((m) => m.method === 'FIXED');

    setDistEnabled(distRule ? distRule.isEnabled : true);
    setDistBrackets(
      distRule?.brackets?.length
        ? distRule.brackets.map((b) => ({ ...b }))
        : DEFAULT_DISTANCE_BRACKETS.map((b) => ({ ...b })),
    );
    setWeightEnabled(weightRule ? weightRule.isEnabled : true);
    setWeightBrackets(
      weightRule?.brackets?.length
        ? weightRule.brackets.map((b) => ({ ...b }))
        : DEFAULT_WEIGHT_BRACKETS.map((b) => ({ ...b })),
    );
    setFixedEnabled(fixedRule ? fixedRule.isEnabled : true);
    if (fixedRule && fixedRule.fixedPrice !== undefined) {
      setFormFixedPrice(String(Number(fixedRule.fixedPrice)));
    }
    setModalOpen(true);
  };

  const handleSaveCompany = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formName.trim()) {
      showToast('Le nom de la société est requis.', 'error');
      return;
    }
    setSaving(true);
    try {
      const fixedVal = Math.max(0, Number(formFixedPrice || 0));
      const payload = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        originCountry: formOriginCountry,
        originState: formOriginState,
        originCity: formOriginCity.trim() || undefined,
        estimatedDays: formEstimatedDays.trim() || '24h - 48h',
        defaultMethod: formDefaultMethod,
        fixedPrice: fixedVal,
        isActive: formActive,
        methods: [
          {
            method: 'DISTANCE' as DeliveryMethodType,
            isEnabled: distEnabled,
            brackets: distBrackets.map((b) => ({
              min: Math.max(0, Number(b.min || 0)),
              max: b.max !== null && b.max !== undefined && String(b.max) !== '' ? Number(b.max) : null,
              price: Math.max(0, Number(b.price || 0)),
              label: b.label?.trim() || undefined,
            })),
          },
          {
            method: 'WEIGHT' as DeliveryMethodType,
            isEnabled: weightEnabled,
            brackets: weightBrackets.map((b) => ({
              min: Math.max(0, Number(b.min || 0)),
              max: b.max !== null && b.max !== undefined && String(b.max) !== '' ? Number(b.max) : null,
              price: Math.max(0, Number(b.price || 0)),
              label: b.label?.trim() || undefined,
            })),
          },
          {
            method: 'FIXED' as DeliveryMethodType,
            isEnabled: fixedEnabled,
            fixedPrice: fixedVal,
          },
        ],
      };

      if (editing) {
        await fetchApi(`/deliveries/companies/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast(`Société "${formName.trim()}" mise à jour avec ses 3 grilles tarifaires.`);
      } else {
        await fetchApi('/deliveries/companies', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast(`Société "${formName.trim()}" créée en base PostgreSQL.`);
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erreur lors de la sauvegarde.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (comp: DeliveryCompanyRecord) => {
    try {
      await fetchApi(`/deliveries/companies/${comp.id}/toggle-active`, { method: 'PATCH' });
      setCompanies((prev) =>
        prev.map((c) => (c.id === comp.id ? { ...c, isActive: !c.isActive } : c)),
      );
      showToast(
        !comp.isActive
          ? `${comp.name} activée sur le Checkout.`
          : `${comp.name} masquée du Checkout.`,
        'info',
      );
    } catch (err: any) {
      showToast(err?.message || 'Impossible de modifier le statut.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await fetchApi(`/deliveries/companies/${deleteTarget.id}`, { method: 'DELETE' });
      showToast(`Société "${deleteTarget.name}" supprimée / archivée.`, 'info');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erreur lors de la suppression.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRunSimulator = async () => {
    setSimulating(true);
    try {
      const res = await fetchApi('/deliveries/calculate-quote', {
        method: 'POST',
        body: JSON.stringify({
          destinationCountry: simCountry,
          destinationState: simState,
          totalWeightKg: Math.max(0, Number(simWeightKg || 0)),
          subtotalTnd: Math.max(0, Number(simSubtotal || 0)),
          includeInactive: true,
        }),
      });
      setSimQuotes(Array.isArray(res?.quotes) ? res.quotes : []);
    } catch (err: any) {
      showToast(err?.message || 'Erreur de simulation tarifaire.', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const updateBracketField = (
    setter: React.Dispatch<React.SetStateAction<PricingBracket[]>>,
    idx: number,
    key: keyof PricingBracket,
    value: any,
  ) => {
    setter((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)),
    );
  };

  const columns: ColumnDef<DeliveryCompanyRecord>[] = [
    {
      key: 'name',
      header: 'Société de Livraison',
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
              <span className="truncate">{row.name}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                {row.code}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500">
              {row.estimatedDays} {row.phone ? `• ${row.phone}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'origin',
      header: 'Origine (Point A)',
      sortable: true,
      sortValue: (row) => `${row.originCountry}-${row.originState}`,
      render: (row) => (
        <div className="text-xs flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
          <div>
            <div className="font-semibold text-neutral-900">
              {row.originCountry} / {row.originState}
            </div>
            {row.originCity && (
              <div className="text-[11px] text-neutral-500">{row.originCity}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'defaultMethod',
      header: 'Méthode par Défaut',
      sortable: true,
      sortValue: (row) => row.defaultMethod,
      render: (row) => {
        const badge = METHOD_BADGE[row.defaultMethod] || METHOD_BADGE.DISTANCE;
        return (
          <div className="space-y-1">
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border', badge.cls)}>
              <Star className="w-3 h-3" />
              {badge.label}
            </span>
            <div className="text-[11px] text-neutral-500 font-mono">
              Forfait fixe : {formatTndCurrency(row.fixedPrice)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'rules',
      header: 'Grilles Configurées',
      render: (row) => {
        const dRule = row.methods.find((m) => m.method === 'DISTANCE');
        const wRule = row.methods.find((m) => m.method === 'WEIGHT');
        const fRule = row.methods.find((m) => m.method === 'FIXED');
        return (
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
            <span className={cn('px-2 py-0.5 rounded-md border', dRule?.isEnabled ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-neutral-50 text-neutral-400 border-neutral-200')}>
              Dist: {dRule?.brackets?.length || 0} tranche(s)
            </span>
            <span className={cn('px-2 py-0.5 rounded-md border', wRule?.isEnabled ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-neutral-50 text-neutral-400 border-neutral-200')}>
              Poids: {wRule?.brackets?.length || 0} tranche(s)
            </span>
            <span className={cn('px-2 py-0.5 rounded-md border', fRule?.isEnabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-neutral-50 text-neutral-400 border-neutral-200')}>
              Fixe: {formatTndCurrency(fRule?.fixedPrice ?? row.fixedPrice)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Statut Checkout',
      sortable: true,
      sortValue: (row) => (row.isActive ? 1 : 0),
      render: (row) => (
        <div className="flex items-center gap-2">
          <Toggle
            compact
            size="sm"
            checked={row.isActive}
            onChange={() => handleToggleActive(row)}
            ariaLabel={`Activer ${row.name}`}
          />
          <span className={cn('text-[11px] font-bold', row.isActive ? 'text-emerald-700' : 'text-neutral-400')}>
            {row.isActive ? 'Active' : 'Masquée'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-[#FBF6E8] hover:border-[#C59B27] text-neutral-700 transition cursor-pointer"
            title="Configurer les 3 méthodes de calcul"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-neutral-500 hover:text-rose-700 transition cursor-pointer"
            title="Supprimer / Archiver"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const kpiStats = useMemo(() => {
    const activeCount = companies.filter((c) => c.isActive).length;
    const distanceCount = companies.filter((c) => c.defaultMethod === 'DISTANCE').length;
    const weightCount = companies.filter((c) => c.defaultMethod === 'WEIGHT').length;
    const fixedCount = companies.filter((c) => c.defaultMethod === 'FIXED').length;
    return { total: companies.length, activeCount, distanceCount, weightCount, fixedCount };
  }, [companies]);

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <Toast
        isOpen={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <ViewGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Guide — Sociétés & Tarifs de Livraison"
        subtitle="Distances Point A ➔ Point B, Poids & Tarif Fixe"
        steps={DELIVERY_COMPANIES_GUIDE}
        currentIndex={guideIndex}
        onStepChange={setGuideIndex}
      />

      {/* 1. Header Card */}
      <div className="bg-white rounded-2xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-10 h-10 rounded-2xl bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#1D232E] tracking-tight">
              Sociétés &amp; Tarifs de Livraison
            </h1>
            <GuideInfoButton onClick={() => setGuideOpen(true)} />
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
              {kpiStats.activeCount} / {kpiStats.total} ACTIVE(S)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Configurez vos transporteurs avec 3 méthodes de calcul indépendantes (Distance Point A ➔ Point B, Tranches de Poids kg, Tarif Fixe) et choisissez la méthode par défaut affichée aux clients au Checkout.
          </p>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Ventes & Distribution', href: '/dashboard/section/sales' },
              { label: 'Sociétés & Tarifs de Livraison' },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/dashboard/root/delivery-settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] bg-white hover:bg-[#FBF9F4] text-xs font-bold text-[#1D232E] transition"
          >
            <Sliders className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Règles Distances &amp; Transferts</span>
          </Link>
          <Button variant="gold" onClick={openCreateModal} className="text-xs px-4 py-2.5 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Nouvelle Société</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Transporteurs Actifs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">{kpiStats.activeCount}</div>
          <div className="text-[11px] text-neutral-500">Visibles côté client (/checkout)</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>Défaut : Distance</span>
            <MapPin className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-900 font-heading">{kpiStats.distanceCount}</div>
          <div className="text-[11px] text-sky-700">Calcul Point A ➔ Point B (km)</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Défaut : Poids</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">{kpiStats.weightCount}</div>
          <div className="text-[11px] text-amber-700">Tranches dynamiques (kg)</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Défaut : Tarif Fixe</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">{kpiStats.fixedCount}</div>
          <div className="text-[11px] text-emerald-700">Forfait unique par commande</div>
        </div>
      </div>

      {/* 3. Live Tariff Simulator */}
      <div className="bg-white rounded-2xl border border-[#E6E1D6] shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#C59B27]" />
            <h2 className="font-heading font-bold text-sm text-[#1D232E]">
              Simulateur Instantané de Tarifs Checkout (Point A ➔ Point B &amp; Poids)
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSimulator}
            isLoading={simulating}
            className="text-xs px-4"
          >
            Simuler les Tarifs
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-neutral-700 mb-1">Pays Destination (Point B)</label>
            <select
              value={simCountry}
              onChange={(e) => {
                const nextCode = e.target.value;
                setSimCountry(nextCode);
                const nextStates = countries.find((c) => c.code === nextCode)?.states || [];
                if (nextStates[0]) setSimState(nextStates[0].name);
              }}
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-900"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.nameFr} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">Gouvernorat / État (Point B)</label>
            <select
              value={simState}
              onChange={(e) => setSimState(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-900"
            >
              {simStatesForCountry.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">Poids Total Panier (kg)</label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={simWeightKg}
              onChange={(e) => setSimWeightKg(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white font-mono text-neutral-900"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">Sous-total Commande (TND)</label>
            <input
              type="number"
              min={0}
              step="1"
              value={simSubtotal}
              onChange={(e) => setSimSubtotal(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white font-mono text-neutral-900"
            />
          </div>
        </div>

        {simQuotes && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {simQuotes.map((q) => (
              <div
                key={q.companyId}
                className={cn(
                  'p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3',
                  q.available
                    ? 'bg-[#FBF9F4] border-[#E6D6A6]'
                    : 'bg-rose-50/60 border-rose-200',
                )}
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="font-bold text-neutral-900 truncate flex items-center gap-1.5">
                    <span>{q.name}</span>
                    {!q.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700">
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-600">
                    {q.originCountry}/{q.originState} ➔ {simCountry}/{simState} ({q.distanceKm} km)
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Méthode : <strong>{q.method}</strong> • {q.matchedBracketLabel}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {q.available ? (
                    <span className="text-sm font-black font-mono text-[#9A7414]">
                      {q.feeTnd === 0 ? 'Gratuit' : formatTndCurrency(q.feeTnd)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Hors plage
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. DataTable */}
      <DataTable
        data={companies}
        isLoading={loading}
        columns={columns}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Rechercher par nom, code transporteur, gouvernorat d'origine..."
        searchKeys={['name', 'code', 'originState', 'originCity']}
        supportedModes={['table', 'list']}
        defaultMode="table"
        printTitle="Sociétés & Tarifs de Livraison — Royal"
        exportFileName="societes_livraison_royal"
      />

      {/* Create / Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          size="4xl"
          title={editing ? `Configurer Transporteur — ${editing.name}` : 'Nouvelle Société de Livraison'}
          subtitle="Définissez le Point A d'expédition, la méthode par défaut et les 3 barèmes (Distance, Poids, Fixe)."
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="text-xs px-4 py-2">
                Annuler
              </Button>
              <Button variant="gold" onClick={() => handleSaveCompany()} isLoading={saving} className="text-xs px-5 py-2">
                {editing ? 'Enregistrer Modifications' : 'Créer Société'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveCompany} className="p-5 sm:p-6 space-y-5 text-xs">
            {/* Identity + Point A */}
            <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#1D232E]">
                  Identité, Origine (Point A) &amp; Méthode par Défaut
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-neutral-700">Active sur Checkout</span>
                  <Toggle compact size="sm" checked={formActive} onChange={setFormActive} ariaLabel="Activer société" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Nom Société *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Aramex Tunisie"
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Code Unique</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="EX: ARAMEX-TN"
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white font-mono text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Délai Estimé</label>
                  <input
                    type="text"
                    value={formEstimatedDays}
                    onChange={(e) => setFormEstimatedDays(e.target.value)}
                    placeholder="24h - 48h"
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Pays Origine (Point A)</label>
                  <select
                    value={formOriginCountry}
                    onChange={(e) => {
                      const nextC = e.target.value;
                      setFormOriginCountry(nextC);
                      const list = countries.find((c) => c.code === nextC)?.states || [];
                      if (list[0]) setFormOriginState(list[0].name);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-900"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.nameFr} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Gouvernorat / État (Point A)</label>
                  <select
                    value={formOriginState}
                    onChange={(e) => setFormOriginState(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-900"
                  >
                    {originStatesForCountry.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Téléphone Contact</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+216 ..."
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-900"
                  />
                </div>
              </div>

              {/* Default method picker */}
              <div className="pt-2">
                <label className="block font-bold text-neutral-700 mb-2">
                  Méthode de Calcul Appliquée par Défaut au Checkout
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['DISTANCE', 'WEIGHT', 'FIXED'] as DeliveryMethodType[]).map((m) => {
                    const selected = formDefaultMethod === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setFormDefaultMethod(m);
                          setActiveTab(m);
                        }}
                        className={cn(
                          'p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2',
                          selected
                            ? 'bg-white border-[#C59B27] ring-2 ring-[#C59B27]/20 text-[#1D232E]'
                            : 'bg-white/70 border-neutral-200 text-neutral-600 hover:border-neutral-300',
                        )}
                      >
                        <div>
                          <div className="font-bold">{METHOD_BADGE[m].label}</div>
                          <div className="text-[10px] text-neutral-500">
                            {m === 'DISTANCE'
                              ? 'Tranches en km (Point A ➔ B)'
                              : m === 'WEIGHT'
                                ? 'Tranches en kg (panier)'
                                : 'Montant forfaitaire TND'}
                          </div>
                        </div>
                        {selected && <Star className="w-4 h-4 text-[#C59B27] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3 Method Tabs */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2.5">
                {(['DISTANCE', 'WEIGHT', 'FIXED'] as DeliveryMethodType[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer',
                      activeTab === tab
                        ? 'bg-[#1D232E] text-white'
                        : 'bg-[#F8F9FA] text-neutral-700 hover:bg-neutral-200/70',
                    )}
                  >
                    {METHOD_BADGE[tab].label}
                    {formDefaultMethod === tab ? ' ★' : ''}
                  </button>
                ))}
              </div>

              {activeTab === 'DISTANCE' && (
                <div className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900">Barème par Distance (km)</h4>
                      <p className="text-[11px] text-neutral-500">
                        Calcul automatique Pays + Gouvernorat Point A ➔ Point B. Laissez Max vide pour une tranche ouverte (+).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle compact size="sm" checked={distEnabled} onChange={setDistEnabled} ariaLabel="Activer Distance" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDistBrackets((prev) => [...prev, { min: 0, max: null, price: 15, label: 'Nouvelle tranche' }])
                        }
                        className="text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tranche</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {distBrackets.map((br, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={br.min}
                          onChange={(e) => updateBracketField(setDistBrackets, idx, 'min', Number(e.target.value || 0))}
                          placeholder="Min km"
                          className="col-span-2 h-9 px-2.5 rounded-lg border border-neutral-200 font-mono text-neutral-900"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={br.max ?? ''}
                          onChange={(e) =>
                            updateBracketField(
                              setDistBrackets,
                              idx,
                              'max',
                              e.target.value === '' ? null : Number(e.target.value),
                            )
                          }
                          placeholder="Max km (∞ si vide)"
                          className="col-span-3 h-9 px-2.5 rounded-lg border border-neutral-200 font-mono text-neutral-900"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.001"
                          value={br.price}
                          onChange={(e) => updateBracketField(setDistBrackets, idx, 'price', Number(e.target.value || 0))}
                          placeholder="Prix TND"
                          className="col-span-2 h-9 px-2.5 rounded-lg border border-neutral-200 font-mono font-bold text-neutral-900"
                        />
                        <input
                          type="text"
                          value={br.label || ''}
                          onChange={(e) => updateBracketField(setDistBrackets, idx, 'label', e.target.value)}
                          placeholder="Libellé affiché"
                          className="col-span-4 h-9 px-2.5 rounded-lg border border-neutral-200 text-neutral-800"
                        />
                        <button
                          type="button"
                          onClick={() => setDistBrackets((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={distBrackets.length <= 1}
                          className="col-span-1 h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'WEIGHT' && (
                <div className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900">Barème par Poids Total (kg)</h4>
                      <p className="text-[11px] text-neutral-500">
                        Ex : &lt; 10 kg, 10 - 499.99 kg, 500+ kg (laissez Max vide pour « + »).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle compact size="sm" checked={weightEnabled} onChange={setWeightEnabled} ariaLabel="Activer Poids" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setWeightBrackets((prev) => [...prev, { min: 0, max: null, price: 25, label: 'Nouvelle tranche kg' }])
                        }
                        className="text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tranche</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {weightBrackets.map((br, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={br.min}
                          onChange={(e) => updateBracketField(setWeightBrackets, idx, 'min', Number(e.target.value || 0))}
                          placeholder="Min kg"
                          className="col-span-2 h-9 px-2.5 rounded-lg border border-neutral-200 font-mono text-neutral-900"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={br.max ?? ''}
                          onChange={(e) =>
                            updateBracketField(
                              setWeightBrackets,
                              idx,
                              'max',
                              e.target.value === '' ? null : Number(e.target.value),
                            )
                          }
                          placeholder="Max kg (∞ si vide)"
                          className="col-span-3 h-9 px-2.5 rounded-lg border border-neutral-200 font-mono text-neutral-900"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.001"
                          value={br.price}
                          onChange={(e) => updateBracketField(setWeightBrackets, idx, 'price', Number(e.target.value || 0))}
                          placeholder="Prix TND"
                          className="col-span-2 h-9 px-2.5 rounded-lg border border-neutral-200 font-mono font-bold text-neutral-900"
                        />
                        <input
                          type="text"
                          value={br.label || ''}
                          onChange={(e) => updateBracketField(setWeightBrackets, idx, 'label', e.target.value)}
                          placeholder="Libellé affiché"
                          className="col-span-4 h-9 px-2.5 rounded-lg border border-neutral-200 text-neutral-800"
                        />
                        <button
                          type="button"
                          onClick={() => setWeightBrackets((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={weightBrackets.length <= 1}
                          className="col-span-1 h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'FIXED' && (
                <div className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900">Tarif Fixe &amp; Prix de Repli</h4>
                      <p className="text-[11px] text-neutral-500">
                        Utilisé lorsque « Tarif Fixe » est choisi ou en cas de repli hors plage configuré dans les règles système.
                      </p>
                    </div>
                    <Toggle compact size="sm" checked={fixedEnabled} onChange={setFixedEnabled} ariaLabel="Activer Tarif Fixe" />
                  </div>
                  <div className="max-w-xs">
                    <label className="block font-bold text-neutral-700 mb-1">Montant Forfaitaire (TND)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.001"
                      value={formFixedPrice}
                      onChange={(e) => setFormFixedPrice(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-neutral-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name}
        isDeleting={saving}
      />
    </div>
  );
}
