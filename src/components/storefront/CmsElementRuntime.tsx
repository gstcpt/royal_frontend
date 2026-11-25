'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  buildCmsInlineStyle,
  buildCmsResponsiveClass,
  CmsCustomBlock,
  CmsElementStyleConfig,
  getCmsElementDomId,
  scopeElementCustomCss,
} from '@/lib/cms-builder';
import { getSafeImageUrl } from '@/lib/cart-session';
import { fetchAllPaginated } from '@/lib/api';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { ProductCard, StorefrontProduct } from './ProductCard';

export function CmsElementWrapper({
  viewKey,
  elemId,
  styleCfg,
  as = 'div',
  className = '',
  inlineStyle,
  children,
}: {
  viewKey: string;
  elemId: string;
  styleCfg?: CmsElementStyleConfig;
  as?: 'div' | 'section' | 'header' | 'footer';
  className?: string;
  inlineStyle?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { config } = useCmsConfig();
  const elRef = React.useRef<HTMLElement | null>(null);
  const domId = getCmsElementDomId(viewKey, elemId, styleCfg?.domId);
  const mergedStyle: React.CSSProperties = {
    ...(inlineStyle || {}),
    ...buildCmsInlineStyle(styleCfg),
  };
  const responsiveCls = buildCmsResponsiveClass(styleCfg);
  const combinedCls = [className, responsiveCls].filter(Boolean).join(' ');
  const scopedCss = scopeElementCustomCss(domId, styleCfg?.customCss);
  const jsCode = styleCfg?.customJs?.trim();

  React.useEffect(() => {
    if (!jsCode) return;
    try {
      const fn = new Function('root', 'ctx', jsCode);
      fn(elRef.current, { viewKey, elemId, domId, config });
    } catch (err) {
      console.warn(`[Royal CMS JS] Error in #${domId}:`, err);
    }
  }, [jsCode, viewKey, elemId, domId, config]);

  const Tag = as as any;
  return (
    <Tag
      ref={elRef}
      id={domId}
      data-cms-view={viewKey}
      data-cms-elem={elemId}
      style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
      className={combinedCls || undefined}
    >
      {scopedCss ? <style data-cms-elem-css={domId}>{scopedCss}</style> : null}
      {children}
    </Tag>
  );
}

export function CmsGlobalCodeInjector() {
  const { config } = useCmsConfig();
  const css = config.globalCustomCode?.customCss?.trim() || '';
  const js = config.globalCustomCode?.customJs?.trim() || '';

  React.useEffect(() => {
    if (!js) return;
    try {
      const fn = new Function('ctx', js);
      fn({ config });
    } catch (err) {
      console.warn('[Royal CMS Global JS] Error:', err);
    }
  }, [js, config]);

  if (!css) return null;
  return <style id="royal-global-custom-css">{css}</style>;
}

export function CmsViewCodeInjector({
  viewKey,
  viewStyle,
}: {
  viewKey: string;
  viewStyle?: CmsElementStyleConfig;
}) {
  const { config } = useCmsConfig();
  const domId = viewStyle?.domId?.trim() || `royal-view-${viewKey}`;
  const css = scopeElementCustomCss(domId, viewStyle?.customCss);
  const js = viewStyle?.customJs?.trim() || '';

  React.useEffect(() => {
    if (!js) return;
    try {
      const rootEl = document.getElementById(domId) || document.body;
      const fn = new Function('root', 'ctx', js);
      fn(rootEl, { viewKey, domId, config });
    } catch (err) {
      console.warn(`[Royal CMS View JS] Error in #${domId}:`, err);
    }
  }, [js, viewKey, domId, config]);

  if (!css) return null;
  return <style data-cms-view-css={domId}>{css}</style>;
}

function EmbeddedContactWidget({ title, subtitle, badgeText }: { title?: string; subtitle?: string; badgeText?: string }) {
  const [form, setForm] = React.useState({ fullName: '', phone: '', email: '', subject: '', message: '' });
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/v1/storefront-cms/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDone(true);
        setForm({ fullName: '', phone: '', email: '', subject: '', message: '' });
      } else {
        const j = await res.json().catch(() => null);
        setError(j?.message || 'Erreur lors de l’envoi.');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[var(--royal-border)] p-6 sm:p-10 shadow-sm max-w-3xl mx-auto">
      {badgeText && (
        <span className="inline-block px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[11px] font-bold text-[var(--royal-gold-dark)] uppercase tracking-wider mb-3">
          {badgeText}
        </span>
      )}
      {title && <h2 className="font-heading font-extrabold text-2xl text-[var(--royal-ink)]">{title}</h2>}
      {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5">{subtitle}</p>}
      {done ? (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Votre message a bien été transmis à notre équipe.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nom complet *"
              className="px-4 py-2.5 rounded-xl border border-[#E6E1D6] bg-[#FBF9F4]"
            />
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Téléphone"
              className="px-4 py-2.5 rounded-xl border border-[#E6E1D6] bg-[#FBF9F4]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="E-mail"
              className="px-4 py-2.5 rounded-xl border border-[#E6E1D6] bg-[#FBF9F4]"
            />
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Sujet"
              className="px-4 py-2.5 rounded-xl border border-[#E6E1D6] bg-[#FBF9F4]"
            />
          </div>
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Votre message *"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E1D6] bg-[#FBF9F4]"
          />
          {error && <p className="text-rose-600 font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? 'Envoi...' : 'Envoyer'}</span>
          </button>
        </form>
      )}
    </div>
  );
}

function EmbeddedFaqWidget({ title, badgeText, faqCategory }: { title?: string; badgeText?: string; faqCategory?: string }) {
  const [faqs, setFaqs] = React.useState<any[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/v1/storefront-cms/faq')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const list = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
        const filtered = faqCategory?.trim()
          ? list.filter((it: any) => String(it.category || '').toLowerCase() === faqCategory.trim().toLowerCase())
          : list;
        setFaqs(filtered);
      })
      .catch(() => {});
  }, [faqCategory]);

  if (faqs.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {badgeText && (
        <span className="inline-block px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[11px] font-bold text-[var(--royal-gold-dark)] uppercase tracking-wider">
          {badgeText}
        </span>
      )}
      {title && <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--royal-ink)]">{title}</h2>}
      <div className="space-y-2.5">
        {faqs.map((item) => {
          const open = openId === item.id;
          return (
            <div key={item.id} className="rounded-2xl border border-[var(--royal-border)] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-[var(--royal-ink)] cursor-pointer"
              >
                <span>{item.question}</span>
                {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              </button>
              {open && (
                <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CmsCustomBlockRenderer({
  block,
  viewKey,
  categories: propCategories,
  products: propProducts,
}: {
  block: CmsCustomBlock;
  viewKey: string;
  categories?: any[];
  products?: StorefrontProduct[];
}) {
  const [loadedProducts, setLoadedProducts] = React.useState<StorefrontProduct[]>(propProducts || []);
  const [loadedCategories, setLoadedCategories] = React.useState<any[]>(propCategories || []);

  React.useEffect(() => {
    if (block.type === 'PRODUCT_GRID' && (!propProducts || propProducts.length === 0)) {
      fetchAllPaginated<StorefrontProduct>('/products/storefront', 200)
        .then(({ items }) => setLoadedProducts(items || []))
        .catch(() => {});
    }
    if (block.type === 'CATEGORY_STRIP' && (!propCategories || propCategories.length === 0)) {
      fetch('/api/v1/categories?tree=false')
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => setLoadedCategories(Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : []))
        .catch(() => {});
    }
  }, [block.type, propProducts, propCategories]);

  if (block.visible === false) return null;

  const productsPool = propProducts && propProducts.length > 0 ? propProducts : loadedProducts;
  const categoriesPool = propCategories && propCategories.length > 0 ? propCategories : loadedCategories;

  let filteredProducts = productsPool;
  if (block.type === 'PRODUCT_GRID') {
    if (block.targetType === 'ARTICLES' && block.targetProductIds?.length) {
      filteredProducts = block.targetProductIds
        .map((id) => productsPool.find((p) => p.id === id))
        .filter(Boolean) as StorefrontProduct[];
    } else if (block.targetType === 'CATEGORIES' && block.targetCategorySlugs?.length) {
      filteredProducts = productsPool.filter(
        (p) => p.category?.slug && block.targetCategorySlugs!.includes(p.category.slug),
      );
    }
    filteredProducts = filteredProducts.slice(0, block.limit || 8);
  }

  let filteredCats = categoriesPool.filter((c: any) => c.isActive !== false);
  if (block.type === 'CATEGORY_STRIP' && block.targetType === 'CATEGORIES' && block.targetCategorySlugs?.length) {
    filteredCats = block.targetCategorySlugs
      .map((s) => categoriesPool.find((c) => c.slug === s))
      .filter(Boolean);
  }

  const colCls =
    block.columns === '2'
      ? 'grid-cols-1 sm:grid-cols-2'
      : block.columns === '3'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <CmsElementWrapper
      viewKey={viewKey}
      elemId={block.id}
      styleCfg={block.style}
      as="section"
      className="py-10 sm:py-14"
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {(block.type === 'HERO_BANNER' || block.type === 'IMAGE_BANNER') && (
          <div
            className="relative rounded-3xl overflow-hidden border border-[var(--royal-border)] shadow-lg flex items-center"
            style={{ minHeight: `${block.heightPx || 360}px` }}
          >
            {block.imageUrl && (
              <img
                src={getSafeImageUrl(block.imageUrl) || block.imageUrl}
                alt={block.title || ''}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
            <div className="relative z-10 p-6 sm:p-12 max-w-2xl text-white space-y-3">
              {block.badgeText && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[11px] font-bold uppercase tracking-widest text-amber-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{block.badgeText}</span>
                </span>
              )}
              {block.title && (
                <h2 className="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight">
                  {block.title}
                </h2>
              )}
              {block.subtitle && <p className="text-xs sm:text-sm text-white/85 leading-relaxed">{block.subtitle}</p>}
              {block.ctaText && (
                <div className="pt-2">
                  <Link
                    href={block.ctaLink || '/articles'}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider shadow-md"
                  >
                    <span>{block.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {block.type === 'RICH_TEXT' && (
          <div className="bg-[var(--royal-card)] rounded-3xl border border-[var(--royal-border)] p-6 sm:p-10 shadow-xs space-y-3">
            {block.badgeText && (
              <span className="inline-block px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[11px] font-bold text-[var(--royal-gold-dark)] uppercase tracking-wider">
                {block.badgeText}
              </span>
            )}
            {block.title && <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--royal-ink)]">{block.title}</h2>}
            {block.subtitle && <p className="text-sm text-slate-600">{block.subtitle}</p>}
            {block.content && (
              <div
                className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-1"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            )}
            {block.ctaText && (
              <div className="pt-3">
                <Link
                  href={block.ctaLink || '/articles'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider"
                >
                  <span>{block.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {block.type === 'PRODUCT_GRID' && (
          <div className="space-y-6">
            <div>
              {block.badgeText && (
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] block mb-1">
                  {block.badgeText}
                </span>
              )}
              {block.title && <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--royal-ink)]">{block.title}</h2>}
              {block.subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{block.subtitle}</p>}
            </div>
            <div className={`grid gap-5 ${colCls}`}>
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} imageHeightPx={block.cardImageHeightPx || 260} />
              ))}
            </div>
          </div>
        )}

        {block.type === 'CATEGORY_STRIP' && (
          <div className="space-y-5">
            {block.title && <h2 className="font-heading font-extrabold text-2xl text-[var(--royal-ink)]">{block.title}</h2>}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {filteredCats.slice(0, 12).map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/articles?category=${cat.slug}`}
                  className="p-4 rounded-2xl bg-[var(--royal-card)] border border-[var(--royal-border)] hover:border-[var(--royal-primary)] transition text-center space-y-2 shadow-2xs"
                >
                  {cat.imageUrl && (
                    <img
                      src={getSafeImageUrl(cat.imageUrl)}
                      alt={cat.name}
                      className="w-16 h-16 mx-auto rounded-xl object-cover"
                    />
                  )}
                  <div className="text-xs font-bold text-[var(--royal-ink)] truncate">{cat.name}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {block.type === 'TWO_COLUMNS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div
              className={`${
                block.colRatio === '40-60' ? 'lg:col-span-5' : block.colRatio === '60-40' ? 'lg:col-span-7' : 'lg:col-span-6'
              } p-6 sm:p-8 rounded-3xl bg-[var(--royal-card)] border border-[var(--royal-border)] space-y-3`}
            >
              {block.leftImageUrl && (
                <img src={getSafeImageUrl(block.leftImageUrl) || block.leftImageUrl} alt={block.leftTitle || ''} className="w-full h-52 object-cover rounded-2xl mb-3" />
              )}
              {block.leftTitle && <h3 className="font-heading font-bold text-xl text-[var(--royal-ink)]">{block.leftTitle}</h3>}
              {block.leftText && <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{block.leftText}</p>}
            </div>
            <div
              className={`${
                block.colRatio === '40-60' ? 'lg:col-span-7' : block.colRatio === '60-40' ? 'lg:col-span-5' : 'lg:col-span-6'
              } p-6 sm:p-8 rounded-3xl bg-[var(--royal-card)] border border-[var(--royal-border)] space-y-3`}
            >
              {block.rightImageUrl && (
                <img src={getSafeImageUrl(block.rightImageUrl) || block.rightImageUrl} alt={block.rightTitle || ''} className="w-full h-52 object-cover rounded-2xl mb-3" />
              )}
              {block.rightTitle && <h3 className="font-heading font-bold text-xl text-[var(--royal-ink)]">{block.rightTitle}</h3>}
              {block.rightText && <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{block.rightText}</p>}
            </div>
          </div>
        )}

        {block.type === 'FAQ_EMBED' && (
          <EmbeddedFaqWidget title={block.title} badgeText={block.badgeText} faqCategory={block.faqCategory} />
        )}

        {block.type === 'CONTACT_EMBED' && (
          <EmbeddedContactWidget title={block.title} subtitle={block.subtitle} badgeText={block.badgeText} />
        )}

        {block.type === 'HTML_CUSTOM' && block.rawHtml && (
          <div dangerouslySetInnerHTML={{ __html: block.rawHtml }} />
        )}

        {block.type === 'SPACER_DIVIDER' && (
          <div className="flex items-center justify-center" style={{ height: `${block.heightPx ?? 40}px` }}>
            {block.showDividerLine !== false && <div className="w-full border-t border-[var(--royal-border)]" />}
          </div>
        )}
      </div>
    </CmsElementWrapper>
  );
}

export function CmsOrderedSections({
  viewKey,
  viewCfg,
  defaultOrder,
  sections,
  categories,
  products,
}: {
  viewKey: string;
  viewCfg?: any;
  defaultOrder: string[];
  sections: Record<string, React.ReactNode>;
  categories?: any[];
  products?: StorefrontProduct[];
}) {
  const customBlocks: CmsCustomBlock[] = Array.isArray(viewCfg?.customBlocks) ? viewCfg.customBlocks : [];
  const rawOrder: string[] =
    Array.isArray(viewCfg?.sectionOrder) && viewCfg.sectionOrder.length > 0
      ? [...viewCfg.sectionOrder]
      : [...defaultOrder];

  for (const d of defaultOrder) {
    if (!rawOrder.includes(d)) rawOrder.push(d);
  }
  for (const cb of customBlocks) {
    if (cb?.id && !rawOrder.includes(cb.id)) rawOrder.push(cb.id);
  }

  return (
    <>
      {rawOrder.map((secKey) => {
        if (secKey.startsWith('custom-')) {
          const cb = customBlocks.find((b) => b.id === secKey);
          if (!cb) return null;
          return (
            <CmsCustomBlockRenderer
              key={cb.id}
              block={cb}
              viewKey={viewKey}
              categories={categories}
              products={products}
            />
          );
        }
        const node = sections[secKey];
        if (!node) return null;
        return (
          <CmsElementWrapper
            key={secKey}
            viewKey={viewKey}
            elemId={secKey}
            styleCfg={viewCfg?.elementStyles?.[secKey]}
          >
            {node}
          </CmsElementWrapper>
        );
      })}
    </>
  );
}
