'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  Percent,
  Truck,
  ShieldCheck,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Bell,
  CheckCircle2,
  KeyRound,
  Boxes,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Button, Breadcrumb, Toast, Toggle } from '@/components/ui';
import { fetchApi } from '@/lib/api';

export default function SettingsPage() {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState('ROYAL LUXURY LIVING SARL');
  const [taxId, setTaxId] = useState('1789456/A/M/000');
  const [rcNumber, setRcNumber] = useState('B0198422023');
  const [phone, setPhone] = useState('48 091 914');
  const [email, setEmail] = useState('royaltn24@gmail.com');
  const [address, setAddress] = useState('Mahdia 5100, Tunisie');

  const [currency, setCurrency] = useState('TND (Dinar Tunisien)');
  const [vatStandard, setVatStandard] = useState(19);
  const [vatReduced, setVatReduced] = useState(7);
  const [fiscalStamp, setFiscalStamp] = useState(1.0);

  const [freeShippingThreshold, setFreeShippingThreshold] = useState(300);
  const [defaultShippingFee, setDefaultShippingFee] = useState(12);
  const [lowStockDefaultAlert, setLowStockDefaultAlert] = useState(10);

  // Go-Live & Operations Dynamic Controls
  const [canonicalBaseUrl, setCanonicalBaseUrl] = useState('');
  const [forceHttps, setForceHttps] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Notre boutique est momentanément en maintenance technique. Merci de votre patience.',
  );
  const [deliveryCompaniesEnabled, setDeliveryCompaniesEnabled] = useState(true);

  const [liveStatus, setLiveStatus] = useState({
    smtpReady: false,
    smtpHost: '',
    onlinePaymentReady: false,
    pixelsReadyCount: 0,
    aiReady: false,
    deliveryCompaniesCount: 0,
  });

  useEffect(() => {
    Promise.all([
      fetchApi('/storefront-cms/sys-config/generalSettings').catch(() => null),
      fetchApi('/storefront-cms/config').catch(() => null),
      fetchApi('/storefront-cms/sys-config/tva').catch(() => null),
      fetchApi('/storefront-cms/sys-config/smtp').catch(() => null),
      fetchApi('/storefront-cms/sys-config/paymentGateways').catch(() => null),
      fetchApi('/storefront-cms/sys-config/marketingPixels').catch(() => null),
      fetchApi('/storefront-cms/sys-config/aiProvider').catch(() => null),
      fetchApi('/deliveries/companies').catch(() => []),
    ]).then(([genRes, cfgRes, tvaRes, smtpRes, payRes, pixRes, aiRes, companiesRes]) => {
      const gen = genRes?.value || genRes?.data?.value || {};
      const cfg = cfgRes?.data || cfgRes || {};
      const tvaList = tvaRes?.value || tvaRes?.data?.value || [];
      const stdTva = Array.isArray(tvaList) ? tvaList.find((t: any) => t.isDefault) : null;
      const smtp = smtpRes?.value || smtpRes?.data?.value || {};
      const pay = payRes?.value || payRes?.data?.value || {};
      const pix = pixRes?.value || pixRes?.data?.value || {};
      const ai = aiRes?.value || aiRes?.data?.value || {};
      const companiesList = Array.isArray(companiesRes) ? companiesRes : companiesRes?.data || [];

      if (gen.companyName || cfg.identity?.companyName) setCompanyName(gen.companyName || cfg.identity.companyName);
      if (gen.taxId) setTaxId(gen.taxId);
      if (gen.rcNumber) setRcNumber(gen.rcNumber);
      if (gen.phone || cfg.identity?.phone) setPhone(gen.phone || cfg.identity.phone);
      if (gen.email || cfg.identity?.email) setEmail(gen.email || cfg.identity.email);
      if (gen.address || cfg.identity?.address) setAddress(gen.address || cfg.identity.address);
      if (gen.currency) setCurrency(gen.currency);
      if (stdTva?.rate !== undefined) setVatStandard(Number(stdTva.rate));
      else if (gen.vatStandard !== undefined) setVatStandard(Number(gen.vatStandard));
      if (gen.vatReduced !== undefined) setVatReduced(Number(gen.vatReduced));
      if (gen.fiscalStamp !== undefined) setFiscalStamp(Number(gen.fiscalStamp));
      if (cfg.freeShippingThreshold !== undefined) setFreeShippingThreshold(Number(cfg.freeShippingThreshold));
      else if (gen.freeShippingThreshold !== undefined) setFreeShippingThreshold(Number(gen.freeShippingThreshold));
      if (cfg.standardShippingFee !== undefined) setDefaultShippingFee(Number(cfg.standardShippingFee));
      else if (gen.defaultShippingFee !== undefined) setDefaultShippingFee(Number(gen.defaultShippingFee));
      if (gen.lowStockDefaultAlert !== undefined) setLowStockDefaultAlert(Number(gen.lowStockDefaultAlert));

      const domainVal = gen.canonicalBaseUrl || pix.canonicalBaseUrl || '';
      if (domainVal) setCanonicalBaseUrl(String(domainVal));
      if (typeof gen.forceHttps === 'boolean') setForceHttps(gen.forceHttps);
      if (typeof gen.maintenanceMode === 'boolean') setMaintenanceMode(gen.maintenanceMode);
      if (gen.maintenanceMessage) setMaintenanceMessage(String(gen.maintenanceMessage));
      if (typeof gen.deliveryCompaniesEnabled === 'boolean') setDeliveryCompaniesEnabled(gen.deliveryCompaniesEnabled);
      else if (typeof gen.deliveryFleetEnabled === 'boolean') setDeliveryCompaniesEnabled(gen.deliveryFleetEnabled);

      const pixActiveCount = [
        pix.metaPixelId,
        pix.tiktokPixelId,
        pix.ga4MeasurementId,
        pix.gtmContainerId,
        pix.snapPixelId,
      ].filter((id) => String(id || '').trim().length > 0).length;

      const activeCompaniesCount = (Array.isArray(companiesList) ? companiesList : []).filter(
        (c: any) => c?.isActive !== false,
      ).length;

      setLiveStatus({
        smtpReady: Boolean(smtp?.host && (smtp?.user || smtp?.fromEmail)),
        smtpHost: String(smtp?.host || ''),
        onlinePaymentReady: Boolean(
          (pay?.flouci?.enabled && pay?.flouci?.appToken) ||
            (pay?.clictopay?.enabled && pay?.clictopay?.merchantId),
        ),
        pixelsReadyCount: pixActiveCount,
        aiReady: Boolean(ai?.enabled && (ai?.geminiApiKey || ai?.groqApiKey)),
        deliveryCompaniesCount: activeCompaniesCount,
      });
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        fetchApi('/storefront-cms/sys-config/generalSettings', {
          method: 'PUT',
          body: JSON.stringify({
            value: {
              companyName,
              taxId,
              rcNumber,
              phone,
              email,
              address,
              currency,
              vatStandard,
              vatReduced,
              fiscalStamp,
              freeShippingThreshold,
              defaultShippingFee,
              lowStockDefaultAlert,
              canonicalBaseUrl: canonicalBaseUrl.trim(),
              forceHttps,
              maintenanceMode,
              maintenanceMessage: maintenanceMessage.trim(),
              deliveryCompaniesEnabled,
            },
          }),
        }),
        fetchApi('/storefront-cms/cms/identity', {
          method: 'PATCH',
          body: JSON.stringify({ companyName, taxId, rcNumber, phone, email, address }),
        }).catch(() => null),
        fetchApi('/storefront-cms/shipping-config', {
          method: 'PATCH',
          body: JSON.stringify({
            freeShippingThreshold: Number(freeShippingThreshold),
            standardShippingFee: Number(defaultShippingFee),
          }),
        }).catch(() => null),
      ]);
      setFeedbackMessage('Paramètres généraux sauvegardés en base et propagés aux documents.');
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[1720px] mx-auto space-y-6">
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage || ''}
        type="success"
        onClose={() => setFeedbackMessage(null)}
      />

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5" />
              </span>
              <span>Paramètres Généraux de la Plateforme</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Informations légales, paramètres fiscaux tunisiens et seuils e-commerce.
            </p>
          </div>
          <Button
            variant="gold"
            disabled={saving}
            onClick={handleSave}
            className="text-xs px-5 py-2.5 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer les Modifications'}</span>
          </Button>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Paramètres généraux' },
            ]}
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Section 1: Identité de la Société */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Building2 className="w-4 h-4 text-amber-600" />
            <h3 className="font-heading font-bold text-sm text-neutral-900">
              Identité Juridique & Siège Social
            </h3>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Raison Sociale Légale
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Matricule Fiscal (MF)
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-neutral-900"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Registre de Commerce (RC)
              </label>
              <input
                type="text"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Téléphone Standard / Support
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Email Officiel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Adresse du Siège Social
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900"
            />
          </div>
        </div>

        {/* Section 2: Fiscalité & Monnaie */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Percent className="w-4 h-4 text-amber-600" />
            <h3 className="font-heading font-bold text-sm text-neutral-900">
              Paramètres Fiscaux & Monétaires
            </h3>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Devise Principale du Système
            </label>
            <input
              type="text"
              disabled
              value={currency}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Taux TVA Normal (%)
              </label>
              <input
                type="number"
                value={vatStandard}
                onChange={(e) => setVatStandard(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-neutral-900"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Taux TVA Réduit (%)
              </label>
              <input
                type="number"
                value={vatReduced}
                onChange={(e) => setVatReduced(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-neutral-900"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Timbre Fiscal (DT)
              </label>
              <input
                type="number"
                step="0.1"
                value={fiscalStamp}
                onChange={(e) => setFiscalStamp(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-neutral-900"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <h4 className="font-bold text-neutral-900 mb-2">Seuils E-Commerce & Livraison</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Livraison Gratuite à partir de (DT)
                </label>
                <input
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-neutral-900"
                />
              </div>
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Frais de Port Standard (DT)
                </label>
                <input
                  type="number"
                  value={defaultShippingFee}
                  onChange={(e) => setDefaultShippingFee(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-neutral-900"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="font-semibold text-neutral-700 block mb-1">
                Seuil d&apos;Alerte Stock Faible par Défaut (Unités)
              </label>
              <input
                type="number"
                min={0}
                value={lowStockDefaultAlert}
                onChange={(e) => setLowStockDefaultAlert(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Domaine Production, SSL & Exploitation (Go-Live) */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Globe className="w-4 h-4 text-amber-600" />
            <h3 className="font-heading font-bold text-sm text-neutral-900">
              Domaine Commercial, HTTPS &amp; Opérations
            </h3>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              URL Canonique / Domaine de Production (Synchronisée avec SEO Pixels)
            </label>
            <input
              type="url"
              value={canonicalBaseUrl}
              onChange={(e) => setCanonicalBaseUrl(e.target.value)}
              placeholder="https://royal-electro.tn"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-neutral-900">Forcer HTTPS (SSL)</p>
                <p className="text-[11px] text-neutral-500">Actif dès liaison domaine TLS</p>
              </div>
              <Toggle compact size="sm" checked={forceHttps} onChange={setForceHttps} ariaLabel="Forcer HTTPS" />
            </div>

            <div className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-neutral-900">Transporteurs &amp; Tarifs Checkout</p>
                <p className="text-[11px] text-neutral-500">Sociétés actives + retrait showroom auto-transfert</p>
              </div>
              <Toggle
                compact
                size="sm"
                checked={deliveryCompaniesEnabled}
                onChange={setDeliveryCompaniesEnabled}
                ariaLabel="Activer Transporteurs Checkout"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-neutral-900">Mode Maintenance Vitrine</p>
                <p className="text-[11px] text-neutral-500">Affiche un avis aux acheteurs publics tout en gardant le dashboard ouvert</p>
              </div>
              <Toggle
                compact
                size="sm"
                checked={maintenanceMode}
                onChange={setMaintenanceMode}
                ariaLabel="Mode Maintenance Vitrine"
              />
            </div>
            {maintenanceMode && (
              <input
                type="text"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900"
                placeholder="Message de maintenance affiché..."
              />
            )}
          </div>
        </div>

        {/* Section 4: Centre Dynamique de Paramétrage Système & Sécurité (Go-Live) */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <h3 className="font-heading font-bold text-sm text-neutral-900">
              Centre de Pilotage Système (Go-Live &amp; Sécurité)
            </h3>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/dashboard/root/smtp"
              className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4] transition"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B8860B]" />
                <div>
                  <div className="font-bold text-neutral-900">Relais SMTP Transactionnel</div>
                  <div className="text-[11px] text-neutral-500">
                    {liveStatus.smtpReady ? `Configuré (${liveStatus.smtpHost})` : 'Serveur & identifiants e-mail'}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${liveStatus.smtpReady ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {liveStatus.smtpReady ? 'Configuré ✓' : 'À vérifier'}
              </span>
            </Link>

            <Link
              href="/dashboard/payment-methods"
              className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4] transition"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-[#B8860B]" />
                <div>
                  <div className="font-bold text-neutral-900">Passerelles ClicToPay &amp; Flouci</div>
                  <div className="text-[11px] text-neutral-500">Clés marchandes &amp; activation Checkout</div>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${liveStatus.onlinePaymentReady ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
                {liveStatus.onlinePaymentReady ? 'Actif ✓' : 'COD / POS actif'}
              </span>
            </Link>

            <Link
              href="/dashboard/seo/pixels"
              className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4] transition"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#B8860B]" />
                <div>
                  <div className="font-bold text-neutral-900">Pixels Marketing &amp; Google Search Console</div>
                  <div className="text-[11px] text-neutral-500">Meta, TikTok, GA4, GTM, Snap &amp; domaine canonique</div>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${liveStatus.pixelsReadyCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {liveStatus.pixelsReadyCount} pixel(s) configuré(s)
              </span>
            </Link>

            <Link
              href="/dashboard/delivery-companies"
              className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4] transition"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#B8860B]" />
                <div>
                  <div className="font-bold text-neutral-900">Sociétés de Livraison &amp; Règles Transfert</div>
                  <div className="text-[11px] text-neutral-500">Tarifs Distance / Poids / Fixe &amp; réassort Showroom</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                {liveStatus.deliveryCompaniesCount} société(s) <ExternalLink className="w-3 h-3" />
              </span>
            </Link>

            <Link
              href="/dashboard/users"
              className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4] transition"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-[#B8860B]" />
                <div>
                  <div className="font-bold text-neutral-900">Sécurité &amp; Rotation des Mots de Passe</div>
                  <div className="text-[11px] text-neutral-500">Mettre à jour / réinitialiser les comptes initiaux avant ouverture</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                Gérer comptes <ExternalLink className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
