import type { RoundingMode } from "./money.js";
/**
 * Per-line input to the shared sale-totals math (SC4).
 *
 * Both the backend (`sale.service.ts` createSale) and the frontend register
 * memo (`new-sale-screen.tsx`) feed normalized numeric lines into this module
 * — numbers only, so the shared package stays dependency-free and framework-
 * agnostic. Prices are already resolved to plain `number` by the caller
 * (backend: Prisma Decimal `.toNumber()`; frontend: 2-decimal floats).
 */
export interface ItemComputationInput {
    quantity: number;
    sellingPrice: number;
    discount: number;
    taxRate: number;
    taxInclusive: boolean;
}
/** Per-line computation result (mirrors the backend `itemComputations` items). */
export interface ItemComputationResult {
    /** The raw charged gross BEFORE per-line tax (quantity × price − discount). */
    gross: number;
    /** Pre-tax amount (DAT-023: the per-line subtotal is the pre-tax amount). */
    preTaxAmount: number;
    taxAmount: number;
    /** The rounded per-line subtotal (== pre-tax amount). */
    subtotal: number;
}
export interface ComputeSaleTotalsOptions {
    discountType?: "PERCENTAGE" | "FIXED" | null;
    discountAmount?: number | null;
    roundingMode: RoundingMode;
}
export interface SaleTotalsResult {
    saleSubtotal: number;
    saleTaxAmount: number;
    computedDiscount: number;
    totalAmount: number;
}
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
export declare function computeItemComputation(item: ItemComputationInput, options: {
    roundingMode: RoundingMode;
}): ItemComputationResult;
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
export declare function computeSaleTotals(items: ItemComputationInput[], options: ComputeSaleTotalsOptions): SaleTotalsResult;
//# sourceMappingURL=sale-totals.d.ts.map