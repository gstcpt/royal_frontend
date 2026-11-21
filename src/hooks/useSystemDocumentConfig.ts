'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchApi } from '@/lib/api';

export interface SysVatRate {
  id: string;
  code: string;
  label: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface SysPrefixItem {
  id: string;
  code: string;
  docType: string;
  format: string;
  nextSeq: number;
  preview: string;
  printTemplateCode?: string;
  isActive: boolean;
}

export interface SysPrintTemplate {
  id: string;
  code: string;
  name: string;
  paperFormat: 'A4' | 'A5' | '80mm';
  prefixCode: string;
  headerText: string;
  footerText: string;
  htmlBody: string;
  cssStyles: string;
  showLogo: boolean;
  showTaxBreakdown: boolean;
  showQr: boolean;
  isActive: boolean;
}

export interface SystemDocumentConfig {
  loaded: boolean;
  identity: {
    appName: string;
    companyName: string;
    logoUrl: string;
    phone: string;
    email: string;
    address: string;
  };
  generalSettings: {
    companyName: string;
    taxId: string;
    rcNumber: string;
    phone: string;
    email: string;
    address: string;
    currency: string;
    vatStandard: number;
    vatReduced: number;
    fiscalStamp: number;
    freeShippingThreshold: number;
    defaultShippingFee: number;
    lowStockDefaultAlert: number;
  };
  vatRates: SysVatRate[];
  defaultVatRate: number;
  prefixes: SysPrefixItem[];
  printTemplates: SysPrintTemplate[];
  generateNextRef: (docCode: string, fallbackSeq?: number) => string;
  getTemplateForDoc: (docCode: string) => SysPrintTemplate | undefined;
  refresh: () => Promise<void>;
}

const DEFAULT_SYSTEM_DOC_STATE = {
  identity: {
    appName: 'Royal',
    companyName: 'ROYAL LUXURY LIVING SARL',
    logoUrl: '/images/royal-logo.jpg',
    phone: '48 091 914',
    email: 'royaltn24@gmail.com',
    address: 'Mahdia 5100, Tunisie',
  },
  generalSettings: {
    companyName: 'ROYAL LUXURY LIVING SARL',
    taxId: '1789456/A/M/000',
    rcNumber: 'B0198422023',
    phone: '48 091 914',
    email: 'royaltn24@gmail.com',
    address: 'Mahdia 5100, Tunisie',
    currency: 'TND (Dinar Tunisien)',
    vatStandard: 19,
    vatReduced: 7,
    fiscalStamp: 1.0,
    freeShippingThreshold: 300,
    defaultShippingFee: 12,
    lowStockDefaultAlert: 10,
  },
  vatRates: [
    { id: 'tva-19', code: 'TVA19', label: 'TVA Standard', rate: 19, isDefault: true, isActive: true },
  ] as SysVatRate[],
  prefixes: [] as SysPrefixItem[],
  printTemplates: [] as SysPrintTemplate[],
};

export function formatPrefixReference(prefix: SysPrefixItem | undefined, docCode: string, seqNum: number): string {
  const code = (prefix?.code || docCode).toUpperCase();
  const fmt = prefix?.format || '{PREFIX}-{YYYY}-{SEQ4}';
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = Math.max(1, Number(seqNum || prefix?.nextSeq || 1));

  return fmt
    .replace('{PREFIX}', code)
    .replace('{YYYY}', yyyy)
    .replace('{YY}', yy)
    .replace('{MM}', mm)
    .replace('{DD}', dd)
    .replace('{YYYYMMDD}', `${yyyy}${mm}${dd}`)
    .replace('{SEQ5}', String(seq).padStart(5, '0'))
    .replace('{SEQ4}', String(seq).padStart(4, '0'));
}

export function useSystemDocumentConfig(): SystemDocumentConfig {
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState(DEFAULT_SYSTEM_DOC_STATE);

  const loadAll = useCallback(async () => {
    try {
      const [cfgRes, genRes, tvaRes, prefRes, tplRes] = await Promise.all([
        fetchApi('/storefront-cms/config').catch(() => null),
        fetchApi('/storefront-cms/sys-config/generalSettings').catch(() => null),
        fetchApi('/storefront-cms/sys-config/tva').catch(() => null),
        fetchApi('/storefront-cms/sys-config/prefixes').catch(() => null),
        fetchApi('/storefront-cms/sys-config/printTemplates').catch(() => null),
      ]);

      const cfg = cfgRes?.data || cfgRes || {};
      const genVal = genRes?.value || genRes?.data?.value || {};
      const tvaList = tvaRes?.value || tvaRes?.data?.value || DEFAULT_SYSTEM_DOC_STATE.vatRates;
      const prefList = prefRes?.value || prefRes?.data?.value || [];
      const tplList = tplRes?.value || tplRes?.data?.value || [];

      const idCfg = cfg?.identity || {};
      setState({
        identity: {
          appName: idCfg.appName || DEFAULT_SYSTEM_DOC_STATE.identity.appName,
          companyName: genVal.companyName || idCfg.companyName || DEFAULT_SYSTEM_DOC_STATE.identity.companyName,
          logoUrl: idCfg.logoUrl || DEFAULT_SYSTEM_DOC_STATE.identity.logoUrl,
          phone: genVal.phone || idCfg.phone || DEFAULT_SYSTEM_DOC_STATE.identity.phone,
          email: genVal.email || idCfg.email || DEFAULT_SYSTEM_DOC_STATE.identity.email,
          address: genVal.address || idCfg.address || DEFAULT_SYSTEM_DOC_STATE.identity.address,
        },
        generalSettings: {
          ...DEFAULT_SYSTEM_DOC_STATE.generalSettings,
          ...genVal,
        },
        vatRates: Array.isArray(tvaList) && tvaList.length > 0 ? tvaList : DEFAULT_SYSTEM_DOC_STATE.vatRates,
        prefixes: Array.isArray(prefList) ? prefList : [],
        printTemplates: Array.isArray(tplList) ? tplList : [],
      });
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activeDefaultVat =
    state.vatRates.find((v) => v.isActive && v.isDefault)?.rate ??
    state.vatRates.find((v) => v.isActive)?.rate ??
    Number(state.generalSettings.vatStandard || 19);

  const generateNextRef = useCallback(
    (docCode: string, fallbackSeq = 1) => {
      const upper = docCode.toUpperCase();
      const pref = state.prefixes.find((p) => p.code?.toUpperCase() === upper && p.isActive !== false);
      const seq = pref ? Math.max(Number(pref.nextSeq || 1), Number(fallbackSeq || 1)) : fallbackSeq;
      return formatPrefixReference(pref, upper, seq);
    },
    [state.prefixes]
  );

  const getTemplateForDoc = useCallback(
    (docCode: string) => {
      const upper = docCode.toUpperCase();
      const pref = state.prefixes.find((p) => p.code?.toUpperCase() === upper);
      return (
        state.printTemplates.find((t) => pref?.printTemplateCode && t.code === pref.printTemplateCode && t.isActive !== false) ||
        state.printTemplates.find((t) => t.prefixCode?.toUpperCase() === upper && t.isActive !== false) ||
        state.printTemplates[0]
      );
    },
    [state.prefixes, state.printTemplates]
  );

  return useMemo(
    () => ({
      loaded,
      identity: state.identity,
      generalSettings: state.generalSettings,
      vatRates: state.vatRates,
      defaultVatRate: activeDefaultVat,
      prefixes: state.prefixes,
      printTemplates: state.printTemplates,
      generateNextRef,
      getTemplateForDoc,
      refresh: loadAll,
    }),
    [loaded, state, activeDefaultVat, generateNextRef, getTemplateForDoc, loadAll]
  );
}
