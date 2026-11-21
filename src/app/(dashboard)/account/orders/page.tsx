'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ExternalLink,
  RefreshCw,
  PackageCheck,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';
import { Button, Breadcrumb } from '@/components/ui';
import { NINE_ORDER_STATUSES, ORDER_STATUS_LABEL_MAP } from '@/components/common/PrintableOrderSheet';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'PAST'>('ALL');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/orders/my-orders?limit=50');
      const list = Array.isArray(res) ? res : res?.data || [];
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (filterTab === 'ACTIVE') {
      return orders.filter((o) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status));
    }
    if (filterTab === 'PAST') {
      return orders.filter((o) => ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status));
    }
    return orders;
  }, [orders, filterTab]);

  const activeCount = orders.filter((o) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length;
  const pastCount = orders.filter((o) => ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length;

  const renderStatus = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> {ORDER_STATUS_LABEL_MAP[status] || status}
          </span>
        );
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_SHIPMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Truck className="w-3 h-3" /> {ORDER_STATUS_LABEL_MAP[status] || status}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> {ORDER_STATUS_LABEL_MAP[status] || status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3 h-3" /> {ORDER_STATUS_LABEL_MAP[status] || status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb items={[{ label: 'Mon Espace Client', href: '/dashboard' }, { label: 'Mes Commandes' }]} />

      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
              Mes Commandes
            </h1>
            <p className="text-xs text-neutral-500">
              Suivez l&apos;avancement de vos commandes en direct et imprimez vos bons Royal.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders} className="text-xs shrink-0">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-neutral-200 w-fit">
        {[
          { key: 'ALL', label: `Toutes (${orders.length})` },
          { key: 'ACTIVE', label: `En cours (${activeCount})` },
          { key: 'PAST', label: `Historique terminé (${pastCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterTab === tab.key
                ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
                : 'text-neutral-600 hover:bg-[#FBF9F4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-500">
          Chargement de vos commandes...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center space-y-4">
          <ShoppingBag className="h-10 w-10 text-neutral-300 mx-auto" />
          <div className="text-sm font-bold text-neutral-900">
            Aucune commande dans cette catégorie.
          </div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold shadow-xs"
          >
            Découvrir les articles
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const currentIdx = NINE_ORDER_STATUSES.findIndex((s) => s.key === order.status);
            const isCancelled = order.status === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-5 hover:border-neutral-400 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-neutral-100">
                  <div className="space-y-0.5">
                    <div className="font-mono font-black text-sm text-neutral-900">
                      {order.reference}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Passée le {new Date(order.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderStatus(order.status)}
                    <span className="font-mono font-black text-sm text-neutral-900">
                      {formatTndCurrency(Number(order.totalAmount || 0))}
                    </span>
                    <Link
                      href={`/order-confirmation/${order.reference}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold hover:bg-[var(--royal-primary-hover)] transition shadow-xs"
                    >
                      <span>Bon &amp; Détails</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Complete 9-Status Progress Grid */}
                <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-neutral-200/70">
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                    {NINE_ORDER_STATUSES.map((st, idx) => {
                      const isCancelStep = st.key === 'CANCELLED';
                      const done = isCancelled
                        ? isCancelStep
                        : !isCancelStep && currentIdx >= idx;
                      return (
                        <div key={st.key} className="space-y-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isCancelStep && isCancelled
                                ? 'bg-rose-500'
                                : done
                                ? 'bg-amber-500'
                                : 'bg-neutral-200'
                            }`}
                          />
                          <div
                            className={`text-[10px] font-bold flex items-center gap-1 ${
                              isCancelStep && isCancelled
                                ? 'text-rose-700'
                                : done
                                ? 'text-neutral-900'
                                : 'text-neutral-400'
                            }`}
                          >
                            {done && (
                              <PackageCheck
                                className={`w-3 h-3 shrink-0 ${
                                  isCancelStep && isCancelled ? 'text-rose-600' : 'text-amber-600'
                                }`}
                              />
                            )}
                            <span className="truncate">{st.step}. {st.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {(order.items || []).map((it: any) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] border border-neutral-200/70"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-neutral-900 truncate">{it.productName}</div>
                        <div className="text-[11px] text-neutral-500">
                          {it.variantName || 'Standard'} &bull; Qté: {it.quantity}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-neutral-900 shrink-0">
                        {formatTndCurrency(Number(it.totalPrice || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
