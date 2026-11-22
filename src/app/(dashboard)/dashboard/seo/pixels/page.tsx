'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Save,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Share2,
  Tag,
  Search,
  Send,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Button, Input, Textarea, Toggle, Breadcrumb, Toast, Badge } from '@/components/ui';
import { fetchApi } from '@/lib/api';
import {
  MarketingPixelsConfig,
  trackMarketingEvent,
} from '@/components/storefront/MarketingPixelsTracker';

const INITIAL_STATE: MarketingPixelsConfig = {
  metaPixelEnabled: false,
  metaPixelId: '',
  facebookDomainVerification: '',
  tiktokPixelEnabled: false,
  tiktokPixelId: '',
  ga4Enabled: false,
  ga4MeasurementId: '',
  gtmEnabled: false,
  gtmContainerId: '',
  snapPixelEnabled: false,
  snapPixelId: '',
  googleSiteVerification: '',
  seoTitle: 'Royal — Électro de Maison | Électroménager & Cuisine en Tunisie',
  seoDescription:
    'Découvrez notre collection d’électroménager, robots culinaires, cuisson et art de la table en Tunisie. Livraison 24–48h et garantie officielle.',
  seoKeywords: 'électroménager tunisie, cuisine tunisie, airfryer, robot pétrin, royal tunisie',
  canonicalBaseUrl: '',
  robotsIndex: true,
  trackAddToCart: true,
  trackPurchase: true,
  trackWishlist: true,
  trackViewContent: true,
};

export default function MarketingPixelsSeoPage() {
  const [form, setForm] = useState<MarketingPixelsConfig>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/marketingPixels');
      const val = res?.value || res?.data?.value || res;
      if (val && typeof val === 'object') {
        setForm({ ...INITIAL_STATE, ...val });
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/marketingPixels', {
        method: 'PUT',
        body: JSON.stringify({ value: form }),
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('royal-pixels-updated'));
      }
      setToast({
        type: 'success',
        text: 'Pixels marketing et paramètres SEO enregistrés et activés sur la boutique.',
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.message || 'Impossible d’enregistrer la configuration Pixels & SEO.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestPixel = () => {
    if (typeof window !== 'undefined') {
      window.__royalPixelsConfig = form;
    }
    trackMarketingEvent('PageView', { page_path: '/test-pixel-event' });
    trackMarketingEvent('AddToCart', {
      value: 199,
      currency: 'TND',
      content_name: 'Test Événement Royal Pixel',
      content_ids: ['test-royal-pixel'],
    });
    const activeNames = [
      form.metaPixelEnabled && form.metaPixelId ? 'Meta Pixel' : null,
      form.tiktokPixelEnabled && form.tiktokPixelId ? 'TikTok Pixel' : null,
      form.ga4Enabled && form.ga4MeasurementId ? 'Google Analytics 4' : null,
      form.gtmEnabled && form.gtmContainerId ? 'Google Tag Manager' : null,
      form.snapPixelEnabled && form.snapPixelId ? 'Snapchat Pixel' : null,
    ].filter(Boolean);

    setToast({
      type: 'success',
      text:
        activeNames.length > 0
          ? `Événement test (PageView + AddToCart) déclenché pour : ${activeNames.join(', ')}.`
          : 'Aucun pixel actif avec un identifiant renseigné pour le test.',
    });
  };

  const activePixelsCount = [
    form.metaPixelEnabled && form.metaPixelId.trim(),
    form.tiktokPixelEnabled && form.tiktokPixelId.trim(),
    form.ga4Enabled && form.ga4MeasurementId.trim(),
    form.gtmEnabled && form.gtmContainerId.trim(),
    form.snapPixelEnabled && form.snapPixelId.trim(),
  ].filter(Boolean).length;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <Toast
        isOpen={!!toast}
        message={toast?.text || ''}
        type={toast?.type === 'error' ? 'error' : 'success'}
        onClose={() => setToast(null)}
      />

      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Pixels Marketing, Tracking Publicitaire &amp; Référencement SEO
              </h1>
              <p className="text-xs text-slate-500">
                Collez vos identifiants Meta/Facebook Pixel, TikTok Pixel, Google Analytics 4, GTM, Snapchat et Google Search Console sans toucher au code.
              </p>
            </div>
          </div>
          <Breadcrumb
            items={[
              { label: 'SEO & Marketing', href: '/dashboard/seo/testimonials' },
              { label: 'Pixels & Référencement SEO' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestPixel}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Tester les Pixels
          </Button>
          <Button
            type="submit"
            variant="gold"
            size="sm"
            disabled={saving || loading}
            leftIcon={saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer & Activer'}
          </Button>
        </div>
      </div>

      {/* KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E6E1D6] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pixels Actifs en Ligne
            </span>
            <span className="text-2xl font-black text-[#1D232E] mt-1 block">
              {activePixelsCount} / 5
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E1D6] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Événements E-Commerce Suivis
            </span>
            <span className="text-sm font-bold text-[#1D232E] mt-1.5 block">
              PageView • ViewContent • AddToCart • Wishlist • Purchase
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FBF6E8] text-[#B8860B] flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E1D6] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Indexation Google (Robots)
            </span>
            <div className="mt-1.5">
              <Badge variant={form.robotsIndex ? 'success' : 'warning'} size="sm">
                {form.robotsIndex ? 'Indexation Autorisée (index, follow)' : 'Bloquée (noindex)'}
              </Badge>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pixels Card */}
        <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Share2 className="w-4 h-4 text-[#C59B27]" />
            <h2 className="text-sm font-black text-[#1D232E] uppercase tracking-wider">
              Identifiants des Pixels Publicitaires
            </h2>
          </div>

          {/* 1. Meta / Facebook Pixel */}
          <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-black text-[#1D232E]">Meta / Facebook &amp; Instagram Pixel</div>
                <div className="text-[11px] text-slate-500">Suit vos campagnes Facebook Ads &amp; Instagram Ads</div>
              </div>
              <Toggle
                label="Activer"
                checked={form.metaPixelEnabled}
                onChange={(v) => setForm((p) => ({ ...p, metaPixelEnabled: v }))}
              />
            </div>
            <Input
              label="Meta Pixel ID (ex: 123456789012345)"
              placeholder="Saisissez l’ID à 15 chiffres"
              value={form.metaPixelId}
              onChange={(e) => setForm((p) => ({ ...p, metaPixelId: e.target.value }))}
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Où le trouver :{' '}
              <a
                href="https://business.facebook.com/events_manager2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9A7414] font-semibold hover:underline inline-flex items-center gap-0.5"
              >
                Meta Events Manager <ExternalLink className="w-3 h-3" />
              </a>{' '}
              → Sources de données → choisissez votre Dataset / Pixel → Paramètres → <strong>ID du dataset</strong>.
            </p>
            <Input
              label="Meta Domain Verification (Optionnel — balise meta)"
              placeholder="ex: abc123xyz456..."
              value={form.facebookDomainVerification}
              onChange={(e) => setForm((p) => ({ ...p, facebookDomainVerification: e.target.value }))}
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Où le trouver :{' '}
              <a
                href="https://business.facebook.com/settings/owned-domains"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9A7414] font-semibold hover:underline inline-flex items-center gap-0.5"
              >
                Meta Business Settings → Domaines <ExternalLink className="w-3 h-3" />
              </a>{' '}
              → Ajouter un domaine → option balise HTML → copiez uniquement la valeur de{' '}
              <code className="px-1 py-0.5 bg-white border border-[#E6E1D6] rounded text-[10px]">content=&quot;...&quot;</code>.
            </p>
          </div>

          {/* 2. TikTok Pixel */}
          <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-black text-[#1D232E]">TikTok Pixel</div>
                <div className="text-[11px] text-slate-500">Conversions et audiences pour TikTok Ads Manager</div>
              </div>
              <Toggle
                label="Activer"
                checked={form.tiktokPixelEnabled}
                onChange={(v) => setForm((p) => ({ ...p, tiktokPixelEnabled: v }))}
              />
            </div>
            <Input
              label="TikTok Pixel ID (ex: CXXXXXXXXXXXXXXXXX)"
              placeholder="Saisissez le code SDK / Pixel ID TikTok"
              value={form.tiktokPixelId}
              onChange={(e) => setForm((p) => ({ ...p, tiktokPixelId: e.target.value }))}
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Où le trouver :{' '}
              <a
                href="https://ads.tiktok.com/i18n/events_manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9A7414] font-semibold hover:underline inline-flex items-center gap-0.5"
              >
                TikTok Ads Manager → Tools → Events <ExternalLink className="w-3 h-3" />
              </a>{' '}
              → Web Events → Set Up Web Events → copier l&apos;<strong>ID du Pixel</strong> (commence souvent par <code>C...</code>).
            </p>
          </div>

          {/* 3. GA4 & GTM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-[#1D232E]">Google Analytics 4</span>
                <Toggle
                  label="Actif"
                  checked={form.ga4Enabled}
                  onChange={(v) => setForm((p) => ({ ...p, ga4Enabled: v }))}
                />
              </div>
              <Input
                label="ID de mesure GA4"
                placeholder="G-XXXXXXXXXX"
                value={form.ga4MeasurementId}
                onChange={(e) => setForm((p) => ({ ...p, ga4MeasurementId: e.target.value }))}
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <a
                  href="https://analytics.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9A7414] font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  Google Analytics <ExternalLink className="w-3 h-3" />
                </a>{' '}
                → Admin → Flux de données → Web → <strong>ID de mesure</strong> (<code>G-...</code>).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-[#1D232E]">Google Tag Manager</span>
                <Toggle
                  label="Actif"
                  checked={form.gtmEnabled}
                  onChange={(v) => setForm((p) => ({ ...p, gtmEnabled: v }))}
                />
              </div>
              <Input
                label="ID Conteneur GTM"
                placeholder="GTM-XXXXXXX"
                value={form.gtmContainerId}
                onChange={(e) => setForm((p) => ({ ...p, gtmContainerId: e.target.value }))}
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <a
                  href="https://tagmanager.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9A7414] font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  Google Tag Manager <ExternalLink className="w-3 h-3" />
                </a>{' '}
                → Créer un conteneur Web → copier l&apos;ID en haut à droite (<code>GTM-...</code>).
              </p>
            </div>
          </div>

          {/* 4. Snapchat Pixel */}
          <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-black text-[#1D232E]">Snapchat Pixel</div>
                <div className="text-[11px] text-slate-500">Suivi des conversions Snap Ads</div>
              </div>
              <Toggle
                label="Activer"
                checked={form.snapPixelEnabled}
                onChange={(v) => setForm((p) => ({ ...p, snapPixelEnabled: v }))}
              />
            </div>
            <Input
              label="Snapchat Pixel ID"
              placeholder="ex: 00000000-0000-0000-0000-000000000000"
              value={form.snapPixelId}
              onChange={(e) => setForm((p) => ({ ...p, snapPixelId: e.target.value }))}
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Où le trouver :{' '}
              <a
                href="https://ads.snapchat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9A7414] font-semibold hover:underline inline-flex items-center gap-0.5"
              >
                Snapchat Ads Manager <ExternalLink className="w-3 h-3" />
              </a>{' '}
              → Events Manager → Snap Pixel → Set up Pixel → copier l&apos;UUID du Pixel.
            </p>
          </div>
        </div>

        {/* Right Column: Events + SEO + SERP Preview */}
        <div className="space-y-6">
          {/* Standard Events toggles */}
          <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-[#C59B27]" />
              <h2 className="text-sm font-black text-[#1D232E] uppercase tracking-wider">
                Événements E-Commerce Automatiques
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D232E]">ViewContent (Fiche Article)</span>
                <Toggle
                  label=""
                  checked={form.trackViewContent}
                  onChange={(v) => setForm((p) => ({ ...p, trackViewContent: v }))}
                />
              </div>
              <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D232E]">AddToCart (Ajout Panier)</span>
                <Toggle
                  label=""
                  checked={form.trackAddToCart}
                  onChange={(v) => setForm((p) => ({ ...p, trackAddToCart: v }))}
                />
              </div>
              <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D232E]">AddToWishlist (Favoris)</span>
                <Toggle
                  label=""
                  checked={form.trackWishlist}
                  onChange={(v) => setForm((p) => ({ ...p, trackWishlist: v }))}
                />
              </div>
              <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D232E]">Purchase (Commande Validée)</span>
                <Toggle
                  label=""
                  checked={form.trackPurchase}
                  onChange={(v) => setForm((p) => ({ ...p, trackPurchase: v }))}
                />
              </div>
            </div>
          </div>

          {/* SEO Global Settings */}
          <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Tag className="w-4 h-4 text-[#C59B27]" />
              <h2 className="text-sm font-black text-[#1D232E] uppercase tracking-wider">
                Référencement Naturel (SEO) &amp; Search Console
              </h2>
            </div>

            <Input
              label="Titre SEO Principal (Meta Title)"
              value={form.seoTitle}
              onChange={(e) => setForm((p) => ({ ...p, seoTitle: e.target.value }))}
            />
            <Textarea
              label="Description SEO Globale (Meta Description)"
              rows={3}
              value={form.seoDescription}
              onChange={(e) => setForm((p) => ({ ...p, seoDescription: e.target.value }))}
            />
            <Input
              label="Mots-clés SEO (séparés par des virgules)"
              value={form.seoKeywords}
              onChange={(e) => setForm((p) => ({ ...p, seoKeywords: e.target.value }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Input
                  label="Google Site Verification (Search Console)"
                  placeholder="ex: verification-token"
                  value={form.googleSiteVerification}
                  onChange={(e) => setForm((p) => ({ ...p, googleSiteVerification: e.target.value }))}
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9A7414] font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    Google Search Console <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  → Préfixe de l&apos;URL → Méthode <strong>Balise HTML</strong> → copiez uniquement le texte de <code>content=&quot;...&quot;</code>.
                </p>
              </div>
              <div className="space-y-1.5">
                <Input
                  label="Domaine Canonique (Optionnel)"
                  placeholder="https://royalfrontend.vercel.app"
                  value={form.canonicalBaseUrl}
                  onChange={(e) => setForm((p) => ({ ...p, canonicalBaseUrl: e.target.value }))}
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  L&apos;URL publique officielle de votre boutique (actuellement <code>https://royalfrontend.vercel.app</code> ou votre futur domaine personnalisé ex: <code>https://royal-electro.tn</code>).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="text-xs font-bold text-[#1D232E] block">
                    Autoriser l’indexation Google &amp; moteurs (index, follow)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Active le référencement sur Google Search
                  </span>
                </div>
              </div>
              <Toggle
                label=""
                checked={form.robotsIndex}
                onChange={(v) => setForm((p) => ({ ...p, robotsIndex: v }))}
              />
            </div>

            {/* Live Google SERP Preview */}
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Aperçu Google Search (SERP)
              </div>
              <div className="text-xs text-emerald-700 font-mono truncate">
                {form.canonicalBaseUrl || 'https://royalfrontend.vercel.app'}
              </div>
              <div className="text-sm font-bold text-blue-700 truncate">
                {form.seoTitle || 'Royal — Électro de Maison'}
              </div>
              <div className="text-xs text-neutral-600 line-clamp-2">
                {form.seoDescription || 'Électroménager et équipement de cuisine en Tunisie.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
