'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Clock, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRange {
  startDate: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  endDate: string;   // YYYY-MM-DD or YYYY-MM-DDTHH:mm
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
  showTime?: boolean;
}

function parseDateTime(val?: string) {
  if (!val) return { date: '', time: '' };
  if (val.includes('T')) {
    const [date, time] = val.split('T');
    return { date: date || '', time: time ? time.slice(0, 5) : '' };
  }
  return { date: val, time: '' };
}

function formatDisplayDate(val: string, fallbackTime = ''): string {
  if (!val) return '';
  const { date, time } = parseDateTime(val);
  if (!date) return '';
  const parts = date.split('-');
  if (parts.length !== 3) return val;
  const frDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
  const effectiveTime = time || fallbackTime;
  return effectiveTime ? `${frDate} ${effectiveTime}` : frDate;
}

export function DateRangePicker({
  value = { startDate: '', endDate: '' },
  onChange,
  onClear,
  className,
  label = 'Période',
  showTime = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [popoverCoords, setPopoverCoords] = React.useState<{
    top: number;
    left: number;
    openUpwards: boolean;
  } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Parse current values into local draft state
  const startParsed = parseDateTime(value.startDate);
  const endParsed = parseDateTime(value.endDate);

  const [startDateOnly, setStartDateOnly] = React.useState(startParsed.date);
  const [startTimeOnly, setStartTimeOnly] = React.useState(
    startParsed.time || (showTime && startParsed.date ? '00:00' : '')
  );
  const [endDateOnly, setEndDateOnly] = React.useState(endParsed.date);
  const [endTimeOnly, setEndTimeOnly] = React.useState(
    endParsed.time || (showTime && endParsed.date ? '23:59' : '')
  );

  // Sync draft with incoming props when popover opens or prop changes
  React.useEffect(() => {
    const s = parseDateTime(value.startDate);
    const e = parseDateTime(value.endDate);
    setStartDateOnly(s.date);
    setStartTimeOnly(s.time || (showTime && s.date ? '00:00' : ''));
    setEndDateOnly(e.date);
    setEndTimeOnly(e.time || (showTime && e.date ? '23:59' : ''));
  }, [value.startDate, value.endDate, showTime]);

  // Dynamically compute fixed coordinates outside modal hierarchy
  React.useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 440;
      const popoverWidth = Math.min(400, window.innerWidth - 24);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

      let top = openUpwards ? rect.top - popoverHeight - 8 : rect.bottom + 8;
      if (top < 10) top = 10;
      if (top + popoverHeight > window.innerHeight - 10) {
        top = Math.max(10, window.innerHeight - popoverHeight - 10);
      }

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
      if (left < 12) left = 12;

      setPopoverCoords({ top, left, openUpwards });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Close on click outside (works across portal boundary)
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) {
        return;
      }
      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleApply = () => {
    let finalStart = '';
    let finalEnd = '';

    if (startDateOnly) {
      if (showTime) {
        finalStart = `${startDateOnly}T${startTimeOnly || '00:00'}`;
      } else {
        finalStart = startDateOnly;
      }
    }

    if (endDateOnly) {
      if (showTime) {
        finalEnd = `${endDateOnly}T${endTimeOnly || '23:59'}`;
      } else {
        finalEnd = endDateOnly;
      }
    }

    onChange?.({ startDate: finalStart, endDate: finalEnd });
    setIsOpen(false);
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStartDateOnly('');
    setStartTimeOnly('');
    setEndDateOnly('');
    setEndTimeOnly('');
    onClear?.();
    onChange?.({ startDate: '', endDate: '' });
  };

  const setPreset = (type: 'today' | '24h' | '7d' | '30d' | 'month') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    if (type === 'today') {
      const todayStr = toDateStr(now);
      setStartDateOnly(todayStr);
      setStartTimeOnly('00:00');
      setEndDateOnly(todayStr);
      setEndTimeOnly('23:59');
      onChange?.({
        startDate: showTime ? `${todayStr}T00:00` : todayStr,
        endDate: showTime ? `${todayStr}T23:59` : todayStr,
      });
      setIsOpen(false);
    } else if (type === '24h') {
      const past24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const startD = toDateStr(past24);
      const startT = toTimeStr(past24);
      const endD = toDateStr(now);
      const endT = toTimeStr(now);
      setStartDateOnly(startD);
      setStartTimeOnly(startT);
      setEndDateOnly(endD);
      setEndTimeOnly(endT);
      onChange?.({
        startDate: `${startD}T${startT}`,
        endDate: `${endD}T${endT}`,
      });
      setIsOpen(false);
    } else if (type === '7d') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startD = toDateStr(past7);
      const endD = toDateStr(now);
      setStartDateOnly(startD);
      setStartTimeOnly('00:00');
      setEndDateOnly(endD);
      setEndTimeOnly('23:59');
      onChange?.({
        startDate: showTime ? `${startD}T00:00` : startD,
        endDate: showTime ? `${endD}T23:59` : endD,
      });
      setIsOpen(false);
    } else if (type === '30d') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startD = toDateStr(past30);
      const endD = toDateStr(now);
      setStartDateOnly(startD);
      setStartTimeOnly('00:00');
      setEndDateOnly(endD);
      setEndTimeOnly('23:59');
      onChange?.({
        startDate: showTime ? `${startD}T00:00` : startD,
        endDate: showTime ? `${endD}T23:59` : endD,
      });
      setIsOpen(false);
    } else if (type === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startD = toDateStr(startOfMonth);
      const endD = toDateStr(now);
      setStartDateOnly(startD);
      setStartTimeOnly('00:00');
      setEndDateOnly(endD);
      setEndTimeOnly('23:59');
      onChange?.({
        startDate: showTime ? `${startD}T00:00` : startD,
        endDate: showTime ? `${endD}T23:59` : endD,
      });
      setIsOpen(false);
    }
  };

  const hasRange = Boolean(value.startDate || value.endDate);

  // Build clean display label
  let displayLabel = `${label} : Toutes`;
  if (hasRange) {
    const sP = parseDateTime(value.startDate);
    const eP = parseDateTime(value.endDate);
    const sTime = sP.time || (showTime && sP.date ? '00:00' : '');
    const eTime = eP.time || (showTime && eP.date ? '23:59' : '');

    const startFormatted = formatDisplayDate(value.startDate, showTime ? '00:00' : '');
    const endFormatted = formatDisplayDate(value.endDate, showTime ? '23:59' : '');

    if (sP.date && eP.date && sP.date === eP.date && sTime && eTime) {
      const parts = sP.date.split('-');
      displayLabel = `${parts[2]}/${parts[1]}/${parts[0]} ${sTime} → ${eTime}`;
    } else if (startFormatted && endFormatted) {
      displayLabel = `${startFormatted} → ${endFormatted}`;
    } else if (startFormatted) {
      displayLabel = `Depuis ${startFormatted}`;
    } else if (endFormatted) {
      displayLabel = `Jusqu'au ${endFormatted}`;
    }
  }

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-150 shadow-sm cursor-pointer select-none',
          hasRange
            ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] shadow-xs'
            : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4]'
        )}
      >
        <CalendarIcon
          className={cn(
            'w-3.5 h-3.5 shrink-0 transition-colors',
            hasRange ? 'text-white' : 'text-neutral-500'
          )}
        />
        <span className="truncate max-w-[280px]">{displayLabel}</span>
        {hasRange ? (
          <span
            onClick={handleReset}
            className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
            title="Effacer la période"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <span className="opacity-60 text-[10px]">▾</span>
        )}
      </button>

      {isOpen && mounted && popoverCoords && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${popoverCoords.top}px`,
            left: `${popoverCoords.left}px`,
            zIndex: 99999,
          }}
          className="w-[360px] sm:w-[400px] max-h-[90vh] overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-100 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] flex items-center justify-center">
                <CalendarIcon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Période {showTime ? '(Date & Heure)' : '(Date)'}
              </span>
            </div>
            {hasRange && (
              <button
                type="button"
                onClick={() => handleReset()}
                className="text-[11px] text-red-600 hover:underline font-semibold"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Raccourcis rapides
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setPreset('today')}
                className="py-1.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-medium text-neutral-800 transition text-center"
              >
                Aujourd&apos;hui
              </button>
              {showTime && (
                <button
                  type="button"
                  onClick={() => setPreset('24h')}
                  className="py-1.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-medium text-neutral-800 transition text-center"
                >
                  Dernières 24h
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreset('7d')}
                className="py-1.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-medium text-neutral-800 transition text-center"
              >
                7 Derniers Jours
              </button>
              <button
                type="button"
                onClick={() => setPreset('30d')}
                className="py-1.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-medium text-neutral-800 transition text-center"
              >
                30 Derniers Jours
              </button>
              <button
                type="button"
                onClick={() => setPreset('month')}
                className="py-1.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-medium text-neutral-800 transition text-center"
              >
                Ce Mois-ci
              </button>
            </div>
          </div>

          {/* Date & Time Inputs */}
          <div className="space-y-3 pt-2">
            {/* Start Field */}
            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Du :</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 block mb-0.5">Date</label>
                  <input
                    type="date"
                    value={startDateOnly}
                    onChange={(e) => {
                      setStartDateOnly(e.target.value);
                      if (showTime && !startTimeOnly) setStartTimeOnly('00:00');
                    }}
                    className="w-full text-xs rounded-xl border border-neutral-200 bg-white p-2 text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
                {showTime && (
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 block mb-0.5">Heure (HH:mm)</label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="time"
                        value={startTimeOnly}
                        onChange={(e) => setStartTimeOnly(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
              {showTime && (
                <div className="flex items-center gap-1 pt-1 text-[10px] text-neutral-500">
                  <span className="font-semibold text-neutral-400 mr-1">Raccourcis :</span>
                  <button
                    type="button"
                    onClick={() => setStartTimeOnly('00:00')}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/70 hover:bg-neutral-300 font-mono"
                  >
                    00:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setStartTimeOnly('08:00')}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/70 hover:bg-neutral-300 font-mono"
                  >
                    08:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setStartTimeOnly('12:00')}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/70 hover:bg-neutral-300 font-mono"
                  >
                    12:00
                  </button>
                </div>
              )}
            </div>

            {/* End Field */}
            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Jusqu'à :</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 block mb-0.5">Date</label>
                  <input
                    type="date"
                    value={endDateOnly}
                    min={startDateOnly}
                    onChange={(e) => {
                      setEndDateOnly(e.target.value);
                      if (showTime && !endTimeOnly) setEndTimeOnly('23:59');
                    }}
                    className="w-full text-xs rounded-xl border border-neutral-200 bg-white p-2 text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
                {showTime && (
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 block mb-0.5">Heure (HH:mm)</label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="time"
                        value={endTimeOnly}
                        onChange={(e) => setEndTimeOnly(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
              {showTime && (
                <div className="flex items-center gap-1 pt-1 text-[10px] text-neutral-500">
                  <span className="font-semibold text-neutral-400 mr-1">Raccourcis :</span>
                  <button
                    type="button"
                    onClick={() => setEndTimeOnly('12:00')}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/70 hover:bg-neutral-300 font-mono"
                  >
                    12:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndTimeOnly('18:00')}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/70 hover:bg-neutral-300 font-mono"
                  >
                    18:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndTimeOnly('23:59')}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/70 hover:bg-neutral-300 font-mono"
                  >
                    23:59
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold hover:bg-[var(--royal-primary-hover)] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Appliquer la Période</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
