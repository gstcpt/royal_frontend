'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Search,
  Check,
  Target,
  Tag,
  X,
  Palette,
  Code2,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Sparkles,
  FilePlus2,
  Link2,
} from 'lucide-react';
import { Button, Input, Textarea, Toggle, Select, Modal } from '@/components/ui';
import { ImageDropzoneCropper } from '@/components/ui/image-dropzone-cropper';
import { getSafeImageUrl } from '@/lib/cart-session';
import { fetchApi } from '@/lib/api';
import {
  CMS_CUSTOM_BLOCK_PRESETS,
  CmsCustomBlock,
  CmsCustomBlockType,
  CmsCustomViewRecord,
  CmsElementStyleConfig,
} from '@/lib/cms-builder';
import { CmsDomIdBadge, CmsElementDesignEditor } from './CmsElementDesignEditor';

export function CmsImageFieldWithPreview({
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
              <img src={resolvedSrc} alt={label} className="w-full h-full object-cover" />
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

export function CmsDynamicTargetSelector({
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
    .slice(0, 24);

  const toggleCat = (slug: string) => {
    const exists = selectedCategories.includes(slug);
    onCategoriesChange(exists ? selectedCategories.filter((s) => s !== slug) : [...selectedCategories, slug]);
  };

  const toggleProd = (id: string) => {
    if (singleProductOnly) {
      onProductsChange(selectedProducts.includes(id) ? [] : [id]);
      return;
    }
    const exists = selectedProducts.includes(id);
    onProductsChange(exists ? selectedProducts.filter((p) => p !== id) : [...selectedProducts, id]);
  };

  return (
    <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#1D232E] flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-[#C59B27]" />
          <span>{label}</span>
        </span>
        <div className="sm:w-72">
          <Select value={targetType || 'AUTO'} onChange={(e) => onTargetTypeChange(e.target.value)} options={options} />
        </div>
      </div>

      {targetType === 'CATEGORIES' && (
        <div className="space-y-2.5 pt-2 border-t border-[#E6E1D6]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
                placeholder={`Filtrer parmi ${categories.length} catégories...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E6E1D6] bg-white text-xs focus:outline-none focus:border-[#C59B27]"
              />
            </div>
            <span className="text-[11px] font-bold text-[#9A7414] shrink-0">
              {selectedCategories.length} sélectionnée(s)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleCategories.map((c) => {
              const active = selectedCategories.includes(c.slug);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCat(c.slug)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                    active
                      ? 'bg-[var(--royal-primary)] text-white border-[var(--royal-primary)]'
                      : 'bg-white text-slate-700 border-[#E6E1D6] hover:border-[#C59B27]'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  <Tag className="w-3 h-3 opacity-70" />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
          {!catQuery.trim() && filteredCategories.length > 18 && (
            <button
              type="button"
              onClick={() => setShowAllCats((p) => !p)}
              className="text-[11px] font-bold text-[#9A7414] hover:underline cursor-pointer"
            >
              {showAllCats ? 'Réduire la liste' : `Voir toutes les ${filteredCategories.length} catégories →`}
            </button>
          )}
        </div>
      )}

      {targetType === 'ARTICLES' && (
        <div className="space-y-2.5 pt-2 border-t border-[#E6E1D6]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={prodQuery}
                onChange={(e) => setProdQuery(e.target.value)}
                placeholder={`Rechercher un article par nom ou SKU (${products.length} dispo.)...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E6E1D6] bg-white text-xs focus:outline-none focus:border-[#C59B27]"
              />
            </div>
            <span className="text-[11px] font-bold text-[#9A7414] shrink-0">
              {selectedProducts.length} sélectionné(s)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredProducts.map((p) => {
              const active = selectedProducts.includes(p.id);
              const price = Number(p.discountPrice && Number(p.discountPrice) > 0 ? p.discountPrice : p.sellingPrice || 0);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProd(p.id)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    active
                      ? 'bg-[#FBF6E8] border-[#C59B27] ring-1 ring-[#C59B27]'
                      : 'bg-white border-[#E6E1D6] hover:border-[#C59B27]'
                  }`}
                >
                  <img
                    src={getSafeImageUrl(p.primaryImage) || '/images/royal-logo.jpg'}
                    alt={p.name}
                    className="w-9 h-9 rounded-lg object-cover border border-[#E6E1D6] shrink-0 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-[#1D232E] truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {p.sku || ''} · {price.toFixed(3)} DT
                    </div>
                  </div>
                  {active && <Check className="w-4 h-4 text-[#C59B27] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {targetType === 'CUSTOM_URL' && onCustomUrlChange && (
        <div className="pt-2 border-t border-[#E6E1D6]">
          <Input
            label="URL Cible Manuelle (ex: /articles?sortBy=promo ou /pages/offre)"
            value={customUrlValue || ''}
            onChange={(e) => onCustomUrlChange(e.target.value)}
            placeholder="/articles"
          />
        </div>
      )}
    </div>
  );
}

export function CmsViewSettingsBar({
  viewKey,
  viewLabel,
  viewStyle,
  onChangeViewStyle,
  onAddCustomBlock,
}: {
  viewKey: string;
  viewLabel: string;
  viewStyle?: CmsElementStyleConfig;
  onChangeViewStyle: (next: CmsElementStyleConfig) => void;
  onAddCustomBlock?: (block: CmsCustomBlock) => void;
}) {
  const [openStylePanel, setOpenStylePanel] = React.useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = React.useState(false);

  return (
    <div className="rounded-2xl border border-[var(--royal-border)] bg-white p-4 space-y-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--royal-ink)]">
            Vue « {viewLabel} »
          </span>
          <CmsDomIdBadge viewKey={viewKey} elemId="view-root" customDomId={viewStyle?.domId || `royal-view-${viewKey}`} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenStylePanel((p) => !p)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              openStylePanel
                ? 'bg-[var(--royal-primary)] text-white border-[var(--royal-primary)]'
                : 'bg-[#FBF6E8] text-[#9A7414] border-[#E6D6A6] hover:border-[#C59B27]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>CSS / JS &amp; Design de toute la Vue</span>
            {openStylePanel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {onAddCustomBlock && (
            <button
              type="button"
              onClick={() => setShowWidgetPicker((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un Bloc Elementor</span>
            </button>
          )}
        </div>
      </div>

      {showWidgetPicker && onAddCustomBlock && (
        <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1D232E] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Choisir un Widget / Bloc Dynamique ou Statique à insérer</span>
            </span>
            <button
              type="button"
              onClick={() => setShowWidgetPicker(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Fermer
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
            {CMS_CUSTOM_BLOCK_PRESETS.map((preset) => (
              <button
                key={preset.type}
                type="button"
                onClick={() => {
                  onAddCustomBlock(preset.createDefault());
                  setShowWidgetPicker(false);
                }}
                className="p-3 rounded-xl bg-white border border-[#E6E1D6] hover:border-[#C59B27] hover:bg-[#FBF6E8]/60 text-left transition cursor-pointer space-y-1"
              >
                <div className="text-xs font-extrabold text-[#1D232E]">{preset.label}</div>
                <p className="text-[10px] text-slate-500 leading-snug">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {openStylePanel && (
        <div className="pt-3 border-t border-[var(--royal-border)]">
          <CmsElementDesignEditor
            viewKey={viewKey}
            elemId="view-root"
            value={{ ...(viewStyle || {}), domId: viewStyle?.domId || `royal-view-${viewKey}` }}
            onChange={onChangeViewStyle}
            mode="all"
          />
        </div>
      )}
    </div>
  );
}

export function CmsCustomBlockContentEditor({
  block,
  onChange,
  categories,
  products,
}: {
  block: CmsCustomBlock;
  onChange: (next: CmsCustomBlock) => void;
  categories: any[];
  products: any[];
}) {
  const patch = (partial: Partial<CmsCustomBlock>) => onChange({ ...block, ...partial });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Nom Interne du Bloc (Admin)"
          value={block.label || ''}
          onChange={(e) => patch({ label: e.target.value })}
        />
        <Input
          label="Type Widget Elementor"
          value={block.type}
          disabled
        />
        <Input
          label="Badge / Sur-titre"
          value={block.badgeText || ''}
          onChange={(e) => patch({ badgeText: e.target.value })}
        />
      </div>

      {(block.type === 'HERO_BANNER' || block.type === 'RICH_TEXT' || block.type === 'IMAGE_BANNER') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Titre Principal" value={block.title || ''} onChange={(e) => patch({ title: e.target.value })} />
            <Input label="Sous-titre" value={block.subtitle || ''} onChange={(e) => patch({ subtitle: e.target.value })} />
          </div>
          {block.type === 'RICH_TEXT' && (
            <Textarea
              label="Contenu Texte / HTML Riche"
              rows={5}
              value={block.content || ''}
              onChange={(e) => patch({ content: e.target.value })}
            />
          )}
          {(block.type === 'HERO_BANNER' || block.type === 'IMAGE_BANNER') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Hauteur Bannière (px)"
                  type="number"
                  min={220}
                  max={820}
                  value={block.heightPx ?? 400}
                  onChange={(e) => patch({ heightPx: Number(e.target.value) || 400 })}
                />
                <Input label="Texte Bouton CTA" value={block.ctaText || ''} onChange={(e) => patch({ ctaText: e.target.value })} />
                <Input label="Lien Bouton CTA" value={block.ctaLink || ''} onChange={(e) => patch({ ctaLink: e.target.value })} />
              </div>
              <CmsImageFieldWithPreview
                label="Image de Bannière"
                value={block.imageUrl || ''}
                onChange={(url) => patch({ imageUrl: url })}
                aspectRatio={16 / 6}
              />
            </>
          )}
          {block.type === 'RICH_TEXT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Texte Bouton CTA (Optionnel)" value={block.ctaText || ''} onChange={(e) => patch({ ctaText: e.target.value })} />
              <Input label="Lien Bouton CTA" value={block.ctaLink || ''} onChange={(e) => patch({ ctaLink: e.target.value })} />
            </div>
          )}
        </div>
      )}

      {block.type === 'PRODUCT_GRID' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Titre Section" value={block.title || ''} onChange={(e) => patch({ title: e.target.value })} />
            <Select
              label="Mode d'Affichage"
              value={block.displayMode || 'grid'}
              onChange={(e) => patch({ displayMode: e.target.value as any })}
              options={[
                { value: 'grid', label: 'Grille Multi-Lignes' },
                { value: 'carousel', label: 'Carrousel Horizontal' },
              ]}
            />
            <Select
              label="Colonnes"
              value={String(block.columns || '4')}
              onChange={(e) => patch({ columns: e.target.value as any })}
              options={[
                { value: '2', label: '2 Colonnes' },
                { value: '3', label: '3 Colonnes' },
                { value: '4', label: '4 Colonnes' },
              ]}
            />
            <Input
              label="Max Articles"
              type="number"
              min={2}
              max={24}
              value={block.limit ?? 8}
              onChange={(e) => patch({ limit: Number(e.target.value) || 8 })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Sous-titre" value={block.subtitle || ''} onChange={(e) => patch({ subtitle: e.target.value })} />
            <Input
              label="Hauteur Image Cartes (px)"
              type="number"
              min={160}
              max={420}
              value={block.cardImageHeightPx ?? 260}
              onChange={(e) => patch({ cardImageHeightPx: Number(e.target.value) || 260 })}
            />
          </div>
          <CmsDynamicTargetSelector
            label="Source Dynamique des Articles"
            targetType={block.targetType || 'AUTO'}
            onTargetTypeChange={(val) => patch({ targetType: val as any })}
            selectedCategories={block.targetCategorySlugs || []}
            onCategoriesChange={(slugs) => patch({ targetCategorySlugs: slugs })}
            selectedProducts={block.targetProductIds || []}
            onProductsChange={(ids) => patch({ targetProductIds: ids })}
            categories={categories}
            products={products}
          />
        </div>
      )}

      {block.type === 'CATEGORY_STRIP' && (
        <div className="space-y-4">
          <Input label="Titre Section Catégories" value={block.title || ''} onChange={(e) => patch({ title: e.target.value })} />
          <CmsDynamicTargetSelector
            label="Catégories Affichées"
            targetType={block.targetType || 'AUTO'}
            onTargetTypeChange={(val) => patch({ targetType: val as any })}
            selectedCategories={block.targetCategorySlugs || []}
            onCategoriesChange={(slugs) => patch({ targetCategorySlugs: slugs })}
            selectedProducts={[]}
            onProductsChange={() => {}}
            categories={categories}
            products={products}
            allowArticlesOption={false}
          />
        </div>
      )}

      {block.type === 'TWO_COLUMNS' && (
        <div className="space-y-4">
          <Select
            label="Ratio des 2 Colonnes"
            value={block.colRatio || '50-50'}
            onChange={(e) => patch({ colRatio: e.target.value as any })}
            options={[
              { value: '50-50', label: '50% / 50% (Équilibré)' },
              { value: '40-60', label: '40% / 60% (Gauche compacte)' },
              { value: '60-40', label: '60% / 40% (Droite compacte)' },
            ]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[var(--royal-border)] space-y-3">
              <div className="text-xs font-extrabold text-[var(--royal-gold-dark)] uppercase">Colonne Gauche</div>
              <Input label="Titre Gauche" value={block.leftTitle || ''} onChange={(e) => patch({ leftTitle: e.target.value })} />
              <Textarea label="Texte Gauche" rows={3} value={block.leftText || ''} onChange={(e) => patch({ leftText: e.target.value })} />
              <Input label="URL Image Gauche (Optionnel)" value={block.leftImageUrl || ''} onChange={(e) => patch({ leftImageUrl: e.target.value })} />
            </div>
            <div className="p-4 rounded-xl bg-white border border-[var(--royal-border)] space-y-3">
              <div className="text-xs font-extrabold text-[var(--royal-gold-dark)] uppercase">Colonne Droite</div>
              <Input label="Titre Droite" value={block.rightTitle || ''} onChange={(e) => patch({ rightTitle: e.target.value })} />
              <Textarea label="Texte Droite" rows={3} value={block.rightText || ''} onChange={(e) => patch({ rightText: e.target.value })} />
              <Input label="URL Image Droite (Optionnel)" value={block.rightImageUrl || ''} onChange={(e) => patch({ rightImageUrl: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {block.type === 'FAQ_EMBED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Titre Bloc FAQ" value={block.title || ''} onChange={(e) => patch({ title: e.target.value })} />
          <Input label="Filtrer Catégorie FAQ (vide = toutes)" value={block.faqCategory || ''} onChange={(e) => patch({ faqCategory: e.target.value })} />
        </div>
      )}

      {block.type === 'CONTACT_EMBED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Titre Formulaire" value={block.title || ''} onChange={(e) => patch({ title: e.target.value })} />
          <Input label="Sous-titre Formulaire" value={block.subtitle || ''} onChange={(e) => patch({ subtitle: e.target.value })} />
        </div>
      )}

      {block.type === 'HTML_CUSTOM' && (
        <Textarea
          label="Code HTML Brut du Bloc"
          rows={8}
          className="font-mono text-xs"
          value={block.rawHtml || ''}
          onChange={(e) => patch({ rawHtml: e.target.value })}
          placeholder="<div>...</div>"
        />
      )}

      {block.type === 'SPACER_DIVIDER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <Input
            label="Hauteur d'Espacement (px)"
            type="number"
            min={8}
            max={240}
            value={block.heightPx ?? 40}
            onChange={(e) => patch({ heightPx: Number(e.target.value) || 40 })}
          />
          <Toggle
            label="Afficher une Ligne Séparatrice"
            checked={block.showDividerLine !== false}
            onChange={(v) => patch({ showDividerLine: v })}
          />
        </div>
      )}
    </div>
  );
}

export function CmsCustomViewsStudio({
  customViews,
  selectedId,
  onSelectId,
  onRefreshConfig,
  categories,
  products,
  onNotify,
}: {
  customViews: CmsCustomViewRecord[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  onRefreshConfig: () => Promise<void>;
  categories: any[];
  products: any[];
  onNotify: (msg: string) => void;
}) {
  const activeCustom = customViews.find((v) => v.id === selectedId) || customViews[0] || null;
  const [draft, setDraft] = React.useState<CmsCustomViewRecord | null>(activeCustom ? structuredClone(activeCustom) : null);
  const [saving, setSaving] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newSlug, setNewSlug] = React.useState('');
  const [linkHeaderOnCreate, setLinkHeaderOnCreate] = React.useState(true);
  const [linkFooterOnCreate, setLinkFooterOnCreate] = React.useState<'none' | 'col1' | 'col2' | 'col3'>('col3');
  const [openBlocks, setOpenBlocks] = React.useState<Record<string, boolean>>({});
  const [innerTabs, setInnerTabs] = React.useState<Record<string, 'content' | 'design' | 'code'>>({});

  React.useEffect(() => {
    const found = customViews.find((v) => v.id === selectedId) || customViews[0] || null;
    setDraft(found ? structuredClone(found) : null);
    setOpenBlocks({});
  }, [selectedId, customViews]);

  const handleCreateCustomView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const slug = (newSlug.trim() || newTitle.trim())
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const created = await fetchApi('/storefront-cms/cms/custom-views', {
        method: 'POST',
        body: JSON.stringify({
          slug,
          title: newTitle.trim(),
          subtitle: 'Page personnalisée Royal créée depuis le Constructeur Elementor.',
          badgeText: 'Page Spéciale Royal',
          isPublished: true,
          blocks: [CMS_CUSTOM_BLOCK_PRESETS[0].createDefault(), CMS_CUSTOM_BLOCK_PRESETS[2].createDefault()],
          linkToHeader: linkHeaderOnCreate,
          linkToFooterCol: linkFooterOnCreate,
        }),
      });
      const rec = created?.data || created;
      await onRefreshConfig();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
      setCreateOpen(false);
      setNewTitle('');
      setNewSlug('');
      if (rec?.id) onSelectId(rec.id);
      onNotify(`Vue "/pages/${rec?.slug || slug}" créée et reliée !`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomView = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await fetchApi(`/storefront-cms/cms/custom-views/${encodeURIComponent(draft.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          slug: draft.slug,
          title: draft.title,
          subtitle: draft.subtitle || '',
          badgeText: draft.badgeText || '',
          isPublished: draft.isPublished !== false,
          seoTitle: draft.seoTitle || draft.title,
          seoDescription: draft.seoDescription || '',
          viewStyle: draft.viewStyle || {},
          blocks: draft.blocks || [],
        }),
      });
      await onRefreshConfig();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
      onNotify(`Vue personnalisée "/pages/${draft.slug}" sauvegardée.`);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickLinkMenu = async (target: 'header' | 'col1' | 'col3') => {
    if (!draft) return;
    setSaving(true);
    try {
      await fetchApi(`/storefront-cms/cms/custom-views/${encodeURIComponent(draft.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          slug: draft.slug,
          title: draft.title,
          subtitle: draft.subtitle || '',
          badgeText: draft.badgeText || '',
          isPublished: draft.isPublished !== false,
          viewStyle: draft.viewStyle || {},
          blocks: draft.blocks || [],
          linkToHeader: target === 'header',
          linkToFooterCol: target === 'col1' ? 'col1' : target === 'col3' ? 'col3' : 'none',
        }),
      });
      await onRefreshConfig();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
      onNotify(
        target === 'header'
          ? `Lien "/pages/${draft.slug}" ajouté au Menu Header !`
          : `Lien "/pages/${draft.slug}" ajouté au Pied de Page (${target === 'col1' ? 'Col. 1' : 'Col. 3'}) !`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomView = async (id: string) => {
    setSaving(true);
    try {
      await fetchApi(`/storefront-cms/cms/custom-views/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      await onRefreshConfig();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('royal-cms-updated'));
      onSelectId(null);
      onNotify('Vue personnalisée supprimée.');
    } finally {
      setSaving(false);
    }
  };

  const moveBlock = (idx: number, delta: number) => {
    if (!draft) return;
    const to = idx + delta;
    if (to < 0 || to >= draft.blocks.length) return;
    const next = [...draft.blocks];
    const [moved] = next.splice(idx, 1);
    next.splice(to, 0, moved);
    setDraft({ ...draft, blocks: next });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white border border-[var(--royal-border)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-[var(--royal-ink)] flex items-center gap-2">
            <FilePlus2 className="w-4 h-4 text-[var(--royal-primary)]" />
            <span>Constructeur de Vues &amp; Pages Personnalisées (/pages/[slug])</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            Créez de nouvelles pages complètes par blocs Elementor, liez-les au Header ou Footer et personnalisez chaque CSS/JS.
          </p>
        </div>

        <Button type="button" variant="gold" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>Nouvelle Vue / Page</span>
        </Button>
      </div>

      {!draft ? (
        <div className="p-10 rounded-3xl bg-white border border-dashed border-[#E6D6A6] text-center space-y-3">
          <FilePlus2 className="w-9 h-9 text-[#C59B27] mx-auto" />
          <div className="text-sm font-bold text-[#1D232E]">Aucune vue personnalisée créée pour le moment</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Créez votre première page sur-mesure (ex: Qui sommes-nous, Soldes VIP, Savoir-faire) et connectez-la en 1 clic au Header ou au Footer.
          </p>
          <Button type="button" variant="gold" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Créer ma première vue</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Custom View Toolbar & Metadata */}
          <div className="p-5 rounded-3xl bg-white border border-[var(--royal-border)] space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-[#1D232E]">{draft.title}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] font-mono text-[11px] font-bold text-[#9A7414]">
                  /pages/{draft.slug}
                </span>
                <CmsDomIdBadge viewKey={`page-${draft.slug}`} elemId="view-root" customDomId={draft.viewStyle?.domId || `royal-page-${draft.slug}`} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/pages/${draft.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E1D6] text-xs font-bold text-[#1D232E] hover:bg-[#FBF6E8]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Ouvrir /pages/{draft.slug}</span>
                </Link>
                <Button type="button" variant="outline" size="sm" onClick={() => handleQuickLinkMenu('header')} disabled={saving}>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>+ Header</span>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleQuickLinkMenu('col1')} disabled={saving}>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>+ Footer Col 1</span>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleQuickLinkMenu('col3')} disabled={saving}>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>+ Footer Col 3</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCustomView(draft.id)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button type="button" variant="gold" size="sm" onClick={handleSaveCustomView} isLoading={saving}>
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer la Page</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input label="Titre Page *" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <Input label="Slug URL (/pages/...)" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
              <Input label="Badge En-tête" value={draft.badgeText || ''} onChange={(e) => setDraft({ ...draft, badgeText: e.target.value })} />
              <Toggle label="Page Publiée en Ligne" checked={draft.isPublished !== false} onChange={(v) => setDraft({ ...draft, isPublished: v })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Sous-titre d'Introduction" value={draft.subtitle || ''} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
              <Input label="Titre SEO (onglet navigateur)" value={draft.seoTitle || ''} onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })} />
            </div>
          </div>

          <CmsViewSettingsBar
            viewKey={`page-${draft.slug}`}
            viewLabel={draft.title}
            viewStyle={draft.viewStyle}
            onChangeViewStyle={(nextStyle) => setDraft({ ...draft, viewStyle: nextStyle })}
            onAddCustomBlock={(blk) => {
              setDraft({ ...draft, blocks: [...(draft.blocks || []), blk] });
              setOpenBlocks((prev) => ({ ...prev, [blk.id]: true }));
            }}
          />

          {/* Ordered Blocks inside Custom View */}
          <div className="space-y-3">
            {(draft.blocks || []).map((blk, bIdx) => {
              const isOpen = Boolean(openBlocks[blk.id]);
              const activeTab = innerTabs[blk.id] || 'content';
              return (
                <div key={blk.id} className="rounded-2xl border border-[var(--royal-border)] bg-white shadow-2xs">
                  <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <GripVertical className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
                      <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-lg bg-[#F4F5F7] border border-[#E6E1D6] text-[#9A7414]">
                        #{bIdx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-[#1D232E] truncate">{blk.label || blk.type}</span>
                          <CmsDomIdBadge viewKey={`page-${draft.slug}`} elemId={blk.id} customDomId={blk.style?.domId} />
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {blk.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...draft.blocks];
                          next[bIdx] = { ...blk, visible: blk.visible === false };
                          setDraft({ ...draft, blocks: next });
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          blk.visible !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {blk.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{blk.visible !== false ? 'Visible' : 'Masqué'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(bIdx, -1)}
                        disabled={bIdx === 0}
                        className="p-1.5 rounded-lg border border-[#E6E1D6] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(bIdx, 1)}
                        disabled={bIdx === draft.blocks.length - 1}
                        className="p-1.5 rounded-lg border border-[#E6E1D6] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, blocks: draft.blocks.filter((b) => b.id !== blk.id) })}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Supprimer ce bloc"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenBlocks((p) => ({ ...p, [blk.id]: !isOpen }))}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] cursor-pointer"
                      >
                        <span>{isOpen ? 'Fermer' : 'Détails'}</span>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-3 border-t border-[var(--royal-border)] bg-[var(--royal-bg)]/50 space-y-4 rounded-b-2xl">
                      <div className="flex flex-wrap gap-2 border-b border-[#E6E1D6] pb-3">
                        {[
                          { id: 'content', label: 'Contenu & Dynamique' },
                          { id: 'design', label: 'Design, Marge & Position' },
                          { id: 'code', label: 'CSS / JS (#id)' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setInnerTabs((p) => ({ ...p, [blk.id]: tab.id as any }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              activeTab === tab.id
                                ? 'bg-[var(--royal-primary)] text-white'
                                : 'bg-white text-slate-700 border border-[#E6E1D6] hover:bg-[#FBF6E8]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {activeTab === 'content' && (
                        <CmsCustomBlockContentEditor
                          block={blk}
                          onChange={(updated) => {
                            const next = [...draft.blocks];
                            next[bIdx] = updated;
                            setDraft({ ...draft, blocks: next });
                          }}
                          categories={categories}
                          products={products}
                        />
                      )}

                      {activeTab !== 'content' && (
                        <CmsElementDesignEditor
                          viewKey={`page-${draft.slug}`}
                          elemId={blk.id}
                          value={blk.style}
                          onChange={(nextStyle) => {
                            const next = [...draft.blocks];
                            next[bIdx] = { ...blk, style: nextStyle };
                            setDraft({ ...draft, blocks: next });
                          }}
                          mode={activeTab}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        title="Créer une Nouvelle Vue / Page Storefront"
        subtitle="Accessible sur /pages/[slug] et connectable au Header & Footer"
        size="md"
      >
        <form onSubmit={handleCreateCustomView} className="p-6 space-y-4 text-xs">
          <Input
            label="Nom / Titre de la Vue *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: À Propos de Royal, Offres Flash Été..."
            required
          />
          <Input
            label="Slug URL (laisser vide pour auto-générer)"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="ex: a-propos"
          />
          <Toggle
            label="Ajouter automatiquement au Menu Header"
            checked={linkHeaderOnCreate}
            onChange={setLinkHeaderOnCreate}
          />
          <Select
            label="Lier automatiquement au Pied de Page"
            value={linkFooterOnCreate}
            onChange={(e) => setLinkFooterOnCreate(e.target.value as any)}
            options={[
              { value: 'none', label: 'Ne pas ajouter au footer' },
              { value: 'col1', label: 'Ajouter dans Colonne 1 (À Propos)' },
              { value: 'col2', label: 'Ajouter dans Colonne 2 (Rayons & Articles)' },
              { value: 'col3', label: 'Ajouter dans Colonne 3 (Informations & Aide)' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={saving}>
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Créer &amp; Éditer</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
