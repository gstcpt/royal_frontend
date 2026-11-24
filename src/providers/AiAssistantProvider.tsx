'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Bot,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Cpu,
  X,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export interface AiOverviewTargetMeta {
  id: string;
  label: string;
  section: string;
}

export interface AiFormTargetMeta {
  id: string;
  label: string;
  section: string;
}

export const AI_OVERVIEW_TARGETS: AiOverviewTargetMeta[] = [
  { id: 'main', label: 'Tableau de bord général', section: '1. Tableau de bord' },
  { id: 'community', label: "Vue d'ensemble — Communauté", section: '2. Communauté' },
  { id: 'users', label: "Vue d'ensemble — Utilisateurs", section: '3. Utilisateurs' },
  { id: 'catalogue', label: "Vue d'ensemble — Catalogue", section: '4. Catalogue' },
  { id: 'treasury', label: "Vue d'ensemble — Trésorerie", section: '5. Trésorerie' },
  { id: 'purchases', label: "Vue d'ensemble — Achats", section: '6. Achats' },
  { id: 'stock', label: "Vue d'ensemble — Stock & Entrepôts", section: '7. Stock' },
  { id: 'sales', label: "Vue d'ensemble — Ventes", section: '8. Ventes' },
  { id: 'pos', label: "Vue d'ensemble — Point de Vente POS", section: '9. Point de vente' },
  { id: 'seo', label: "Vue d'ensemble — SEO & Réputation", section: '10. SEO' },
  { id: 'reports', label: "Vue d'ensemble — Rapports", section: '11. Rapports' },
  { id: 'analytics', label: "Conseils d'achat & Trafic Analytics", section: '11. Rapports' },
  { id: 'client', label: "Vue d'ensemble — Espace Client", section: '12. Espace Client' },
  { id: 'system', label: "Vue d'ensemble — Système & CMS", section: '13. Système' },
];

export const AI_FORM_TARGETS: AiFormTargetMeta[] = [
  { id: 'articles', label: 'Articles (Ajout / Édition / SEO)', section: '4. Catalogue' },
  { id: 'categories', label: 'Catégories', section: '4. Catalogue' },
  { id: 'brands', label: 'Marques', section: '4. Catalogue' },
  { id: 'characteristics', label: 'Caractéristiques Techniques', section: '4. Catalogue' },
  { id: 'variants', label: 'Variantes & Options', section: '4. Catalogue' },
  { id: 'coupons', label: 'Codes Promotionnels', section: '4. Catalogue' },
  { id: 'suppliers', label: 'Fournisseurs & Prospects', section: '6. Achats' },
  { id: 'purchases', label: 'Bons de Commande / Réception (BC/BR)', section: '6. Achats' },
  { id: 'warehouses', label: 'Dépôts & Emplacements', section: '7. Stock' },
  { id: 'stock_docs', label: 'Documents Stock (BE / BS / INV / TRF)', section: '7. Stock' },
  { id: 'customers', label: 'Fiches Clients CRM', section: '8. Ventes' },
  { id: 'orders', label: 'Commandes, Livraisons, Retours, Factures', section: '8. Ventes' },
  { id: 'showrooms', label: "Salles d'Exposition (Showrooms POS)", section: '9. Point de vente' },
  { id: 'testimonials', label: 'Témoignages & Avis SEO', section: '10. SEO' },
  { id: 'treasury', label: 'Caisses, Règlements & Comptabilité', section: '5. Trésorerie' },
  { id: 'users', label: 'Utilisateurs & Comptes Équipe', section: '3. Utilisateurs' },
  { id: 'email_templates', label: 'Modèles de Courriels', section: '13. Système' },
  { id: 'system', label: 'Paramètres Système (TVA, Préfixes, Impressions, Paiement)', section: '13. Système' },
  { id: 'generic', label: 'Autres Formulaires Modales', section: 'Général' },
];

export function resolveFormKeyFromPath(pathname?: string | null): string {
  const p = String(pathname || '').toLowerCase();
  if (p.includes('/articles')) return 'articles';
  if (p.includes('/categories')) return 'categories';
  if (p.includes('/brands')) return 'brands';
  if (p.includes('/characteristics')) return 'characteristics';
  if (p.includes('/variants')) return 'variants';
  if (p.includes('/coupons')) return 'coupons';
  if (p.includes('/suppliers') || p.includes('/prospects')) return 'suppliers';
  if (p.includes('/purchases/')) return 'purchases';
  if (p.includes('/warehouses')) return 'warehouses';
  if (p.includes('/stock-') || p.includes('/inventory') || p.includes('/transfers')) return 'stock_docs';
  if (p.includes('/customers')) return 'customers';
  if (p.includes('/orders') || p.includes('/deliveries') || p.includes('/returns') || p.includes('/invoices')) return 'orders';
  if (p.includes('/pos/showrooms')) return 'showrooms';
  if (p.includes('/testimonials') || p.includes('/seo/')) return 'testimonials';
  if (p.includes('/treasury') || p.includes('/accounting')) return 'treasury';
  if (p.includes('/users') || p.includes('/superadmins')) return 'users';
  if (p.includes('/email-templates')) return 'email_templates';
  if (p.includes('/root/') || p.includes('/settings') || p.includes('/payment-methods') || p.includes('/translations')) return 'system';
  return 'generic';
}

export interface AiAvailabilityState {
  enabled: boolean;
  primaryProvider: 'GEMINI' | 'GROQ';
  secondaryProvider: 'GEMINI' | 'GROQ';
  primaryModel: string;
  secondaryModel: string;
  hasWorker1: boolean;
  hasWorker2: boolean;
  enableCatalogCopy: boolean;
  enableAnalyticsInsights: boolean;
  enableOverviewRecaps: boolean;
  enableFormAutofill: boolean;
  recapTargets: Record<string, boolean>;
  formTargets: Record<string, boolean>;
}

interface WorkerSnapshot {
  provider: 'GEMINI' | 'GROQ';
  model: string;
  configured: boolean;
  quotaExhausted: boolean;
}

interface AiJobSnapshot {
  id: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED_QUOTA' | 'FAILED' | 'CANCELLED';
  mode: string;
  startedAt: number;
  elapsedMs: number;
  currentWorkerNumber: 1 | 2;
  currentProvider: 'GEMINI' | 'GROQ';
  currentModel: string;
  currentPhase: string;
  statusMessage: string;
  worker1: WorkerSnapshot;
  worker2: WorkerSnapshot;
  steps: Array<{
    phase: string;
    workerNumber: 1 | 2;
    provider: string;
    model: string;
    attempt: number;
    message: string;
    timestamp: string;
  }>;
  result?: any;
  error?: string;
  quotaExhausted?: boolean;
}

export interface RunAiJobInput {
  mode: 'PRODUCT_COPY' | 'ANALYTICS_INSIGHT' | 'SECTION_RECAP' | 'FORM_AUTOFILL' | 'TEST';
  payload?: Record<string, any>;
  overrideConfig?: Record<string, any>;
  title?: string;
  subtitle?: string;
}

interface AiContextValue {
  availability: AiAvailabilityState;
  loaded: boolean;
  refreshAvailability: () => Promise<void>;
  isRecapEnabled: (sectionId: string) => boolean;
  isFormEnabled: (formKey: string) => boolean;
  runAiJob: <T = any>(input: RunAiJobInput) => Promise<T | null>;
}

const DEFAULT_AVAILABILITY: AiAvailabilityState = {
  enabled: false,
  primaryProvider: 'GEMINI',
  secondaryProvider: 'GROQ',
  primaryModel: 'gemini-2.5-flash',
  secondaryModel: 'openai/gpt-oss-120b',
  hasWorker1: false,
  hasWorker2: false,
  enableCatalogCopy: true,
  enableAnalyticsInsights: true,
  enableOverviewRecaps: true,
  enableFormAutofill: true,
  recapTargets: {},
  formTargets: {},
};

const AiAssistantContext = createContext<AiContextValue | null>(null);

function formatElapsed(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function AiAssistantProvider({ children }: { children: React.ReactNode }) {
  const [availability, setAvailability] = useState<AiAvailabilityState>(DEFAULT_AVAILABILITY);
  const [loaded, setLoaded] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMeta, setModalMeta] = useState<{ title: string; subtitle: string }>({
    title: 'Traitement Intelligence Artificielle',
    subtitle: 'Orchestration multi-workers avec bascule automatique',
  });
  const [jobSnapshot, setJobSnapshot] = useState<AiJobSnapshot | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [toastState, setToastState] = useState<{ open: boolean; message: string; type: 'error' | 'info' | 'success' }>({
    open: false,
    message: '',
    type: 'info',
  });

  const activeJobIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);
  const startedAtRef = useRef(0);

  const refreshAvailability = useCallback(async () => {
    try {
      const res: any = await fetchApi('/storefront-cms/ai/availability');
      const data = res?.data || res;
      if (data && typeof data === 'object' && typeof data.enabled === 'boolean') {
        setAvailability({
          ...DEFAULT_AVAILABILITY,
          ...data,
          recapTargets: data.recapTargets || {},
          formTargets: data.formTargets || {},
        });
      }
    } catch {
      // Ignore quietly when unauthenticated or loading
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshAvailability();
    const handler = () => {
      refreshAvailability();
    };
    window.addEventListener('royal:ai-config-updated', handler);
    return () => window.removeEventListener('royal:ai-config-updated', handler);
  }, [refreshAvailability]);

  useEffect(() => {
    if (!modalOpen) return;
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    return () => clearInterval(timer);
  }, [modalOpen]);

  const isRecapEnabled = useCallback(
    (sectionId: string) => {
      if (!availability.enabled || !availability.enableOverviewRecaps) return false;
      const key = String(sectionId || 'main').toLowerCase();
      return availability.recapTargets?.[key] !== false;
    },
    [availability],
  );

  const isFormEnabled = useCallback(
    (formKey: string) => {
      if (!availability.enabled || !availability.enableFormAutofill) return false;
      const key = String(formKey || 'generic').toLowerCase();
      return availability.formTargets?.[key] !== false;
    },
    [availability],
  );

  const handleCancelActiveJob = useCallback(async () => {
    cancelledRef.current = true;
    const id = activeJobIdRef.current;
    setModalOpen(false);
    if (id) {
      await fetchApi(`/storefront-cms/ai/jobs/${id}/cancel`, { method: 'POST' }).catch(() => null);
    }
    activeJobIdRef.current = null;
  }, []);

  const runAiJob = useCallback(
    async <T = any>(input: RunAiJobInput): Promise<T | null> => {
      cancelledRef.current = false;
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setModalMeta({
        title: input.title || 'Assistant Intelligence Artificielle Royal',
        subtitle:
          input.subtitle ||
          'Worker 1 prioritaire avec bascule automatique vers Worker 2 en cas d’indisponibilité',
      });
      setJobSnapshot({
        id: 'pending',
        status: 'RUNNING',
        mode: input.mode,
        startedAt: Date.now(),
        elapsedMs: 0,
        currentWorkerNumber: availability.hasWorker1 ? 1 : 2,
        currentProvider: availability.hasWorker1 ? availability.primaryProvider : availability.secondaryProvider,
        currentModel: availability.hasWorker1 ? availability.primaryModel : availability.secondaryModel,
        currentPhase: 'STARTING',
        statusMessage: 'Démarrage des workers IA...',
        worker1: {
          provider: availability.primaryProvider,
          model: availability.primaryModel,
          configured: availability.hasWorker1,
          quotaExhausted: !availability.hasWorker1,
        },
        worker2: {
          provider: availability.secondaryProvider,
          model: availability.secondaryModel,
          configured: availability.hasWorker2,
          quotaExhausted: !availability.hasWorker2,
        },
        steps: [],
      });
      setModalOpen(true);

      try {
        const startRes: any = await fetchApi('/storefront-cms/ai/jobs', {
          method: 'POST',
          body: JSON.stringify({
            mode: input.mode,
            payload: input.payload || {},
            overrideConfig: input.overrideConfig,
          }),
        });
        const jobMeta = startRes?.data || startRes;
        const jobId = jobMeta?.jobId;
        if (!jobId) {
          throw new Error('Impossible d’initialiser la tâche IA.');
        }
        activeJobIdRef.current = jobId;

        while (!cancelledRef.current) {
          await new Promise((r) => setTimeout(r, 450));
          if (cancelledRef.current) break;

          const statusRes: any = await fetchApi(`/storefront-cms/ai/jobs/${jobId}`);
          const snap: AiJobSnapshot = statusRes?.data || statusRes;
          if (!snap) continue;
          setJobSnapshot(snap);

          if (snap.status === 'COMPLETED') {
            await new Promise((r) => setTimeout(r, 380));
            setModalOpen(false);
            activeJobIdRef.current = null;
            return (snap.result ?? null) as T;
          }

          if (snap.status === 'FAILED_QUOTA' || snap.status === 'FAILED') {
            setModalOpen(false);
            activeJobIdRef.current = null;
            setToastState({
              open: true,
              type: 'error',
              message:
                snap.error ||
                "Limite d'utilisation atteinte sur les deux fournisseurs IA. Réessayez plus tard.",
            });
            return null;
          }

          if (snap.status === 'CANCELLED') {
            setModalOpen(false);
            activeJobIdRef.current = null;
            return null;
          }
        }
        return null;
      } catch (err: any) {
        setModalOpen(false);
        activeJobIdRef.current = null;
        setToastState({
          open: true,
          type: 'error',
          message: err?.message || 'Erreur lors de l’exécution de l’assistant IA.',
        });
        return null;
      }
    },
    [availability],
  );

  const ctxValue = useMemo<AiContextValue>(
    () => ({
      availability,
      loaded,
      refreshAvailability,
      isRecapEnabled,
      isFormEnabled,
      runAiJob,
    }),
    [availability, loaded, refreshAvailability, isRecapEnabled, isFormEnabled, runAiJob],
  );

  const activePhaseIdx = (() => {
    const ph = jobSnapshot?.currentPhase || 'STARTING';
    if (ph === 'COMPLETED') return 4;
    if (ph === 'WORKING') return 3;
    if (ph === 'THINKING' || ph === 'SWITCHING' || ph === 'RETRYING') return 2;
    return 1;
  })();

  return (
    <AiAssistantContext.Provider value={ctxValue}>
      {children}

      <Toast
        isOpen={toastState.open}
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState((s) => ({ ...s, open: false }))}
      />

      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{ zIndex: 99990 }}
            className="fixed inset-0 flex items-center justify-center p-4 bg-neutral-950/65 backdrop-blur-md animate-in fade-in duration-150"
          >
            <div className="w-full max-w-xl rounded-3xl bg-white border border-[#E6D6A6] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 bg-[#FBF9F4] border-b border-[#E6E1D6] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--royal-primary)] text-white flex items-center justify-center shadow-sm shrink-0 relative">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-black text-base text-[#1D232E] truncate">
                      {modalMeta.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{modalMeta.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E6D6A6] font-mono text-xs font-black text-[#9A7414]">
                    <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>{formatElapsed(elapsedMs)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelActiveJob}
                    title="Interrompre"
                    className="w-8 h-8 rounded-xl bg-white border border-neutral-200 text-slate-500 hover:text-neutral-900 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Workers Status Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { num: 1 as const, data: jobSnapshot?.worker1 },
                    { num: 2 as const, data: jobSnapshot?.worker2 },
                  ].map(({ num, data }) => {
                    const isActive = jobSnapshot?.currentWorkerNumber === num && jobSnapshot?.status === 'RUNNING';
                    const isWinner = jobSnapshot?.currentWorkerNumber === num && jobSnapshot?.status === 'COMPLETED';
                    const isQuotaOut = data?.quotaExhausted;
                    const labelState = !data?.configured
                      ? 'Non configuré'
                      : isQuotaOut
                      ? 'Quota atteint'
                      : isWinner
                      ? 'Terminé ✓'
                      : isActive
                      ? jobSnapshot?.currentPhase === 'SWITCHING'
                        ? 'Bascule technique...'
                        : jobSnapshot?.currentPhase === 'THINKING'
                        ? 'Réflexion en cours...'
                        : jobSnapshot?.currentPhase === 'WORKING'
                        ? 'Rédaction...'
                        : 'En travail...'
                      : 'En veille (Backup)';

                    return (
                      <div
                        key={num}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isWinner
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : isActive
                            ? 'bg-[#FBF6E8] border-[#C59B27] shadow-xs ring-1 ring-[#C59B27]/30'
                            : isQuotaOut
                            ? 'bg-rose-50/50 border-rose-200 opacity-75'
                            : 'bg-[#F8F9FA] border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                isWinner
                                  ? 'bg-emerald-600 text-white'
                                  : isActive
                                  ? 'bg-[var(--royal-primary)] text-white'
                                  : 'bg-white border border-neutral-200 text-slate-600'
                              }`}
                            >
                              {isActive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : num}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-[#1D232E] truncate">
                                Worker {num} · {data?.provider || '—'}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 truncate">
                                {data?.model || 'Non défini'}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isWinner
                                ? 'bg-emerald-100 text-emerald-800'
                                : isActive
                                ? 'bg-white text-[#9A7414] border border-[#E6D6A6]'
                                : isQuotaOut
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-white text-slate-500 border border-neutral-200'
                            }`}
                          >
                            {labelState}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live 4-Stage Pipeline */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { idx: 1, label: 'Connexion' },
                    { idx: 2, label: 'Réflexion' },
                    { idx: 3, label: 'Rédaction' },
                    { idx: 4, label: 'Prêt' },
                  ].map((st) => {
                    const done = activePhaseIdx > st.idx;
                    const current = activePhaseIdx === st.idx;
                    return (
                      <div key={st.idx} className="space-y-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            done
                              ? 'bg-emerald-500'
                              : current
                              ? 'bg-[var(--royal-primary)] animate-pulse'
                              : 'bg-neutral-200'
                          }`}
                        />
                        <div
                          className={`text-[10px] font-bold text-center ${
                            done ? 'text-emerald-700' : current ? 'text-[#9A7414]' : 'text-slate-400'
                          }`}
                        >
                          {st.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Current Status Highlight Banner */}
                <div className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6] flex items-center gap-3 text-xs text-[#1D232E]">
                  {jobSnapshot?.currentPhase === 'SWITCHING' ? (
                    <ArrowRightLeft className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                  ) : jobSnapshot?.currentPhase === 'QUOTA_EXHAUSTED' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : jobSnapshot?.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Cpu className="w-4 h-4 text-[#C59B27] shrink-0 animate-pulse" />
                  )}
                  <span className="font-semibold leading-snug">
                    {jobSnapshot?.statusMessage || 'Traitement intelligent en cours...'}
                  </span>
                </div>

                {/* Compact Live Step History */}
                {jobSnapshot?.steps && jobSnapshot.steps.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 bg-[#F8F9FA] p-3 max-h-32 overflow-y-auto overflow-x-hidden space-y-1.5">
                    {jobSnapshot.steps.slice(-6).map((s, idx) => (
                      <div key={idx} className="text-[11px] flex items-start gap-2 text-slate-600">
                        <Bot className="w-3.5 h-3.5 text-[#C59B27] shrink-0 mt-0.5" />
                        <span className="break-words">{s.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 bg-[#FBF9F4] border-t border-[#E6E1D6] flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Bascule auto Worker 1 ↔ Worker 2 jusqu&apos;à obtention du résultat
                </span>
                <Button variant="outline" size="sm" onClick={handleCancelActiveJob}>
                  Annuler
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant(): AiContextValue {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) {
    return {
      availability: DEFAULT_AVAILABILITY,
      loaded: false,
      refreshAvailability: async () => {},
      isRecapEnabled: () => false,
      isFormEnabled: () => false,
      runAiJob: async () => null,
    };
  }
  return ctx;
}

export function useOptionalAiAssistant(): AiContextValue | null {
  return useContext(AiAssistantContext);
}
