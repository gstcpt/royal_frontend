import type * as React from 'react';

export interface CmsElementStyleConfig {
  domId?: string;
  customClassName?: string;
  marginTopPx?: number | string;
  marginRightPx?: number | string;
  marginBottomPx?: number | string;
  marginLeftPx?: number | string;
  paddingTopPx?: number | string;
  paddingRightPx?: number | string;
  paddingBottomPx?: number | string;
  paddingLeftPx?: number | string;
  position?: 'static' | 'relative' | 'sticky' | 'absolute';
  zIndex?: number | string;
  topPx?: number | string;
  rightPx?: number | string;
  bottomPx?: number | string;
  leftPx?: number | string;
  maxWidth?: string;
  minHeightPx?: number | string;
  textAlign?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidthPx?: number | string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadiusPx?: number | string;
  boxShadow?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'gold';
  fontSizePx?: number | string;
  fontWeight?: string;
  opacityPercent?: number | string;
  customCss?: string;
  customJs?: string;
}

export type CmsCustomBlockType =
  | 'HERO_BANNER'
  | 'RICH_TEXT'
  | 'PRODUCT_GRID'
  | 'CATEGORY_STRIP'
  | 'IMAGE_BANNER'
  | 'TWO_COLUMNS'
  | 'FAQ_EMBED'
  | 'CONTACT_EMBED'
  | 'HTML_CUSTOM'
  | 'SPACER_DIVIDER';

export interface CmsCustomBlock {
  id: string;
  type: CmsCustomBlockType;
  label: string;
  visible?: boolean;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  displayMode?: 'grid' | 'carousel';
  columns?: '2' | '3' | '4';
  limit?: number;
  cardImageHeightPx?: number;
  targetType?: 'AUTO' | 'CATEGORIES' | 'ARTICLES';
  targetCategorySlugs?: string[];
  targetProductIds?: string[];
  colRatio?: '50-50' | '40-60' | '60-40';
  leftTitle?: string;
  leftText?: string;
  leftImageUrl?: string;
  rightTitle?: string;
  rightText?: string;
  rightImageUrl?: string;
  heightPx?: number;
  showDividerLine?: boolean;
  faqCategory?: string;
  rawHtml?: string;
  style?: CmsElementStyleConfig;
}

export interface CmsCustomViewRecord {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  viewStyle?: CmsElementStyleConfig;
  blocks: CmsCustomBlock[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsNavLinkItem {
  id: string;
  label: string;
  href: string;
  type?: 'LINK' | 'RAYONS_DROPDOWN';
  i18nKey?: string;
  visible?: boolean;
  highlight?: boolean;
  openInNewTab?: boolean;
}

export interface CmsBlockPresetMeta {
  type: CmsCustomBlockType;
  label: string;
  description: string;
  createDefault: () => CmsCustomBlock;
}

export const CMS_CUSTOM_BLOCK_PRESETS: CmsBlockPresetMeta[] = [
  {
    type: 'HERO_BANNER',
    label: 'Bannière Héro & CTA',
    description: 'Image fond plein format, badge, titre, sous-titre et double bouton CTA.',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'HERO_BANNER',
      label: 'Bannière Héro Personnalisée',
      visible: true,
      badgeText: 'Sélection Royal',
      title: 'Nouvelle Collection Exclusive',
      subtitle: 'Découvrez nos équipements haut de gamme avec garantie officielle et livraison 24–48h.',
      imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1600&q=85',
      ctaText: 'Découvrir',
      ctaLink: '/articles',
      heightPx: 440,
      style: {},
    }),
  },
  {
    type: 'RICH_TEXT',
    label: 'Bloc Texte Riche & Bouton',
    description: 'Titre, sous-titre, contenu HTML/Markdown et bouton d’action.',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'RICH_TEXT',
      label: 'Section Texte Éditorial',
      visible: true,
      badgeText: 'Information Royal',
      title: 'Notre Savoir-Faire Électroménager',
      subtitle: 'Des équipements testés pour votre confort au quotidien.',
      content: 'Rédigez librement votre texte, vos listes à puces ou utilisez des balises HTML propres.',
      ctaText: 'Explorer le catalogue',
      ctaLink: '/articles',
      style: {},
    }),
  },
  {
    type: 'PRODUCT_GRID',
    label: 'Grille / Carrousel Articles Dynamique',
    description: 'Articles réels PostgreSQL (Auto, par Catégories ou sélection précise).',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'PRODUCT_GRID',
      label: 'Sélection d’Articles Dynamique',
      visible: true,
      badgeText: 'Catalogue Live',
      title: 'Nos Recommandations du Moment',
      subtitle: 'Articles sélectionnés en direct depuis le stock actif.',
      displayMode: 'grid',
      columns: '4',
      limit: 8,
      cardImageHeightPx: 260,
      targetType: 'AUTO',
      targetCategorySlugs: [],
      targetProductIds: [],
      style: {},
    }),
  },
  {
    type: 'CATEGORY_STRIP',
    label: 'Bandeau Catégories / Rayons',
    description: 'Cartes de rayons dynamiques reliées au catalogue.',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'CATEGORY_STRIP',
      label: 'Vitrine des Rayons',
      visible: true,
      badgeText: 'Rayons Royal',
      title: 'Parcourir nos Univers',
      targetType: 'AUTO',
      targetCategorySlugs: [],
      style: {},
    }),
  },
  {
    type: 'IMAGE_BANNER',
    label: 'Bannière Image Cliquable',
    description: 'Visuel large avec texte superposé et redirection.',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'IMAGE_BANNER',
      label: 'Bannière Visuelle Promotionnelle',
      visible: true,
      badgeText: 'Offre Spéciale',
      title: 'Profitez des Remises Directes',
      subtitle: 'Valable sur les articles signalés partout en Tunisie.',
      imageUrl: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1600&q=85',
      ctaText: 'Voir les offres',
      ctaLink: '/articles?sortBy=promo',
      heightPx: 320,
      style: {},
    }),
  },
  {
    type: 'TWO_COLUMNS',
    label: 'Mise en Page 2 Colonnes',
    description: 'Bloc côte à côte texte/image avec ratio 50/50, 40/60 ou 60/40.',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'TWO_COLUMNS',
      label: 'Section 2 Colonnes',
      visible: true,
      colRatio: '50-50',
      leftTitle: 'Qualité Certifiée',
      leftText: 'Chaque appareil bénéficie d’une garantie constructeur et d’un contrôle rigoureux avant expédition.',
      rightTitle: 'Livraison Rapide 24–48h',
      rightText: 'Expédition sécurisée vers les 24 gouvernorats ou retrait gratuit en Showroom.',
      style: {},
    }),
  },
  {
    type: 'FAQ_EMBED',
    label: 'Bloc FAQ Dynamique',
    description: 'Affiche vos questions/réponses FAQ actives depuis PostgreSQL.',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'FAQ_EMBED',
      label: 'Foire Aux Questions Intégrée',
      visible: true,
      badgeText: 'Assistance',
      title: 'Questions Fréquentes',
      faqCategory: '',
      style: {},
    }),
  },
  {
    type: 'CONTACT_EMBED',
    label: 'Formulaire Contact Direct',
    description: 'Affiche un formulaire connecté à la boîte Contact Admin.',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'CONTACT_EMBED',
      label: 'Formulaire de Demande Directe',
      visible: true,
      badgeText: 'Devis & Conseil',
      title: 'Contactez Notre Équipe',
      subtitle: 'Réponse rapide par téléphone ou e-mail.',
      style: {},
    }),
  },
  {
    type: 'HTML_CUSTOM',
    label: 'HTML / Widget Libre',
    description: 'Code HTML personnalisé + CSS & JS ciblant son ID unique.',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'HTML_CUSTOM',
      label: 'Bloc HTML Personnalisé',
      visible: true,
      rawHtml: '<div class="p-6 rounded-2xl border border-[#E6E1D6] bg-white text-center">\n  <h3 class="text-lg font-bold">Bloc HTML Royal</h3>\n  <p class="text-sm text-slate-600 mt-1">Personnalisable en HTML, CSS et JavaScript via son ID.</p>\n</div>',
      style: {},
    }),
  },
  {
    type: 'SPACER_DIVIDER',
    label: 'Espaceur / Séparateur',
    description: 'Espacement vertical ajustable avec ligne séparatrice optionnelle.',
    createDefault: () => ({
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'SPACER_DIVIDER',
      label: 'Séparateur & Espacement',
      visible: true,
      heightPx: 40,
      showDividerLine: true,
      style: {},
    }),
  },
];

export function sanitizeDomId(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCmsElementDomId(
  viewKey: string,
  elemId: string,
  customDomId?: string,
): string {
  const custom = sanitizeDomId(customDomId || '');
  if (custom) return custom;
  const v = sanitizeDomId(viewKey || 'view');
  const e = sanitizeDomId(elemId || 'block');
  if (e.startsWith('royal-')) return e;
  return `royal-${v}-${e}`;
}

function toCssLength(val?: number | string): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return undefined;
    return `${val}px`;
  }
  const s = String(val).trim();
  if (!s) return undefined;
  if (/^-?\d+(\.\d+)?$/.test(s)) return `${s}px`;
  return s;
}

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
  sm: '0 2px 6px rgba(15, 23, 42, 0.08)',
  md: '0 8px 20px rgba(15, 23, 42, 0.10)',
  lg: '0 16px 32px rgba(15, 23, 42, 0.12)',
  xl: '0 24px 48px rgba(15, 23, 42, 0.16)',
  gold: '0 10px 28px rgba(197, 155, 39, 0.22)',
};

export function buildCmsInlineStyle(
  styleCfg?: CmsElementStyleConfig,
): React.CSSProperties {
  if (!styleCfg || typeof styleCfg !== 'object') return {};
  const css: React.CSSProperties = {};

  const mt = toCssLength(styleCfg.marginTopPx);
  const mr = toCssLength(styleCfg.marginRightPx);
  const mb = toCssLength(styleCfg.marginBottomPx);
  const ml = toCssLength(styleCfg.marginLeftPx);
  if (mt) css.marginTop = mt;
  if (mr) css.marginRight = mr;
  if (mb) css.marginBottom = mb;
  if (ml) css.marginLeft = ml;

  const pt = toCssLength(styleCfg.paddingTopPx);
  const pr = toCssLength(styleCfg.paddingRightPx);
  const pb = toCssLength(styleCfg.paddingBottomPx);
  const pl = toCssLength(styleCfg.paddingLeftPx);
  if (pt) css.paddingTop = pt;
  if (pr) css.paddingRight = pr;
  if (pb) css.paddingBottom = pb;
  if (pl) css.paddingLeft = pl;

  if (styleCfg.position && styleCfg.position !== 'static') {
    css.position = styleCfg.position;
  }
  if (styleCfg.zIndex !== undefined && styleCfg.zIndex !== '') {
    const z = Number(styleCfg.zIndex);
    if (Number.isFinite(z)) css.zIndex = z;
  }
  const top = toCssLength(styleCfg.topPx);
  const right = toCssLength(styleCfg.rightPx);
  const bottom = toCssLength(styleCfg.bottomPx);
  const left = toCssLength(styleCfg.leftPx);
  if (top) css.top = top;
  if (right) css.right = right;
  if (bottom) css.bottom = bottom;
  if (left) css.left = left;

  if (styleCfg.maxWidth && styleCfg.maxWidth.trim()) {
    css.maxWidth = styleCfg.maxWidth.trim();
    css.marginInline = css.marginLeft || css.marginRight ? undefined : 'auto';
  }
  const minH = toCssLength(styleCfg.minHeightPx);
  if (minH) css.minHeight = minH;

  if (styleCfg.textAlign) css.textAlign = styleCfg.textAlign;
  if (styleCfg.backgroundColor?.trim()) css.backgroundColor = styleCfg.backgroundColor.trim();
  if (styleCfg.textColor?.trim()) css.color = styleCfg.textColor.trim();

  const bw = toCssLength(styleCfg.borderWidthPx);
  if (bw && styleCfg.borderStyle !== 'none') {
    css.borderWidth = bw;
    css.borderStyle = styleCfg.borderStyle || 'solid';
    if (styleCfg.borderColor?.trim()) css.borderColor = styleCfg.borderColor.trim();
  } else if (styleCfg.borderColor?.trim()) {
    css.borderColor = styleCfg.borderColor.trim();
  }
  const br = toCssLength(styleCfg.borderRadiusPx);
  if (br) css.borderRadius = br;

  if (styleCfg.boxShadow && SHADOW_MAP[styleCfg.boxShadow]) {
    css.boxShadow = SHADOW_MAP[styleCfg.boxShadow];
  }
  const fs = toCssLength(styleCfg.fontSizePx);
  if (fs) css.fontSize = fs;
  if (styleCfg.fontWeight?.trim()) css.fontWeight = styleCfg.fontWeight.trim();
  if (styleCfg.opacityPercent !== undefined && styleCfg.opacityPercent !== '') {
    const op = Number(styleCfg.opacityPercent);
    if (Number.isFinite(op)) css.opacity = Math.max(0, Math.min(100, op)) / 100;
  }

  return css;
}

export function buildCmsResponsiveClass(styleCfg?: CmsElementStyleConfig): string {
  if (!styleCfg || typeof styleCfg !== 'object') return '';
  const classes: string[] = [];
  if (styleCfg.hideOnMobile && styleCfg.hideOnDesktop) {
    classes.push('hidden');
  } else if (styleCfg.hideOnMobile) {
    classes.push('hidden md:block');
  } else if (styleCfg.hideOnDesktop) {
    classes.push('block md:hidden');
  }
  if (styleCfg.customClassName?.trim()) {
    classes.push(styleCfg.customClassName.trim());
  }
  return classes.join(' ');
}

export function scopeElementCustomCss(domId: string, rawCss?: string): string {
  const code = String(rawCss || '').trim();
  if (!code) return '';
  const idSelector = `#${domId}`;
  // Replace :scope with exact element ID
  let normalized = code.replace(/:scope\b/g, idSelector);
  // If no selector braces or @rules exist (shorthand declarations only), wrap automatically inside #domId { ... }
  if (!normalized.includes('{')) {
    return `${idSelector} {\n${normalized}\n}`;
  }
  return normalized;
}
