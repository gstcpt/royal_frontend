'use client';

import React, { useEffect, useState, useTransition, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard, StorefrontProduct } from '@/components/storefront/ProductCard';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';
import { getSafeImageUrl } from '@/lib/cart-session';
import {
  Filter,
  ArrowUpDown,
  X,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  List,
  Percent,
  PanelLeftClose,
  PanelLeftOpen,
  Boxes,
  Sliders,
  Check,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  productsCount?: number;
}

interface BrandItem {
  id: string;
  name: string;
  slug: string;
}

interface VariantFacet {
  id: string;
  name: string;
  code: string;
  options: Array<{ label: string; value: string; colorHex?: string | null }>;
}

interface CharacteristicFacet {
  id: string;
  code: string;
  name: string;
  options: Array<{ value: string; count: number }>;
}

function LuxuryDropdown({
  value,
  options,
  onChange,
  icon,
  ariaLabel,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((p) => !p)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8F9FA] hover:bg-white border border-neutral-200 hover:border-neutral-900 text-xs font-bold text-neutral-900 transition shadow-2xs cursor-pointer"
      >
        {icon}
        <span>{current?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-neutral-200 shadow-2xl py-1.5 z-50">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                  active
                    ? 'bg-amber-50/90 text-neutral-950 font-bold'
                    : 'text-neutral-700 hover:bg-neutral-50 font-medium'
                }`}
              >
                <span>{opt.label}</span>
                {active && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ArticlesContent() {
  const { config } = useCmsConfig();
  const { locale, t } = useI18nStore();
  const articlesCfg = config.views.articles;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [variantFacets, setVariantFacets] = useState<VariantFacet[]>([]);
  const [charFacets, setCharFacets] = useState<CharacteristicFacet[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Collapsible Left Filter Sidebar + Display Mode + Grid Columns (3 / 4)
  const [isSidebarOpen, setIsSidebarOpen] = useState(articlesCfg.showSidebarFiltersByDefault !== false);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>(articlesCfg.defaultColumns === 'list' ? 'list' : 'grid');
  const [gridCols, setGridCols] = useState<3 | 4>(
    articlesCfg.defaultColumns === '3' ? 3 : 4
  );

  useEffect(() => {
    const isSmall = typeof window !== 'undefined' && window.innerWidth < 1024;
    setIsSidebarOpen(!isSmall && articlesCfg.showFiltersSection !== false && articlesCfg.showSidebarFiltersByDefault !== false);
    if (isSmall || articlesCfg.defaultColumns === 'list') {
      setDisplayMode('list');
    } else if (articlesCfg.defaultColumns === '3') {
      setDisplayMode('grid');
      setGridCols(3);
    } else {
      setDisplayMode('grid');
      setGridCols(4);
    }
  }, [articlesCfg.defaultColumns, articlesCfg.showSidebarFiltersByDefault, articlesCfg.showFiltersSection]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1023px)');
    const onResize = (ev: MediaQueryListEvent) => {
      if (ev.matches) {
        setIsSidebarOpen(false);
        setDisplayMode('list');
      } else {
        setIsSidebarOpen(articlesCfg.showFiltersSection !== false && articlesCfg.showSidebarFiltersByDefault !== false);
        setDisplayMode(articlesCfg.defaultColumns === 'list' ? 'list' : 'grid');
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', onResize);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onResize);
    };
  }, [articlesCfg.defaultColumns, articlesCfg.showSidebarFiltersByDefault, articlesCfg.showFiltersSection]);
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({});
  const [openCharCodes, setOpenCharCodes] = useState<Record<string, boolean>>({
    puissance: true,
    garantie: true,
    capacite: true,
  });

  // URL-synced filters (supporting multi-select categories, brands, variants, chars)
  const selectedCategories = useMemo(
    () => (searchParams.get('category') || '').split(',').map((s) => s.trim()).filter(Boolean),
    [searchParams]
  );
  const selectedBrands = useMemo(
    () => (searchParams.get('brand') || '').split(',').map((s) => s.trim()).filter(Boolean),
    [searchParams]
  );
  const selectedVariantOpts = useMemo(
    () => (searchParams.get('variantOptions') || '').split(',').map((s) => s.trim()).filter(Boolean),
    [searchParams]
  );
  const selectedChars = useMemo<Record<string, string[]>>(() => {
    const raw = searchParams.get('chars');
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }, [searchParams]);

  const selectedSort = searchParams.get('sortBy') || 'newest';
  const searchQuery = searchParams.get('q') || '';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const promoOnly = searchParams.get('collection') === 'promo' || selectedSort === 'promo';
  const urlMinPrice = searchParams.get('minPrice') || '';
  const urlMaxPrice = searchParams.get('maxPrice') || '';
  const urlTargetIds = useMemo(
    () => (searchParams.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean),
    [searchParams],
  );
  const currentPage = Math.max(1, Number(searchParams.get('page') || 1) || 1);
  const perPage = Math.min(96, Math.max(12, Number(searchParams.get('limit') || articlesCfg.defaultItemsPerPage || 24) || 24));

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [minPriceInput, setMinPriceInput] = useState(urlMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(urlMaxPrice);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setMinPriceInput(urlMinPrice);
    setMaxPriceInput(urlMaxPrice);
  }, [urlMinPrice, urlMaxPrice]);

  // Load Categories (strictly non-empty categories), Brands, and Variant/Characteristic Facets
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, brandRes, facetsRes] = await Promise.all([
          fetch('/api/v1/categories?tree=false'),
          fetch('/api/v1/brands'),
          fetch('/api/v1/products/storefront-facets'),
        ]);

        if (catRes.ok) {
          const cd = await catRes.json();
          const list = cd?.data || cd || [];
          if (Array.isArray(list)) {
            const valid = list.filter(
              (c: any) => c.isActive !== false && Number(c.productsCount ?? c._count?.products ?? 0) > 0
            );
            setCategories(valid);
            const defaultExpanded: Record<string, boolean> = {};
            valid.forEach((c: any) => {
              if (!c.parentId) defaultExpanded[c.id] = true;
            });
            setExpandedCatIds(defaultExpanded);
          }
        }
        if (brandRes.ok) {
          const bd = await brandRes.json();
          const blist = bd?.data || bd || [];
          if (Array.isArray(blist)) {
            setBrands(blist.filter((b: any) => b.isActive !== false));
          }
        }
        if (facetsRes.ok) {
          const fd = await facetsRes.json();
          const payload = fd?.data || fd;
          if (Array.isArray(payload?.variantFamilies)) setVariantFacets(payload.variantFamilies);
          if (Array.isArray(payload?.characteristics)) setCharFacets(payload.characteristics);
        }
      } catch (err) {
        console.error('Failed loading catalog metadata/facets', err);
      }
    }
    loadMeta();
  }, []);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.set('page', '1');
    startTransition(() => {
      router.push(`/articles?${params.toString()}`, { scroll: false });
    });
  };

  // Auto-filter when typing search or editing min/max prices (no Apply button required!)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (
        localSearch.trim() !== searchQuery ||
        minPriceInput.trim() !== urlMinPrice ||
        maxPriceInput.trim() !== urlMaxPrice
      ) {
        updateQuery({
          q: localSearch.trim() || null,
          minPrice: minPriceInput.trim() || null,
          maxPrice: maxPriceInput.trim() || null,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, minPriceInput, maxPriceInput]);

  // Fetch Storefront Articles dynamically on any filter change
  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const effectiveCategories =
          selectedCategories.length > 0
            ? selectedCategories
            : articlesCfg.targetType === 'CATEGORIES' && Array.isArray(articlesCfg.targetCategorySlugs)
            ? articlesCfg.targetCategorySlugs
            : [];
        const effectiveTargetIds =
          urlTargetIds.length > 0
            ? urlTargetIds
            : articlesCfg.targetType === 'ARTICLES' &&
              selectedCategories.length === 0 &&
              selectedBrands.length === 0 &&
              !searchQuery &&
              Array.isArray(articlesCfg.targetProductIds)
            ? articlesCfg.targetProductIds
            : [];

        if (effectiveCategories.length > 0) params.set('category', effectiveCategories.join(','));
        if (selectedBrands.length > 0) params.set('brand', selectedBrands.join(','));
        if (selectedVariantOpts.length > 0) params.set('variantOptions', selectedVariantOpts.join(','));
        if (Object.keys(selectedChars).length > 0) params.set('chars', JSON.stringify(selectedChars));
        if (selectedSort) params.set('sortBy', selectedSort);
        if (searchQuery) params.set('search', searchQuery);
        if (inStockOnly) params.set('inStock', 'true');
        if (promoOnly) params.set('collection', 'promo');
        if (urlMinPrice) params.set('minPrice', urlMinPrice);
        if (urlMaxPrice) params.set('maxPrice', urlMaxPrice);
        params.set('page', effectiveTargetIds.length > 0 ? '1' : String(currentPage));
        params.set('limit', effectiveTargetIds.length > 0 ? '200' : String(perPage));

        const res = await fetch(`/api/v1/products/storefront?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          let list = data?.data?.data || data?.data || data?.products || [];
          const meta = data?.data?.meta || data?.meta;
          if (effectiveTargetIds.length > 0 && Array.isArray(list)) {
            list = list.filter((p: any) => effectiveTargetIds.includes(p.id));
            setProducts(list);
            setTotalCount(list.length);
            setTotalPages(1);
          } else {
            setProducts(list);
            setTotalCount(Number(meta?.total ?? list.length));
            setTotalPages(Math.max(1, Number(meta?.totalPages ?? Math.ceil((meta?.total ?? list.length) / perPage))));
          }
        }
      } catch (err) {
        console.error('Failed fetching storefront articles', err);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [
    selectedCategories,
    selectedBrands,
    selectedVariantOpts,
    selectedChars,
    selectedSort,
    searchQuery,
    inStockOnly,
    promoOnly,
    urlMinPrice,
    urlMaxPrice,
    urlTargetIds,
    articlesCfg.targetType,
    articlesCfg.targetCategorySlugs,
    articlesCfg.targetProductIds,
    currentPage,
    perPage,
  ]);

  const toggleCategorySlug = (slug: string) => {
    const next = selectedCategories.includes(slug)
      ? selectedCategories.filter((s) => s !== slug)
      : [...selectedCategories, slug];
    updateQuery({ category: next.length > 0 ? next.join(',') : null });
  };

  const toggleBrandSlug = (slug: string) => {
    const next = selectedBrands.includes(slug)
      ? selectedBrands.filter((s) => s !== slug)
      : [...selectedBrands, slug];
    updateQuery({ brand: next.length > 0 ? next.join(',') : null });
  };

  const toggleVariantOption = (optVal: string) => {
    const next = selectedVariantOpts.includes(optVal)
      ? selectedVariantOpts.filter((v) => v !== optVal)
      : [...selectedVariantOpts, optVal];
    updateQuery({ variantOptions: next.length > 0 ? next.join(',') : null });
  };

  const toggleCharacteristicValue = (code: string, val: string) => {
    const currentList = selectedChars[code] || [];
    const nextList = currentList.includes(val)
      ? currentList.filter((v) => v !== val)
      : [...currentList, val];
    const nextObj = { ...selectedChars };
    if (nextList.length > 0) nextObj[code] = nextList;
    else delete nextObj[code];
    updateQuery({ chars: Object.keys(nextObj).length > 0 ? JSON.stringify(nextObj) : null });
  };

  const goToPage = (targetPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(Math.max(1, Math.min(totalPages, targetPage))));
    startTransition(() => {
      router.push(`/articles?${params.toString()}`);
    });
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setMinPriceInput('');
    setMaxPriceInput('');
    startTransition(() => {
      router.push('/articles');
    });
  };

  // Build hierarchical category tree from flat list (already filtered to >0 active articles)
  const categoryTree = useMemo(() => {
    const childrenMap = new Map<string, CategoryItem[]>();
    const roots: CategoryItem[] = [];
    for (const c of categories) {
      if (c.parentId) {
        if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
        childrenMap.get(c.parentId)!.push(c);
      } else {
        roots.push(c);
      }
    }
    return { roots, childrenMap };
  }, [categories]);

  const renderCategoryNode = (cat: CategoryItem, depth = 0) => {
    const children = categoryTree.childrenMap.get(cat.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = Boolean(expandedCatIds[cat.id]);
    const isChecked = selectedCategories.includes(cat.slug);
    const count = Number(cat.productsCount ?? 0);

    return (
      <div key={cat.id} className="space-y-0.5">
        <div
          className={`flex items-center justify-between gap-1.5 py-1.5 px-2 rounded-xl transition ${
            isChecked ? 'bg-amber-50/80 text-neutral-950' : 'hover:bg-[#F4F5F7] text-neutral-800'
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpandedCatIds((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                aria-label={isExpanded ? 'Replier' : 'Déplier'}
                className="p-0.5 rounded hover:bg-neutral-200/70 text-neutral-500 shrink-0 cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCategorySlug(cat.slug)}
                className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-950 focus:ring-0 shrink-0 cursor-pointer"
              />
              <span className={`truncate ${depth === 0 ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                {cat.name}
              </span>
            </label>
          </div>

          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
            {count}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {children.map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const activeFiltersCount =
    selectedCategories.length +
    selectedBrands.length +
    selectedVariantOpts.length +
    Object.values(selectedChars).reduce((acc, list) => acc + list.length, 0) +
    (searchQuery ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (promoOnly ? 1 : 0) +
    (urlMinPrice || urlMaxPrice ? 1 : 0);

  const gridClassName =
    gridCols === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="py-8 md:py-12 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
      {/* Page Title */}
      {articlesCfg.showHeaderBanner !== false && (
        <div
          className={`mb-6 ${
            articlesCfg.headerImageUrl
              ? 'relative rounded-3xl overflow-hidden border border-[#E6E1D6] bg-white p-6 sm:p-10 shadow-xs'
              : ''
          }`}
        >
          {articlesCfg.headerImageUrl && (
            <>
              <img
                src={getSafeImageUrl(articlesCfg.headerImageUrl)}
                alt={articlesCfg.headerTitle || 'Catalogue Royal'}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/70" />
            </>
          )}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs uppercase tracking-widest font-bold text-[var(--royal-gold-dark)] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>{locale === 'ar' ? t('catalog.badge') : (articlesCfg.headerBadge || `${config?.appName || 'Royal'} • Électro de Maison`)}</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-5xl font-black text-[var(--royal-ink)] tracking-tight">
              {locale === 'ar' ? t('catalog.title') : (articlesCfg.headerTitle || t('catalog.title'))}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-neutral-500 max-w-2xl font-normal">
              {locale === 'ar' ? t('catalog.subtitle') : (articlesCfg.headerSubtitle || t('catalog.subtitle'))}
            </p>
          </div>
        </div>
      )}

      {/* Unified Top Toolbar: [Toggle Sidebar Icon] -> [Article Count] -> [Search Input] -> [Grid/List, 3/4/6, PerPage, Sort] */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-200 shadow-sm mb-6 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
          {/* 1. First Position: Sidebar Toggle Icon aligned above Filter Sidebar */}
          {articlesCfg.showFiltersSection !== false && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              title={isSidebarOpen ? t('actions.hide_filters') : t('actions.show_filters')}
              aria-label={isSidebarOpen ? t('actions.hide_filters') : t('actions.show_filters')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F4F5F7] border border-neutral-200 hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] text-xs font-bold text-neutral-900 transition cursor-pointer shrink-0"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              <span className="hidden sm:inline">{t('actions.filters')}</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {/* 2. Article Count Display */}
          <span className="text-xs font-medium text-neutral-500 sm:whitespace-nowrap">
            {totalCount > 0 ? (
              <>
                {t('catalog.showing')}{' '}
                <strong className="text-neutral-950">
                  {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, totalCount)}
                </strong>{' '}
                {t('catalog.of')} <strong className="text-neutral-950">{totalCount}</strong> {t('catalog.articles_word')}
              </>
            ) : (
              <>
                <strong className="text-neutral-950">{products.length}</strong> {t('catalog.articles_word')}
              </>
            )}
          </span>

          {/* 3. Search Input right after the article count in the exact same line */}
          <div className="relative basis-full sm:basis-auto sm:flex-1 min-w-0 sm:min-w-[200px] w-full sm:w-auto sm:max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={t('catalog.search_placeholder')}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F8F9FA] border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-950 transition"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Right Controls: 3 Icon-Only Display Modes (3 cols | 4 cols | List) + Limit + Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center bg-[#F4F5F7] p-1 rounded-xl border border-neutral-200 gap-0.5">
            {/* Mode 1: Grid 3 Columns */}
            <button
              type="button"
              onClick={() => {
                setDisplayMode('grid');
                setGridCols(3);
              }}
              title="Grille 3 colonnes"
              aria-label="Grille 3 colonnes"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                displayMode === 'grid' && gridCols === 3
                  ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
                  : 'text-slate-500 hover:text-[var(--royal-ink)]'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect x="1.5" y="2" width="3.5" height="5" rx="0.8" />
                <rect x="6.25" y="2" width="3.5" height="5" rx="0.8" />
                <rect x="11" y="2" width="3.5" height="5" rx="0.8" />
                <rect x="1.5" y="9" width="3.5" height="5" rx="0.8" />
                <rect x="6.25" y="9" width="3.5" height="5" rx="0.8" />
                <rect x="11" y="9" width="3.5" height="5" rx="0.8" />
              </svg>
            </button>

            {/* Mode 2: Grid 4 Columns */}
            <button
              type="button"
              onClick={() => {
                setDisplayMode('grid');
                setGridCols(4);
              }}
              title="Grille 4 colonnes"
              aria-label="Grille 4 colonnes"
              className={`hidden sm:flex p-1.5 rounded-lg transition cursor-pointer ${
                displayMode === 'grid' && gridCols === 4
                  ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
                  : 'text-slate-500 hover:text-[var(--royal-ink)]'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect x="1" y="2.5" width="2.6" height="4.8" rx="0.6" />
                <rect x="4.8" y="2.5" width="2.6" height="4.8" rx="0.6" />
                <rect x="8.6" y="2.5" width="2.6" height="4.8" rx="0.6" />
                <rect x="12.4" y="2.5" width="2.6" height="4.8" rx="0.6" />
                <rect x="1" y="8.8" width="2.6" height="4.8" rx="0.6" />
                <rect x="4.8" y="8.8" width="2.6" height="4.8" rx="0.6" />
                <rect x="8.6" y="8.8" width="2.6" height="4.8" rx="0.6" />
                <rect x="12.4" y="8.8" width="2.6" height="4.8" rx="0.6" />
              </svg>
            </button>

            {/* Mode 3: List View */}
            <button
              type="button"
              onClick={() => setDisplayMode('list')}
              title="Vue Liste"
              aria-label="Vue Liste"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                displayMode === 'list'
                  ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
                  : 'text-slate-500 hover:text-[var(--royal-ink)]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <LuxuryDropdown
            ariaLabel={t('catalog.per_page_aria')}
            value={String(perPage)}
            onChange={(val) => updateQuery({ limit: val })}
            options={[
              { value: '12', label: `12 ${t('catalog.per_page_suffix')}` },
              { value: '24', label: `24 ${t('catalog.per_page_suffix')}` },
              { value: '36', label: `36 ${t('catalog.per_page_suffix')}` },
              { value: '60', label: `60 ${t('catalog.per_page_suffix')}` },
              { value: '96', label: `96 ${t('catalog.per_page_suffix')}` },
            ]}
          />

          <LuxuryDropdown
            ariaLabel={t('catalog.sort_aria')}
            value={selectedSort}
            onChange={(val) => updateQuery({ sortBy: val })}
            icon={<ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />}
            options={[
              { value: 'newest', label: t('catalog.sort_newest') },
              { value: 'promo', label: t('catalog.sort_promo') },
              { value: 'price_asc', label: t('catalog.sort_price_asc') },
              { value: 'price_desc', label: t('catalog.sort_price_desc') },
              { value: 'popular', label: t('catalog.sort_popular') },
            ]}
          />
        </div>
      </div>

      {/* Main Content Layout */}
      <div
        className={`flex flex-col ${
          articlesCfg.filterPosition === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'
        } gap-7 items-start`}
      >
        {/* Collapsible Filter Sidebar (Left or Right via CMS — Zero Apply Button — Instant Auto-Filter) */}
        {isSidebarOpen && (
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-5 bg-white p-5 rounded-[26px] border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-900">
                <Filter className="w-4 h-4 text-amber-600" />
                <span>{t('catalog.dynamic_filters')}</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  {t('catalog.reset')} ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Categories Tree (Multi-Select, hiding empty categories) */}
            {articlesCfg.showCategoryFilter !== false && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                  {t('catalog.categories_subcategories')} ({categories.length})
                </label>
                <div className="space-y-0.5 max-h-80 overflow-y-auto pr-1">
                  {categoryTree.roots.map((root) => renderCategoryNode(root, 0))}
                </div>
              </div>
            )}

            {/* Price Range (Auto-Filter) */}
            {articlesCfg.showPriceFilter !== false && (
              <div className="space-y-2 pt-3 border-t border-neutral-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                  {t('catalog.budget_tnd')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    placeholder={t('catalog.min_dt')}
                    className="w-full px-3 py-2 text-xs bg-[#F8F9FA] border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                  />
                  <input
                    type="number"
                    min={0}
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    placeholder={t('catalog.max_dt')}
                    className="w-full px-3 py-2 text-xs bg-[#F8F9FA] border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            )}

            {/* Brands (Multi-Select Auto-Filter) */}
            {articlesCfg.showBrandFilter !== false && (
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                  {t('catalog.brands_official')}
                </label>
                <div className="space-y-1">
                  {brands.map((b) => {
                    const checked = selectedBrands.includes(b.slug);
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition ${
                          checked ? 'bg-amber-50/80 font-bold text-neutral-950' : 'hover:bg-[#F4F5F7] text-neutral-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBrandSlug(b.slug)}
                          className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-950 cursor-pointer"
                        />
                        <span>{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variants Filter (Dynamic from DB) */}
            {articlesCfg.showCharacteristicsFilter !== false && variantFacets.length > 0 && (
              <div className="pt-3 border-t border-neutral-100 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <Boxes className="w-3.5 h-3.5 text-amber-600" />
                  <span>Variantes</span>
                </div>
                {variantFacets.map((vf) => (
                  <div key={vf.id} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-neutral-800">{vf.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {vf.options.map((opt) => {
                        const active = selectedVariantOpts.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleVariantOption(opt.value)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition cursor-pointer ${
                              active
                                ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] font-bold shadow-sm'
                                : 'bg-[#F8F9FA] text-neutral-700 border-neutral-200 hover:border-[var(--royal-primary)]/50'
                            }`}
                          >
                            {opt.colorHex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: opt.colorHex }}
                              />
                            )}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Characteristics Filter (Dynamic from DB) */}
            {articlesCfg.showCharacteristicsFilter !== false && charFacets.length > 0 && (
              <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>Caractéristiques</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {charFacets.map((ch) => {
                    const isOpen = Boolean(openCharCodes[ch.code]);
                    const chosen = selectedChars[ch.code] || [];
                    return (
                      <div key={ch.id} className="border border-neutral-100 rounded-xl p-2 bg-[#FBFBFC]">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenCharCodes((prev) => ({ ...prev, [ch.code]: !prev[ch.code] }))
                          }
                          className="w-full flex items-center justify-between text-xs font-bold text-neutral-800 cursor-pointer"
                        >
                          <span>
                            {ch.name}
                            {chosen.length > 0 && (
                              <span className="ml-1.5 text-[10px] text-amber-700">({chosen.length})</span>
                            )}
                          </span>
                          {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
                            {ch.options.map((opt) => {
                              const checked = chosen.includes(opt.value);
                              return (
                                <label
                                  key={opt.value}
                                  className="flex items-center justify-between gap-2 text-[11px] text-neutral-700 cursor-pointer hover:text-neutral-950"
                                >
                                  <span className="flex items-center gap-1.5 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleCharacteristicValue(ch.code, opt.value)}
                                      className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-950 cursor-pointer shrink-0"
                                    />
                                    <span className="truncate">{opt.value}</span>
                                  </span>
                                  <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                                    {opt.count}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Toggles (Auto-Filter) */}
            <div className="pt-3 border-t border-neutral-100 space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-neutral-800">
                <input
                  type="checkbox"
                  checked={promoOnly}
                  onChange={(e) =>
                    updateQuery({
                      collection: e.target.checked ? 'promo' : null,
                      sortBy: !e.target.checked && selectedSort === 'promo' ? 'newest' : selectedSort || null,
                    })
                  }
                  className="w-4 h-4 rounded text-rose-600 border-neutral-300"
                />
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-600" />
                  {t('catalog.promo_only')}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-neutral-800">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => updateQuery({ inStock: e.target.checked ? 'true' : null })}
                  className="w-4 h-4 rounded text-neutral-950 border-neutral-300"
                />
                <span>{t('catalog.in_stock_only')}</span>
              </label>
            </div>
          </aside>
        )}

        {/* Right Main Catalog */}
        <main className="flex-1 min-w-0 space-y-6 w-full">
          {/* Active Filter Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedCategories.map((slug) => (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F5F7] text-xs font-semibold text-neutral-900 border border-neutral-200"
                >
                  Rayon: {slug}
                  <button type="button" onClick={() => toggleCategorySlug(slug)} className="cursor-pointer">
                    <X className="w-3.5 h-3.5 hover:text-rose-600" />
                  </button>
                </span>
              ))}
              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F5F7] text-xs font-semibold text-neutral-900 border border-neutral-200"
                >
                  Marque: {b}
                  <button type="button" onClick={() => toggleBrandSlug(b)} className="cursor-pointer">
                    <X className="w-3.5 h-3.5 hover:text-rose-600" />
                  </button>
                </span>
              ))}
              {selectedVariantOpts.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-xs font-semibold text-amber-900 border border-amber-200"
                >
                  Variante: {v}
                  <button type="button" onClick={() => toggleVariantOption(v)} className="cursor-pointer">
                    <X className="w-3.5 h-3.5 hover:text-rose-600" />
                  </button>
                </span>
              ))}
              {Object.entries(selectedChars).flatMap(([code, vals]) =>
                vals.map((val) => (
                  <span
                    key={`${code}-${val}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-blue-900 border border-blue-200"
                  >
                    {code}: {val}
                    <button type="button" onClick={() => toggleCharacteristicValue(code, val)} className="cursor-pointer">
                      <X className="w-3.5 h-3.5 hover:text-rose-600" />
                    </button>
                  </span>
                ))
              )}
              {(urlMinPrice || urlMaxPrice) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F5F7] text-xs font-semibold text-neutral-900 border border-neutral-200">
                  Budget: {urlMinPrice || '0'} – {urlMaxPrice || '∞'} TND
                  <button
                    type="button"
                    onClick={() => updateQuery({ minPrice: null, maxPrice: null })}
                    className="cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 hover:text-rose-600" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Articles Grid / List */}
          {loading ? (
            <div className={`grid gap-6 ${gridClassName}`}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-2xl bg-neutral-100 animate-pulse border border-neutral-200"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 sm:py-20 text-center bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8">
              <p className="font-heading font-black text-xl text-neutral-900">
                {t('catalog.empty_title')}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                {t('catalog.empty_desc')}
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-6 px-6 py-3 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs uppercase tracking-wider font-bold shadow-md hover:bg-[var(--royal-primary-hover)] transition cursor-pointer"
              >
                {t('catalog.reset')}
              </button>
            </div>
          ) : displayMode === 'list' ? (
            <div className="space-y-4">
              {products.map((p, idx) => (
                <ProductCard key={p.id} product={p} priority={idx < 3} layout="list" />
              ))}
            </div>
          ) : (
            <div className={`grid gap-5 ${gridClassName}`}>
              {products.map((p, idx) => (
                <ProductCard key={p.id} product={p} priority={idx < 4} layout="grid" />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('table.prev_page')}
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((pg) => pg === 1 || pg === totalPages || Math.abs(pg - currentPage) <= 2)
                .map((pg, idx, arr) => (
                  <React.Fragment key={pg}>
                    {idx > 0 && arr[idx - 1] !== pg - 1 && (
                      <span className="px-2 text-xs text-neutral-400">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => goToPage(pg)}
                      className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        pg === currentPage
                          ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] shadow-sm'
                          : 'bg-white text-slate-700 border-[var(--royal-border)] hover:bg-[var(--royal-gold-light)]'
                      }`}
                    >
                      {pg}
                    </button>
                  </React.Fragment>
                ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer"
              >
                {t('table.next_page')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[1720px] mx-auto px-4 py-20 text-center text-neutral-400 text-xs">
          Chargement du catalogue officiel Royal...
        </div>
      }
    >
      <ArticlesContent />
    </Suspense>
  );
}
