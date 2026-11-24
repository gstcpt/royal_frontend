'use client';

import * as React from 'react';
import { Ticket, Copy, Check, Percent, Truck, DollarSign, Sparkles, Download } from 'lucide-react';
import { Breadcrumb, Badge, Toast, DataTable, ColumnDef, Button } from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';

export default function AccountCouponsPage() {
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

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

  const handleBulkExportCsv = () => {
    const sel = coupons.filter((c) => selectedIds.includes(c.id));
    if (sel.length === 0) return;
    const csv = [
      ['Code', 'Type', 'Valeur', 'Minimum TND', 'Expiration', 'Description'],
      ...sel.map((c) => [
        c.code,
        c.type,
        c.value,
        c.minOrderAmount || 0,
        c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fr-FR') : 'Sans limite',
        `"${String(c.description || '').replace(/"/g, '""')}"`,
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mes_codes_privileges_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'code',
      header: 'Code Privilège',
      sortable: true,
      sortValue: (c) => c.code,
      render: (c) => (
        <code className="px-2.5 py-1 rounded-lg bg-[#F4F5F7] border border-[#E6E1D6] font-mono text-xs font-black text-[#9A7414]">
          {c.code}
        </code>
      ),
      printRender: (c) => c.code,
    },
    {
      key: 'value',
      header: 'Avantage',
      render: (c) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] text-[11px] font-bold">
          {c.type === 'PERCENTAGE' && <Percent className="h-3 w-3" />}
          {c.type === 'FREE_SHIPPING' && <Truck className="h-3 w-3" />}
          {c.type === 'FIXED_AMOUNT' && <DollarSign className="h-3 w-3" />}
          {c.type === 'PERCENTAGE'
            ? `-${c.value}%`
            : c.type === 'FREE_SHIPPING'
            ? 'Livraison Offerte'
            : `-${formatTndCurrency(Number(c.value || 0))}`}
        </span>
      ),
      printRender: (c) => (c.type === 'PERCENTAGE' ? `-${c.value}%` : `${c.value}`),
    },
    {
      key: 'description',
      header: 'Conditions',
      render: (c) => (
        <div className="text-xs text-[#1D232E]">
          <div className="font-semibold">{c.description || `Remise exclusive ${c.code}`}</div>
          {c.minOrderAmount ? (
            <div className="text-[11px] text-slate-500">Min: {formatTndCurrency(Number(c.minOrderAmount))}</div>
          ) : null}
        </div>
      ),
      printRender: (c) => c.description || c.code,
    },
    {
      key: 'expiresAt',
      header: 'Expiration',
      render: (c) => (
        <span className="text-xs text-slate-500">
          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fr-FR') : 'Illimité'}
        </span>
      ),
      printRender: (c) => (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fr-FR') : 'Illimité'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (c) => (
        <button
          type="button"
          onClick={() => handleCopy(c.code)}
          title="Copier le code"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--royal-primary)] text-white text-xs font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
        >
          {copiedCode === c.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedCode === c.code ? 'Copié' : 'Copier'}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: 'Mon Espace Client', href: '/account/home' },
          { label: 'Mes Codes Privilèges' },
        ]}
      />

      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm flex items-center justify-between flex-wrap gap-4">
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

      <DataTable<any>
        data={coupons}
        columns={columns}
        keyExtractor={(c) => c.id}
        isLoading={loading}
        searchPlaceholder="Rechercher un code ou offre..."
        searchKeys={['code', 'description']}
        supportedModes={['matrix', 'table', 'list']}
        defaultMode="matrix"
        defaultPageSize={12}
        pageSizeOptions={[6, 12, 24, 48, 96]}
        enableMultiSelect={true}
        selectedKeys={selectedIds}
        onSelectionChange={setSelectedIds}
        renderBulkActions={() => (
          <Button variant="outline" size="sm" onClick={handleBulkExportCsv}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>Exporter sélection ({selectedIds.length})</span>
          </Button>
        )}
        renderMatrixCard={(c) => {
          const isCopied = copiedCode === c.code;
          return (
            <div className="bg-white rounded-3xl border border-[#E6D6A6] shadow-xs p-5 flex flex-col justify-between gap-4 h-full">
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
        }}
        exportFileName="codes_privileges_royal"
        printTitle="Mes Codes Privilèges — Royal"
      />

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
