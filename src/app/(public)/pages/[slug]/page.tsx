'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StorefrontPageHeader } from '@/components/storefront/StorefrontPageHeader';
import { CmsCustomBlockRenderer, CmsViewCodeInjector } from '@/components/storefront/CmsElementRuntime';
import { buildCmsInlineStyle, CmsCustomViewRecord } from '@/lib/cms-builder';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

export default function DynamicCustomCmsPage() {
  const params = useParams();
  const slug = String(params?.slug || '').toLowerCase();
  const { config } = useCmsConfig();
  const [viewData, setViewData] = useState<CmsCustomViewRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/storefront-cms/cms/custom-views/public/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        const found = json?.data || json;
        if (found?.slug) {
          setViewData(found);
        } else {
          const fromCfg = (config.customViews || []).find(
            (v) => v.slug?.toLowerCase() === slug && v.isPublished !== false,
          );
          setViewData(fromCfg || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const fromCfg = (config.customViews || []).find(
            (v) => v.slug?.toLowerCase() === slug && v.isPublished !== false,
          );
          setViewData(fromCfg || null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, config.customViews]);

  useEffect(() => {
    if (viewData?.seoTitle || viewData?.title) {
      document.title = `${viewData.seoTitle || viewData.title} — ${config.appName || 'Royal'}`;
    }
  }, [viewData, config.appName]);

  if (loading && !viewData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[var(--royal-bg)]">
        <div className="w-8 h-8 border-2 border-[var(--royal-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!viewData) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center bg-[var(--royal-bg)] px-4 text-center space-y-4">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--royal-ink)]">Page introuvable</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md">
          Cette page personnalisée n&apos;existe pas encore ou n&apos;est pas publiée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l&apos;accueil</span>
        </Link>
      </div>
    );
  }

  const domId = viewData.viewStyle?.domId?.trim() || `royal-view-page-${viewData.slug}`;
  const viewInlineStyle = buildCmsInlineStyle(viewData.viewStyle);

  return (
    <div id={domId} style={viewInlineStyle} className="min-h-screen bg-[var(--royal-bg)]">
      <CmsViewCodeInjector viewKey={`page-${viewData.slug}`} viewStyle={{ ...(viewData.viewStyle || {}), domId }} />

      <StorefrontPageHeader
        badge={viewData.badgeText || 'Page Spéciale Royal'}
        title={viewData.title}
        subtitle={viewData.subtitle || ''}
      />

      <div className="pb-12">
        {(viewData.blocks || []).map((block) => (
          <CmsCustomBlockRenderer
            key={block.id}
            block={block}
            viewKey={`page-${viewData.slug}`}
          />
        ))}
      </div>
    </div>
  );
}
