"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDecimal = toDecimal;
exports.formatCurrency = formatCurrency;
exports.formatPriceAdjustment = formatPriceAdjustment;
exports.safeAdd = safeAdd;
exports.safeSub = safeSub;
exports.safeMul = safeMul;
exports.safeDiv = safeDiv;
exports.generateSlug = generateSlug;
const decimal_js_1 = require("decimal.js");
// Configure Decimal precision for high-precision financial accounting
decimal_js_1.Decimal.set({ precision: 20, rounding: decimal_js_1.Decimal.ROUND_HALF_UP });
function toDecimal(value) {
    if (value === null || value === undefined || value === '') {
        return new decimal_js_1.Decimal(0);
    }
    try {
        const d = new decimal_js_1.Decimal(value);
        return d.isNaN() ? new decimal_js_1.Decimal(0) : d;
    }
    catch {
        return new decimal_js_1.Decimal(0);
    }
}
/**
 * Robust, production-grade currency formatter for Tunisian Dinar (TND / DT)
 * Handles null, undefined, NaN, string, negative, and zero values safely.
 */
function formatCurrency(amount, currency = 'TND', locale = 'fr-TN', decimals = 3) {
    if (amount === null || amount === undefined || amount === '') {
        return `0.${'0'.repeat(decimals)} ${currency}`;
    }
    try {
        const dec = new decimal_js_1.Decimal(amount);
        if (dec.isNaN()) {
            return `0.${'0'.repeat(decimals)} ${currency}`;
        }
        return `${dec.toFixed(decimals)} ${currency}`;
    }
    catch {
        return `0.${'0'.repeat(decimals)} ${currency}`;
    }
}
/**
 * Format variant price adjustment (+15.000 TND, -5.000 TND, or Standard)
 */
function formatPriceAdjustment(adjustment, currency = 'TND') {
    if (adjustment === null || adjustment === undefined || adjustment === '') {
        return 'Inclus';
    }
    try {
        const dec = new decimal_js_1.Decimal(adjustment);
        if (dec.isNaN() || dec.isZero()) {
            return 'Standard';
        }
        const sign = dec.isPositive() ? '+' : '';
        return `${sign}${dec.toFixed(3)} ${currency}`;
    }
    catch {
        return 'Standard';
    }
}
function safeAdd(a, b) {
    return toDecimal(a).plus(toDecimal(b));
}
function safeSub(a, b) {
    return toDecimal(a).minus(toDecimal(b));
}
function safeMul(a, b) {
    return toDecimal(a).times(toDecimal(b));
}
function safeDiv(a, b) {
    const divisor = toDecimal(b);
    if (divisor.isZero())
        return new decimal_js_1.Decimal(0);
    return toDecimal(a).dividedBy(divisor);
}
function generateSlug(text) {
    if (!text)
        return '';
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
//# sourceMappingURL=index.js.map