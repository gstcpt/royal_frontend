'use client';

import * as React from 'react';
import { Upload, Crop, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { API_BASE_URL } from '@/lib/api';

interface ImageDropzoneCropperProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: number; // e.g. 1 for favicon, undefined/free or 2.5 for logo
  hint?: string;
  minBytes?: number;
}

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const ALLOWED_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
const MIN_BYTES = 100 * 1024; // 100 Ko
const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo

export function ImageDropzoneCropper({
  label,
  value,
  onChange,
  aspectRatio,
  hint = 'Formats acceptés : PNG, JPG, JPEG, GIF, WEBP, SVG • Taille : 100 Ko < fichier < 10 Mo',
  minBytes = MIN_BYTES,
}: ImageDropzoneCropperProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // Cropper state
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [offsetX, setOffsetX] = React.useState(0);
  const [offsetY, setOffsetY] = React.useState(0);
  const [naturalSize, setNaturalSize] = React.useState<{ w: number; h: number }>({ w: 400, h: 400 });

  const uploadFileToServer = async (fileOrBlob: Blob, filename: string) => {
    setUploading(true);
    setErrorMsg(null);
    try {
      const { compressImageToWebP } = await import('@/lib/webp-compress');
      const optimized = await compressImageToWebP(fileOrBlob, filename, {
        enabled: true,
        quality: 0.85,
        maxWidthPx: 1920,
      });

      const formData = new FormData();
      formData.append('file', optimized.blob, optimized.filename);

      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('royal_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/storefront-cms/cms/upload-image`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || 'Échec lors du téléversement.');
      }
      const uploadedUrl = json?.data?.url || json?.url;
      if (!uploadedUrl) {
        throw new Error('URL média absente dans la réponse serveur.');
      }
      onChange(uploadedUrl);
      setCropSrc(null);
      setPendingFile(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors du téléversement.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectedFile = (file: File) => {
    setErrorMsg(null);
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_MIMES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg('Format invalide. Utilisez uniquement PNG, JPG, JPEG, GIF, WEBP ou SVG.');
      return;
    }
    if (file.size <= minBytes || file.size >= MAX_BYTES) {
      const ko = Math.round(file.size / 1024);
      const minLabel = minBytes >= 1024 * 1024 ? `${Math.round(minBytes / (1024 * 1024))} Mo` : `${Math.max(1, Math.round(minBytes / 1024))} Ko`;
      setErrorMsg(
        `Taille non conforme (${ko} Ko). Le fichier doit être compris entre ${minLabel} et 10 Mo.`
      );
      return;
    }

    if (ext === '.svg' || file.type === 'image/svg+xml') {
      uploadFileToServer(file, file.name);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      const img = new window.Image();
      img.onload = () => {
        setNaturalSize({ w: img.width || 400, h: img.height || 400 });
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
        setPendingFile(file);
        setCropSrc(src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    if (!cropSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cw, ch);

      const baseScale = Math.min(cw / img.width, ch / img.height);
      const drawW = img.width * baseScale * zoom;
      const drawH = img.height * baseScale * zoom;
      const dx = (cw - drawW) / 2 + offsetX;
      const dy = (ch - drawH) / 2 + offsetY;
      ctx.drawImage(img, dx, dy, drawW, drawH);
    };
    img.src = cropSrc;
  }, [cropSrc, zoom, offsetX, offsetY]);

  const confirmCropAndUpload = () => {
    if (!canvasRef.current || !pendingFile) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        const baseName = pendingFile.name.replace(/\.[^.]+$/, '') + '.png';
        uploadFileToServer(blob, baseName);
      },
      'image/png',
      0.95
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-[#1D232E] block">{label}</label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleSelectedFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-4 transition cursor-pointer flex items-center gap-4 ${
          isDragging
            ? 'border-[#C59B27] bg-[#FBF6E8]'
            : 'border-[#E6E1D6] bg-[#FBF9F4] hover:border-[#C59B27]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleSelectedFile(f);
            e.target.value = '';
          }}
        />

        <div className="w-16 h-16 rounded-xl bg-white border border-[#E6E1D6] flex items-center justify-center overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain p-1" />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-300" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1D232E]">
            <Upload className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>{uploading ? 'Téléversement en cours...' : 'Glissez-déposez un fichier ou cliquez pour importer & recadrer'}</span>
          </div>
          <p className="text-[11px] text-slate-500">{hint}</p>
          {value && (
            <p className="text-[10px] font-mono text-[#9A7414] truncate">{value}</p>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive Cropper Modal */}
      <Modal
        isOpen={!!cropSrc}
        onClose={() => {
          setCropSrc(null);
          setPendingFile(null);
        }}
        title={`Recadrage interactif — ${label}`}
        type="edit"
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setCropSrc(null);
                setPendingFile(null);
              }}
            >
              <X className="w-3.5 h-3.5" />
              <span>Annuler</span>
            </Button>
            {pendingFile && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={uploading}
                onClick={() => uploadFileToServer(pendingFile, pendingFile.name)}
              >
                <span>Importer sans recadrer</span>
              </Button>
            )}
            <Button
              variant="gold"
              size="sm"
              type="button"
              disabled={uploading}
              onClick={confirmCropAndUpload}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{uploading ? 'Envoi...' : 'Appliquer & Enregistrer'}</span>
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="flex justify-center bg-[#F4F5F7] rounded-2xl border border-[#E6E1D6] p-4">
            <canvas
              ref={canvasRef}
              width={aspectRatio === 1 ? 280 : 480}
              height={aspectRatio === 1 ? 280 : 220}
              className="rounded-xl border border-[#C59B27] bg-white shadow-sm max-w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Zoom ({zoom.toFixed(1)}×)</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#C59B27]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Position Horizontale ({offsetX}px)</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="w-full accent-[#C59B27]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Position Verticale ({offsetY}px)</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full accent-[#C59B27]"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Dimensions source : {naturalSize.w} × {naturalSize.h} px
          </div>
        </div>
      </Modal>
    </div>
  );
}
