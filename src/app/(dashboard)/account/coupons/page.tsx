'use client';

import * as React from 'react';
import { Ticket, Copy, Check, Percent, Truck, DollarSign, Sparkles, Download } from 'lucide-react';
import { Breadcrumb, Badge, Toast, DataTable, ColumnDef, Button } from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';
import { useI18nStore } from '@/stores/i18n.store';

export default function AccountCouponsPage() {
  const { t, locale } = useI18nStore();
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const dateLoc = locale === 'ar' ? 'ar-TN' : 'fr-FR';

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
      [
        t('account.csv_col_code'),
        t('account.csv_col_type'),
        t('account.csv_col_value'),
        t('account.csv_col_min'),
        t('account.col_expiration'),
        t('account.csv_col_desc'),
      ],
      ...sel.map((c) => [
        c.code,
        c.type,
        c.value,
        c.minOrderAmount || 0,
        c.expiresAt ? new Date(c.expiresAt).toLocaleDateString(dateLoc) : t('account.unlimited'),
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
      header: t('account.col_code'),
      sortable: true,
      sortValue: (c) => c.code,
      render: (c) => (
        <code className="px-2.5 py-1 rounded-lg bg-[#F4F5F7] border border-[#E6E1D6] font-mono text-xs font-black text-[#9A7414]" dir="ltr">
          {c.code}
        </code>
      ),
      printRender: (c) => c.code,
    },
    {
      key: 'value',
      header: t('account.col_benefit'),
      render: (c) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] text-[11px] font-bold">
          {c.type === 'PERCENTAGE' && <Percent className="h-3 w-3" />}
          {c.type === 'FREE_SHIPPING' && <Truck className="h-3 w-3" />}
          {c.type === 'FIXED_AMOUNT' && <DollarSign className="h-3 w-3" />}
          {c.type === 'PERCENTAGE'
            ? `-${c.value}%`
            : c.type === 'FREE_SHIPPING'
            ? t('account.free_shipping_benefit')
            : `-${formatTndCurrency(Number(c.value || 0))}`}
        </span>
      ),
      printRender: (c) => (c.type === 'PERCENTAGE' ? `-${c.value}%` : `${c.value}`),
    },
    {
      key: 'description',
      header: t('account.col_conditions'),
      render: (c) => (
        <div className="text-xs text-[#1D232E]">
          <div className="font-semibold">{c.description || `${t('account.exclusive_discount')} ${c.code}`}</div>
          {c.minOrderAmount ? (
            <div className="text-[11px] text-slate-500">
              {t('account.min_prefix')} {formatTndCurrency(Number(c.minOrderAmount))}
            </div>
          ) : null}
        </div>
      ),
      printRender: (c) => c.description || c.code,
    },
    {
      key: 'expiresAt',
      header: t('account.col_expiration'),
      render: (c) => (
        <span className="text-xs text-slate-500">
          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString(dateLoc) : t('account.unlimited')}
        </span>
      ),
      printRender: (c) => (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString(dateLoc) : t('account.unlimited')),
    },
    {
      key: 'actions',
      header: t('account.col_actions'),
      className: 'text-end no-print',
      render: (c) => (
        <button
          type="button"
          onClick={() => handleCopy(c.code)}
          title={t('account.copy_code_title')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
        >
          {copiedCode === c.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedCode === c.code ? t('account.copied_btn') : t('account.copy_btn')}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: t('account.breadcrumb_home'), href: '/account/home' },
          { label: t('account.coupons_crumb') },
        ]}
      />

      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
              {t('account.coupons_title')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('account.coupons_subtitle')}
            </p>
          </div>
        </div>
        <Badge variant="warning" size="md">
          <Sparkles className="h-3.5 w-3.5 me-1 inline" />
          {coupons.length} {t('account.active_offers_count')}
        </Badge>
      </div>

      <DataTable<any>
        data={coupons}
        columns={columns}
        keyExtractor={(c) => c.id}
        isLoading={loading}
        searchPlaceholder={t('account.coupons_search_ph')}
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
            <Download className="h-3.5 w-3.5 me-1.5" />
            <span>{t('account.export_sel_count')} ({selectedIds.length})</span>
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
                      ? t('account.free_shipping_benefit')
                      : `-${formatTndCurrency(Number(c.value || 0))}`}
                  </span>
                  {c.expiresAt && (
                    <span className="text-[10px] font-medium text-slate-400">
                      {t('account.exp_prefix')} {new Date(c.expiresAt).toLocaleDateString(dateLoc)}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-heading font-black text-[#1D232E]">
                  {c.description || `${t('account.exclusive_discount')} ${c.code}`}
                </h3>
                {c.minOrderAmount ? (
                  <p className="text-[11px] text-slate-500">
                    {t('account.min_order_prefix')} <strong className="text-[#1D232E]">{formatTndCurrency(Number(c.minOrderAmount))}</strong>
                  </p>
                ) : null}
              </div>

              <div className="pt-3 border-t border-dashed border-[#E6D6A6] flex items-center justify-between gap-2">
                <code className="px-3 py-2 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] font-mono text-xs font-black text-[#9A7414] tracking-wider" dir="ltr">
                  {c.code}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(c.code)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? t('account.copied_btn') : t('account.copy_btn')}</span>
                </button>
              </div>
            </div>
          );
        }}
        exportFileName="codes_privileges_royal"
        printTitle={t('account.print_coupons_title')}
      />

      {copiedCode && (
        <Toast
          isOpen={true}
          message={t('account.coupon_copied_toast').replace('{code}', copiedCode)}
          type="success"
          onClose={() => setCopiedCode(null)}
        />
      )}
    </div>
  );
}
