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
} from 'lucide-react';
import { Button, Input, Textarea, Select, Toggle, Breadcrumb, Toast } from '@/components/ui';
import { fetchApi } from '@/lib/api';

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

  const [header, setHeader] = React.useState({
    announcementText: 'Livraison 24–48h partout en Tunisie',
    showSearch: true,
    showLanguageSwitch: true,
    showCompare: true,
    showWishlist: true,
    showTrackOrder: true,
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
  });

  const [saving, setSaving] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchApi('/storefront-cms/config')
      .then((cfg) => {
        if (cfg?.theme) setTheme((prev) => ({ ...prev, ...cfg.theme }));
        if (cfg?.header) setHeader((prev) => ({ ...prev, ...cfg.header }));
        if (cfg?.footer) setFooter((prev) => ({ ...prev, ...cfg.footer }));
      })
      .catch(() => null);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/cms/layout', {
        method: 'PATCH',
        body: JSON.stringify({ theme, header, footer }),
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('royal-cms-updated'));
      }
      setToastMsg('Mise en page, couleurs, polices, en-tête et pied de page sauvegardés et appliqués en direct !');
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
              onClick={async () => {
                setSaving(true);
                try {
                  const res = await fetchApi('/storefront-cms/cms/reset-defaults', { method: 'POST' });
                  const cfg = res?.data || res;
                  if (cfg?.theme) setTheme((prev) => ({ ...prev, ...cfg.theme }));
                  if (cfg?.header) setHeader((prev) => ({ ...prev, ...cfg.header }));
                  if (cfg?.footer) setFooter((prev) => ({ ...prev, ...cfg.footer }));
                  if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
                  setToastMsg('Design, couleurs, en-tête et pied de page réinitialisés par défaut (JSON).');
                } finally {
                  setSaving(false);
                }
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser par défaut</span>
            </Button>
            {[
              { id: 'design', label: 'Mise en page & Couleurs', href: '/dashboard/root/storefront/layouts' },
              { id: 'header', label: 'En-tête & Menu', href: '/dashboard/root/storefront/layouts?section=header' },
              { id: 'footer', label: 'Pied de page (4 Colonnes)', href: '/dashboard/root/storefront/layouts?section=footer' },
            ].map((tab) => {
              const active =
                (tab.id === 'design' && sectionParam === 'design') ||
                sectionParam === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => router.push(tab.href)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-[var(--royal-primary)] text-white shadow-xs'
                      : 'bg-[#F4F5F7] text-slate-700 hover:bg-[#FBF6E8]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
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

      <form onSubmit={handleSave} className="space-y-6">
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
                style={{ backgroundColor: theme.backgroundHex, borderColor: theme.borderHex }}
              >
                <div className="text-base font-extrabold" style={{ color: theme.inkHex }}>
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-6">
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider border-b border-[#E6E1D6] pb-3 flex items-center gap-2">
              <Layout className="w-4 h-4 text-[#C59B27]" />
              <span>Configuration de l&apos;En-tête &amp; Barre d&apos;Annonce</span>
            </h2>
            <Input
              label="Texte d'Annonce Barre Supérieure"
              value={header.announcementText}
              onChange={(e) => setHeader({ ...header, announcementText: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Toggle
                label="Barre de recherche Header"
                checked={header.showSearch}
                onChange={(v) => setHeader({ ...header, showSearch: v })}
              />
              <Toggle
                label="Sélecteur FR / AR"
                checked={header.showLanguageSwitch}
                onChange={(v) => setHeader({ ...header, showLanguageSwitch: v })}
              />
              <Toggle
                label="Bouton Comparateur"
                checked={header.showCompare}
                onChange={(v) => setHeader({ ...header, showCompare: v })}
              />
              <Toggle
                label="Bouton Favoris / Wishlist"
                checked={header.showWishlist}
                onChange={(v) => setHeader({ ...header, showWishlist: v })}
              />
              <Toggle
                label="Lien Suivre ma commande"
                checked={header.showTrackOrder}
                onChange={(v) => setHeader({ ...header, showTrackOrder: v })}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="gold" isLoading={saving}>
                <Save className="w-4 h-4" />
                <span>Enregistrer En-tête</span>
              </Button>
            </div>
          </div>
        )}

        {sectionParam === 'footer' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-6">
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider border-b border-[#E6E1D6] pb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#C59B27]" />
              <span>Gestion des 4 Colonnes &amp; Liens du Pied de Page</span>
            </h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Toggle
                label="Afficher Bloc Logo & Slogan (Haut Footer)"
                checked={footer.showBrandHeader !== false}
                onChange={(v) => setFooter({ ...footer, showBrandHeader: v })}
              />
              <Toggle
                label="Afficher Formulaire Newsletter Footer"
                checked={footer.showNewsletter !== false}
                onChange={(v) => setFooter({ ...footer, showNewsletter: v })}
              />
              <Toggle
                label="Afficher Icônes Réseaux Sociaux"
                checked={footer.showSocialLinks !== false}
                onChange={(v) => setFooter({ ...footer, showSocialLinks: v })}
              />
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
            <div className="flex justify-end">
              <Button type="submit" variant="gold" isLoading={saving}>
                <Save className="w-4 h-4" />
                <span>Enregistrer Pied de Page</span>
              </Button>
            </div>
          </div>
        )}
      </form>

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
