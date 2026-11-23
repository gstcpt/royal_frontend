'use client';

import React, { useMemo, useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { getSafeImageUrl } from '@/lib/cart-session';
import { formatTndCurrency } from '@/lib/utils';

export interface ShareProductInfo {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  sellingPrice: number;
  discountPrice?: number | null;
  primaryImage?: string;
  brand?: { name?: string } | null;
}

export function ShareProductModal({
  isOpen,
  onClose,
  product,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: ShareProductInfo | null;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessengerNotice, setCopiedMessengerNotice] = useState(false);

  const shareUrl = useMemo(() => {
    if (!product) return '';
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://royal.com.tn';
    return `${origin}/articles/${product.slug}`;
  }, [product]);

  if (!product) return null;

  const activePrice =
    product.discountPrice &&
    Number(product.discountPrice) > 0 &&
    Number(product.discountPrice) < Number(product.sellingPrice)
      ? Number(product.discountPrice)
      : Number(product.sellingPrice);

  const shareText = `${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''} — ${formatTndCurrency(activePrice)}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${shareText}\n${shareUrl}`);

  const handleCopy = async (forMessenger = false) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (forMessenger) {
        setCopiedMessengerNotice(true);
        setTimeout(() => setCopiedMessengerNotice(false), 3000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // ignore clipboard errors on restricted contexts
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // user cancelled
      }
    }
    await handleCopy(false);
  };

  const handleMessengerShare = async () => {
    await handleCopy(true);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback below
      }
    }
    const isMobile =
      typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const targetUrl = isMobile
      ? `fb-messenger://share/?link=${encodedUrl}`
      : `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(shareText)}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Partager cet article"
      subtitle={product.sku ? `SKU ${product.sku}` : undefined}
      icon={<Share2 className="w-5 h-5" />}
      size="md"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          {typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' ? (
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-4 py-2 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partage appareil</span>
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[var(--royal-border)] bg-[var(--royal-card)] text-xs font-semibold text-[var(--royal-ink)] hover:bg-[var(--royal-silver-light)] cursor-pointer transition"
          >
            Fermer
          </button>
        </div>
      }
    >
      <div className="p-5 sm:p-6 space-y-5">
        {/* Article Preview Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[var(--royal-silver-light)] border border-[var(--royal-border)]">
          <div className="w-16 h-16 rounded-xl bg-[var(--royal-card)] border border-[var(--royal-border)] overflow-hidden shrink-0">
            <img
              src={getSafeImageUrl(product.primaryImage)}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--royal-primary)]">
              <span>{product.brand?.name || 'Royal'}</span>
              {product.sku && <span className="font-mono">• {product.sku}</span>}
            </div>
            <h4 className="font-heading font-bold text-sm text-[var(--royal-ink)] line-clamp-2 mt-0.5">
              {product.name}
            </h4>
            <div className="text-sm font-black font-mono text-[var(--royal-primary)] mt-1">
              {formatTndCurrency(activePrice)}
            </div>
          </div>
        </div>

        {/* Direct Link Copy Bar */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Lien direct de l&apos;article
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--royal-bg)] border border-[var(--royal-border)]">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 min-w-0 bg-transparent px-2.5 py-1.5 text-xs font-mono text-[var(--royal-ink)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleCopy(false)}
              className="px-3.5 py-2 rounded-lg bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
        </div>

        {/* Social Channels */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Partager via
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <a
              href={`https://wa.me/?text=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 text-xs font-bold transition"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleMessengerShare}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 text-xs font-bold transition cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Messenger</span>
            </button>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-800 text-xs font-bold transition"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>Facebook</span>
            </a>

            <a
              href={`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-sky-700 text-xs font-bold transition"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Telegram</span>
            </a>

            <a
              href={`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodedText}`}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-[var(--royal-border)] bg-[var(--royal-card)] hover:bg-[var(--royal-gold-light)] text-[var(--royal-ink)] text-xs font-bold transition"
            >
              <Mail className="w-4 h-4 text-[var(--royal-primary)] shrink-0" />
              <span>E-mail</span>
            </a>

            <button
              type="button"
              onClick={() => handleCopy(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-[var(--royal-primary)]/40 bg-[var(--royal-gold-light)] hover:bg-[var(--royal-primary)] hover:text-[var(--royal-primary-text)] text-[var(--royal-gold-dark)] text-xs font-bold transition cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
              <span>{copiedLink ? 'Copié' : 'Copier lien'}</span>
            </button>
          </div>
          {copiedMessengerNotice && (
            <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 font-medium">
              Lien copié dans le presse-papiers — collez-le directement dans Messenger si la fenêtre ne pré-remplit pas votre conversation.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
