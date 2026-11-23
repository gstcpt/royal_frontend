'use client';

import * as React from 'react';
import {
  BarChart3,
  Heart,
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Package,
  RefreshCw,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import {
  DataTable,
  ColumnDef,
  Badge,
  Breadcrumb,
  Button,
  Toast,
} from '@/components/ui';
import {
  RoyalStackedBarChart,
  RoyalDonutChart,
  RoyalHorizontalBarsChart,
  RoyalGaugeChart,
} from '@/components/dashboard/RoyalChartsSuite';

interface InteractionMetric {
  id: string;
  sku: string;
  articleName: string;
  slug: string;
  categoryName: string;
  favoritesCount: number;
  likesCount: number;
  dislikesCount: number;
  compareCount: number;
  reviewsCount: number;
  averageRating: number;
  viewsCount: number;
  conversionRate: number;
  createdAt?: string;
}

interface InteractionsSummary {
  totalArticles: number;
  totalLikes: number;
  totalDislikes: number;
  totalFavorites: number;
  totalReviews: number;
  totalViews: number;
}

export default function InteractionsReportPage() {
  const [metrics, setMetrics] = React.useState<InteractionMetric[]>([]);
  const [summary, setSummary] = React.useState<InteractionsSummary>({
    totalArticles: 0,
    totalLikes: 0,
    totalDislikes: 0,
    totalFavorites: 0,
    totalReviews: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [selectedMetricIds, setSelectedMetricIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<{ msg: string; type: 'error' | 'success' } | null>(null);

  const loadInteractions = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/interactions-report');
      const payload = res?.data ?? res;
      if (payload?.items && Array.isArray(payload.items)) {
        setMetrics(payload.items);
        if (payload.summary) setSummary(payload.summary);
      } else {
        setMetrics([]);
      }
    } catch {
      setToast({ msg: 'Impossible de charger les interactions clients depuis PostgreSQL.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInteractions();
  }, [loadInteractions]);

  const topSix = React.useMemo(() => metrics.slice(0, 6), [metrics]);

  const positiveRatio = React.useMemo(() => {
    const totalReactions = summary.totalLikes + summary.totalDislikes;
    if (totalReactions === 0) return 100;
    return Math.round((summary.totalLikes / totalReactions) * 100);
  }, [summary]);

  const columns: ColumnDef<InteractionMetric>[] = [
    {
      key: 'articleName',
      header: 'Article Référencé',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-[#C59B27] shrink-0" />
            <span className="truncate max-w-[240px]">{item.articleName}</span>
          </div>
          <div className="text-[11px] text-neutral-500">
            {item.categoryName} • <span className="font-mono">{item.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'likesCount',
      header: 'J’aime / Dislike',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3 text-xs font-mono font-bold">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <ThumbsUp className="h-3.5 w-3.5" />
            {item.likesCount}
          </span>
          <span className="inline-flex items-center gap-1 text-rose-600">
            <ThumbsDown className="h-3.5 w-3.5" />
            {item.dislikesCount}
          </span>
        </div>
      ),
    },
    {
      key: 'favoritesCount',
      header: 'Liste d’Envies',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 font-mono">
          <Heart className="h-3.5 w-3.5 fill-rose-50 text-rose-600" />
          <span>{item.favoritesCount}</span>
        </div>
      ),
    },
    {
      key: 'averageRating',
      header: 'Note & Avis',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{item.averageRating > 0 ? `${item.averageRating} / 5` : '—'}</span>
          <span className="text-[10px] text-neutral-400 font-normal">({item.reviewsCount} avis)</span>
        </div>
      ),
    },
    {
      key: 'viewsCount',
      header: 'Consultations',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-700">
          <Eye className="h-3.5 w-3.5 text-neutral-400" />
          <span>{item.viewsCount}</span>
        </div>
      ),
    },
    {
      key: 'conversionRate',
      header: 'Engagement',
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="text-xs font-mono font-bold text-[#8C6400] bg-[#FBF6E8] border-[#E6D6A6]">
          {item.conversionRate}%
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast
        isOpen={!!toast}
        message={toast?.msg || ''}
        type={toast?.type === 'error' ? 'error' : 'success'}
        onClose={() => setToast(null)}
      />

      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
                Rapports des Interactions Clients
              </h1>
              <p className="text-xs text-neutral-500">
                Télémétrie PostgreSQL en direct : j&apos;aime, dislikes, listes d&apos;envies, avis vérifiés et consultations.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadInteractions}
            disabled={loading}
            className="text-xs"
            title="Actualiser"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'SEO & Réputation', href: '/dashboard/section/seo' },
              { label: 'Interactions' },
            ]}
          />
        </div>
      </div>

      {/* KPIs Numériques en Tête */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-[#E6E1D6] shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
            Consultations Vues
          </span>
          <span className="text-2xl font-black text-neutral-900 font-heading mt-1 block">
            {summary.totalViews}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#FBF6E8]/80 border border-[#E6D6A6] shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C6400] block">
            J&apos;aime (Likes)
          </span>
          <span className="text-2xl font-black text-[#8C6400] font-heading mt-1 block">
            {summary.totalLikes}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E6E1D6] shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
            Dislikes
          </span>
          <span className="text-2xl font-black text-rose-600 font-heading mt-1 block">
            {summary.totalDislikes}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E6E1D6] shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
            Ajouts Favoris
          </span>
          <span className="text-2xl font-black text-neutral-900 font-heading mt-1 block">
            {summary.totalFavorites}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E6E1D6] shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
            Avis Publiés
          </span>
          <span className="text-2xl font-black text-amber-700 font-heading mt-1 block">
            {summary.totalReviews}
          </span>
        </div>
      </div>

      {/* Graphiques Variés Royal Charts Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 no-print">
        <RoyalStackedBarChart
          title="Réactions & Favoris par Article (Top 6)"
          subtitle="Comparatif en temps réel des J'aime, Favoris et Avis"
          primaryLabel="Likes"
          secondaryLabel="Favoris"
          tertiaryLabel="Avis"
          data={topSix.map((item) => ({
            label: item.sku,
            primary: item.likesCount,
            secondary: item.favoritesCount,
            tertiary: item.reviewsCount,
          }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <RoyalDonutChart
            title="Répartition des Signaux"
            subtitle="Interactions cumulées"
            centerLabel="Total"
            centerValue={String(summary.totalLikes + summary.totalFavorites + summary.totalReviews + summary.totalDislikes)}
            slices={[
              { label: 'Likes', value: summary.totalLikes, color: '#C59B27' },
              { label: 'Favoris', value: summary.totalFavorites, color: '#059669' },
              { label: 'Avis', value: summary.totalReviews, color: '#64748B' },
              { label: 'Dislikes', value: summary.totalDislikes, color: '#E11D48' },
            ]}
          />

          <RoyalGaugeChart
            title="Indice d'Approbation"
            subtitle="Ratio Likes vs Dislikes"
            score={positiveRatio}
            statusText={positiveRatio >= 75 ? 'Adhésion client excellente' : 'Points d’amélioration détectés'}
          />
        </div>
      </div>

      <RoyalHorizontalBarsChart
        title="Classement des Articles les Plus Consultés"
        subtitle="Top 6 articles par nombre de consultations réelles"
        items={topSix.map((it) => ({
          label: `${it.articleName.slice(0, 32)} (${it.sku})`,
          value: it.viewsCount,
          unit: ' vues',
        }))}
      />

      <DataTable
        data={metrics}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        enableMultiSelect={true}
        selectedKeys={selectedMetricIds}
        onSelectionChange={setSelectedMetricIds}
        renderBulkActions={() => (
          <button
            type="button"
            onClick={() => {
              const sel = metrics.filter((m) => selectedMetricIds.includes(m.id));
              const csv = [
                ['SKU', 'Article', 'Catégorie', 'Vues', 'Favoris', 'Likes', 'Avis', 'Note', 'Conversion'],
                ...sel.map((m) => [
                  m.sku,
                  `"${m.articleName.replace(/"/g, '""')}"`,
                  `"${m.categoryName.replace(/"/g, '""')}"`,
                  m.viewsCount,
                  m.favoritesCount,
                  m.likesCount,
                  m.reviewsCount,
                  m.averageRating,
                  m.conversionRate,
                ]),
              ]
                .map((r) => r.join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `interactions_selection_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold transition cursor-pointer"
          >
            Exporter CSV sélection ({selectedMetricIds.length})
          </button>
        )}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['articleName', 'categoryName', 'sku']}
        exportFileName="interactions_clients_royal"
        printTitle="Rapports des Interactions Clients Royal"
      />
    </div>
  );
}
