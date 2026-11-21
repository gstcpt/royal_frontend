'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function BottomPromoFloatingCard() {
  return (
    <section className="py-20 bg-white">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="relative h-[440px] sm:h-[480px] rounded-[36px] overflow-hidden border border-neutral-200 shadow-xl flex items-center justify-center p-6">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1800&q=85"
            alt="Royal Électro de Maison — Ambiance Culinaire"
            className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.68]"
          />

          <div className="relative z-10 max-w-lg w-full bg-white/95 backdrop-blur-xl rounded-[32px] p-8 sm:p-12 text-center shadow-2xl border border-white">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#F4F5F7] text-neutral-900 text-[11px] uppercase tracking-widest font-extrabold mb-4">
              Vente Flash Spéciale
            </span>

            <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              Équipez Votre Cuisine avec l’Excellence Royal
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-neutral-500 font-normal leading-relaxed">
              Profitez de remises immédiates sur nos équipements électroménagers Royal. Livraison rapide partout en Tunisie.
            </p>

            <div className="mt-7 flex justify-center">
              <Link
                href="/articles?sortBy=promo"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] hover:bg-[var(--royal-primary-hover)] transition-all text-xs uppercase tracking-widest font-bold shadow-lg"
              >
                <span>Explorer les Promotions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
