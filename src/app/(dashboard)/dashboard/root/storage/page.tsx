'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  Save,
  RefreshCw,
  CheckCircle2,
  Cloud,
  Sparkles,
  Server,
  ShieldCheck,
  Image as ImageIcon,
  Compass,
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

const STORAGE_GUIDE_STEPS: ViewGuideStep[] = [
  {
    id: 'local-vps',
    number: '01',
    title: 'Disque Local VPS / Docker (100% Gratuit)',
    description: 'Mode recommandé lorsque votre backend tourne sur votre VPS Oxahost 40 Go NVMe.',
    fields: [
      {
        label: 'Chemin Persistant /app/uploads',
        example: '/api/v1/storefront-cms/media/...',
        steps: [
          'Zéro abonnement externe, zéro limite d’API : chaque logo et photo produit est servi directement depuis votre volume Docker persistant.',
          'Sélectionnez « Auto (VPS Disque / Fallback Vercel) » pour combiner automatiquement le disque local en production VPS et Data-URI en démo Vercel.',
        ],
      },
    ],
  },
  {
    id: 'cloudflare-r2',
    number: '02',
    title: 'Cloudflare R2 (10 Go Gratuits / Zero Egress)',
    description: 'Idéal si le backend reste Serverless (Vercel) tout en voulant des URLs CDN rapides.',
    platformLabel: 'Ouvrir Cloudflare R2',
    platformUrl: 'https://dash.cloudflare.com',
    fields: [
      {
        label: 'Account ID & API Token (S3)',
        example: 'Bucket: royal-media • Public URL: https://media.royal.com.tn',
        steps: [
          'Créez un compte gratuit Cloudflare → R2 Object Storage → Créez un bucket « royal-media ».',
          'Activez l’accès public (r2.dev ou domaine personnalisé CNAME) pour obtenir l’URL publique CDN.',
          'Créez un « Manage R2 API Tokens → Object Read & Write » et renseignez Access Key ID + Secret Access Key.',
        ],
      },
    ],
  },
  {
    id: 'cloudinary-webp',
    number: '03',
    title: 'Cloudinary (25 Crédits Gratuits) & WebP Automatique',
    description: 'Allège chaque visuel de 60 à 80% avant même l’envoi réseau grâce à la compression WebP.',
    platformLabel: 'Ouvrir Cloudinary Console',
    platformUrl: 'https://cloudinary.com/console',
    fields: [
      {
        label: 'Conversion WebP Client-Side',
        example: 'Qualité 0.85 • Max 1920px',
        steps: [
          'Toutes les images PNG/JPEG téléversées via le dashboard sont converties localement en WebP léger avant l’upload.',
          'Les fichiers vectoriels SVG et animations GIF sont préservés intacts.',
        ],
      },
    ],
  },
];

export default function MediaStorageRootPage() {
  const [config, setConfig] = useState({
    provider: 'AUTO_VPS_OR_VERCEL',
    webpEnabled: true,
    webpQuality: 0.85,
    maxWidthPx: 1920,
    r2AccountId: '',
    r2AccessKeyId: '',
    r2SecretAccessKey: '',
    r2BucketName: 'royal-media',
    r2PublicBaseUrl: '',
    cloudinaryCloudName: '',
    cloudinaryUploadPreset: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
    localBasePath: '/api/v1/storefront-cms/media',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; url?: string; message: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/mediaStorage');
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
      await fetchApi('/storefront-cms/sys-config/mediaStorage', {
        method: 'PUT',
        body: JSON.stringify({ value: config }),
      });
      setToastMsg({ text: 'Configuration Stockage Médias & WebP enregistrée.', type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Erreur lors de la sauvegarde.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestStorage = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetchApi('/storefront-cms/media/test-storage', {
        method: 'POST',
        body: JSON.stringify({ config }),
      });
      setTestResult({
        ok: true,
        url: res?.url,
        message: res?.message || 'Test stockage réussi.',
      });
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err?.message || 'Échec du test de stockage.',
      });
    } finally {
      setTesting(false);
    }
  };

  const openGuide = (idx: number) => {
    setGuideIndex(idx);
    setGuideOpen(true);
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
              Stockage Médias, CDN &amp; Compression WebP
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
              ROOT ONLY • ZERO COÛT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Choisissez la destination gratuite de vos images (Disque NVMe VPS, Cloudflare R2 10 Go gratuit ou Cloudinary) et activez l’optimisation WebP automatique.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Stockage Médias & CDN' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => openGuide(0)}>
            <Compass className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Guide Configuration</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleTestStorage} isLoading={testing}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tester Stockage</span>
          </Button>
          <Button variant="gold" size="sm" onClick={() => handleSave()} isLoading={saving}>
            <Save className="w-3.5 h-3.5" />
            <span>Sauvegarder</span>
          </Button>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-4 ${
            testResult.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testResult.message}</span>
          </div>
          {testResult.url && (
            <span className="font-mono text-[11px] bg-white px-2.5 py-1 rounded-lg border border-emerald-200 truncate max-w-xs">
              {testResult.url.slice(0, 64)}
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E6E1D6] text-center text-xs text-slate-500">
          Chargement de la configuration stockage...
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card 1: Provider & WebP */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive className="w-4 h-4 text-[#C59B27] shrink-0" />
                <h2 className="text-sm font-bold text-[#1D232E] truncate">
                  01 — Stockage Principal &amp; WebP
                </h2>
                <GuideInfoButton onClick={() => openGuide(0)} title="Voir le guide Disque VPS vs Cloud" />
              </div>
              <Toggle
                compact
                size="sm"
                checked={config.webpEnabled}
                onChange={(v) => setConfig({ ...config, webpEnabled: v })}
                ariaLabel="Activer la compression WebP automatique"
              />
            </div>

            <Select
              label="Fournisseur Actif *"
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value })}
              options={[
                { label: 'Auto — Disque VPS NVMe (Production) / Data-URI (Démo Vercel)', value: 'AUTO_VPS_OR_VERCEL' },
                { label: 'Disque Local VPS Persistant (/app/uploads — 0 DT)', value: 'LOCAL_DISK' },
                { label: 'Cloudflare R2 (S3 CDN — 10 Go Gratuits & Zero Egress)', value: 'CLOUDFLARE_R2' },
                { label: 'Cloudinary Free Tier (25 Crédits Gratuits)', value: 'CLOUDINARY' },
                { label: 'Vercel Inline Data-URI (Base64 PostgreSQL — Secours)', value: 'VERCEL_DATA_URI' },
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Qualité WebP Client (0.4 à 1.0)"
                type="number"
                step="0.05"
                min="0.4"
                max="1"
                value={String(config.webpQuality)}
                onChange={(e) => setConfig({ ...config, webpQuality: Number(e.target.value || 0.85) })}
                helperText="0.85 offre ~70% de gain sans perte visible"
              />
              <Input
                label="Largeur Maximale Image (px)"
                type="number"
                step="100"
                min="600"
                max="3840"
                value={String(config.maxWidthPx)}
                onChange={(e) => setConfig({ ...config, maxWidthPx: Number(e.target.value || 1920) })}
                helperText="Redimensionnement automatique avant upload"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] text-xs text-slate-600 flex items-start gap-2.5">
              <Server className="w-4 h-4 text-[#9A7414] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1D232E] block">Recommandation Royal VPS Oxahost :</span>
                Avec 40 Go NVMe, le mode <span className="font-mono font-bold">AUTO_VPS_OR_VERCEL</span> utilise le disque local ultra-rapide dès que l’app quitte Vercel, sans rien payer à un CDN tiers.
              </div>
            </div>
          </div>

          {/* Card 2: Cloudflare R2 */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Cloud className="w-4 h-4 text-[#C59B27] shrink-0" />
                <h2 className="text-sm font-bold text-[#1D232E] truncate">
                  02 — Cloudflare R2 (10 Go Gratuits)
                </h2>
                <GuideInfoButton onClick={() => openGuide(1)} title="Guide Cloudflare R2" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                S3 SigV4 Natif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cloudflare Account ID"
                placeholder="ex: 9f4d8e..."
                value={config.r2AccountId}
                onChange={(e) => setConfig({ ...config, r2AccountId: e.target.value })}
              />
              <Input
                label="Nom du Bucket R2"
                placeholder="royal-media"
                value={config.r2BucketName}
                onChange={(e) => setConfig({ ...config, r2BucketName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="R2 Access Key ID"
                placeholder="access_key..."
                value={config.r2AccessKeyId}
                onChange={(e) => setConfig({ ...config, r2AccessKeyId: e.target.value })}
              />
              <Input
                label="R2 Secret Access Key"
                type="password"
                placeholder="••••••••••••"
                value={config.r2SecretAccessKey}
                onChange={(e) => setConfig({ ...config, r2SecretAccessKey: e.target.value })}
              />
            </div>

            <Input
              label="URL Publique CDN (r2.dev ou media.royal.com.tn)"
              placeholder="https://media.royal.com.tn"
              value={config.r2PublicBaseUrl}
              onChange={(e) => setConfig({ ...config, r2PublicBaseUrl: e.target.value })}
            />
          </div>

          {/* Card 3: Cloudinary */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-[#C59B27] shrink-0" />
                <h2 className="text-sm font-bold text-[#1D232E] truncate">
                  03 — Cloudinary (Alternative Gratuite Serverless)
                </h2>
                <GuideInfoButton onClick={() => openGuide(2)} title="Guide Cloudinary & WebP" />
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Cloud Name"
                placeholder="ex: royal-tunisie"
                value={config.cloudinaryCloudName}
                onChange={(e) => setConfig({ ...config, cloudinaryCloudName: e.target.value })}
              />
              <Input
                label="Upload Preset (si Unsigned)"
                placeholder="royal_unsigned"
                value={config.cloudinaryUploadPreset}
                onChange={(e) => setConfig({ ...config, cloudinaryUploadPreset: e.target.value })}
              />
              <Input
                label="API Key (si Signed)"
                placeholder="Optionnel"
                value={config.cloudinaryApiKey}
                onChange={(e) => setConfig({ ...config, cloudinaryApiKey: e.target.value })}
              />
              <Input
                label="API Secret (si Signed)"
                type="password"
                placeholder="••••••••••••"
                value={config.cloudinaryApiSecret}
                onChange={(e) => setConfig({ ...config, cloudinaryApiSecret: e.target.value })}
              />
            </div>
          </div>
        </form>
      )}

      <ViewGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Guide Configuration Stockage Médias"
        subtitle="Solutions durables 0 DT adaptées au VPS Oxahost et à l'hébergement Vercel"
        steps={STORAGE_GUIDE_STEPS}
        currentIndex={guideIndex}
        onStepChange={setGuideIndex}
      />
    </div>
  );
}
