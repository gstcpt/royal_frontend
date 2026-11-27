'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pause,
  Play,
  ZoomIn,
} from 'lucide-react';
import { getSafeImageUrl } from '@/lib/cart-session';
import { Modal } from '@/components/ui';
import { useI18nStore } from '@/stores/i18n.store';

interface ProductMediaViewerProps {
  images: string[];
  alt: string;
  heightClassName?: string;
  desktopHeightPx?: number;
  roundedClassName?: string;
  wrapperClassName?: string;
  borderClassName?: string;
  showThumbnails?: boolean;
  badgeOverlay?: React.ReactNode;
  enableZoomOnHover?: boolean;
  defaultAutoPlay?: boolean;
  displayMode?: 'thumbnails-bottom' | 'thumbnails-left' | 'grid-2x2' | 'single';
  animationMode?: 'zoom-hover' | 'fade' | 'slide' | 'none';
  objectFit?: 'cover' | 'contain';
}

export function ProductMediaViewer({
  images,
  alt,
  heightClassName = 'h-[420px] sm:h-[520px] lg:h-[580px]',
  desktopHeightPx,
  roundedClassName = 'rounded-[32px]',
  wrapperClassName = 'space-y-3 w-full',
  borderClassName = 'border border-neutral-200',
  showThumbnails = true,
  badgeOverlay,
  enableZoomOnHover = true,
  defaultAutoPlay = true,
  displayMode = 'thumbnails-bottom',
  animationMode,
  objectFit = 'cover',
}: ProductMediaViewerProps) {
  const { t } = useI18nStore();
  const safeImages = React.useMemo(() => {
    const clean = (images || []).filter(Boolean).map((u) => getSafeImageUrl(u));
    return clean.length > 0 ? Array.from(new Set(clean)) : ['/images/royal-logo.jpg'];
  }, [images]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(defaultAutoPlay);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenZoom, setFullscreenZoom] = useState(false);
  const swipeStartXRef = React.useRef<number | null>(null);
  const didDragRef = React.useRef(false);

  useEffect(() => {
    setActiveIdx(0);
  }, [safeImages.length, safeImages[0]]);

  useEffect(() => {
    setIsAutoplay(defaultAutoPlay);
  }, [defaultAutoPlay]);

  // Autoplay every 3s whenever enabled and NOT hovered
  useEffect(() => {
    if (safeImages.length <= 1 || !isAutoplay || isHovered) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % safeImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [safeImages.length, isAutoplay, isHovered]);

  // Keyboard support in fullscreen modal
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'ArrowRight') setActiveIdx((prev) => (prev + 1) % safeImages.length);
      if (e.key === 'ArrowLeft') setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen, safeImages.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoomOnHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin({ x, y });
  };

  const effectiveAnim = animationMode || (enableZoomOnHover ? 'zoom-hover' : 'none');
  const zoomActive = Boolean(enableZoomOnHover);
  const currentUrl = safeImages[activeIdx] || safeImages[0];
  const imgFitClass = objectFit === 'contain' ? 'object-contain p-4 bg-white' : 'object-cover object-center';
  const resolvedDesktopHeightPx =
    desktopHeightPx && Number.isFinite(Number(desktopHeightPx))
      ? Math.min(800, Math.max(320, Number(desktopHeightPx)))
      : null;
  const effectiveShowThumbs = showThumbnails && displayMode !== 'single' && displayMode !== 'grid-2x2' && safeImages.length > 1;

  const thumbnailButtons = effectiveShowThumbs && (
    <div
      className={
        displayMode === 'thumbnails-left'
          ? 'flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 sm:w-20 shrink-0'
          : 'flex gap-2.5 overflow-x-auto pb-1'
      }
    >
      {safeImages.map((imgUrl, idx) => (
        <button
          key={`${imgUrl}-${idx}`}
          type="button"
          onClick={() => setActiveIdx(idx)}
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 bg-neutral-100 transition cursor-pointer ${
            activeIdx === idx
              ? 'border-[var(--royal-primary)] shadow-md'
              : 'border-neutral-200 opacity-70 hover:opacity-100'
          }`}
        >
          <img src={imgUrl} alt="" className="w-full h-full object-cover object-center" />
        </button>
      ))}
    </div>
  );

  return (
    <div className={wrapperClassName}>
      {displayMode === 'grid-2x2' ? (
        <div className="relative">
          {badgeOverlay}
          <div className={`grid ${safeImages.length > 1 ? 'grid-cols-2 gap-3' : 'grid-cols-1'}`}>
            {safeImages.slice(0, 4).map((imgUrl, idx) => (
              <div
                key={`${imgUrl}-grid-${idx}`}
                onClick={() => {
                  setActiveIdx(idx);
                  setIsFullscreen(true);
                }}
                className={`relative ${safeImages.length === 1 ? heightClassName : 'h-[240px] sm:h-[280px]'} ${roundedClassName} overflow-hidden bg-neutral-100 ${borderClassName} cursor-zoom-in group`}
              >
                <img
                  src={imgUrl}
                  alt={`${alt} ${idx + 1}`}
                  className={`w-full h-full ${imgFitClass} ${
                    effectiveAnim === 'zoom-hover'
                      ? 'group-hover:scale-110 transition-transform duration-300'
                      : effectiveAnim === 'slide'
                      ? 'group-hover:translate-x-1 transition-transform duration-300'
                      : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={
            displayMode === 'thumbnails-left' && effectiveShowThumbs
              ? 'flex flex-col-reverse sm:flex-row gap-3 items-start h-full w-full'
              : effectiveShowThumbs
              ? 'space-y-3 w-full'
              : 'h-full w-full'
          }
        >
          {displayMode === 'thumbnails-left' && thumbnailButtons}

          {/* Main Interactive Container */}
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              swipeStartXRef.current = null;
            }}
            onMouseMove={handleMouseMove}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement)?.closest('button')) return;
              swipeStartXRef.current = e.clientX;
              didDragRef.current = false;
            }}
            onPointerUp={(e) => {
              if (swipeStartXRef.current === null) return;
              const dx = e.clientX - swipeStartXRef.current;
              swipeStartXRef.current = null;
              if (Math.abs(dx) > 40 && safeImages.length > 1) {
                didDragRef.current = true;
                if (dx < 0) setActiveIdx((prev) => (prev + 1) % safeImages.length);
                else setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length);
              }
            }}
            style={resolvedDesktopHeightPx ? { height: `${resolvedDesktopHeightPx}px` } : undefined}
            className={`relative flex-1 w-full ${resolvedDesktopHeightPx ? '' : heightClassName} ${roundedClassName} overflow-hidden bg-neutral-100 ${borderClassName} select-none group`}
          >
            <img
              key={effectiveAnim === 'fade' || effectiveAnim === 'slide' ? currentUrl : 'static-img'}
              src={currentUrl}
              alt={alt}
              onDragStart={(e) => e.preventDefault()}
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
                setIsFullscreen(true);
              }}
              style={{
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                transform: zoomActive && isHovered ? 'scale(1.55)' : effectiveAnim === 'zoom-hover' ? 'scale(1.04)' : 'scale(1)',
              }}
              className={`w-full h-full ${imgFitClass} cursor-zoom-in transition-all duration-300 ease-out ${
                effectiveAnim === 'fade'
                  ? 'animate-in fade-in duration-500'
                  : effectiveAnim === 'slide'
                  ? 'animate-in fade-in slide-in-from-right-4 duration-300'
                  : ''
              }`}
            />

            {badgeOverlay}

            {/* Top-end Controls: Autoplay Play/Pause + Fullscreen */}
            <div className="absolute top-3.5 end-3.5 z-20 flex items-center gap-2">
              {safeImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAutoplay((p) => !p);
                  }}
                  title={isAutoplay ? t('media_viewer.pause') : t('media_viewer.play')}
                  className="w-9 h-9 rounded-full bg-white/95 hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] border border-neutral-200 text-neutral-800 shadow-sm flex items-center justify-center transition cursor-pointer"
                >
                  {isAutoplay && !isHovered ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(true);
                }}
                title={t('media_viewer.fullscreen')}
                className="w-9 h-9 rounded-full bg-white/95 hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] border border-neutral-200 text-neutral-800 shadow-sm flex items-center justify-center transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Left / Right Navigators */}
            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length);
                  }}
                  aria-label="Image précédente"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] border border-neutral-200 text-neutral-800 shadow-md flex items-center justify-center transition opacity-90 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx((prev) => (prev + 1) % safeImages.length);
                  }}
                  aria-label="Image suivante"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] border border-neutral-200 text-neutral-800 shadow-md flex items-center justify-center transition opacity-90 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 right-3.5 z-20 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-mono font-bold">
                  {activeIdx + 1} / {safeImages.length}
                </div>
              </>
            )}
          </div>

          {displayMode !== 'thumbnails-left' && thumbnailButtons}
        </div>
      )}

      {/* Centralized Fullscreen Lightbox Modal (Light Luxury) */}
      <Modal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={alt || 'Aperçu Galerie'}
        subtitle={`Image ${activeIdx + 1} / ${safeImages.length}`}
        type="details"
        size="5xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              {safeImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsAutoplay((p) => !p)}
                  title={isAutoplay ? 'Pause (3s)' : 'Lecture auto (3s)'}
                  className="px-3.5 py-2 rounded-full border border-[#E6E1D6] bg-white hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] text-[#1D232E] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isAutoplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isAutoplay ? 'Pause' : 'Lecture'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setFullscreenZoom((z) => !z)}
                title="Zoom"
                className={`px-3.5 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  fullscreenZoom
                    ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)]'
                    : 'bg-white border-[#E6E1D6] text-[#1D232E] hover:bg-neutral-50'
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{fullscreenZoom ? 'Zoom 1.5×' : 'Zoomer'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold text-[#1D232E] transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative h-[58vh] flex items-center justify-center rounded-2xl bg-[#F8F9FA] border border-[#E6E1D6] overflow-hidden p-4"
          >
            {safeImages.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length)}
                className="absolute left-3 sm:left-5 z-20 w-10 h-10 rounded-full bg-white/95 hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] border border-[#E6E1D6] text-[#1D232E] shadow-md flex items-center justify-center transition cursor-pointer"
                aria-label="Image précédente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <img
              src={currentUrl}
              alt={alt}
              onClick={() => setFullscreenZoom((z) => !z)}
              className={`max-h-[54vh] max-w-full rounded-xl object-contain transition-transform duration-300 cursor-zoom-in ${
                fullscreenZoom ? 'scale-150 cursor-zoom-out' : 'scale-100'
              }`}
            />

            {safeImages.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveIdx((prev) => (prev + 1) % safeImages.length)}
                className="absolute right-3 sm:right-5 z-20 w-10 h-10 rounded-full bg-white/95 hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] border border-[#E6E1D6] text-[#1D232E] shadow-md flex items-center justify-center transition cursor-pointer"
                aria-label="Image suivante"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {safeImages.length > 1 && (
            <div className="flex items-center justify-center gap-2.5 overflow-x-auto pb-1">
              {safeImages.map((imgUrl, idx) => (
                <button
                  key={`fs-${idx}`}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer bg-white ${
                    activeIdx === idx
                      ? 'border-[var(--royal-primary)] scale-105 shadow-md'
                      : 'border-neutral-200 opacity-65 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
