'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  CreditCard,
  Banknote,
  Building2,
  Save,
  EyeOff,
  Eye,
  Compass,
  ShieldCheck,
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

const GATEWAYS_GUIDE_STEPS: ViewGuideStep[] = [
  {
    id: 'flouci-setup',
    number: '01',
    title: 'Passerelle Flouci (Wallet & Cartes Bancaires TND)',
    description: 'Configurez votre compte développeur Flouci et gardez la visibilité masquée jusqu’aux tests finaux.',
    platformLabel: 'Ouvrir Portail Flouci Developers',
    platformUrl: 'https://developers.flouci.com',
    fields: [
      {
        label: 'App Token & App Secret',
        example: 'App Token: 9a7f... • Visibilité publique : DÉSACTIVÉE par défaut',
        steps: [
          'Connectez-vous à votre espace marchand Flouci Developers et créez une application pour royal.com.tn.',
          'Collez votre app_token et app_secret ci-contre en mode SANDBOX ou LIVE.',
          'IMPORTANT : Laissez l’interrupteur « Afficher au Checkout Client » DÉSACTIVÉ tant que votre client final n’a pas validé les tests.',
        ],
      },
    ],
  },
  {
    id: 'clictopay-setup',
    number: '02',
    title: 'ClicToPay Monétique Tunisie (SMT)',
    description: 'Intégration officielle Visa / Mastercard / e-Dinar avec contrôle ROOT de visibilité.',
    fields: [
      {
        label: 'Code Marchand & Identifiants',
        example: 'Merchant ID communiqué par votre banque tunisienne',
        steps: [
          'Renseignez le Merchant ID, Login et Mot de passe API fournis après signature du contrat monétique.',
          'Activez la visibilité checkout uniquement lors de la bascule en production sur royal.com.tn.',
        ],
      },
    ],
  },
];

export default function PaymentGatewaysRootPage() {
  const [config, setConfig] = useState({
    flouci: {
      enabled: false,
      isPubliclyVisible: false,
      mode: 'SANDBOX',
      appToken: '',
      appSecret: '',
      label: 'Paiement Mobile & Carte via Flouci (TND)',
      description: 'Réglez instantanément par Wallet Flouci ou carte bancaire tunisienne.',
      successUrl: '/order-confirmation',
      failUrl: '/checkout?paymentError=flouci',
    },
    clictopay: {
      enabled: false,
      isPubliclyVisible: false,
      mode: 'SANDBOX',
      merchantId: '',
      login: '',
      password: '',
      label: 'Carte Bancaire Tunisienne (ClicToPay SMT)',
      description: 'Passerelle officielle monétique tunisienne 3DSecure.',
    },
    codEnabled: true,
    bankTransferEnabled: false,
    bankRib: '',
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/paymentGateways');
      const v = res?.value || res?.data?.value || {};
      setConfig((prev) => ({
        ...prev,
        ...v,
        flouci: { ...prev.flouci, ...(v.flouci || {}) },
        clictopay: { ...prev.clictopay, ...(v.clictopay || {}) },
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/paymentGateways', {
        method: 'PUT',
        body: JSON.stringify({ value: config }),
      });
      setToastMsg({ text: 'Passerelles de paiement et visibilité Checkout sauvegardées.', type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Erreur sauvegarde passerelles.', type: 'error' });
    } finally {
      setSaving(false);
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
              Passerelles de Paiement (Flouci, ClicToPay &amp; Checkout)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
              ROOT ONLY • CONTRÔLE VISIBILITÉ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configurez Flouci et ClicToPay en avance et contrôlez précisément s’ils apparaissent ou restent masqués sur la page Checkout client.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Passerelles Paiement' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowSecrets((s) => !s)}>
            {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showSecrets ? 'Masquer Clés' : 'Afficher Clés'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setGuideIndex(0); setGuideOpen(true); }}>
            <Compass className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Guide API</span>
          </Button>
          <Button variant="gold" size="sm" onClick={() => handleSave()} isLoading={saving}>
            <Save className="w-3.5 h-3.5" />
            <span>Sauvegarder</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E6E1D6] text-center text-xs text-slate-500">
          Chargement des passerelles...
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Flouci Card */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Wallet className="w-4 h-4 text-[#C59B27] shrink-0" />
                <h2 className="text-sm font-bold text-[#1D232E] truncate">01 — Flouci (Wallet &amp; Cartes TND)</h2>
                <GuideInfoButton onClick={() => { setGuideIndex(0); setGuideOpen(true); }} />
              </div>
              <Toggle
                compact
                size="sm"
                checked={config.flouci.enabled}
                onChange={(v) => setConfig({ ...config, flouci: { ...config.flouci, enabled: v } })}
                ariaLabel="Activer Flouci"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#1D232E]">Afficher au Checkout Client</div>
                <div className="text-[11px] text-slate-500">
                  {config.flouci.isPubliclyVisible
                    ? 'Visible par les clients sur /checkout'
                    : 'Masqué au Checkout public (mode préparation ROOT)'}
                </div>
              </div>
              <Toggle
                compact
                size="sm"
                checked={config.flouci.isPubliclyVisible}
                onChange={(v) =>
                  setConfig({ ...config, flouci: { ...config.flouci, isPubliclyVisible: v } })
                }
                ariaLabel="Visibilité Checkout Flouci"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Environnement Flouci"
                value={config.flouci.mode}
                onChange={(e) => setConfig({ ...config, flouci: { ...config.flouci, mode: e.target.value } })}
                options={[
                  { label: 'SANDBOX (Test Développeur)', value: 'SANDBOX' },
                  { label: 'PRODUCTION LIVE (Encaissement réel)', value: 'LIVE' },
                ]}
              />
              <Input
                label="Libellé affiché au client"
                value={config.flouci.label}
                onChange={(e) => setConfig({ ...config, flouci: { ...config.flouci, label: e.target.value } })}
              />
            </div>

            <Input
              label="Flouci App Token"
              type={showSecrets ? 'text' : 'password'}
              placeholder="ex: 8f3a1c2e-..."
              value={config.flouci.appToken}
              onChange={(e) => setConfig({ ...config, flouci: { ...config.flouci, appToken: e.target.value } })}
            />

            <Input
              label="Flouci App Secret"
              type={showSecrets ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={config.flouci.appSecret}
              onChange={(e) => setConfig({ ...config, flouci: { ...config.flouci, appSecret: e.target.value } })}
            />
          </div>

          {/* ClicToPay Card */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 min-w-0">
                <CreditCard className="w-4 h-4 text-[#C59B27] shrink-0" />
                <h2 className="text-sm font-bold text-[#1D232E] truncate">02 — ClicToPay SMT Tunisie</h2>
                <GuideInfoButton onClick={() => { setGuideIndex(1); setGuideOpen(true); }} />
              </div>
              <Toggle
                compact
                size="sm"
                checked={config.clictopay.enabled}
                onChange={(v) => setConfig({ ...config, clictopay: { ...config.clictopay, enabled: v } })}
                ariaLabel="Activer ClicToPay"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#1D232E]">Afficher au Checkout Client</div>
                <div className="text-[11px] text-slate-500">
                  {config.clictopay.isPubliclyVisible
                    ? 'Visible par les clients sur /checkout'
                    : 'Masqué jusqu’à activation contrat banque SMT'}
                </div>
              </div>
              <Toggle
                compact
                size="sm"
                checked={config.clictopay.isPubliclyVisible}
                onChange={(v) =>
                  setConfig({ ...config, clictopay: { ...config.clictopay, isPubliclyVisible: v } })
                }
                ariaLabel="Visibilité Checkout ClicToPay"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Environnement SMT"
                value={config.clictopay.mode}
                onChange={(e) => setConfig({ ...config, clictopay: { ...config.clictopay, mode: e.target.value } })}
                options={[
                  { label: 'SANDBOX (Test)', value: 'SANDBOX' },
                  { label: 'LIVE (Production)', value: 'LIVE' },
                ]}
              />
              <Input
                label="Code Marchand (Merchant ID)"
                placeholder="ex: ROYAL-TN-001"
                value={config.clictopay.merchantId}
                onChange={(e) =>
                  setConfig({ ...config, clictopay: { ...config.clictopay, merchantId: e.target.value } })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Login API SMT"
                type={showSecrets ? 'text' : 'password'}
                value={config.clictopay.login}
                onChange={(e) => setConfig({ ...config, clictopay: { ...config.clictopay, login: e.target.value } })}
              />
              <Input
                label="Mot de Passe API SMT"
                type={showSecrets ? 'text' : 'password'}
                value={config.clictopay.password}
                onChange={(e) =>
                  setConfig({ ...config, clictopay: { ...config.clictopay, password: e.target.value } })
                }
              />
            </div>
          </div>

          {/* Offline / Manual Payment Options */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-[#1D232E]">
                  03 — Moyens Directs Checkout (Espèces COD &amp; Virement Bancaire)
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Banknote className="w-4 h-4 text-emerald-700" />
                  <div>
                    <div className="text-xs font-bold text-[#1D232E]">Paiement à la livraison (Espèces COD)</div>
                    <div className="text-[11px] text-slate-500">Méthode active par défaut pour la Tunisie</div>
                  </div>
                </div>
                <Toggle
                  compact
                  size="sm"
                  checked={config.codEnabled}
                  onChange={(v) => setConfig({ ...config, codEnabled: v })}
                />
              </div>
              <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#C59B27]" />
                    <div className="text-xs font-bold text-[#1D232E]">Virement Bancaire (RIB Société)</div>
                  </div>
                  <Toggle
                    compact
                    size="sm"
                    checked={config.bankTransferEnabled}
                    onChange={(v) => setConfig({ ...config, bankTransferEnabled: v })}
                  />
                </div>
                {config.bankTransferEnabled && (
                  <Input
                    label="RIB Bancaire affiché au client"
                    placeholder="TN59 0800 ..."
                    value={config.bankRib}
                    onChange={(e) => setConfig({ ...config, bankRib: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      <ViewGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Guide Passerelles Paiement Tunisie"
        subtitle="Activation sécurisée Flouci & ClicToPay avec contrôle ROOT du Checkout"
        steps={GATEWAYS_GUIDE_STEPS}
        currentIndex={guideIndex}
        onStepChange={setGuideIndex}
      />
    </div>
  );
}
