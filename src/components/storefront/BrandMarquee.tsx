'use client';

import React from 'react';
import Link from 'next/link';

interface BrandMarqueeProps {
  brands?: Array<{ name: string; slug?: string }>;
}

export function BrandMarquee({ brands: propBrands }: BrandMarqueeProps) {
  const defaultBrands = [
    { name: 'ROYAL', slug: '' },
    { name: 'DSP', slug: 'dsp' },
  ];

  const rawBrands = propBrands && propBrands.length > 0 ? propBrands : defaultBrands;
  // Ensure smooth infinite marquee across active catalog brands
  const brands = rawBrands.length < 6 ? Array.from({ length: Math.ceil(10 / rawBrands.length) }, () => rawBrands).flat() : rawBrands;

  return (
    <section className="py-7 bg-[#F4F5F7] border-y border-neutral-200 overflow-hidden relative marquee-hover-pause">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#F4F5F7] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#F4F5F7] to-transparent z-10 pointer-events-none" />

      <div className="flex w-max animate-marquee gap-14 items-center">
        {[...brands, ...brands].map((b, index) => (
          <Link
            key={index}
            href={b.slug ? `/articles?brand=${b.slug}` : '/articles'}
            className="text-xs sm:text-sm font-heading font-extrabold tracking-widest uppercase text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer whitespace-nowrap"
          >
            {b.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
