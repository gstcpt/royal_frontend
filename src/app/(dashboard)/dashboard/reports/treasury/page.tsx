'use client';

import * as React from 'react';
import { Banknote, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, BarChart3, Download } from 'lucide-react';
import { Breadcrumb, Badge, DataTable, ColumnDef } from '@/components/ui';
import { formatTndCurrency } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import {
  RoyalStackedBarChart,
  RoyalAreaTrendChart,
  RoyalDonutChart,
  RoyalGaugeChart,
  RoyalSegmentedBarsChart,
  RoyalHorizontalBarsChart,
} from '@/components/dashboard/RoyalChartsSuite';

interface CaisseStatRow {
  name: string;
  encaissements: number;
  decaissements: number;
  transferts: number;
}

export default function TreasuryReportsPage() {
  const [liveSales, setLiveSales] = React.useState(0);
  const [caissesStats, setCaissesStats] = React.useState<CaisseStatRow[]>([]);
  const [coverageScore, setCoverageScore] = React.useState(0);
  const [selectedNames, setSelectedNames] = React.useState<string[]>([]);

  const columns: ColumnDef<CaisseStatRow>[] = [
    {
      key: 'name',
      header: 'Caisse / Compte',
      sortable: true,
      sortValue: (c) => c.name,
      render: (c) => <span className="font-bold text-xs text-[#1D232E]">{c.name}</span>,
      printRender: (c) => c.name,
    },
    {
      key: 'encaissements',
      header: 'Encaissements',
      sortable: true,
      sortValue: (c) => c.encaissements,
      className: 'text-right',
      render: (c) => <span className="font-mono font-bold text-xs text-emerald-700">{formatTndCurrency(c.encaissements)}</span>,
      printRender: (c) => formatTndCurrency(c.encaissements),
    },
    {
      key: 'decaissements',
      header: 'Décaissements',
      sortable: true,
      sortValue: (c) => c.decaissements,
      className: 'text-right',
      render: (c) => <span className="font-mono font-bold text-xs text-rose-700">{formatTndCurrency(c.decaissements)}</span>,
      printRender: (c) => formatTndCurrency(c.decaissements),
    },
    {
      key: 'transferts',
      header: 'Transferts',
      sortable: true,
      sortValue: (c) => c.transferts,
      className: 'text-right',
      render: (c) => <span className="font-mono font-bold text-xs text-[#9A7414]">{formatTndCurrency(c.transferts)}</span>,
      printRender: (c) => formatTndCurrency(c.transferts),
    },
  ];

  React.useEffect(() => {
    fetchApi('/storefront-cms/treasury-report')
      .then((res) => {
        const payload = res?.caissesStats ? res : res?.data || res;
        if (payload?.salesTotal !== undefined) setLiveSales(Number(payload.salesTotal || 0));
        if (Array.isArray(payload?.caissesStats)) setCaissesStats(payload.caissesStats);
        if (payload?.coverageScore !== undefined) setCoverageScore(Number(payload.coverageScore || 0));
      })
      .catch(() => {
        setCaissesStats([]);
        setCoverageScore(0);
      });
  }, []);

  const maxVal = Math.max(1, ...caissesStats.map((c) => c.encaissements));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Rapports — Suivi &amp; Statistiques des Caisses
              </h1>
              <p className="text-xs text-slate-500">
                Analyse détaillée par caisse : encaissements, décaissements et mouvements de fonds inter-caisses.
              </p>
            </div>
          </div>
          <Badge variant="warning">CA Commandes Actif : {formatTndCurrency(liveSales)}</Badge>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Rapports et statistiques', href: '/dashboard/reports/sales' },
              { label: 'Suivi des caisses' },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Total Encaissements</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-heading font-black font-mono text-[#1D232E]">
            {formatTndCurrency(caissesStats.reduce((s, c) => s + c.encaissements, 0))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Total Décaissements</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-heading font-black font-mono text-[#1D232E]">
            {formatTndCurrency(caissesStats.reduce((s, c) => s + c.decaissements, 0))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Mouvements Entre Caisses</span>
            <ArrowLeftRight className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="text-2xl font-heading font-black font-mono text-[#1D232E]">
            {formatTndCurrency(caissesStats.reduce((s, c) => s + c.transferts, 0))}
          </div>
        </div>
      </div>

      {/* Maximum Varied Treasury Charts Right Under KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <RoyalStackedBarChart
            title="Comparatif Encaissements vs Décaissements vs Transferts"
            subtitle="Flux comparatifs consolidés depuis PostgreSQL (TND)"
            primaryLabel="Encaissements"
            secondaryLabel="Décaissements"
            tertiaryLabel="Transferts"
            unit="TND"
            data={caissesStats.map((c) => ({
              label: c.name.replace('Caisse Showroom ', '').replace('Compte Courant ', ''),
              primary: c.encaissements,
              secondary: c.decaissements,
              tertiary: c.transferts,
            }))}
          />
        </div>
        <div className="lg:col-span-5">
          <RoyalDonutChart
            title="Contribution Encaissements par Caisse"
            subtitle="Poids relatif dans les entrées totales"
            centerLabel="Total TND"
            centerValue={`${Math.round(caissesStats.reduce((s, c) => s + c.encaissements, 0) / 1000)}K`}
            slices={caissesStats.map((c) => ({
              label: c.name.replace('Caisse Showroom ', ''),
              value: c.encaissements,
            }))}
          />
        </div>
        <div className="lg:col-span-5">
          <RoyalAreaTrendChart
            title="Dynamique Trésorerie Nette"
            subtitle="Solde net agrégé par compte actif"
            headlineValue={formatTndCurrency(
              caissesStats.reduce((s, c) => s + c.encaissements - c.decaissements, 0)
            )}
            deltaLabel={`${caissesStats.length} compte(s) actif(s)`}
            seriesName="Encaissements"
            secondarySeriesName="Décaissements"
            points={caissesStats.map((c) => ({
              label: c.name.split(' ').slice(-2).join(' '),
              value: c.encaissements,
              secondaryValue: c.decaissements,
            }))}
          />
        </div>
        <div className="lg:col-span-3">
          <RoyalGaugeChart
            title="Ratio Couverture Cash"
            subtitle="Liquidités nettes vs décaissements"
            score={coverageScore}
            statusText={`Trésorerie active sur ${caissesStats.length} compte(s) PostgreSQL.`}
          />
        </div>
        <div className="lg:col-span-4">
          <RoyalSegmentedBarsChart
            title="Performance Relative par Caisse"
            subtitle="Part d'encaissement par rapport au maximum"
            items={caissesStats.map((c) => ({
              label: c.name.replace('Caisse Showroom ', ''),
              value: Math.round((c.encaissements / maxVal) * 100),
              unit: '%',
            }))}
          />
        </div>
        <div className="lg:col-span-12">
          <RoyalHorizontalBarsChart
            title="Flux Comparatifs Détaillés par Caisse"
            subtitle="Classement global des encaissements TND"
            items={caissesStats.map((c) => ({
              label: c.name,
              value: c.encaissements,
              unit: 'TND',
            }))}
          />
        </div>
      </div>

      <DataTable<CaisseStatRow>
        data={caissesStats}
        columns={columns}
        keyExtractor={(c) => c.name}
        searchPlaceholder="Rechercher une caisse ou un compte..."
        searchKeys={['name']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        defaultPageSize={12}
        pageSizeOptions={[6, 12, 24, 48, 96]}
        enableMultiSelect={true}
        selectedKeys={selectedNames}
        onSelectionChange={setSelectedNames}
        renderBulkActions={() => (
          <button
            type="button"
            onClick={() => {
              const sel = caissesStats.filter((c) => selectedNames.includes(c.name));
              const csv = [
                ['Caisse', 'Encaissements TND', 'Décaissements TND', 'Transferts TND'],
                ...sel.map((c) => [`"${c.name.replace(/"/g, '""')}"`, c.encaissements, c.decaissements, c.transferts]),
              ]
                .map((r) => r.join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `suivi_caisses_selection_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV sélection ({selectedNames.length})</span>
          </button>
        )}
        exportFileName="rapports_suivi_caisses_royal"
        printTitle="Suivi & Statistiques des Caisses — Royal"
      />
    </div>
  );
}
