'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Palette,
  Save,
  Layout,
  Sliders,
  Sparkles,
  RotateCcw,
  Code2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Link2,
} from 'lucide-react';
import { Button, Input, Textarea, Select, Toggle, Breadcrumb, Toast, Modal } from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { CmsDomIdBadge, CmsElementDesignEditor } from '@/components/dashboard/CmsElementDesignEditor';
import type { CmsCustomViewRecord, CmsElementStyleConfig, CmsNavLinkItem } from '@/lib/cms-builder';

function StorefrontLayoutsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get('section') || 'design';

  const [theme, setTheme] = React.useState({
    primaryHex: '#C59B27',
    primaryHoverHex: '#A67C1E',
    primaryTextHex: '#FFFFFF',
    inkHex: '#1D232E',
    goldHex: '#C59B27',
    goldDarkHex: '#9A7414',
    goldLightHex: '#FBF6E8',
    silverHex: '#CBD5E1',
    silverLightHex: '#F4F5F7',
    backgroundHex: '#FDFCF9',
    cardHex: '#FFFFFF',
    borderHex: '#E6E1D6',
    headingFont: 'Poppins',
    bodyFont: 'Poppins',
    arabicFont: 'Cairo',
  });

  const [header, setHeader] = React.useState<{
    announcementText: string;
    showSearch: boolean;
    showLanguageSwitch: boolean;
    showCompare: boolean;
    showWishlist: boolean;
    showTrackOrder: boolean;
    showCartButton: boolean;
    showAccountButton: boolean;
    transparentOnHome: boolean;
    stickyMode: 'auto' | 'always' | 'static';
    navLinks: CmsNavLinkItem[];
    elementStyles: Record<string, CmsElementStyleConfig>;
  }>({
    announcementText: 'Livraison 24–48h partout en Tunisie',
    showSearch: true,
    showLanguageSwitch: true,
    showCompare: true,
    showWishlist: true,
    showTrackOrder: true,
    showCartButton: true,
    showAccountButton: true,
    transparentOnHome: true,
    stickyMode: 'auto',
    navLinks: [
      { id: 'nav-home', label: 'Accueil', href: '/', i18nKey: 'nav.home', visible: true, highlight: false },
      { id: 'nav-articles', label: 'Articles', href: '/articles', i18nKey: 'nav.articles', visible: true, highlight: false },
      { id: 'nav-rays', label: 'Rayons', href: '#rays', type: 'RAYONS_DROPDOWN', i18nKey: 'nav.rays', visible: true, highlight: false },
      { id: 'nav-promos', label: 'Promotions', href: '/articles?sortBy=promo', i18nKey: 'nav.promos', visible: true, highlight: true },
    ],
    elementStyles: {},
  });

  const [footer, setFooter] = React.useState<{
    aboutDescription: string;
    col1Title: string;
    col1Links: Array<{ label: string; href: string }>;
    col2Title: string;
    col2Links: Array<{ label: string; href: string }>;
    col3Title: string;
    col3Links: Array<{ label: string; href: string }>;
    col4Title: string;
    copyrightText: string;
    showBrandHeader?: boolean;
    showNewsletter?: boolean;
    newsletterTitle?: string;
    showSocialLinks?: boolean;
    showAddress?: boolean;
    showPhone?: boolean;
    showWhatsapp?: boolean;
    showEmail?: boolean;
    elementStyles?: Record<string, CmsElementStyleConfig>;
  }>({
    aboutDescription: '',
    col1Title: 'À Propos',
    col1Links: [
      { label: 'Accueil Royal', href: '/' },
      { label: 'Tous nos Articles', href: '/articles' },
      { label: 'Promotions & Soldes', href: '/articles?sortBy=promo' },
    ],
    col2Title: 'Rayons & Articles',
    col2Links: [],
    col3Title: 'Informations & Aide',
    col3Links: [
      { label: 'Contactez-nous', href: '/contact' },
      { label: 'Foire Aux Questions (FAQ)', href: '/faq' },
      { label: 'Conditions Générales de Vente', href: '/terms' },
      { label: 'Politique de Confidentialité', href: '/privacy' },
      { label: 'Suivi de Commande', href: '/track-order' },
    ],
    col4Title: 'Contact & Coordonnées',
    copyrightText: 'Royal — Électro de Maison (Mahdia, Tunisie). Tous droits réservés.',
    showBrandHeader: true,
    showNewsletter: true,
    newsletterTitle: 'Restez Informé de nos Offres & Nouveautés',
    showSocialLinks: true,
    showAddress: true,
    showPhone: true,
    showWhatsapp: true,
    showEmail: true,
    elementStyles: {},
  });

  const [globalCustomCode, setGlobalCustomCode] = React.useState<{ customCss: string; customJs: string }>({
    customCss: '',
    customJs: '',
  });
  const [customViews, setCustomViews] = React.useState<CmsCustomViewRecord[]>([]);

  const [saving, setSaving] = React.useState(false);
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchApi('/storefront-cms/config')
      .then((cfg) => {
        if (cfg?.theme) setTheme((prev) => ({ ...prev, ...cfg.theme }));
        if (cfg?.header) setHeader((prev) => ({ ...prev, ...cfg.header }));
        if (cfg?.footer) setFooter((prev) => ({ ...prev, ...cfg.footer }));
        if (cfg?.globalCustomCode) setGlobalCustomCode({ customCss: cfg.globalCustomCode.customCss || '', customJs: cfg.globalCustomCode.customJs || '' });
        if (Array.isArray(cfg?.customViews)) setCustomViews(cfg.customViews);
      })
      .catch(() => null);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/cms/layout', {
        method: 'PATCH',
        body: JSON.stringify({ theme, header, footer, globalCustomCode }),
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('royal-cms-updated'));
      }
      setToastMsg('Mise en page, en-tête, pied de page et CSS/JS global sauvegardés et appliqués en direct !');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: 'gold' | 'platinum') => {
    if (preset === 'gold') {
      setTheme((p) => ({
        ...p,
        primaryHex: '#C59B27',
        primaryHoverHex: '#A67C1E',
        primaryTextHex: '#FFFFFF',
        inkHex: '#1D232E',
        goldHex: '#C59B27',
        goldDarkHex: '#9A7414',
        goldLightHex: '#FBF6E8',
        silverLightHex: '#F4F5F7',
        backgroundHex: '#FDFCF9',
        cardHex: '#FFFFFF',
        borderHex: '#E6E1D6',
      }));
    } else {
      setTheme((p) => ({
        ...p,
        primaryHex: '#334155',
        primaryHoverHex: '#1E293B',
        primaryTextHex: '#FFFFFF',
        inkHex: '#0F172A',
        goldHex: '#64748B',
        goldDarkHex: '#334155',
        goldLightHex: '#F1F5F9',
        silverLightHex: '#F8FAFC',
        backgroundHex: '#FFFFFF',
        cardHex: '#FFFFFF',
        borderHex: '#CBD5E1',
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                CMS — Mise en Page, Design, En-tête &amp; Pied de Page
              </h1>
              <p className="text-xs text-slate-500">
                Couleurs, polices Google Fonts, barre d&apos;en-tête et liens des 4 colonnes du pied de page.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(true)}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser le design</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Mise en page et design' },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 bg-white p-3 rounded-3xl border border-[#E6E1D6] shadow-xs lg:sticky lg:top-24 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Sections Design
          </div>
          {[
            { id: 'design', label: 'Mise en page & Couleurs', href: '/dashboard/root/storefront/layouts', icon: Palette },
            { id: 'header', label: 'En-tête & Menu', href: '/dashboard/root/storefront/layouts?section=header', icon: Layout },
            { id: 'footer', label: 'Pied de page (4 Colonnes)', href: '/dashboard/root/storefront/layouts?section=footer', icon: Sliders },
            { id: 'custom-code', label: 'CSS & JS Global Site', href: '/dashboard/root/storefront/layouts?section=custom-code', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = (tab.id === 'design' && sectionParam === 'design') || sectionParam === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => router.replace(tab.href, { scroll: false })}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition cursor-pointer ${
                  active
                    ? 'bg-[var(--royal-primary)] text-white shadow-xs'
                    : 'text-[#1D232E] hover:bg-[#FBF6E8]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[var(--royal-primary)]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        <form onSubmit={handleSave} className="lg:col-span-9 space-y-6">
        {sectionParam === 'design' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E1D6] pb-3">
                <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider">
                  Nuancier Central &amp; Typographie
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('gold')}
                    className="px-3 py-1 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] text-[11px] font-bold text-[#9A7414] cursor-pointer"
                  >
                    Thème Or Royal (Logo)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('platinum')}
                    className="px-3 py-1 rounded-full bg-[#F4F5F7] border border-slate-300 text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    Thème Argent Platine
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'primaryHex', label: 'Boutons Principaux' },
                  { key: 'primaryHoverHex', label: 'Survol Boutons' },
                  { key: 'primaryTextHex', label: 'Texte Boutons' },
                  { key: 'goldHex', label: 'Accent Or Principal' },
                  { key: 'goldDarkHex', label: 'Accent Texte Foncé' },
                  { key: 'goldLightHex', label: 'Fond Accent Doux' },
                  { key: 'silverLightHex', label: 'Fond Secondaire Doux' },
                  { key: 'backgroundHex', label: 'Fond Global Page' },
                  { key: 'cardHex', label: 'Fond des Cartes' },
                  { key: 'borderHex', label: 'Bordures & Lignes' },
                  { key: 'inkHex', label: 'Texte Principal' },
                ].map((c) => (
                  <div key={c.key} className="p-3 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 block">{c.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(theme as any)[c.key]}
                        onChange={(e) => setTheme({ ...theme, [c.key]: e.target.value })}
                        className="h-9 w-11 rounded-lg border border-[#E6E1D6] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(theme as any)[c.key]}
                        onChange={(e) => setTheme({ ...theme, [c.key]: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6E1D6] bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#E6E1D6]">
                <Select
                  label="Police Titres (Headings)"
                  value={theme.headingFont}
                  onChange={(e) => setTheme({ ...theme, headingFont: e.target.value })}
                  options={[
                    { value: 'Poppins', label: 'Poppins (Moderne Luxe)' },
                    { value: 'Montserrat', label: 'Montserrat (Géométrique)' },
                    { value: 'Playfair Display', label: 'Playfair Display (Éditorial)' },
                  ]}
                />
                <Select
                  label="Police Corps de Texte"
                  value={theme.bodyFont}
                  onChange={(e) => setTheme({ ...theme, bodyFont: e.target.value })}
                  options={[
                    { value: 'Poppins', label: 'Poppins' },
                    { value: 'Roboto', label: 'Roboto' },
                    { value: 'Inter', label: 'Inter' },
                  ]}
                />
                <Select
                  label="Police Arabe (RTL)"
                  value={theme.arabicFont}
                  onChange={(e) => setTheme({ ...theme, arabicFont: e.target.value })}
                  options={[
                    { value: 'Cairo', label: 'Cairo' },
                    { value: 'Tajawal', label: 'Tajawal' },
                  ]}
                />
              </div>
            </div>

            <div className="xl:col-span-4 bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-5">
              <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider border-b border-[#E6E1D6] pb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <span>Aperçu Temps Réel</span>
              </h2>
              <div
                className="p-5 rounded-2xl border space-y-4"
                style={{
                  backgroundColor: theme.backgroundHex,
                  borderColor: theme.borderHex,
                  fontFamily: `'${theme.bodyFont}', sans-serif`,
                }}
              >
                <div
                  className="text-base font-extrabold"
                  style={{ color: theme.inkHex, fontFamily: `'${theme.headingFont}', sans-serif` }}
                >
                  Titre Exemple Royal
                </div>
                <p className="text-xs text-slate-600">
                  Boutons, cartes et badges utilisent ces jetons CSS globalement.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="px-4 py-2 rounded-full text-xs font-bold"
                    style={{ backgroundColor: theme.primaryHex, color: theme.primaryTextHex }}
                  >
                    Bouton Principal
                  </span>
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-bold border"
                    style={{ backgroundColor: theme.goldLightHex, color: theme.goldDarkHex, borderColor: theme.goldHex }}
                  >
                    Badge Or
                  </span>
                </div>
              </div>
              <Button type="submit" variant="gold" fullWidth isLoading={saving}>
                <Save className="w-4 h-4" />
                <span>Publier Couleurs &amp; Polices</span>
              </Button>
            </div>
          </div>
        )}

        {sectionParam === 'header' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E1D6] pb-3">
                <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
                  <Layout className="w-4 h-4 text-[#C59B27]" />
                  <span>Configuration de l&apos;En-tête, Barre d&apos;Annonce &amp; Menu</span>
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  <CmsDomIdBadge viewKey="header" elemId="main" customDomId={header.elementStyles?.main?.domId || 'royal-header-main'} />
                  <CmsDomIdBadge viewKey="header" elemId="topbar" customDomId={header.elementStyles?.topbar?.domId || 'royal-header-topbar'} />
                  <CmsDomIdBadge viewKey="header" elemId="nav" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Texte d'Annonce Barre Supérieure"
                    value={header.announcementText}
                    onChange={(e) => setHeader({ ...header, announcementText: e.target.value })}
                  />
                </div>
                <Select
                  label="Comportement Collant (Sticky)"
                  value={header.stickyMode || 'auto'}
                  onChange={(e) => setHeader({ ...header, stickyMode: e.target.value as any })}
                  options={[
                    { value: 'auto', label: 'Auto (Transparent Accueil · Sticky ailleurs)' },
                    { value: 'always', label: 'Toujours Sticky Fond Blanc' },
                    { value: 'static', label: 'Statique (Suit le défilement)' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Toggle label="Barre de recherche" checked={header.showSearch} onChange={(v) => setHeader({ ...header, showSearch: v })} />
                <Toggle label="Sélecteur FR / AR" checked={header.showLanguageSwitch} onChange={(v) => setHeader({ ...header, showLanguageSwitch: v })} />
                <Toggle label="Bouton Comparateur" checked={header.showCompare} onChange={(v) => setHeader({ ...header, showCompare: v })} />
                <Toggle label="Bouton Favoris" checked={header.showWishlist} onChange={(v) => setHeader({ ...header, showWishlist: v })} />
                <Toggle label="Suivre ma commande" checked={header.showTrackOrder} onChange={(v) => setHeader({ ...header, showTrackOrder: v })} />
                <Toggle label="Bouton Panier" checked={header.showCartButton !== false} onChange={(v) => setHeader({ ...header, showCartButton: v })} />
                <Toggle label="Bouton Compte Client" checked={header.showAccountButton !== false} onChange={(v) => setHeader({ ...header, showAccountButton: v })} />
                <Toggle label="Transparent sur Accueil" checked={header.transparentOnHome !== false} onChange={(v) => setHeader({ ...header, transparentOnHome: v })} />
              </div>

              {/* Navigation Menu Builder */}
              <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#1D232E]">
                    Liens de Navigation Menu Principal ({(header.navLinks || []).length})
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {customViews.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          const cv = customViews.find((v) => v.slug === e.target.value);
                          if (!cv) return;
                          setHeader((prev) => ({
                            ...prev,
                            navLinks: [
                              ...(prev.navLinks || []),
                              { id: `nav-${cv.slug}-${Date.now()}`, label: cv.title, href: `/pages/${cv.slug}`, visible: true, highlight: false },
                            ],
                          }));
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#E6D6A6] bg-white text-[11px] font-bold text-[#9A7414]"
                      >
                        <option value="">+ Lier une Vue Personnalisée...</option>
                        {customViews.map((cv) => (
                          <option key={cv.id} value={cv.slug}>
                            {cv.title} (/pages/{cv.slug})
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setHeader((prev) => ({
                          ...prev,
                          navLinks: [
                            ...(prev.navLinks || []),
                            { id: `nav-${Date.now()}`, label: 'Nouveau Lien', href: '/articles', visible: true, highlight: false },
                          ],
                        }))
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E6D6A6] text-[11px] font-bold text-[#9A7414] hover:bg-[#FBF6E8] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un lien</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(header.navLinks || []).map((lnk, idx) => (
                    <div key={lnk.id || idx} className="p-2.5 rounded-xl bg-white border border-[#E6E1D6] flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={lnk.label}
                        onChange={(e) => {
                          const next = [...header.navLinks];
                          next[idx] = { ...lnk, label: e.target.value };
                          setHeader({ ...header, navLinks: next });
                        }}
                        placeholder="Libellé"
                        className="w-36 px-2.5 py-1.5 rounded-lg border border-[#E6E1D6] text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={lnk.href}
                        disabled={lnk.type === 'RAYONS_DROPDOWN'}
                        onChange={(e) => {
                          const next = [...header.navLinks];
                          next[idx] = { ...lnk, href: e.target.value };
                          setHeader({ ...header, navLinks: next });
                        }}
                        placeholder="/route"
                        className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg border border-[#E6E1D6] font-mono text-xs disabled:bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...header.navLinks];
                          next[idx] = { ...lnk, visible: lnk.visible === false };
                          setHeader({ ...header, navLinks: next });
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          lnk.visible !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {lnk.visible !== false ? 'Visible' : 'Masqué'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...header.navLinks];
                          next[idx] = { ...lnk, highlight: !lnk.highlight };
                          setHeader({ ...header, navLinks: next });
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          lnk.highlight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-white text-slate-500 border-[#E6E1D6]'
                        }`}
                      >
                        Accent Or
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const next = [...header.navLinks];
                          const [m] = next.splice(idx, 1);
                          next.splice(idx - 1, 0, m);
                          setHeader({ ...header, navLinks: next });
                        }}
                        className="p-1.5 rounded-lg border border-[#E6E1D6] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === header.navLinks.length - 1}
                        onClick={() => {
                          const next = [...header.navLinks];
                          const [m] = next.splice(idx, 1);
                          next.splice(idx + 1, 0, m);
                          setHeader({ ...header, navLinks: next });
                        }}
                        className="p-1.5 rounded-lg border border-[#E6E1D6] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeader({ ...header, navLinks: header.navLinks.filter((_, i) => i !== idx) })}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Header Elementor Style & CSS/JS */}
              <div className="space-y-3 pt-2 border-t border-[#E6E1D6]">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1D232E]">
                  Design, Marge, Padding &amp; CSS/JS de l&apos;En-tête (#royal-header-main)
                </h3>
                <CmsElementDesignEditor
                  viewKey="header"
                  elemId="main"
                  value={header.elementStyles?.main || {}}
                  onChange={(nextStyle) =>
                    setHeader({
                      ...header,
                      elementStyles: { ...(header.elementStyles || {}), main: nextStyle },
                    })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="gold" isLoading={saving}>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer En-tête &amp; Menu</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {sectionParam === 'footer' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E1D6] pb-3">
              <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C59B27]" />
                <span>Gestion des 4 Colonnes, Liens &amp; Design du Pied de Page</span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                <CmsDomIdBadge viewKey="footer" elemId="main" customDomId={footer.elementStyles?.main?.domId || 'royal-footer-main'} />
                <CmsDomIdBadge viewKey="footer" elemId="brand" />
                <CmsDomIdBadge viewKey="footer" elemId="cols" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Titre Colonne 1" value={footer.col1Title} onChange={(e) => setFooter({ ...footer, col1Title: e.target.value })} />
              <Input label="Titre Colonne 2" value={footer.col2Title} onChange={(e) => setFooter({ ...footer, col2Title: e.target.value })} />
              <Input label="Titre Colonne 3" value={footer.col3Title} onChange={(e) => setFooter({ ...footer, col3Title: e.target.value })} />
              <Input label="Titre Colonne 4" value={footer.col4Title} onChange={(e) => setFooter({ ...footer, col4Title: e.target.value })} />
            </div>

            {/* Dynamic Links Editors for Cols 1, 2, 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {(
                [
                  { key: 'col1Links', title: `Liens — ${footer.col1Title || 'Colonne 1'}` },
                  { key: 'col2Links', title: `Liens — ${footer.col2Title || 'Colonne 2'} (vide = catégories auto)` },
                  { key: 'col3Links', title: `Liens — ${footer.col3Title || 'Colonne 3'}` },
                ] as const
              ).map(({ key, title }) => {
                const links = footer[key] || [];
                return (
                  <div key={key} className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#1D232E]">{title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFooter((prev) => ({
                            ...prev,
                            [key]: [...(prev[key] || []), { label: 'Nouveau lien', href: '/articles' }],
                          }))
                        }
                        className="px-2.5 py-1 rounded-full bg-white border border-[#E6D6A6] text-[10px] font-bold text-[#9A7414] hover:bg-[#FBF6E8] cursor-pointer"
                      >
                        + Lien
                      </button>
                    </div>
                    {customViews.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          const cv = customViews.find((v) => v.slug === e.target.value);
                          if (!cv) return;
                          setFooter((prev) => ({
                            ...prev,
                            [key]: [...(prev[key] || []), { label: cv.title, href: `/pages/${cv.slug}` }],
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6D6A6] bg-white text-[11px] font-bold text-[#9A7414]"
                      >
                        <option value="">+ Connecter une Vue Personnalisée...</option>
                        {customViews.map((cv) => (
                          <option key={cv.id} value={cv.slug}>
                            {cv.title} (/pages/{cv.slug})
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="space-y-2">
                      {links.map((lnk, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={lnk.label}
                            onChange={(e) => {
                              const next = [...links];
                              next[idx] = { ...next[idx], label: e.target.value };
                              setFooter({ ...footer, [key]: next });
                            }}
                            placeholder="Libellé"
                            className="w-1/2 px-2.5 py-1.5 rounded-lg border border-[#E6E1D6] bg-white text-[11px]"
                          />
                          <input
                            type="text"
                            value={lnk.href}
                            onChange={(e) => {
                              const next = [...links];
                              next[idx] = { ...next[idx], href: e.target.value };
                              setFooter({ ...footer, [key]: next });
                            }}
                            placeholder="/route"
                            className="w-1/2 px-2.5 py-1.5 rounded-lg border border-[#E6E1D6] bg-white font-mono text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = links.filter((_, i) => i !== idx);
                              setFooter({ ...footer, [key]: next });
                            }}
                            className="px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                            title="Retirer ce lien"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {links.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic">
                          Catégories automatiques affichées si vide.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Textarea
              label="Texte Colonne 1 (À Propos)"
              value={footer.aboutDescription}
              onChange={(e) => setFooter({ ...footer, aboutDescription: e.target.value })}
              rows={3}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <Toggle label="Bloc Logo & Slogan (Haut Footer)" checked={footer.showBrandHeader !== false} onChange={(v) => setFooter({ ...footer, showBrandHeader: v })} />
              <Toggle label="Formulaire Newsletter Footer" checked={footer.showNewsletter !== false} onChange={(v) => setFooter({ ...footer, showNewsletter: v })} />
              <Toggle label="Icônes Réseaux Sociaux" checked={footer.showSocialLinks !== false} onChange={(v) => setFooter({ ...footer, showSocialLinks: v })} />
              <Toggle label="Afficher Adresse (Col. 4)" checked={footer.showAddress !== false} onChange={(v) => setFooter({ ...footer, showAddress: v })} />
              <Toggle label="Afficher Téléphone (Col. 4)" checked={footer.showPhone !== false} onChange={(v) => setFooter({ ...footer, showPhone: v })} />
              <Toggle label="Afficher WhatsApp (Col. 4)" checked={footer.showWhatsapp !== false} onChange={(v) => setFooter({ ...footer, showWhatsapp: v })} />
              <Toggle label="Afficher E-mail (Col. 4)" checked={footer.showEmail !== false} onChange={(v) => setFooter({ ...footer, showEmail: v })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Titre Newsletter Footer"
                value={footer.newsletterTitle || ''}
                onChange={(e) => setFooter({ ...footer, newsletterTitle: e.target.value })}
              />
              <Input
                label="Mention Copyright Bas de Page"
                value={footer.copyrightText}
                onChange={(e) => setFooter({ ...footer, copyrightText: e.target.value })}
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-[#E6E1D6]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1D232E]">
                Design, Marge, Padding &amp; CSS/JS du Pied de Page (#royal-footer-main)
              </h3>
              <CmsElementDesignEditor
                viewKey="footer"
                elemId="main"
                value={footer.elementStyles?.main || {}}
                onChange={(nextStyle) =>
                  setFooter({
                    ...footer,
                    elementStyles: { ...(footer.elementStyles || {}), main: nextStyle },
                  })
                }
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="gold" isLoading={saving}>
                <Save className="w-4 h-4" />
                <span>Enregistrer Pied de Page</span>
              </Button>
            </div>
          </div>
        )}

        {sectionParam === 'custom-code' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E1D6] pb-3">
              <div>
                <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#C59B27]" />
                  <span>CSS &amp; JavaScript Global (Tout le Storefront)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Appliqué sur toutes les pages publiques. Utilisez les IDs affichés dans En-tête, Pied de Page ou Vues (ex : <code className="font-mono text-[#9A7414]">#royal-header-main</code>, <code className="font-mono text-[#9A7414]">#royal-footer-main</code>, <code className="font-mono text-[#9A7414]">#royal-home-hero</code>).
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] font-mono text-[11px] font-bold text-[#9A7414]">
                <Link2 className="w-3 h-3" /> Global Storefront Scope
              </span>
            </div>

            <Textarea
              label="CSS Personnalisé Global (appliqué sur tout le Storefront)"
              rows={10}
              className="font-mono text-xs"
              value={globalCustomCode.customCss}
              onChange={(e) => setGlobalCustomCode({ ...globalCustomCode, customCss: e.target.value })}
              placeholder={`/* Exemple CSS Global */\n#royal-home-hero .btn-cta {\n  border-radius: 9999px;\n}`}
            />

            <Textarea
              label="JavaScript Personnalisé Global (exécuté au chargement Storefront)"
              rows={10}
              className="font-mono text-xs"
              value={globalCustomCode.customJs}
              onChange={(e) => setGlobalCustomCode({ ...globalCustomCode, customJs: e.target.value })}
              placeholder={`// Exemple JS Global\nconsole.log('Storefront Royal prêt', document.querySelectorAll('[id^="royal-"]').length);`}
            />

            <div className="flex justify-end">
              <Button type="submit" variant="gold" isLoading={saving}>
                <Save className="w-4 h-4" />
                <span>Publier CSS &amp; JS Global</span>
              </Button>
            </div>
          </div>
        )}
      </form>
      </div>

      <Modal
        isOpen={resetModalOpen}
        onClose={() => !saving && setResetModalOpen(false)}
        title="Réinitialiser Design, En-tête & Pied de Page"
        size="md"
      >
        <div className="p-6 space-y-4 text-xs text-slate-600">
          <p className="leading-relaxed">
            Cette action réinitialise uniquement les couleurs, polices Google Fonts, l&apos;en-tête et le pied de page par défaut (vos vues et votre identité restent conservées).
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setResetModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="gold"
              size="sm"
              isLoading={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  const res = await fetchApi('/storefront-cms/cms/reset-defaults', {
                    method: 'POST',
                    body: JSON.stringify({ scope: 'layout' }),
                  });
                  const cfg = res?.data || res;
                  if (cfg?.theme) setTheme((prev) => ({ ...prev, ...cfg.theme }));
                  if (cfg?.header) setHeader((prev) => ({ ...prev, ...cfg.header }));
                  if (cfg?.footer) setFooter((prev) => ({ ...prev, ...cfg.footer }));
                  if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
                  setResetModalOpen(false);
                  setToastMsg('Design, couleurs, en-tête et pied de page réinitialisés par défaut.');
                } finally {
                  setSaving(false);
                }
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Confirmer la réinitialisation</span>
            </Button>
          </div>
        </div>
      </Modal>

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
    </div>
  );
}

export default function StorefrontLayoutsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement CMS Mise en page...</div>}>
      <StorefrontLayoutsContent />
    </Suspense>
  );
}
