import { Decimal } from 'decimal.js';
export declare function toDecimal(value: string | number | Decimal | null | undefined): Decimal;
/**
 * Robust, production-grade currency formatter for Tunisian Dinar (TND / DT)
 * Handles null, undefined, NaN, string, negative, and zero values safely.
 */
export declare function formatCurrency(amount: string | number | Decimal | null | undefined, currency?: string, locale?: string, decimals?: number): string;
/**
 * Format variant price adjustment (+15.000 TND, -5.000 TND, or Standard)
 */
export declare function formatPriceAdjustment(adjustment: string | number | Decimal | null | undefined, currency?: string): string;
export declare function safeAdd(a: string | number | Decimal | null | undefined, b: string | number | Decimal | null | undefined): Decimal;
export declare function safeSub(a: string | number | Decimal | null | undefined, b: string | number | Decimal | null | undefined): Decimal;
export declare function safeMul(a: string | number | Decimal | null | undefined, b: string | number | Decimal | null | undefined): Decimal;
export declare function safeDiv(a: string | number | Decimal | null | undefined, b: string | number | Decimal | null | undefined): Decimal;
export declare function generateSlug(text: string): string;
//# sourceMappingURL=index.d.ts.map