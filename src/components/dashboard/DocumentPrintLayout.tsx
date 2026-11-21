'use client';

import React from 'react';
import { QrCode, ShieldCheck } from 'lucide-react';
import { useSystemDocumentConfig } from '@/hooks/useSystemDocumentConfig';
import { getSafeImageUrl } from '@/lib/cart-session';

interface DocumentPrintHeaderProps {
  docCode: string;
  docTitle: string;
  reference: string;
  date?: string;
  status?: string;
}

export function DocumentPrintHeader({
  docCode,
  docTitle,
  reference,
  date,
  status,
}: DocumentPrintHeaderProps) {
  const sys = useSystemDocumentConfig();
  const tpl = sys.getTemplateForDoc(docCode);
  const showLogo = tpl ? tpl.showLogo !== false : true;
  const paperFormat = tpl?.paperFormat || 'A4';
  const companyName = sys.generalSettings.companyName || sys.identity.companyName || 'ROYAL LUXURY LIVING SARL';

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      style={{ borderTop: '4px solid var(--royal-primary, #C59B27)' }}
      data-doc-code={docCode}
      data-paper-format={paperFormat}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        {showLogo && (
          <img
            src={getSafeImageUrl(sys.identity.logoUrl) || '/images/royal-logo.jpg'}
            alt={companyName}
            className="w-12 h-12 rounded-xl object-cover border border-[#E6D6A6] bg-white shrink-0"
          />
        )}
        <div className="min-w-0 space-y-0.5">
          <div className="text-sm font-heading font-black text-[#1D232E] tracking-tight">
            {companyName}
          </div>
          <div className="text-[11px] text-slate-600">{sys.identity.address}</div>
          <div className="text-[11px] text-slate-500">
            Tél : {sys.identity.phone} • Email : {sys.identity.email}
          </div>
          <div className="text-[11px] font-mono font-bold text-[#9A7414] flex flex-wrap gap-3 pt-0.5">
            <span>MF : {sys.generalSettings.taxId}</span>
            <span>RC : {sys.generalSettings.rcNumber}</span>
          </div>
          {tpl?.headerText && (
            <div className="text-[10px] font-semibold text-slate-500 italic pt-0.5">
              {tpl.headerText}
            </div>
          )}
        </div>
      </div>

      <div className="sm:text-right shrink-0 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white border border-[#E6D6A6] text-[#9A7414]">
          <span>{docTitle}</span>
          <span className="text-slate-400">•</span>
          <span>{paperFormat}</span>
        </div>
        <div className="text-base font-mono font-black text-[#1D232E]">{reference}</div>
        {date && (
          <div className="text-[11px] text-slate-500">
            Émis le {new Date(date).toLocaleDateString('fr-FR')}
          </div>
        )}
        {status && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Statut : {status}
          </div>
        )}
      </div>
    </div>
  );
}

interface DocumentPrintFooterProps {
  docCode: string;
  reference: string;
  showTaxNotice?: boolean;
}

export function DocumentPrintFooter({
  docCode,
  reference,
  showTaxNotice = true,
}: DocumentPrintFooterProps) {
  const sys = useSystemDocumentConfig();
  const tpl = sys.getTemplateForDoc(docCode);
  const showQr = tpl ? tpl.showQr !== false : true;
  const showTax = tpl ? tpl.showTaxBreakdown : showTaxNotice;

  return (
    <div
      className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-slate-600"
      data-footer-code={docCode}
    >
      <div className="space-y-1">
        <div className="font-bold text-[#1D232E] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C59B27]" />
          <span>{tpl?.footerText || 'Document certifié conforme — Système Royal ERP'}</span>
        </div>
        {showTax && (
          <div className="font-mono text-[10px] text-slate-500">
            TVA Standard applicable : {sys.defaultVatRate}% • Droit de Timbre Fiscal :{' '}
            {Number(sys.generalSettings.fiscalStamp ?? 1).toFixed(3)} DT • Préfixe {docCode.toUpperCase()}
          </div>
        )}
      </div>

      {showQr && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E6E1D6] shrink-0">
          <QrCode className="w-6 h-6 text-[#1D232E]" />
          <div className="text-[10px] leading-tight font-mono">
            <div className="font-bold text-[#1D232E]">{reference}</div>
            <div className="text-slate-400">Vérifié ERP ({tpl?.paperFormat || 'A4'})</div>
          </div>
        </div>
      )}
    </div>
  );
}
