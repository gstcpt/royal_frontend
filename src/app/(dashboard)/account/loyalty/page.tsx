'use client';

import * as React from 'react';
import { Award, Crown, Sparkles, CheckCircle2, ShoppingBag, TrendingUp } from 'lucide-react';
import { Breadcrumb, Badge } from '@/components/ui';
import { fetchAllPaginated } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';

const TIERS = [
  { name: 'Membre Royal Bronze', min: 0, max: 1999, perk: 'Livraison prioritaire dès 150 TND' },
  { name: 'Membre Royal Silver', min: 2000, max: 4999, perk: '3% de remise permanente + SAV VIP' },
  { name: 'Membre Royal Gold', min: 5000, max: 9999, perk: '5% de remise + Accès ventes privées' },
  { name: 'Ambassadeur Privilège', min: 10000, max: Infinity, perk: '8% de remise + Extension garantie offerte' },
];

export default function AccountLoyaltyPage() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { items: list } = await fetchAllPaginated<any>('/orders/my-orders', 100);
        setOrders(Array.isArray(list) ? list : []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const validOrders = orders.filter((o) => !['CANCELLED', 'REFUNDED'].includes(o.status));
  const totalSpent = validOrders.reduce((acc, o) => acc + Number(o.totalAmount || o.total || 0), 0);
  const totalPoints = Math.floor(totalSpent * 10); // 1 TND = 10 points Royal
  const cashValueTnd = Math.floor(totalPoints / 100) * 1; // 100 pts = 1 TND

  const currentTier = TIERS.find((t) => totalPoints >= t.min && totalPoints <= t.max) || TIERS[0];
  const nextTier = TIERS.find((t) => t.min > totalPoints);
  const progressPct = nextTier
    ? Math.min(100, Math.round(((totalPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100))
    : 100;

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: 'Mon Espace Client', href: '/account/home' },
          { label: 'Mes Points de Fidélité' },
        ]}
      />

      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
              Programme de Fidélité VIP Royal
            </h1>
            <p className="text-xs text-slate-500">
              Gagnez 10 points Royal par Dinar dépensé sur vos commandes validées.
            </p>
          </div>
        </div>
        <Badge variant="warning" size="md">
          <Crown className="h-3.5 w-3.5 mr-1 inline" />
          {currentTier.name}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Solde Points Royal</div>
          <div className="text-3xl font-black text-[#9A7414] mt-1 font-mono">
            {loading ? '—' : totalPoints.toLocaleString('fr-FR')} pts
          </div>
          <div className="text-[11px] text-slate-400 mt-1">100 pts = 1,000 TND en avoir</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Valeur Équivalente</div>
          <div className="text-3xl font-black text-[#1D232E] mt-1 font-mono">
            {loading ? '—' : formatTndCurrency(cashValueTnd)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Basé sur {validOrders.length} commande(s)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Progression Palier Suivant</div>
          <div className="text-2xl font-black text-[#1D232E] mt-1">
            {nextTier ? `${nextTier.min - totalPoints} pts restants` : 'Palier Maximum Atteint'}
          </div>
          <div className="w-full bg-[#F4F5F7] rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-[#C59B27] to-[#E6C86E] h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Tiers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => {
          const isActive = tier.name === currentTier.name;
          return (
            <div
              key={tier.name}
              className={`p-5 rounded-2xl border bg-white transition ${
                isActive ? 'border-[#C59B27] ring-1 ring-[#C59B27]/40 bg-[#FBF9F4]' : 'border-[#E6E1D6]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#1D232E]">{tier.name}</span>
                {isActive && <CheckCircle2 className="h-4 w-4 text-[#C59B27]" />}
              </div>
              <div className="text-[11px] font-mono font-bold text-[#9A7414]">
                {tier.min.toLocaleString('fr-FR')} {tier.max === Infinity ? '+' : `- ${tier.max.toLocaleString('fr-FR')}`} pts
              </div>
              <p className="text-xs text-slate-500 mt-2">{tier.perk}</p>
            </div>
          );
        })}
      </div>

      {/* Points Ledger from Orders */}
      <div className="bg-white rounded-3xl border border-[#E6E1D6] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E6E1D6] bg-[#FBF9F4] flex items-center justify-between">
          <h2 className="text-sm font-heading font-black text-[#1D232E] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#C59B27]" />
            <span>Historique des Points Acquis</span>
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {validOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Passez votre première commande sur Royal pour cumuler des points VIP.
            </div>
          ) : (
            validOrders.slice(0, 12).map((o) => {
              const pts = Math.floor(Number(o.totalAmount || o.total || 0) * 10);
              return (
                <div key={o.id} className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-[#FBF9F4]/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#FBF6E8] text-[#9A7414]">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#1D232E]">Commande {o.orderNumber || o.id.slice(0, 8)}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString('fr-FR')} • {formatTndCurrency(Number(o.totalAmount || o.total || 0))}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-black text-emerald-700">+{pts.toLocaleString('fr-FR')} pts</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
