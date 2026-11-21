import { create } from 'zustand';
import frData from '@/locales/fr.json';
import arData from '@/locales/ar.json';

export type Locale = 'fr' | 'ar';

interface I18nState {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  translations: {
    fr: Record<string, any>;
    ar: Record<string, any>;
  };
  setLocale: (locale: Locale) => void;
  updateTranslations: (locale: Locale, data: Record<string, any>) => void;
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
  // Initial locale from localStorage if available in browser
  const savedLocale =
    typeof window !== 'undefined'
      ? (localStorage.getItem('royal_locale') as Locale) || 'fr'
      : 'fr';

  // Apply initial document direction
  if (typeof window !== 'undefined') {
    document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLocale;
  }

  return {
    locale: savedLocale,
    dir: savedLocale === 'ar' ? 'rtl' : 'ltr',
    translations: {
      fr: frData,
      ar: arData,
    },

    setLocale: (locale: Locale) => {
      const dir = locale === 'ar' ? 'rtl' : 'ltr';
      if (typeof window !== 'undefined') {
        localStorage.setItem('royal_locale', locale);
        document.documentElement.dir = dir;
        document.documentElement.lang = locale;
      }
      set({ locale, dir });
    },

    updateTranslations: (locale: Locale, data: Record<string, any>) => {
      set((state) => ({
        translations: {
          ...state.translations,
          [locale]: data,
        },
      }));
    },

    t: (keyPath: string, fallback?: string) => {
      const { locale, translations } = get();
      // Look up in current locale
      const val = getNestedValue(translations[locale], keyPath);
      if (val) return val;

      // Fallback to French (trusted source)
      const frVal = getNestedValue(translations.fr, keyPath);
      if (frVal) return frVal;

      return fallback || keyPath;
    },
  };
});
