/**
 * Money rounding modes for accounting compliance.
 *
 * - HALF_UP:  round half away from zero (JS Math.round). Default.
 * - HALF_EVEN: banker's rounding — halves round to the nearest even number.
 * - FLOOR:     always round down (truncation).
 * - CEIL:      always round up.
 */
export type RoundingMode = "HALF_UP" | "HALF_EVEN" | "FLOOR" | "CEIL";
export declare const DEFAULT_ROUNDING_MODE: RoundingMode;
/**
 * Round a monetary value to 2 decimal places using the given mode.
 *
 * This is the single source of rounding truth for the whole POS. Both the
 * backend (`backend/src/common/money.ts`) and the frontend
 * (`frontend/src/lib/money.ts`) re-export this — no second implementation may
 * exist in either app package.
 */
export declare function roundMoney(amount: number, mode?: RoundingMode): number;
//# sourceMappingURL=money.d.ts.map