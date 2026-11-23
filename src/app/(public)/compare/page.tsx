'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCompareStore } from '@/stores/compare.store';
import { useI18nStore } from '@/stores/i18n.store';
import { StorefrontPageHeader } from '@/components/storefront/StorefrontPageHeader';
import {
  Layers,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Star,
  ArrowRight,
  Sparkles,
  Scale,
  Shield,
  Box,
} from 'lucide-react';

interface CompareItemDetail {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription?: string;
  sellingPrice: number;
  discountPrice?: number | null;
  weightGrams?: number | null;
  dimensions?: any;
  category?: { name: string };
  brand?: { name: string };
  primaryImage: string;
  stockStatus: string;
  availableStock: number;
  rating: number;
  reviewCount: number;
  variants?: Array<{
    id: string;
    sku: string;
    name: string;
    attributes: Record<string, any>;
  }>;
}

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare } = useCompareStore();
  const { t } = useI18nStore();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<CompareItemDetail[]>([]);

  useEffect(() => {
    if (items.length === 0) {
      setDetails([]);
      return;
    }

    const fetchCompareData = async () => {
      setLoading(true);
      try {
        const ids = items.map((i) => i.id).join(',');
        const res = await fetch(`/api/v1/products/compare?ids=${ids}`);
        if (res.ok) {
          const data = await res.json();
          setDetails(data?.data || data || []);
        } else {
          // Fallback map from store items
          setDetails(
            items.map((i) => ({
              id: i.id,
              sku: i.sku,
              name: i.name,
              slug: i.id,
              sellingPrice: i.sellingPrice,
              discountPrice: i.discountPrice,
              primaryImage: i.primaryImage,
              category: i.category,
              brand: i.brand,
              stockStatus: 'IN_STOCK',
              availableStock: 10,
              rating: 5.0,
              reviewCount: 12,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch compare data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompareData();
  }, [items]);

  const formatPrice = (price: number) => {
    return `${price.toFixed(3)} TND`;
  };

  if (items.length === 0) {
    return (
      <div className="py-10 sm:py-12 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <StorefrontPageHeader
          title={t('compare.title')}
          breadcrumbLabel={t('nav.compare')}
          subtitle={t('compare.subtitle')}
          badge={
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs uppercase tracking-widest font-bold text-[var(--royal-gold-dark)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>{t('compare.badge')}</span>
            </div>
          }
        />
        <div className="text-center py-16 sm:py-20 bg-[#F8F9FA] rounded-[32px] border border-neutral-200 p-6 sm:p-8 max-w-3xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 mb-4 shadow-sm">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-[#0C1A14] mb-2">
            {t('compare.empty')}
          </h2>
          <p className="text-sm text-[#6B635B] max-w-md mx-auto mb-6">
            {t('compare.empty_desc')}
          </p>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[var(--royal-primary-hover)] transition shadow-md"
          >
            <span>{t('compare.explore_collections')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-12 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
      <StorefrontPageHeader
        title={`${t('compare.title')} (${items.length}/4)`}
        breadcrumbLabel={t('nav.compare')}
        subtitle={t('compare.subtitle')}
        badge={
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs uppercase tracking-widest font-bold text-[var(--royal-gold-dark)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
            <span>{t('compare.badge')}</span>
          </div>
        }
        rightSlot={
          <>
            <button
              onClick={clearCompare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 text-xs font-semibold tracking-wider transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('compare.clear_compare')}</span>
            </button>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs uppercase tracking-[0.15em] font-semibold hover:bg-[var(--royal-primary-hover)] transition shadow-sm"
            >
              <span>{t('compare.add_more')}</span>
            </Link>
          </>
        }
      />

      {/* Comparison Matrix Table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-40 sm:w-48 p-4 text-left font-sans font-bold tracking-tight text-sm font-semibold text-[#0C1A14] bg-[#F7F5F0] border border-[#ECE7DE] rounded-tl-2xl">
                {t('compare.features')}
              </th>
              {details.map((item) => (
                <th
                  key={item.id}
                  className="p-5 text-center bg-white border border-[#ECE7DE] min-w-[280px] max-w-[320px] align-top"
                >
                  <div className="relative group">
                    <button
                      onClick={() => removeFromCompare(item.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-600 hover:bg-rose-600 hover:text-white shadow-sm transition"
                      title="Retirer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-[#EFECE6] mb-4">
                      <Image
                        src={item.primaryImage || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block mb-1">
                      {item.brand?.name || 'Maison Royal'}
                    </span>
                    <h3 className="text-sm font-semibold text-[#0C1A14] line-clamp-2 h-10">
                      {item.name}
                    </h3>
                    <p className="text-[11px] font-mono text-[#8C827A] mt-1">
                      {item.sku}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-xs text-[#0C1A14] divide-y divide-[#ECE7DE]">
            {/* Price Row */}
            <tr className="hover:bg-[#FAF8F5]">
              <td className="p-4 font-semibold text-[#6B635B] bg-[#F7F5F0] border border-[#ECE7DE]">
                Prix Unitaire (TND)
              </td>
              {details.map((item) => {
                const isPromo = item.discountPrice && item.discountPrice < item.sellingPrice;
                return (
                  <td key={item.id} className="p-4 text-center border border-[#ECE7DE] bg-white">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-base font-bold text-[#0C1A14]">
                        {formatPrice(isPromo ? item.discountPrice! : item.sellingPrice)}
                      </span>
                      {isPromo && (
                        <span className="text-[11px] text-[#A0988E] line-through">
                          {formatPrice(item.sellingPrice)}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Stock Availability */}
            <tr className="hover:bg-[#FAF8F5]">
              <td className="p-4 font-semibold text-[#6B635B] bg-[#F7F5F0] border border-[#ECE7DE]">
                Disponibilité
              </td>
              {details.map((item) => {
                const inStock = item.availableStock > 0;
                return (
                  <td key={item.id} className="p-4 text-center border border-[#ECE7DE] bg-white">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold">
                      {inStock ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">En Stock ({item.availableStock} unités)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span className="text-rose-700">Sur Commande</span>
                        </>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Category */}
            <tr className="hover:bg-[#FAF8F5]">
              <td className="p-4 font-semibold text-[#6B635B] bg-[#F7F5F0] border border-[#ECE7DE]">
                Univers / Catégorie
              </td>
              {details.map((item) => (
                <td key={item.id} className="p-4 text-center border border-[#ECE7DE] bg-white">
                  <span className="px-3 py-1 rounded-full bg-[#F4F1EA] text-[#0C1A14] font-medium">
                    {item.category?.name || 'Gastronomie'}
                  </span>
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr className="hover:bg-[#FAF8F5]">
              <td className="p-4 font-semibold text-[#6B635B] bg-[#F7F5F0] border border-[#ECE7DE]">
                Avis Clients Vérifiés
              </td>
              {details.map((item) => (
                <td key={item.id} className="p-4 text-center border border-[#ECE7DE] bg-white">
                  <div className="flex items-center justify-center gap-1 text-[#D4AF37]">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-[#0C1A14] text-xs">
                      {item.rating?.toFixed(1) || '4.9'}
                    </span>
                    <span className="text-[#8C827A] text-[11px]">
                      ({item.reviewCount || 15} avis)
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Weight */}
            <tr className="hover:bg-[#FAF8F5]">
              <td className="p-4 font-semibold text-[#6B635B] bg-[#F7F5F0] border border-[#ECE7DE]">
                Poids Net
              </td>
              {details.map((item) => (
                <td key={item.id} className="p-4 text-center border border-[#ECE7DE] bg-white font-mono">
                  {item.weightGrams ? `${(item.weightGrams / 1000).toFixed(2)} kg` : '6.50 kg'}
                </td>
              ))}
            </tr>

            {/* Warranty */}
            <tr className="hover:bg-[#FAF8F5]">
              <td className="p-4 font-semibold text-[#6B635B] bg-[#F7F5F0] border border-[#ECE7DE]">
                Garantie Manufacture
              </td>
              {details.map((item) => (
                <td key={item.id} className="p-4 text-center border border-[#ECE7DE] bg-white">
                  <div className="inline-flex items-center gap-1.5 text-emerald-700">
                    <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>À vie (fonte minérale)</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Direct Action */}
            <tr>
              <td className="p-4 font-semibold text-[#6B635B] bg-[#F7F5F0] border border-[#ECE7DE] rounded-bl-2xl">
                Action Rapide
              </td>
              {details.map((item) => (
                <td key={item.id} className="p-4 text-center border border-[#ECE7DE] bg-white">
                  <Link
                    href={`/articles/${item.slug}`}
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] hover:bg-[var(--royal-primary-hover)] text-xs font-semibold tracking-wider uppercase transition shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Voir la pièce</span>
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
