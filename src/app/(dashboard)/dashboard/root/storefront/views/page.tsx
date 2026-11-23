'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sliders,
  Save,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  FileText,
  Home,
  Package,
  Eye,
  EyeOff,
  Mail,
  Shield,
  Store,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  LayoutGrid,
  Sparkles,
  MapPin,
  ShieldCheck,
  Filter,
  MousePointerClick,
  ListOrdered,
  MessageSquareQuote,
  Award,
  ExternalLink,
  Search,
  Check,
  Target,
  Tag,
  X,
} from 'lucide-react';
import { Button, Input, Textarea, Toggle, Select, Breadcrumb, Toast } from '@/components/ui';
import { ImageDropzoneCropper } from '@/components/ui/image-dropzone-cropper';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { getSafeImageUrl } from '@/lib/cart-session';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';

const VIEW_TABS = [
  { id: 'home', label: "Page d'accueil", icon: Home, publicHref: '/' },
  { id: 'articles', label: 'Tous les articles', icon: Package, publicHref: '/articles' },
  { id: 'product-detail', label: "Détails de l'article", icon: Eye, publicHref: '/articles' },
  { id: 'contact', label: 'Contact', icon: Mail, publicHref: '/contact' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, publicHref: '/faq' },
  { id: 'terms', label: 'Conditions générales', icon: FileText, publicHref: '/terms' },
  { id: 'privacy', label: 'Politique de confidentialité', icon: Shield, publicHref: '/privacy' },
  { id: 'showrooms', label: "Salle d'exposition", icon: Store, publicHref: '/stores' },
];

interface ElementMeta {
  id: string;
  label: string;
  summary: string;
  icon: React.ReactNode;
  visibilityKey?: string;
}

const DEFAULT_VALUE_PROPS = [
  { title: 'Livraison Express 24h', subtitle: 'Partout en Tunisie avec suivi en direct' },
  { title: 'Garantie Constructeur 2 Ans', subtitle: 'Pièces de rechange et SAV officiel' },
  { title: 'Paiement Sécurisé', subtitle: 'Paiement à la livraison ou ClicToPay' },
  { title: 'Service Client Dédié', subtitle: 'Conseillers experts joignables 7j/7' },
];

const DEFAULT_EDITORIAL_CARDS = [
  { title: 'Expédition 24–48h', desc: 'Vers tous les gouvernorats tunisiens' },
  { title: 'Garantie Officielle', desc: 'SAV dédié et pièces de rechange' },
  { title: 'Showrooms Royal', desc: 'Accueil & démonstration en magasin' },
];

const DEFAULT_TRUST_BADGES = [
  { title: 'Livraison 24–48h', subtitle: 'Toute la Tunisie' },
  { title: 'Garantie Constructeur', subtitle: 'Officielle Royal' },
  { title: 'Paiement Livraison', subtitle: 'Espèces à réception' },
];

function AccordionElementCard({
  index,
  total,
  title,
  summary,
  icon,
  isOpen,
  onToggleOpen,
  visible,
  onToggleVisible,
  isDragging,
  onDragStart,
  onDrop,
  onMoveUp,
  onMoveDown,
  children,
}: {
  index: number;
  total: number;
  title: string;
  summary: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggleOpen: () => void;
  visible?: boolean;
  onToggleVisible?: (val: boolean) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDrop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`rounded-2xl border transition-all bg-white ${
        isDragging
          ? 'border-[var(--royal-primary)] bg-[var(--royal-gold-light)]/50 opacity-75'
          : isOpen
          ? 'border-[var(--royal-primary)]/60 shadow-md'
          : 'border-[var(--royal-border)] hover:border-[var(--royal-primary)]/40 shadow-2xs'
      }`}
    >
      {/* Card Accordion Header */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            title="Glisser pour réorganiser l'ordre"
            className="p-1.5 rounded-xl bg-[var(--royal-gold-light)]/70 border border-[var(--royal-border)] text-[var(--royal-primary)] cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-lg bg-[var(--royal-silver-light)] border border-[var(--royal-border)] text-[var(--royal-gold-dark)] shrink-0">
            #{index + 1}
          </span>
          <div className="w-9 h-9 rounded-xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[var(--royal-primary)] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[var(--royal-ink)] truncate">{title}</h3>
              {visible === false && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  Masqué
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{summary}</p>
          </div>
        </div>

        {/* Right Controls: Visibility Toggle + Up/Down + Détails Button (Open/Close Icon) */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleVisible && typeof visible === 'boolean' && (
            <button
              type="button"
              onClick={() => onToggleVisible(!visible)}
              title={visible ? 'Masquer cet élément' : 'Afficher cet élément'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                visible
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{visible ? 'Visible' : 'Masqué'}</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              title="Monter"
              className="p-1.5 rounded-lg border border-[var(--royal-border)] bg-white hover:bg-[var(--royal-gold-light)] text-[var(--royal-ink)] disabled:opacity-30 cursor-pointer transition"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              title="Descendre"
              className="p-1.5 rounded-lg border border-[var(--royal-border)] bg-white hover:bg-[var(--royal-gold-light)] text-[var(--royal-ink)] disabled:opacity-30 cursor-pointer transition"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleOpen}
            aria-expanded={isOpen}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isOpen
                ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] shadow-xs'
                : 'bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border-[var(--royal-border)] hover:border-[var(--royal-primary)]'
            }`}
          >
            <span>{isOpen ? 'Fermer' : 'Détails'}</span>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Details Editor */}
      {isOpen && (
        <div className="px-4 sm:px-6 pb-6 pt-4 border-t border-[var(--royal-border)] bg-[var(--royal-bg)]/50 space-y-4 rounded-b-2xl">
          {children}
        </div>
      )}
    </div>
  );
}

function CmsImageFieldWithPreview({
  label,
  value,
  onChange,
  aspectRatio,
  hint,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  aspectRatio?: number;
  hint?: string;
}) {
  const resolvedSrc = value ? getSafeImageUrl(value) || value : '';

  return (
    <div className="p-4 rounded-2xl bg-white border border-[var(--royal-border)] space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7 space-y-2.5">
          <ImageDropzoneCropper
            label={label}
            value={value}
            onChange={onChange}
            aspectRatio={aspectRatio}
            minBytes={1024}
            hint={hint || 'Glissez-déposez un fichier (PNG, JPG, WEBP, SVG • max 10 Mo) ou collez une URL.'}
          />
          <Input
            label="Ou URL directe de l'image"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... ou /uploads/..."
          />
        </div>

        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-[#E6E1D6] bg-[#FBF9F4] p-3 justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9A7414] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Aperçu Visuel</span>
            </span>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Effacer</span>
              </button>
            )}
          </div>

          <div className="w-full h-44 rounded-xl bg-white border border-[#E6E1D6] overflow-hidden flex items-center justify-center">
            {resolvedSrc ? (
              <img
                src={resolvedSrc}
                alt={label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-slate-400 space-y-1 p-4">
                <ImageIcon className="w-7 h-7 mx-auto opacity-40" />
                <p className="text-[11px] font-medium">Aucune image sélectionnée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DynamicTargetSelector({
  label,
  targetType,
  onTargetTypeChange,
  selectedCategories,
  onCategoriesChange,
  selectedProducts,
  onProductsChange,
  categories,
  products,
  allowCategoriesOption = true,
  allowArticlesOption = true,
  allowCustomUrl = false,
  customUrlValue = '',
  onCustomUrlChange,
  singleProductOnly = false,
}: {
  label: string;
  targetType: string;
  onTargetTypeChange: (val: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (slugs: string[]) => void;
  selectedProducts: string[];
  onProductsChange: (ids: string[]) => void;
  categories: Array<{ id: string; name: string; slug: string; productCount?: number; productsCount?: number }>;
  products: Array<{ id: string; name: string; slug: string; sku?: string; primaryImage?: string; sellingPrice?: number; discountPrice?: number }>;
  allowCategoriesOption?: boolean;
  allowArticlesOption?: boolean;
  allowCustomUrl?: boolean;
  customUrlValue?: string;
  onCustomUrlChange?: (val: string) => void;
  singleProductOnly?: boolean;
}) {
  const [catQuery, setCatQuery] = React.useState('');
  const [prodQuery, setProdQuery] = React.useState('');
  const [showAllCats, setShowAllCats] = React.useState(false);

  const options = [
    { value: 'AUTO', label: 'Automatique (Règle par défaut du bloc)' },
    ...(allowCategoriesOption ? [{ value: 'CATEGORIES', label: 'Catégories / Rayons (Multi-sélection)' }] : []),
    ...(allowArticlesOption
      ? [{ value: 'ARTICLES', label: singleProductOnly ? 'Article Précis' : 'Articles Précis (Multi-sélection)' }]
      : []),
    ...(allowCustomUrl ? [{ value: 'CUSTOM_URL', label: 'Lien URL Personnalisé' }] : []),
  ];

  const filteredCategories = categories.filter((c) =>
    !catQuery.trim()
      ? true
      : c.name.toLowerCase().includes(catQuery.toLowerCase()) || c.slug.toLowerCase().includes(catQuery.toLowerCase()),
  );
  const visibleCategories = showAllCats || catQuery.trim() ? filteredCategories : filteredCategories.slice(0, 18);

  const filteredProducts = products
    .filter((p) =>
      !prodQuery.trim()
        ? true
        : p.name.toLowerCase().includes(prodQuery.toLowerCase()) ||
          (p.sku || '').toLowerCase().includes(prodQuery.toLowerCase()),
    )
    .slice(0, 12);

  const toggleCat = (slug: string) => {
    const next = selectedCategories.includes(slug)
      ? selectedCategories.filter((s) => s !== slug)
      : [...selectedCategories, slug];
    onCategoriesChange(next);
  };

  const toggleProd = (id: string) => {
    if (singleProductOnly) {
      onProductsChange(selectedProducts.includes(id) ? [] : [id]);
      return;
    }
    const next = selectedProducts.includes(id)
      ? selectedProducts.filter((x) => x !== id)
      : [...selectedProducts, id];
    onProductsChange(next);
  };

  return (
    <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[var(--royal-border)] space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
        <Select
          label={label}
          value={targetType || 'AUTO'}
          onChange={(e) => onTargetTypeChange(e.target.value)}
          options={options}
        />
        {allowCustomUrl && targetType === 'CUSTOM_URL' ? (
          <Input
            label="URL Cible"
            value={customUrlValue || ''}
            onChange={(e) => onCustomUrlChange?.(e.target.value)}
            placeholder="/articles?category=cuisine"
          />
        ) : (
          <div className="p-2.5 rounded-xl bg-white border border-[var(--royal-border)] text-[11px] text-slate-600 flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
            <span>
              {targetType === 'CATEGORIES'
                ? `${selectedCategories.length} catégorie(s) ciblée(s)`
                : targetType === 'ARTICLES'
                ? `${selectedProducts.length} article(s) sélectionné(s)`
                : 'Source automatique alimentée en direct depuis la base.'}
            </span>
          </div>
        )}
      </div>

      {targetType === 'CATEGORIES' && (
        <div className="space-y-2.5 pt-2 border-t border-[var(--royal-border)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
                placeholder="Filtrer les catégories..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--royal-border)] bg-white text-xs focus:outline-none focus:border-[var(--royal-primary)]"
              />
            </div>
            {selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => onCategoriesChange([])}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Tout effacer ({selectedCategories.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {visibleCategories.map((cat) => {
              const active = selectedCategories.includes(cat.slug);
              return (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => toggleCat(cat.slug)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                    active
                      ? 'bg-[var(--royal-gold-light)] border-[var(--royal-primary)] text-[var(--royal-ink)] font-bold'
                      : 'bg-white border-[var(--royal-border)] text-slate-600 hover:border-[var(--royal-primary)]'
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-[var(--royal-primary)] shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 text-[var(--royal-gold-dark)] shrink-0" />}
                </button>
              );
            })}
          </div>

          {!showAllCats && !catQuery.trim() && filteredCategories.length > 18 && (
            <button
              type="button"
              onClick={() => setShowAllCats(true)}
              className="text-xs font-bold text-[var(--royal-gold-dark)] hover:underline cursor-pointer"
            >
              Afficher toutes les catégories ({filteredCategories.length})
            </button>
          )}
        </div>
      )}

      {targetType === 'ARTICLES' && (
        <div className="space-y-2.5 pt-2 border-t border-[var(--royal-border)]">
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedProducts.map((pid) => {
                const prod = products.find((p) => p.id === pid);
                return (
                  <span
                    key={pid}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-primary)] text-[11px] font-bold text-[var(--royal-ink)]"
                  >
                    <span className="max-w-[180px] truncate">{prod?.name || pid.slice(0, 8)}</span>
                    <button
                      type="button"
                      onClick={() => toggleProd(pid)}
                      className="text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={prodQuery}
              onChange={(e) => setProdQuery(e.target.value)}
              placeholder="Rechercher un article actif par nom ou SKU..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--royal-border)] bg-white text-xs focus:outline-none focus:border-[var(--royal-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredProducts.map((prod) => {
              const active = selectedProducts.includes(prod.id);
              const imgUrl = prod.primaryImage ? getSafeImageUrl(prod.primaryImage) : '';
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => toggleProd(prod.id)}
                  className={`flex items-center justify-between gap-2.5 p-2 rounded-xl border text-left transition cursor-pointer ${
                    active
                      ? 'bg-[var(--royal-gold-light)] border-[var(--royal-primary)] font-bold'
                      : 'bg-white border-[var(--royal-border)] hover:border-[var(--royal-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#FBF9F4] border border-[#E6E1D6] overflow-hidden shrink-0 flex items-center justify-center">
                      {imgUrl ? (
                        <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-[var(--royal-ink)] truncate">{prod.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {Number(prod.discountPrice || prod.sellingPrice || 0).toFixed(3)} TND
                      </div>
                    </div>
                  </div>
                  {active && <Check className="w-4 h-4 text-[var(--royal-gold-dark)] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StorefrontViewsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isRouteVisible } = useRouteVisibility();
  const activeView = searchParams.get('view') || 'home';

  const [views, setViews] = React.useState<any>({
    home: {
      showHeroSlider: true,
      showBrandMarquee: true,
      heroAutoplayMs: 6000,
      heroHeightPx: 720,
      heroAnimation: 'slide',
      cardImageHeightPx: 280,
      sectionOrder: [
        'hero',
        'categories',
        'valueProps',
        'newArrivals',
        'editorialBanner',
        'topRated',
        'lifestyle',
        'promotions',
        'featuredVideo',
        'testimonials',
        'newsletter',
      ],
      valuePropsItems: DEFAULT_VALUE_PROPS,
      editorialCards: DEFAULT_EDITORIAL_CARDS,
      showCategoriesCarousel: true,
      showValueProps: true,
      showNewArrivals: true,
      showFeaturedVideo: true,
      showTopRated: true,
      showEditorialBanner: true,
      showPromotions: true,
      showLifestyleGallery: true,
      showTestimonials: true,
      showNewsletter: true,
    },
    articles: {
      sectionOrder: ['header', 'filters', 'grid', 'actions', 'pagination'],
      showHeaderBanner: true,
      headerBadge: 'Catalogue Officiel',
      headerTitle: 'Tous nos Articles',
      headerSubtitle: 'Découvrez l’ensemble de notre sélection électroménager et culinaire avec livraison 24–48h en Tunisie.',
      headerImageUrl: '',
      showFiltersSection: true,
      filterPosition: 'left',
      showCategoryFilter: true,
      showPriceFilter: true,
      showBrandFilter: true,
      showCharacteristicsFilter: true,
      defaultColumns: '3',
      defaultItemsPerPage: 24,
      cardImageHeightPx: 260,
      showCompareButton: true,
      showWishlistButton: true,
      showQuickViewButton: true,
      showBuyButton: true,
      showLikeDislike: true,
      showSidebarFiltersByDefault: true,
      showPageSizeSelector: true,
      targetType: 'AUTO',
      targetCategorySlugs: [],
      targetProductIds: [],
    },
    productDetail: {
      sectionOrder: ['breadcrumb', 'gallery', 'purchaseInfo', 'trustBadges', 'tabs', 'related'],
      showBreadcrumb: true,
      showDescription: true,
      descriptionTabLabel: 'Description Détaillée',
      showReviews: true,
      reviewsTabLabel: 'Avis & Commentaires',
      showRatings: true,
      showSpecs: true,
      specsTabLabel: 'Fiche Technique',
      showDeliveryTab: false,
      deliveryTabLabel: 'Livraison & Garantie',
      showRelatedProducts: true,
      relatedTitle: 'Vous aimerez aussi',
      relatedSubtitle: 'Complétez votre équipement Royal avec notre sélection sur-mesure.',
      relatedDisplayMode: 'grid',
      relatedColumns: '4',
      relatedLimit: 4,
      relatedTargetType: 'AUTO',
      relatedTargetCategorySlugs: [],
      relatedTargetProductIds: [],
      extraRecommendedBlocks: [],
      showShareButton: true,
      showWishlist: true,
      showCompare: true,
      showLikeDislike: true,
      showTrustBadges: true,
      trustBadges: DEFAULT_TRUST_BADGES,
      addToCartText: 'Ajouter au panier',
      enableImageZoom: true,
      enableImageAutoplay: true,
      galleryPosition: 'left',
      imageDisplayMode: 'thumbnails-bottom',
      imageAnimation: 'zoom-hover',
      imageObjectFit: 'cover',
      mediaColumnSpan: 7,
      galleryHeightPx: 540,
      defaultTab: 'desc',
    },
    contact: {
      sectionOrder: ['hero', 'mainGrid', 'map'],
      badgeText: 'Service Client Royal',
      title: 'Contactez Notre Équipe',
      subtitle: 'Une question sur un appareil, un suivi de livraison ou une demande de devis ? Écrivez-nous directement.',
      showMap: true,
      mapTitle: 'Localisation — Royal Electro de Maison',
      mapHeightPx: 380,
      mapEmbedUrl:
        'https://www.openstreetmap.org/export/embed.html?bbox=11.028%2C35.485%2C11.088%2C35.525&layer=mapnik&marker=35.5047%2C11.0622',
      showInfoCards: true,
      showSocials: true,
      layoutDirection: 'info-left',
      infoTitle: 'Royal — Electro de Maison',
      infoSubtitle: 'Équipement culinaire et électroménager partout en Tunisie.',
      formTitle: 'Envoyer un message',
      formSubtitle: 'Votre demande est transmise directement à l’administration pour une réponse rapide.',
      submitText: 'Envoyer le message',
      phoneRequired: true,
      emailRequired: false,
      subjectRequired: true,
    },
    faq: {
      sectionOrder: ['hero', 'categories', 'questions', 'cta'],
      badgeText: 'Centre d’Aide Royal',
      title: 'Foire Aux Questions (FAQ)',
      subtitle: 'Retrouvez toutes les réponses concernant la livraison en Tunisie, la garantie et nos produits.',
      showSearch: true,
      showCategoryFilter: true,
      showCta: true,
      ctaTitle: 'Vous ne trouvez pas votre réponse ?',
      ctaSubtitle: 'Notre service client répond à vos questions par message ou téléphone.',
      ctaButtonText: 'Contacter le Support',
    },
    terms: {
      sectionOrder: ['header', 'document', 'footerNote'],
      showBackLink: true,
      badgeText: 'Informations Légales Royal',
      showFooterNote: true,
      footerNoteText: 'Document mis à jour conformément à la réglementation tunisienne du commerce électronique.',
    },
    privacy: {
      sectionOrder: ['header', 'document', 'footerNote'],
      showBackLink: true,
      badgeText: 'Protection des Données',
      showFooterNote: true,
      footerNoteText: 'Pour toute demande relative à vos données personnelles, contactez royaltn24@gmail.com.',
    },
    showrooms: {
      enabled: true,
      sectionOrder: ['hero', 'cards', 'map'],
      badgeText: 'Réseau de Points de Vente',
      title: "Nos Salles d'Exposition",
      subtitle: 'Découvrez nos showrooms en Tunisie pour tester nos appareils et retirer vos commandes.',
      layoutStyle: 'grid',
      showMap: true,
      mapHeightPx: 380,
      mapEmbedUrl:
        'https://www.openstreetmap.org/export/embed.html?bbox=11.028%2C35.485%2C11.088%2C35.525&layer=mapnik&marker=35.5047%2C11.0622',
      showHours: true,
      showPhone: true,
    },
  });

  // Accordions state: strictly ALL CLOSED by default!
  const [openAccordions, setOpenAccordions] = React.useState<Record<string, boolean>>({});
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);

  const [faqItems, setFaqItems] = React.useState<any[]>([]);
  const [dragFaqIdx, setDragFaqIdx] = React.useState<number | null>(null);
  const [newFaq, setNewFaq] = React.useState({ category: 'Livraison & Commandes', question: '', answer: '', sortOrder: 0 });
  const [editingFaqId, setEditingFaqId] = React.useState<string | null>(null);

  const [termsPage, setTermsPage] = React.useState({ title: 'Conditions Générales de Vente', subtitle: '', content: '' });
  const [privacyPage, setPrivacyPage] = React.useState({ title: 'Politique de Confidentialité', subtitle: '', content: '' });

  const defaultHeroSlides = React.useMemo(
    () => [
      {
        id: 'slide-1',
        tagline: 'INNOVATION CULINAIRE & CONFORT',
        title: 'L’Art de Vivre.',
        highlightText: 'La Précision Culinaire.',
        subtitle:
          'Découvrez notre collection exclusive d’équipements culinaires, friteuses sans huile, robots pétrins et appareils conçus pour durer.',
        primaryCtaText: 'Explorer la Collection',
        primaryCtaLink: '/articles',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=90',
      },
      {
        id: 'slide-2',
        tagline: 'GROS ÉLECTROMÉNAGER & CUISSON',
        title: 'Fours & Plaques.',
        highlightText: 'Ingénierie & Performance.',
        subtitle:
          'Chaleur tournante, foyers haute puissance et finitions inox brossé. Équipez votre cuisine avec les références les plus fiables.',
        primaryCtaText: 'Voir les Nouveautés',
        primaryCtaLink: '/articles?sortBy=newest',
        imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1920&q=90',
      },
      {
        id: 'slide-3',
        tagline: 'OFFRES PRIVILÈGES ROYAL',
        title: 'Équipez Votre Maison.',
        highlightText: 'Qualité & Prix Directs.',
        subtitle:
          'Profitez de nos promotions actives avec garantie constructeur et livraison rapide partout dans les 24 gouvernorats de Tunisie.',
        primaryCtaText: 'Voir les Promotions',
        primaryCtaLink: '/articles?sortBy=promo',
        imageUrl: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1920&q=90',
      },
    ],
    [],
  );

  const [heroSlides, setHeroSlides] = React.useState<any[]>(defaultHeroSlides);
  const [cmsCategories, setCmsCategories] = React.useState<any[]>([]);
  const [cmsProducts, setCmsProducts] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  // Close all accordions whenever active view switches
  React.useEffect(() => {
    setOpenAccordions({});
    setDragIdx(null);
  }, [activeView]);

  const loadAll = React.useCallback(async () => {
    try {
      const [cfg, faqs, terms, privacy, catsRes, prodsRes] = await Promise.all([
        fetchApi('/storefront-cms/config').catch(() => null),
        fetchApi('/storefront-cms/admin/faq-all').catch(() => []),
        fetchApi('/storefront-cms/pages/terms').catch(() => null),
        fetchApi('/storefront-cms/pages/privacy').catch(() => null),
        fetchApi('/categories?tree=false').catch(() => []),
        fetchAllPaginated<any>('/products/storefront', 200)
          .then(({ items }) => ({ data: items }))
          .catch(() => ({ data: [] })),
      ]);
      const rawCats = Array.isArray(catsRes) ? catsRes : catsRes?.data || [];
      setCmsCategories(rawCats);
      const rawProds = Array.isArray(prodsRes) ? prodsRes : prodsRes?.data || [];
      setCmsProducts(rawProds);
      if (cfg?.views) {
        setViews((prev: any) => ({
          home: { ...prev.home, ...(cfg.views.home || {}) },
          articles: { ...prev.articles, ...(cfg.views.articles || {}) },
          productDetail: { ...prev.productDetail, ...(cfg.views.productDetail || {}) },
          contact: { ...prev.contact, ...(cfg.views.contact || {}) },
          faq: { ...prev.faq, ...(cfg.views.faq || {}) },
          terms: { ...prev.terms, ...(cfg.views.terms || {}) },
          privacy: { ...prev.privacy, ...(cfg.views.privacy || {}) },
          showrooms: { ...prev.showrooms, ...(cfg.views.showrooms || {}) },
        }));
      }
      if (Array.isArray(cfg?.heroSlides)) {
        const validSlides = cfg.heroSlides.filter(
          (s: any) =>
            s &&
            typeof s === 'object' &&
            !Array.isArray(s) &&
            ((typeof s.title === 'string' && s.title.trim() !== '') ||
              (typeof s.imageUrl === 'string' && s.imageUrl.trim() !== '')),
        );
        if (validSlides.length > 0) setHeroSlides(validSlides);
        else setHeroSlides(defaultHeroSlides);
      }
      if (Array.isArray(faqs)) setFaqItems(faqs);
      if (terms) setTermsPage({ title: terms.title || '', subtitle: terms.subtitle || '', content: terms.content || '' });
      if (privacy) setPrivacyPage({ title: privacy.title || '', subtitle: privacy.subtitle || '', content: privacy.content || '' });
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveViews = async () => {
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/cms/views', {
        method: 'PATCH',
        body: JSON.stringify({ views, heroSlides }),
      });
      if (activeView === 'terms') {
        await fetchApi('/storefront-cms/pages/terms', {
          method: 'PATCH',
          body: JSON.stringify(termsPage),
        });
      }
      if (activeView === 'privacy') {
        await fetchApi('/storefront-cms/pages/privacy', {
          method: 'PATCH',
          body: JSON.stringify(privacyPage),
        });
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
      setToastMsg('Éléments, ordre et réglages enregistrés et appliqués sur le Storefront !');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setResetting(true);
    try {
      await fetchApi('/storefront-cms/cms/reset-defaults', { method: 'POST' });
      await loadAll();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
      setToastMsg('Paramètres CMS réinitialisés par défaut.');
    } finally {
      setResetting(false);
    }
  };

  const handleSaveFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    setSaving(true);
    try {
      if (editingFaqId) {
        await fetchApi(`/storefront-cms/faq/${editingFaqId}`, {
          method: 'PATCH',
          body: JSON.stringify(newFaq),
        });
        setToastMsg('Question FAQ mise à jour.');
      } else {
        await fetchApi('/storefront-cms/faq', {
          method: 'POST',
          body: JSON.stringify({ ...newFaq, isActive: true }),
        });
        setToastMsg('Question FAQ ajoutée.');
      }
      setEditingFaqId(null);
      setNewFaq({ category: 'Livraison & Commandes', question: '', answer: '', sortOrder: faqItems.length + 1 });
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    await fetchApi(`/storefront-cms/faq/${id}`, { method: 'DELETE' });
    setToastMsg('Question FAQ supprimée.');
    await loadAll();
  };

  const handleFaqDrop = async (targetIdx: number) => {
    if (dragFaqIdx === null || dragFaqIdx === targetIdx) return;
    const next = [...faqItems];
    const [moved] = next.splice(dragFaqIdx, 1);
    next.splice(targetIdx, 0, moved);
    const updated = next.map((item, i) => ({ ...item, sortOrder: i + 1 }));
    setFaqItems(updated);
    setDragFaqIdx(null);
    await fetchApi('/storefront-cms/faq/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds: updated.map((i) => i.id) }),
    });
    setToastMsg('Ordre des questions FAQ mis à jour.');
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const moveOrder = (viewKey: string, list: string[], fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= list.length) return;
    const next = [...list];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setViews((prev: any) => ({
      ...prev,
      [viewKey]: { ...prev[viewKey], sectionOrder: next },
    }));
  };

  // Map route param -> key inside `views` state
  const viewStateKey = activeView === 'product-detail' ? 'productDetail' : activeView;

  const elementCatalogByView: Record<string, ElementMeta[]> = {
    home: [
      { id: 'hero', label: 'Slider Héro Principal + Barre Marques', summary: `${heroSlides.length} slide(s) · ${views.home.heroHeightPx ?? 720}px · ${views.home.heroAnimation || 'slide'}`, icon: <ImageIcon className="w-4 h-4" />, visibilityKey: 'showHeroSlider' },
      { id: 'categories', label: 'Carrousel Catégories', summary: `Titre : "${views.home.categoriesTitle || 'Explorer par Catégories'}"`, icon: <LayoutGrid className="w-4 h-4" />, visibilityKey: 'showCategoriesCarousel' },
      { id: 'valueProps', label: '4 Cartes Engagements Livraison & SAV', summary: `${(views.home.valuePropsItems || DEFAULT_VALUE_PROPS).length} cartes éditables`, icon: <ShieldCheck className="w-4 h-4" />, visibilityKey: 'showValueProps' },
      { id: 'newArrivals', label: 'Carrousel Nouveautés', summary: `Titre : "${views.home.newArrivalsTitle || 'Nouveautés'}" · ${views.home.newArrivalsLimit ?? 16} max`, icon: <Sparkles className="w-4 h-4" />, visibilityKey: 'showNewArrivals' },
      { id: 'featuredVideo', label: 'Coup de Cœur • Dernier Ajout', summary: `Badge : "${views.home.featuredVideoTag || 'Coup de Cœur • Dernier Ajout'}"`, icon: <Award className="w-4 h-4" />, visibilityKey: 'showFeaturedVideo' },
      { id: 'topRated', label: 'Carrousel Mieux Notés', summary: `Titre : "${views.home.topRatedTitle || 'Mieux Notés'}"`, icon: <Sparkles className="w-4 h-4" />, visibilityKey: 'showTopRated' },
      { id: 'editorialBanner', label: 'Au Cœur des Foyers Tunisiens', summary: `Bloc : "${views.home.editorialTitle || 'Au Cœur des Foyers Tunisiens'}"`, icon: <Award className="w-4 h-4" />, visibilityKey: 'showEditorialBanner' },
      { id: 'promotions', label: 'Carrousel Promotions', summary: `Titre : "${views.home.promotionsTitle || 'Promotions'}"`, icon: <Sparkles className="w-4 h-4" />, visibilityKey: 'showPromotions' },
      { id: 'lifestyle', label: 'Sélection Privilège Royal (Galerie)', summary: `Titre : "${views.home.lifestyleTitle || 'Sélection Privilège Royal'}"`, icon: <ImageIcon className="w-4 h-4" />, visibilityKey: 'showLifestyleGallery' },
      { id: 'testimonials', label: 'Témoignages Clients', summary: `Titre : "${views.home.testimonialsTitle || 'Ce que disent nos clients'}"`, icon: <MessageSquareQuote className="w-4 h-4" />, visibilityKey: 'showTestimonials' },
      { id: 'newsletter', label: 'Newsletter Club Privilège', summary: `Titre : "${views.home.newsletterTitle || 'Ne manquez aucune promotion Royal'}"`, icon: <Mail className="w-4 h-4" />, visibilityKey: 'showNewsletter' },
    ],
    articles: [
      { id: 'header', label: 'En-tête & Bannière Catalogue', summary: `Titre : "${views.articles.headerTitle || 'Tous nos Articles'}"`, icon: <Package className="w-4 h-4" />, visibilityKey: 'showHeaderBanner' },
      { id: 'filters', label: 'Barre Latérale Filtres & Facettes', summary: views.articles.showSidebarFiltersByDefault ? 'Ouverte au chargement' : 'Fermée par défaut', icon: <Filter className="w-4 h-4" />, visibilityKey: 'showFiltersSection' },
      { id: 'grid', label: 'Grille & Cartes Produits', summary: `${views.articles.defaultColumns} colonnes · Hauteur image ${views.articles.cardImageHeightPx ?? 260}px`, icon: <LayoutGrid className="w-4 h-4" /> },
      { id: 'actions', label: "Boutons d'Action Rapide sur Cartes", summary: `Panier · Favoris · Comparer · Aperçu · J'aime`, icon: <MousePointerClick className="w-4 h-4" /> },
      { id: 'pagination', label: 'Pagination & Taille de Page', summary: `${views.articles.defaultItemsPerPage} articles / page`, icon: <ListOrdered className="w-4 h-4" /> },
    ],
    productDetail: [
      { id: 'breadcrumb', label: "Fil d'Ariane & Actions Hautes", summary: 'Partage · Favoris · Comparateur', icon: <Eye className="w-4 h-4" />, visibilityKey: 'showBreadcrumb' },
      { id: 'gallery', label: 'Galerie Médias & Zoom', summary: `${views.productDetail.mediaColumnSpan ?? 7}/12 cols · ${views.productDetail.galleryHeightPx ?? 540}px`, icon: <ImageIcon className="w-4 h-4" /> },
      { id: 'purchaseInfo', label: 'Prix, Variantes, Réactions & Panier', summary: `Bouton : "${views.productDetail.addToCartText || 'Ajouter au panier'}"`, icon: <MousePointerClick className="w-4 h-4" /> },
      { id: 'trustBadges', label: 'Garanties Livraison, SAV & Paiement', summary: `${(views.productDetail.trustBadges || DEFAULT_TRUST_BADGES).length} encarts éditables`, icon: <ShieldCheck className="w-4 h-4" />, visibilityKey: 'showTrustBadges' },
      { id: 'tabs', label: 'Onglets Description, Fiche Technique & Avis', summary: `Onglet par défaut : ${views.productDetail.defaultTab || 'desc'}`, icon: <FileText className="w-4 h-4" /> },
      { id: 'related', label: 'Articles Similaires / Recommandés', summary: `Titre : "${views.productDetail.relatedTitle || 'Vous aimerez aussi'}"`, icon: <Sparkles className="w-4 h-4" />, visibilityKey: 'showRelatedProducts' },
    ],
    contact: [
      { id: 'hero', label: 'En-tête Page Contact', summary: `Titre : "${views.contact.title || 'Contactez Notre Équipe'}"`, icon: <Mail className="w-4 h-4" /> },
      { id: 'mainGrid', label: 'Blocs Coordonnées & Formulaire', summary: `Disposition : ${views.contact.layoutDirection === 'form-left' ? 'Formulaire à gauche' : 'Infos à gauche'}`, icon: <LayoutGrid className="w-4 h-4" />, visibilityKey: 'showInfoCards' },
      { id: 'map', label: 'Carte Interactive Pleine Largeur', summary: `Hauteur : ${views.contact.mapHeightPx ?? 380}px`, icon: <MapPin className="w-4 h-4" />, visibilityKey: 'showMap' },
    ],
    faq: [
      { id: 'hero', label: "En-tête Centre d'Aide & Recherche", summary: `Titre : "${views.faq.title}"`, icon: <HelpCircle className="w-4 h-4" /> },
      { id: 'categories', label: 'Filtres par Catégories', summary: 'Boutons de filtrage par thème FAQ', icon: <Filter className="w-4 h-4" />, visibilityKey: 'showCategoryFilter' },
      { id: 'questions', label: 'Questions / Réponses (CRUD + Glisser)', summary: `${faqItems.length} question(s) enregistrée(s) en base`, icon: <ListOrdered className="w-4 h-4" /> },
      { id: 'cta', label: 'Bloc Contact Bas de Page', summary: `Bouton : "${views.faq.ctaButtonText || 'Contacter le Support'}"`, icon: <Mail className="w-4 h-4" />, visibilityKey: 'showCta' },
    ],
    terms: [
      { id: 'header', label: 'En-tête & Titre CGV', summary: `Titre : "${termsPage.title}"`, icon: <FileText className="w-4 h-4" /> },
      { id: 'document', label: 'Contenu & Clauses Légales', summary: `${(termsPage.content || '').split('\n').filter(Boolean).length} ligne(s)`, icon: <Edit3 className="w-4 h-4" /> },
      { id: 'footerNote', label: 'Encart Note Légale Bas de Page', summary: 'Mention réglementaire e-commerce', icon: <Shield className="w-4 h-4" />, visibilityKey: 'showFooterNote' },
    ],
    privacy: [
      { id: 'header', label: 'En-tête & Titre Confidentialité', summary: `Titre : "${privacyPage.title}"`, icon: <Shield className="w-4 h-4" /> },
      { id: 'document', label: 'Corps de la Politique Données', summary: `${(privacyPage.content || '').split('\n').filter(Boolean).length} ligne(s)`, icon: <Edit3 className="w-4 h-4" /> },
      { id: 'footerNote', label: 'Encart Contact DPO & Droits', summary: 'Information sur vos données', icon: <ShieldCheck className="w-4 h-4" />, visibilityKey: 'showFooterNote' },
    ],
    showrooms: [
      { id: 'hero', label: "En-tête Salles d'Exposition", summary: `Titre : "${views.showrooms.title || "Nos Salles d'Exposition"}"`, icon: <Store className="w-4 h-4" />, visibilityKey: 'enabled' },
      { id: 'cards', label: 'Cartes Showrooms (Grille / Liste)', summary: `Mode : ${views.showrooms.layoutStyle === 'list' ? 'Liste détaillée' : 'Grille'}`, icon: <LayoutGrid className="w-4 h-4" /> },
      { id: 'map', label: 'Carte Localisation Showrooms', summary: `Hauteur : ${views.showrooms.mapHeightPx ?? 380}px`, icon: <MapPin className="w-4 h-4" />, visibilityKey: 'showMap' },
    ],
  };

  const rawCatalog = elementCatalogByView[viewStateKey] || [];
  const rawOrder: string[] = Array.isArray(views[viewStateKey]?.sectionOrder)
    ? views[viewStateKey].sectionOrder
    : rawCatalog.map((e) => e.id);
  // Keep every catalog item even if saved order misses any
  const orderedIds = [
    ...rawOrder.filter((id) => rawCatalog.some((c) => c.id === id)),
    ...rawCatalog.map((c) => c.id).filter((id) => !rawOrder.includes(id)),
  ];

  const currentTabInfo = VIEW_TABS.find((t) => t.id === activeView) || VIEW_TABS[0];

  const renderElementEditor = (viewKey: string, elemId: string) => {
    if (viewKey === 'home') {
      const h = views.home;
      if (elemId === 'hero') {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input label="Vitesse Autoplay (ms)" type="number" value={h.heroAutoplayMs} onChange={(e) => setViews({ ...views, home: { ...h, heroAutoplayMs: Number(e.target.value) || 6000 } })} />
              <Input label="Hauteur Bannière (px)" type="number" min={420} max={980} value={h.heroHeightPx ?? 720} onChange={(e) => setViews({ ...views, home: { ...h, heroHeightPx: Number(e.target.value) || 720 } })} />
              <Select
                label="Animation Slider"
                value={h.heroAnimation || 'slide'}
                onChange={(e) => setViews({ ...views, home: { ...h, heroAnimation: e.target.value } })}
                options={[
                  { value: 'slide', label: 'Glissement Latéral (Slide)' },
                  { value: 'fade', label: 'Fondu Doux (Fade)' },
                  { value: 'zoom', label: 'Zoom Cinématique (Scale)' },
                ]}
              />
              <div className="flex items-end">
                <Toggle label="Afficher Barre Marques" checked={h.showBrandMarquee !== false} onChange={(v) => setViews({ ...views, home: { ...h, showBrandMarquee: v } })} />
              </div>
            </div>
            <div className="pt-3 border-t border-[var(--royal-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--royal-ink)]">
                  Slides Bannière ({heroSlides.length})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setHeroSlides((prev) => [
                      ...prev,
                      {
                        id: `slide-${Date.now()}`,
                        tagline: 'NOUVEAUTÉ ROYAL',
                        title: 'Titre Principal',
                        highlightText: 'Sous-titre Doré',
                        subtitle: 'Description de votre offre ou gamme.',
                        primaryCtaText: 'Découvrir',
                        primaryCtaLink: '/articles',
                        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=90',
                      },
                    ])
                  }
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un Slide</span>
                </Button>
              </div>
              <div className="space-y-3">
                {heroSlides.map((slide, idx) => (
                  <div key={slide.id || idx} className="p-4 rounded-2xl bg-white border border-[var(--royal-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--royal-gold-dark)]">Slide #{idx + 1}</span>
                      {heroSlides.length > 1 && (
                        <button type="button" onClick={() => setHeroSlides((prev) => prev.filter((_, i) => i !== idx))} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-bold cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input label="Sur-titre (Tagline)" value={slide.tagline || ''} onChange={(e) => { const n = [...heroSlides]; n[idx] = { ...n[idx], tagline: e.target.value }; setHeroSlides(n); }} />
                      <Input label="Titre Principal" value={slide.title || ''} onChange={(e) => { const n = [...heroSlides]; n[idx] = { ...n[idx], title: e.target.value }; setHeroSlides(n); }} />
                      <Input label="Texte Mis en Avant" value={slide.highlightText || ''} onChange={(e) => { const n = [...heroSlides]; n[idx] = { ...n[idx], highlightText: e.target.value }; setHeroSlides(n); }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Texte Bouton CTA" value={slide.primaryCtaText || ''} onChange={(e) => { const n = [...heroSlides]; n[idx] = { ...n[idx], primaryCtaText: e.target.value }; setHeroSlides(n); }} />
                      <Input label="Lien Bouton CTA (Automatique ou Manuel)" value={slide.primaryCtaLink || ''} onChange={(e) => { const n = [...heroSlides]; n[idx] = { ...n[idx], primaryCtaLink: e.target.value }; setHeroSlides(n); }} />
                    </div>
                    <CmsImageFieldWithPreview
                      label={`Image Bannière Slide #${idx + 1}`}
                      value={slide.imageUrl || ''}
                      onChange={(url) => {
                        const n = [...heroSlides];
                        n[idx] = { ...n[idx], imageUrl: url };
                        setHeroSlides(n);
                      }}
                      aspectRatio={16 / 9}
                      hint="Glissez-déposez l'image bannière ou collez un lien image."
                    />
                    <DynamicTargetSelector
                      label="Cible Dynamique du Bouton CTA"
                      targetType={slide.targetType || (slide.primaryCtaLink ? 'CUSTOM_URL' : 'AUTO')}
                      onTargetTypeChange={(val) => {
                        const n = [...heroSlides];
                        n[idx] = { ...n[idx], targetType: val };
                        setHeroSlides(n);
                      }}
                      selectedCategories={slide.targetCategorySlugs || []}
                      onCategoriesChange={(slugs) => {
                        const n = [...heroSlides];
                        n[idx] = {
                          ...n[idx],
                          targetCategorySlugs: slugs,
                          primaryCtaLink: slugs.length > 0 ? `/articles?category=${slugs.join(',')}` : '/articles',
                        };
                        setHeroSlides(n);
                      }}
                      selectedProducts={slide.targetProductIds || []}
                      onProductsChange={(ids) => {
                        const n = [...heroSlides];
                        let nextHref = '/articles';
                        if (ids.length === 1) {
                          const found = cmsProducts.find((pr) => pr.id === ids[0]);
                          nextHref = found?.slug ? `/articles/${found.slug}` : `/articles?ids=${ids[0]}`;
                        } else if (ids.length > 1) {
                          nextHref = `/articles?ids=${ids.join(',')}`;
                        }
                        n[idx] = { ...n[idx], targetProductIds: ids, primaryCtaLink: nextHref };
                        setHeroSlides(n);
                      }}
                      categories={cmsCategories}
                      products={cmsProducts}
                      allowCustomUrl
                      customUrlValue={slide.primaryCtaLink || ''}
                      onCustomUrlChange={(url) => {
                        const n = [...heroSlides];
                        n[idx] = { ...n[idx], primaryCtaLink: url };
                        setHeroSlides(n);
                      }}
                    />
                    <Textarea label="Description Sous-titre" rows={2} value={slide.subtitle || ''} onChange={(e) => { const n = [...heroSlides]; n[idx] = { ...n[idx], subtitle: e.target.value }; setHeroSlides(n); }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      if (elemId === 'categories') {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Sur-titre (Tag)" value={h.categoriesTag ?? 'Collections & Rayons'} onChange={(e) => setViews({ ...views, home: { ...h, categoriesTag: e.target.value } })} />
              <Input label="Titre Section Catégories" value={h.categoriesTitle ?? 'Explorer par Catégories'} onChange={(e) => setViews({ ...views, home: { ...h, categoriesTitle: e.target.value } })} />
            </div>
            <DynamicTargetSelector
              label="Source Dynamique des Catégories Affichées"
              targetType={h.categoriesTargetType || 'AUTO'}
              onTargetTypeChange={(val) => setViews({ ...views, home: { ...h, categoriesTargetType: val } })}
              selectedCategories={h.categoriesTargetSlugs || []}
              onCategoriesChange={(slugs) => setViews({ ...views, home: { ...h, categoriesTargetSlugs: slugs } })}
              selectedProducts={[]}
              onProductsChange={() => {}}
              categories={cmsCategories}
              products={cmsProducts}
              allowArticlesOption={false}
            />
          </div>
        );
      }
      if (elemId === 'valueProps') {
        const items = Array.isArray(h.valuePropsItems) && h.valuePropsItems.length === 4 ? h.valuePropsItems : DEFAULT_VALUE_PROPS;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((vp: any, i: number) => (
              <div key={i} className="p-3.5 rounded-xl bg-white border border-[var(--royal-border)] space-y-2.5">
                <span className="text-[11px] font-bold text-[var(--royal-gold-dark)] uppercase">Carte Engagement #{i + 1}</span>
                <Input
                  label="Titre"
                  value={vp.title}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], title: e.target.value };
                    setViews({ ...views, home: { ...h, valuePropsItems: next } });
                  }}
                />
                <Input
                  label="Sous-titre"
                  value={vp.subtitle}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], subtitle: e.target.value };
                    setViews({ ...views, home: { ...h, valuePropsItems: next } });
                  }}
                />
              </div>
            ))}
          </div>
        );
      }
      if (elemId === 'newArrivals' || elemId === 'topRated' || elemId === 'promotions') {
        const prefix = elemId;
        const defaults: Record<string, any> = {
          newArrivals: { tag: 'Derniers Arrivages Royal', title: 'Nouveautés', sub: 'Les dernières références sélectionnées par Royal pour votre intérieur.' },
          topRated: { tag: 'Sélection Plébiscitée', title: 'Mieux Notés', sub: 'Les équipements préférés de nos clients partout en Tunisie.' },
          promotions: { tag: 'Meilleures Réductions TND', title: 'Promotions', sub: 'Profitez de remises immédiates et de prix promo sur nos appareils sélectionnés.' },
        };
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input label="Badge (Tag)" value={h[`${prefix}Tag`] ?? defaults[prefix].tag} onChange={(e) => setViews({ ...views, home: { ...h, [`${prefix}Tag`]: e.target.value } })} />
              <Input label="Titre Section" value={h[`${prefix}Title`] ?? defaults[prefix].title} onChange={(e) => setViews({ ...views, home: { ...h, [`${prefix}Title`]: e.target.value } })} />
              <Select
                label="Mode d'Affichage"
                value={h[`${prefix}DisplayMode`] || 'carousel'}
                onChange={(e) => setViews({ ...views, home: { ...h, [`${prefix}DisplayMode`]: e.target.value } })}
                options={[
                  { value: 'carousel', label: 'Carrousel Horizontal' },
                  { value: 'grid', label: 'Grille Multi-Lignes' },
                ]}
              />
              <Input label="Max Articles" type="number" min={4} max={24} value={h[`${prefix}Limit`] ?? 16} onChange={(e) => setViews({ ...views, home: { ...h, [`${prefix}Limit`]: Number(e.target.value) || 16 } })} />
              <Input label="Hauteur Image Cartes (px)" type="number" min={180} max={420} value={h.cardImageHeightPx ?? 280} onChange={(e) => setViews({ ...views, home: { ...h, cardImageHeightPx: Number(e.target.value) || 280 } })} />
            </div>
            <Input label="Description Sous-titre" value={h[`${prefix}Subtitle`] ?? defaults[prefix].sub} onChange={(e) => setViews({ ...views, home: { ...h, [`${prefix}Subtitle`]: e.target.value } })} />
            <DynamicTargetSelector
              label="Source Dynamique des Articles Affichés"
              targetType={h[`${prefix}TargetType`] || 'AUTO'}
              onTargetTypeChange={(val) => setViews({ ...views, home: { ...h, [`${prefix}TargetType`]: val } })}
              selectedCategories={h[`${prefix}TargetCategorySlugs`] || []}
              onCategoriesChange={(slugs) => setViews({ ...views, home: { ...h, [`${prefix}TargetCategorySlugs`]: slugs } })}
              selectedProducts={h[`${prefix}TargetProductIds`] || []}
              onProductsChange={(ids) => setViews({ ...views, home: { ...h, [`${prefix}TargetProductIds`]: ids } })}
              categories={cmsCategories}
              products={cmsProducts}
            />
          </div>
        );
      }
      if (elemId === 'featuredVideo') {
        const selectedIds = Array.isArray(h.featuredVideoTargetProductIds) && h.featuredVideoTargetProductIds.length > 0
          ? h.featuredVideoTargetProductIds
          : h.featuredVideoTargetProductId
          ? [h.featuredVideoTargetProductId]
          : [];
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Badge Coup de Cœur" value={h.featuredVideoTag ?? 'Coup de Cœur • Dernier Ajout au Catalogue'} onChange={(e) => setViews({ ...views, home: { ...h, featuredVideoTag: e.target.value } })} />
              <div className="p-3 rounded-xl bg-white border border-[var(--royal-border)] text-xs text-slate-500 flex items-center">
                Par défaut : dernier produit actif. Ou choisissez un article ciblé et une image personnalisée ci-dessous.
              </div>
            </div>
            <CmsImageFieldWithPreview
              label="Image Visuelle Coup de Cœur (Optionnel)"
              value={h.featuredVideoCustomImageUrl || ''}
              onChange={(url) => setViews({ ...views, home: { ...h, featuredVideoCustomImageUrl: url } })}
              aspectRatio={4 / 3}
            />
            <DynamicTargetSelector
              label="Article Vedette Ciblé"
              targetType={h.featuredVideoTargetType || 'AUTO'}
              onTargetTypeChange={(val) => setViews({ ...views, home: { ...h, featuredVideoTargetType: val } })}
              selectedCategories={[]}
              onCategoriesChange={() => {}}
              selectedProducts={selectedIds}
              onProductsChange={(ids) => setViews({ ...views, home: { ...h, featuredVideoTargetProductIds: ids, featuredVideoTargetProductId: ids[0] || '' } })}
              categories={cmsCategories}
              products={cmsProducts}
              allowCategoriesOption={false}
              singleProductOnly
            />
          </div>
        );
      }
      if (elemId === 'editorialBanner') {
        const cards = Array.isArray(h.editorialCards) && h.editorialCards.length === 3 ? h.editorialCards : DEFAULT_EDITORIAL_CARDS;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Sur-titre" value={h.editorialTag ?? 'Nos Engagements & Réseau'} onChange={(e) => setViews({ ...views, home: { ...h, editorialTag: e.target.value } })} />
              <Input label="Titre Éditorial" value={h.editorialTitle ?? 'Au Cœur des Foyers Tunisiens'} onChange={(e) => setViews({ ...views, home: { ...h, editorialTitle: e.target.value } })} />
            </div>
            <Textarea label="Description" rows={2} value={h.editorialSubtitle ?? 'Royal sélectionne les meilleurs équipements culinaires et appareils électroménagers pour vous garantir fiabilité, sécurité et plaisir quotidien partout en Tunisie.'} onChange={(e) => setViews({ ...views, home: { ...h, editorialSubtitle: e.target.value } })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Chiffre / Stat Gauche" value={h.editorialStatTitle ?? '24 Gouvernorats'} onChange={(e) => setViews({ ...views, home: { ...h, editorialStatTitle: e.target.value } })} />
              <Input label="Texte Stat Gauche" value={h.editorialStatDesc ?? 'Expédition rapide depuis Mahdia 5100 vers toute la Tunisie en 24h à 48h.'} onChange={(e) => setViews({ ...views, home: { ...h, editorialStatDesc: e.target.value } })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cards.map((ec: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-[var(--royal-border)] space-y-2">
                  <Input
                    label={`Mini-carte #${idx + 1} Titre`}
                    value={ec.title}
                    onChange={(e) => {
                      const next = [...cards];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setViews({ ...views, home: { ...h, editorialCards: next } });
                    }}
                  />
                  <Input
                    label="Texte"
                    value={ec.desc}
                    onChange={(e) => {
                      const next = [...cards];
                      next[idx] = { ...next[idx], desc: e.target.value };
                      setViews({ ...views, home: { ...h, editorialCards: next } });
                    }}
                  />
                </div>
              ))}
            </div>
            <CmsImageFieldWithPreview
              label="Image Visuelle Bloc Éditorial (Optionnel)"
              value={h.editorialCustomImageUrl || ''}
              onChange={(url) => setViews({ ...views, home: { ...h, editorialCustomImageUrl: url } })}
              aspectRatio={4 / 3}
            />
            <DynamicTargetSelector
              label="Article / Catégorie mis en avant dans le Bloc Éditorial"
              targetType={h.editorialTargetType || 'AUTO'}
              onTargetTypeChange={(val) => setViews({ ...views, home: { ...h, editorialTargetType: val } })}
              selectedCategories={h.editorialTargetCategorySlugs || []}
              onCategoriesChange={(slugs) => setViews({ ...views, home: { ...h, editorialTargetCategorySlugs: slugs } })}
              selectedProducts={h.editorialTargetProductIds || []}
              onProductsChange={(ids) => setViews({ ...views, home: { ...h, editorialTargetProductIds: ids } })}
              categories={cmsCategories}
              products={cmsProducts}
            />
          </div>
        );
      }
      if (elemId === 'lifestyle') {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Sur-titre" value={h.lifestyleTag ?? 'Articles en Vedette'} onChange={(e) => setViews({ ...views, home: { ...h, lifestyleTag: e.target.value } })} />
              <Input label="Titre Galerie" value={h.lifestyleTitle ?? 'Sélection Privilège Royal'} onChange={(e) => setViews({ ...views, home: { ...h, lifestyleTitle: e.target.value } })} />
              <Input label="Texte Lien Voir Tout" value={h.lifestyleCtaText ?? 'Voir toute la sélection'} onChange={(e) => setViews({ ...views, home: { ...h, lifestyleCtaText: e.target.value } })} />
            </div>
            <CmsImageFieldWithPreview
              label="Image Bannière Sélection Privilège (Optionnel)"
              value={h.lifestyleCustomBannerUrl || ''}
              onChange={(url) => setViews({ ...views, home: { ...h, lifestyleCustomBannerUrl: url } })}
              aspectRatio={16 / 9}
            />
            <DynamicTargetSelector
              label="Articles / Catégories de la Galerie Privilège"
              targetType={h.lifestyleTargetType || 'AUTO'}
              onTargetTypeChange={(val) => setViews({ ...views, home: { ...h, lifestyleTargetType: val } })}
              selectedCategories={h.lifestyleTargetCategorySlugs || []}
              onCategoriesChange={(slugs) => setViews({ ...views, home: { ...h, lifestyleTargetCategorySlugs: slugs } })}
              selectedProducts={h.lifestyleTargetProductIds || []}
              onProductsChange={(ids) => setViews({ ...views, home: { ...h, lifestyleTargetProductIds: ids } })}
              categories={cmsCategories}
              products={cmsProducts}
            />
          </div>
        );
      }
      if (elemId === 'testimonials') {
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Sur-titre" value={h.testimonialsTag ?? 'Avis Clients Vérifiés'} onChange={(e) => setViews({ ...views, home: { ...h, testimonialsTag: e.target.value } })} />
              <Input label="Titre Section" value={h.testimonialsTitle ?? 'Ce que disent nos clients'} onChange={(e) => setViews({ ...views, home: { ...h, testimonialsTitle: e.target.value } })} />
              <Input label="Note Confiance" value={h.testimonialsBadge ?? '4.9 / 5 sur plus de 1 200 commandes'} onChange={(e) => setViews({ ...views, home: { ...h, testimonialsBadge: e.target.value } })} />
            </div>
            {isRouteVisible('/dashboard/seo/testimonials') && (
              <Link href="/dashboard/seo/testimonials" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--royal-primary)] hover:underline">
                <span>Gérer la liste des témoignages publiés →</span>
              </Link>
            )}
          </div>
        );
      }
      if (elemId === 'newsletter') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Badge Club" value={h.newsletterTag ?? 'Club Privilège & Alertes Promo'} onChange={(e) => setViews({ ...views, home: { ...h, newsletterTag: e.target.value } })} />
            <Input label="Titre Newsletter" value={h.newsletterTitle ?? 'Ne manquez aucune promotion Royal'} onChange={(e) => setViews({ ...views, home: { ...h, newsletterTitle: e.target.value } })} />
            <Input label="Placeholder Email" value={h.newsletterPlaceholder ?? 'votre.email@exemple.com'} onChange={(e) => setViews({ ...views, home: { ...h, newsletterPlaceholder: e.target.value } })} />
            <Input label="Texte Bouton" value={h.newsletterButtonText ?? "S'inscrire"} onChange={(e) => setViews({ ...views, home: { ...h, newsletterButtonText: e.target.value } })} />
            <div className="md:col-span-2 lg:col-span-4">
              <Input label="Description" value={h.newsletterSubtitle ?? 'Inscrivez-vous à notre newsletter pour recevoir nos nouveaux arrivages, ventes flash et codes promo exclusifs.'} onChange={(e) => setViews({ ...views, home: { ...h, newsletterSubtitle: e.target.value } })} />
            </div>
          </div>
        );
      }
    }

    if (viewKey === 'articles') {
      const a = views.articles;
      if (elemId === 'header') {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Badge En-tête" value={a.headerBadge ?? 'Catalogue Officiel'} onChange={(e) => setViews({ ...views, articles: { ...a, headerBadge: e.target.value } })} />
              <Input label="Titre Page Articles" value={a.headerTitle ?? 'Tous nos Articles'} onChange={(e) => setViews({ ...views, articles: { ...a, headerTitle: e.target.value } })} />
              <div className="md:col-span-2">
                <Textarea label="Sous-titre Bannière" rows={2} value={a.headerSubtitle ?? ''} onChange={(e) => setViews({ ...views, articles: { ...a, headerSubtitle: e.target.value } })} />
              </div>
            </div>
            <CmsImageFieldWithPreview
              label="Image Fond Bannière Catalogue (Optionnel)"
              value={a.headerImageUrl || ''}
              onChange={(url) => setViews({ ...views, articles: { ...a, headerImageUrl: url } })}
              aspectRatio={16 / 5}
            />
          </div>
        );
      }
      if (elemId === 'filters') {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Position Panneau Filtres"
                value={a.filterPosition || 'left'}
                onChange={(e) => setViews({ ...views, articles: { ...a, filterPosition: e.target.value } })}
                options={[
                  { value: 'left', label: 'À Gauche (Classique)' },
                  { value: 'right', label: 'À Droite (Inversé)' },
                ]}
              />
              <Toggle label="Afficher Barre Latérale de Filtres" checked={a.showFiltersSection !== false} onChange={(v) => setViews({ ...views, articles: { ...a, showFiltersSection: v } })} />
              <Toggle label="Ouvrir la Barre de Filtres au Chargement" checked={Boolean(a.showSidebarFiltersByDefault)} onChange={(v) => setViews({ ...views, articles: { ...a, showSidebarFiltersByDefault: v } })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[var(--royal-border)]">
              <Toggle label="Filtre Catégories / Rayons" checked={a.showCategoryFilter !== false} onChange={(v) => setViews({ ...views, articles: { ...a, showCategoryFilter: v } })} />
              <Toggle label="Filtre Fourchette de Prix" checked={a.showPriceFilter !== false} onChange={(v) => setViews({ ...views, articles: { ...a, showPriceFilter: v } })} />
              <Toggle label="Filtre Marques" checked={a.showBrandFilter !== false} onChange={(v) => setViews({ ...views, articles: { ...a, showBrandFilter: v } })} />
              <Toggle label="Filtre Caractéristiques / Variantes" checked={a.showCharacteristicsFilter !== false} onChange={(v) => setViews({ ...views, articles: { ...a, showCharacteristicsFilter: v } })} />
            </div>
          </div>
        );
      }
      if (elemId === 'grid') {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Colonnes Grille par Défaut"
                value={['3', '4', 'list'].includes(String(a.defaultColumns)) ? String(a.defaultColumns) : '3'}
                onChange={(e) => setViews({ ...views, articles: { ...a, defaultColumns: e.target.value } })}
                options={[
                  { value: '3', label: '3 Colonnes' },
                  { value: '4', label: '4 Colonnes' },
                  { value: 'list', label: 'Mode Liste' },
                ]}
              />
              <Input label="Hauteur Image Carte (px)" type="number" min={180} max={420} value={a.cardImageHeightPx ?? 260} onChange={(e) => setViews({ ...views, articles: { ...a, cardImageHeightPx: Number(e.target.value) || 260 } })} />
            </div>
            <DynamicTargetSelector
              label="Pré-filtrage Dynamique du Catalogue (Par défaut)"
              targetType={a.targetType || 'AUTO'}
              onTargetTypeChange={(val) => setViews({ ...views, articles: { ...a, targetType: val } })}
              selectedCategories={a.targetCategorySlugs || []}
              onCategoriesChange={(slugs) => setViews({ ...views, articles: { ...a, targetCategorySlugs: slugs } })}
              selectedProducts={a.targetProductIds || []}
              onProductsChange={(ids) => setViews({ ...views, articles: { ...a, targetProductIds: ids } })}
              categories={cmsCategories}
              products={cmsProducts}
            />
          </div>
        );
      }
      if (elemId === 'actions') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Toggle label="Afficher bouton Acheter / Panier" checked={Boolean(a.showBuyButton)} onChange={(v) => setViews({ ...views, articles: { ...a, showBuyButton: v } })} />
            <Toggle label="Afficher bouton Wishlist (Cœur)" checked={Boolean(a.showWishlistButton)} onChange={(v) => setViews({ ...views, articles: { ...a, showWishlistButton: v } })} />
            <Toggle label="Afficher bouton Comparer" checked={Boolean(a.showCompareButton)} onChange={(v) => setViews({ ...views, articles: { ...a, showCompareButton: v } })} />
            <Toggle label="Afficher bouton Aperçu Rapide (Œil)" checked={Boolean(a.showQuickViewButton)} onChange={(v) => setViews({ ...views, articles: { ...a, showQuickViewButton: v } })} />
            <Toggle label="Afficher J'aime / Je n'aime pas" checked={Boolean(a.showLikeDislike)} onChange={(v) => setViews({ ...views, articles: { ...a, showLikeDislike: v } })} />
          </div>
        );
      }
      if (elemId === 'pagination') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Articles par page par défaut"
              value={String([12, 24, 36, 60, 96].includes(Number(a.defaultItemsPerPage)) ? a.defaultItemsPerPage : 24)}
              onChange={(e) => setViews({ ...views, articles: { ...a, defaultItemsPerPage: Number(e.target.value) || 24 } })}
              options={[
                { value: '12', label: '12 articles / page' },
                { value: '24', label: '24 articles / page' },
                { value: '36', label: '36 articles / page' },
                { value: '60', label: '60 articles / page' },
                { value: '96', label: '96 articles / page' },
              ]}
            />
            <Toggle label="Autoriser le choix du nombre par page" checked={a.showPageSizeSelector !== false} onChange={(v) => setViews({ ...views, articles: { ...a, showPageSizeSelector: v } })} />
          </div>
        );
      }
    }

    if (viewKey === 'productDetail') {
      const p = views.productDetail;
      if (elemId === 'breadcrumb') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Toggle label="Afficher Fil d'Ariane" checked={p.showBreadcrumb !== false} onChange={(v) => setViews({ ...views, productDetail: { ...p, showBreadcrumb: v } })} />
            <Toggle label="Bouton Partager" checked={Boolean(p.showShareButton)} onChange={(v) => setViews({ ...views, productDetail: { ...p, showShareButton: v } })} />
            <Toggle label="Bouton Favoris" checked={Boolean(p.showWishlist)} onChange={(v) => setViews({ ...views, productDetail: { ...p, showWishlist: v } })} />
            <Toggle label="Bouton Comparer" checked={Boolean(p.showCompare)} onChange={(v) => setViews({ ...views, productDetail: { ...p, showCompare: v } })} />
          </div>
        );
      }
      if (elemId === 'gallery') {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Position Galerie"
                value={p.galleryPosition || 'left'}
                onChange={(e) => setViews({ ...views, productDetail: { ...p, galleryPosition: e.target.value } })}
                options={[
                  { value: 'left', label: 'Galerie à Gauche' },
                  { value: 'right', label: 'Galerie à Droite' },
                ]}
              />
              <Select
                label="Mode Affichage Images"
                value={p.imageDisplayMode || 'thumbnails-bottom'}
                onChange={(e) => setViews({ ...views, productDetail: { ...p, imageDisplayMode: e.target.value } })}
                options={[
                  { value: 'thumbnails-bottom', label: 'Principale + Miniatures Bas' },
                  { value: 'thumbnails-left', label: 'Principale + Miniatures Gauche' },
                  { value: 'grid-2x2', label: 'Grille Multi-Vues (2×2)' },
                  { value: 'single', label: 'Image Principale Seule' },
                ]}
              />
              <Select
                label="Animation des Images"
                value={p.imageAnimation || 'zoom-hover'}
                onChange={(e) => setViews({ ...views, productDetail: { ...p, imageAnimation: e.target.value } })}
                options={[
                  { value: 'zoom-hover', label: 'Zoom au Survol (Loupe)' },
                  { value: 'fade', label: 'Fondu Doux (Fade)' },
                  { value: 'slide', label: 'Glissement (Slide)' },
                  { value: 'none', label: 'Statique (Sans animation)' },
                ]}
              />
              <Select
                label="Cadrage Image"
                value={p.imageObjectFit || 'cover'}
                onChange={(e) => setViews({ ...views, productDetail: { ...p, imageObjectFit: e.target.value } })}
                options={[
                  { value: 'cover', label: 'Plein Cadre (Cover)' },
                  { value: 'contain', label: 'Image Complète (Contain)' },
                ]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Largeur Galerie (/12 cols, 5–8)" type="number" min={5} max={8} value={p.mediaColumnSpan ?? 7} onChange={(e) => setViews({ ...views, productDetail: { ...p, mediaColumnSpan: Number(e.target.value) || 7 } })} />
              <Input label="Hauteur Galerie (px)" type="number" min={360} max={760} value={p.galleryHeightPx ?? 540} onChange={(e) => setViews({ ...views, productDetail: { ...p, galleryHeightPx: Number(e.target.value) || 540 } })} />
              <Toggle label="Zoom au Survol Souris" checked={Boolean(p.enableImageZoom)} onChange={(v) => setViews({ ...views, productDetail: { ...p, enableImageZoom: v } })} />
              <Toggle label="Autoplay Carrousel Images" checked={Boolean(p.enableImageAutoplay)} onChange={(v) => setViews({ ...views, productDetail: { ...p, enableImageAutoplay: v } })} />
            </div>
          </div>
        );
      }
      if (elemId === 'purchaseInfo') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Libellé Bouton Panier" value={p.addToCartText ?? 'Ajouter au panier'} onChange={(e) => setViews({ ...views, productDetail: { ...p, addToCartText: e.target.value } })} />
            <Toggle label="Afficher Étoiles & Note Globale" checked={Boolean(p.showRatings)} onChange={(v) => setViews({ ...views, productDetail: { ...p, showRatings: v } })} />
            <Toggle label="Afficher J'aime / Je n'aime pas" checked={Boolean(p.showLikeDislike)} onChange={(v) => setViews({ ...views, productDetail: { ...p, showLikeDislike: v } })} />
          </div>
        );
      }
      if (elemId === 'trustBadges') {
        const badges = Array.isArray(p.trustBadges) && p.trustBadges.length === 3 ? p.trustBadges : DEFAULT_TRUST_BADGES;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {badges.map((b: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-white border border-[var(--royal-border)] space-y-2">
                <Input
                  label={`Badge #${i + 1} Titre`}
                  value={b.title}
                  onChange={(e) => {
                    const next = [...badges];
                    next[i] = { ...next[i], title: e.target.value };
                    setViews({ ...views, productDetail: { ...p, trustBadges: next } });
                  }}
                />
                <Input
                  label="Sous-titre"
                  value={b.subtitle}
                  onChange={(e) => {
                    const next = [...badges];
                    next[i] = { ...next[i], subtitle: e.target.value };
                    setViews({ ...views, productDetail: { ...p, trustBadges: next } });
                  }}
                />
              </div>
            ))}
          </div>
        );
      }
      if (elemId === 'tabs') {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Toggle label="Afficher Onglet Description" checked={p.showDescription !== false} onChange={(v) => setViews({ ...views, productDetail: { ...p, showDescription: v } })} />
              <Toggle label="Afficher Onglet Fiche Technique" checked={Boolean(p.showSpecs)} onChange={(v) => setViews({ ...views, productDetail: { ...p, showSpecs: v } })} />
              <Toggle label="Afficher Onglet Avis & Commentaires" checked={Boolean(p.showReviews)} onChange={(v) => setViews({ ...views, productDetail: { ...p, showReviews: v } })} />
              <Toggle label="Afficher Onglet Livraison & SAV" checked={Boolean(p.showDeliveryTab)} onChange={(v) => setViews({ ...views, productDetail: { ...p, showDeliveryTab: v } })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select
                label="Onglet Ouvert par Défaut"
                value={p.defaultTab || 'desc'}
                onChange={(e) => setViews({ ...views, productDetail: { ...p, defaultTab: e.target.value } })}
                options={[
                  { value: 'desc', label: 'Description' },
                  { value: 'specs', label: 'Fiche Technique' },
                  { value: 'reviews', label: 'Avis & Commentaires' },
                  { value: 'delivery', label: 'Livraison & Garantie' },
                ]}
              />
              <Input label="Libellé Description" value={p.descriptionTabLabel ?? 'Description Détaillée'} onChange={(e) => setViews({ ...views, productDetail: { ...p, descriptionTabLabel: e.target.value } })} />
              <Input label="Libellé Fiche Technique" value={p.specsTabLabel ?? 'Fiche Technique'} onChange={(e) => setViews({ ...views, productDetail: { ...p, specsTabLabel: e.target.value } })} />
              <Input label="Libellé Avis" value={p.reviewsTabLabel ?? 'Avis & Commentaires'} onChange={(e) => setViews({ ...views, productDetail: { ...p, reviewsTabLabel: e.target.value } })} />
              <Input label="Libellé Livraison" value={p.deliveryTabLabel ?? 'Livraison & Garantie'} onChange={(e) => setViews({ ...views, productDetail: { ...p, deliveryTabLabel: e.target.value } })} />
            </div>
          </div>
        );
      }
      if (elemId === 'related') {
        const extraBlocks: any[] = Array.isArray(p.extraRecommendedBlocks) ? p.extraRecommendedBlocks : [];
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input label="Titre Section Principale" value={p.relatedTitle ?? 'Vous aimerez aussi'} onChange={(e) => setViews({ ...views, productDetail: { ...p, relatedTitle: e.target.value } })} />
              <Select
                label="Mode Affichage"
                value={p.relatedDisplayMode || 'grid'}
                onChange={(e) => setViews({ ...views, productDetail: { ...p, relatedDisplayMode: e.target.value } })}
                options={[
                  { value: 'grid', label: 'Grille' },
                  { value: 'carousel', label: 'Carrousel Horizontal' },
                ]}
              />
              <Select
                label="Colonnes"
                value={String(p.relatedColumns || '4')}
                onChange={(e) => setViews({ ...views, productDetail: { ...p, relatedColumns: e.target.value } })}
                options={[
                  { value: '3', label: '3 Colonnes' },
                  { value: '4', label: '4 Colonnes' },
                ]}
              />
              <Input label="Max Articles" type="number" min={2} max={16} value={p.relatedLimit ?? 4} onChange={(e) => setViews({ ...views, productDetail: { ...p, relatedLimit: Number(e.target.value) || 4 } })} />
              <Toggle label="Activer Articles Similaires" checked={Boolean(p.showRelatedProducts)} onChange={(v) => setViews({ ...views, productDetail: { ...p, showRelatedProducts: v } })} />
            </div>
            <Input label="Sous-titre Recommandations" value={p.relatedSubtitle ?? 'Complétez votre équipement Royal avec notre sélection sur-mesure.'} onChange={(e) => setViews({ ...views, productDetail: { ...p, relatedSubtitle: e.target.value } })} />
            <DynamicTargetSelector
              label="Source des Articles Recommandés Principaux"
              targetType={p.relatedTargetType || 'AUTO'}
              onTargetTypeChange={(val) => setViews({ ...views, productDetail: { ...p, relatedTargetType: val } })}
              selectedCategories={p.relatedTargetCategorySlugs || []}
              onCategoriesChange={(slugs) => setViews({ ...views, productDetail: { ...p, relatedTargetCategorySlugs: slugs } })}
              selectedProducts={p.relatedTargetProductIds || []}
              onProductsChange={(ids) => setViews({ ...views, productDetail: { ...p, relatedTargetProductIds: ids } })}
              categories={cmsCategories}
              products={cmsProducts}
            />

            <div className="pt-4 border-t border-[var(--royal-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--royal-ink)]">
                  Listes d'Articles Recommandés Supplémentaires ({extraBlocks.length})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() =>
                    setViews({
                      ...views,
                      productDetail: {
                        ...p,
                        extraRecommendedBlocks: [
                          ...extraBlocks,
                          {
                            id: `rec-${Date.now()}`,
                            title: 'Accessoires & Compléments Recommandés',
                            subtitle: 'Sélection sélectionnée spécialement pour accompagner cet article.',
                            visible: true,
                            displayMode: 'grid',
                            columns: '4',
                            limit: 4,
                            targetType: 'AUTO',
                            targetCategorySlugs: [],
                            targetProductIds: [],
                          },
                        ],
                      },
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une liste recommandée</span>
                </Button>
              </div>

              {extraBlocks.map((blk, bIdx) => (
                <div key={blk.id || bIdx} className="p-4 rounded-2xl bg-white border border-[var(--royal-border)] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-[var(--royal-gold-dark)]">
                      Bloc Recommandé #{bIdx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <Toggle
                        label="Visible"
                        checked={blk.visible !== false}
                        onChange={(v) => {
                          const next = [...extraBlocks];
                          next[bIdx] = { ...next[bIdx], visible: v };
                          setViews({ ...views, productDetail: { ...p, extraRecommendedBlocks: next } });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = extraBlocks.filter((_, i) => i !== bIdx);
                          setViews({ ...views, productDetail: { ...p, extraRecommendedBlocks: next } });
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Supprimer cette liste"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Input
                      label="Titre Liste"
                      value={blk.title || ''}
                      onChange={(e) => {
                        const next = [...extraBlocks];
                        next[bIdx] = { ...next[bIdx], title: e.target.value };
                        setViews({ ...views, productDetail: { ...p, extraRecommendedBlocks: next } });
                      }}
                    />
                    <Select
                      label="Affichage"
                      value={blk.displayMode || 'grid'}
                      onChange={(e) => {
                        const next = [...extraBlocks];
                        next[bIdx] = { ...next[bIdx], displayMode: e.target.value };
                        setViews({ ...views, productDetail: { ...p, extraRecommendedBlocks: next } });
                      }}
                      options={[
                        { value: 'grid', label: 'Grille' },
                        { value: 'carousel', label: 'Carrousel' },
                      ]}
                    />
                    <Select
                      label="Colonnes"
                      value={String(blk.columns || '4')}
                      onChange={(e) => {
                        const next = [...extraBlocks];
                        next[bIdx] = { ...next[bIdx], columns: e.target.value };
                        setViews({ ...views, productDetail: { ...p, extraRecommendedBlocks: next } });
                      }}
                      options={[
                        { value: '3', label: '3 Colonnes' },
                        { value: '4', label: '4 Colonnes' },
                      ]}
                    />
                    <Input
                      label="Max Articles"
                      type="number"
                      min={2}
                      max={16}
                      value={blk.limit ?? 4}
                      onChange={(e) => {
                        const next = [...extraBlocks];
                        next[bIdx] = { ...next[bIdx], limit: Number(e.target.value) || 4 };
                        setViews({ ...views, productDetail: { ...p, extraRecommendedBlocks: next } });
                      }}
                    />
                  </div>
                  <DynamicTargetSelector
                    label={`Source Liste #${bIdx + 1}`}
                    targetType={blk.targetType || 'AUTO'}
                    onTargetTypeChange={(val) => {
                      const next = [...extraBlocks];
                      next[bIdx] = { ...next[bIdx], targetType: val };
                      setViews({ ...views, productDetail: { ...p, extraRecommendedBlocks: next } });
                    }}
                    selectedCategories={blk.targetCategorySlugs || []}
                    onCategoriesChange={(slugs) => {
                      const next = [...extraBlocks];
                      next[bIdx] = { ...next[bIdx], targetCategorySlugs: slugs };
                      setViews({ ...views, productDetail: { ...p, extraRecommendedBlocks: next } });
                    }}
                    selectedProducts={blk.targetProductIds || []}
                    onProductsChange={(ids) => {
                      const next = [...extraBlocks];
                      next[bIdx] = { ...next[bIdx], targetProductIds: ids };
                      setViews({ ...views, productDetail: { ...p, extraRecommendedBlocks: next } });
                    }}
                    categories={cmsCategories}
                    products={cmsProducts}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    if (viewKey === 'contact') {
      const c = views.contact;
      if (elemId === 'hero') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Badge Supérieur" value={c.badgeText ?? 'Service Client Royal'} onChange={(e) => setViews({ ...views, contact: { ...c, badgeText: e.target.value } })} />
            <Input label="Titre Principal" value={c.title ?? 'Contactez Notre Équipe'} onChange={(e) => setViews({ ...views, contact: { ...c, title: e.target.value } })} />
            <div className="md:col-span-2">
              <Textarea label="Texte d'Introduction" rows={2} value={c.subtitle ?? ''} onChange={(e) => setViews({ ...views, contact: { ...c, subtitle: e.target.value } })} />
            </div>
          </div>
        );
      }
      if (elemId === 'mainGrid') {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Disposition des 2 Blocs"
                value={c.layoutDirection || 'info-left'}
                onChange={(e) => setViews({ ...views, contact: { ...c, layoutDirection: e.target.value } })}
                options={[
                  { value: 'info-left', label: 'Coordonnées à Gauche · Formulaire à Droite' },
                  { value: 'form-left', label: 'Formulaire à Gauche · Coordonnées à Droite' },
                ]}
              />
              <Input label="Titre Bloc Coordonnées" value={c.infoTitle ?? 'Royal — Electro de Maison'} onChange={(e) => setViews({ ...views, contact: { ...c, infoTitle: e.target.value } })} />
              <Input label="Titre Formulaire" value={c.formTitle ?? 'Envoyer un message'} onChange={(e) => setViews({ ...views, contact: { ...c, formTitle: e.target.value } })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Toggle label="Afficher Réseaux Sociaux" checked={c.showSocials !== false} onChange={(v) => setViews({ ...views, contact: { ...c, showSocials: v } })} />
              <Toggle label="Champ Téléphone Obligatoire" checked={Boolean(c.phoneRequired)} onChange={(v) => setViews({ ...views, contact: { ...c, phoneRequired: v } })} />
              <Toggle label="Champ Email Obligatoire" checked={Boolean(c.emailRequired)} onChange={(v) => setViews({ ...views, contact: { ...c, emailRequired: v } })} />
              <Toggle label="Champ Sujet Obligatoire" checked={Boolean(c.subjectRequired)} onChange={(v) => setViews({ ...views, contact: { ...c, subjectRequired: v } })} />
            </div>
            <Input label="Texte Bouton Envoi" value={c.submitText ?? 'Envoyer le message'} onChange={(e) => setViews({ ...views, contact: { ...c, submitText: e.target.value } })} />
          </div>
        );
      }
      if (elemId === 'map') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Titre En-tête Carte" value={c.mapTitle ?? 'Localisation — Royal Electro de Maison'} onChange={(e) => setViews({ ...views, contact: { ...c, mapTitle: e.target.value } })} />
            <Input label="Hauteur Carte (px)" type="number" min={240} max={600} value={c.mapHeightPx ?? 380} onChange={(e) => setViews({ ...views, contact: { ...c, mapHeightPx: Number(e.target.value) || 380 } })} />
            <Input label="URL Embed Carte OpenStreetMap" value={c.mapEmbedUrl || ''} onChange={(e) => setViews({ ...views, contact: { ...c, mapEmbedUrl: e.target.value } })} />
          </div>
        );
      }
    }

    if (viewKey === 'faq') {
      const f = views.faq;
      if (elemId === 'hero') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Badge Supérieur" value={f.badgeText ?? 'Centre d’Aide Royal'} onChange={(e) => setViews({ ...views, faq: { ...f, badgeText: e.target.value } })} />
            <Input label="Titre FAQ" value={f.title ?? 'Foire Aux Questions'} onChange={(e) => setViews({ ...views, faq: { ...f, title: e.target.value } })} />
            <div className="flex items-end">
              <Toggle label="Afficher Barre de Recherche FAQ" checked={Boolean(f.showSearch)} onChange={(v) => setViews({ ...views, faq: { ...f, showSearch: v } })} />
            </div>
            <div className="md:col-span-3">
              <Textarea label="Sous-titre Introduction" rows={2} value={f.subtitle ?? ''} onChange={(e) => setViews({ ...views, faq: { ...f, subtitle: e.target.value } })} />
            </div>
          </div>
        );
      }
      if (elemId === 'categories') {
        return (
          <Toggle label="Afficher Boutons de Filtrage par Catégorie" checked={f.showCategoryFilter !== false} onChange={(v) => setViews({ ...views, faq: { ...f, showCategoryFilter: v } })} />
        );
      }
      if (elemId === 'questions') {
        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-5 bg-white p-5 rounded-2xl border border-[var(--royal-border)] space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--royal-ink)]">
                {editingFaqId ? 'Modifier la Question FAQ' : 'Ajouter une Question FAQ'}
              </h4>
              <Input label="Catégorie" value={newFaq.category} onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })} />
              <Input label="Question *" value={newFaq.question} onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })} />
              <Textarea label="Réponse *" rows={3} value={newFaq.answer} onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })} />
              <div className="flex gap-2">
                <Button variant="gold" size="sm" onClick={handleSaveFaq} isLoading={saving}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingFaqId ? 'Mettre à jour' : 'Ajouter à la FAQ'}</span>
                </Button>
                {editingFaqId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingFaqId(null);
                      setNewFaq({ category: 'Livraison & Commandes', question: '', answer: '', sortOrder: 0 });
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>
            <div className="xl:col-span-7 space-y-2.5">
              <div className="text-[11px] font-bold text-[var(--royal-gold-dark)]">
                Glisser-déposer pour ordonner ({faqItems.length} question(s))
              </div>
              {faqItems.map((it, idx) => (
                <div
                  key={it.id}
                  draggable
                  onDragStart={() => setDragFaqIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleFaqDrop(idx)}
                  className="p-3.5 rounded-2xl border border-[var(--royal-border)] bg-white flex items-start justify-between gap-3 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <GripVertical className="w-4 h-4 text-[var(--royal-primary)] mt-1 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-[var(--royal-gold-dark)]">#{idx + 1} · {it.category}</span>
                      <div className="text-xs font-bold text-[var(--royal-ink)]">{it.question}</div>
                      <p className="text-xs text-slate-600 line-clamp-2">{it.answer}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaqId(it.id);
                        setNewFaq({ category: it.category || 'Général', question: it.question, answer: it.answer, sortOrder: it.sortOrder || 0 });
                      }}
                      className="p-1.5 rounded-lg hover:bg-[var(--royal-gold-light)] text-[var(--royal-primary)] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDeleteFaq(it.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      if (elemId === 'cta') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Titre Encart" value={f.ctaTitle ?? 'Vous ne trouvez pas votre réponse ?'} onChange={(e) => setViews({ ...views, faq: { ...f, ctaTitle: e.target.value } })} />
            <Input label="Sous-titre" value={f.ctaSubtitle ?? 'Notre service client vous répond 7j/7.'} onChange={(e) => setViews({ ...views, faq: { ...f, ctaSubtitle: e.target.value } })} />
            <Input label="Libellé Bouton" value={f.ctaButtonText ?? 'Contacter le Support'} onChange={(e) => setViews({ ...views, faq: { ...f, ctaButtonText: e.target.value } })} />
          </div>
        );
      }
    }

    if (viewKey === 'terms' || viewKey === 'privacy') {
      const cfg = views[viewKey] || {};
      const pageState = viewKey === 'terms' ? termsPage : privacyPage;
      const setPageState = viewKey === 'terms' ? setTermsPage : setPrivacyPage;
      if (elemId === 'header') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Badge Supérieur" value={cfg.badgeText ?? ''} onChange={(e) => setViews({ ...views, [viewKey]: { ...cfg, badgeText: e.target.value } })} />
            <Input label="Titre Page Légale" value={pageState.title} onChange={(e) => setPageState({ ...pageState, title: e.target.value })} />
            <div className="flex items-end">
              <Toggle label="Afficher Lien Retour Accueil" checked={cfg.showBackLink !== false} onChange={(v) => setViews({ ...views, [viewKey]: { ...cfg, showBackLink: v } })} />
            </div>
            <div className="md:col-span-3">
              <Input label="Sous-titre Optionnel" value={pageState.subtitle || ''} onChange={(e) => setPageState({ ...pageState, subtitle: e.target.value })} />
            </div>
          </div>
        );
      }
      if (elemId === 'document') {
        return (
          <Textarea label="Contenu & Clauses (Utilisez ## pour les titres)" rows={10} value={pageState.content} onChange={(e) => setPageState({ ...pageState, content: e.target.value })} />
        );
      }
      if (elemId === 'footerNote') {
        return (
          <Input label="Note Légale Bas de Page" value={cfg.footerNoteText ?? ''} onChange={(e) => setViews({ ...views, [viewKey]: { ...cfg, footerNoteText: e.target.value } })} />
        );
      }
    }

    if (viewKey === 'showrooms') {
      const s = views.showrooms;
      if (elemId === 'hero') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Badge En-tête" value={s.badgeText ?? 'Réseau de Points de Vente'} onChange={(e) => setViews({ ...views, showrooms: { ...s, badgeText: e.target.value } })} />
            <Input label="Titre Principal" value={s.title ?? "Nos Salles d'Exposition"} onChange={(e) => setViews({ ...views, showrooms: { ...s, title: e.target.value } })} />
            <Input label="Sous-titre" value={s.subtitle ?? 'Découvrez nos showrooms en Tunisie.'} onChange={(e) => setViews({ ...views, showrooms: { ...s, subtitle: e.target.value } })} />
          </div>
        );
      }
      if (elemId === 'cards') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Style d'Affichage"
              value={s.layoutStyle || 'grid'}
              onChange={(e) => setViews({ ...views, showrooms: { ...s, layoutStyle: e.target.value } })}
              options={[
                { value: 'grid', label: 'Cartes en Grille Moderne' },
                { value: 'list', label: 'Liste Détaillée' },
              ]}
            />
            <Toggle label="Afficher Horaires" checked={Boolean(s.showHours)} onChange={(v) => setViews({ ...views, showrooms: { ...s, showHours: v } })} />
            <Toggle label="Afficher Numéros Directs" checked={Boolean(s.showPhone)} onChange={(v) => setViews({ ...views, showrooms: { ...s, showPhone: v } })} />
          </div>
        );
      }
      if (elemId === 'map') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Hauteur Carte (px)" type="number" min={240} max={600} value={s.mapHeightPx ?? 380} onChange={(e) => setViews({ ...views, showrooms: { ...s, mapHeightPx: Number(e.target.value) || 380 } })} />
            <Input label="URL Carte Iframe OpenStreetMap" value={s.mapEmbedUrl || ''} onChange={(e) => setViews({ ...views, showrooms: { ...s, mapEmbedUrl: e.target.value } })} />
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <div className="bg-white p-6 rounded-3xl border border-[var(--royal-border)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--royal-gold-light)] text-[var(--royal-primary)] border border-[var(--royal-border)] rounded-2xl">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[var(--royal-ink)] tracking-tight">
                CMS — Vues et Modèles Storefront ({orderedIds.length} éléments pour {currentTabInfo.label})
              </h1>
              <p className="text-xs text-slate-500">
                Glissez-déposez les cartes pour modifier l&apos;ordre d&apos;affichage, activez/masquez chaque bloc, et cliquez sur <strong>Détails</strong> pour configurer ses textes, images et options.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={currentTabInfo.publicHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--royal-border)] bg-white hover:bg-[var(--royal-gold-light)] text-xs font-bold text-[var(--royal-ink)] transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>Voir la page publique</span>
            </Link>
            <Button variant="outline" size="sm" onClick={handleResetDefaults} isLoading={resetting}>
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser</span>
            </Button>
            <Button variant="gold" size="sm" onClick={handleSaveViews} isLoading={saving}>
              <Save className="w-4 h-4" />
              <span>Enregistrer la Vue</span>
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Vues et modèles' },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 bg-white p-3 rounded-3xl border border-[var(--royal-border)] shadow-xs lg:sticky lg:top-24 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Vues Vitrine ({VIEW_TABS.length})
          </div>
          {VIEW_TABS.map((t) => {
            const Icon = t.icon;
            const active = activeView === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => router.replace(`/dashboard/root/storefront/views?view=${t.id}`, { scroll: false })}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition cursor-pointer ${
                  active
                    ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-xs'
                    : 'text-[var(--royal-ink)] hover:bg-[var(--royal-gold-light)]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[var(--royal-primary-text)]' : 'text-[var(--royal-primary)]'}`} />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Unified Ordered Accordion Element Cards for Selected View (All Closed By Default) */}
        <div className="lg:col-span-9 space-y-3">
        {orderedIds.map((elemId, idx) => {
          const meta = rawCatalog.find((e) => e.id === elemId);
          if (!meta) return null;
          const isOpen = Boolean(openAccordions[elemId]);
          const viewObj = views[viewStateKey] || {};
          const vis = meta.visibilityKey ? viewObj[meta.visibilityKey] !== false : undefined;

          return (
            <AccordionElementCard
              key={elemId}
              index={idx}
              total={orderedIds.length}
              title={meta.label}
              summary={meta.summary}
              icon={meta.icon}
              isOpen={isOpen}
              onToggleOpen={() => toggleAccordion(elemId)}
              visible={vis}
              onToggleVisible={
                meta.visibilityKey
                  ? (nextVal) =>
                      setViews((prev: any) => ({
                        ...prev,
                        [viewStateKey]: { ...prev[viewStateKey], [meta.visibilityKey!]: nextVal },
                      }))
                  : undefined
              }
              isDragging={dragIdx === idx}
              onDragStart={() => setDragIdx(idx)}
              onDrop={() => {
                if (dragIdx !== null) moveOrder(viewStateKey, orderedIds, dragIdx, idx);
                setDragIdx(null);
              }}
              onMoveUp={() => moveOrder(viewStateKey, orderedIds, idx, idx - 1)}
              onMoveDown={() => moveOrder(viewStateKey, orderedIds, idx, idx + 1)}
            >
              {renderElementEditor(viewStateKey, elemId)}
            </AccordionElementCard>
          );
        })}
        </div>
      </div>

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type="success" onClose={() => setToastMsg(null)} />
    </div>
  );
}

export default function StorefrontViewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement CMS Vues...</div>}>
      <StorefrontViewsContent />
    </Suspense>
  );
}
