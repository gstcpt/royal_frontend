export interface WebpCompressOptions {
  enabled?: boolean;
  quality?: number;
  maxWidthPx?: number;
}

/**
 * Compresses raster images (PNG/JPEG/WEBP) cleanly to lightweight WebP on a Canvas
 * prior to uploading, while preserving SVG and GIF assets verbatim.
 */
export async function compressImageToWebP(
  fileOrBlob: Blob,
  filename: string,
  opts: WebpCompressOptions = {},
): Promise<{ blob: Blob; filename: string }> {
  const enabled = opts.enabled !== false;
  const quality = Math.min(1, Math.max(0.4, Number(opts.quality ?? 0.85)));
  const maxWidthPx = Math.max(320, Number(opts.maxWidthPx ?? 1920));

  const lower = filename.toLowerCase();
  if (!enabled || lower.endsWith('.svg') || lower.endsWith('.gif') || fileOrBlob.type === 'image/svg+xml' || fileOrBlob.type === 'image/gif') {
    return { blob: fileOrBlob, filename };
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { blob: fileOrBlob, filename };
  }

  try {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image decode failed'));
      el.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    let targetW = img.naturalWidth || img.width || 800;
    let targetH = img.naturalHeight || img.height || 800;
    if (targetW > maxWidthPx) {
      targetH = Math.round((targetH * maxWidthPx) / targetW);
      targetW = maxWidthPx;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { blob: fileOrBlob, filename };

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const webpBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', quality),
    );
    if (!webpBlob || webpBlob.size === 0 || (webpBlob.size >= fileOrBlob.size && lower.endsWith('.webp'))) {
      return { blob: fileOrBlob, filename };
    }

    const baseName = filename.replace(/\.[^/.]+$/, '');
    return { blob: webpBlob, filename: `${baseName}.webp` };
  } catch {
    return { blob: fileOrBlob, filename };
  }
}
