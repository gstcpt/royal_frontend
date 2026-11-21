'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Sparkles, User, Palette } from 'lucide-react';

export type SkinTone = 'fair' | 'light' | 'medium' | 'tan' | 'dark';

export interface SkinToneDef {
  id: SkinTone;
  label: string;
  color: string;
  shadowColor: string;
}

export const SKIN_TONES: SkinToneDef[] = [
  { id: 'fair', label: 'Très claire', color: '#FDE4D4', shadowColor: '#F5C5B0' },
  { id: 'light', label: 'Claire', color: '#F7CEB6', shadowColor: '#E6B093' },
  { id: 'medium', label: 'Hâlée / Médium', color: '#DF9F78', shadowColor: '#C48158' },
  { id: 'tan', label: 'Mate / Métisse', color: '#A06642', shadowColor: '#804E2D' },
  { id: 'dark', label: 'Noire / Foncée', color: '#4E2C19', shadowColor: '#361D0F' },
];

export type AvatarStyle =
  | 'male-suit'
  | 'female-navy'
  | 'male-tie'
  | 'female-red'
  | 'female-blazer'
  | 'male-casual'
  | 'female-bun'
  | 'male-polo';

export interface AvatarStyleDef {
  id: AvatarStyle;
  label: string;
  bg: string;
  gender: 'male' | 'female';
}

export const AVATAR_STYLES: AvatarStyleDef[] = [
  { id: 'male-suit', label: 'Costume & Cravate Bleue', bg: '#0EB2C4', gender: 'male' },
  { id: 'female-navy', label: 'Cheveux Mi-longs & Col Blanc', bg: '#F02A8C', gender: 'female' },
  { id: 'male-tie', label: 'Chemise Blanche & Cravate Rouge', bg: '#0A5B8C', gender: 'male' },
  { id: 'female-red', label: 'Coupe Carré & Robe Rouge', bg: '#F9B800', gender: 'female' },
  { id: 'female-blazer', label: 'Cheveux Longs & Blazer', bg: '#F26A21', gender: 'female' },
  { id: 'male-casual', label: 'Pull Sombre & Col V', bg: '#08A474', gender: 'male' },
  { id: 'female-bun', label: 'Chignon Haut & Veste Jaune', bg: '#B4045C', gender: 'female' },
  { id: 'male-polo', label: 'Polo Bleu Nuit', bg: '#7AB82A', gender: 'male' },
];

export function parseAvatarId(avatarStr?: string | null): { style: AvatarStyle; skin: SkinTone } {
  if (!avatarStr || !avatarStr.startsWith('illustrated:')) {
    return { style: 'male-suit', skin: 'fair' };
  }
  const [, style, skin] = avatarStr.split(':');
  const validStyle = AVATAR_STYLES.some((s) => s.id === style) ? (style as AvatarStyle) : 'male-suit';
  const validSkin = SKIN_TONES.some((s) => s.id === skin) ? (skin as SkinTone) : 'fair';
  return { style: validStyle, skin: validSkin };
}

export function formatAvatarId(style: AvatarStyle, skin: SkinTone): string {
  return `illustrated:${style}:${skin}`;
}

export function IllustratedAvatar({
  avatarId,
  style = 'male-suit',
  skin = 'fair',
  size = 48,
  className,
}: {
  avatarId?: string | null;
  style?: AvatarStyle;
  skin?: SkinTone;
  size?: number;
  className?: string;
}) {
  let effectiveStyle = style;
  let effectiveSkin = skin;

  if (avatarId && avatarId.startsWith('illustrated:')) {
    const parsed = parseAvatarId(avatarId);
    effectiveStyle = parsed.style;
    effectiveSkin = parsed.skin;
  }

  const skinDef = SKIN_TONES.find((s) => s.id === effectiveSkin) || SKIN_TONES[0];
  const styleDef = AVATAR_STYLES.find((s) => s.id === effectiveStyle) || AVATAR_STYLES[0];

  const skinColor = skinDef.color;
  const shadowColor = skinDef.shadowColor;
  const bgColor = styleDef.bg;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('rounded-full shrink-0 shadow-2xs select-none', className)}
    >
      <defs>
        <clipPath id={`clip-${effectiveStyle}-${effectiveSkin}`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>

      {/* Circular Colored Background */}
      <circle cx="50" cy="50" r="50" fill={bgColor} />

      <g clipPath={`clip-${effectiveStyle}-${effectiveSkin}`}>
        {/* =========================================================================
            STYLE 1: male-suit (Cyan BG, Dark suit, Blue tie)
        ========================================================================= */}
        {effectiveStyle === 'male-suit' && (
          <>
            {/* Neck */}
            <path d="M43 55 H57 V70 H43 Z" fill={shadowColor} />
            {/* Head */}
            <ellipse cx="50" cy="42" rx="15" ry="19" fill={skinColor} />
            {/* Ears */}
            <circle cx="35" cy="43" r="3.5" fill={shadowColor} />
            <circle cx="65" cy="43" r="3.5" fill={shadowColor} />
            {/* Hair */}
            <path d="M35 38 C35 24 45 18 55 18 C65 18 67 27 67 36 C64 33 58 31 50 31 C42 31 36 34 35 38 Z" fill="#6A3A18" />
            <path d="M35 38 C35 32 38 28 42 26 C38 30 36 34 35 38 Z" fill="#4B250B" />
            {/* White Shirt Collar */}
            <path d="M42 66 L50 78 L58 66 L50 63 Z" fill="#FFFFFF" />
            {/* Blue Tie */}
            <path d="M48 67 L52 67 L54 85 L50 90 L46 85 Z" fill="#1C64F2" />
            {/* Black Suit Jacket */}
            <path d="M22 100 L32 68 L43 72 L47 88 L50 100 Z" fill="#1E232A" />
            <path d="M78 100 L68 68 L57 72 L53 88 L50 100 Z" fill="#1E232A" />
          </>
        )}

        {/* =========================================================================
            STYLE 2: female-navy (Pink BG, Long brown hair, Navy shirt, White collar)
        ========================================================================= */}
        {effectiveStyle === 'female-navy' && (
          <>
            {/* Back Hair */}
            <path d="M28 35 C28 18 72 18 72 35 C74 55 70 75 66 85 H34 C30 75 26 55 28 35 Z" fill="#4A2511" />
            {/* Neck */}
            <path d="M44 54 H56 V72 H44 Z" fill={shadowColor} />
            {/* Head */}
            <ellipse cx="50" cy="43" rx="14" ry="18" fill={skinColor} />
            {/* Front Hair with bangs */}
            <path d="M36 36 C36 22 46 20 54 20 C64 20 66 26 66 36 C62 30 52 28 44 32 C39 35 37 38 36 36 Z" fill="#5D3017" />
            {/* White Collar */}
            <path d="M40 70 L50 78 L60 70 L50 66 Z" fill="#FFFFFF" />
            {/* Navy Top */}
            <path d="M20 100 L32 72 L42 74 L50 82 L58 74 L68 72 L80 100 Z" fill="#1A56DB" />
          </>
        )}

        {/* =========================================================================
            STYLE 3: male-tie (Ocean Blue BG, Spiky Hair, Red Tie)
        ========================================================================= */}
        {effectiveStyle === 'male-tie' && (
          <>
            {/* Neck */}
            <path d="M43 55 H57 V70 H43 Z" fill={shadowColor} />
            {/* Head */}
            <ellipse cx="50" cy="42" rx="14.5" ry="18.5" fill={skinColor} />
            {/* Ears */}
            <circle cx="35" cy="43" r="3.5" fill={shadowColor} />
            <circle cx="65" cy="43" r="3.5" fill={shadowColor} />
            {/* Spiky Hair */}
            <path d="M35 36 C34 26 42 16 50 16 C53 14 56 18 58 17 C60 15 63 20 64 22 C67 27 67 34 66 38 C62 33 54 31 46 32 C40 33 36 36 35 36 Z" fill="#532B10" />
            {/* White Shirt Body */}
            <path d="M22 100 L30 70 L70 70 L78 100 Z" fill="#F3F4F6" />
            {/* White Collar Wings */}
            <path d="M41 68 L50 76 L44 65 Z" fill="#FFFFFF" />
            <path d="M59 68 L50 76 L56 65 Z" fill="#FFFFFF" />
            {/* Red Tie */}
            <path d="M48 68 L52 68 L54 88 L50 94 L46 88 Z" fill="#E02424" />
          </>
        )}

        {/* =========================================================================
            STYLE 4: female-red (Warm Yellow BG, Bob hair, Red Dress)
        ========================================================================= */}
        {effectiveStyle === 'female-red' && (
          <>
            {/* Bob Hair Back */}
            <path d="M30 35 C30 20 70 20 70 35 C73 50 73 65 67 72 H33 C27 65 27 50 30 35 Z" fill="#6B2816" />
            {/* Neck */}
            <path d="M44 54 H56 V72 H44 Z" fill={shadowColor} />
            {/* Head */}
            <ellipse cx="50" cy="43" rx="14" ry="18" fill={skinColor} />
            {/* Front Bob Hair Side Wings */}
            <path d="M33 34 C33 22 44 20 50 20 C62 20 67 24 67 35 C63 32 58 30 50 30 C42 30 37 32 33 34 Z" fill="#84321C" />
            {/* Red Dress with Curved Neckline */}
            <path d="M22 100 L32 75 C40 82 60 82 68 75 L78 100 Z" fill="#C81E1E" />
          </>
        )}

        {/* =========================================================================
            STYLE 5: female-blazer (Orange BG, Sleek Long Dark Hair, Gray Blazer)
        ========================================================================= */}
        {effectiveStyle === 'female-blazer' && (
          <>
            {/* Long Hair Back */}
            <path d="M26 35 C26 15 74 15 74 35 C76 60 74 85 68 95 H32 C26 85 24 60 26 35 Z" fill="#2E1B11" />
            {/* Neck */}
            <path d="M44 54 H56 V72 H44 Z" fill={shadowColor} />
            {/* Head */}
            <ellipse cx="50" cy="43" rx="14" ry="18" fill={skinColor} />
            {/* Middle Part Hair */}
            <path d="M32 36 C34 22 45 20 50 24 C55 20 66 22 68 36 C63 30 54 28 50 30 C46 28 37 30 32 36 Z" fill="#3D2417" />
            {/* White Blouse */}
            <path d="M42 70 L50 82 L58 70 Z" fill="#FFFFFF" />
            {/* Gray Blazer */}
            <path d="M22 100 L32 70 L44 76 L48 92 L50 100 Z" fill="#9CA3AF" />
            <path d="M78 100 L68 70 L56 76 L52 92 L50 100 Z" fill="#9CA3AF" />
          </>
        )}

        {/* =========================================================================
            STYLE 6: male-casual (Emerald BG, Brown Hair, Black Sweater + Collar)
        ========================================================================= */}
        {effectiveStyle === 'male-casual' && (
          <>
            {/* Neck */}
            <path d="M43 55 H57 V70 H43 Z" fill={shadowColor} />
            {/* Head */}
            <ellipse cx="50" cy="42" rx="14.5" ry="18.5" fill={skinColor} />
            {/* Ears */}
            <circle cx="35" cy="43" r="3.5" fill={shadowColor} />
            <circle cx="65" cy="43" r="3.5" fill={shadowColor} />
            {/* Hair */}
            <path d="M35 36 C35 22 45 18 54 18 C63 18 66 25 66 36 C62 32 54 30 46 31 C40 32 36 35 35 36 Z" fill="#78350F" />
            {/* White Collar Underneath */}
            <path d="M40 68 L50 76 L60 68 L50 63 Z" fill="#FFFFFF" />
            {/* Dark Crewneck / V-neck Sweater */}
            <path d="M22 100 L30 70 L43 73 L50 82 L57 73 L70 70 L78 100 Z" fill="#1F2937" />
          </>
        )}

        {/* =========================================================================
            STYLE 7: female-bun (Magenta BG, High Bun Hair, Yellow Jacket)
        ========================================================================= */}
        {effectiveStyle === 'female-bun' && (
          <>
            {/* High Top Bun */}
            <circle cx="50" cy="18" r="9" fill="#1F130B" />
            {/* Neck */}
            <path d="M44 54 H56 V72 H44 Z" fill={shadowColor} />
            {/* Head */}
            <ellipse cx="50" cy="43" rx="14" ry="18" fill={skinColor} />
            {/* Ears */}
            <circle cx="36" cy="44" r="3" fill={shadowColor} />
            <circle cx="64" cy="44" r="3" fill={shadowColor} />
            {/* Hair base */}
            <path d="M36 38 C36 24 45 22 50 22 C55 22 64 24 64 38 C60 32 52 30 50 31 C48 30 40 32 36 38 Z" fill="#2E1C11" />
            {/* White Inner Shirt */}
            <path d="M45 70 L50 78 L55 70 Z" fill="#FFFFFF" />
            {/* Yellow / Golden Jacket */}
            <path d="M22 100 L32 72 L45 74 L49 88 L50 100 Z" fill="#E3A008" />
            <path d="M78 100 L68 72 L55 74 L51 88 L50 100 Z" fill="#E3A008" />
          </>
        )}

        {/* =========================================================================
            STYLE 8: male-polo (Green BG, Brown Waves Hair, Navy Polo)
        ========================================================================= */}
        {effectiveStyle === 'male-polo' && (
          <>
            {/* Neck */}
            <path d="M43 55 H57 V70 H43 Z" fill={shadowColor} />
            {/* Head */}
            <ellipse cx="50" cy="42" rx="14.5" ry="18.5" fill={skinColor} />
            {/* Ears */}
            <circle cx="35" cy="43" r="3.5" fill={shadowColor} />
            <circle cx="65" cy="43" r="3.5" fill={shadowColor} />
            {/* Wavy Hair */}
            <path d="M34 38 C34 22 44 17 52 17 C64 17 67 24 67 36 C63 32 56 30 48 31 C40 32 36 35 34 38 Z" fill="#452613" />
            {/* Navy Polo with Placket and Collar */}
            <path d="M22 100 L32 70 L44 72 L48 88 L50 100 Z" fill="#1E3A8A" />
            <path d="M78 100 L68 70 L56 72 L52 88 L50 100 Z" fill="#1E3A8A" />
            {/* Collar Fold */}
            <path d="M40 70 L50 76 L46 66 Z" fill="#1E40AF" />
            <path d="M60 70 L50 76 L54 66 Z" fill="#1E40AF" />
          </>
        )}
      </g>
    </svg>
  );
}

export function AvatarSelector({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (avatarId: string) => void;
  className?: string;
}) {
  const { style, skin } = parseAvatarId(value);

  const handleStyleChange = (newStyle: AvatarStyle) => {
    onChange(formatAvatarId(newStyle, skin));
  };

  const handleSkinChange = (newSkin: SkinTone) => {
    onChange(formatAvatarId(style, newSkin));
  };

  return (
    <div className={cn('p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-neutral-600" />
          <span>Sélection de l'Avatar Illustré & Carnation (Peau)</span>
        </label>
        <div className="flex items-center gap-2">
          <IllustratedAvatar avatarId={value} size={36} />
          <span className="text-xs font-bold text-neutral-900">Aperçu</span>
        </div>
      </div>

      {/* 1. Skin Tone Selector from so white to deep black */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
          1. Teinte de Peau (De très claire à noire) :
        </span>
        <div className="flex items-center gap-2">
          {SKIN_TONES.map((st) => {
            const isSelected = skin === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSkinChange(st.id)}
                title={st.label}
                className={cn(
                  'relative w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer shadow-xs',
                  isSelected
                    ? 'border-neutral-950 scale-110 ring-2 ring-neutral-950/20'
                    : 'border-white hover:scale-105'
                )}
                style={{ backgroundColor: st.color }}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      'w-3.5 h-3.5 font-bold',
                      st.id === 'fair' || st.id === 'light' ? 'text-neutral-900' : 'text-white'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Style Grid matching the 8 avatars in user's image */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
          2. Personnage & Tenue (8 Styles Illustrés) :
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {AVATAR_STYLES.map((st) => {
            const isSelected = style === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => handleStyleChange(st.id)}
                title={st.label}
                className={cn(
                  'p-1.5 rounded-2xl border transition-all flex flex-col items-center gap-1 cursor-pointer group',
                  isSelected
                    ? 'border-[var(--royal-primary)] bg-[#FBF6E8] shadow-sm ring-1 ring-[var(--royal-primary)]/30'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50'
                )}
              >
                <IllustratedAvatar style={st.id} skin={skin} size={42} />
                <span
                  className={cn(
                    'text-[9px] font-bold truncate max-w-full block',
                    isSelected ? 'text-[#8C6400]' : 'text-neutral-600'
                  )}
                >
                  {st.gender === 'male' ? 'Homme' : 'Femme'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
