'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, AlertCircle, ArrowRight } from 'lucide-react';
import { useI18nStore } from '@/stores/i18n.store';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { CmsOrderedSections, CmsViewCodeInjector } from '@/components/storefront/CmsElementRuntime';
import { buildCmsInlineStyle } from '@/lib/cms-builder';

export default function TrackOrderPage() {
  const { locale, t } = useI18nStore();
  const { config } = useCmsConfig();
  const trackCfg = config.views.trackOrder || {};
  const [reference, setReference] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !contact.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`/api/v1/orders/track?reference=${encodeURIComponent(reference.trim())}&contact=${encodeURIComponent(contact.trim())}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setOrder(data.data);
      } else {
        setError(data.message || 'Aucune commande trouvée avec ces identifiants.');
      }
    } catch {
      setError('Erreur lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const sections: Record<string, React.ReactNode> = {
    header: (
      <div key="header" className="text-center mb-10">
        <span className="text-xs uppercase font-semibold text-[#D4AF37] tracking-widest block mb-2">
          {locale === 'ar' ? t('track_order.eyebrow') : (trackCfg.badgeText || t('track_order.eyebrow'))}
        </span>
        <h1 className="font-sans font-bold tracking-tight text-3xl sm:text-4xl text-[#0C1A14] mb-3">
          {locale === 'ar' ? t('track_order.title') : (trackCfg.title || t('track_order.title'))}
        </h1>
        <p className="text-sm text-[#0C1A14]/70 max-w-md mx-auto">
          {locale === 'ar' ? t('track_order.subtitle') : (trackCfg.subtitle || t('track_order.subtitle'))}
        </p>
      </div>
    ),
    searchForm: (
      <div key="searchForm" className="bg-white rounded-3xl border border-[#EFECE6] p-6 sm:p-8 shadow-sm mb-10">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                {t('track_order.reference_label')}
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder={t('track_order.reference_placeholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                {t('track_order.contact_label')}
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t('track_order.contact_placeholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>{t('track_order.searching')}</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{t('track_order.submit')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    ),
    timelineResult: order ? (
      <div key="timelineResult" className="bg-white rounded-3xl border border-[#EFECE6] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFECE6] pb-4">
          <div>
            <span className="text-[11px] text-[#0C1A14]/50 uppercase tracking-widest block">{t('track_order.order_label')}</span>
            <span className="font-mono text-lg font-bold text-[#0C1A14]">{order.reference}</span>
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {t('track_order.status_label')} {order.status}
            </span>
          </div>
        </div>

        {/* Stepper (compact 4-step vs 9-step detailed timeline via CMS) */}
        {trackCfg.showNineStepTimeline !== false ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-[11px]">
            {[
              { keys: ['PENDING', 'CONFIRMED', 'PROCESSING', 'PREPARING', 'READY_FOR_PICKUP', 'READY_FOR_SHIPMENT', 'PICKED_UP_BY_CARRIER', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'], label: '1. Commande enregistrée' },
              { keys: ['CONFIRMED', 'PROCESSING', 'PREPARING', 'READY_FOR_PICKUP', 'READY_FOR_SHIPMENT', 'PICKED_UP_BY_CARRIER', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'], label: '2. Validée par le service' },
              { keys: ['PROCESSING', 'PREPARING', 'READY_FOR_PICKUP', 'READY_FOR_SHIPMENT', 'PICKED_UP_BY_CARRIER', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'], label: '3. Affectée à un dépôt' },
              { keys: ['PREPARING', 'READY_FOR_PICKUP', 'READY_FOR_SHIPMENT', 'PICKED_UP_BY_CARRIER', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'], label: '4. Préparation colis' },
              { keys: ['READY_FOR_PICKUP', 'READY_FOR_SHIPMENT', 'PICKED_UP_BY_CARRIER', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'], label: '5. Prête pour expédition / retrait' },
              { keys: ['PICKED_UP_BY_CARRIER', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'], label: '6. Prise en charge transporteur' },
              { keys: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'], label: '7. En transit' },
              { keys: ['OUT_FOR_DELIVERY', 'DELIVERED'], label: '8. En cours de tournée' },
              { keys: ['DELIVERED'], label: '9. Livrée avec succès' },
            ].map((st, idx) => {
              const reached = st.keys.includes(order.status);
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border ${
                    reached ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-[#FBF9F5] border-[#EFECE6] opacity-60'
                  }`}
                >
                  {st.label}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className={`p-3 rounded-xl border ${order.status ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-[#FBF9F5] border-[#EFECE6]'}`}>
              {t('track_order.step_1')}
            </div>
            <div className={`p-3 rounded-xl border ${['PROCESSING', 'PREPARING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-[#FBF9F5] border-[#EFECE6] opacity-60'}`}>
              {t('track_order.step_2')}
            </div>
            <div className={`p-3 rounded-xl border ${['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-[#FBF9F5] border-[#EFECE6] opacity-60'}`}>
              {t('track_order.step_3')}
            </div>
            <div className={`p-3 rounded-xl border ${order.status === 'DELIVERED' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-[#FBF9F5] border-[#EFECE6] opacity-60'}`}>
              {t('track_order.step_4')}
            </div>
          </div>
        )}

        <div className="pt-2 text-center">
          <Link
            href={`/order-confirmation/${order.reference}`}
            className="inline-flex items-center gap-1.5 text-xs text-[#0C1A14] hover:text-[#D4AF37] font-semibold tracking-wider uppercase transition"
          >
            <span>{t('track_order.view_summary')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    ) : null,
  };

  return (
    <div
      id={trackCfg.viewStyle?.domId?.trim() || 'royal-view-trackOrder'}
      style={buildCmsInlineStyle(trackCfg.viewStyle)}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
    >
      <CmsViewCodeInjector viewKey="trackOrder" viewStyle={trackCfg.viewStyle} />
      <CmsOrderedSections
        viewKey="trackOrder"
        viewCfg={trackCfg}
        defaultOrder={['header', 'searchForm', 'timelineResult']}
        sections={sections}
      />
    </div>
  );
}
