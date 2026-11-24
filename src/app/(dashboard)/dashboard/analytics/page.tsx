'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  ShoppingBag,
  Percent,
  Calendar,
  Globe,
  Share2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useAiAssistant } from '@/providers/AiAssistantProvider';
import { Printer } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';
import {
  RoyalStackedBarChart,
  RoyalAreaTrendChart,
  RoyalDonutChart,
  RoyalGaugeChart,
  RoyalSegmentedBarsChart,
  RoyalHorizontalBarsChart,
} from '@/components/dashboard/RoyalChartsSuite';

export interface TrafficRow {
  id: string;
  pagePath: string;
  pageTitle: string;
  viewsCount: number;
  uniqueVisitors: number;
  avgTimeSeconds: number;
  bounceRatePercent: number;
  conversionRatePercent: number;
  createdAt: string;
}

export default function AnalyticsPage() {
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<{
    totalViews: number;
    totalVisitors: number;
    avgBounce: number;
    avgConversion: number;
  } | null>(null);
  const [analyticsCharts, setAnalyticsCharts] = useState<{
    dailyMomentum?: Array<{ label: string; value: number; secondaryValue?: number }>;
    acquisitionChannels?: Array<{ label: string; value: number; color?: string }>;
    deviceMonthlySegments?: Array<{ label: string; primary: number; secondary: number; tertiary?: number }>;
    conversionFunnel?: Array<{ label: string; value: number; unit?: string }>;
  } | null>(null);
  const [selectedTrafficIds, setSelectedTrafficIds] = useState<string[]>([]);
  const { isRecapEnabled, runAiJob } = useAiAssistant();
  const [aiInsights, setAiInsights] = useState<{
    headline?: string;
    summary?: string;
    recommendations?: Array<{ title: string; impact: string; action: string }>;
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      if (!isRecapEnabled('analytics')) {
        setAiError('Les conseils IA Analytics sont désactivés dans Système > Intelligence Artificielle.');
        return;
      }
      const res = await runAiJob({
        mode: 'ANALYTICS_INSIGHT',
        title: 'Analyse IA — Trafic & Conversion Analytics',
        subtitle: 'Failover automatique Worker 1 ↔ Worker 2',
        payload: {
          ...stats,
          topPages: traffic.slice(0, 5).map((r) => ({
            path: r.pagePath,
            views: r.viewsCount,
            conv: r.conversionRatePercent,
          })),
        },
      });
      if (res) {
        setAiInsights(res?.data || res);
      }
    } catch (err: any) {
      setAiError(err?.message || 'Activez un fournisseur IA gratuit (Gemini / Groq) dans Système > IA.');
    } finally {
      setLoadingAi(false);
    }
  };

  React.useEffect(() => {
    fetchApi('/storefront-cms/analytics-report')
      .then((res) => {
        const payload = res?.items || res?.charts ? res : res?.data || res;
        const list = Array.isArray(payload) ? payload : payload?.items || [];
        setTraffic(Array.isArray(list) ? list : []);
        if (payload?.summary) setAnalyticsSummary(payload.summary);
        if (payload?.charts) setAnalyticsCharts(payload.charts);
      })
      .catch(() => {
        setTraffic([]);
      });
  }, []);

  // Stats KPIs
  const stats = useMemo(() => {
    if (analyticsSummary) {
      return {
        totalViews: Number(analyticsSummary.totalViews || 0),
        totalVisitors: Number(analyticsSummary.totalVisitors || 0),
        avgBounce: Number(analyticsSummary.avgBounce || 0),
        avgConversion: Number(analyticsSummary.avgConversion || 0).toFixed(1),
      };
    }
    const count = traffic.length;
    const totalViews = traffic.reduce((acc, t) => acc + t.viewsCount, 0);
    const totalVisitors = traffic.reduce((acc, t) => acc + t.uniqueVisitors, 0);
    const avgBounce = count > 0 ? Math.round(traffic.reduce((acc, t) => acc + t.bounceRatePercent, 0) / count) : 0;
    const avgConversion =
      count > 0 ? (traffic.reduce((acc, t) => acc + t.conversionRatePercent, 0) / count).toFixed(1) : '0.0';
    return { totalViews, totalVisitors, avgBounce, avgConversion };
  }, [traffic, analyticsSummary]);

  // Colonnes DataTable Master
  const columns: ColumnDef<TrafficRow>[] = [
    {
      key: 'pagePath',
      header: 'Page & Titre',
      sortable: true,
      sortValue: (row) => row.pageTitle,
      render: (row) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">{row.pageTitle}</span>
          <span className="text-[11px] font-mono text-neutral-500">{row.pagePath}</span>
        </div>
      ),
      printRender: (row) => `${row.pageTitle} (${row.pagePath})`,
    },
    {
      key: 'viewsCount',
      header: 'Vues Totales',
      sortable: true,
      sortValue: (row) => row.viewsCount,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-neutral-900">
          {row.viewsCount.toLocaleString('fr-FR')}
        </span>
      ),
      printRender: (row) => String(row.viewsCount),
    },
    {
      key: 'uniqueVisitors',
      header: 'Visiteurs Uniques',
      sortable: true,
      sortValue: (row) => row.uniqueVisitors,
      render: (row) => (
        <span className="font-mono text-xs text-neutral-700">
          {row.uniqueVisitors.toLocaleString('fr-FR')}
        </span>
      ),
      printRender: (row) => String(row.uniqueVisitors),
    },
    {
      key: 'avgTimeSeconds',
      header: 'Temps Moyen',
      sortable: true,
      sortValue: (row) => row.avgTimeSeconds,
      render: (row) => (
        <span className="font-mono text-xs text-neutral-600">
          {Math.floor(row.avgTimeSeconds / 60)}m {row.avgTimeSeconds % 60}s
        </span>
      ),
      printRender: (row) => `${Math.floor(row.avgTimeSeconds / 60)}m ${row.avgTimeSeconds % 60}s`,
    },
    {
      key: 'bounceRatePercent',
      header: 'Taux de Rebond',
      sortable: true,
      sortValue: (row) => row.bounceRatePercent,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-neutral-700">
          {row.bounceRatePercent}%
        </span>
      ),
      printRender: (row) => `${row.bounceRatePercent}%`,
    },
    {
      key: 'conversionRatePercent',
      header: 'Taux de Conversion',
      sortable: true,
      sortValue: (row) => row.conversionRatePercent,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {row.conversionRatePercent}%
        </span>
      ),
      printRender: (row) => `${row.conversionRatePercent}%`,
    },
    {
      key: 'createdAt',
      header: 'Date de Mesure',
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => (
        <div className="text-xs text-neutral-600">
          {new Date(row.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      ),
      printRender: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={row.pagePath}
            target="_blank"
            className="p-1.5 h-8 w-8 hover:bg-neutral-100 flex items-center justify-center rounded-lg border border-neutral-200 transition shadow-2xs cursor-pointer"
            title="Consulter la page en direct sur le storefront"
          >
            <ExternalLink className="w-3.5 h-3.5 text-neutral-600" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* 1. Page Header Card (Master Layout Standard) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              Audience, Tracking & Télémétrie
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              AUDIENCE VIP
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Indicateurs clés de performance du storefront public, entonnoir de conversion et pages les plus consultées.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Pilotage & Stratégie', href: '/dashboard' },
              { label: 'Audience & Télémétrie' },
            ]}
          />
        </div>
        {isRecapEnabled('analytics') && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateInsights}
            isLoading={loadingAi}
            className="border-[#E6D6A6] bg-[#FBF6E8] text-[#9A7414] hover:bg-[#C59B27] hover:text-white shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Conseils IA Conversion &amp; Stock</span>
          </Button>
        )}
      </div>

      {aiError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium no-print">
          {aiError}
        </div>
      )}

      {aiInsights && (
        <div className="p-5 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6] space-y-3 no-print">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-heading font-bold text-sm text-[#1D232E]">
              <Sparkles className="w-4 h-4 text-[#C59B27]" />
              <span>{aiInsights.headline || 'Recommandations Stratégiques IA'}</span>
            </div>
            <button
              type="button"
              onClick={() => setAiInsights(null)}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Masquer
            </button>
          </div>
          {aiInsights.summary && <p className="text-xs text-slate-700 leading-relaxed">{aiInsights.summary}</p>}
          {Array.isArray(aiInsights.recommendations) && aiInsights.recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiInsights.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#E6E1D6] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#1D232E]">{rec.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                      Impact {rec.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{rec.action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4 KPIs Master */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Pages Vues Totales</span>
            <Eye className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.totalViews.toLocaleString('fr-FR')}
          </div>
          <div className="text-[11px] text-neutral-500">Trafic consolidé</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Visiteurs Uniques</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.totalVisitors.toLocaleString('fr-FR')}
          </div>
          <div className="text-[11px] text-neutral-500">Sessions distinctes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Taux de Rebond Moyen</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.avgBounce}%
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Sorties sans interaction</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Conversion Globale</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {stats.avgConversion}%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Visites menant à l'achat</div>
        </div>
      </div>

      {/* Maximum Charts Grid Directly After KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 no-print">
        <div className="lg:col-span-7">
          <RoyalAreaTrendChart
            title="Momentum Visites vs Sessions Qualifiées"
            subtitle="Évolution journalière des pages vues et intentions d'achat"
            headlineValue={stats.totalViews.toLocaleString('fr-FR')}
            deltaLabel={`${stats.avgConversion}% conv.`}
            seriesName="Pages Vues"
            secondarySeriesName="Visiteurs Uniques"
            points={analyticsCharts?.dailyMomentum || []}
          />
        </div>
        <div className="lg:col-span-5">
          <RoyalDonutChart
            title="Sources d'Acquisition Storefront"
            subtitle="Répartition du trafic entrant par canal"
            centerLabel="Visiteurs"
            centerValue={stats.totalVisitors.toLocaleString('fr-FR')}
            slices={analyticsCharts?.acquisitionChannels || []}
          />
        </div>
        <div className="lg:col-span-5">
          <RoyalStackedBarChart
            title="Engagement par Segment Mensuel"
            subtitle="Desktop vs Mobile vs Tablette"
            primaryLabel="Mobile"
            secondaryLabel="Desktop"
            tertiaryLabel="Tablette"
            data={analyticsCharts?.deviceMonthlySegments || []}
          />
        </div>
        <div className="lg:col-span-3">
          <RoyalGaugeChart
            title="Indice d'Engagement"
            subtitle="Qualité sessions sans rebond"
            score={stats.totalViews > 0 || stats.totalVisitors > 0 ? Math.max(0, Math.round(100 - Number(stats.avgBounce))) : 0}
            statusText={`Taux de rebond mesuré à ${stats.avgBounce}% sur la période.`}
          />
        </div>
        <div className="lg:col-span-4">
          <RoyalSegmentedBarsChart
            title="Tunnel de Conversion Pages"
            subtitle="Progression par étape e-commerce"
            items={analyticsCharts?.conversionFunnel || []}
          />
        </div>
        <div className="lg:col-span-12">
          <RoyalHorizontalBarsChart
            title="Top Pages par Conversion (%)"
            subtitle="Classement des vues les plus performantes"
            items={traffic.slice(0, 5).map((r) => ({
              label: r.pageTitle,
              value: r.conversionRatePercent,
              maxValue: 100,
              unit: '%',
            }))}
          />
        </div>
      </div>

      {/* DataTable Master */}
      <DataTable<TrafficRow>
        data={traffic}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedTrafficIds}
        onSelectionChange={setSelectedTrafficIds}
        renderBulkActions={() => (
          <button
            type="button"
            onClick={() => {
              const sel = traffic.filter((t) => selectedTrafficIds.includes(t.id));
              const csv = [
                ['URL', 'Titre', 'Vues', 'Visiteurs', 'Rebond %', 'Conversion %'],
                ...sel.map((t) => [
                  t.pagePath,
                  `"${t.pageTitle.replace(/"/g, '""')}"`,
                  t.viewsCount,
                  t.uniqueVisitors,
                  t.bounceRatePercent,
                  t.conversionRatePercent,
                ]),
              ]
                .map((r) => r.join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `audience_selection_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold transition cursor-pointer"
          >
            Exporter CSV sélection ({selectedTrafficIds.length})
          </button>
        )}
        searchPlaceholder="Rechercher par URL, titre de page..."
        searchKeys={['pageTitle', 'pagePath']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Audience & Télémétrie Storefront — Royal"
        exportFileName="audience_telemetrie_royal"
      />
    </div>
  );
}
