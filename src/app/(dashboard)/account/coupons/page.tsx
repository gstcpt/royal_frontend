'use client';

import * as React from 'react';
import { Ticket, Copy, Check, Percent, Truck, DollarSign, Sparkles } from 'lucide-react';
import { Breadcrumb, Badge, Toast } from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';

export default function AccountCouponsPage() {
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchApi('/coupons/public');
        const list = res?.data || (Array.isArray(res) ? res : []);
        setCoupons(list);
      } catch {
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: 'Mon Espace Client', href: '/account/home' },
          { label: 'Mes Codes Privilèges' },
        ]}
      />

      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
              Mes Codes Privilèges &amp; Offres Royal
            </h1>
            <p className="text-xs text-slate-500">
              Copiez un code actif ci-dessous pour l&apos;appliquer directement lors de votre passage en caisse.
            </p>
          </div>
        </div>
        <Badge variant="warning" size="md">
          <Sparkles className="h-3.5 w-3.5 mr-1 inline" />
          {coupons.length} offre(s) active(s)
        </Badge>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white border border-[#E6E1D6] animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E6E1D6] text-center text-xs text-slate-400">
          Aucun code privilège public actif en ce moment. Surveillez vos notifications Royal !
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((c) => {
            const isCopied = copiedCode === c.code;
            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-[#E6D6A6] shadow-xs p-5 flex flex-col justify-between gap-4 hover:shadow-md transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] text-[11px] font-bold">
                      {c.type === 'PERCENTAGE' && <Percent className="h-3 w-3" />}
                      {c.type === 'FREE_SHIPPING' && <Truck className="h-3 w-3" />}
                      {c.type === 'FIXED_AMOUNT' && <DollarSign className="h-3 w-3" />}
                      {c.type === 'PERCENTAGE'
                        ? `-${c.value}%`
                        : c.type === 'FREE_SHIPPING'
                        ? 'Livraison Offerte'
                        : `-${formatTndCurrency(Number(c.value || 0))}`}
                    </span>
                    {c.expiresAt && (
                      <span className="text-[10px] font-medium text-slate-400">
                        Exp: {new Date(c.expiresAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-heading font-black text-[#1D232E]">
                    {c.description || `Remise exclusive ${c.code}`}
                  </h3>
                  {c.minOrderAmount ? (
                    <p className="text-[11px] text-slate-500">
                      Commande minimum : <strong className="text-[#1D232E]">{formatTndCurrency(Number(c.minOrderAmount))}</strong>
                    </p>
                  ) : null}
                </div>

                <div className="pt-3 border-t border-dashed border-[#E6D6A6] flex items-center justify-between gap-2">
                  <code className="px-3 py-2 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] font-mono text-xs font-black text-[#9A7414] tracking-wider">
                    {c.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(c.code)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--royal-primary)] text-white text-xs font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{isCopied ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {copiedCode && (
        <Toast
          isOpen={true}
          message={`Code promo "${copiedCode}" copié dans le presse-papiers !`}
          type="success"
          onClose={() => setCopiedCode(null)}
        />
      )}
    </div>
  );
}
