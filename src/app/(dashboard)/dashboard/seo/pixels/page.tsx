'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Save,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Share2,
  Search,
  Send,
  ShieldCheck,
  RefreshCw,
  Compass,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Toggle,
  Breadcrumb,
  Toast,
  Badge,
  GuideInfoButton,
  ViewGuideModal,
  ViewGuideStep,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import {
  MarketingPixelsConfig,
  trackMarketingEvent,
} from '@/components/storefront/MarketingPixelsTracker';

function extractMetaContent(raw: string): string {
  const match = raw.match(/content=["']([^"']+)["']/i);
  return match ? match[1].trim() : raw;
}

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
  googleSiteVerification: '-sVFiqQAIiUhoCkCLkoOVY060WD77TF-eev_zSTzshA',
  seoTitle: 'Royal — Électro de Maison | Électroménager & Cuisine en Tunisie',
  seoDescription:
    'Découvrez notre collection d’électroménager, robots culinaires, cuisson et art de la table en Tunisie. Livraison 24–48h et garantie officielle.',
  seoKeywords: 'électroménager tunisie, cuisine tunisie, airfryer, robot pétrin, royal tunisie',
  canonicalBaseUrl: 'https://royalfrontend.vercel.app',
  robotsIndex: true,
  trackAddToCart: true,
  trackPurchase: true,
  trackWishlist: true,
  trackViewContent: true,
};

const PIXELS_GUIDE_STEPS: ViewGuideStep[] = [
  {
    id: 'meta-pixel',
    number: '01',
    title: 'Meta / Facebook & Instagram Pixel',
    description: 'Configurez votre Pixel publicitaire Facebook/Instagram et vérifiez votre domaine.',
    platformLabel: 'Ouvrir Meta Events Manager',
    platformUrl: 'https://business.facebook.com/events_manager2',
    fields: [
      {
        label: 'Meta Pixel ID',
        example: '123456789012345',
        steps: [
          'Connectez-vous à Meta Events Manager puis ouvrez « Sources de données ».',
          'Sélectionnez votre Pixel Web (ou créez un Dataset Web) puis cliquez sur Paramètres.',
          'Copiez uniquement la suite de 15 à 16 chiffres sous « ID du dataset ».',
        ],
      },
      {
        label: 'Meta Domain Verification (Optionnel)',
        example: 'abc123xyz456...',
        steps: [
          'Ouvrez Meta Business Settings → Sécurité de la marque → Domaines.',
          'Ajoutez votre domaine et choisissez l’option « Balise meta HTML ».',
          'Copiez uniquement la valeur située dans content="..." (sans les guillemets) et cliquez Valider après sauvegarde.',
        ],
      },
    ],
  },
  {
    id: 'tiktok-pixel',
    number: '02',
    title: 'TikTok Pixel',
    description: 'Connectez votre boutique à TikTok Ads Manager pour suivre achats et audiences.',
    platformLabel: 'Ouvrir TikTok Events',
    platformUrl: 'https://ads.tiktok.com/i18n/events_manager',
    fields: [
      {
        label: 'TikTok Pixel ID',
        example: 'CXXXXXXXXXXXXXXXXX',
        steps: [
          'Dans TikTok Ads Manager, allez dans Tools → Events → Web Events.',
          'Cliquez sur « Set Up Web Events » → TikTok Pixel → Manual Setup.',
          'Copiez l’identifiant du Pixel affiché à côté du nom (commence généralement par C...).',
        ],
      },
    ],
  },
  {
    id: 'ga4',
    number: '03',
    title: 'Google Analytics 4',
    description: 'Mesurez le trafic, les visites produits et les ventes dans Google Analytics 4.',
    platformLabel: 'Ouvrir Google Analytics',
    platformUrl: 'https://analytics.google.com',
    fields: [
      {
        label: 'ID de mesure GA4',
        example: 'G-XXXXXXXXXX',
        steps: [
          'Ouvrez Google Analytics → Admin (icône roue crantée en bas à gauche).',
          'Cliquez sur « Flux de données » puis sélectionnez votre flux Web.',
          'Copiez l’« ID de mesure » affiché en haut à droite (format G-XXXXXXXXXX).',
        ],
      },
    ],
  },
  {
    id: 'gtm',
    number: '04',
    title: 'Google Tag Manager',
    description: 'Centralisez des balises avancées via votre conteneur Google Tag Manager.',
    platformLabel: 'Ouvrir Google Tag Manager',
    platformUrl: 'https://tagmanager.google.com',
    fields: [
      {
        label: 'ID Conteneur GTM',
        example: 'GTM-XXXXXXX',
        steps: [
          'Ouvrez Google Tag Manager et créez ou sélectionnez un conteneur de type « Web ».',
          'Copiez l’identifiant affiché en haut à droite de l’espace de travail (format GTM-XXXXXXX).',
        ],
      },
    ],
  },
  {
    id: 'snapchat-pixel',
    number: '05',
    title: 'Snapchat Pixel',
    description: 'Suivez les conversions de vos campagnes Snapchat Ads en temps réel.',
    platformLabel: 'Ouvrir Snapchat Ads Manager',
    platformUrl: 'https://ads.snapchat.com',
    fields: [
      {
        label: 'Snapchat Pixel ID',
        example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        steps: [
          'Connectez-vous à Snapchat Ads Manager puis ouvrez « Events Manager ».',
          'Créez ou ouvrez votre Snap Pixel (Web) → Set Up Pixel.',
          'Copiez l’UUID complet du Pixel affiché dans les paramètres ou dans snaptr("init", "...").',
        ],
      },
    ],
  },
  {
    id: 'seo-search-console',
    number: '06',
    title: 'Référencement Naturel (SEO) & Search Console',
    description: 'Optimisez votre apparition Google (SERP), balises méta et validation Search Console.',
    platformLabel: 'Ouvrir Search Console',
    platformUrl: 'https://search.google.com/search-console',
    fields: [
      {
        label: 'Google Site Verification (Search Console)',
        example: 'google-site-token',
        steps: [
          'Ajoutez votre URL sur Google Search Console (Préfixe de l’URL).',
          'Dépliez « Balise HTML » et copiez uniquement le texte après content="...".',
        ],
      },
      {
        label: 'Domaine Canonique (Optionnel)',
        example: 'https://royalfrontend.vercel.app',
        steps: [
          'Indiquez l’URL principale publique sans « / » final (ex: https://royalfrontend.vercel.app ou votre domaine .tn).',
        ],
      },
      {
        label: 'Titre SEO & Description (SERP)',
        example: '55–65 car. / 140–160 car.',
        steps: [
          'Rédigez un titre clair incluant votre marque et activité, suivi d’une description vendeuse.',
        ],
      },
      {
        label: 'Indexation Google (Switch ON/OFF)',
        example: 'index, follow',
        steps: [
          'Laissez activé (ON) en production pour autoriser Google à indexer la boutique.',
        ],
      },
    ],
  },
  {
    id: 'ecommerce-events',
    number: '07',
    title: 'Événements E-Commerce Automatiques',
    description: 'Activez les signaux envoyés automatiquement vers tous vos pixels configurés.',
    fields: [
      {
        label: 'ViewContent (Fiche Article)',
        example: 'Automatique',
        steps: [
          'Déclenché à chaque ouverture d’une page article avec le nom, l’ID et le prix TND.',
        ],
      },
      {
        label: 'AddToCart (Ajout Panier)',
        example: 'Automatique',
        steps: [
          'Déclenché dès qu’un visiteur clique sur Ajouter au panier sur une carte ou fiche produit.',
        ],
      },
      {
        label: 'AddToWishlist (Favoris)',
        example: 'Automatique',
        steps: [
          'Déclenché lors de l’ajout d’un article dans la liste de souhaits (cœur).',
        ],
      },
      {
        label: 'Purchase (Commande Validée)',
        example: 'Automatique',
        steps: [
          'Déclenché après confirmation de commande avec la valeur totale et la devise TND.',
        ],
      },
    ],
  },
];

export default function MarketingPixelsSeoPage() {
  const [form, setForm] = useState<MarketingPixelsConfig>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openGuideAt = useCallback((index: number) => {
    setGuideIndex(index);
    setGuideOpen(true);
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/marketingPixels');
      const val = res?.value || res?.data?.value || res;
      if (val && typeof val === 'object') {
        setForm({
          ...INITIAL_STATE,
          ...val,
          googleSiteVerification:
            val.googleSiteVerification || INITIAL_STATE.googleSiteVerification,
          canonicalBaseUrl: val.canonicalBaseUrl || INITIAL_STATE.canonicalBaseUrl,
        });
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

  const allEventsEnabled =
    form.trackViewContent && form.trackAddToCart && form.trackWishlist && form.trackPurchase;

  const isCardHighlighted = (index: number) => guideOpen && guideIndex === index;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <Toast
        isOpen={!!toast}
        message={toast?.text || ''}
        type={toast?.type === 'error' ? 'error' : 'success'}
        onClose={() => setToast(null)}
      />

      <ViewGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Guide interactif — Pixels Marketing & Référencement SEO"
        subtitle="Parcourez chaque bloc (01 à 07) pour savoir exactement où récupérer vos identifiants."
        steps={PIXELS_GUIDE_STEPS}
        currentIndex={guideIndex}
        onStepChange={setGuideIndex}
      />

      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
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

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openGuideAt(0)}
            leftIcon={<Compass className="w-3.5 h-3.5 text-[#9A7414]" />}
            className="text-xs border-[#E6D6A6] bg-[#FBF6E8]/70 hover:bg-[#FBF6E8] text-[#9A7414]"
          >
            Guide interactif (01–07)
          </Button>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Cards 01 - 05 */}
        <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Share2 className="w-4 h-4 text-[#C59B27]" />
            <h2 className="text-sm font-black text-[#1D232E] uppercase tracking-wider">
              Identifiants des Pixels Publicitaires
            </h2>
          </div>

          {/* 01- Meta / Facebook & Instagram Pixel */}
          <div
            className={cn(
              'p-5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3.5 transition-all',
              isCardHighlighted(0) && 'ring-2 ring-[#C59B27] border-[#C59B27] shadow-md'
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-[13px] sm:text-sm font-black text-[#1D232E] truncate whitespace-nowrap">
                    01- Meta / Facebook &amp; Instagram Pixel
                  </h3>
                  <GuideInfoButton
                    active={isCardHighlighted(0)}
                    onClick={() => openGuideAt(0)}
                    title="Guide : 01- Meta / Facebook & Instagram Pixel"
                  />
                </div>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer Meta Pixel"
                  checked={form.metaPixelEnabled}
                  onChange={(v) => setForm((p) => ({ ...p, metaPixelEnabled: v }))}
                />
              </div>
              <p className="text-xs text-slate-500 truncate whitespace-nowrap">
                Campagnes Facebook &amp; Instagram Ads et validation de domaine
              </p>
            </div>

            <Input
              label="Meta Pixel ID (ex: 123456789012345)"
              placeholder="Saisissez l’ID à 15 chiffres"
              value={form.metaPixelId}
              onChange={(e) => setForm((p) => ({ ...p, metaPixelId: e.target.value }))}
            />
            <Input
              label="Meta Domain Verification (Optionnel — balise meta)"
              placeholder="ex: abc123xyz456..."
              value={form.facebookDomainVerification}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  facebookDomainVerification: extractMetaContent(e.target.value),
                }))
              }
            />
          </div>

          {/* 02- TikTok Pixel */}
          <div
            className={cn(
              'p-5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3.5 transition-all',
              isCardHighlighted(1) && 'ring-2 ring-[#C59B27] border-[#C59B27] shadow-md'
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-[13px] sm:text-sm font-black text-[#1D232E] truncate whitespace-nowrap">
                    02- TikTok Pixel
                  </h3>
                  <GuideInfoButton
                    active={isCardHighlighted(1)}
                    onClick={() => openGuideAt(1)}
                    title="Guide : 02- TikTok Pixel"
                  />
                </div>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer TikTok Pixel"
                  checked={form.tiktokPixelEnabled}
                  onChange={(v) => setForm((p) => ({ ...p, tiktokPixelEnabled: v }))}
                />
              </div>
              <p className="text-xs text-slate-500 truncate whitespace-nowrap">
                Conversions et audiences pour TikTok Ads Manager
              </p>
            </div>

            <Input
              label="TikTok Pixel ID (ex: CXXXXXXXXXXXXXXXXX)"
              placeholder="Saisissez le code SDK / Pixel ID TikTok"
              value={form.tiktokPixelId}
              onChange={(e) => setForm((p) => ({ ...p, tiktokPixelId: e.target.value }))}
            />
          </div>

          {/* 03- Google Analytics 4 */}
          <div
            className={cn(
              'p-5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3.5 transition-all',
              isCardHighlighted(2) && 'ring-2 ring-[#C59B27] border-[#C59B27] shadow-md'
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-[13px] sm:text-sm font-black text-[#1D232E] truncate whitespace-nowrap">
                    03- Google Analytics 4
                  </h3>
                  <GuideInfoButton
                    active={isCardHighlighted(2)}
                    onClick={() => openGuideAt(2)}
                    title="Guide : 03- Google Analytics 4"
                  />
                </div>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer Google Analytics 4"
                  checked={form.ga4Enabled}
                  onChange={(v) => setForm((p) => ({ ...p, ga4Enabled: v }))}
                />
              </div>
              <p className="text-xs text-slate-500 truncate whitespace-nowrap">
                Analyse du trafic et entonnoir de conversion e-commerce
              </p>
            </div>

            <Input
              label="ID de mesure GA4"
              placeholder="G-XXXXXXXXXX"
              value={form.ga4MeasurementId}
              onChange={(e) => setForm((p) => ({ ...p, ga4MeasurementId: e.target.value }))}
            />
          </div>

          {/* 04- Google Tag Manager */}
          <div
            className={cn(
              'p-5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3.5 transition-all',
              isCardHighlighted(3) && 'ring-2 ring-[#C59B27] border-[#C59B27] shadow-md'
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-[13px] sm:text-sm font-black text-[#1D232E] truncate whitespace-nowrap">
                    04- Google Tag Manager
                  </h3>
                  <GuideInfoButton
                    active={isCardHighlighted(3)}
                    onClick={() => openGuideAt(3)}
                    title="Guide : 04- Google Tag Manager"
                  />
                </div>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer Google Tag Manager"
                  checked={form.gtmEnabled}
                  onChange={(v) => setForm((p) => ({ ...p, gtmEnabled: v }))}
                />
              </div>
              <p className="text-xs text-slate-500 truncate whitespace-nowrap">
                Conteneur centralisé pour balises marketing et scripts
              </p>
            </div>

            <Input
              label="ID Conteneur GTM"
              placeholder="GTM-XXXXXXX"
              value={form.gtmContainerId}
              onChange={(e) => setForm((p) => ({ ...p, gtmContainerId: e.target.value }))}
            />
          </div>

          {/* 05- Snapchat Pixel */}
          <div
            className={cn(
              'p-5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3.5 transition-all',
              isCardHighlighted(4) && 'ring-2 ring-[#C59B27] border-[#C59B27] shadow-md'
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-[13px] sm:text-sm font-black text-[#1D232E] truncate whitespace-nowrap">
                    05- Snapchat Pixel
                  </h3>
                  <GuideInfoButton
                    active={isCardHighlighted(4)}
                    onClick={() => openGuideAt(4)}
                    title="Guide : 05- Snapchat Pixel"
                  />
                </div>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer Snapchat Pixel"
                  checked={form.snapPixelEnabled}
                  onChange={(v) => setForm((p) => ({ ...p, snapPixelEnabled: v }))}
                />
              </div>
              <p className="text-xs text-slate-500 truncate whitespace-nowrap">
                Suivi des conversions et retargeting Snapchat Ads
              </p>
            </div>

            <Input
              label="Snapchat Pixel ID"
              placeholder="ex: 00000000-0000-0000-0000-000000000000"
              value={form.snapPixelId}
              onChange={(e) => setForm((p) => ({ ...p, snapPixelId: e.target.value }))}
            />
          </div>
        </div>

        {/* Right Column: Card 06 & Card 07 */}
        <div className="space-y-6">
          {/* 06- Référencement Naturel (SEO) & Search Console */}
          <div
            className={cn(
              'bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-6 space-y-4 transition-all',
              isCardHighlighted(5) && 'ring-2 ring-[#C59B27] border-[#C59B27] shadow-md'
            )}
          >
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-[13px] font-black text-[#1D232E] truncate whitespace-nowrap">
                    06- Référencement Naturel (SEO) &amp; Search Console
                  </h2>
                  <GuideInfoButton
                    active={isCardHighlighted(5)}
                    onClick={() => openGuideAt(5)}
                    title="Guide : 06- Référencement Naturel (SEO) & Search Console"
                  />
                </div>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Autoriser l'indexation Google"
                  checked={form.robotsIndex}
                  onChange={(v) => setForm((p) => ({ ...p, robotsIndex: v }))}
                />
              </div>
              <p className="text-xs text-slate-500 truncate whitespace-nowrap">
                Balises Google, Search Console et aperçu SERP en direct
              </p>
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
            <Input
              label="Google Site Verification (Search Console)"
              placeholder="ex: -sVFiqQAIiUhoCkCLkoOVY060WD77TF-eev_zSTzshA"
              value={form.googleSiteVerification}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  googleSiteVerification: extractMetaContent(e.target.value),
                }))
              }
            />
            <Input
              label="Domaine Canonique (Optionnel)"
              placeholder="https://royalfrontend.vercel.app"
              value={form.canonicalBaseUrl}
              onChange={(e) => setForm((p) => ({ ...p, canonicalBaseUrl: e.target.value }))}
            />

            <div className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#1D232E] block truncate">
                    Autoriser l’indexation Google &amp; moteurs (index, follow)
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    Active le référencement sur Google Search
                  </span>
                </div>
              </div>
              <Toggle
                compact
                size="sm"
                ariaLabel="Indexation moteurs"
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

          {/* 07- Événements E-Commerce Automatiques */}
          <div
            className={cn(
              'bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-6 space-y-4 transition-all',
              isCardHighlighted(6) && 'ring-2 ring-[#C59B27] border-[#C59B27] shadow-md'
            )}
          >
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-[#C59B27] shrink-0" />
                  <h2 className="text-[13px] sm:text-sm font-black text-[#1D232E] truncate whitespace-nowrap">
                    07- Événements E-Commerce Automatiques
                  </h2>
                  <GuideInfoButton
                    active={isCardHighlighted(6)}
                    onClick={() => openGuideAt(6)}
                    title="Guide : 07- Événements E-Commerce Automatiques"
                  />
                </div>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer tous les événements E-Commerce"
                  checked={allEventsEnabled}
                  onChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      trackViewContent: v,
                      trackAddToCart: v,
                      trackWishlist: v,
                      trackPurchase: v,
                    }))
                  }
                />
              </div>
              <p className="text-xs text-slate-500 truncate whitespace-nowrap">
                Signaux e-commerce envoyés automatiquement à vos pixels actifs
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="px-4 py-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#1D232E] truncate">
                  ViewContent — Consultation Fiche Article
                </span>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer ViewContent"
                  checked={form.trackViewContent}
                  onChange={(v) => setForm((p) => ({ ...p, trackViewContent: v }))}
                />
              </div>
              <div className="px-4 py-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#1D232E] truncate">
                  AddToCart — Ajout au Panier
                </span>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer AddToCart"
                  checked={form.trackAddToCart}
                  onChange={(v) => setForm((p) => ({ ...p, trackAddToCart: v }))}
                />
              </div>
              <div className="px-4 py-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#1D232E] truncate">
                  AddToWishlist — Ajout aux Favoris
                </span>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer AddToWishlist"
                  checked={form.trackWishlist}
                  onChange={(v) => setForm((p) => ({ ...p, trackWishlist: v }))}
                />
              </div>
              <div className="px-4 py-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#1D232E] truncate">
                  Purchase — Commande Validée
                </span>
                <Toggle
                  compact
                  size="sm"
                  ariaLabel="Activer Purchase"
                  checked={form.trackPurchase}
                  onChange={(v) => setForm((p) => ({ ...p, trackPurchase: v }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
