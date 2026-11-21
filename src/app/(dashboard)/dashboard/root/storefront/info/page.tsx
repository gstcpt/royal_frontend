'use client';

import * as React from 'react';
import {
  Tag,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { Button, Input, Textarea, Breadcrumb, Toast, ImageDropzoneCropper } from '@/components/ui';
import { fetchApi } from '@/lib/api';

export default function StorefrontInfoPage() {
  const [appName, setAppName] = React.useState('Royal');
  const [slogan, setSlogan] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState('/images/royal-logo.jpg');
  const [faviconUrl, setFaviconUrl] = React.useState('/icon.png');
  const [email, setEmail] = React.useState('royaltn24@gmail.com');
  const [phone, setPhone] = React.useState('48 091 914');
  const [whatsapp, setWhatsapp] = React.useState('48091914');
  const [address, setAddress] = React.useState('Mahdia 5100, Tunisia');
  const [instagram, setInstagram] = React.useState('');
  const [facebook, setFacebook] = React.useState('');
  const [tiktok, setTiktok] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const loadConfig = React.useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await fetchApi('/storefront-cms/config');
      const id = cfg?.identity || {};
      setAppName(id.appName || cfg?.appName || 'Royal');
      setSlogan(id.slogan || '');
      setLogoUrl(id.logoUrl || cfg?.logoUrl || '/images/royal-logo.jpg');
      setFaviconUrl(id.faviconUrl || cfg?.faviconUrl || '/icon.png');
      setEmail(id.email || '');
      setPhone(id.phone || '');
      setWhatsapp(id.whatsapp || '');
      setAddress(id.address || '');
      setInstagram(id.instagram || '');
      setFacebook(id.facebook || '');
      setTiktok(id.tiktok || '');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/cms/identity', {
        method: 'PATCH',
        body: JSON.stringify({
          appName,
          slogan,
          logoUrl,
          faviconUrl,
          email,
          phone,
          whatsapp,
          address,
          instagram,
          facebook,
          tiktok,
        }),
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('royal-cms-updated'));
      }
      setToastMsg('Identité, logo et favicon enregistrés en base PostgreSQL.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl shadow-xs">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                CMS — Identité et Marque Royal
              </h1>
              <p className="text-xs text-slate-500">
                Configuration centralisée du nom de boutique, logo officiel, favicon, slogan et coordonnées.
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={loadConfig} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Identité et marque' },
            ]}
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-6">
          <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider border-b border-[#E6E1D6] pb-3">
            Informations Générales &amp; Coordonnées
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom de la Boutique *"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
            />
            <Input
              label="Email Officiel"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Textarea
            label="Slogan / Description Marque"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Téléphone Service Client"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="WhatsApp Direct"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <Input
              label="Adresse Siège / Showroom"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#E6E1D6]">
            <Input
              label="Lien Instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
            <Input
              label="Lien Facebook"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
            />
            <Input
              label="Lien TikTok"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
            />
          </div>
        </div>

        <div className="xl:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-5">
          <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider border-b border-[#E6E1D6] pb-3">
            Logo &amp; Favicon Dynamiques
          </h2>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6]">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#C59B27]/50 bg-white shrink-0">
              <img src={logoUrl || '/images/royal-logo.jpg'} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="font-heading font-black text-base text-[#1D232E] uppercase">{appName}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                <img src={faviconUrl || '/icon.png'} alt="Favicon" className="w-4 h-4 rounded" />
                <span>Favicon actif</span>
              </div>
            </div>
          </div>

          <ImageDropzoneCropper
            label="Logo Officiel de la Boutique (Glisser-déposer + Recadrage)"
            value={logoUrl}
            onChange={(url) => setLogoUrl(url)}
            aspectRatio={2.2}
          />

          <ImageDropzoneCropper
            label="Favicon du Navigateur (Icône 1:1)"
            value={faviconUrl}
            onChange={(url) => setFaviconUrl(url)}
            aspectRatio={1}
          />

          <div className="pt-2">
            <Button type="submit" variant="gold" fullWidth isLoading={saving}>
              <Save className="w-4 h-4" />
              <span>Enregistrer Identité &amp; Marque</span>
            </Button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4F5F7] text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-[#1D232E] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Diffusion Instantanée</span>
            </div>
            <p>
              Toute modification est sauvegardée dans PostgreSQL (`cms.identity`) et appliquée sans redémarrage sur l’en-tête, le pied de page, les factures et l’icône du navigateur.
            </p>
          </div>
        </div>
      </form>

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
    </div>
  );
}
