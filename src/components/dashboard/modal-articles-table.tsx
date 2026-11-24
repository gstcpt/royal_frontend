'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Package, Warehouse, ExternalLink, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Badge, Modal, Button } from '@/components/ui';
import { formatTndCurrency, cn } from '@/lib/utils';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';

export interface ModalProductItem {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  discountPrice?: number;
  primaryImage?: string;
  images?: string[];
  category?: { name: string };
  brand?: { id?: string; name: string };
  dimensionsJson?: Record<string, any>;
  variantsCount?: number;
  variants?: any[];
  isFeatured?: boolean;
  status?: string;
}

interface ModalArticlesTableProps {
  articles: ModalProductItem[];
  title?: string;
  subtitle?: string;
  pageSize?: number;
}

export function ModalArticlesTable({
  articles,
  title,
  subtitle,
  pageSize = 12,
}: ModalArticlesTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPageSize, setCurrentPageSize] = React.useState<number>(pageSize || 12);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter articles
  const filteredArticles = React.useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase().trim();
    return articles.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.sku.toLowerCase().includes(q) ||
        a.category?.name?.toLowerCase().includes(q) ||
        a.brand?.name?.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / currentPageSize));
  const paginatedArticles = React.useMemo(() => {
    const start = (currentPage - 1) * currentPageSize;
    return filteredArticles.slice(start, start + currentPageSize);
  }, [filteredArticles, currentPage, currentPageSize]);

  return (
    <div className="space-y-4">
      {/* Search Bar & Total Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par libellé, SKU, catégorie..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>Total :</span>
          <strong className="text-neutral-900 font-bold bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
            {filteredArticles.length} article(s)
          </strong>
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="p-10 text-center text-neutral-400 text-xs bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-neutral-400" />
          <p className="font-semibold text-neutral-700">Aucun article ne correspond à votre recherche</p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Modifiez vos termes de recherche ou vérifiez l'association des articles.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile / Tablet List View */}
          <div className="md:hidden divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {paginatedArticles.map((item) => {
              const isLive = item.status === 'ACTIVE' || !item.status;
              const totalStock = item.dimensionsJson?.stockQuantity ?? 24;
              const isLow = totalStock <= 3;
              const variantsCount = item.variantsCount || item.variants?.length || 1;
              const imgSrc = item.primaryImage || item.images?.[0];
              return (
                <div key={`mob-${item.id}`} className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="relative w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                      {imgSrc ? (
                        <Image src={imgSrc} alt={item.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-neutral-900 line-clamp-2">{item.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400 mt-0.5">{item.sku}</div>
                    </div>
                    <Badge variant={isLive ? 'success' : 'neutral'} size="sm">
                      {isLive ? 'En ligne' : 'Masqué'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                    <span className="font-bold text-neutral-900">{formatTndCurrency(item.sellingPrice)}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                          isLow
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        )}
                      >
                        {totalStock} u.
                      </span>
                      <span className="text-[10px] text-neutral-500">{variantsCount} var.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3.5">Article & Référence</th>
                <th className="py-2.5 px-3">Rayon / Catégorie</th>
                <th className="py-2.5 px-3 text-right">Prix Public</th>
                <th className="py-2.5 px-3 text-center">Stock Total</th>
                <th className="py-2.5 px-3 text-center">Déclinaisons</th>
                <th className="py-2.5 px-3 text-center">Visibilité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedArticles.map((item) => {
                const isLive = item.status === 'ACTIVE' || !item.status;
                const totalStock = item.dimensionsJson?.stockQuantity ?? 24;
                const isLow = totalStock <= 3;
                const variantsCount = item.variantsCount || item.variants?.length || 1;
                const imgSrc = item.primaryImage || item.images?.[0];

                return (
                  <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                    {/* 1. Article & Référence */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-9 h-9 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                          {imgSrc ? (
                            <Image src={imgSrc} alt={item.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <ImageIcon className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-neutral-900 text-xs truncate max-w-xs">{item.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-400">
                            <span className="font-mono">{item.sku}</span>
                            {item.isFeatured && (
                              <span className="text-amber-600 font-semibold text-[9px] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                ★ Vedette
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Rayon / Catégorie */}
                    <td className="py-2.5 px-3 text-xs">
                      <div className="font-medium text-neutral-800">{item.category?.name || 'Général'}</div>
                      {item.brand && (
                        <div className="text-[11px] text-neutral-400">{item.brand.name}</div>
                      )}
                    </td>

                    {/* 3. Prix Public */}
                    <td className="py-2.5 px-3 text-right text-xs">
                      <div className="font-bold text-neutral-900">{formatTndCurrency(item.sellingPrice)}</div>
                      {item.discountPrice && Number(item.discountPrice) < Number(item.sellingPrice) && (
                        <div className="text-[10px] text-red-600 font-medium">
                          Promo: {formatTndCurrency(item.discountPrice)}
                        </div>
                      )}
                    </td>

                    {/* 4. Stock Total */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                          isLow
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        )}
                      >
                        <Warehouse className="w-3 h-3 opacity-70" />
                        <span>{totalStock} unités</span>
                      </span>
                    </td>

                    {/* 5. Déclinaisons */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                        {variantsCount} variante(s)
                      </span>
                    </td>

                    {/* 6. Visibilité */}
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={isLive ? 'success' : 'neutral'} size="sm">
                        {isLive ? 'En ligne' : 'Masqué'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}

      {/* Pagination Controls */}
      {filteredArticles.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-500">
            <span>Par page :</span>
            <select
              value={currentPageSize}
              onChange={(e) => {
                setCurrentPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Articles par page"
              className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-800 cursor-pointer"
            >
              {[6, 12, 24, 48, 96].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-neutral-400">
              Page {currentPage} sur {totalPages}
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                title="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface RelatedArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  articles: ModalProductItem[];
  pageSize?: number;
}

export function RelatedArticlesModal({
  isOpen,
  onClose,
  title,
  subtitle,
  articles,
  pageSize = 12,
}: RelatedArticlesModalProps) {
  const { isRouteVisible } = useRouteVisibility();
  const canSeeArticles = isRouteVisible('/dashboard/articles');
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle || `${articles.length} article(s) référencé(s) au catalogue`}
      type="custom"
      size="4xl"
      className="max-w-6xl w-full"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          {canSeeArticles ? (
            <Link
              href="/dashboard/articles"
              className="text-xs text-neutral-600 hover:text-neutral-950 font-semibold flex items-center gap-1.5 transition"
            >
              <Package className="w-3.5 h-3.5 text-neutral-500" />
              <span>Ouvrir la gestion complète des articles</span>
            </Link>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
            className="text-xs py-1.5 px-4 cursor-pointer"
          >
            Fermer
          </Button>
        </div>
      }
    >
      <div className="p-6">
        <ModalArticlesTable articles={articles} pageSize={pageSize} />
      </div>
    </Modal>
  );
}
