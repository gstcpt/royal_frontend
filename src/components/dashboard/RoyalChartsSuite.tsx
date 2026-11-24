'use client';

import React, { useState } from 'react';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, Award, Layers } from 'lucide-react';

export interface StackedBarPoint {
  label: string;
  primary: number;
  secondary: number;
  tertiary?: number;
}

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

export interface TrendPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface RankedMetricItem {
  label: string;
  value: number;
  maxValue?: number;
  unit?: string;
  color?: string;
}

const ROYAL_SERIES_COLORS = ['#C59B27', '#64748B', '#D97706', '#059669', '#94A3B8', '#1D232E'];

export function RoyalStackedBarChart({
  title,
  subtitle,
  primaryLabel = 'Principal',
  secondaryLabel = 'Secondaire',
  tertiaryLabel,
  data,
  unit = '',
}: {
  title: string;
  subtitle?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  data: StackedBarPoint[];
  unit?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxTotal = Math.max(
    1,
    ...data.map((d) => d.primary + d.secondary + (d.tertiary || 0))
  );

  return (
    <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col justify-between gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-heading font-extrabold text-[#1D232E] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#C59B27]" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C59B27]" />
            {primaryLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
            {secondaryLabel}
          </span>
          {tertiaryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              {tertiaryLabel}
            </span>
          )}
        </div>
      </div>

      <div className="relative h-48 flex items-end gap-2 sm:gap-3 pt-6 pb-1 px-1">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
            Aucune donnée enregistrée pour cette période.
          </div>
        ) : (
          data.map((pt, idx) => {
            const total = pt.primary + pt.secondary + (pt.tertiary || 0);
            const pH = total > 0 ? Math.max(4, Math.round((pt.primary / maxTotal) * 140)) : 2;
            const sH = total > 0 && pt.secondary > 0 ? Math.max(2, Math.round((pt.secondary / maxTotal) * 140)) : 0;
            const tH = total > 0 && pt.tertiary ? Math.max(2, Math.round((pt.tertiary / maxTotal) * 140)) : 0;
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={pt.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center justify-end gap-1.5 relative group cursor-pointer"
              >
                {isHovered && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-2.5 py-1 rounded-xl bg-white border border-[#E6D6A6] shadow-lg text-[10px] font-mono font-bold text-[#1D232E]">
                    {pt.label}: {total.toLocaleString('fr-FR')} {unit}
                  </div>
                )}
                <div className={`w-full max-w-[34px] flex flex-col-reverse rounded-t-xl overflow-hidden transition-transform ${isHovered ? 'scale-105' : ''}`}>
                  <div style={{ height: `${pH}px` }} className="bg-[#C59B27] w-full" />
                  {sH > 0 && <div style={{ height: `${sH}px` }} className="bg-[#64748B] w-full" />}
                  {tH > 0 && <div style={{ height: `${tH}px` }} className="bg-[#059669] w-full" />}
                </div>
                <span className="text-[10px] font-bold text-slate-500 truncate max-w-full">{pt.label}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function RoyalAreaTrendChart({
  title,
  subtitle,
  headlineValue,
  deltaLabel,
  points,
  seriesName = 'Tendance',
  secondarySeriesName,
}: {
  title: string;
  subtitle?: string;
  headlineValue: string;
  deltaLabel?: string;
  points: TrendPoint[];
  seriesName?: string;
  secondarySeriesName?: string;
}) {
  const safePts =
    points.length >= 2
      ? points
      : [points[0] || { label: '', value: 0 }, { label: (points[0]?.label || '') + ' ', value: points[0]?.value || 0, secondaryValue: points[0]?.secondaryValue }];
  const maxVal = Math.max(1, ...safePts.map((p) => Math.max(p.value, p.secondaryValue || 0)));
  const minVal = 0;
  const width = 460;
  const height = 150;
  const padX = 14;
  const padY = 14;

  const toCoords = (vals: number[]) =>
    vals.map((v, i) => {
      const x = padX + (i / Math.max(1, vals.length - 1)) * (width - padX * 2);
      const y = height - padY - ((v - minVal) / Math.max(1, maxVal - minVal)) * (height - padY * 2);
      return { x, y };
    });

  const c1 = toCoords(safePts.map((p) => p.value));
  const linePath = c1.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${c1[c1.length - 1].x.toFixed(1)} ${height - padY} L ${c1[0].x.toFixed(1)} ${height - padY} Z`;

  const hasSecond = safePts.some((p) => p.secondaryValue !== undefined);
  const c2 = hasSecond ? toCoords(safePts.map((p) => p.secondaryValue || 0)) : [];
  const linePath2 = c2.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');

  return (
    <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-heading font-extrabold text-[#1D232E] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#C59B27]" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="text-right">
          <div className="text-lg font-black font-mono text-[#1D232E]">{headlineValue}</div>
          {deltaLabel && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {deltaLabel}
            </span>
          )}
        </div>
      </div>

      {points.length === 0 ? (
        <div className="h-44 flex items-center justify-center rounded-2xl bg-[#FBF9F4] border border-dashed border-[#E6E1D6] text-xs text-slate-400 font-medium">
          Aucune donnée enregistrée pour cette période.
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
            <defs>
              <linearGradient id={`goldArea-${title.replace(/\W/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C59B27" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#C59B27" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((r) => (
              <line
                key={r}
                x1={padX}
                x2={width - padX}
                y1={height * r}
                y2={height * r}
                stroke="#EFEAD8"
                strokeDasharray="4 4"
              />
            ))}
            <path d={areaPath} fill={`url(#goldArea-${title.replace(/\W/g, '')})`} />
            <path d={linePath} fill="none" stroke="#C59B27" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            {hasSecond && (
              <path d={linePath2} fill="none" stroke="#64748B" strokeWidth="2.2" strokeDasharray="5 3" strokeLinecap="round" />
            )}
            {c1.map((c, idx) => (
              <circle key={idx} cx={c.x} cy={c.y} r="3.5" fill="#FFFFFF" stroke="#C59B27" strokeWidth="2" />
            ))}
          </svg>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-2 pt-1">
            {safePts.map((p) => (
              <span key={p.label}>{p.label}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 border-t border-slate-100 pt-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C59B27]" /> {seriesName}
        </span>
        {secondarySeriesName && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" /> {secondarySeriesName}
          </span>
        )}
      </div>
    </div>
  );
}

export function RoyalDonutChart({
  title,
  subtitle,
  centerLabel,
  centerValue,
  slices,
}: {
  title: string;
  subtitle?: string;
  centerLabel: string;
  centerValue: string;
  slices: DonutSlice[];
}) {
  const validSlices = slices.filter((s) => Number(s?.value || 0) > 0);
  const total = validSlices.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  const r = 48;
  const circ = 2 * Math.PI * r;
  let offsetAcc = 0;

  return (
    <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col justify-between gap-4">
      <div>
        <h3 className="text-sm font-heading font-extrabold text-[#1D232E] flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-[#C59B27]" />
          <span>{title}</span>
        </h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {total <= 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">Aucune donnée enregistrée.</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={r} fill="none" stroke="#F4F5F7" strokeWidth="14" />
              {validSlices.map((s, idx) => {
                const frac = Math.max(0, s.value) / total;
                const segLen = frac * circ;
                const dashOffset = -offsetAcc;
                offsetAcc += segLen;
                const col = s.color || ROYAL_SERIES_COLORS[idx % ROYAL_SERIES_COLORS.length];
                return (
                  <circle
                    key={s.label}
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    stroke={col}
                    strokeWidth="14"
                    strokeDasharray={`${segLen.toFixed(1)} ${circ.toFixed(1)}`}
                    strokeDashoffset={dashOffset.toFixed(1)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-black font-mono text-[#1D232E]">{centerValue}</span>
              <span className="text-[9px] font-bold uppercase text-slate-400">{centerLabel}</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2 text-xs">
            {validSlices.map((s, idx) => {
              const pct = Math.round((Math.max(0, s.value) / total) * 100);
              const col = s.color || ROYAL_SERIES_COLORS[idx % ROYAL_SERIES_COLORS.length];
              return (
                <div key={s.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col }} />
                    <span className="font-semibold text-slate-700 truncate">{s.label}</span>
                  </div>
                  <span className="font-mono font-bold text-[#1D232E] shrink-0">
                    {Number(s.value || 0).toLocaleString('fr-FR')} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function RoyalGaugeChart({
  title,
  subtitle,
  score,
  maxScore = 100,
  statusText,
}: {
  title: string;
  subtitle?: string;
  score: number;
  maxScore?: number;
  statusText?: string;
}) {
  const clamped = Math.max(0, Math.min(maxScore, score));
  const pct = clamped / Math.max(1, maxScore);
  const r = 56;
  const semiCirc = Math.PI * r;
  const filled = pct * semiCirc;

  return (
    <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col justify-between gap-4">
      <div>
        <h3 className="text-sm font-heading font-extrabold text-[#1D232E] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#C59B27]" />
          <span>{title}</span>
        </h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col items-center justify-center pt-2">
        <svg viewBox="0 0 150 90" className="w-48 h-28 overflow-visible">
          <path
            d="M 19 75 A 56 56 0 0 1 131 75"
            fill="none"
            stroke="#F4F5F7"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M 19 75 A 56 56 0 0 1 131 75"
            fill="none"
            stroke="#C59B27"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${filled.toFixed(1)} ${semiCirc.toFixed(1)}`}
          />
        </svg>
        <div className="-mt-10 text-center">
          <div className="text-3xl font-black font-mono text-[#1D232E]">
            {Math.round(clamped)}<span className="text-sm text-slate-400">/{maxScore}</span>
          </div>
        </div>
      </div>

      {statusText && (
        <div className="p-3 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] text-[11px] font-medium text-[#9A7414] text-center">
          {statusText}
        </div>
      )}
    </div>
  );
}

export function RoyalSegmentedBarsChart({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: RankedMetricItem[];
}) {
  const maxVal = Math.max(1, ...items.map((it) => it.maxValue ?? it.value));

  return (
    <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col justify-between gap-4">
      <div>
        <h3 className="text-sm font-heading font-extrabold text-[#1D232E] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#C59B27]" />
          <span>{title}</span>
        </h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-3.5">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Aucune donnée enregistrée.</p>
        ) : (
          items.map((it, idx) => {
            const val = Number(it?.value ?? 0);
            const pct = Math.min(100, Math.round((val / maxVal) * 100));
            const ticks = 28;
            const activeTicks = Math.round((pct / 100) * ticks);
            const color = it.color || ROYAL_SERIES_COLORS[idx % ROYAL_SERIES_COLORS.length];
            return (
              <div key={it.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1D232E] truncate">{it.label}</span>
                  <span className="font-mono font-bold text-[#9A7414]">
                    {val.toLocaleString('fr-FR')} {it.unit || `%`}
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-0.5 h-3.5">
                  {Array.from({ length: ticks }).map((_, tIdx) => (
                    <span
                      key={tIdx}
                      style={{ backgroundColor: tIdx < activeTicks ? color : '#EFEAD8' }}
                      className="rounded-xs w-full h-full"
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function RoyalHorizontalBarsChart({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: RankedMetricItem[];
}) {
  const maxVal = Math.max(1, ...items.map((i) => i.maxValue ?? i.value));

  return (
    <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col justify-between gap-4">
      <div>
        <h3 className="text-sm font-heading font-extrabold text-[#1D232E] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#C59B27]" />
          <span>{title}</span>
        </h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Aucune donnée enregistrée.</p>
        ) : (
          items.map((it, idx) => {
            const val = Number(it?.value ?? 0);
            const pct = Math.min(100, Math.round((val / maxVal) * 100));
            const col = it.color || ROYAL_SERIES_COLORS[idx % ROYAL_SERIES_COLORS.length];
            return (
              <div key={it.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate">{it.label}</span>
                  <span className="font-mono font-bold text-[#1D232E]">
                    {val.toLocaleString('fr-FR')} {it.unit || ''}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F4F5F7] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(4, pct)}%`, backgroundColor: col }}
                    className="h-full rounded-full transition-all"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
