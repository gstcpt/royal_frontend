/**
 * Royal Centralized Design Tokens
 * Extracted from references 1.jpg, 2.jpg, 3.jpg, 4.jpg (J.A.K Luxury Minimalist), 5.jpg
 */

export const tokens = {
  colors: {
    // Core Surfaces
    surface: {
      pureWhite: '#FFFFFF',
      pearl: '#F4F5F7',
      subtle: '#F8F9FA',
      cardDark: '#0A0A0A',
      cardDarkSoft: '#141414',
    },
    // Monochromatic Brand Hierarchy
    brand: {
      black: '#0A0A0A',
      deepSlate: '#111827',
      slate: '#1E293B',
      muted: '#64748B',
      lightBorder: '#E2E8F0',
      darkBorder: '#262626',
    },
    // Semantic Roles
    semantic: {
      success: {
        bg: '#ECFDF5',
        text: '#065F46',
        border: '#A7F3D0',
        solid: '#10B981',
      },
      warning: {
        bg: '#FFFBEB',
        text: '#92400E',
        border: '#FDE68A',
        solid: '#F59E0B',
      },
      danger: {
        bg: '#FEF2F2',
        text: '#991B1B',
        border: '#FECACA',
        solid: '#EF4444',
      },
      info: {
        bg: '#EFF6FF',
        text: '#1E40AF',
        border: '#BFDBFE',
        solid: '#3B82F6',
      },
      gold: {
        star: '#F59E0B',
        accent: '#D97706',
        soft: '#FEF3C7',
      },
    },
  },
  typography: {
    fontSans: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontHeading: "'Poppins', 'Cairo', -apple-system, sans-serif",
  },
  radii: {
    none: '0px',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
    pill: '9999px',
  },
  shadows: {
    subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
    elevation: '0 10px 30px -4px rgba(0, 0, 0, 0.08)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: '400ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  layout: {
    containerMaxWidth: '1720px',
    gutters: 'px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24',
  },
};
