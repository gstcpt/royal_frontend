'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ExternalLink,
  RefreshCw,
  PackageCheck,
  Download,
} from 'lucide-react';
import { fetchAllPaginated } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';
import { Button, Breadcrumb, DataTable, ColumnDef } from '@/components/ui';
import { NINE_ORDER_STATUSES, ORDER_STATUS_LABEL_MAP } from '@/components/common/PrintableOrderSheet';
import { useI18nStore } from '@/stores/i18n.store';

export default function AccountOrdersPage() {
  const { t, locale } = useI18nStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'PAST'>('ALL');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { items: list } = await fetchAllPaginated<any>('/orders/my-orders', 100);
      setOrders(Array.isArray(list) ? list : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (filterTab === 'ACTIVE') {
      return orders.filter((o) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status));
    }
    if (filterTab === 'PAST') {
      return orders.filter((o) => ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status));
    }
    return orders;
  }, [orders, filterTab]);

  const activeCount = orders.filter((o) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length;
  const pastCount = orders.filter((o) => ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length;
  const dateLoc = locale === 'ar' ? 'ar-TN' : 'fr-FR';
  const getStatusText = (status: string) =>
    t(`order_status.${status}`, ORDER_STATUS_LABEL_MAP[status] || status);

  const renderStatus = (status: string) => {
    const label = getStatusText(status);
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> {label}
          </span>
        );
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_SHIPMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Truck className="w-3 h-3" /> {label}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3 h-3" /> {label}
          </span>
        );
    }
  };

  const handleExportSelectedCsv = () => {
    const sel = filteredOrders.filter((o) => selectedOrderIds.includes(o.id));
    if (sel.length === 0) return;
    const csv = [
      [
        t('account.col_reference'),
        t('account.csv_col_date'),
        t('account.col_status'),
        t('account.col_articles'),
        t('account.col_total_ttc'),
      ],
      ...sel.map((o) => [
        o.reference,
        new Date(o.createdAt).toLocaleString(dateLoc),
        getStatusText(o.status),
        (o.items || []).length,
        Number(o.totalAmount || 0).toFixed(3),
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mes_commandes_selection_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'reference',
      header: t('account.col_reference'),
      sortable: true,
      sortValue: (o) => o.reference,
      render: (o) => (
        <div>
          <div className="font-mono font-black text-xs text-neutral-900" dir="ltr">{o.reference}</div>
          <div className="text-[11px] text-neutral-500">
            {new Date(o.createdAt).toLocaleString(dateLoc)}
          </div>
        </div>
      ),
      printRender: (o) => o.reference,
    },
    {
      key: 'items',
      header: t('account.col_articles'),
      render: (o) => (
        <span className="text-xs font-semibold text-neutral-700">
          {(o.items || []).length} {t('account.articles_count_unit')}
        </span>
      ),
      printRender: (o) => `${(o.items || []).length}`,
    },
    {
      key: 'status',
      header: t('account.col_status'),
      sortable: true,
      sortValue: (o) => o.status,
      render: (o) => renderStatus(o.status),
      printRender: (o) => getStatusText(o.status),
    },
    {
      key: 'totalAmount',
      header: t('account.col_total_ttc'),
      sortable: true,
      sortValue: (o) => Number(o.totalAmount || 0),
      className: 'text-end',
      render: (o) => (
        <span className="font-mono font-black text-xs text-neutral-900">
          {formatTndCurrency(Number(o.totalAmount || 0))}
        </span>
      ),
      printRender: (o) => formatTndCurrency(Number(o.totalAmount || 0)),
    },
    {
      key: 'actions',
      header: t('account.col_actions'),
      className: 'text-end no-print',
      render: (o) => (
        <Link
          href={`/order-confirmation/${o.reference}`}
          title={t('account.slip_details')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold hover:bg-[var(--royal-primary-hover)] transition shadow-xs"
        >
          <span>{t('account.slip_short')}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb items={[{ label: t('account.breadcrumb_home'), href: '/dashboard' }, { label: t('account.my_orders') }]} />

      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
              {t('account.my_orders')}
            </h1>
            <p className="text-xs text-neutral-500">
              {t('account.orders_page_subtitle')}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders} className="text-xs shrink-0">
          <RefreshCw className={`h-3.5 w-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`} />
          {t('account.refresh')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-neutral-200 w-fit">
        {[
          { key: 'ALL', label: `${t('account.tab_all')} (${orders.length})` },
          { key: 'ACTIVE', label: `${t('account.tab_active')} (${activeCount})` },
          { key: 'PAST', label: `${t('account.tab_past')} (${pastCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterTab === tab.key
                ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
                : 'text-neutral-600 hover:bg-[#FBF9F4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!loading && filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center space-y-4">
          <ShoppingBag className="h-10 w-10 text-neutral-300 mx-auto" />
          <div className="text-sm font-bold text-neutral-900">
            {t('account.orders_empty')}
          </div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold shadow-xs"
          >
            {t('account.discover_articles')}
          </Link>
        </div>
      ) : (
        <DataTable<any>
          data={filteredOrders}
          columns={columns}
          keyExtractor={(o) => o.id}
          isLoading={loading}
          onRefresh={loadOrders}
          searchPlaceholder={t('account.orders_search_ph')}
          searchKeys={['reference', 'status']}
          supportedModes={['list', 'table', 'matrix']}
          defaultMode="list"
          defaultPageSize={12}
          pageSizeOptions={[6, 12, 24, 48, 96]}
          enableMultiSelect={true}
          selectedKeys={selectedOrderIds}
          onSelectionChange={setSelectedOrderIds}
          renderBulkActions={() => (
            <Button variant="outline" size="sm" onClick={handleExportSelectedCsv}>
              <Download className="w-3.5 h-3.5 me-1.5" />
              <span>{t('account.export_csv_count')} ({selectedOrderIds.length})</span>
            </Button>
          )}
          renderListItem={(order) => {
            const currentIdx = NINE_ORDER_STATUSES.findIndex((s) => s.key === order.status);
            const isCancelled = order.status === 'CANCELLED';
            return (
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-neutral-100">
                  <div className="space-y-0.5">
                    <div className="font-mono font-black text-sm text-neutral-900" dir="ltr">{order.reference}</div>
                    <div className="text-[11px] text-neutral-500">
                      {t('account.placed_on')} {new Date(order.createdAt).toLocaleString(dateLoc)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderStatus(order.status)}
                    <span className="font-mono font-black text-sm text-neutral-900">
                      {formatTndCurrency(Number(order.totalAmount || 0))}
                    </span>
                    <Link
                      href={`/order-confirmation/${order.reference}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold hover:bg-[var(--royal-primary-hover)] transition shadow-xs"
                    >
                      <span>{t('account.slip_details')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
                <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-neutral-200/70">
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                    {NINE_ORDER_STATUSES.map((st, idx) => {
                      const isCancelStep = st.key === 'CANCELLED';
                      const done = isCancelled ? isCancelStep : !isCancelStep && currentIdx >= idx;
                      return (
                        <div key={st.key} className="space-y-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isCancelStep && isCancelled ? 'bg-rose-500' : done ? 'bg-amber-500' : 'bg-neutral-200'
                            }`}
                          />
                          <div
                            className={`text-[10px] font-bold flex items-center gap-1 ${
                              isCancelStep && isCancelled ? 'text-rose-700' : done ? 'text-neutral-900' : 'text-neutral-400'
                            }`}
                          >
                            {done && (
                              <PackageCheck
                                className={`w-3 h-3 shrink-0 ${
                                  isCancelStep && isCancelled ? 'text-rose-600' : 'text-amber-600'
                                }`}
                              />
                            )}
                            <span className="truncate">{st.step}. {t(`order_status.${st.key}`, st.label)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }}
          exportFileName="mes_commandes_royal"
          printTitle={t('account.print_orders_title')}
        />
      )}
    </div>
  );
}
