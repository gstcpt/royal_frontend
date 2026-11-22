'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompareStore } from '@/stores/compare.store';
import { useI18nStore } from '@/stores/i18n.store';
import { Layers, X, ArrowRight, Trash2 } from 'lucide-react';
import { formatTndCurrency } from '@/lib/utils';

export function CompareBar() {
  const { items, removeFromCompare, clearCompare } = useCompareStore();
  const { t } = useI18nStore();

  if (items.length === 0) {
    return null;
  }

  const canCompare = items.length >= 2;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-4 max-w-4xl mx-auto z-50 pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-xl text-[var(--royal-ink)] rounded-3xl p-3 sm:p-4 border border-[var(--royal-primary)]/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Left Title & Counter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-2xl bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] flex items-center justify-center shrink-0 border border-[var(--royal-primary)]/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--royal-ink)] flex items-center gap-2">
                <span>{t('compare.bar_title')}</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] text-[10px] font-mono border border-[var(--royal-primary)]/20">
                  {items.length}/4
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {canCompare
                  ? t('compare.bar_ready')
                  : t('compare.bar_min')}
              </div>
            </div>
          </div>

          {/* Middle Thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative group w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] overflow-hidden shrink-0 flex items-center justify-center p-1"
              >
                <img
                  src={item.primaryImage}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => removeFromCompare(item.id)}
                  title={t('actions.remove_short')}
                  className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: 4 - items.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-[#E6E1D6] bg-[#FBF9F4]/60 flex items-center justify-center shrink-0 text-slate-400 text-xs font-medium"
              >
                +
              </div>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={clearCompare}
              title={t('compare.clear_short')}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {canCompare ? (
              <Link
                href="/compare"
                className="px-5 py-2.5 rounded-2xl bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <span>{t('compare.compare_now')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                disabled
                className="px-4 py-2.5 rounded-2xl bg-[var(--royal-silver-light)] text-slate-400 font-medium text-xs cursor-not-allowed border border-[var(--royal-border)]"
              >
                {t('compare.bar_min')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
