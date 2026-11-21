import { Decimal } from 'decimal.js';

// Configure Decimal precision for high-precision financial accounting
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(value: string | number | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined || value === '') {
    return new Decimal(0);
  }
  try {
    const d = new Decimal(value);
    return d.isNaN() ? new Decimal(0) : d;
  } catch {
    return new Decimal(0);
  }
}

/**
 * Robust, production-grade currency formatter for Tunisian Dinar (TND / DT)
 * Handles null, undefined, NaN, string, negative, and zero values safely.
 */
export function formatCurrency(
  amount: string | number | Decimal | null | undefined,
  currency = 'TND',
  locale = 'fr-TN',
  decimals = 3
): string {
  if (amount === null || amount === undefined || amount === '') {
    return `0.${'0'.repeat(decimals)} ${currency}`;
  }
  try {
    const dec = new Decimal(amount);
    if (dec.isNaN()) {
      return `0.${'0'.repeat(decimals)} ${currency}`;
    }
    return `${dec.toFixed(decimals)} ${currency}`;
  } catch {
    return `0.${'0'.repeat(decimals)} ${currency}`;
  }
}

/**
 * Format variant price adjustment (+15.000 TND, -5.000 TND, or Standard)
 */
export function formatPriceAdjustment(
  adjustment: string | number | Decimal | null | undefined,
  currency = 'TND'
): string {
  if (adjustment === null || adjustment === undefined || adjustment === '') {
    return 'Inclus';
  }
  try {
    const dec = new Decimal(adjustment);
    if (dec.isNaN() || dec.isZero()) {
      return 'Standard';
    }
    const sign = dec.isPositive() ? '+' : '';
    return `${sign}${dec.toFixed(3)} ${currency}`;
  } catch {
    return 'Standard';
  }
}

export function safeAdd(
  a: string | number | Decimal | null | undefined,
  b: string | number | Decimal | null | undefined
): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

export function safeSub(
  a: string | number | Decimal | null | undefined,
  b: string | number | Decimal | null | undefined
): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function safeMul(
  a: string | number | Decimal | null | undefined,
  b: string | number | Decimal | null | undefined
): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

export function safeDiv(
  a: string | number | Decimal | null | undefined,
  b: string | number | Decimal | null | undefined
): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) return new Decimal(0);
  return toDecimal(a).dividedBy(divisor);
}

export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
