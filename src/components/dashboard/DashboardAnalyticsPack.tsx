'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  TrendingUp,
  PieChart as PieChartIcon,
  Award,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatTndCurrency } from '@/lib/utils';
import { ORDER_STATUS_LABEL_MAP } from '@/components/common/PrintableOrderSheet';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';

export interface MonthlyRevenuePoint {
  key: string;
  label: string;
  online: number;
  pos: number;
  promo: number;
  total: number;
  count: number;
}

export interface PlatformContributionItem {
  key: string;
  label: string;
  count: number;
}

export interface CalendarOrderItem {
  id: string;
  reference: string;
  status: string;
  amount: number;
  customerName: string;
}

export interface CalendarDayEvent {
  date: string; // YYYY-MM-DD
  count: number;
  total: number;
  orders: CalendarOrderItem[];
}

export interface UnreadMessageItem {
  id: string;
  kind: 'SUPPORT' | 'CONTACT' | 'NOTIFICATION';
  senderName: string;
  senderRole: string;
  subject: string;
  snippet: string;
  link: string;
  createdAt: string;
}

export interface UserDashboardPayload {
  roleScope: 'STAFF' | 'CLIENT';
  monthlyRevenueSeries: MonthlyRevenuePoint[];
  platformContribution: PlatformContributionItem[];
  calendarEvents: CalendarDayEvent[];
  satisfactionScore: number;
  reviewsTotalCount: number;
  orderCompletionRate: number;
  ordersCount: number;
  salesTotal: number;
  unreadMessages: UnreadMessageItem[];
}

const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const GOLD_PALETTE = ['#C59B27', '#94A3B8', '#D9B650', '#64748B'];

export function DashboardAnalyticsPack({
  data,
  isClient,
}: {
  data: UserDashboardPayload | null;
  isClient?: boolean;
}) {
  const { isRouteVisible } = useRouteVisibility();
  const ordersHref = isClient ? '/account/orders' : '/dashboard/orders';
  const messagesHref = isClient ? '/account/messages' : '/dashboard/community/messages';
  const canViewOrders = isRouteVisible(ordersHref);
  const canViewMessages = isRouteVisible(messagesHref);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  });

  const series = data?.monthlyRevenueSeries || [];
  const maxMonthlyTotal = useMemo(
    () => Math.max(1, ...series.map((s) => s.total || 0)),
    [series]
  );

  const activeHoverIdx =
    hoveredMonthIdx !== null
      ? hoveredMonthIdx
      : series.length > 0
      ? series.length - 1
      : 0;
  const activePoint = series[activeHoverIdx];

  const platforms = data?.platformContribution || [];
  const totalPlatformCount = useMemo(
    () => Math.max(1, platforms.reduce((s, p) => s + p.count, 0)),
    [platforms]
  );

  const calendarEventMap = useMemo(() => {
    const map = new Map<string, CalendarDayEvent>();
    for (const ev of data?.calendarEvents || []) {
      map.set(ev.date, ev);
    }
    return map;
  }, [data?.calendarEvents]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Convert JS Sun=0..Sat=6 to Mon=0..Sun=6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const cells: Array<{ day: number | null; key: string | null }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, key: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, key });
    }
    return cells;
  }, [calendarMonth]);

  const selectedDayEvent = selectedDayKey ? calendarEventMap.get(selectedDayKey) : undefined;
  const unreadMessages = data?.unreadMessages || [];
  const satisfactionScore = Math.min(100, Math.max(0, data?.satisfactionScore ?? 0));
  const completionRate = Math.min(100, Math.max(0, data?.orderCompletionRate ?? 0));

  // Build SVG smooth line points for Sales Momentum
  const momentumSvg = useMemo(() => {
    const w = 340;
    const h = 130;
    const padX = 16;
    const padY = 18;
    const usableW = w - padX * 2;
    const usableH = h - padY * 2;
    const ptsOnline = series.map((pt, idx) => {
      const x = series.length <= 1 ? w / 2 : padX + (idx / (series.length - 1)) * usableW;
      const y = h - padY - ((pt.online || 0) / maxMonthlyTotal) * usableH;
      return { x, y, val: pt.online || 0, label: pt.label };
    });
    const ptsPos = series.map((pt, idx) => {
      const x = series.length <= 1 ? w / 2 : padX + (idx / (series.length - 1)) * usableW;
      const y = h - padY - ((pt.pos || 0) / maxMonthlyTotal) * usableH;
      return { x, y, val: pt.pos || 0, label: pt.label };
    });
    const toPath = (pts: Array<{ x: number; y: number }>) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
      return pts.reduce((acc, p, i, arr) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = arr[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
      }, '');
    };
    return {
      w,
      h,
      pathOnline: toPath(ptsOnline),
      pathPos: toPath(ptsPos),
      lastOnline: ptsOnline[ptsOnline.length - 1],
      lastPos: ptsPos[ptsPos.length - 1],
    };
  }, [series, maxMonthlyTotal]);

  const prevMonth = () =>
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Satisfaction semi-circle arc math
  const gaugeArcLength = 251.2;
  const gaugeOffset = gaugeArcLength - (satisfactionScore / 100) * gaugeArcLength;

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 h-64 rounded-3xl bg-white border border-[#E6E1D6] animate-pulse" />
        <div className="lg:col-span-4 h-64 rounded-3xl bg-white border border-[#E6E1D6] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Revenue Source Stacked Bars + Satisfaction & Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stacked Monthly Revenue Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E6E1D6] p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#1D232E] flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#FBF6E8] text-[#B8860B] border border-[#C59B27]/25">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span>{isClient ? 'Évolution de mes Commandes (6 Mois)' : 'Sources de Revenus (6 Derniers Mois)'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isClient
                  ? 'Répartition mensuelle de vos achats Web, Showroom & codes promo.'
                  : 'Répartition Boutique Web, Caisse POS & Campagnes Promo en TND.'}
              </p>
            </div>
            {activePoint && (
              <div className="px-3.5 py-2 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6] text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9A7414]">
                  {activePoint.label} &bull; {activePoint.count} cmd
                </div>
                <div className="text-sm font-black font-mono text-[#1D232E]">
                  {formatTndCurrency(activePoint.total)}
                </div>
              </div>
            )}
          </div>

          {/* Stacked Pill Bars */}
          <div className="relative pt-4">
            <div className="grid grid-cols-6 gap-3 sm:gap-5 items-end h-44 px-2 border-b border-slate-100 pb-3">
              {series.map((pt, idx) => {
                const totalHeightPct = pt.total > 0 ? Math.max(12, Math.round((pt.total / maxMonthlyTotal) * 100)) : 4;
                const onlineRatio = pt.total > 0 ? Math.round((pt.online / pt.total) * 100) : 0;
                const posRatio = pt.total > 0 ? Math.round((pt.pos / pt.total) * 100) : 0;
                const promoRatio = pt.total > 0 ? Math.max(0, 100 - onlineRatio - posRatio) : 0;
                const isHovered = activeHoverIdx === idx;
                return (
                  <div
                    key={pt.key}
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    onClick={() => setHoveredMonthIdx(idx)}
                    className="flex flex-col items-center justify-end h-full cursor-pointer group"
                  >
                    <div
                      className={`w-6 sm:w-8 rounded-2xl overflow-hidden flex flex-col-reverse transition-all duration-300 border ${
                        isHovered
                          ? 'ring-2 ring-[#C59B27]/50 border-[#C59B27] scale-[1.03]'
                          : 'border-slate-200/70'
                      }`}
                      style={{ height: `${totalHeightPct}%` }}
                    >
                      <div
                        className="w-full bg-[#C59B27]"
                        style={{ height: `${onlineRatio}%` }}
                        title={`Boutique Web: ${formatTndCurrency(pt.online)}`}
                      />
                      <div
                        className="w-full bg-slate-400"
                        style={{ height: `${posRatio}%` }}
                        title={`Showroom POS: ${formatTndCurrency(pt.pos)}`}
                      />
                      <div
                        className="w-full bg-[#E6D6A6]"
                        style={{ height: `${promoRatio}%` }}
                        title={`Campagnes Promo: ${formatTndCurrency(pt.promo)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-6 gap-3 sm:gap-5 px-2 pt-2 text-center">
              {series.map((pt, idx) => (
                <button
                  type="button"
                  key={pt.key}
                  onClick={() => setHoveredMonthIdx(idx)}
                  className={`text-[11px] font-bold transition ${
                    activeHoverIdx === idx ? 'text-[#9A7414]' : 'text-slate-500'
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C59B27]" />
                Boutique Web
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                Showroom &amp; POS
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E6D6A6]" />
                Remises &amp; Promos
              </span>
            </div>
            {activePoint && (
              <span className="font-mono text-[11px] text-slate-500">
                Web {formatTndCurrency(activePoint.online)} &bull; POS {formatTndCurrency(activePoint.pos)}
              </span>
            )}
          </div>
        </div>

        {/* Right Stack: Completion Segmented Bar + Customer Satisfaction Arc Gauge */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          {/* Segmented Completion Rate Card */}
          <div className="bg-white rounded-3xl border border-[#E6E1D6] p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isClient ? 'Commandes Finalisées' : 'Taux de Complétion'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] text-[10px] font-bold">
                {completionRate}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-black font-mono text-[#1D232E]">
                {data.ordersCount}
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                commandes suivies
              </span>
            </div>
            {/* Segmented tick bar inspired by SoulOut */}
            <div className="grid grid-cols-20 gap-1 pt-1" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
              {Array.from({ length: 20 }).map((_, idx) => {
                const active = completionRate > 0 && (idx + 1) * 5 <= completionRate;
                return (
                  <div
                    key={idx}
                    className={`h-5 rounded-sm transition-colors ${
                      active
                        ? 'bg-gradient-to-b from-[#D9B650] to-[#B8860B]'
                        : 'bg-slate-100'
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>{completionRate}% livrées / validées avec succès</span>
            </p>
          </div>

          {/* Satisfaction Arc Gauge */}
          <div className="bg-white rounded-3xl border border-[#E6E1D6] p-6 shadow-sm space-y-2 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Satisfaction Clients
              </span>
              <Award className="w-4 h-4 text-[#C59B27]" />
            </div>

            <div className="relative flex flex-col items-center justify-center py-2">
              <svg viewBox="0 0 200 110" className="w-48 h-28 overflow-visible">
                <defs>
                  <linearGradient id="royalGoldGauge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#94A3B8" />
                    <stop offset="50%" stopColor="#D9B650" />
                    <stop offset="100%" stopColor="#B8860B" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 95 A 80 80 0 0 1 180 95"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <path
                  d="M 20 95 A 80 80 0 0 1 180 95"
                  fill="none"
                  stroke="url(#royalGoldGauge)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={gaugeArcLength}
                  strokeDashoffset={gaugeOffset}
                />
              </svg>
              <div className="-mt-12 text-center">
                <div className="text-2xl font-heading font-black text-[#1D232E] font-mono">
                  {satisfactionScore}
                  <span className="text-xs font-bold text-slate-400"> /100</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Sur {data.reviewsTotalCount} avis certifiés
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Platform Contribution Donut + Sales Momentum Curves + Interactive Order Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Platform Contribution Donut */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E6E1D6] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-sm text-[#1D232E] flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#C59B27]" />
              <span>Canaux &amp; Contribution</span>
            </h3>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#F4F5F7] text-slate-600">
              Mensuel
            </span>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                {(() => {
                  const r = 46;
                  const circ = 2 * Math.PI * r;
                  let accPct = 0;
                  return platforms.map((pl, idx) => {
                    const pct = pl.count / totalPlatformCount;
                    const dash = pct * circ;
                    const offset = -accPct * circ;
                    accPct += pct;
                    return (
                      <circle
                        key={pl.key}
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        stroke={GOLD_PALETTE[idx % GOLD_PALETTE.length]}
                        strokeWidth="12"
                        strokeDasharray={`${Math.max(4, dash)} ${circ}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-mono text-[#1D232E]">
                  {data.ordersCount}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Commandes
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {platforms.map((pl, idx) => (
              <div key={pl.key} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: GOLD_PALETTE[idx % GOLD_PALETTE.length] }}
                  />
                  {pl.label}
                </span>
                <span className="font-mono font-bold text-[#1D232E]">{pl.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Momentum Curves */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E6E1D6] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-sm text-[#1D232E]">
              {isClient ? 'Rythme des Achats' : 'Dynamique des Ventes'}
            </h3>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
              Web vs POS
            </span>
          </div>

          <div className="relative bg-[#FBF9F4] rounded-2xl border border-[#EFEAD8] p-3">
            <svg viewBox={`0 0 ${momentumSvg.w} ${momentumSvg.h}`} className="w-full h-36 overflow-visible">
              <defs>
                <linearGradient id="momentumArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C59B27" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#C59B27" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[30, 65, 100].map((y) => (
                <line
                  key={y}
                  x1="12"
                  y1={y}
                  x2={momentumSvg.w - 12}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeDasharray="3 3"
                />
              ))}
              {momentumSvg.pathPos && (
                <path
                  d={momentumSvg.pathPos}
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
              {momentumSvg.pathOnline && (
                <path
                  d={momentumSvg.pathOnline}
                  fill="none"
                  stroke="#C59B27"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
              {momentumSvg.lastOnline && (
                <circle
                  cx={momentumSvg.lastOnline.x}
                  cy={momentumSvg.lastOnline.y}
                  r="4.5"
                  fill="#FFFFFF"
                  stroke="#C59B27"
                  strokeWidth="3"
                />
              )}
              {momentumSvg.lastPos && (
                <circle
                  cx={momentumSvg.lastPos.x}
                  cy={momentumSvg.lastPos.y}
                  r="4"
                  fill="#FFFFFF"
                  stroke="#64748B"
                  strokeWidth="2.5"
                />
              )}
            </svg>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-1 pt-1">
              {series.map((s) => (
                <span key={s.key}>{s.label}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-[11px] text-slate-500">Volume Total Période</div>
              <div className="text-lg font-heading font-black font-mono text-[#1D232E]">
                {formatTndCurrency(data.salesTotal)}
              </div>
            </div>
            {canViewOrders && (
              <Link
                href={ordersHref}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C59B27] to-[#A67C1E] text-white text-xs font-bold shadow-sm hover:opacity-95 transition"
              >
                <span>Voir Détails</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Interactive Monthly Order Calendar */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E6E1D6] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-sm text-[#1D232E] flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#C59B27]" />
              <span>Calendrier des Commandes</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:border-[#C59B27] text-slate-600 transition"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-[#1D232E] min-w-[105px] text-center">
                {MONTHS_FR[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:border-[#C59B27] text-slate-600 transition"
                aria-label="Mois suivant"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_FR.map((w) => (
              <div key={w} className="text-[10px] font-bold uppercase text-slate-400 py-1">
                {w}
              </div>
            ))}
            {calendarDays.map((cell, idx) => {
              if (!cell.day || !cell.key) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }
              const ev = calendarEventMap.get(cell.key);
              const isSelected = selectedDayKey === cell.key;
              return (
                <button
                  type="button"
                  key={cell.key}
                  onClick={() => setSelectedDayKey(cell.key!)}
                  className={`h-8 rounded-lg text-[11px] font-bold relative flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-[#C59B27] text-white shadow-sm'
                      : ev
                      ? 'bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] hover:bg-[#F5E9C8]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cell.day}
                  {ev && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#C59B27]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Orders Preview */}
          <div className="pt-2 border-t border-slate-100">
            {selectedDayEvent ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#9A7414]">
                  <span>
                    {selectedDayKey} &bull; {selectedDayEvent.count} commande(s)
                  </span>
                  <span className="font-mono">{formatTndCurrency(selectedDayEvent.total)}</span>
                </div>
                {selectedDayEvent.orders.slice(0, 2).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between text-[11px] bg-[#F8F9FA] px-2.5 py-1.5 rounded-lg border border-slate-200/70"
                  >
                    <span className="font-bold text-[#1D232E] truncate pr-2">
                      #{o.reference} &bull; {o.customerName}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 shrink-0">
                      {ORDER_STATUS_LABEL_MAP[o.status] || o.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 text-center py-1">
                Sélectionnez un jour doré pour inspecter les commandes.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: 5 Derniers Messages Non Lus Card */}
      <div className="bg-white rounded-3xl border border-[#E6E1D6] p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#FBF6E8] text-[#B8860B] border border-[#C59B27]/25">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-[#1D232E]">
                5 Derniers Messages Non Lus
              </h3>
              <p className="text-[11px] text-slate-500">
                {isClient
                  ? 'Réponses Support Royal & notifications récentes en attente de lecture.'
                  : 'Tickets Support client et demandes de contact non traités.'}
              </p>
            </div>
          </div>

          {canViewMessages && (
            <Link
              href={messagesHref}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9A7414] hover:text-[#1D232E] transition"
            >
              <span>Ouvrir la messagerie</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {unreadMessages.length === 0 ? (
          <div className="py-6 px-4 rounded-2xl bg-[#FBF9F4] border border-[#EFEAD8] text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C59B27]" />
            <span>Boîte de réception à jour — aucun message non lu.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {unreadMessages.slice(0, 5).map((msg) => {
              const targetHref =
                msg.link && isRouteVisible(msg.link)
                  ? msg.link
                  : canViewMessages
                  ? messagesHref
                  : null;
              const rowBody = (
                <>
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-1 w-2 h-2 rounded-full bg-[#C59B27] shrink-0" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#1D232E] group-hover:text-[#9A7414] transition">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F4F5F7] text-slate-600 border border-slate-200">
                          {msg.senderRole}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          — {msg.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{msg.snippet}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 shrink-0 pl-5 sm:pl-0">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(msg.createdAt).toLocaleDateString('fr-TN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </>
              );
              return targetHref ? (
                <Link
                  key={msg.id}
                  href={targetHref}
                  className="py-3 px-2 -mx-2 rounded-xl hover:bg-[#FBF9F4] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
                >
                  {rowBody}
                </Link>
              ) : (
                <div
                  key={msg.id}
                  className="py-3 px-2 -mx-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  {rowBody}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
