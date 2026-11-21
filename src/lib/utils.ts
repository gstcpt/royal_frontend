import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatCurrency, formatPriceAdjustment } from '@royal/shared-utils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency safely using the central currency configuration.
 * Default currency is TND with 3 decimals.
 */
export function formatTndCurrency(
  amount: number | string | null | undefined,
  currency = 'TND',
  decimals = 3
): string {
  return formatCurrency(amount, currency, 'fr-TN', decimals);
}

export { formatCurrency, formatPriceAdjustment };
