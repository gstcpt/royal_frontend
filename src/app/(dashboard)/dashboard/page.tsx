'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { SystemRole } from '@royal/shared-types';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Layers,
  Store,
  ShieldCheck,
  Languages,
  MapPin,
  Heart,
  ArrowRight,
  Building2,
  Server,
  Database,
  Activity,
  HardDrive,
  Mail,
  Percent,
  Sliders,
  FileText,
  Lock,
  Ticket,
  ShoppingCart,
  BarChart3,
  PieChart,
  Star,
  Plus,
} from 'lucide-react';
import { formatTndCurrency } from '@/lib/utils';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { fetchApi } from '@/lib/api';
import { ORDER_STATUS_LABEL_MAP } from '@/components/common/PrintableOrderSheet';
import { ClientUnifiedDashboard } from '@/components/dashboard/ClientUnifiedDashboard';
import {
  DashboardAnalyticsPack,
  UserDashboardPayload,
} from '@/components/dashboard/DashboardAnalyticsPack';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';

interface DashboardKpis {
  articlesCount: number;
  categoriesCount: number;
  totalCategoriesCount: number;
  usersCount: number;
  ordersCount: number;
  salesCount: number;
  salesTotal: number;
  lowStockCount: number;
  topCategories?: Array<{ id: string; name: string; count: number }>;
  ordersByStatus?: Array<{ status: string; count: number; amount: number }>;
  recentOrders?: Array<{
    id: string;
    reference: string;
    status: string;
    totalAmount: number;
    customerName: string;
    createdAt: string;
  }>;
  recentReviews?: Array<{
    id: string;
    rating: number;
    body: string;
    status: string;
    productName: string;
    authorName: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  const { isRouteVisible } = useRouteVisibility();
  const canSeeArticles = isRouteVisible('/dashboard/articles');
  const canSeeCategories = isRouteVisible('/dashboard/categories');
  const canSeeCoupons = isRouteVisible('/dashboard/coupons');
  const canSeeOrders = isRouteVisible('/dashboard/orders');
  const canSeeTestimonials = isRouteVisible('/dashboard/community/testimonials');
  const canSeeContacts = isRouteVisible('/dashboard/community/contacts');
  const userRoles = (user?.roles as string[]) || [];
  const isRoot = userRoles.includes('ROOT') || hasRole(SystemRole.ROOT);
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN') || hasRole(SystemRole.SUPER_ADMIN);
  const isWebsiteManager =
    userRoles.includes('WEBSITE_MANAGER') || userRoles.includes('ADMIN') || hasRole(SystemRole.ADMIN);
  const isClient =
    (userRoles.includes('CLIENT') || hasRole(SystemRole.CLIENT)) &&
    !isRoot &&
    !isSuperAdmin &&
    !isWebsiteManager;

  const [userDash, setUserDash] = useState<UserDashboardPayload | null>(null);
  const [kpis, setKpis] = useState<DashboardKpis>({
    articlesCount: 0,
    categoriesCount: 0,
    totalCategoriesCount: 0,
    usersCount: 0,
    ordersCount: 0,
    salesCount: 0,
    salesTotal: 0,
    lowStockCount: 0,
    topCategories: [],
    ordersByStatus: [],
    recentOrders: [],
    recentReviews: [],
  });
  useEffect(() => {
    if (!user) return;
    if (!isClient) {
      fetchApi('/storefront-cms/user-dashboard')
        .then((res) => {
          const d = res?.data || res;
          if (d) setUserDash(d);
        })
        .catch(() => null);
    }
    if (!isClient && (isRoot || isSuperAdmin || isWebsiteManager)) {
      fetchApi('/storefront-cms/dashboard-kpis')
        .then((res) => {
          const d = res?.data || res;
          if (d && typeof d.articlesCount === 'number') {
            setKpis(d);
          }
        })
        .catch(() => null);
    }
  }, [user, isClient, isRoot, isSuperAdmin, isWebsiteManager]);

  if (isClient) {
    return <ClientUnifiedDashboard />;
  }

  const maxCatCount = Math.max(1, ...(kpis.topCategories || []).map((c) => c.count));
  const totalOrdersForChart = Math.max(
    1,
    (kpis.ordersByStatus || []).reduce((acc, g) => acc + g.count, 0)
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: isRoot ? 'Supervision Système Master ROOT' : 'Vue Générale — KPIs & Analytique Royal' },
        ]}
      />

      {/* Welcome Banner + Quick Actions */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Système Opérationnel &amp; Synchronisé
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              {isRoot ? 'Console Master ROOT — Vue Globale & KPIs' : 'Tableau de Bord Royal — Pilotage & Indicateurs'}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Connecté : <strong className="text-neutral-800">{user?.firstName} {user?.lastName}</strong> ({userRoles.join(', ')})
            </p>
          </div>
          <span className="text-xs text-neutral-700 bg-neutral-100 px-3.5 py-2 rounded-full border border-neutral-200 font-medium">
            Devise : <strong>TND (3 décimales)</strong>
          </span>
        </div>

        {/* Quick Action Buttons Strip */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-neutral-100">
          {canSeeArticles && (
            <Link
              href="/dashboard/articles"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold text-xs hover:bg-[var(--royal-primary-hover)] transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter / Gérer Articles</span>
            </Link>
          )}
          {canSeeCoupons && (
            <Link
              href="/dashboard/coupons"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs hover:bg-amber-100 transition"
            >
              <Ticket className="w-3.5 h-3.5 text-amber-600" />
              <span>Codes Promo &amp; Livraison</span>
            </Link>
          )}
          {canSeeOrders && (
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 font-bold text-xs hover:border-neutral-900 transition"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
              <span>Commandes Clients</span>
            </Link>
          )}
          {canSeeTestimonials && (
            <Link
              href="/dashboard/community/testimonials"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 font-bold text-xs hover:border-neutral-900 transition"
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Modérer Avis &amp; Commentaires</span>
            </Link>
          )}
          {canSeeContacts && (
            <Link
              href="/dashboard/community/contacts"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 font-bold text-xs hover:border-neutral-900 transition"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Messages Contacts</span>
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] font-bold text-xs hover:bg-[#F5E9C8] transition ml-auto"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Voir Boutique →</span>
          </Link>
        </div>
      </div>

      {/* Role-Tailored Visual Charts, Order Calendar & 5 Latest Unread Messages */}
      <DashboardAnalyticsPack data={userDash} />

      {/* Core Live Business KPIs (ROOT, SUPER_ADMIN, WEBSITE_MANAGER) */}
      {(isRoot || isSuperAdmin || isWebsiteManager) && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {canSeeArticles ? (
              <Link href="/dashboard/articles" className="bg-white p-6 rounded-3xl border border-neutral-200 hover:border-neutral-900 transition shadow-sm space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Articles Actifs</span>
                  <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <Package className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 font-mono">
                  {kpis.articlesCount}
                </div>
                <div className="text-[11px] text-neutral-400">Références en ligne sur le catalogue</div>
              </Link>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Articles Actifs</span>
                  <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <Package className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 font-mono">
                  {kpis.articlesCount}
                </div>
                <div className="text-[11px] text-neutral-400">Références en ligne sur le catalogue</div>
              </div>
            )}

            {canSeeCategories ? (
              <Link href="/dashboard/categories" className="bg-white p-6 rounded-3xl border border-neutral-200 hover:border-neutral-900 transition shadow-sm space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Catégories</span>
                  <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Layers className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 font-mono">
                  {kpis.categoriesCount}
                </div>
                <div className="text-[11px] text-neutral-400">Sur {kpis.totalCategoriesCount} rayons configurés</div>
              </Link>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Catégories</span>
                  <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Layers className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 font-mono">
                  {kpis.categoriesCount}
                </div>
                <div className="text-[11px] text-neutral-400">Sur {kpis.totalCategoriesCount} rayons configurés</div>
              </div>
            )}

            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                <span>Utilisateurs</span>
                <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 font-mono">
                {kpis.usersCount}
              </div>
              <div className="text-[11px] text-neutral-400">Comptes actifs en base</div>
            </div>

            {canSeeOrders ? (
              <Link href="/dashboard/orders" className="bg-white p-6 rounded-3xl border border-neutral-200 hover:border-neutral-900 transition shadow-sm space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Commandes</span>
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                    <ShoppingCart className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 font-mono">
                  {kpis.ordersCount}
                </div>
                <div className="text-[11px] text-neutral-400">Total commandes enregistrées</div>
              </Link>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Commandes</span>
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                    <ShoppingCart className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 font-mono">
                  {kpis.ordersCount}
                </div>
                <div className="text-[11px] text-neutral-400">Total commandes enregistrées</div>
              </div>
            )}

            {canSeeOrders ? (
              <Link href="/dashboard/orders" className="bg-white p-6 rounded-3xl border border-neutral-200 hover:border-neutral-900 transition shadow-sm space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Ventes Validées</span>
                  <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 font-mono">
                  {kpis.salesCount}
                </div>
                <div className="text-[11px] text-emerald-700 font-bold font-mono">
                  CA : {formatTndCurrency(kpis.salesTotal)}
                </div>
              </Link>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                  <span>Ventes Validées</span>
                  <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 font-mono">
                  {kpis.salesCount}
                </div>
                <div className="text-[11px] text-emerald-700 font-bold font-mono">
                  CA : {formatTndCurrency(kpis.salesTotal)}
                </div>
              </div>
            )}
          </div>

          {/* Visual Charts Row: Top Categories Bar Chart + Orders By Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <span>Top Catégories par Volume d&apos;Articles</span>
                </h3>
                {canSeeCategories && (
                  <Link href="/dashboard/categories" className="text-xs font-bold text-neutral-600 hover:text-neutral-950">
                    Voir tout →
                  </Link>
                )}
              </div>

              <div className="space-y-3">
                {(kpis.topCategories || []).length === 0 ? (
                  <p className="text-xs text-neutral-400">Chargement des données catégories...</p>
                ) : (
                  (kpis.topCategories || []).map((cat) => {
                    const pct = Math.round((cat.count / maxCatCount) * 100);
                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-800 truncate pr-3">{cat.name}</span>
                          <span className="font-mono font-bold text-neutral-900 shrink-0">{cat.count} articles</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-600" />
                  <span>Répartition des Commandes par État</span>
                </h3>
                {canSeeOrders && (
                  <Link href="/dashboard/orders" className="text-xs font-bold text-neutral-600 hover:text-neutral-950">
                    Gérer →
                  </Link>
                )}
              </div>

              {(kpis.ordersByStatus || []).length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400 bg-[#F8F9FA] rounded-2xl border border-neutral-100">
                  Aucune commande enregistrée pour le moment. Les statuts apparaîtront dès la première commande.
                </div>
              ) : (
                <div className="space-y-3">
                  {(kpis.ordersByStatus || []).map((st) => {
                    const share = Math.round((st.count / totalOrdersForChart) * 100);
                    return (
                      <div key={st.status} className="p-3 rounded-2xl bg-[#F8F9FA] border border-neutral-200/70 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-neutral-900">
                            {ORDER_STATUS_LABEL_MAP[st.status] || st.status}
                          </span>
                          <span className="font-mono text-neutral-700 font-bold">
                            {st.count} ({share}%) &bull; {formatTndCurrency(st.amount)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              st.status === 'DELIVERED'
                                ? 'bg-emerald-500'
                                : st.status === 'CANCELLED'
                                ? 'bg-rose-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.max(5, share)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Operational Tables Row: Recent Orders & Recent Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-neutral-900">
                  Dernières Commandes Clients
                </h3>
                {canSeeOrders && (
                  <Link href="/dashboard/orders" className="text-xs font-bold text-amber-700 hover:underline">
                    Toutes les commandes →
                  </Link>
                )}
              </div>
              {/* Mobile / Tablet List View */}
              <div className="lg:hidden divide-y divide-neutral-100">
                {(kpis.recentOrders || []).length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400">Aucune commande récente.</div>
                ) : (
                  (kpis.recentOrders || []).map((ord) => (
                    <div key={ord.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        {canSeeOrders ? (
                          <Link href={`/dashboard/orders/${ord.id}`} className="font-mono font-bold text-neutral-900 hover:text-amber-700 hover:underline block truncate">
                            {ord.reference}
                          </Link>
                        ) : (
                          <span className="font-mono font-bold text-neutral-900 block truncate">
                            {ord.reference}
                          </span>
                        )}
                        <div className="text-[11px] text-neutral-600 truncate mt-0.5">{ord.customerName}</div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <div className="font-mono font-bold text-neutral-900">{formatTndCurrency(ord.totalAmount)}</div>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 border border-neutral-200 text-neutral-800">
                          {ORDER_STATUS_LABEL_MAP[ord.status] || ord.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px]">
                      <th className="py-2 pr-3">Référence</th>
                      <th className="py-2 pr-3">Client</th>
                      <th className="py-2 pr-3">Statut</th>
                      <th className="py-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(kpis.recentOrders || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-neutral-400">
                          Aucune commande récente.
                        </td>
                      </tr>
                    ) : (
                      (kpis.recentOrders || []).map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#F8F9FA]">
                          <td className="py-2.5 pr-3 font-mono font-bold text-neutral-900">
                            {canSeeOrders ? (
                              <Link href={`/dashboard/orders/${ord.id}`} className="hover:text-amber-700 hover:underline">
                                {ord.reference}
                              </Link>
                            ) : (
                              <span>{ord.reference}</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-neutral-700">{ord.customerName}</td>
                          <td className="py-2.5 pr-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 border border-neutral-200 text-neutral-800">
                              {ORDER_STATUS_LABEL_MAP[ord.status] || ord.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-neutral-900">
                            {formatTndCurrency(ord.totalAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-neutral-900">
                  Derniers Avis &amp; Commentaires
                </h3>
                {canSeeTestimonials && (
                  <Link href="/dashboard/community/testimonials" className="text-xs font-bold text-amber-700 hover:underline">
                    Modérer →
                  </Link>
                )}
              </div>
              <div className="space-y-2.5">
                {(kpis.recentReviews || []).length === 0 ? (
                  <p className="text-xs text-neutral-400 py-6 text-center">Aucun avis récent.</p>
                ) : (
                  (kpis.recentReviews || []).map((rv) => (
                    <div key={rv.id} className="p-3 rounded-2xl bg-[#F8F9FA] border border-neutral-200/70 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-neutral-900 truncate">{rv.authorName}</span>
                        <span className="text-amber-500 font-bold shrink-0">{'★'.repeat(rv.rating)}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">{rv.productName}</div>
                      <p className="text-neutral-700 line-clamp-2">&quot;{rv.body}&quot;</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ROOT-EXCLUSIVE TELEMETRY, SYSTEM SHORTCUTS, SECURITY & BILINGUAL PANELS */}
      {isRoot && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-neutral-900 text-base tracking-tight flex items-center gap-2">
              <Server className="w-4 h-4 text-neutral-900" />
              <span>Infrastructure Système, Facturation &amp; Télémétrie Master ROOT</span>
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full">
              PostgreSQL 17 &bull; NestJS &bull; Next.js
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                <span>Base de données ACID</span>
                <Database className="w-4 h-4 text-neutral-800" />
              </div>
              <div className="text-xl font-heading font-black text-neutral-900">PostgreSQL 17</div>
              <div className="text-[11px] text-neutral-500 flex items-center justify-between">
                <span>Base royal</span>
                <span className="text-emerald-700 font-bold">Connecté (Port 5432)</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                <span>API Gateway NestJS</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-heading font-black text-neutral-900">Port 4000</div>
              <div className="text-[11px] text-neutral-500 flex items-center justify-between">
                <span>Statut API</span>
                <span className="text-emerald-700 font-bold">En ligne</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                <span>Alertes Stock Critique</span>
                <HardDrive className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-heading font-black text-neutral-900 font-mono">{kpis.lowStockCount}</div>
              <div className="text-[11px] text-neutral-500 flex items-center justify-between">
                <span>Seuil &le; 5 unités</span>
                <span className="text-blue-700 font-bold">WH-CENTRAL</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                <span>Sessions &amp; Tokens JWT</span>
                <ShieldCheck className="w-4 h-4 text-neutral-800" />
              </div>
              <div className="text-xl font-heading font-black text-neutral-900">Argon2id + SHA-256</div>
              <div className="text-[11px] text-neutral-500 flex items-center justify-between">
                <span>Garde Anti-Bruteforce</span>
                <span className="text-emerald-700 font-bold">Actif (5 max)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Raccourcis de Haute Administration ROOT
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link
                href="/dashboard/root/roles-permissions"
                className="p-3.5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-center group"
              >
                <Lock className="w-5 h-5 mx-auto text-neutral-700 group-hover:text-neutral-950 mb-1.5" />
                <span className="text-xs font-bold text-neutral-900 block">Rôles &amp; Permissions</span>
                <span className="text-[10px] text-neutral-400">Matrice RBAC</span>
              </Link>

              <Link
                href="/dashboard/root/smtp"
                className="p-3.5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-center group"
              >
                <Mail className="w-5 h-5 mx-auto text-neutral-700 group-hover:text-neutral-950 mb-1.5" />
                <span className="text-xs font-bold text-neutral-900 block">Serveur SMTP</span>
                <span className="text-[10px] text-neutral-400">Envoi de mails</span>
              </Link>

              <Link
                href="/dashboard/root/email-templates"
                className="p-3.5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-center group"
              >
                <FileText className="w-5 h-5 mx-auto text-neutral-700 group-hover:text-neutral-950 mb-1.5" />
                <span className="text-xs font-bold text-neutral-900 block">Modèles d’Emails</span>
                <span className="text-[10px] text-neutral-400">Templates HTML</span>
              </Link>

              <Link
                href="/dashboard/root/reference-prefixes"
                className="p-3.5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-center group"
              >
                <Sliders className="w-5 h-5 mx-auto text-neutral-700 group-hover:text-neutral-950 mb-1.5" />
                <span className="text-xs font-bold text-neutral-900 block">Préfixes &amp; Numéros</span>
                <span className="text-[10px] text-neutral-400">Séquences BC/BL/BE</span>
              </Link>

              <Link
                href="/dashboard/root/tva"
                className="p-3.5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-center group"
              >
                <Percent className="w-5 h-5 mx-auto text-neutral-700 group-hover:text-neutral-950 mb-1.5" />
                <span className="text-xs font-bold text-neutral-900 block">TVA &amp; Timbre Fiscal</span>
                <span className="text-[10px] text-neutral-400">Taux légaux 1.000 DT</span>
              </Link>

              <Link
                href="/dashboard/logs"
                className="p-3.5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition text-center group"
              >
                <Activity className="w-5 h-5 mx-auto text-neutral-700 group-hover:text-neutral-950 mb-1.5" />
                <span className="text-xs font-bold text-neutral-900 block">Journal d’Audit</span>
                <span className="text-[10px] text-neutral-400">Traçabilité complète</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/warehouses"
              className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-sm hover:border-neutral-900 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-neutral-900">Entrepôts &amp; Dépôts</div>
                  <div className="text-[11px] text-neutral-400">WH-CENTRAL &amp; Arborescence</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link
              href="/dashboard/pos"
              className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-sm hover:border-neutral-900 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-neutral-900">Caisse POS Tactile</div>
                  <div className="text-[11px] text-neutral-400">Terminal point de vente</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-7 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-neutral-900 text-sm uppercase tracking-wider">
                Architecture &amp; Sécurité
              </h3>
              <ul className="divide-y divide-neutral-100 text-xs">
                <li className="py-3 flex items-center justify-between">
                  <span className="font-medium text-neutral-700">Chiffrement des Mots de Passe</span>
                  <span className="text-neutral-900 font-semibold bg-neutral-100 px-2.5 py-1 rounded-full text-[11px]">
                    Argon2id (Standard OWASP)
                  </span>
                </li>
                <li className="py-3 flex items-center justify-between">
                  <span className="font-medium text-neutral-700">Jetons de Session</span>
                  <span className="text-neutral-900 font-semibold bg-neutral-100 px-2.5 py-1 rounded-full text-[11px]">
                    JWT 15m + Refresh SHA-256
                  </span>
                </li>
                <li className="py-3 flex items-center justify-between">
                  <span className="font-medium text-neutral-700">Protection Brute-Force</span>
                  <span className="text-neutral-900 font-semibold bg-neutral-100 px-2.5 py-1 rounded-full text-[11px]">
                    Verrouillage après 5 échecs
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-neutral-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-bold text-neutral-900 text-sm uppercase tracking-wider">
                    Système Bilingue (FR / AR)
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
                    Accès ROOT
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed font-light">
                  Le Français (FR) est la langue source de vérité. L’Arabe (AR) est synchronisé avec support natif RTL.
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-100">
                <Link
                  href="/dashboard/translations"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] font-bold text-xs uppercase tracking-wider transition shadow-sm"
                >
                  <Languages className="w-4 h-4" />
                  <span>Gérer les Traductions</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
