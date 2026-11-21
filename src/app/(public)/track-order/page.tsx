'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Package, Truck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function TrackOrderPage() {
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <span className="text-xs uppercase font-semibold text-[#D4AF37] tracking-widest block mb-2">
          Service Client Maison Royal
        </span>
        <h1 className="font-sans font-bold tracking-tight text-3xl sm:text-4xl text-[#0C1A14] font-medium tracking-tight mb-3">
          Suivi de votre Colis
        </h1>
        <p className="text-sm text-[#0C1A14]/70 max-w-md mx-auto">
          Renseignez votre référence de commande et votre contact (email ou téléphone) pour visualiser l'état d'expédition en direct.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] p-8 shadow-sm mb-10">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                Référence de commande *
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="Ex: CMD-20261111-4521"
                className="w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FBF9F5] text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0C1A14]/80 mb-1">
                Email ou Téléphone renseigné *
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="votre.email@domaine.tn ou +216 ..."
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
              <span>Recherche en cours...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Consulter l'acheminement</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Order Status Display */}
      {order && (
        <div className="bg-white rounded-3xl border border-[#EFECE6] p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFECE6] pb-4">
            <div>
              <span className="text-[11px] text-[#0C1A14]/50 uppercase tracking-widest block">Commande</span>
              <span className="font-mono text-lg font-bold text-[#0C1A14]">{order.reference}</span>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Statut : {order.status}
              </span>
            </div>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className={`p-3 rounded-xl border ${order.status ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-[#FBF9F5] border-[#EFECE6]'}`}>
              1. Validée
            </div>
            <div className={`p-3 rounded-xl border ${['PROCESSING', 'PREPARING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-[#FBF9F5] border-[#EFECE6] opacity-60'}`}>
              2. En Préparation
            </div>
            <div className={`p-3 rounded-xl border ${['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-[#FBF9F5] border-[#EFECE6] opacity-60'}`}>
              3. En Cours d'Acheminement
            </div>
            <div className={`p-3 rounded-xl border ${order.status === 'DELIVERED' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-[#FBF9F5] border-[#EFECE6] opacity-60'}`}>
              4. Livrée
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              href={`/order-confirmation/${order.reference}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#0C1A14] hover:text-[#D4AF37] font-semibold tracking-wider uppercase transition"
            >
              <span>Voir le récapitulatif détaillé</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
