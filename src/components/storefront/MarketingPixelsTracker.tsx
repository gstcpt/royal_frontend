'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export interface MarketingPixelsConfig {
  metaPixelEnabled: boolean;
  metaPixelId: string;
  facebookDomainVerification: string;
  tiktokPixelEnabled: boolean;
  tiktokPixelId: string;
  ga4Enabled: boolean;
  ga4MeasurementId: string;
  gtmEnabled: boolean;
  gtmContainerId: string;
  snapPixelEnabled: boolean;
  snapPixelId: string;
  googleSiteVerification: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalBaseUrl: string;
  robotsIndex: boolean;
  trackAddToCart: boolean;
  trackPurchase: boolean;
  trackWishlist: boolean;
  trackViewContent: boolean;
}

const DEFAULT_PIXELS_CONFIG: MarketingPixelsConfig = {
  metaPixelEnabled: false,
  metaPixelId: '',
  facebookDomainVerification: '',
  tiktokPixelEnabled: false,
  tiktokPixelId: '',
  ga4Enabled: false,
  ga4MeasurementId: '',
  gtmEnabled: false,
  gtmContainerId: '',
  snapPixelEnabled: false,
  snapPixelId: '',
  googleSiteVerification: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  canonicalBaseUrl: '',
  robotsIndex: true,
  trackAddToCart: true,
  trackPurchase: true,
  trackWishlist: true,
  trackViewContent: true,
};

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    ttq?: any;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    snaptr?: (...args: any[]) => void;
    __royalPixelsConfig?: MarketingPixelsConfig;
  }
}

function upsertMetaTag(name: string, content: string) {
  if (typeof document === 'undefined' || !content.trim()) return;
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content.trim());
}

function getTelemetrySessionHash(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    const existing = window.sessionStorage.getItem('royal_telemetry_sid');
    if (existing) return existing;
    const generated = `sid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem('royal_telemetry_sid', generated);
    return generated;
  } catch {
    return `sid_${Date.now().toString(36)}`;
  }
}

function detectDeviceType(): 'MOBILE' | 'TABLET' | 'DESKTOP' {
  if (typeof window === 'undefined') return 'DESKTOP';
  const w = window.innerWidth;
  if (w < 640) return 'MOBILE';
  if (w < 1024) return 'TABLET';
  return 'DESKTOP';
}

function sendInternalTelemetry(payload: {
  eventType: 'PAGE_VIEW' | 'PAGE_LEAVE' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'BEGIN_CHECKOUT' | 'PURCHASE';
  pagePath?: string;
  pageTitle?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}) {
  if (typeof window === 'undefined') return;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      sessionHash: getTelemetrySessionHash(),
      eventType: payload.eventType,
      pagePath: payload.pagePath || window.location.pathname,
      pageTitle: payload.pageTitle || (typeof document !== 'undefined' ? document.title : ''),
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
      deviceType: detectDeviceType(),
      durationSeconds: payload.durationSeconds,
      metadata: payload.metadata,
    });
    fetch('/api/v1/storefront-cms/telemetry/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => null);
  } catch {
    // Non-blocking telemetry
  }
}

export function trackMarketingEvent(
  eventName: 'ViewContent' | 'AddToCart' | 'AddToWishlist' | 'InitiateCheckout' | 'Purchase' | 'PageView',
  payload?: Record<string, any>,
) {
  if (typeof window === 'undefined') return;

  // Record internal PostgreSQL TrafficEvent metrics cleanly even without external pixels
  if (eventName === 'ViewContent') {
    sendInternalTelemetry({ eventType: 'PRODUCT_VIEW', pagePath: window.location.pathname, metadata: payload });
  } else if (eventName === 'AddToCart') {
    sendInternalTelemetry({ eventType: 'ADD_TO_CART', pagePath: window.location.pathname, metadata: payload });
  } else if (eventName === 'InitiateCheckout') {
    sendInternalTelemetry({ eventType: 'BEGIN_CHECKOUT', pagePath: window.location.pathname, metadata: payload });
  } else if (eventName === 'Purchase') {
    sendInternalTelemetry({ eventType: 'PURCHASE', pagePath: window.location.pathname, metadata: payload });
  }

  const cfg = window.__royalPixelsConfig;
  if (!cfg) return;

  if (eventName === 'AddToCart' && cfg.trackAddToCart === false) return;
  if (eventName === 'Purchase' && cfg.trackPurchase === false) return;
  if (eventName === 'AddToWishlist' && cfg.trackWishlist === false) return;
  if (eventName === 'ViewContent' && cfg.trackViewContent === false) return;

  const currency = payload?.currency || 'TND';
  const value = payload?.value !== undefined ? Number(payload.value) : undefined;

  try {
    // 1. Meta / Facebook Pixel
    if (cfg.metaPixelEnabled && cfg.metaPixelId && typeof window.fbq === 'function') {
      if (eventName === 'PageView') {
        window.fbq('track', 'PageView');
      } else {
        window.fbq('track', eventName, {
          ...(value !== undefined ? { value, currency } : {}),
          ...(payload?.content_name ? { content_name: payload.content_name } : {}),
          ...(payload?.content_ids ? { content_ids: payload.content_ids, content_type: 'product' } : {}),
        });
      }
    }

    // 2. TikTok Pixel
    if (cfg.tiktokPixelEnabled && cfg.tiktokPixelId && window.ttq && typeof window.ttq.track === 'function') {
      const ttMap: Record<string, string> = {
        ViewContent: 'ViewContent',
        AddToCart: 'AddToCart',
        AddToWishlist: 'AddToWishlist',
        InitiateCheckout: 'InitiateCheckout',
        Purchase: 'CompletePayment',
      };
      if (eventName === 'PageView' && typeof window.ttq.page === 'function') {
        window.ttq.page();
      } else if (ttMap[eventName]) {
        window.ttq.track(ttMap[eventName], {
          ...(value !== undefined ? { value, currency } : {}),
          ...(payload?.content_name ? { content_name: payload.content_name } : {}),
          ...(payload?.content_ids ? { content_id: payload.content_ids[0], content_type: 'product' } : {}),
        });
      }
    }

    // 3. Google Analytics 4 (gtag)
    if (cfg.ga4Enabled && cfg.ga4MeasurementId && typeof window.gtag === 'function') {
      const gaMap: Record<string, string> = {
        PageView: 'page_view',
        ViewContent: 'view_item',
        AddToCart: 'add_to_cart',
        AddToWishlist: 'add_to_wishlist',
        InitiateCheckout: 'begin_checkout',
        Purchase: 'purchase',
      };
      const gaEvent = gaMap[eventName];
      if (gaEvent) {
        window.gtag('event', gaEvent, {
          ...(value !== undefined ? { value, currency } : {}),
          ...(payload?.transaction_id ? { transaction_id: payload.transaction_id } : {}),
          ...(payload?.content_name ? { items: [{ item_name: payload.content_name, item_id: payload?.content_ids?.[0] }] } : {}),
        });
      }
    }

    // 4. Snapchat Pixel
    if (cfg.snapPixelEnabled && cfg.snapPixelId && typeof window.snaptr === 'function') {
      const snapMap: Record<string, string> = {
        PageView: 'PAGE_VIEW',
        ViewContent: 'VIEW_CONTENT',
        AddToCart: 'ADD_CART',
        AddToWishlist: 'SAVE',
        InitiateCheckout: 'START_CHECKOUT',
        Purchase: 'PURCHASE',
      };
      if (snapMap[eventName]) {
        window.snaptr('track', snapMap[eventName], {
          ...(value !== undefined ? { price: value, currency } : {}),
          ...(payload?.content_ids ? { item_ids: payload.content_ids } : {}),
        });
      }
    }
  } catch {
    // Non-blocking telemetry error protection
  }
}

export function MarketingPixelsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cfg, setCfg] = useState<MarketingPixelsConfig>(DEFAULT_PIXELS_CONFIG);
  const initializedRef = useRef<string>('');

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/storefront-cms/public-marketing-pixels');
      if (res.ok) {
        const json = await res.json();
        const data = json?.data || json;
        if (data && typeof data === 'object') {
          const merged = { ...DEFAULT_PIXELS_CONFIG, ...data };
          setCfg(merged);
          window.__royalPixelsConfig = merged;
        }
      }
    } catch {
      // Ignore offline/network error
    }
  }, []);

  useEffect(() => {
    loadConfig();
    const handler = () => loadConfig();
    window.addEventListener('royal-pixels-updated', handler);
    return () => window.removeEventListener('royal-pixels-updated', handler);
  }, [loadConfig]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    window.__royalPixelsConfig = cfg;

    // SEO verification meta tags & dynamic document SEO metadata on storefront routes
    if (cfg.googleSiteVerification) upsertMetaTag('google-site-verification', cfg.googleSiteVerification);
    if (cfg.facebookDomainVerification) upsertMetaTag('facebook-domain-verification', cfg.facebookDomainVerification);
    if (cfg.seoKeywords) upsertMetaTag('keywords', cfg.seoKeywords);
    upsertMetaTag('robots', cfg.robotsIndex === false ? 'noindex, nofollow' : 'index, follow');

    if (pathname && !pathname.startsWith('/dashboard') && !pathname.startsWith('/account')) {
      if (cfg.seoTitle?.trim()) {
        document.title = cfg.seoTitle.trim();
      }
      if (cfg.seoDescription?.trim()) {
        upsertMetaTag('description', cfg.seoDescription);
      }
      if (cfg.canonicalBaseUrl?.trim()) {
        const base = cfg.canonicalBaseUrl.trim().replace(/\/+$/, '');
        const canonicalHref = `${base}${pathname === '/' ? '/' : pathname}`;
        let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.setAttribute('rel', 'canonical');
          document.head.appendChild(link);
        }
        link.setAttribute('href', canonicalHref);
      }
    }

    const sig = JSON.stringify({
      m: cfg.metaPixelEnabled ? cfg.metaPixelId : '',
      t: cfg.tiktokPixelEnabled ? cfg.tiktokPixelId : '',
      g: cfg.ga4Enabled ? cfg.ga4MeasurementId : '',
      gtm: cfg.gtmEnabled ? cfg.gtmContainerId : '',
      s: cfg.snapPixelEnabled ? cfg.snapPixelId : '',
    });

    if (initializedRef.current === sig) return;
    initializedRef.current = sig;

    // Inject Meta Pixel
    if (cfg.metaPixelEnabled && cfg.metaPixelId.trim()) {
      const id = cfg.metaPixelId.trim();
      if (!document.getElementById('royal-meta-pixel-script')) {
        const s = document.createElement('script');
        s.id = 'royal-meta-pixel-script';
        s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');`;
        document.head.appendChild(s);
      }
      if (typeof window.fbq === 'function') {
        window.fbq('init', id);
      }
    }

    // Inject TikTok Pixel
    if (cfg.tiktokPixelEnabled && cfg.tiktokPixelId.trim()) {
      const id = cfg.tiktokPixelId.trim();
      if (!document.getElementById('royal-tiktok-pixel-script')) {
        const s = document.createElement('script');
        s.id = 'royal-tiktok-pixel-script';
        s.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${id.replace(/'/g, '')}');}(window,document,'ttq');`;
        document.head.appendChild(s);
      } else if (window.ttq && typeof window.ttq.load === 'function') {
        window.ttq.load(id);
      }
    }

    // Inject GA4
    if (cfg.ga4Enabled && cfg.ga4MeasurementId.trim()) {
      const id = cfg.ga4MeasurementId.trim();
      if (!document.getElementById('royal-ga4-lib')) {
        const lib = document.createElement('script');
        lib.id = 'royal-ga4-lib';
        lib.async = true;
        lib.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
        document.head.appendChild(lib);

        const cfgScript = document.createElement('script');
        cfgScript.id = 'royal-ga4-init';
        cfgScript.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${id.replace(/'/g, '')}');`;
        document.head.appendChild(cfgScript);
      } else if (typeof window.gtag === 'function') {
        window.gtag('config', id);
      }
    }

    // Inject GTM
    if (cfg.gtmEnabled && cfg.gtmContainerId.trim()) {
      const id = cfg.gtmContainerId.trim();
      if (!document.getElementById('royal-gtm-script')) {
        const s = document.createElement('script');
        s.id = 'royal-gtm-script';
        s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id.replace(/'/g, '')}');`;
        document.head.appendChild(s);
      }
    }

    // Inject Snapchat Pixel
    if (cfg.snapPixelEnabled && cfg.snapPixelId.trim()) {
      const id = cfg.snapPixelId.trim();
      if (!document.getElementById('royal-snap-pixel-script')) {
        const s = document.createElement('script');
        s.id = 'royal-snap-pixel-script';
        s.innerHTML = `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');window.snaptr('init','${id.replace(/'/g, '')}');`;
        document.head.appendChild(s);
      }
    }
  }, [cfg, pathname]);

  // Fire PageView & real first-party TrafficEvent + duration on storefront route navigations (exclude dashboard/account)
  useEffect(() => {
    if (!pathname || pathname.startsWith('/dashboard') || pathname.startsWith('/account')) return;
    trackMarketingEvent('PageView', { page_path: pathname });
    const enteredAt = Date.now();
    sendInternalTelemetry({
      eventType: 'PAGE_VIEW',
      pagePath: pathname,
    });
    return () => {
      const durationSeconds = Math.max(0, Math.round((Date.now() - enteredAt) / 1000));
      if (durationSeconds >= 1) {
        sendInternalTelemetry({
          eventType: 'PAGE_LEAVE',
          pagePath: pathname,
          durationSeconds: Math.min(durationSeconds, 3600),
        });
      }
    };
  }, [pathname, searchParams, cfg.metaPixelEnabled, cfg.tiktokPixelEnabled, cfg.ga4Enabled, cfg.snapPixelEnabled]);

  return null;
}
