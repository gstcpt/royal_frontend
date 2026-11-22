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

const INITIAL_TRAFFIC: TrafficRow[] = [
  {
    id: 'trf-1',
    pagePath: '/',
    pageTitle: 'Accueil VIP — Royal Luxury Living',
    viewsCount: 14250,
    uniqueVisitors: 8900,
    avgTimeSeconds: 145,
    bounceRatePercent: 28.4,
    conversionRatePercent: 4.8,
    createdAt: '2026-11-15T00:00:00Z',
  },
  {
    id: 'trf-2',
    pagePath: '/products/airfryer-double-tiroir-8-5l-2400w',
    pageTitle: 'Airfryer Double Tiroir 8.5L — Fiche Produit',
    viewsCount: 3890,
    uniqueVisitors: 2650,
    avgTimeSeconds: 210,
    bounceRatePercent: 19.2,
    conversionRatePercent: 8.6,
    createdAt: '2026-11-15T00:00:00Z',
  },
  {
    id: 'trf-3',
    pagePath: '/products',
    pageTitle: 'Catalogue Général Électroménager',
    viewsCount: 7850,
    uniqueVisitors: 4900,
    avgTimeSeconds: 180,
    bounceRatePercent: 22.1,
    conversionRatePercent: 5.2,
    createdAt: '2026-11-15T00:00:00Z',
  },
  {
    id: 'trf-4',
    pagePath: '/checkout',
    pageTitle: 'Tunnel de Commande & Paiement',
    viewsCount: 840,
    uniqueVisitors: 780,
    avgTimeSeconds: 320,
    bounceRatePercent: 12.0,
    conversionRatePercent: 68.4,
    createdAt: '2026-11-15T00:00:00Z',
  },
];

export default function AnalyticsPage() {
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
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
      const res = await fetchApi('/storefront-cms/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'ANALYTICS_INSIGHT',
          payload: {
            ...stats,
            topPages: traffic.slice(0, 5).map((r) => ({
              path: r.pagePath,
              views: r.viewsCount,
              conv: r.conversionRatePercent,
            })),
          },
        }),
      });
      setAiInsights(res?.data || res);
    } catch (err: any) {
      setAiError(err?.message || 'Activez un fournisseur IA gratuit (Gemini / Groq) dans Système > IA.');
    } finally {
      setLoadingAi(false);
    }
  };

  React.useEffect(() => {
    fetchApi('/storefront-cms/analytics-report')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        if (Array.isArray(list)) setTraffic(list);
      })
      .catch(() => {});
  }, []);

  // Stats KPIs
  const stats = useMemo(() => {
    const count = Math.max(1, traffic.length);
    const totalViews = traffic.reduce((acc, t) => acc + t.viewsCount, 0);
    const totalVisitors = traffic.reduce((acc, t) => acc + t.uniqueVisitors, 0);
    const avgBounce = Math.round(traffic.reduce((acc, t) => acc + t.bounceRatePercent, 0) / count);
    const avgConversion = (traffic.reduce((acc, t) => acc + t.conversionRatePercent, 0) / count).toFixed(1);
    return { totalViews, totalVisitors, avgBounce, avgConversion };
  }, [traffic]);

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
            points={[
              { label: 'Lun', value: 1840, secondaryValue: 780 },
              { label: 'Mar', value: 2210, secondaryValue: 960 },
              { label: 'Mer', value: 2650, secondaryValue: 1120 },
              { label: 'Jeu', value: 2490, secondaryValue: 1090 },
              { label: 'Ven', value: 3120, secondaryValue: 1410 },
              { label: 'Sam', value: 3480, secondaryValue: 1620 },
              { label: 'Dim', value: 2940, secondaryValue: 1320 },
            ]}
          />
        </div>
        <div className="lg:col-span-5">
          <RoyalDonutChart
            title="Sources d'Acquisition Storefront"
            subtitle="Répartition du trafic entrant par canal"
            centerLabel="Visiteurs"
            centerValue={stats.totalVisitors.toLocaleString('fr-FR')}
            slices={[
              { label: 'Recherche Google SEO', value: Math.round(stats.totalVisitors * 0.44), color: '#C59B27' },
              { label: 'Réseaux Sociaux (FB/IG/TT)', value: Math.round(stats.totalVisitors * 0.31), color: '#64748B' },
              { label: 'Accès Direct Royal', value: Math.round(stats.totalVisitors * 0.16), color: '#059669' },
              { label: 'Campagnes Email & Promo', value: Math.round(stats.totalVisitors * 0.09), color: '#D97706' },
            ]}
          />
        </div>
        <div className="lg:col-span-5">
          <RoyalStackedBarChart
            title="Engagement par Segment Mensuel"
            subtitle="Desktop vs Mobile vs Tablette"
            primaryLabel="Mobile"
            secondaryLabel="Desktop"
            tertiaryLabel="Tablette"
            data={[
              { label: 'Jul', primary: 1400, secondary: 820, tertiary: 240 },
              { label: 'Aoû', primary: 1680, secondary: 890, tertiary: 260 },
              { label: 'Sep', primary: 1920, secondary: 940, tertiary: 290 },
              { label: 'Oct', primary: 2240, secondary: 1080, tertiary: 310 },
              { label: 'Nov', primary: 2680, secondary: 1210, tertiary: 380 },
            ]}
          />
        </div>
        <div className="lg:col-span-3">
          <RoyalGaugeChart
            title="Indice d'Engagement"
            subtitle="Qualité sessions sans rebond"
            score={Math.max(10, Math.round(100 - Number(stats.avgBounce)))}
            statusText={`Taux de rebond contenu à ${stats.avgBounce}% sur la période.`}
          />
        </div>
        <div className="lg:col-span-4">
          <RoyalSegmentedBarsChart
            title="Tunnel de Conversion Pages"
            subtitle="Progression par étape e-commerce"
            items={[
              { label: 'Consultation Fiche Produit', value: 78, unit: '%' },
              { label: 'Ajout au Panier', value: 42, unit: '%' },
              { label: 'Ouverture Checkout', value: 24, unit: '%' },
              { label: 'Commande Validée', value: Math.min(100, Math.round(Number(stats.avgConversion) * 10)), unit: '%' },
            ]}
          />
        </div>
        <div className="lg:col-span-12">
          <RoyalHorizontalBarsChart
            title="Top Pages par Conversion (%)"
            subtitle="Classement des vues les plus performantes"
            items={traffic.slice(0, 5).map((r) => ({
              label: r.pageTitle,
              value: r.conversionRatePercent,
              maxValue: 12,
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
