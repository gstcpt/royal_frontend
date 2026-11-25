'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  MapPin,
  Plus,
  Trash2,
  Save,
  ArrowLeftRight,
  FileText,
  Printer,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { Breadcrumb, Button, GuideInfoButton, Toast, Toggle, ViewGuideModal, ViewGuideStep } from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';

interface CustomDistanceRow {
  id: string;
  fromCountry: string;
  fromState: string;
  toCountry: string;
  toState: string;
  distanceKm: number;
  bidirectional: boolean;
}

interface CountryCatalogItem {
  code: string;
  nameFr: string;
  states: Array<{ name: string; lat: number; lng: number }>;
}

const DELIVERY_SETTINGS_GUIDE: ViewGuideStep[] = [
  {
    id: 'ds-guide',
    number: '01',
    title: 'Arbitrage Distances, Retrait Showroom & Codage Documentaire',
    description:
      'Contrôlez le calcul géographique Point A ➔ Point B, le comportement hors-plage et le déclenchement des Demandes de Transfert (DTR / TRF).',
    fields: [
      {
        label: 'Surcharges de Distance (Point A ➔ Point B)',
        example: 'TN / Tunis ➔ TN / Sousse = 140 km',
        steps: [
          'Sans surcharge manuelle, le moteur calcule la distance géodésique entre les gouvernorats/états.',
          'Ajoutez ici vos distances routières exactes pour primer sur le calcul automatique.',
        ],
      },
      {
        label: 'Retrait en Showroom & Réassort',
        example: 'Commande Web ➔ Demande DTR-2026-XXXX',
        steps: [
          'Si le stock du dépôt rattaché au showroom choisi est insuffisant, le checkout crée quand même la commande et génère une demande de transfert.',
          'ROOT, SUPER_ADMIN et WEBSITE_MANAGER reçoivent une notification cliquable pointant vers /dashboard/transfers/[id].',
        ],
      },
    ],
  },
];

export default function DeliverySettingsPage() {
  const { isRouteVisible } = useRouteVisibility();
  const [countries, setCountries] = useState<CountryCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);
  const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    type: 'success',
  });

  const [defaultItemWeightKg, setDefaultItemWeightKg] = useState('1');
  const [outOfRangeBehavior, setOutOfRangeBehavior] = useState<'FALLBACK_FIXED' | 'UNAVAILABLE'>('FALLBACK_FIXED');
  const [applyFreeShippingThreshold, setApplyFreeShippingThreshold] = useState(true);
  const [autoCreateShowroomTransfer, setAutoCreateShowroomTransfer] = useState(true);
  const [defaultTransferAcceptanceMode, setDefaultTransferAcceptanceMode] = useState<'CHOICE' | 'IMMEDIATE' | 'STEP_BY_STEP'>('CHOICE');
  const [customDistances, setCustomDistances] = useState<CustomDistanceRow[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, geoRes] = await Promise.all([
        fetchApi('/deliveries/settings').catch(() => null),
        fetchApi('/deliveries/geography').catch(() => ({ countries: [] })),
      ]);
      setCountries(Array.isArray(geoRes?.countries) ? geoRes.countries : []);
      if (settingsRes) {
        setDefaultItemWeightKg(String(settingsRes.defaultItemWeightKg ?? 1));
        setOutOfRangeBehavior(settingsRes.outOfRangeBehavior === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FALLBACK_FIXED');
        setApplyFreeShippingThreshold(settingsRes.applyFreeShippingThreshold !== false);
        setAutoCreateShowroomTransfer(settingsRes.autoCreateShowroomTransfer !== false);
        setDefaultTransferAcceptanceMode(settingsRes.defaultTransferAcceptanceMode || 'CHOICE');
        setCustomDistances(Array.isArray(settingsRes.customDistances) ? settingsRes.customDistances : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statesFor = (code: string) => countries.find((c) => c.code === code)?.states || [];

  const addCustomDistanceRow = () => {
    const tnStates = statesFor('TN');
    setCustomDistances((prev) => [
      ...prev,
      {
        id: `dist-${Date.now()}`,
        fromCountry: 'TN',
        fromState: tnStates[0]?.name || 'Tunis',
        toCountry: 'TN',
        toState: tnStates[1]?.name || 'Sousse',
        distanceKm: 140,
        bidirectional: true,
      },
    ]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/deliveries/settings', {
        method: 'PUT',
        body: JSON.stringify({
          defaultItemWeightKg: Math.max(0.05, Number(defaultItemWeightKg || 1)),
          outOfRangeBehavior,
          applyFreeShippingThreshold,
          autoCreateShowroomTransfer,
          defaultTransferAcceptanceMode,
          customDistances,
        }),
      });
      setToast({
        open: true,
        message: 'Règles de livraison, distances et transferts enregistrées.',
        type: 'success',
      });
      await loadData();
    } catch (err: any) {
      setToast({
        open: true,
        message: err?.message || 'Erreur lors de la sauvegarde.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

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
        title="Guide — Règles Livraison, Distances & Transferts"
        subtitle="Paramétrage global logistique, poids défaut & workflow showroom"
        steps={DELIVERY_SETTINGS_GUIDE}
        currentIndex={guideIndex}
        onStepChange={setGuideIndex}
      />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-10 h-10 rounded-2xl bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#1D232E] tracking-tight">
              Règles Livraison, Distances &amp; Transferts Showroom
            </h1>
            <GuideInfoButton onClick={() => setGuideOpen(true)} />
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Pilotez les règles transverses des calculs de frais de port (poids défaut, hors plage, distances routières Point A ➔ Point B) et le workflow des demandes de transfert inter-dépôts.
          </p>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Système', href: '/dashboard/section/system' },
              { label: 'Règles Livraison & Transferts' },
            ]}
          />
        </div>

        <Button variant="gold" onClick={handleSave} isLoading={saving} disabled={loading} className="text-xs px-5 py-2.5 flex items-center gap-2 shrink-0">
          <Save className="w-4 h-4" />
          <span>Enregistrer les Règles</span>
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left: Core Delivery & Showroom Transfer Rules */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 space-y-4">
            <h2 className="font-heading font-bold text-sm text-[#1D232E] flex items-center gap-2 pb-2 border-b border-neutral-100">
              <Truck className="w-4 h-4 text-[#C59B27]" />
              <span>Calcul Transporteurs &amp; Repli</span>
            </h2>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Poids unitaire par défaut d’un article sans poids (kg)
              </label>
              <input
                type="number"
                min={0.05}
                step="0.05"
                value={defaultItemWeightKg}
                onChange={(e) => setDefaultItemWeightKg(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 font-mono text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Comportement si poids/distance hors tranches [min..max]
              </label>
              <select
                value={outOfRangeBehavior}
                onChange={(e) => setOutOfRangeBehavior(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-900"
              >
                <option value="FALLBACK_FIXED">Appliquer le Tarif Fixe du transporteur (Repli)</option>
                <option value="UNAVAILABLE">Marquer le transporteur « Hors plage / Indisponible »</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-neutral-900">Seuil de Livraison Gratuite</p>
                <p className="text-[11px] text-neutral-500">
                  Offre les frais (0 TND) dès que le panier atteint le seuil global CMS.
                </p>
              </div>
              <Toggle
                compact
                size="sm"
                checked={applyFreeShippingThreshold}
                onChange={setApplyFreeShippingThreshold}
                ariaLabel="Seuil livraison gratuite"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 space-y-4">
            <h2 className="font-heading font-bold text-sm text-[#1D232E] flex items-center gap-2 pb-2 border-b border-neutral-100">
              <ArrowLeftRight className="w-4 h-4 text-[#C59B27]" />
              <span>Workflow Retrait Showroom &amp; Demandes de Transfert</span>
            </h2>

            <div className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-neutral-900">Créer automatiquement DTR/TRF si rupture Showroom</p>
                <p className="text-[11px] text-neutral-500">
                  Enregistre la commande client + alerte ROOT / SUPER_ADMIN / WEBSITE_MANAGER.
                </p>
              </div>
              <Toggle
                compact
                size="sm"
                checked={autoCreateShowroomTransfer}
                onChange={setAutoCreateShowroomTransfer}
                ariaLabel="Création auto demande transfert"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Mode de Validation Direction sur /dashboard/transfers/[id]
              </label>
              <select
                value={defaultTransferAcceptanceMode}
                onChange={(e) => setDefaultTransferAcceptanceMode(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-900"
              >
                <option value="CHOICE">Choix libre (Exécution Immédiate OU Suivi par Étapes)</option>
                <option value="IMMEDIATE">Pré-sélectionner Exécution Immédiate (BS + BE en 1 clic)</option>
                <option value="STEP_BY_STEP">Pré-sélectionner Suivi par Étapes (APPROUVÉ ➔ EN TRANSIT ➔ RÉCEPTIONNÉ)</option>
              </select>
            </div>
          </div>

          {/* Document Codage & Print Templates Shortcuts */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 space-y-3">
            <h2 className="font-heading font-bold text-sm text-[#1D232E] flex items-center gap-2 pb-2 border-b border-neutral-100">
              <FileText className="w-4 h-4 text-[#C59B27]" />
              <span>Codage Documentaire &amp; Modèles d’Impression</span>
            </h2>
            <p className="text-[11px] text-neutral-500">
              Personnalisez les formats de numérotation (`DTR`, `TRF`, `BS`, `BE`, `BL`) et leurs gabarits HTML A4/80mm dans le module Système.
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/root/reference-prefixes"
                className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4] transition"
              >
                <span className="font-bold text-neutral-900">Préfixes &amp; Numérotations (DTR, TRF, BS, BE, BL)</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C59B27]" />
              </Link>
              <Link
                href="/dashboard/root/print-templates"
                className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4] transition"
              >
                <span className="font-bold text-neutral-900 inline-flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-[#C59B27]" />
                  Gabarits d’Impression (TPL-DEMANDE-TRF, TPL-TRANSFERT)
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C59B27]" />
              </Link>
              {isRouteVisible('/dashboard/delivery-companies') && (
                <Link
                  href="/dashboard/delivery-companies"
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4] transition"
                >
                  <span className="font-bold text-neutral-900">Gérer les Sociétés &amp; Tarifs de Livraison</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#C59B27]" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right: Custom Point A -> Point B km Overrides */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
            <div>
              <h2 className="font-heading font-bold text-sm text-[#1D232E] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C59B27]" />
                <span>Surcharges de Distance Routière (Point A ➔ Point B)</span>
              </h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Définissez une distance exacte en km entre un Pays/Gouvernorat d’origine et une destination. Prioritaire sur le calcul GPS géodésique.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCustomDistanceRow} className="text-xs shrink-0">
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter Trajet</span>
            </Button>
          </div>

          {customDistances.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#FBF9F4] border border-dashed border-[#E6D6A6] text-center space-y-2">
              <p className="font-bold text-neutral-800">Aucune surcharge manuelle définie</p>
              <p className="text-[11px] text-neutral-500">
                Le moteur calcule automatiquement la distance entre tous les gouvernorats tunisiens et régions supportées. Ajoutez une ligne uniquement pour fixer un kilométrage routier précis.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {customDistances.map((row, idx) => (
                <div key={row.id} className="p-3.5 rounded-xl border border-neutral-200 bg-[#FBF9F4]/60 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">Pays A</label>
                    <select
                      value={row.fromCountry}
                      onChange={(e) => {
                        const cCode = e.target.value;
                        const firstState = statesFor(cCode)[0]?.name || '';
                        setCustomDistances((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, fromCountry: cCode, fromState: firstState } : r)),
                        );
                      }}
                      className="w-full h-9 px-2 rounded-lg border border-neutral-200 bg-white text-neutral-900"
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">État / Gouv. A</label>
                    <select
                      value={row.fromState}
                      onChange={(e) =>
                        setCustomDistances((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, fromState: e.target.value } : r)),
                        )
                      }
                      className="w-full h-9 px-2 rounded-lg border border-neutral-200 bg-white text-neutral-900"
                    >
                      {statesFor(row.fromCountry).map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">Pays B</label>
                    <select
                      value={row.toCountry}
                      onChange={(e) => {
                        const cCode = e.target.value;
                        const firstState = statesFor(cCode)[0]?.name || '';
                        setCustomDistances((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, toCountry: cCode, toState: firstState } : r)),
                        );
                      }}
                      className="w-full h-9 px-2 rounded-lg border border-neutral-200 bg-white text-neutral-900"
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">État / Gouv. B</label>
                    <select
                      value={row.toState}
                      onChange={(e) =>
                        setCustomDistances((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, toState: e.target.value } : r)),
                        )
                      }
                      className="w-full h-9 px-2 rounded-lg border border-neutral-200 bg-white text-neutral-900"
                    >
                      {statesFor(row.toCountry).map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">km</label>
                    <input
                      type="number"
                      min={0}
                      value={row.distanceKm}
                      onChange={(e) =>
                        setCustomDistances((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, distanceKm: Number(e.target.value || 0) } : r)),
                        )
                      }
                      className="w-full h-9 px-2 rounded-lg border border-neutral-200 bg-white font-mono text-neutral-900"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setCustomDistances((prev) => prev.filter((_, i) => i !== idx))}
                      className="h-9 w-9 rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                      title="Supprimer ce trajet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
