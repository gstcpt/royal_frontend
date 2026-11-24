'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Save,
  Eye,
  EyeOff,
  Compass,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Bot,
  LayoutDashboard,
  FileEdit,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Toggle,
  Breadcrumb,
  Toast,
  GuideInfoButton,
  ViewGuideModal,
  ViewGuideStep,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';
import {
  AI_FORM_TARGETS,
  AI_OVERVIEW_TARGETS,
  useAiAssistant,
} from '@/providers/AiAssistantProvider';

const DEFAULT_GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b (Flagship — Qualité & FR/AR)' },
  { id: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b (Ultra Rapide)' },
  { id: 'qwen/qwen3.8-27b', label: 'qwen/qwen3.8-27b (Alibaba Qwen 3.8)' },
  { id: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile (Si activé sur votre projet Groq)' },
  { id: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant (Instant léger)' },
  { id: 'allam-2-7b', label: 'allam-2-7b (Spécialisé Arabe / FR)' },
];

const AI_GUIDE_STEPS: ViewGuideStep[] = [
  {
    id: 'gemini-free',
    number: '01',
    title: 'Google AI Studio — Gemini Flash (Gratuit 1 500 req/jour)',
    description: 'Aucune carte bancaire requise pour générer des récaps sections, formulaires et SEO.',
    platformLabel: 'Obtenir une Clé Google AI Studio',
    platformUrl: 'https://aistudio.google.com/app/apikey',
    fields: [
      {
        label: 'Clé API Gemini (AIza...)',
        example: 'Modèle conseillé : gemini-2.5-flash',
        steps: [
          'Connectez-vous sur Google AI Studio avec un compte Google.',
          'Cliquez sur « Get API Key → Create API key in new project ».',
          'Copiez la clé ci-contre puis cliquez sur « Tester Connexion IA ».',
        ],
      },
    ],
  },
  {
    id: 'groq-free',
    number: '02',
    title: 'Groq Cloud LPU — Modèles Open-Weight Gratuits',
    description: 'Worker secondaire ou principal avec bascule automatique sans coupure si le premier worker est occupé.',
    platformLabel: 'Obtenir une Clé Gratuite Groq',
    platformUrl: 'https://console.groq.com/keys',
    fields: [
      {
        label: 'Clé API Groq (gsk_...)',
        example: 'Modèle conseillé : openai/gpt-oss-120b ou qwen/qwen3.8-27b',
        steps: [
          'Ouvrez console.groq.com → API Keys → Create API Key.',
          'En cas de serveur occupé ou panne technique, le système bascule en boucle entre Worker 1 et Worker 2.',
          'Une notification Toast s’affiche uniquement lorsque les deux quotas d’utilisation sont épuisés.',
        ],
      },
    ],
  },
];

export default function AiProviderRootPage() {
  const { runAiJob, refreshAvailability } = useAiAssistant();
  const [config, setConfig] = useState({
    enabled: false,
    provider: 'GEMINI' as 'GEMINI' | 'GROQ',
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    groqApiKey: '',
    groqModel: 'openai/gpt-oss-120b',
    enableCatalogCopy: true,
    enableAnalyticsInsights: true,
    enableOverviewRecaps: true,
    enableFormAutofill: true,
    recapTargets: {} as Record<string, boolean>,
    formTargets: {} as Record<string, boolean>,
    defaultTone: 'Luxe éditorial sobre, précis et orienté conversion (Tunisie, TND)',
  });
  const [groqModels, setGroqModels] = useState<{ id: string; label: string }[]>(DEFAULT_GROQ_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testReply, setTestReply] = useState<{ ok: boolean; text: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/aiProvider');
      const v = res?.value || res?.data?.value || {};
      setConfig((prev) => ({
        ...prev,
        ...v,
        groqModel: v?.groqModel || 'openai/gpt-oss-120b',
        enableOverviewRecaps: v?.enableOverviewRecaps !== false,
        enableFormAutofill: v?.enableFormAutofill !== false,
        recapTargets: v?.recapTargets && typeof v.recapTargets === 'object' ? v.recapTargets : {},
        formTargets: v?.formTargets && typeof v.formTargets === 'object' ? v.formTargets : {},
      }));
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Accès réservé au compte ROOT.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleFetchGroqModels = async (silent = false) => {
    if (!config.groqApiKey.trim()) {
      if (!silent) {
        setToastMsg({ text: 'Saisissez votre clé Groq (gsk_...) pour détecter vos modèles.', type: 'error' });
      }
      return;
    }
    setLoadingModels(true);
    try {
      const res = await fetchApi('/storefront-cms/ai/models', {
        method: 'POST',
        body: JSON.stringify({ provider: 'GROQ', apiKey: config.groqApiKey.trim() }),
      });
      const list: string[] = res?.models || res?.data?.models || [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((id) => {
          const known = DEFAULT_GROQ_MODELS.find((d) => d.id === id);
          return { id, label: known ? known.label : id };
        });
        setGroqModels(mapped);
        if (!list.includes(config.groqModel)) {
          setConfig((prev) => ({ ...prev, groqModel: list[0] }));
        }
        if (!silent) {
          setToastMsg({ text: `${list.length} modèle(s) Groq disponibles détectés.`, type: 'success' });
        }
      }
    } catch (err: any) {
      if (!silent) {
        setToastMsg({ text: err?.message || 'Impossible de charger les modèles Groq.', type: 'error' });
      }
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/aiProvider', {
        method: 'PUT',
        body: JSON.stringify({ value: config }),
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('royal:ai-config-updated'));
      }
      await refreshAvailability();
      setToastMsg({ text: 'Configuration Intelligence Artificielle enregistrée et diffusée.', type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Erreur sauvegarde IA.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestAi = async () => {
    setTesting(true);
    setTestReply(null);
    try {
      const payload = await runAiJob({
        mode: 'TEST',
        overrideConfig: config,
        title: 'Diagnostic Failover Workers IA',
        subtitle: `Test boucle Worker 1 (${config.provider}) ↔ Worker 2 (${config.provider === 'GEMINI' ? 'GROQ' : 'GEMINI'})`,
      });
      if (!payload) {
        setTestReply({
          ok: false,
          text: 'Test annulé ou quotas épuisés sur les workers configurés.',
        });
        return;
      }
      if (payload?.provider === 'GROQ' && payload?.model && payload.model !== config.groqModel) {
        setConfig((prev) => ({ ...prev, groqModel: payload.model }));
        setGroqModels((prev) =>
          prev.some((m) => m.id === payload.model)
            ? prev
            : [{ id: payload.model, label: `${payload.model} (Actif détecté)` }, ...prev],
        );
      }
      const fallbackNote = payload?.fallbackFrom
        ? ` (Bascule auto Worker 1 ${payload.fallbackFrom} → Worker 2 ${payload.provider})`
        : '';
      setTestReply({
        ok: true,
        text: `[Worker ${payload?.workerNumber || 1} • ${payload?.provider} • ${payload?.model}] ${payload?.reply || 'Connexion opérationnelle.'}${fallbackNote}`,
      });
    } catch (err: any) {
      setTestReply({
        ok: false,
        text: err?.message || 'Échec de connexion aux workers IA.',
      });
    } finally {
      setTesting(false);
    }
  };

  const groqSelectOptions = React.useMemo(() => {
    const base = groqModels.map((m) => ({ label: m.label, value: m.id }));
    if (config.groqModel && !base.some((o) => o.value === config.groqModel)) {
      base.unshift({ label: config.groqModel, value: config.groqModel });
    }
    return base;
  }, [groqModels, config.groqModel]);

  const setAllRecapTargets = (val: boolean) => {
    const next: Record<string, boolean> = {};
    AI_OVERVIEW_TARGETS.forEach((t) => {
      next[t.id] = val;
    });
    setConfig((prev) => ({ ...prev, recapTargets: next }));
  };

  const setAllFormTargets = (val: boolean) => {
    const next: Record<string, boolean> = {};
    AI_FORM_TARGETS.forEach((t) => {
      next[t.id] = val;
    });
    setConfig((prev) => ({ ...prev, formTargets: next }));
  };

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <Toast
        isOpen={!!toastMsg}
        message={toastMsg?.text || ''}
        type={toastMsg?.type || 'success'}
        onClose={() => setToastMsg(null)}
      />

      <div className="bg-white rounded-2xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#1D232E] tracking-tight">
              Intelligence Artificielle (Workers Failover &amp; Périmètre)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
              ROOT ONLY • WORKER 1 ↔ WORKER 2
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Bascule automatique en boucle entre Gemini Flash et Groq, et contrôle fin des Récaps Vues d’Ensemble &amp; Auto-remplissage des Formulaires.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Intelligence Artificielle' },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowKeys((s) => !s)}>
            {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showKeys ? 'Masquer Clés' : 'Afficher Clés'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setGuideIndex(0); setGuideOpen(true); }}>
            <Compass className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Guide Clés Gratuites</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleTestAi} isLoading={testing}>
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Tester Failover Workers</span>
          </Button>
          <Button variant="gold" size="sm" onClick={() => handleSave()} isLoading={saving}>
            <Save className="w-3.5 h-3.5" />
            <span>Sauvegarder</span>
          </Button>
        </div>
      </div>

      {testReply && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            testReply.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {testReply.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="font-medium break-words">{testReply.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E6E1D6] text-center text-xs text-slate-500">
          Chargement de la configuration IA...
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card 1: Activation & 2 Modes */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#C59B27]" />
                <h2 className="text-sm font-bold text-[#1D232E]">
                  Activation Globale, Priorité Workers &amp; Modes d&apos;Usage
                </h2>
              </div>
              <Toggle
                compact
                size="sm"
                checked={config.enabled}
                onChange={(v) => setConfig({ ...config, enabled: v })}
                ariaLabel="Activer le moteur IA global"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <Select
                label="Worker 1 Prioritaire (Worker 2 = Backup Auto) *"
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value as 'GEMINI' | 'GROQ' })}
                options={[
                  { label: 'Worker 1 : Google Gemini (Backup : Groq)', value: 'GEMINI' },
                  { label: 'Worker 1 : Groq Cloud (Backup : Gemini)', value: 'GROQ' },
                ]}
              />
              <Input
                label="Ton Éditorial Royal"
                value={config.defaultTone}
                onChange={(e) => setConfig({ ...config, defaultTone: e.target.value })}
              />
              <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-[#1D232E] block">Mode 1 : Récaps Vues d&apos;Ensemble</span>
                  <span className="text-[10px] text-slate-500">Synthèses IA par section</span>
                </div>
                <Toggle
                  compact
                  size="sm"
                  checked={config.enableOverviewRecaps}
                  onChange={(v) => setConfig({ ...config, enableOverviewRecaps: v, enableAnalyticsInsights: v })}
                />
              </div>
              <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-[#1D232E] block">Mode 2 : Auto-Remplissage Modales</span>
                  <span className="text-[10px] text-slate-500">Formulaires Ajout &amp; Édition</span>
                </div>
                <Toggle
                  compact
                  size="sm"
                  checked={config.enableFormAutofill}
                  onChange={(v) => setConfig({ ...config, enableFormAutofill: v, enableCatalogCopy: v })}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Google Gemini */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-[#C59B27] shrink-0" />
                <h3 className="text-sm font-bold text-[#1D232E] truncate">
                  {config.provider === 'GEMINI' ? 'Worker 1' : 'Worker 2'} — Google AI Studio (Gemini)
                </h3>
                <GuideInfoButton onClick={() => { setGuideIndex(0); setGuideOpen(true); }} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                1 500 req/jour
              </span>
            </div>

            <Input
              label="Clé API Google Gemini"
              type={showKeys ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={config.geminiApiKey}
              onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
            />

            <Select
              label="Modèle Gemini"
              value={config.geminiModel}
              onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
              options={[
                { label: 'gemini-2.5-flash (Dernier — Équilibré & Rapide)', value: 'gemini-2.5-flash' },
                { label: 'gemini-2.0-flash (Rapide FR/AR)', value: 'gemini-2.0-flash' },
                { label: 'gemini-2.5-flash-lite (Ultra léger)', value: 'gemini-2.5-flash-lite' },
              ]}
            />
          </div>

          {/* Card 3: Groq */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-[#C59B27] shrink-0" />
                <h3 className="text-sm font-bold text-[#1D232E] truncate">
                  {config.provider === 'GROQ' ? 'Worker 1' : 'Worker 2'} — Groq Cloud LPU
                </h3>
                <GuideInfoButton onClick={() => { setGuideIndex(1); setGuideOpen(true); }} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleFetchGroqModels(false)}
                  disabled={loadingModels}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] hover:bg-[#F3E9C9] transition cursor-pointer disabled:opacity-50"
                  title="Synchroniser les modèles actifs de votre compte Groq"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} />
                  <span>Modèles Live</span>
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Quota Gratuit
                </span>
              </div>
            </div>

            <Input
              label="Clé API Groq"
              type={showKeys ? 'text' : 'password'}
              placeholder="gsk_..."
              value={config.groqApiKey}
              onChange={(e) => setConfig({ ...config, groqApiKey: e.target.value })}
            />

            <Select
              label="Modèle Groq"
              value={config.groqModel}
              onChange={(e) => setConfig({ ...config, groqModel: e.target.value })}
              options={groqSelectOptions}
            />
          </div>

          {/* Card 4: Contrôle Granulaire ON/OFF des Vues d'Ensemble */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-[#C59B27]" />
                <div>
                  <h3 className="text-sm font-bold text-[#1D232E]">Récaps IA par Vue d&apos;Ensemble</h3>
                  <p className="text-[11px] text-slate-500">Activez ou masquez la synthèse IA sur chaque vue d&apos;ensemble</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setAllRecapTargets(true)} className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] text-[10px] font-bold cursor-pointer">
                  Tout ON
                </button>
                <button type="button" onClick={() => setAllRecapTargets(false)} className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 text-[10px] font-bold cursor-pointer">
                  Tout OFF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AI_OVERVIEW_TARGETS.map((item) => {
                const checked = config.recapTargets[item.id] !== false;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1D232E] truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.section}</div>
                    </div>
                    <Toggle
                      compact
                      size="sm"
                      checked={checked}
                      onChange={(val) =>
                        setConfig((prev) => ({
                          ...prev,
                          recapTargets: { ...prev.recapTargets, [item.id]: val },
                        }))
                      }
                      ariaLabel={item.label}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 5: Contrôle Granulaire ON/OFF des Formulaires Ajout/Édition */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-[#C59B27]" />
                <div>
                  <h3 className="text-sm font-bold text-[#1D232E]">Auto-Remplissage IA par Formulaire</h3>
                  <p className="text-[11px] text-slate-500">Choisissez dans quelles modales Ajout / Édition le bouton IA apparaît</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setAllFormTargets(true)} className="px-2.5 py-1 rounded-lg bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] text-[10px] font-bold cursor-pointer">
                  Tout ON
                </button>
                <button type="button" onClick={() => setAllFormTargets(false)} className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 text-[10px] font-bold cursor-pointer">
                  Tout OFF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
              {AI_FORM_TARGETS.map((item) => {
                const checked = config.formTargets[item.id] !== false;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1D232E] truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.section}</div>
                    </div>
                    <Toggle
                      compact
                      size="sm"
                      checked={checked}
                      onChange={(val) =>
                        setConfig((prev) => ({
                          ...prev,
                          formTargets: { ...prev.formTargets, [item.id]: val },
                        }))
                      }
                      ariaLabel={item.label}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      )}

      <ViewGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Guide Configuration IA Zéro-Coût"
        subtitle="Obtenez vos clés gratuites Google AI Studio (Gemini) & Groq en 2 minutes"
        steps={AI_GUIDE_STEPS}
        currentIndex={guideIndex}
        onStepChange={setGuideIndex}
      />
    </div>
  );
}
