'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  Tag,
  DollarSign,
  Image as ImageIcon,
  Check,
  AlertCircle,
  FileText,
  Search,
  Eye,
  EyeOff,
  Percent,
  Sliders,
  CheckCircle2,
  Upload,
  UploadCloud,
  X,
  Warehouse,
  Boxes,
  Globe,
  Settings,
  Share2,
  Calendar,
  ShieldCheck,
  Info,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Play,
  Pause,
  Store,
  MapPin,
  RefreshCw,
  Building2,
} from 'lucide-react';

import {
  DataTable,
  ColumnDef,
  DisplayMode,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Modal,
  DeleteConfirmModal,
  Breadcrumb,
  Toast,
} from '@/components/ui';
import { formatTndCurrency, cn } from '@/lib/utils';
import { API_BASE_URL, fetchApi, fetchAllPaginated } from '@/lib/api';
import { Eye as _ArtEye, EyeOff as _ArtEyeOff, FileEdit as _ArtDraft, Sparkles as _ArtStar, FolderTree as _ArtCat } from 'lucide-react';
import { useRouteVisibility } from '@/providers/DashboardVisibilityProvider';
import { useAuthStore } from '@/stores/auth.store';

interface ProductItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  nameAr?: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  sellingPrice: number;
  basePrice?: number;
  discountPrice?: number;
  promoStartDate?: string;
  promoEndDate?: string;
  taxRate?: number;
  weight?: number;
  dimensionsJson?: Record<string, any>;
  isFeatured?: boolean;
  isComparable?: boolean;
  status?: string;
  primaryImage?: string;
  images?: string[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
  variantsCount?: number;
  variants?: any[];
  metaTitle?: string;
  metaDesc?: string;
  metaKeywords?: string;

  // Audit & Tracking Fields
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  isUpdated?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

interface BrandOption {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface DynamicCharacteristic {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'BOOLEAN';
  unit?: string;
  options?: string[];
  categoryIds: string[];
  isRequired?: boolean;
}

interface DynamicVariantValue {
  id: string;
  label: string;
  colorHex?: string;
}

interface DynamicVariantFamily {
  id: string;
  name: string;
  code: string;
  visualType: 'COLOR_SWATCH' | 'TEXT_PILL';
  values: DynamicVariantValue[];
}

const DEFAULT_OFFICIAL_BRANDS: BrandOption[] = [
  { id: 'cmwdo1zn1000ao559e7edy33w', name: 'Bosch', slug: 'bosch', description: 'Gros électroménager et fours de précision allemande' },
  { id: 'cmwdo1zmn0008o559m8awgbep', name: 'DeLonghi', slug: 'delonghi', description: 'Cafetières et broyeurs espresso italiens' },
  { id: 'cmwdo1zmu0009o559tjvibm59', name: 'Tefal', slug: 'tefal', description: 'Poêles antiadhésives et petit électroménager' },
  { id: 'cmwdo1zmg0007o559z0nlnj3i', name: 'Kenwood', slug: 'kenwood', description: 'Robots pâtissiers et culinaires' },
  { id: 'cmwdo1zm10006o559n86vc3hg', name: 'Moulinex', slug: 'moulinex', description: 'Préparation culinaire du quotidien' },
  { id: 'cmwdo1zn7000bo559b6xxmpqi', name: 'Beko', slug: 'beko', description: 'Cuisinières et froid innovant' },
  { id: 'cmwdbq4og000ahlrs3m4nrm8v', name: 'Staub', slug: 'staub', description: 'Cocottes en fonte émaillée française' },
  { id: 'cmwdbq4of0009hlrsru8daked', name: 'Zwilling J.A. Henckels', slug: 'zwilling', description: 'Coutellerie d’exception de Solingen' },
  { id: 'cmwdbq4oa0008hlrso1b15k4r', name: 'Le Creuset', slug: 'le-creuset', description: 'Fonte émaillée et céramique d’art' },
  { id: 'cmwdbq4ok000bhlrs9i71uzzn', name: 'De Buyer', slug: 'de-buyer', description: 'Ustensiles de cuisson professionnelle' },
  { id: 'cmwdbq4ol000chlrse5y60crj', name: 'WMF', slug: 'wmf', description: 'Cuisson et art de la table allemand' },
  { id: 'cmwdbq4om000dhlrs1f00kerg', name: 'Christofle Paris', slug: 'christofle', description: 'Orfèvrerie de prestige et cristal' },
  { id: 'cmwdo1znd000co559b6oh8zbi', name: 'Philips', slug: 'philips', description: 'Airfryers et innovation maison' },
];

const DEFAULT_DYNAMIC_CHARACTERISTICS: DynamicCharacteristic[] = [
  {
    id: 'spec-puissance',
    name: 'Puissance Électrique',
    code: 'puissance_w',
    type: 'NUMBER',
    unit: 'W',
    categoryIds: ['cmwdo1zjh0002o559lgs9gk8c', 'cmwdo1zkc0003o5597alt78s1', 'cmwdo1zle0005o559lctijwzr', 'petit-electromenager', 'gros-electromenager', 'maison-et-entretien'],
    isRequired: true,
  },
  {
    id: 'spec-capacite',
    name: 'Capacité / Volume Utile',
    code: 'capacite_l',
    type: 'NUMBER',
    unit: 'Litres',
    categoryIds: ['cmwdo1zjh0002o559lgs9gk8c', 'cmwdo1zkc0003o5597alt78s1', 'cmwdbq4nb0002hlrs0v3qclcd', 'petit-electromenager', 'gros-electromenager', 'batterie-de-cuisine'],
    isRequired: true,
  },
  {
    id: 'spec-matiere',
    name: 'Matière / Revêtement Principal',
    code: 'matiere_revetement',
    type: 'SELECT',
    options: ['Inox 18/10 Chirurgical', 'Granit Anti-adhésif 9 Couches', 'Fonte Émaillée Tradition', 'Céramique Grand Cru', 'Acier Damas VG-10', 'Verre Trempé'],
    categoryIds: ['cmwdbq4nb0002hlrs0v3qclcd', 'cmwdbq4ny0003hlrs71ojxd7b', 'cmwdbq4o00004hlrszw40soub', 'batterie-de-cuisine', 'coutellerie-haute-precision', 'art-de-la-table'],
    isRequired: true,
  },
  {
    id: 'spec-compat-induction',
    name: 'Compatible Induction',
    code: 'compatible_induction',
    type: 'BOOLEAN',
    categoryIds: ['cmwdbq4nb0002hlrs0v3qclcd', 'cmwdo1zl20004o559ziro23hm', 'batterie-de-cuisine', 'cuisine-et-preparation'],
    isRequired: false,
  },
  {
    id: 'spec-longueur-lame',
    name: 'Longueur de Lame',
    code: 'longueur_lame_cm',
    type: 'NUMBER',
    unit: 'cm',
    categoryIds: ['cmwdbq4ny0003hlrs71ojxd7b', 'coutellerie-haute-precision'],
    isRequired: true,
  },
  {
    id: 'spec-pression',
    name: 'Pression Pompe / Vapeur',
    code: 'pression_bars',
    type: 'NUMBER',
    unit: 'Bars',
    categoryIds: ['cmwdo1zjh0002o559lgs9gk8c', 'cmwdo1zle0005o559lctijwzr', 'petit-electromenager', 'maison-et-entretien'],
    isRequired: false,
  },
  {
    id: 'spec-garantie',
    name: 'Garantie Constructeur',
    code: 'garantie_ans',
    type: 'NUMBER',
    unit: 'Ans',
    categoryIds: [],
    isRequired: true,
  },
  {
    id: 'spec-origine',
    name: 'Pays d’Origine / Fabrication',
    code: 'pays_origine',
    type: 'SELECT',
    options: ['Allemagne', 'France', 'Italie', 'Japon', 'Suisse', 'Turquie', 'Tunisie'],
    categoryIds: [],
    isRequired: false,
  },
];

const DEFAULT_DYNAMIC_VARIANT_FAMILIES: DynamicVariantFamily[] = [
  {
    id: 'fam-color',
    name: 'Coloris & Nuances',
    code: 'couleur',
    visualType: 'COLOR_SWATCH',
    values: [
      { id: 'c-noir', label: 'Noir Mat Profond', colorHex: '#1c1917' },
      { id: 'c-rouge', label: 'Rouge Cerise', colorHex: '#b91c1c' },
      { id: 'c-inox', label: 'Inox Brossé Argent', colorHex: '#94a3b8' },
      { id: 'c-creme', label: 'Crème Vintage Ivoire', colorHex: '#fef3c7' },
      { id: 'c-bleu', label: 'Bleu Nuit', colorHex: '#1e3a8a' },
    ],
  },
  {
    id: 'fam-taille',
    name: 'Dimensions & Formats',
    code: 'taille',
    visualType: 'TEXT_PILL',
    values: [
      { id: 't-20', label: '20 cm' },
      { id: 't-24', label: '24 cm' },
      { id: 't-28', label: '28 cm' },
      { id: 't-32', label: '32 cm' },
      { id: 't-5l', label: '5.0 Litres' },
      { id: 't-8l', label: '8.5 Litres Double Tiroir' },
    ],
  },
  {
    id: 'fam-puissance',
    name: 'Puissances & Motorisations',
    code: 'puissance',
    visualType: 'TEXT_PILL',
    values: [
      { id: 'p-800', label: '800 W' },
      { id: 'p-1200', label: '1200 W' },
      { id: 'p-1600', label: '1600 W Titanium Pro' },
      { id: 'p-2000', label: '2000 W Multicyclone' },
      { id: 'p-2400', label: '2400 W Double Résistance' },
    ],
  },
  {
    id: 'fam-revetement',
    name: 'Revêtements & Matériaux',
    code: 'revetement',
    visualType: 'TEXT_PILL',
    values: [
      { id: 'r-granit', label: 'Granit Anti-adhésif 9 Couches' },
      { id: 'r-inox', label: 'Inox 18/10 Chirurgical' },
      { id: 'r-fonte', label: 'Fonte Émaillée' },
      { id: 'r-damas', label: 'Acier Damassé VG-10' },
    ],
  },
];

const DEFAULT_DEMO_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-cuisiniere-60',
    sku: 'DKN-CUIS-60-INOX',
    name: 'Cuisinière Tout Inox 60x60 — 4 Feux Gaz Sécurité Thermocouple',
    nameAr: 'طباخ غاز كامل إينوكس 60×60',
    slug: 'cuisiniere-tout-inox-60x60',
    sellingPrice: 1150,
    basePrice: 950,
    discountPrice: 1049,
    status: 'ACTIVE',
    isFeatured: true,
    primaryImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    category: { id: 'cat-gros-electro', name: 'Gros Électroménager', slug: 'gros-electromenager' },
    brand: { id: 'brand-beko', name: 'Beko', slug: 'beko' },
    variantsCount: 3,
    createdAt: '2026-11-15T09:00:00.000Z',
    updatedAt: '2026-11-15T09:00:00.000Z',
    createdBy: 'SUPER_ADMIN',
    isUpdated: false,
    isDeleted: false,
  },
  {
    id: 'prod-airfryer-double',
    sku: 'PHL-AF-XXL-2T',
    name: 'Airfryer XXL Double Tiroir DualZone 8.5L — Technologie AirRapid 2400W',
    nameAr: 'قلاية هوائية مزدوجة الأدراج 8.5 لتر',
    slug: 'airfryer-xxl-double-tiroir',
    sellingPrice: 599,
    basePrice: 420,
    discountPrice: 529,
    status: 'ACTIVE',
    isFeatured: true,
    primaryImage: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80',
    category: { id: 'cat-petit-electro', name: 'Petit Électroménager', slug: 'petit-electromenager' },
    brand: { id: 'brand-tefal', name: 'Tefal', slug: 'tefal' },
    variantsCount: 2,
    createdAt: '2026-11-14T14:00:00.000Z',
    updatedAt: '2026-11-14T14:00:00.000Z',
    createdBy: 'ADMIN',
    isUpdated: false,
    isDeleted: false,
  },
  {
    id: 'prod-espresso-barista',
    sku: 'DLG-ESP-SPEC-9355',
    name: 'Machine Espresso Barista La Specialista Prestigio Broyeur Intégré',
    nameAr: 'ماكينة قهوة إسبريسو احترافية مع مطحنة',
    slug: 'machine-espresso-barista-la-specialista',
    sellingPrice: 2450,
    basePrice: 1980,
    discountPrice: 2290,
    status: 'ACTIVE',
    isFeatured: true,
    primaryImage: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
    category: { id: 'cat-petit-electro', name: 'Petit Électroménager', slug: 'petit-electromenager' },
    brand: { id: 'brand-delonghi', name: 'DeLonghi', slug: 'delonghi' },
    variantsCount: 4,
    createdAt: '2026-11-10T11:20:00.000Z',
    updatedAt: '2026-11-10T11:20:00.000Z',
    createdBy: 'ADMIN',
    isUpdated: false,
    isDeleted: false,
  },
  {
    id: 'prod-batterie-granit',
    sku: 'BAT-GRANIT-10P-GRIS',
    name: 'Batterie de Cuisine Granit Anti-adhésif 10 Pièces Induction Intégrale',
    nameAr: 'طقم أواني طهي جرانيت 10 قطع',
    slug: 'batterie-cuisine-granit-10p',
    sellingPrice: 429,
    basePrice: 290,
    discountPrice: 389,
    status: 'ACTIVE',
    isFeatured: false,
    primaryImage: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80',
    category: { id: 'cat-cuisine-prepa', name: 'Cuisine & Préparation', slug: 'cuisine-et-preparation' },
    brand: { id: 'brand-tefal', name: 'Tefal', slug: 'tefal' },
    variantsCount: 2,
    createdAt: '2026-11-02T16:45:00.000Z',
    updatedAt: '2026-11-02T16:45:00.000Z',
    createdBy: 'ADMIN',
    isUpdated: false,
    isDeleted: false,
  },
  {
    id: 'prod-couteau-santoku',
    sku: 'ZWL-PRO-SANTOKU-18',
    name: 'Couteau Santoku Japonais Alvéolé 18cm Acier Forgé Friodur',
    nameAr: 'سكين سانتوكو ياباني احترافي 18 سم',
    slug: 'couteau-santoku-japonais-18cm',
    sellingPrice: 289,
    basePrice: 195,
    discountPrice: 259,
    status: 'ACTIVE',
    isFeatured: true,
    primaryImage: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80',
    category: { id: 'cat-coutellerie', name: 'Coutellerie Haute Précision', slug: 'coutellerie-haute-precision' },
    brand: { id: 'brand-zwilling', name: 'Zwilling J.A. Henckels', slug: 'zwilling' },
    variantsCount: 1,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    createdBy: 'SYSTEM',
    isUpdated: false,
    isDeleted: false,
  },
];


interface VariantFormItem {
  id?: string;
  sku: string;
  name: string;
  size?: string;
  color?: string;
  colorHex?: string;
  power?: string;
  sellingPrice?: number;
  purchasePrice?: number;
  stock?: number;
}

type FormSectionId =
  | 'general'
  | 'pricing'
  | 'inventory'
  | 'media'
  | 'variants'
  | 'characteristics'
  | 'seo'
  | 'status';

interface FormSectionTab {
  id: FormSectionId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const FORM_SECTIONS: FormSectionTab[] = [
  {
    id: 'general',
    label: 'Informations Générales',
    description: 'Nom, SKU maître, catégorie & marque',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'pricing',
    label: 'Tarification & Taux',
    description: 'Prix public, coût, remises & taux de TVA',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    id: 'inventory',
    label: 'Stocks Physiques & Entrepôts',
    description: 'Niveau initial, alertes & politique de rupture',
    icon: <Warehouse className="w-4 h-4" />,
  },
  {
    id: 'media',
    label: 'Médias & Galerie',
    description: 'Image principale, galerie & miniatures',
    icon: <ImageIcon className="w-4 h-4" />,
  },
  {
    id: 'variants',
    label: 'Variantes & Déclinaisons',
    description: 'Tailles, coloris, puissances & SKU dérivés',
    icon: <Boxes className="w-4 h-4" />,
  },
  {
    id: 'characteristics',
    label: 'Caractéristiques Techniques',
    description: 'Attributs dynamiques selon le rayon',
    icon: <Sliders className="w-4 h-4" />,
  },
  {
    id: 'seo',
    label: 'Référencement & SEO',
    description: 'Balises meta, slug URL & aperçu Google',
    icon: <Globe className="w-4 h-4" />,
  },
  {
    id: 'status',
    label: 'Statut & Publication',
    description: 'Visibilité storefront, vedette & comparateur',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
];

export default function DashboardArticlesPage() {
  const { isRouteVisible, isRoot } = useRouteVisibility();
  const canDeleteProduct = useAuthStore((s) => s.hasPermission('products.delete'));
  const canSeeInventory = isRouteVisible('/dashboard/inventory');
  // Main Data States
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [brands, setBrands] = React.useState<BrandOption[]>(DEFAULT_OFFICIAL_BRANDS);
  const [characteristicsList, setCharacteristicsList] = React.useState<DynamicCharacteristic[]>(DEFAULT_DYNAMIC_CHARACTERISTICS);
  const [variantFamiliesList, setVariantFamiliesList] = React.useState<DynamicVariantFamily[]>(DEFAULT_DYNAMIC_VARIANT_FAMILIES);
  const [isLoading, setIsLoading] = React.useState(true);

  // Multi-selection state
  const [selectedProductIds, setSelectedProductIds] = React.useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = React.useState<string>('');

  // Auto-play slideshow state for split & matrix modes
  const [autoPlayImages, setAutoPlayImages] = React.useState(false);
  const [slideTick, setSlideTick] = React.useState(0);

  // Grid / Split image navigation & Lightbox State
  const [productImageIndices, setProductImageIndices] = React.useState<Record<string, number>>({});
  const [lightboxData, setLightboxData] = React.useState<{ images: string[]; currentIndex: number; title: string } | null>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit'>('create');
  const [activeSection, setActiveSection] = React.useState<FormSectionId>('general');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Stock Depot Breakdown Modal
  const [stockModalProduct, setStockModalProduct] = React.useState<ProductItem | null>(null);

  // Delete modal state
  const [productToDelete, setProductToDelete] = React.useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false);

  // Form Data
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);

  // Floating Toast State
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };
  const [formData, setFormData] = React.useState({
    id: '',
    name: '',
    nameAr: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    shortDescription: '',
    description: '',
    basePrice: 0,
    sellingPrice: 0,
    discountPrice: 0,
    promoStartDate: '',
    promoEndDate: '',
    taxRate: 0.19,
    stockQuantity: 0,
    lowStockThreshold: 0,
    allowBackorders: false,
    images: [] as string[],
    primaryImageIndex: 0,
    newImageUrl: '',
    variants: [] as VariantFormItem[],
    newVariant: {
      sku: '',
      name: '',
      size: '',
      color: '',
      colorHex: '',
      power: '',
      sellingPrice: 0,
    },
    characteristics: {} as Record<string, any>,
    slug: '',
    metaTitle: '',
    metaDesc: '',
    focusKeyword: '',
    ogTitle: '',
    ogDescription: '',
    allowIndexing: true,
    status: 'ACTIVE',
    isFeatured: false,
    isComparable: true,
  });

  // Scalable Dynamic Variant Generator States (+100 families, +10 values)
  const [selectedGeneratorFamilyId, setSelectedGeneratorFamilyId] = React.useState('');
  const [selectedGeneratorValueIds, setSelectedGeneratorValueIds] = React.useState<string[]>([]);
  const [configuredVariantAxes, setConfiguredVariantAxes] = React.useState<
    { familyId: string; familyName: string; visualType?: string; values: { id: string; label: string; colorHex?: string }[] }[]
  >([]);

  // Add an attribute dimension axis
  const handleAddVariantAxis = () => {
    if (!selectedGeneratorFamilyId || selectedGeneratorValueIds.length === 0) return;
    const fam = variantFamiliesList.find((f) => f.id === selectedGeneratorFamilyId);
    if (!fam) return;

    const chosenValues = fam.values.filter((v) => selectedGeneratorValueIds.includes(v.id));
    if (chosenValues.length === 0) return;

    setConfiguredVariantAxes((prev) => {
      const existing = prev.filter((a) => a.familyId !== fam.id);
      return [
        ...existing,
        {
          familyId: fam.id,
          familyName: fam.name,
          visualType: fam.visualType,
          values: chosenValues,
        },
      ];
    });

    setSelectedGeneratorFamilyId('');
    setSelectedGeneratorValueIds([]);
  };

  // Generate Cartesian combinations from configured axes
  const handleGenerateVariantCombinations = () => {
    if (configuredVariantAxes.length === 0) return;

    let combos: { labels: string[]; colors: string[]; sizes: string[]; powers: string[] }[] = [
      { labels: [], colors: [], sizes: [], powers: [] },
    ];

    for (const axis of configuredVariantAxes) {
      const nextCombos: typeof combos = [];
      const isColor = axis.visualType === 'COLOR_SWATCH' || axis.familyId.includes('color');
      const isSize =
        axis.familyId.includes('taille') ||
        axis.familyId.includes('size') ||
        axis.familyId.includes('dim');
      const isPower = axis.familyId.includes('puissance') || axis.familyId.includes('pow');

      for (const current of combos) {
        for (const val of axis.values) {
          nextCombos.push({
            labels: [...current.labels, val.label],
            colors: isColor ? [...current.colors, val.label] : current.colors,
            sizes: isSize ? [...current.sizes, val.label] : current.sizes,
            powers: isPower ? [...current.powers, val.label] : current.powers,
          });
        }
      }
      combos = nextCombos;
    }

    const generatedItems: VariantFormItem[] = combos.map((combo, idx) => {
      const name = combo.labels.join(' — ');
      const skuSuffix = combo.labels
        .map((l) => l.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
        .join('-');
      return {
        id: `gen-var-${Date.now()}-${idx}`,
        name: name,
        sku: `${formData.sku || 'ART'}-${skuSuffix || idx + 1}`,
        color: combo.colors[0] || '',
        size: combo.sizes[0] || '',
        power: combo.powers[0] || '',
        sellingPrice: formData.sellingPrice,
      };
    });

    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, ...generatedItems],
    }));

    setConfiguredVariantAxes([]);
  };

  // Auto-play interval timer
  React.useEffect(() => {
    if (!autoPlayImages) return;
    const interval = setInterval(() => {
      setSlideTick((prev) => prev + 1);
    }, 2400);
    return () => clearInterval(interval);
  }, [autoPlayImages]);

  // Data loader
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodsRes, catsRes, brandsRes, charsRes, varsRes] = await Promise.all([
        fetchAllPaginated<any>('/products', 200)
          .then(({ items }) => ({ data: items }))
          .catch(() => null),
        fetchApi('/categories?tree=false').catch(() => null),
        fetchApi('/brands').catch(() => null),
        fetchApi('/characteristics').catch(() => null),
        fetchApi('/variants').catch(() => null),
      ]);

      if (prodsRes) {
        const list = Array.isArray(prodsRes) ? prodsRes : prodsRes.data || [];
        setProducts(list);
      } else {
        setProducts(DEFAULT_DEMO_PRODUCTS);
      }
      if (catsRes) {
        const cList = Array.isArray(catsRes) ? catsRes : catsRes.data || [];
        setCategories(cList);
      }
      if (brandsRes) {
        const bList = Array.isArray(brandsRes) ? brandsRes : brandsRes.data || [];
        if (bList.length > 0) {
          setBrands(bList);
        } else {
          setBrands(DEFAULT_OFFICIAL_BRANDS);
        }
      } else {
        setBrands(DEFAULT_OFFICIAL_BRANDS);
      }

      if (charsRes) {
        const chList = Array.isArray(charsRes) ? charsRes : charsRes.data || [];
        if (chList.length > 0) setCharacteristicsList(chList);
      }
      if (varsRes) {
        const vList = Array.isArray(varsRes) ? varsRes : varsRes.data || [];
        if (vList.length > 0) setVariantFamiliesList(vList);
      }
    } catch (err) {
      console.error('Erreur chargement catalogue:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper for generating slug automatically from product name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingProductId(null);
    setActiveSection('general');
    setFormError(null);
    const newSku = `FLR-${Math.floor(1000 + Math.random() * 9000)}`;

    setFormData({
      id: `prod_${Date.now()}`,
      name: '',
      nameAr: '',
      sku: newSku,
      barcode: '',
      categoryId: categories[0]?.id || '',
      brandId: brands[0]?.id || '',
      shortDescription: '',
      description: '',
      basePrice: 0,
      sellingPrice: 0,
      discountPrice: 0,
      promoStartDate: '',
      promoEndDate: '',
      taxRate: 0.19,
      stockQuantity: 0,
      lowStockThreshold: 0,
      allowBackorders: false,
      images: [
        'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
      ],
      primaryImageIndex: 0,
      newImageUrl: '',
      variants: [],
      newVariant: {
        sku: '',
        name: '',
        size: '',
        color: '',
        colorHex: '',
        power: '',
        sellingPrice: 0,
      },
      characteristics: {},
      slug: '',
      metaTitle: '',
      metaDesc: '',
      focusKeyword: '',
      ogTitle: '',
      ogDescription: '',
      allowIndexing: true,
      status: 'ACTIVE',
      isFeatured: false,
      isComparable: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (product: ProductItem) => {
    setModalMode('edit');
    setEditingProductId(product.id);
    setActiveSection('general');
    setFormError(null);

    const existingImages =
      product.images && product.images.length > 0
        ? product.images
            .map((img: any) => (typeof img === 'string' ? img : img?.url))
            .filter(Boolean)
        : product.primaryImage
        ? [product.primaryImage]
        : [];

    setFormData({
      id: product.id,
      name: product.name || '',
      nameAr: product.nameAr || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      categoryId: product.category?.id || categories[0]?.id || '',
      brandId: product.brand?.id || brands[0]?.id || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      basePrice: product.basePrice || Number(product.sellingPrice) * 0.6 || 0,
      sellingPrice: Number(product.sellingPrice) || 0,
      discountPrice: product.discountPrice ? Number(product.discountPrice) : 0,
      promoStartDate: product.promoStartDate || '',
      promoEndDate: product.promoEndDate || '',
      taxRate: product.taxRate || 0.19,
      stockQuantity: Number((product as any).availableStock ?? product.dimensionsJson?.stockQuantity ?? 200),
      lowStockThreshold: Number(product.dimensionsJson?.lowStockThreshold) || 0,
      allowBackorders: Boolean(product.dimensionsJson?.allowBackorders),
      images: existingImages,
      primaryImageIndex: 0,
      newImageUrl: '',
      variants: (product.variants || []).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        size: v.attributesJson?.size,
        color: v.attributesJson?.color,
        colorHex: v.attributesJson?.colorHex,
        power: v.attributesJson?.power,
        sellingPrice: Number(v.sellingPrice) || product.sellingPrice,
      })),
      newVariant: {
        sku: '',
        name: '',
        size: '',
        color: '',
        colorHex: '',
        power: '',
        sellingPrice: 0,
      },
      characteristics: { ...(product.dimensionsJson || {}) },
      slug: product.slug || generateSlug(product.name || ''),
      metaTitle: product.metaTitle || `${product.name} | Royal`,
      metaDesc: product.metaDesc || product.shortDescription || '',
      focusKeyword: product.metaKeywords || '',
      ogTitle: product.metaTitle || product.name,
      ogDescription: product.metaDesc || product.shortDescription || '',
      allowIndexing: true,
      status: product.status || 'ACTIVE',
      isFeatured: !!product.isFeatured,
      isComparable: product.isComparable !== false,
    });
    setIsModalOpen(true);
  };

  // Toggle Visibility Online (ACTIVE vs INACTIVE)
  const handleToggleVisibility = async (product: ProductItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLive = product.status === 'ACTIVE' || !product.status;
    const newStatus = isLive ? 'INACTIVE' : 'ACTIVE';

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
    );

    try {
      await fetchApi(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(
        'success',
        `L'article "${product.name}" est maintenant ${newStatus === 'ACTIVE' ? 'en ligne' : 'masqué'}.`
      );
    } catch (err) {
      console.error('Erreur mise à jour statut article:', err);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: product.status } : p))
      );
      showToast('error', "Impossible de mettre à jour le statut de l'article.");
    }
  };

  // Upload images to backend (/storefront-cms/cms/upload-image -> Data URI on Vercel or media path locally)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);
    e.target.value = '';

    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(new Error('read error'));
        reader.readAsDataURL(file);
      });

    const token = typeof window !== 'undefined' ? localStorage.getItem('royal_token') : null;
    const uploadedUrls = await Promise.all(
      fileList.map(async (file) => {
        try {
          const fd = new FormData();
          fd.append('file', file, file.name);
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const res = await fetch(`${API_BASE_URL}/storefront-cms/cms/upload-image`, {
            method: 'POST',
            headers,
            body: fd,
            credentials: 'include',
          });
          if (res.ok) {
            const json = await res.json();
            const url = json?.data?.url || json?.url;
            if (url) return url as string;
          }
        } catch {
          // Fallback below
        }
        return toDataUrl(file);
      }),
    );

    const validUrls = uploadedUrls.filter(Boolean);
    if (validUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...validUrls],
      }));
    }
  };

  const handleAddImageUrl = () => {
    if (!formData.newImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, prev.newImageUrl.trim()],
      newImageUrl: '',
    }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const updated = prev.images.filter((_, i) => i !== index);
      const newPrimary = prev.primaryImageIndex >= updated.length ? 0 : prev.primaryImageIndex;
      return { ...prev, images: updated, primaryImageIndex: newPrimary };
    });
  };

  const handleAddVariant = () => {
    const { sku, name, size, color, colorHex, power, sellingPrice } = formData.newVariant;
    if (!name.trim()) return;
    const vSku = sku.trim() || `${formData.sku}-${formData.variants.length + 1}`;
    const vPrice = Number(sellingPrice) > 0 ? Number(sellingPrice) : formData.sellingPrice;

    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: vSku,
          name: name.trim(),
          size: size?.trim(),
          color: color?.trim(),
          colorHex: colorHex || undefined,
          power: power?.trim(),
          sellingPrice: vPrice,
        },
      ],
      newVariant: { sku: '', name: '', size: '', color: '', colorHex: '', power: '', sellingPrice: 0 },
    }));
  };

  const handleRemoveVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // Submit article creation/update
  const handleSaveProduct = async () => {
    setIsSubmitting(true);
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Le nom de l’article en français est obligatoire.');
      setActiveSection('general');
      setIsSubmitting(false);
      return;
    }
    if (!formData.sku.trim()) {
      setFormError('Le SKU maître est obligatoire.');
      setActiveSection('general');
      setIsSubmitting(false);
      return;
    }
    if (!formData.categoryId) {
      setFormError('Veuillez sélectionner une catégorie.');
      setActiveSection('general');
      setIsSubmitting(false);
      return;
    }
    if (formData.sellingPrice <= 0) {
      setFormError('Le prix de vente public doit être supérieur à 0 TND.');
      setActiveSection('pricing');
      setIsSubmitting(false);
      return;
    }

    const payload: any = {
      name: formData.name.trim(),
      nameAr: formData.nameAr?.trim() || undefined,
      sku: formData.sku.trim(),
      barcode: formData.barcode?.trim() || undefined,
      slug: formData.slug.trim() || generateSlug(formData.name),
      categoryId: formData.categoryId,
      brandId: formData.brandId || undefined,
      shortDescription: formData.shortDescription?.trim() || undefined,
      description: formData.description?.trim() || undefined,
      basePrice: Number(formData.basePrice) || Number(formData.sellingPrice) * 0.6,
      sellingPrice: Number(formData.sellingPrice),
      discountPrice: Number(formData.discountPrice) > 0 ? Number(formData.discountPrice) : undefined,
      taxRate: Number(formData.taxRate) || 0.19,
      initialStock: Number(formData.stockQuantity) > 0 ? Number(formData.stockQuantity) : 20,
      dimensionsJson: {
        ...formData.characteristics,
        stockQuantity: formData.stockQuantity,
        lowStockThreshold: formData.lowStockThreshold,
        allowBackorders: formData.allowBackorders,
      },
      metaTitle: formData.metaTitle || `${formData.name} | Royal Tunisie`,
      metaDesc:
        formData.metaDesc ||
        formData.shortDescription ||
        `Découvrez ${formData.name} au meilleur prix chez Royal Tunisie.`,
      metaKeywords: formData.focusKeyword || undefined,
      status: formData.status,
      isFeatured: formData.isFeatured,
      isComparable: formData.isComparable,
      images: formData.images.map((url, idx) => ({
        url,
        isPrimary: idx === formData.primaryImageIndex,
        sortOrder: idx,
      })),
      variants:
        formData.variants.length > 0
          ? formData.variants.map((v) => ({
              sku: v.sku,
              name: v.name,
              sellingPrice: Number(v.sellingPrice) || Number(formData.sellingPrice),
              attributesJson: {
                ...(v.size ? { size: v.size } : {}),
                ...(v.color ? { color: v.color } : {}),
                ...(v.power ? { power: v.power } : {}),
              },
            }))
          : [
              {
                sku: `${formData.sku}-STD`,
                name: 'Standard',
                sellingPrice: Number(formData.sellingPrice),
                attributesJson: { standard: true },
              },
            ],
    };

    try {
      if (modalMode === 'create') {
        await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else if (editingProductId) {
        await fetchApi(`/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l’enregistrement de l’article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Single delete
  const handleConfirmSingleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await fetchApi(`/products/${productToDelete.id}`, { method: 'DELETE' });
      setProductToDelete(null);
      setSelectedProductIds((prev) => prev.filter((id) => id !== productToDelete.id));
      await loadData();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Erreur lors de la suppression de l’article.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete
  const handleConfirmBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedProductIds.map((id) =>
          fetchApi(`/products/${id}`, { method: 'DELETE' }).catch(() => null)
        )
      );
      setSelectedProductIds([]);
      setIsBulkDeleteModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: 'Erreur lors de la suppression groupée.',
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkProductPatch = async (
    patch: { status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT'; isFeatured?: boolean; categoryId?: string },
    successLabel: string
  ) => {
    if (selectedProductIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.allSettled(
        selectedProductIds.map((id) =>
          fetchApi(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(patch),
          })
        )
      );
      showToast('success', `${selectedProductIds.length} article(s) ${successLabel}.`);
      setSelectedProductIds([]);
      await loadData();
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la mise à jour groupée.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Reusable action buttons with colors and hover popup tooltip
  const renderActionButtons = (item: ProductItem) => {
    const isLive = item.status === 'ACTIVE' || !item.status;

    return (
      <div className="flex items-center gap-1.5 no-print">
        {/* 1. Voir la fiche publique (Info - Blue) */}
        <Link
          href={`/products/${item.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition relative group/btn shadow-2xs"
          aria-label="Voir la fiche publique"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:block z-50 bg-neutral-950 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap shadow-md">
            Voir la fiche publique
          </span>
        </Link>

        {/* 2. Toggle Visibilité Storefront (Success Green if active, Muted if hidden) */}
        <button
          type="button"
          onClick={(e) => handleToggleVisibility(item, e)}
          className={cn(
            'p-1.5 rounded-lg border transition relative group/btn shadow-2xs',
            isLive
              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
              : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'
          )}
          aria-label={isLive ? 'Masquer du storefront' : 'Publier sur le storefront'}
        >
          {isLive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:block z-50 bg-neutral-950 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap shadow-md">
            {isLive ? 'En ligne (cliquez pour masquer)' : 'Masqué (cliquez pour publier)'}
          </span>
        </button>

        {/* 3. Modifier (Warning - Amber) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEdit(item);
          }}
          className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition relative group/btn shadow-2xs"
          aria-label="Modifier la fiche"
        >
          <Edit className="w-3.5 h-3.5" />
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:block z-50 bg-neutral-950 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap shadow-md">
            Modifier l'article
          </span>
        </button>

        {/* 4. Supprimer (Danger - Rose) */}
        {canDeleteProduct && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setProductToDelete(item);
            }}
            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition relative group/btn shadow-2xs"
            aria-label="Supprimer l'article"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:block z-50 bg-rose-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap shadow-md">
              Supprimer définitivement
            </span>
          </button>
        )}
      </div>
    );
  };

  // Helper to extract normalized URL string from string or { url } image entry
  const normalizeImageUrl = (entry: any): string | null => {
    if (!entry) return null;
    if (typeof entry === 'string') return entry.trim() || null;
    if (typeof entry === 'object' && typeof entry.url === 'string') return entry.url.trim() || null;
    return null;
  };

  // Helper to extract full image list for an article
  const getItemImageList = (item: ProductItem): string[] => {
    const urls: string[] = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
      for (const entry of item.images) {
        const u = normalizeImageUrl(entry);
        if (u && !urls.includes(u)) urls.push(u);
      }
    }
    const primary = normalizeImageUrl(item.primaryImage);
    if (primary && !urls.includes(primary)) {
      urls.unshift(primary);
    }
    return urls;
  };

  // Helper to get active image index taking into account auto-play & manual swing
  const getProductActiveImageIndex = (item: ProductItem): number => {
    const list = getItemImageList(item);
    if (list.length <= 1) return 0;
    if (autoPlayImages) {
      return slideTick % list.length;
    }
    return (productImageIndices[item.id] ?? 0) % list.length;
  };

  // Helper to get active image for a product
  const getProductDisplayImage = (item: ProductItem) => {
    const list = getItemImageList(item);
    if (list.length === 0) return null;
    const idx = getProductActiveImageIndex(item);
    return list[idx] || list[0];
  };

  // Table Columns Definition
  const columns: ColumnDef<ProductItem>[] = [
    {
      key: 'product',
      header: 'Article & Référence',
      sortable: true,
      sortValue: (item) => item.name,
      render: (item) => {
        const thumbSrc = getProductDisplayImage(item);
        return (
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/80">
              {thumbSrc ? (
                <Image
                  src={thumbSrc}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-neutral-900 truncate max-w-xs sm:max-w-md text-xs">
                {item.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                <span className="font-mono font-medium">{item.sku}</span>
                {item.isFeatured && (
                  <span className="text-amber-600 font-semibold text-[10px] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    ★ Vedette
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
      printRender: (item) => {
        const imgSrc = getProductDisplayImage(item);
        return (
          <div className="flex items-center gap-2">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt=""
                className="w-8 h-8 rounded object-cover border border-neutral-300 inline-block"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-neutral-100 border border-neutral-300 flex items-center justify-center text-[9px] font-bold text-neutral-700 inline-flex">
                ART
              </div>
            )}
            <div>
              <div className="font-bold text-neutral-900">{item.name}</div>
              <div className="text-[10px] text-neutral-500 font-mono">{item.sku}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      header: 'Catégorie',
      sortable: true,
      sortValue: (item) => item.category?.name || '',
      render: (item) => (
        <div className="text-xs">
          <div className="font-semibold text-neutral-800">
            {item.category?.name || 'Général'}
          </div>
          {item.brand && (
            <div className="text-[11px] text-neutral-400">{item.brand.name}</div>
          )}
        </div>
      ),
      printRender: (item) => `${item.category?.name || 'Général'}${item.brand ? ` - ${item.brand.name}` : ''}`,
    },
    {
      key: 'sellingPrice',
      header: 'Prix Public',
      sortable: true,
      sortValue: (item) => Number(item.sellingPrice || 0),
      render: (item) => (
        <div className="text-xs">
          <div className="font-bold text-neutral-900">
            {formatTndCurrency(item.sellingPrice)}
          </div>
          {item.discountPrice && Number(item.discountPrice) < Number(item.sellingPrice) && (
            <div className="text-[10px] text-red-600 font-medium">
              Promo: {formatTndCurrency(item.discountPrice)}
            </div>
          )}
        </div>
      ),
      printRender: (item) => formatTndCurrency(item.sellingPrice),
    },
    {
      key: 'stock',
      header: 'Stock Total',
      sortable: true,
      sortValue: (item) => Number((item as any).availableStock ?? item.dimensionsJson?.stockQuantity ?? 200),
      render: (item) => {
        const totalStock = Number((item as any).availableStock ?? item.dimensionsJson?.stockQuantity ?? 200);
        const isLow = totalStock <= 3;

        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStockModalProduct(item);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer group',
              isLow
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            )}
            title="Cliquez pour afficher la répartition par dépôt"
          >
            <Warehouse className="w-3 h-3 opacity-70 group-hover:scale-110 transition-transform" />
            <span>{totalStock} unités</span>
          </button>
        );
      },
      printRender: (item) => `${(item as any).availableStock ?? item.dimensionsJson?.stockQuantity ?? 200} unités`,
    },
    {
      key: 'variants',
      header: 'Déclinaisons',
      sortable: true,
      sortValue: (item) => Number(item.variantsCount || item.variants?.length || 1),
      render: (item) => (
        <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
          {item.variantsCount || (item.variants ? item.variants.length : 1)} variante(s)
        </span>
      ),
      printRender: (item) => `${item.variantsCount || (item.variants ? item.variants.length : 1)} variante(s)`,
    },
    {
      key: 'status',
      header: 'Visibilité',
      sortable: true,
      sortValue: (item) => item.status || 'ACTIVE',
      render: (item) => {
        const isLive = item.status === 'ACTIVE' || !item.status;
        return (
          <Badge variant={isLive ? 'success' : 'neutral'} size="sm">
            {isLive ? 'En ligne' : 'Masqué'}
          </Badge>
        );
      },
      printRender: (item) => (item.status === 'ACTIVE' || !item.status ? 'En ligne' : 'Masqué'),
    },
    {
      key: 'createdAt',
      header: 'Date de Création',
      sortable: true,
      sortValue: (item) => (item.createdAt ? new Date(item.createdAt).getTime() : 0),
      className: 'text-center whitespace-nowrap',
      render: (item) => {
        if (!item.createdAt) return <span className="text-neutral-400 text-xs">—</span>;
        const d = new Date(item.createdAt);
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-200/80 text-neutral-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="font-medium">{d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span className="text-[10px] text-neutral-400">{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
      printRender: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (item) => renderActionButtons(item),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* 1. Page Header with Breadcrumb in Card Container */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
            Articles
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestion maître des articles en vente, tarification en Dinars Tunisiens (TND), visuels et niveaux de stock multi-dépôts.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Catalogue Commercial', href: '/dashboard/articles' },
              { label: 'Articles' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreate}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs py-2 px-4 shadow-sm"
          >
            Nouvel Article
          </Button>
        </div>
      </div>

      {/* 2. KPI Stats Cards SECOND */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Articles
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {products.length}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Catalogue actif</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Articles En Ligne
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {products.filter((p) => p.status === 'ACTIVE' || !p.status).length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Visibles au public</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Articles Vedettes
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {products.filter((p) => p.isFeatured).length}
            </span>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Mis en avant</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Déclinaisons Totales
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              {products.reduce((acc, p) => acc + (p.variantsCount || p.variants?.length || 1), 0)}
            </span>
            <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">SKU & options gérées</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main DataTable */}
      <DataTable<ProductItem>
        data={products}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher un article par libellé, SKU, marque..."
        searchKeys={['name', 'sku', 'slug']}
        categoryOptions={categories.map((c) => ({ label: c.name, value: c.id }))}
        categoryMatcher={(item, selectedCategoryVal) => {
          const target = selectedCategoryVal.trim().toLowerCase();
          const rootCat = categories.find(
            (c) =>
              c.id.toLowerCase() === target ||
              c.slug.toLowerCase() === target ||
              c.name.trim().toLowerCase() === target,
          );
          if (!rootCat) {
            return (
              item.category?.id?.toLowerCase() === target ||
              (item as any).categoryId?.toLowerCase() === target ||
              item.category?.name?.trim().toLowerCase() === target ||
              item.category?.slug?.toLowerCase() === target
            );
          }
          const descendantIds = new Set<string>([rootCat.id]);
          let added = true;
          while (added) {
            added = false;
            for (const c of categories) {
              if (c.parentId && descendantIds.has(c.parentId) && !descendantIds.has(c.id)) {
                descendantIds.add(c.id);
                added = true;
              }
            }
          }
          const descendantNames = new Set(
            categories.filter((c) => descendantIds.has(c.id)).map((c) => c.name.trim().toLowerCase()),
          );
          const itemCatId = item.category?.id || (item as any).categoryId;
          const itemCatName = item.category?.name?.trim().toLowerCase();
          return Boolean(
            (itemCatId && descendantIds.has(itemCatId)) ||
              (itemCatName && descendantNames.has(itemCatName)),
          );
        }}
        statusOptions={[
          { label: 'En ligne (Actifs)', value: 'ACTIVE' },
          { label: 'Masqués (Inactifs)', value: 'INACTIVE' },
        ]}
        supportedModes={['table', 'list', 'matrix', 'split']}
        defaultMode="table"
        isLoading={isLoading}
        onRefresh={loadData}
        enableMultiSelect={true}
        selectedKeys={selectedProductIds}
        onSelectionChange={setSelectedProductIds}
        onBulkDelete={canDeleteProduct ? () => setIsBulkDeleteModalOpen(true) : undefined}
        renderBulkActions={() => (
          <>
            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={() => handleBulkProductPatch({ status: 'ACTIVE' }, 'publié(s) en ligne')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <_ArtEye className="w-3.5 h-3.5" />
              <span>Publier</span>
            </button>
            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={() => handleBulkProductPatch({ status: 'INACTIVE' }, 'masqué(s) du site')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <_ArtEyeOff className="w-3.5 h-3.5" />
              <span>Masquer</span>
            </button>
            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={() => handleBulkProductPatch({ status: 'DRAFT' }, 'placé(s) en brouillon')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <_ArtDraft className="w-3.5 h-3.5" />
              <span>Brouillon</span>
            </button>
            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={() => handleBulkProductPatch({ isFeatured: true }, 'mis en vedette')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FBF6E8] text-[#9A7414] hover:bg-[#F3E9C9] border border-[#E6D6A6] text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <_ArtStar className="w-3.5 h-3.5" />
              <span>Vedette</span>
            </button>
            {categories.length > 0 && (
              <div className="inline-flex items-center gap-1">
                <select
                  value={bulkCategoryId}
                  onChange={(e) => {
                    const catId = e.target.value;
                    setBulkCategoryId('');
                    if (catId) {
                      handleBulkProductPatch({ categoryId: catId }, 'réaffecté(s) de rayon');
                    }
                  }}
                  aria-label="Changer la catégorie"
                  className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700 max-w-[160px]"
                >
                  <option value="">Changer rayon...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
        exportFileName="articles"
        printTitle="Catalogue des Articles Royal — Document d’Inventaire"
        extraActions={
          <button
            type="button"
            onClick={() => setAutoPlayImages((prev) => !prev)}
            aria-label="Diaporama photos"
            className={cn(
              'p-2 rounded-xl border transition shadow-sm cursor-pointer',
              autoPlayImages
                ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] shadow-sm'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            )}
            title={autoPlayImages ? 'Diaporama photos actif (cliquez pour suspendre)' : 'Lancer le diaporama photo des articles'}
          >
            {autoPlayImages ? (
              <Pause className="w-3.5 h-3.5 text-white animate-pulse" />
            ) : (
              <Play className="w-3.5 h-3.5 text-neutral-700" />
            )}
          </button>
        }
        /* Mode List */
        renderListItem={(item, isSelected, onSelect, isChecked, onToggleCheck) => (
          <div
            onClick={onSelect}
            className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all ${
              isSelected ? 'bg-neutral-100/70' : 'hover:bg-neutral-50/60'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={onToggleCheck}
                className="text-neutral-400 hover:text-neutral-900 no-print shrink-0"
                aria-label="Sélectionner la ligne"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                    isChecked
                      ? 'bg-[var(--royal-primary)] border-[var(--royal-primary)] text-[var(--royal-primary-text)]'
                      : 'border-neutral-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3" />}
                </div>
              </button>

              <div className="relative w-11 h-11 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                {getProductDisplayImage(item) ? (
                  <Image
                    src={getProductDisplayImage(item) || ''}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 text-xs truncate">{item.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 text-[11px] text-neutral-500">
                  <span className="font-mono text-neutral-600 font-semibold">{item.sku}</span>
                  <span>•</span>
                  <span className="truncate">{item.category?.name || 'Général'}</span>
                  {item.brand && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-neutral-700 truncate">{item.brand.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 shrink-0">
              <div className="text-left sm:text-right">
                <div className="font-heading font-black text-neutral-900 text-xs">
                  {formatTndCurrency(item.sellingPrice)}
                </div>
                {item.discountPrice && (
                  <div className="text-[10px] text-red-600 font-medium">
                    Promo: {formatTndCurrency(item.discountPrice)}
                  </div>
                )}
              </div>

              {renderActionButtons(item)}
            </div>
          </div>
        )}
        /* Mode Split Detail */
        renderSplitDetail={(item) => {
          if (!item) {
            return (
              <div className="h-full flex flex-col items-center justify-center p-8 text-neutral-400 text-center">
                <Package className="w-10 h-10 mb-2 stroke-1 text-neutral-300" />
                <div className="text-xs font-semibold text-neutral-700">Aucun article sélectionné</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Cliquez sur un article de la liste pour inspecter sa fiche complète.
                </div>
              </div>
            );
          }

          const imgList = getItemImageList(item);
          const currentIdx = getProductActiveImageIndex(item);
          const activeImg = imgList[currentIdx] || null;

          return (
            <div className="p-5 space-y-5">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 group/splitImg">
                {activeImg ? (
                  <Image
                    src={activeImg}
                    alt={item.name}
                    fill
                    className="object-cover transition-opacity duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}

                {/* Badges on Top Left */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                  {item.isFeatured && (
                    <span className="bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                      ★ En Vedette
                    </span>
                  )}
                  {autoPlayImages && imgList.length > 1 && (
                    <span className="bg-black/60 backdrop-blur text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Diaporama
                    </span>
                  )}
                </div>

                {/* Lightbox Maximize Button */}
                {imgList.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxData({
                        images: imgList,
                        currentIndex: currentIdx,
                        title: item.name,
                      });
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black text-white backdrop-blur transition shadow-md z-10 opacity-80 hover:opacity-100"
                    title="Agrandir en plein écran"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Swing Left / Right Navigation Arrows */}
                {imgList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductImageIndices((prev) => ({
                          ...prev,
                          [item.id]: ((prev[item.id] ?? 0) - 1 + imgList.length) % imgList.length,
                        }));
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur transition shadow-md opacity-0 group-hover/splitImg:opacity-100 z-10"
                      title="Photo précédente"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductImageIndices((prev) => ({
                          ...prev,
                          [item.id]: ((prev[item.id] ?? 0) + 1) % imgList.length,
                        }));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur transition shadow-md opacity-0 group-hover/splitImg:opacity-100 z-10"
                      title="Photo suivante"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-sm z-10">
                      {currentIdx + 1} / {imgList.length}
                    </span>
                  </>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-600">
                    SKU: {item.sku}
                  </span>
                  <Badge variant={item.status === 'ACTIVE' || !item.status ? 'success' : 'neutral'} size="sm">
                    {item.status === 'ACTIVE' || !item.status ? 'En ligne' : 'Masqué'}
                  </Badge>
                </div>
                <h3 className="font-heading font-black text-neutral-900 text-base leading-tight">
                  {item.name}
                </h3>
                {item.nameAr && (
                  <p className="text-xs text-neutral-500 font-arabic mt-1" dir="rtl">
                    {item.nameAr}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Prix public :</span>
                  <span className="font-heading font-black text-neutral-900 text-sm">
                    {formatTndCurrency(item.sellingPrice)}
                  </span>
                </div>
                {item.discountPrice && (
                  <div className="flex items-center justify-between text-red-600">
                    <span>Prix remisé :</span>
                    <span className="font-bold">{formatTndCurrency(item.discountPrice)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-neutral-500">
                  <span>Catégorie :</span>
                  <span className="font-semibold text-neutral-800">{item.category?.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Marque :</span>
                  <span className="font-semibold text-neutral-800">{item.brand?.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-neutral-500">
                  <span>Stock total :</span>
                  <button
                    type="button"
                    onClick={() => setStockModalProduct(item)}
                    className="font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition"
                  >
                    {(item as any).availableStock ?? item.dimensionsJson?.stockQuantity ?? 200}{' '}
                    unités (voir dépôts)
                  </button>
                </div>
              </div>

              {item.shortDescription && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Résumé
                  </h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {item.shortDescription}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                <span className="text-[11px] text-neutral-400 font-medium">Actions rapides</span>
                {renderActionButtons(item)}
              </div>
            </div>
          );
        }}
        /* Mode Matrix Grid */
        renderMatrixCard={(item, isChecked, onToggleCheck) => {
          const imgList = getItemImageList(item);
          const currentIdx = getProductActiveImageIndex(item);
          const activeImg = imgList[currentIdx] || null;

          return (
            <div
              key={item.id}
              className={`relative rounded-xl border transition-all duration-150 flex flex-col justify-between overflow-hidden bg-white shadow-sm hover:shadow-md ${
                isChecked ? 'border-neutral-950 ring-1 ring-neutral-950' : 'border-neutral-200'
              }`}
            >
              <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden group/cardImg">
                {activeImg ? (
                  <Image
                    src={activeImg}
                    alt={item.name}
                    fill
                    className="object-cover transition-opacity duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}

                {/* Selection Checkbox */}
                <button
                  type="button"
                  onClick={onToggleCheck}
                  className="absolute top-2.5 left-2.5 z-10 no-print"
                  title="Sélectionner l’article"
                  aria-label="Sélectionner"
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shadow-sm transition ${
                      isChecked
                        ? 'bg-[var(--royal-primary)] border-[var(--royal-primary)] text-[var(--royal-primary-text)]'
                        : 'border-neutral-300 bg-white/90 hover:bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* Badges & Lightbox on Top Right */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end z-10">
                  {imgList.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxData({
                          images: imgList,
                          currentIndex: currentIdx,
                          title: item.name,
                        });
                      }}
                      className="p-1 rounded-md bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur transition shadow-sm opacity-80 hover:opacity-100"
                      title="Ouvrir la galerie plein écran"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  )}
                  {item.isFeatured && (
                    <span className="bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                      ★ Vedette
                    </span>
                  )}
                  {item.discountPrice && (
                    <span className="bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                      Promo
                    </span>
                  )}
                </div>

                {/* Swing Left / Right Navigation Arrows */}
                {imgList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductImageIndices((prev) => ({
                          ...prev,
                          [item.id]: ((prev[item.id] ?? 0) - 1 + imgList.length) % imgList.length,
                        }));
                      }}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur transition shadow-md opacity-0 group-hover/cardImg:opacity-100 z-10"
                      title="Photo précédente"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductImageIndices((prev) => ({
                          ...prev,
                          [item.id]: ((prev[item.id] ?? 0) + 1) % imgList.length,
                        }));
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur transition shadow-md opacity-0 group-hover/cardImg:opacity-100 z-10"
                      title="Photo suivante"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                      {currentIdx + 1}/{imgList.length}
                    </span>
                  </>
                )}
              </div>

              <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span className="font-mono font-semibold">{item.sku}</span>
                    <span className="truncate">{item.category?.name}</span>
                  </div>
                  <h3 className="font-bold text-neutral-900 text-xs line-clamp-2 mt-1 leading-snug">
                    {item.name}
                  </h3>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-baseline justify-between">
                  <div>
                    <div className="text-xs font-heading font-black text-neutral-900">
                      {formatTndCurrency(item.sellingPrice)}
                    </div>
                    {item.discountPrice && (
                      <div className="text-[10px] text-red-600 line-through">
                        {formatTndCurrency(item.discountPrice)}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStockModalProduct(item)}
                    className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded hover:bg-emerald-100 transition"
                    title="Voir dépôts"
                  >
                    {(item as any).availableStock ?? item.dimensionsJson?.stockQuantity ?? 200}{' '}
                    unités
                  </button>
                </div>
              </div>

              <div className="p-2.5 pt-0 bg-white flex items-center justify-end border-t border-neutral-50 no-print">
                {renderActionButtons(item)}
              </div>
            </div>
          );
        }}
      />

      {/* MODAL: DISPONIBILITÉ DES STOCKS MULTI-DÉPÔTS */}
      <Modal
        isOpen={!!stockModalProduct}
        onClose={() => setStockModalProduct(null)}
        title="Disponibilité & Répartition Multi-Dépôts"
        subtitle={stockModalProduct ? `${stockModalProduct.name} (${stockModalProduct.sku})` : ''}
        type="custom"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            {canSeeInventory ? (
              <Link
                href="/dashboard/inventory"
                className="text-xs text-neutral-600 hover:text-neutral-950 font-semibold flex items-center gap-1.5"
              >
                <Warehouse className="w-3.5 h-3.5 text-neutral-500" />
                <span>Ouvrir la gestion des stocks & dépôts</span>
              </Link>
            ) : (
              <span />
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setStockModalProduct(null)}
              className="text-xs py-1.5 px-4"
            >
              Fermer
            </Button>
          </div>
        }
      >
        {stockModalProduct && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="relative w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-neutral-200">
                {getProductDisplayImage(stockModalProduct) ? (
                  <Image
                    src={getProductDisplayImage(stockModalProduct) || ''}
                    alt={stockModalProduct.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Package className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-neutral-900 truncate">
                  {stockModalProduct.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                  <span className="font-mono font-semibold">{stockModalProduct.sku}</span>
                  <span>•</span>
                  <span>{stockModalProduct.category?.name || 'Général'}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                  Total Disponible
                </span>
                <span className="font-heading font-black text-sm text-emerald-800">
                  {(stockModalProduct as any).availableStock ?? stockModalProduct.dimensionsJson?.stockQuantity ?? 200}{' '}
                  unités
                </span>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFB] text-neutral-500 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                    <th className="py-2.5 px-3">Dépôt / Entrepôt</th>
                    <th className="py-2.5 px-3">Emplacement</th>
                    <th className="py-2.5 px-3 text-right">Disponible</th>
                    <th className="py-2.5 px-3 text-right">Réservé</th>
                    <th className="py-2.5 px-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                        <div>
                          <div>Entrepôt Central Principal</div>
                          <div className="text-[10px] text-neutral-400">Zone Industrielle Charguia II, Tunis</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-neutral-600 text-[11px]">Allée A-04 / R2</td>
                    <td className="py-3 px-3 text-right font-bold text-neutral-900">
                      {Math.max(
                        0,
                        Number((stockModalProduct as any).availableStock ?? stockModalProduct.dimensionsJson?.stockQuantity ?? 200)
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-400">2</td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant="success" size="sm">
                        En Stock
                      </Badge>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-neutral-500" />
                        <div>
                          <div>Réserve Showroom La Marsa</div>
                          <div className="text-[10px] text-neutral-400">Avenue Habib Bourguiba, La Marsa</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-neutral-600 text-[11px]">Rayon Vitrine-B</td>
                    <td className="py-3 px-3 text-right font-bold text-neutral-900">5</td>
                    <td className="py-3 px-3 text-right text-neutral-400">0</td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant="success" size="sm">
                        En Stock
                      </Badge>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                        <div>
                          <div>Plateforme Régionale Sousse</div>
                          <div className="text-[10px] text-neutral-400">Zone Portuaire, Sousse</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-neutral-600 text-[11px]">Zone C-12</td>
                    <td className="py-3 px-3 text-right font-bold text-neutral-900">3</td>
                    <td className="py-3 px-3 text-right text-neutral-400">1</td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant="success" size="sm">
                        En Stock
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {canSeeInventory && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-500 flex items-center justify-between">
                <span>Pour alimenter le stock dans un dépôt spécifique :</span>
                <Link
                  href="/dashboard/inventory"
                  className="font-bold text-neutral-900 hover:underline flex items-center gap-1"
                >
                  <span>Créer un Bon d'Entrée</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ARTICLE MODAL: CREATION / EDIT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Nouvel Article' : `Modifier : ${formData.name}`}
        subtitle="Configuration complète de l'article, de la tarification, des variantes et du référencement"
        type="custom"
        size="3xl"
        className="max-w-6xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-neutral-400">
              {formError && <span className="text-red-600 font-semibold">{formError}</span>}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 border border-neutral-200 transition"
              >
                Annuler
              </button>
              <Button
                type="button"
                onClick={handleSaveProduct}
                isLoading={isSubmitting}
                variant="primary"
                className="text-xs py-2 px-5"
              >
                {modalMode === 'create' ? 'Créer l’article' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row min-h-[580px] max-h-[75vh]">
          {/* LEFT SIDEBAR: VERTICAL NAVIGATION MENU */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-200 bg-[#FAFBFB] p-3 space-y-1 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col">
            {FORM_SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all',
                    isActive
                      ? 'bg-[#FBF6E8] text-neutral-900 border border-[#E6D6A6] shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-950'
                  )}
                >
                  <div
                    className={cn(
                      'p-1.5 rounded-lg shrink-0 mt-0.5',
                      isActive ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)]' : 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    {sec.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight truncate">{sec.label}</div>
                    <div
                      className={cn(
                        'text-[10px] leading-tight truncate mt-0.5',
                        isActive ? 'text-white/70' : 'text-neutral-400'
                      )}
                    >
                      {sec.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
            {activeSection === 'general' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-neutral-100">
                  <h4 className="font-heading font-black text-sm text-neutral-900">
                    1. Informations Générales & Identification
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Désignation, SKU maître unique, catégorie et constructeur officiel.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Nom de l'Article (Français) *"
                      placeholder="ex: Frying Pan Inox 28cm Tri-Ply"
                      value={formData.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const autoSlug = generateSlug(newName);
                        setFormData((prev) => ({
                          ...prev,
                          name: newName,
                          slug: autoSlug,
                          metaTitle: `${newName} | Royal Tunisie`,
                          metaDesc:
                            prev.metaDesc ||
                            `Achetez ${newName} au meilleur prix en Tunisie chez Royal. Livraison 24h & garantie officielle.`,
                        }));
                      }}
                      helperText="Le slug URL canonique est généré automatiquement par le système"
                    />
                  </div>

                  <div>
                    <Input
                      label="Nom en Arabe (العربية)"
                      placeholder="مقلاة ستانلس ستيل ثلاثية الطبقات 28 سم"
                      dir="rtl"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Catégorie de l'Article *"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    options={categories.map((c) => ({ label: c.name, value: c.id }))}
                  />

                  <Select
                    label="Marque Constructeur *"
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    options={[
                      { label: 'Sélectionner une marque...', value: '' },
                      ...brands.map((b) => ({ label: b.name, value: b.id })),
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="SKU Maître (Référence Unique) *"
                    placeholder="FLR-PAN-28-INX"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="font-mono uppercase font-bold"
                  />
                  <Input
                    label="Code-Barres EAN-13 (Optionnel)"
                    placeholder="ex: 6191234567890"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="font-mono bg-neutral-50"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Descriptions Produit &amp; Fiche Technique
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isGeneratingAi}
                    disabled={!formData.name.trim()}
                    onClick={async () => {
                      setIsGeneratingAi(true);
                      try {
                        const catName = categories.find((c) => c.id === formData.categoryId)?.name || '';
                        const brandName = brands.find((b) => b.id === formData.brandId)?.name || '';
                        const res = await fetchApi('/storefront-cms/ai/generate', {
                          method: 'POST',
                          body: JSON.stringify({
                            mode: 'PRODUCT_COPY',
                            payload: {
                              name: formData.name,
                              category: catName,
                              brand: brandName,
                              price: formData.sellingPrice,
                            },
                          }),
                        });
                        const ai = res?.data || res;
                        setFormData((prev) => ({
                          ...prev,
                          nameAr: ai?.nameAr || prev.nameAr,
                          shortDescription: ai?.shortDescription || prev.shortDescription,
                          description: ai?.description || prev.description,
                          metaTitle: ai?.metaTitle || prev.metaTitle,
                          metaDesc: ai?.metaDesc || prev.metaDesc,
                          focusKeyword: ai?.focusKeyword || prev.focusKeyword,
                        }));
                        showToast('success', 'Rédaction FR/AR et balises SEO générées par IA.');
                      } catch (err: any) {
                        showToast('error', err?.message || (isRoot ? 'IA indisponible. Vérifiez /dashboard/root/ai.' : 'Assistant IA temporairement indisponible.'));
                      } finally {
                        setIsGeneratingAi(false);
                      }
                    }}
                    className="h-8 text-xs border-[#E6D6A6] bg-[#FBF6E8] text-[#9A7414] hover:bg-[#C59B27] hover:text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Générer Fiche &amp; SEO par IA</span>
                  </Button>
                </div>

                <Textarea
                  label="Description courte (Accroche pour cartes et fiches rapides)"
                  placeholder="Capacité généreuse de 8.5L, double panier indépendant, cuisson rapide sans huile..."
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                />

                <Textarea
                  label="Description détaillée & Spécifications culinaires"
                  placeholder="Spécifications exhaustives des programmes culinaires, matériaux inox..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            )}

            {/* SECTION 2: TARIFICATION & TAUX DE TVA */}
            {activeSection === 'pricing' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-neutral-100">
                  <h4 className="font-heading font-black text-sm text-neutral-900">
                    2. Politique Monétaire, Prix & Taux de TVA
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Structure de prix en Dinars Tunisiens (TND) avec calcul de marge et taux de TVA.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Prix de Vente Public TTC (TND) *"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.sellingPrice || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                    }
                    helperText="Prix facturé au client final en TND"
                  />
                  <Input
                    label="Prix Remisé / Barré (TND — Optionnel)"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.discountPrice || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPrice: parseFloat(e.target.value) || 0 })
                    }
                    helperText="Affiché en badge rouge si inférieur au prix public"
                  />
                </div>

                {formData.discountPrice > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-red-50/50 border border-red-200">
                    <Input
                      label="Date Début Promotion (Optionnel)"
                      type="date"
                      value={formData.promoStartDate || ''}
                      onChange={(e) => setFormData({ ...formData, promoStartDate: e.target.value })}
                      helperText="Activation automatique du prix remisé"
                    />
                    <Input
                      label="Date Fin Promotion (Optionnel)"
                      type="date"
                      value={formData.promoEndDate || ''}
                      onChange={(e) => setFormData({ ...formData, promoEndDate: e.target.value })}
                      helperText="Expiration de l’offre promotionnelle"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Coût de Base / Prix d’Achat Fournisseur (TND)"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.basePrice || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })
                    }
                    helperText="Utilisé pour le calcul de rentabilité"
                  />

                  <Select
                    label="Taux de TVA Applicable (Taux)"
                    value={String(formData.taxRate)}
                    onChange={(e) =>
                      setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0.19 })
                    }
                    options={[
                      { label: 'Taux Standard 19% (Électroménager, Électronique, Cuisson)', value: '0.19' },
                      { label: 'Taux Réduit 7% (Biens d’équipement prioritaires)', value: '0.07' },
                      { label: 'Taux Intermédiaire 13% (Services & Prestations)', value: '0.13' },
                      { label: 'Exonéré de Taxe 0%', value: '0' },
                    ]}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Marge brute unitaire estimée :</span>
                  <span className="font-bold text-neutral-900 font-heading">
                    {formatTndCurrency(
                      Math.max(0, formData.sellingPrice - formData.basePrice)
                    )}{' '}
                    (
                    {formData.sellingPrice > 0
                      ? Math.round(
                          ((formData.sellingPrice - formData.basePrice) /
                            formData.sellingPrice) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            )}

            {/* SECTION 3: GESTION DES STOCKS PHYSIQUES & ENTREPÔTS */}
            {activeSection === 'inventory' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-neutral-100">
                  <h4 className="font-heading font-black text-sm text-neutral-900">
                    3. Gestion des Stocks Physiques & Entrepôts
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Niveaux de référence et seuil d'alerte. Les stocks réels sont alimentés par dépôt via les Bons d'Entrée.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Quantité Initiale de Référence (Unités)"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })
                    }
                    helperText="Initialisée à 0 par défaut avant réception de marchandise"
                  />
                  <Input
                    label="Seuil d’Alerte Stock Faible"
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lowStockThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                    helperText="Initialisé à 0 par défaut (déclenche une alerte si atteint)"
                  />
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 bg-[#FAFBFB] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                    <Warehouse className="w-4 h-4 text-neutral-700" />
                    <span>Affectation Multi-Entrepôts Dynamique</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Cet article n'est pas lié à un entrepôt unique figé : il peut être stocké simultanément à l'Entrepôt Central (Charguia II), dans les réserves de nos showrooms (La Marsa, Lac II) ou sur la plateforme de Sousse. La répartition géographique est enregistrée lors de la validation de chaque <strong>Bon d'Entrée</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-white">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowBackorders}
                      onChange={(e) =>
                        setFormData({ ...formData, allowBackorders: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-neutral-950 border-neutral-300 focus:ring-neutral-950"
                    />
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        Autoriser les commandes en précommande lors d’une rupture de stock
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Les clients finaux pourront commander l’article même en rupture de stock avec indication du délai de réapprovisionnement.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* SECTION 4: MÉDIAS & GALERIE */}
            {activeSection === 'media' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-neutral-100">
                  <h4 className="font-heading font-black text-sm text-neutral-900">
                    4. Gestion des Médias, Photos & Galerie
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Téléversement par glisser-déposer, organisation de la galerie et désignation de la photo principale.
                  </p>
                </div>

                <div className="border-2 border-dashed border-neutral-200 hover:border-neutral-950 rounded-xl p-6 text-center transition bg-neutral-50/50">
                  <input
                    type="file"
                    id="article-file-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="article-file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shadow-sm">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-neutral-900">
                      Cliquez pour choisir des images ou glissez-déposez vos fichiers ici
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Formats supportés : PNG, JPG, WEBP jusqu'à 5 Mo par image
                    </div>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ou collez une URL d’image directe (https://...)"
                    value={formData.newImageUrl}
                    onChange={(e) => setFormData({ ...formData, newImageUrl: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddImageUrl}
                    className="text-xs"
                  >
                    Ajouter URL
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {formData.images.map((url, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'relative aspect-square rounded-xl overflow-hidden border-2 transition',
                        idx === formData.primaryImageIndex
                          ? 'border-neutral-950 ring-2 ring-neutral-950/20'
                          : 'border-neutral-200'
                      )}
                    >
                      <Image
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-2 left-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, primaryImageIndex: idx })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm transition ${
                            idx === formData.primaryImageIndex
                              ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)]'
                              : 'bg-white/90 hover:bg-white text-neutral-700'
                          }`}
                        >
                          {idx === formData.primaryImageIndex ? '★ Principale' : 'Définir princ.'}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/90 text-red-600 hover:bg-red-600 hover:text-white transition shadow-sm"
                        title="Supprimer la photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 5: VARIANTES & DÉCLINAISONS */}
            {activeSection === 'variants' && (
              <div className="space-y-5">
                <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-black text-sm text-neutral-900">
                      5. Déclinaisons & Variantes Dynamiques
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Générez des variantes avec SKU distinct, attributs dynamiques et tarification dédiée.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {formData.variants.length} déclinaison(s) active(s)
                  </span>
                </div>

                {/* SCALABLE DYNAMIC VARIANT BUILDER (+100 Families, +10 Values) */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Générateur Automatique de Déclinaisons & Combinaisons :</span>
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Supporte +100 variantes & multi-sélection
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* 1. Select Variant Family */}
                    <div className="sm:col-span-5">
                      <Select
                        label="1. Famille d’attribut"
                        value={selectedGeneratorFamilyId}
                        onChange={(e) => {
                          setSelectedGeneratorFamilyId(e.target.value);
                          setSelectedGeneratorValueIds([]);
                        }}
                        options={[
                          { label: '— Sélectionner une famille —', value: '' },
                          ...variantFamiliesList.map((fam) => ({
                            label: `${fam.name} (${fam.values.length} options)`,
                            value: fam.id,
                          })),
                        ]}
                        searchable={true}
                      />
                    </div>

                    {/* 2. Select Values (Multi-Select) */}
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        2. Options / Nuances sélectionnées
                      </label>
                      {selectedGeneratorFamilyId ? (
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-white rounded-xl border border-neutral-200">
                          {variantFamiliesList
                            .find((f) => f.id === selectedGeneratorFamilyId)
                            ?.values.map((v) => {
                              const isChecked = selectedGeneratorValueIds.includes(v.id);
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedGeneratorValueIds((prev) =>
                                      isChecked ? prev.filter((id) => id !== v.id) : [...prev, v.id]
                                    )
                                  }
                                  className={cn(
                                    'px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all',
                                    isChecked
                                      ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] shadow-2xs'
                                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                  )}
                                >
                                  {v.colorHex && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                                      style={{ backgroundColor: v.colorHex }}
                                    />
                                  )}
                                  <span>{v.label}</span>
                                  {isChecked && <Check className="w-3 h-3 text-white" />}
                                </button>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="p-2.5 text-xs text-neutral-400 bg-neutral-100/60 rounded-xl border border-dashed border-neutral-200 text-center">
                          Sélectionnez d’abord une famille
                        </div>
                      )}
                    </div>

                    {/* 3. Add Axis Button */}
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!selectedGeneratorFamilyId || selectedGeneratorValueIds.length === 0}
                        onClick={handleAddVariantAxis}
                        className="w-full text-xs py-2.5"
                      >
                        + Ajouter l'axe
                      </Button>
                    </div>
                  </div>

                  {/* Configured Axes Display */}
                  {configuredVariantAxes.length > 0 && (
                    <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Dimensions configurées pour la matrice :
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {configuredVariantAxes.map((axis) => (
                          <div
                            key={axis.familyId}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200 text-xs"
                          >
                            <span className="font-bold text-neutral-900">{axis.familyName}:</span>
                            <span className="text-neutral-600">
                              {axis.values.map((v) => v.label).join(', ')}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setConfiguredVariantAxes((prev) =>
                                  prev.filter((a) => a.familyId !== axis.familyId)
                                )
                              }
                              className="text-neutral-400 hover:text-rose-600 ml-1"
                              title="Retirer cet axe"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleGenerateVariantCombinations}
                          leftIcon={<Boxes className="w-3.5 h-3.5" />}
                          className="text-xs py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white"
                        >
                          Générer toutes les combinaisons croisées
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* VARIANT BUILDER FORM */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3">
                  <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Ajouter une nouvelle déclinaison</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Input
                        label="Libellé de la Déclinaison *"
                        placeholder="ex: 28cm — Noir Mat Profond"
                        value={formData.newVariant.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newVariant: { ...formData.newVariant, name: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Input
                        label="SKU Dérivé Unique *"
                        placeholder="ex: FLR-CUIS-28-NOIR"
                        value={formData.newVariant.sku}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newVariant: { ...formData.newVariant, sku: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Input
                        label="Dimension / Format"
                        placeholder="ex: 28cm ou 8.5L"
                        value={formData.newVariant.size}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newVariant: { ...formData.newVariant, size: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Input
                        label="Coloris / Nuance"
                        placeholder="ex: Noir Mat"
                        value={formData.newVariant.color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newVariant: { ...formData.newVariant, color: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Input
                        label="Prix Spécifique TND"
                        type="number"
                        step="0.001"
                        placeholder={formData.sellingPrice ? `${formData.sellingPrice} TND` : 'Prix en TND'}
                        value={formData.newVariant.sellingPrice || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newVariant: {
                              ...formData.newVariant,
                              sellingPrice: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-neutral-400">
                      Le stock de cette variante sera distribué via les Bons d'Entrée en entrepôts.
                    </span>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddVariant}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      className="text-xs py-2 px-4"
                    >
                      Ajouter cette déclinaison
                    </Button>
                  </div>
                </div>

                {/* REGISTERED VARIANTS LIST */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-neutral-700">
                    Déclinaisons enregistrées pour cet article ({formData.variants.length})
                  </div>
                  {formData.variants.length === 0 ? (
                    <div className="p-6 bg-neutral-50/70 border border-neutral-200 rounded-2xl text-center text-neutral-500 text-xs">
                      <Boxes className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <div className="font-semibold text-neutral-700">Aucune déclinaison configurée</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        L’article sera commercialisé sous une référence standard unique.
                      </div>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100 bg-white shadow-2xs">
                      {formData.variants.map((v, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50/60 transition"
                        >
                          <div className="flex items-center gap-3">
                            {v.colorHex ? (
                              <span
                                className="w-5 h-5 rounded-full border border-black/20 shadow-2xs shrink-0"
                                style={{ backgroundColor: v.colorHex }}
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0 font-bold text-[10px]">
                                {idx + 1}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-neutral-950 text-xs">{v.name}</div>
                              <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>SKU: {v.sku}</span>
                                {v.size && <span>• {v.size}</span>}
                                {v.color && <span>• {v.color}</span>}
                                {v.power && <span>• {v.power}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-bold text-neutral-950 bg-neutral-100 px-2.5 py-1 rounded-lg">
                              {formatTndCurrency(v.sellingPrice || formData.sellingPrice)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              className="text-neutral-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                              title="Supprimer la variante"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 6: CARACTÉRISTIQUES TECHNIQUES DYNAMIQUES */}
            {activeSection === 'characteristics' && (() => {
              const selectedCat = categories.find((c) => c.id === formData.categoryId);
              const applicableChars = characteristicsList.filter((char) => {
                if (!char.categoryIds || char.categoryIds.length === 0) return true; // Global
                return (
                  char.categoryIds.includes(formData.categoryId) ||
                  (selectedCat && char.categoryIds.includes(selectedCat.slug))
                );
              });

              return (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-black text-sm text-neutral-900">
                        6. Caractéristiques Techniques Dynamiques
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Attributs métiers et spécifications fabricant adaptés au rayon sélectionné.
                      </p>
                    </div>
                    {selectedCat && (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Rayon : {selectedCat.name}</span>
                      </span>
                    )}
                  </div>

                  {!formData.categoryId ? (
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-2 text-center">
                      <AlertCircle className="w-6 h-6 text-amber-700 mx-auto" />
                      <div className="font-bold">Aucun rayon sélectionné</div>
                      <p className="text-amber-800">
                        Veuillez d'abord sélectionner une catégorie à l'étape 1 (Informations Générales) pour charger les caractéristiques techniques associées.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveSection('general')}
                        className="px-4 py-1.5 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold text-xs hover:bg-[var(--royal-primary-hover)] transition cursor-pointer"
                      >
                        Sélectionner le rayon
                      </button>
                    </div>
                  ) : applicableChars.length === 0 ? (
                    <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-500">
                      <Sliders className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                      <div className="font-semibold text-neutral-800">Aucune caractéristique prédéfinie pour ce rayon</div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Vous pouvez configurer des caractéristiques dans le menu Caractéristiques ou saisir des attributs libres ci-dessous.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {applicableChars.map((char) => {
                        const val = formData.characteristics[char.code] ?? '';

                        if (char.type === 'NUMBER') {
                          return (
                            <div key={char.id}>
                              <Input
                                label={`${char.name} ${char.isRequired ? '*' : ''}`}
                                placeholder={`ex: 2000 ${char.unit || ''}`}
                                value={val}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    characteristics: {
                                      ...formData.characteristics,
                                      [char.code]: e.target.value,
                                    },
                                  })
                                }
                                helperText={char.unit ? `Unité de mesure : ${char.unit}` : undefined}
                              />
                            </div>
                          );
                        }

                        if (char.type === 'SELECT') {
                          return (
                            <div key={char.id}>
                              <Select
                                label={`${char.name} ${char.isRequired ? '*' : ''}`}
                                placeholder="Sélectionner une valeur..."
                                value={val}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    characteristics: {
                                      ...formData.characteristics,
                                      [char.code]: e.target.value,
                                    },
                                  })
                                }
                                options={(char.options || []).map((opt) => ({
                                  label: opt,
                                  value: opt,
                                }))}
                              />
                            </div>
                          );
                        }

                        if (char.type === 'BOOLEAN') {
                          const isTrue = val === true || val === 'true';
                          const isFalse = val === false || val === 'false';

                          return (
                            <div key={char.id} className="space-y-1.5">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                                {char.name} {char.isRequired ? '*' : ''}
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      characteristics: {
                                        ...formData.characteristics,
                                        [char.code]: true,
                                      },
                                    })
                                  }
                                  className={cn(
                                    'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition shadow-2xs',
                                    isTrue
                                      ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] shadow-sm'
                                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                                  )}
                                >
                                  Oui
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      characteristics: {
                                        ...formData.characteristics,
                                        [char.code]: false,
                                      },
                                    })
                                  }
                                  className={cn(
                                    'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition shadow-2xs',
                                    isFalse
                                      ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] shadow-sm'
                                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                                  )}
                                >
                                  Non
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={char.id}>
                            <Input
                              label={`${char.name} ${char.isRequired ? '*' : ''}`}
                              placeholder="Valeur textuelle..."
                              value={val}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  characteristics: {
                                    ...formData.characteristics,
                                    [char.code]: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SECTION 7: RÉFÉRENCEMENT & SEO */}
            {activeSection === 'seo' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-neutral-100">
                  <h4 className="font-heading font-black text-sm text-neutral-900">
                    7. Référencement Naturel (SEO) & Métadonnées
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Optimisation Google, URL canonique propre et aperçu en direct des résultats de recherche.
                  </p>
                </div>

                <Input
                  label="URL Slug Canonique (Généré Automatiquement par le Système) *"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  helperText={`Adresse web publique sur la boutique : /products/${formData.slug || 'nom-produit'}`}
                />

                <Input
                  label="Balise Titre SEO (Meta Title)"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  helperText="Recommandé : 50 à 60 caractères"
                />

                <Textarea
                  label="Meta Description"
                  rows={3}
                  value={formData.metaDesc}
                  onChange={(e) => setFormData({ ...formData, metaDesc: e.target.value })}
                  helperText={`Longueur actuelle : ${formData.metaDesc.length} caractères (optimal : 140–160)`}
                />

                <Input
                  label="Mots-clés Cibles (Séparés par virgules)"
                  placeholder="ex: airfryer tunisie, friteuse sans huile, royal électroménager"
                  value={formData.focusKeyword}
                  onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                />

                <div className="p-4 rounded-xl border border-neutral-200 bg-[#FAFBFB] space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Aperçu dans les résultats de recherche Google
                  </div>
                  <div className="text-xs font-mono text-[#1a0dab] truncate">
                    https://royal.com.tn/products/{formData.slug || 'nom-produit'}
                  </div>
                  <div className="font-semibold text-sm text-[#1a0dab] hover:underline cursor-pointer">
                    {formData.metaTitle || formData.name || 'Titre du produit'}
                  </div>
                  <div className="text-xs text-neutral-600 line-clamp-2">
                    {formData.metaDesc ||
                      formData.shortDescription ||
                      'Découvrez ce produit d’exception chez Royal en Tunisie avec garantie officielle et livraison 24h.'}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 8: STATUT, PUBLICATION & VISIBILITÉ */}
            {activeSection === 'status' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-neutral-100">
                  <h4 className="font-heading font-black text-sm text-neutral-900">
                    8. Statut de Publication & Visibilité
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Activation publique, mise en avant sur la page d'accueil et comparateur de produits.
                  </p>
                </div>

                <Select
                  label="Statut Commercial du Produit *"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { label: 'ACTIF — Visible et achetable sur le storefront', value: 'ACTIVE' },
                    { label: 'INACTIF — Masqué du storefront', value: 'INACTIVE' },
                    { label: 'BROUILLON — En cours d’édition', value: 'DRAFT' },
                    { label: 'RUPTURE DE STOCK — Visible avec badge épuisé', value: 'OUT_OF_STOCK' },
                  ]}
                />

                <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-neutral-950 border-neutral-300 focus:ring-neutral-950"
                    />
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        Mettre en vedette sur la page d’accueil (Hero & Carrousels)
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Le produit sera affiché prioritairement dans les sections "Pièces d'Exception" et "Tendances".
                      </div>
                    </div>
                  </label>

                  <div className="h-px bg-neutral-100" />

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isComparable}
                      onChange={(e) =>
                        setFormData({ ...formData, isComparable: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-neutral-950 border-neutral-300 focus:ring-neutral-950"
                    />
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        Autoriser dans le comparateur interactif
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Permet aux acheteurs de comparer les caractéristiques techniques côte à côte (jusqu'à 4 articles).
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* SINGLE DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmSingleDelete}
        title="Supprimer définitivement l’article"
        description={`Êtes-vous sûr de vouloir supprimer "${productToDelete?.name}" (${productToDelete?.sku}) ? Cette action est irréversible et supprimera également les variantes associées.`}
        isDeleting={isDeleting}
      />

      {/* BULK DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Suppression Groupée"
        description={`Êtes-vous sûr de vouloir supprimer les ${selectedProductIds.length} article(s) sélectionné(s) ? Cette action est irréversible.`}
        isDeleting={isBulkDeleting}
      />

      {/* CENTRALIZED IMAGE LIGHTBOX MODAL */}
      <Modal
        isOpen={!!lightboxData}
        onClose={() => setLightboxData(null)}
        title={lightboxData?.title || 'Aperçu Média'}
        subtitle={
          lightboxData
            ? `Image ${lightboxData.currentIndex + 1} sur ${lightboxData.images.length}`
            : ''
        }
        type="details"
        size="4xl"
        footer={
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              {lightboxData && lightboxData.images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLightboxData((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentIndex:
                                (prev.currentIndex - 1 + prev.images.length) %
                                prev.images.length,
                            }
                          : null
                      )
                    }
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLightboxData((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentIndex: (prev.currentIndex + 1) % prev.images.length,
                            }
                          : null
                      )
                    }
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </>
              )}
            </div>
            <Button variant="primary" size="sm" onClick={() => setLightboxData(null)}>
              Fermer
            </Button>
          </div>
        }
      >
        {lightboxData && (
          <div className="p-6 space-y-4">
            <div className="relative h-[56vh] w-full rounded-2xl bg-[#F8F9FA] border border-[#E6E1D6] flex items-center justify-center overflow-hidden p-4">
              {lightboxData.images.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxData((prev) =>
                      prev
                        ? {
                            ...prev,
                            currentIndex:
                              (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
                          }
                        : null
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] border border-[#E6E1D6] text-[#1D232E] shadow-md flex items-center justify-center transition z-20 cursor-pointer"
                  title="Précédent"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={lightboxData.images[lightboxData.currentIndex]}
                  alt={lightboxData.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              {lightboxData.images.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxData((prev) =>
                      prev
                        ? {
                            ...prev,
                            currentIndex: (prev.currentIndex + 1) % prev.images.length,
                          }
                        : null
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] border border-[#E6E1D6] text-[#1D232E] shadow-md flex items-center justify-center transition z-20 cursor-pointer"
                  title="Suivant"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {lightboxData.images.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                {lightboxData.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setLightboxData((prev) => (prev ? { ...prev, currentIndex: idx } : null))
                    }
                    className={cn(
                      'relative w-16 h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 bg-white',
                      idx === lightboxData.currentIndex
                        ? 'border-[var(--royal-primary)] scale-105 shadow-md'
                        : 'border-neutral-200 opacity-65 hover:opacity-100'
                    )}
                  >
                    <Image src={img} alt="miniature" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Floating Toast Notification */}
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type === 'error' ? 'error' : 'success'}
        onClose={() => setFeedbackMessage(null)}
      />
    </div>
  );
}
