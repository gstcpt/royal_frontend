'use client';

import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

const ICONS = [Truck, RotateCcw, ShieldCheck, Headphones];
const DEFAULT_PROPOSITIONS = [
  { title: 'Livraison Express 24h', subtitle: 'Partout en Tunisie avec suivi en direct' },
  { title: 'Garantie Constructeur 2 Ans', subtitle: 'Pièces de rechange et SAV officiel' },
  { title: 'Paiement Sécurisé', subtitle: 'Paiement à la livraison ou ClicToPay' },
  { title: 'Service Client Dédié', subtitle: 'Conseillers experts joignables 7j/7' },
];

export function ValuePropositionBar() {
  const { config } = useCmsConfig();
  const custom = config.views.home.valuePropsItems;
  const propositions = (Array.isArray(custom) && custom.length === 4 ? custom : DEFAULT_PROPOSITIONS).map(
    (item, index) => ({
      ...item,
      icon: ICONS[index % ICONS.length],
    })
  );

  return (
    <section className="py-12 bg-[#F4F5F7] border-y border-[#E6E1D6]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {propositions.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-[#E6E1D6] shadow-sm flex items-center gap-4 transition hover:-translate-y-0.5 hover:border-[#C59B27]/50 duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#B8860B] flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-5 h-5 text-[#C59B27]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1D232E] tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
