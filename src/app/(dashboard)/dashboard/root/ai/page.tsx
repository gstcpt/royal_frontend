'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Save,
  Eye,
  EyeOff,
  Compass,
  CheckCircle2,
  Zap,
  Bot,
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

const AI_GUIDE_STEPS: ViewGuideStep[] = [
  {
    id: 'gemini-free',
    number: '01',
    title: 'Google AI Studio — Gemini Flash (Gratuit 1 500 req/jour)',
    description: 'Aucune carte bancaire requise pour générer des fiches produits FR/AR et analyses SEO.',
    platformLabel: 'Obtenir une Clé Google AI Studio',
    platformUrl: 'https://aistudio.google.com/app/apikey',
    fields: [
      {
        label: 'Clé API Gemini (AIza...)',
        example: 'Modèle conseillé : gemini-2.5-flash',
        steps: [
          'Connectez-vous sur Google AI Studio avec un compte Google.',
          'Cliquez sur « Get API Key → Create API key in new project ».',
          'Copiez la clé ci-contre puis cliquez sur « Tester la Connexion IA ».',
        ],
      },
    ],
  },
  {
    id: 'groq-free',
    number: '02',
    title: 'Groq Cloud LPU — Llama 3.3 / Qwen (Gratuit Ultra-Rapide)',
    description: 'Alternative open-source ultra rapide idéale en secours ou pour l’analyse de stock.',
    platformLabel: 'Obtenir une Clé Gratuite Groq',
    platformUrl: 'https://console.groq.com/keys',
    fields: [
      {
        label: 'Clé API Groq (gsk_...)',
        example: 'Modèle conseillé : llama-3.3-70b-versatile',
        steps: [
          'Ouvrez console.groq.com → API Keys → Create API Key.',
          'Collez la clé commençant par gsk_... sans jamais l’exposer côté frontend.',
        ],
      },
    ],
  },
];

export default function AiProviderRootPage() {
  const [config, setConfig] = useState({
    enabled: false,
    provider: 'GEMINI' as 'GEMINI' | 'GROQ',
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    groqApiKey: '',
    groqModel: 'llama-3.3-70b-versatile',
    enableCatalogCopy: true,
    enableAnalyticsInsights: true,
    defaultTone: 'Luxe éditorial sobre, précis et orienté conversion (Tunisie, TND)',
  });
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
      setConfig((prev) => ({ ...prev, ...v }));
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Accès réservé au compte ROOT.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/aiProvider', {
        method: 'PUT',
        body: JSON.stringify({ value: config }),
      });
      setToastMsg({ text: 'Configuration Intelligence Artificielle enregistrée.', type: 'success' });
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
      const res = await fetchApi('/storefront-cms/ai/test', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'TEST',
          overrideConfig: config,
        }),
      });
      setTestReply({
        ok: true,
        text: `[${res?.provider} • ${res?.model}] ${res?.reply || 'Connexion opérationnelle.'}`,
      });
    } catch (err: any) {
      setTestReply({
        ok: false,
        text: err?.message || 'Échec de connexion au fournisseur IA.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <Toast
        isOpen={!!toastMsg}
        message={toastMsg?.text || ''}
        type={toastMsg?.type || 'success'}
        onClose={() => setToastMsg(null)}
      />

      <div className="bg-white rounded-2xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#1D232E] tracking-tight">
              Intelligence Artificielle (Gemini Flash &amp; Groq Gratuits)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
              ROOT ONLY • 0 DT TIER GRATUIT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Automatisez la rédaction FR/AR de vos articles, le SEO Google et l’analyse de vos performances sans aucun abonnement payant.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Intelligence Artificielle' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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
            <span>Tester Connexion IA</span>
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
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{testReply.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E6E1D6] text-center text-xs text-slate-500">
          Chargement de la configuration IA...
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card 1: Activation & Tone */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#C59B27]" />
                <h2 className="text-sm font-bold text-[#1D232E]">
                  Activation Globale &amp; Capacités Merchandising
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <Select
                label="Moteur IA Actif *"
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value as 'GEMINI' | 'GROQ' })}
                options={[
                  { label: 'Google AI Studio — Gemini Flash (Recommandé)', value: 'GEMINI' },
                  { label: 'Groq Cloud LPU — Llama 3.3 / Qwen (Ultra-Rapide)', value: 'GROQ' },
                ]}
              />
              <Input
                label="Ton Éditorial Royal"
                value={config.defaultTone}
                onChange={(e) => setConfig({ ...config, defaultTone: e.target.value })}
              />
              <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#1D232E]">Rédaction Fiches Articles</span>
                <Toggle
                  compact
                  size="sm"
                  checked={config.enableCatalogCopy}
                  onChange={(v) => setConfig({ ...config, enableCatalogCopy: v })}
                />
              </div>
              <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#1D232E]">Conseils Stock &amp; Trafic</span>
                <Toggle
                  compact
                  size="sm"
                  checked={config.enableAnalyticsInsights}
                  onChange={(v) => setConfig({ ...config, enableAnalyticsInsights: v })}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Google Gemini */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-[#C59B27] shrink-0" />
                <h3 className="text-sm font-bold text-[#1D232E] truncate">01 — Google AI Studio (Gemini Free Tier)</h3>
                <GuideInfoButton onClick={() => { setGuideIndex(0); setGuideOpen(true); }} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
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
              ]}
            />
          </div>

          {/* Card 3: Groq */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-[#C59B27] shrink-0" />
                <h3 className="text-sm font-bold text-[#1D232E] truncate">02 — Groq Cloud LPU (Gratuit)</h3>
                <GuideInfoButton onClick={() => { setGuideIndex(1); setGuideOpen(true); }} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Quota Gratuit
              </span>
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
              options={[
                { label: 'llama-3.3-70b-versatile (Qualité rédactionnelle max)', value: 'llama-3.3-70b-versatile' },
                { label: 'qwen-qwq-32b (Raisonnement rapide)', value: 'qwen-qwq-32b' },
                { label: 'llama-3.1-8b-instant (Ultra rapide)', value: 'llama-3.1-8b-instant' },
              ]}
            />
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
