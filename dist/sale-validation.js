import { z } from "zod";
/**
 * Maximum price value shared across the POS system.
 * Used to cap discount amounts and other monetary fields.
 */
export const PRICE_MAX = 99_999_999.99;
/**
 * Discount type: FIXED (absolute amount) or PERCENTAGE (0-100 range).
 *
 * Cross-major-safe: z.enum uses identical API in zod v3.23 and v4.4.
 */
export const discountTypeSchema = z.enum(["FIXED", "PERCENTAGE"]);
/**
 * Discount amount: non-negative number up to PRICE_MAX.
 *
 * Cross-major-safe: z.number().min().max() works identically in both majors.
 */
export const discountAmountSchema = z.number().min(0).max(PRICE_MAX);
/**
 * Combined discount validation schema with DAT-043 percentage-range rule.
 *
 * For PERCENTAGE discounts, the discountAmount field carries the raw percent
 * (0-100), not a money value. This superRefine rejects anything outside that
 * range so a money-value payload can never be misread as a percent.
 *
 * Cross-major-safe API subset:
 * - z.object, z.enum, z.number().min().max()
 * - superRefine with ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...] })
 * - NO ctx.path reads, NO ±Infinity, NO custom message/error params on z.number
 */
export const saleDiscountSchema = z
    .object({
    discountType: discountTypeSchema,
    discountAmount: discountAmountSchema.optional(),
})
    .superRefine((val, ctx) => {
    if (val.discountType === "PERCENTAGE" &&
        val.discountAmount !== undefined &&
        (val.discountAmount < 0 || val.discountAmount > 100)) {
        ctx.addIssue({
            path: ["discountAmount"],
            code: z.ZodIssueCode.custom,
            message: "Percentage discount must be between 0 and 100.",
        });
    }
});
/**
 * Tax amount schema — a non-negative number (pre-computed per-item or sale-level).
 * Tax can never be negative; that would imply a subsidy, not a tax.
 *
 * Cross-major-safe: z.number().min() is identical in both majors.
 */
export const taxAmountSchema = z.number().min(0);
//# sourceMappingURL=sale-validation.js.map