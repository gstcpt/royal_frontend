'use client';

import * as React from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Percent,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';
import {
  DataTable,
  ColumnDef,
  Badge,
  Breadcrumb,
} from '@/components/ui';
import {
  RoyalStackedBarChart,
  RoyalAreaTrendChart,
  RoyalDonutChart,
  RoyalGaugeChart,
  RoyalSegmentedBarsChart,
} from '@/components/dashboard/RoyalChartsSuite';

interface SalesMetricItem {
  id: string;
  articleName: string;
  categoryName: string;
  unitsSold: number;
  totalCostPrice: number; // Coût d'achat total HT
  totalGrossSales: number; // CA Brut HT
  totalNetSales: number; // CA Net HT (après remises/promos)
  totalTtcSales: number; // CA TTC encaissé
  marginAmount: number; // Marge Brute = CA Net HT - Coût d'achat
  marginPercentage: number; // Marge en %
}

export default function SalesReportPage() {
  const [sales, setSales] = React.useState<SalesMetricItem[]>([]);
  const [monthlyTrend, setMonthlyTrend] = React.useState<Array<{ label: string; value: number; secondaryValue?: number }>>([]);
  const [deltaLabel, setDeltaLabel] = React.useState<string>('0.0% vs M-1');
  const [categoryBreakdown, setCategoryBreakdown] = React.useState<Array<{ label: string; value: number }>>([]);
  const [selectedSaleIds, setSelectedSaleIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchApi('/storefront-cms/sales-report')
      .then((res) => {
        const payload = res?.items || res?.monthlyTrend ? res : res?.data || res;
        const list = Array.isArray(payload) ? payload : payload?.items || [];
        setSales(Array.isArray(list) ? list : []);
        if (Array.isArray(payload?.monthlyTrend)) setMonthlyTrend(payload.monthlyTrend);
        if (typeof payload?.deltaLabel === 'string') setDeltaLabel(payload.deltaLabel);
        if (Array.isArray(payload?.categoryBreakdown)) setCategoryBreakdown(payload.categoryBreakdown);
      })
      .catch(() => {
        setSales([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const columns: ColumnDef<SalesMetricItem>[] = [
    {
      key: 'articleName',
      header: 'Article & Catégorie',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-neutral-400" />
            <span>{item.articleName}</span>
          </div>
          <div className="text-[11px] text-neutral-500">{item.categoryName}</div>
        </div>
      ),
    },
    {
      key: 'unitsSold',
      header: 'Volume Vendu',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-bold text-neutral-900 font-mono">
          {item.unitsSold} unités
        </span>
      ),
    },
    {
      key: 'totalCostPrice',
      header: 'Coût d’Achat HT',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-neutral-600 font-mono">
          {formatTndCurrency(item.totalCostPrice)}
        </span>
      ),
    },
    {
      key: 'totalNetSales',
      header: 'CA Net HT',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-bold text-neutral-900 font-mono">
          {formatTndCurrency(item.totalNetSales)}
        </span>
      ),
    },
    {
      key: 'totalTtcSales',
      header: 'CA Facturé TTC',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-black text-neutral-900 font-mono">
          {formatTndCurrency(item.totalTtcSales)}
        </span>
      ),
    },
    {
      key: 'marginAmount',
      header: 'Marge / Bénéfice Net',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-emerald-700 font-mono flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            <span>+{formatTndCurrency(item.marginAmount)}</span>
          </div>
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-mono">
            {item.marginPercentage}% de rentabilité
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
              Analyse des Ventes, Marges &amp; Rentabilité
            </h1>
            <p className="text-xs text-neutral-500">
              Décomposition financière des ventes HT/TTC, remises et marges bénéficiaires.
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Rapports et statistiques', href: '/dashboard/section/reports' },
              { label: 'Ventes et marges' },
            ]}
          />
        </div>
      </div>

      {/* 1. Number KPI Cards First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-[#E6E1D6] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Volume Unités Vendues</span>
            <Package className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="text-2xl font-black text-[#1D232E] font-mono">
            {sales.reduce((a, s) => a + s.unitsSold, 0)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E6E1D6] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>CA Net HT</span>
            <DollarSign className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="text-2xl font-black text-[#1D232E] font-mono">
            {formatTndCurrency(sales.reduce((a, s) => a + s.totalNetSales, 0))}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E6E1D6] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Marge Bénéficiaire Nette</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {formatTndCurrency(sales.reduce((a, s) => a + s.marginAmount, 0))}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E6E1D6] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#9A7414]">
            <span>Taux de Marge Moyen</span>
            <Percent className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="text-2xl font-black text-[#9A7414] font-mono">
            {(sales.reduce((a, s) => a + s.marginPercentage, 0) / Math.max(1, sales.length)).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 2. Maximum Varied Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 no-print">
        <div className="lg:col-span-6">
          <RoyalStackedBarChart
            title="Décomposition CA par Article : Coût d'Achat vs Marge Brute"
            subtitle="Comparaison directe de rentabilité HT (TND)"
            primaryLabel="Marge Nette"
            secondaryLabel="Coût Achat"
            unit="TND"
            data={sales.map((s) => ({
              label: s.articleName.split(' ').slice(0, 2).join(' '),
              primary: Math.round(s.marginAmount),
              secondary: Math.round(s.totalCostPrice),
            }))}
          />
        </div>
        <div className="lg:col-span-6">
          <RoyalAreaTrendChart
            title="Dynamique Ventes & Marge Commerciale"
            subtitle="Progression mensuelle réelle (TND)"
            headlineValue={formatTndCurrency(sales.reduce((a, s) => a + s.totalTtcSales, 0))}
            deltaLabel={deltaLabel}
            seriesName="CA TTC"
            secondarySeriesName="Marge HT"
            points={monthlyTrend}
          />
        </div>
        <div className="lg:col-span-4">
          <RoyalDonutChart
            title="Contribution par Catégorie"
            subtitle="Part du chiffre d'affaires HT"
            centerLabel="CA Net"
            centerValue={formatTndCurrency(sales.reduce((a, s) => a + s.totalNetSales, 0))}
            slices={categoryBreakdown}
          />
        </div>
        <div className="lg:col-span-3">
          <RoyalGaugeChart
            title="Score Rentabilité Globale"
            subtitle="Taux de marge net moyen (%)"
            score={
              sales.length > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round(sales.reduce((a, s) => a + s.marginPercentage, 0) / sales.length),
                    ),
                  )
                : 0
            }
            statusText={
              sales.length > 0
                ? `Marge moyenne calculée sur ${sales.length} article(s) vendu(s).`
                : 'Aucune vente enregistrée sur la période.'
            }
          />
        </div>
        <div className="lg:col-span-5">
          <RoyalSegmentedBarsChart
            title="Indice de Performance par Article"
            subtitle="Taux de marge bénéficiaire (%)"
            items={sales.map((s) => ({
              label: s.articleName,
              value: Math.round(s.marginPercentage),
              maxValue: 100,
              unit: '%',
            }))}
          />
        </div>
      </div>

      <DataTable
        data={sales}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        enableMultiSelect={true}
        selectedKeys={selectedSaleIds}
        onSelectionChange={setSelectedSaleIds}
        renderBulkActions={() => (
          <button
            type="button"
            onClick={() => {
              const sel = sales.filter((s) => selectedSaleIds.includes(s.id));
              const csv = [
                ['Article', 'Catégorie', 'Unités', 'CA Net HT', 'CA TTC', 'Marge TND', 'Marge %'],
                ...sel.map((s) => [
                  `"${s.articleName.replace(/"/g, '""')}"`,
                  `"${s.categoryName.replace(/"/g, '""')}"`,
                  s.unitsSold,
                  s.totalNetSales,
                  s.totalTtcSales,
                  s.marginAmount,
                  s.marginPercentage,
                ]),
              ]
                .map((r) => r.join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ventes_selection_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold transition cursor-pointer"
          >
            Exporter CSV sélection ({selectedSaleIds.length})
          </button>
        )}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['articleName', 'categoryName']}
        exportFileName="ventes_marges_royal"
        printTitle="Analyse des Ventes et Marges Royal"
      />
    </div>
  );
}
