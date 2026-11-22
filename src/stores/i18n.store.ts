import { create } from 'zustand';
import frData from '@/locales/fr.json';
import arData from '@/locales/ar.json';

export type Locale = 'fr' | 'ar';

function isPlainObject(val: unknown): val is Record<string, any> {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

export function deepMergeRecord(
  base: Record<string, any>,
  override?: Record<string, any> | null,
): Record<string, any> {
  if (!isPlainObject(override)) return { ...base };
  const result: Record<string, any> = { ...base };
  for (const key of Object.keys(override)) {
    const ov = override[key];
    if (isPlainObject(ov) && isPlainObject(result[key])) {
      result[key] = deepMergeRecord(result[key], ov);
    } else if (ov !== undefined && ov !== null && String(ov).trim() !== '') {
      result[key] = ov;
    }
  }
  return result;
}

interface I18nState {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  hydrated: boolean;
  translations: {
    fr: Record<string, any>;
    ar: Record<string, any>;
  };
  hydrate: () => void;
  setLocale: (locale: Locale) => void;
  updateTranslations: (locale: Locale, data: Record<string, any>) => void;
  mergeTranslations: (overrides?: { fr?: Record<string, any>; ar?: Record<string, any> } | null) => void;
  t: (keyPath: string, fallback?: string) => string;
}

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const useI18nStore = create<I18nState>((set, get) => {
  return {
    locale: 'fr',
    dir: 'ltr',
    hydrated: false,
    translations: {
      fr: frData,
      ar: arData,
    },

    hydrate: () => {
      if (typeof window === 'undefined' || get().hydrated) return;
      const savedLocale = (localStorage.getItem('royal_locale') as Locale) || 'fr';
      const normalized: Locale = savedLocale === 'ar' ? 'ar' : 'fr';
      const dir = normalized === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = normalized;
      set({ locale: normalized, dir, hydrated: true });
    },

    setLocale: (locale: Locale) => {
      const normalized: Locale = locale === 'ar' ? 'ar' : 'fr';
      const dir = normalized === 'ar' ? 'rtl' : 'ltr';
      if (typeof window !== 'undefined') {
        localStorage.setItem('royal_locale', normalized);
        document.documentElement.dir = dir;
        document.documentElement.lang = normalized;
      }
      set({ locale: normalized, dir });
    },

    updateTranslations: (locale: Locale, data: Record<string, any>) => {
      set((state) => ({
        translations: {
          ...state.translations,
          [locale]: deepMergeRecord(locale === 'ar' ? arData : frData, data),
        },
      }));
    },

    mergeTranslations: (overrides?: { fr?: Record<string, any>; ar?: Record<string, any> } | null) => {
      if (!overrides) return;
      set(() => ({
        translations: {
          fr: deepMergeRecord(frData, overrides.fr),
          ar: deepMergeRecord(arData, overrides.ar),
        },
      }));
    },

    t: (keyPath: string, fallback?: string) => {
      const { locale, translations } = get();
      const val = getNestedValue(translations[locale], keyPath);
      if (val) return val;

      const frVal = getNestedValue(translations.fr, keyPath);
      if (frVal) return frVal;

      return fallback || keyPath;
    },
  };
});
