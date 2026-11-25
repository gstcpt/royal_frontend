'use client';

import * as React from 'react';
import {
  Copy,
  Check,
  Maximize2,
  Move,
  Palette,
  Code2,
  RotateCcw,
  EyeOff,
} from 'lucide-react';
import { Input, Select, Textarea, Toggle } from '@/components/ui';
import { CmsElementStyleConfig, getCmsElementDomId } from '@/lib/cms-builder';

export function CmsDomIdBadge({
  viewKey,
  elemId,
  customDomId,
  className = '',
}: {
  viewKey: string;
  elemId: string;
  customDomId?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const domId = getCmsElementDomId(viewKey, elemId, customDomId);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`#${domId}`).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Cliquer pour copier l'ID CSS/JS : #${domId}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-mono text-[10px] font-bold transition cursor-pointer shrink-0 ${
        copied
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-[#FBF6E8] text-[#9A7414] border-[#E6D6A6] hover:border-[#C59B27]'
      } ${className}`}
    >
      <span>#{domId}</span>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-2.5 h-2.5 opacity-75" />}
    </button>
  );
}

export function CmsElementDesignEditor({
  viewKey,
  elemId,
  value = {},
  onChange,
  mode = 'all',
}: {
  viewKey: string;
  elemId: string;
  value?: CmsElementStyleConfig;
  onChange: (next: CmsElementStyleConfig) => void;
  mode?: 'design' | 'code' | 'all';
}) {
  const style = value || {};
  const domId = getCmsElementDomId(viewKey, elemId, style.domId);
  const patch = (partial: Partial<CmsElementStyleConfig>) => {
    onChange({ ...style, ...partial });
  };

  const showDesign = mode === 'design' || mode === 'all';
  const showCode = mode === 'code' || mode === 'all';

  return (
    <div className="space-y-5">
      {/* Top DOM ID Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-[var(--royal-border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
            ID Unique DOM (Cible CSS / JS) :
          </span>
          <CmsDomIdBadge viewKey={viewKey} elemId={elemId} customDomId={style.domId} />
        </div>
        <button
          type="button"
          onClick={() => onChange({})}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Réinitialiser le style</span>
        </button>
      </div>

      {showDesign && (
        <>
          {/* Box Model: Margins & Paddings */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[var(--royal-border)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--royal-ink)]">
                <Move className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
                <span>Marges Extérieures (Margin px)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Input
                  label="Haut"
                  placeholder="0"
                  value={style.marginTopPx ?? ''}
                  onChange={(e) => patch({ marginTopPx: e.target.value })}
                />
                <Input
                  label="Droite"
                  placeholder="0"
                  value={style.marginRightPx ?? ''}
                  onChange={(e) => patch({ marginRightPx: e.target.value })}
                />
                <Input
                  label="Bas"
                  placeholder="0"
                  value={style.marginBottomPx ?? ''}
                  onChange={(e) => patch({ marginBottomPx: e.target.value })}
                />
                <Input
                  label="Gauche"
                  placeholder="0"
                  value={style.marginLeftPx ?? ''}
                  onChange={(e) => patch({ marginLeftPx: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[var(--royal-border)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--royal-ink)]">
                <Maximize2 className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
                <span>Espacement Interne (Padding px)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Input
                  label="Haut"
                  placeholder="0"
                  value={style.paddingTopPx ?? ''}
                  onChange={(e) => patch({ paddingTopPx: e.target.value })}
                />
                <Input
                  label="Droite"
                  placeholder="0"
                  value={style.paddingRightPx ?? ''}
                  onChange={(e) => patch({ paddingRightPx: e.target.value })}
                />
                <Input
                  label="Bas"
                  placeholder="0"
                  value={style.paddingBottomPx ?? ''}
                  onChange={(e) => patch({ paddingBottomPx: e.target.value })}
                />
                <Input
                  label="Gauche"
                  placeholder="0"
                  value={style.paddingLeftPx ?? ''}
                  onChange={(e) => patch({ paddingLeftPx: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Position, Dimensions & Alignment */}
          <div className="p-4 rounded-2xl bg-white border border-[var(--royal-border)] space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--royal-ink)]">
              Position, Taille &amp; Visibilité Responsive
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                label="Position CSS"
                value={style.position || 'static'}
                onChange={(e) => patch({ position: e.target.value as any })}
                options={[
                  { value: 'static', label: 'Normale (static)' },
                  { value: 'relative', label: 'Relative (relative)' },
                  { value: 'sticky', label: 'Collante au scroll (sticky)' },
                  { value: 'absolute', label: 'Superposée (absolute)' },
                ]}
              />
              <Input
                label="Ordre Couche (z-index)"
                type="number"
                placeholder="auto"
                value={style.zIndex ?? ''}
                onChange={(e) => patch({ zIndex: e.target.value })}
              />
              <Input
                label="Largeur Max (ex: 1280px)"
                placeholder="100%"
                value={style.maxWidth ?? ''}
                onChange={(e) => patch({ maxWidth: e.target.value })}
              />
              <Input
                label="Hauteur Min (px)"
                placeholder="auto"
                value={style.minHeightPx ?? ''}
                onChange={(e) => patch({ minHeightPx: e.target.value })}
              />
            </div>

            {style.position && style.position !== 'static' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <Input label="Top (px)" placeholder="0" value={style.topPx ?? ''} onChange={(e) => patch({ topPx: e.target.value })} />
                <Input label="Right (px)" placeholder="auto" value={style.rightPx ?? ''} onChange={(e) => patch({ rightPx: e.target.value })} />
                <Input label="Bottom (px)" placeholder="auto" value={style.bottomPx ?? ''} onChange={(e) => patch({ bottomPx: e.target.value })} />
                <Input label="Left (px)" placeholder="auto" value={style.leftPx ?? ''} onChange={(e) => patch({ leftPx: e.target.value })} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-end">
              <Select
                label="Alignement Texte"
                value={style.textAlign || ''}
                onChange={(e) => patch({ textAlign: (e.target.value || undefined) as any })}
                options={[
                  { value: '', label: 'Hérité par défaut' },
                  { value: 'left', label: 'Gauche (Left)' },
                  { value: 'center', label: 'Centré (Center)' },
                  { value: 'right', label: 'Droite (Right)' },
                ]}
              />
              <Toggle
                label="Masquer sur Mobile"
                checked={Boolean(style.hideOnMobile)}
                onChange={(v) => patch({ hideOnMobile: v })}
              />
              <Toggle
                label="Masquer sur Desktop"
                checked={Boolean(style.hideOnDesktop)}
                onChange={(v) => patch({ hideOnDesktop: v })}
              />
            </div>
            {(style.hideOnMobile || style.hideOnDesktop) && (
              <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5" />
                <span>
                  Visibilité restreinte :{' '}
                  {style.hideOnMobile && style.hideOnDesktop
                    ? 'masqué sur tous les écrans'
                    : style.hideOnMobile
                    ? 'visible uniquement sur tablette/PC'
                    : 'visible uniquement sur mobile'}
                </span>
              </div>
            )}
          </div>

          {/* Visual Appearance: Colors, Borders, Radius, Shadow, Typography */}
          <div className="p-4 rounded-2xl bg-white border border-[var(--royal-border)] space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--royal-ink)]">
              <Palette className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>Couleurs, Bordures, Ombre &amp; Typographie</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: 'backgroundColor' as const, label: 'Couleur de Fond' },
                { key: 'textColor' as const, label: 'Couleur du Texte' },
                { key: 'borderColor' as const, label: 'Couleur de Bordure' },
              ].map((c) => (
                <div key={c.key} className="p-2.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600">{c.label}</label>
                    {style[c.key] && (
                      <button
                        type="button"
                        onClick={() => patch({ [c.key]: '' })}
                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(String(style[c.key] || '')) ? String(style[c.key]) : '#FFFFFF'}
                      onChange={(e) => patch({ [c.key]: e.target.value })}
                      className="h-8 w-10 rounded-lg border border-[#E6E1D6] cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={style[c.key] || ''}
                      onChange={(e) => patch({ [c.key]: e.target.value })}
                      placeholder="Défaut / #Hex"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6E1D6] bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Input label="Épaisseur Bord (px)" placeholder="0" value={style.borderWidthPx ?? ''} onChange={(e) => patch({ borderWidthPx: e.target.value })} />
              <Select
                label="Style Bordure"
                value={style.borderStyle || 'solid'}
                onChange={(e) => patch({ borderStyle: e.target.value as any })}
                options={[
                  { value: 'solid', label: 'Pleine' },
                  { value: 'dashed', label: 'Tirets' },
                  { value: 'dotted', label: 'Points' },
                  { value: 'none', label: 'Aucune' },
                ]}
              />
              <Input label="Arrondi Coins (px)" placeholder="0" value={style.borderRadiusPx ?? ''} onChange={(e) => patch({ borderRadiusPx: e.target.value })} />
              <Select
                label="Ombre (Shadow)"
                value={style.boxShadow || 'none'}
                onChange={(e) => patch({ boxShadow: e.target.value as any })}
                options={[
                  { value: 'none', label: 'Par défaut' },
                  { value: 'xs', label: 'Légère (XS)' },
                  { value: 'sm', label: 'Douce (SM)' },
                  { value: 'md', label: 'Moyenne (MD)' },
                  { value: 'lg', label: 'Forte (LG)' },
                  { value: 'gold', label: 'Halo Or Royal' },
                ]}
              />
              <Input label="Taille Police (px)" placeholder="auto" value={style.fontSizePx ?? ''} onChange={(e) => patch({ fontSizePx: e.target.value })} />
              <Input label="Opacité (%)" type="number" min={0} max={100} placeholder="100" value={style.opacityPercent ?? ''} onChange={(e) => patch({ opacityPercent: e.target.value })} />
            </div>
          </div>
        </>
      )}

      {showCode && (
        <div className="p-4 rounded-2xl bg-white border border-[var(--royal-border)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--royal-ink)]">
              <Code2 className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>CSS &amp; JavaScript Personnalisés de l&apos;Élément</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Ciblez <strong className="text-[#9A7414]">#{domId}</strong> ou <code className="px-1 bg-slate-100 rounded">:scope</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="ID DOM Personnalisé (Optionnel)"
              value={style.domId || ''}
              onChange={(e) => patch({ domId: e.target.value })}
              placeholder={getCmsElementDomId(viewKey, elemId)}
            />
            <Input
              label="Classes CSS / Tailwind Additionnelles"
              value={style.customClassName || ''}
              onChange={(e) => patch({ customClassName: e.target.value })}
              placeholder="ex: border-2 shadow-lg tracking-tight"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Textarea
              label={`CSS Personnalisé (#${domId})`}
              rows={6}
              className="font-mono text-xs"
              value={style.customCss || ''}
              onChange={(e) => patch({ customCss: e.target.value })}
              placeholder={`#${domId} {\n  border-radius: 24px;\n}\n#${domId} h2 {\n  letter-spacing: -0.02em;\n}`}
            />
            <Textarea
              label={`JS Personnalisé (exécuté au montage de #${domId})`}
              rows={6}
              className="font-mono text-xs"
              value={style.customJs || ''}
              onChange={(e) => patch({ customJs: e.target.value })}
              placeholder={`// Variables disponibles : root (HTMLElement #${domId}), ctx\nconsole.log('Bloc chargé :', root.id);`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
