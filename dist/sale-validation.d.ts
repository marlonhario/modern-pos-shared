import { z } from "zod";
/**
 * Maximum price value shared across the POS system.
 * Used to cap discount amounts and other monetary fields.
 */
export declare const PRICE_MAX = 99999999.99;
/**
 * Discount type: FIXED (absolute amount) or PERCENTAGE (0-100 range).
 *
 * Cross-major-safe: z.enum uses identical API in zod v3.23 and v4.4.
 */
export declare const discountTypeSchema: z.ZodEnum<{
    PERCENTAGE: "PERCENTAGE";
    FIXED: "FIXED";
}>;
/**
 * Discount amount: non-negative number up to PRICE_MAX.
 *
 * Cross-major-safe: z.number().min().max() works identically in both majors.
 */
export declare const discountAmountSchema: z.ZodNumber;
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
export declare const saleDiscountSchema: z.ZodObject<{
    discountType: z.ZodEnum<{
        PERCENTAGE: "PERCENTAGE";
        FIXED: "FIXED";
    }>;
    discountAmount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Tax amount schema — a non-negative number (pre-computed per-item or sale-level).
 * Tax can never be negative; that would imply a subsidy, not a tax.
 *
 * Cross-major-safe: z.number().min() is identical in both majors.
 */
export declare const taxAmountSchema: z.ZodNumber;
//# sourceMappingURL=sale-validation.d.ts.map