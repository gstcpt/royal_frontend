'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui';
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

  useEffect(() => {
    Promise.all([
      fetchApi('/storefront-cms/sys-config/generalSettings').catch(() => null),
      fetchApi('/storefront-cms/config').catch(() => null),
      fetchApi('/storefront-cms/sys-config/tva').catch(() => null),
    ]).then(([genRes, cfgRes, tvaRes]) => {
      const gen = genRes?.value || genRes?.data?.value || {};
      const cfg = cfgRes?.data || cfgRes || {};
      const tvaList = tvaRes?.value || tvaRes?.data?.value || [];
      const stdTva = Array.isArray(tvaList) ? tvaList.find((t: any) => t.isDefault) : null;

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
          </div>
        </div>
      </form>
    </div>
  );
}
