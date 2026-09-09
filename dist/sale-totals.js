import { roundMoney } from "./money.js";
/**
 * Compute the per-line pre-tax amount and tax for one sale line.
 *
 * Ported VERBATIM from `backend/src/modules/sale/sale.service.ts` createSale
 * step 2. The item's shelf price is the charged (gross) amount.
 *
 * For exclusive rates:
 *   preTaxAmount = gross
 *   taxAmount    = round(preTaxAmount * rate / 100)
 *   subtotal     = preTaxAmount
 *
 * For inclusive rates (tax already included in the shelf price):
 *   taxAmount    = round(gross * rate / (100 + rate))
 *   preTaxAmount = round(gross - taxAmount)
 *   subtotal     = preTaxAmount
 *
 * DAT-023: the per-line subtotal is the pre-tax amount so lines sum to the
 * header subtotal. DAT-040: a line discount greater than the line value is
 * rejected (would persist a negative/zero line subtotal).
 */
export function computeItemComputation(item, options) {
    const { quantity, sellingPrice, discount, taxRate, taxInclusive } = item;
    const gross = quantity * sellingPrice - discount;
    // DAT-040: a line's discount must never exceed its gross value, otherwise a
    // negative/zero line subtotal is reached (direct API or offline replay). The
    // schema only bounds discount by PRICE_MAX because the price is resolved
    // server-side by the caller.
    if (discount > quantity * sellingPrice) {
        throw new Error("discount exceeds the line value.");
    }
    let preTaxAmount = gross;
    let taxAmount = 0;
    if (taxRate > 0) {
        if (taxInclusive) {
            taxAmount = roundMoney((gross * taxRate) / (100 + taxRate), options.roundingMode);
            preTaxAmount = roundMoney(gross - taxAmount, options.roundingMode);
        }
        else {
            taxAmount = roundMoney((preTaxAmount * taxRate) / 100, options.roundingMode);
        }
    }
    const subtotal = roundMoney(preTaxAmount, options.roundingMode);
    return { gross, preTaxAmount, taxAmount, subtotal };
}
/**
 * Compute sale-level totals from the raw line inputs.
 *
 * Ported VERBATIM from `backend/src/modules/sale/sale.service.ts` createSale
 * steps 2-4. Each line is run through `computeItemComputation`, then:
 *
 *   saleSubtotal = Σ preTaxAmount
 *   saleTaxAmount = Σ taxAmount
 *
 * DAT-034: the sale-level discount is applied AFTER tax on
 * (saleSubtotal + saleTaxAmount):
 *   - PERCENTAGE: round((subtotal + tax) × min(pct, 100) / 100)
 *   - FIXED:      min(discountAmount, subtotal + tax)
 *
 * total = round(saleSubtotal + saleTaxAmount − computedDiscount); a negative
 * total is rejected.
 */
export function computeSaleTotals(items, options) {
    const { roundingMode } = options;
    const itemComputations = items.map((item) => computeItemComputation(item, options));
    const saleSubtotal = itemComputations.reduce((sum, item) => sum + item.preTaxAmount, 0);
    const saleTaxAmount = itemComputations.reduce((sum, item) => sum + item.taxAmount, 0);
    let computedDiscount = 0;
    if (options.discountType &&
        options.discountAmount &&
        options.discountAmount > 0) {
        if (options.discountType === "PERCENTAGE") {
            const pct = Math.min(options.discountAmount, 100);
            computedDiscount = roundMoney((saleSubtotal + saleTaxAmount) * (pct / 100), roundingMode);
        }
        else {
            computedDiscount = Math.min(options.discountAmount, saleSubtotal + saleTaxAmount);
        }
    }
    let totalAmount = roundMoney(saleSubtotal + saleTaxAmount - computedDiscount, roundingMode);
    if (totalAmount < 0) {
        throw new Error("Total amount cannot be negative.");
    }
    return { saleSubtotal, saleTaxAmount, computedDiscount, totalAmount };
}
//# sourceMappingURL=sale-totals.js.map