import { roundMoney, DEFAULT_ROUNDING_MODE } from "./money.js";
import type { RoundingMode } from "./money.js";

/**
 * Bundle margin math (D-06, D-07).
 *
 * This module is the ONLY implementation of the bundle margin formula. The
 * frontend's live preview (`useBundleMargin`) and the backend's authoritative
 * recomputation on save both call `computeBundleMargin`, so the two cannot
 * drift — the same single-source contract `roundMoney` holds for rounding.
 * A second copy of this arithmetic in either app package is a defect.
 *
 * Nothing is materialized: the four figures are derived from the CURRENT
 * component costs on every read, so editing a component product's `costPrice`
 * is reflected without any bundle write.
 */

/**
 * One component line of a bundle composition, as the margin math sees it.
 *
 * Numbers only — no Prisma `Decimal`, no framework type — so the backend, the
 * browser, and this package's own test all call the function unchanged.
 * `unitCost` is a major-unit amount (the POS never uses minor units).
 */
export interface BundleComponentLine {
  /** Current cost of a single unit of the component. */
  unitCost: number;
  /** How many units of the component the bundle contains. */
  quantity: number;
}

/** Input to {@link computeBundleMargin}: the set price plus its composition. */
export interface BundleMarginInput {
  /** What the bundle sells for. Independent of the components' selling prices. */
  setPrice: number;
  /** The component lines, in the order the merchant arranged them. */
  components: readonly BundleComponentLine[];
}

/**
 * The four-figure bundle breakdown (D-06) plus the line count.
 *
 * This is the single result contract the whole phase passes around: the
 * backend response schema, the frontend data layer, the draft store, and both
 * summary surfaces all reuse it rather than re-declaring a parallel shape.
 */
export interface BundleFigureSet {
  /** Number of component lines in the composition. */
  componentCount: number;
  /** The set price, echoed back so callers never re-derive it. */
  setPrice: number;
  /** Summed component cost — `Σ(unitCost × quantity)`, rounded as money. */
  componentCost: number;
  /** Set price minus component cost. May be negative for a loss-making bundle. */
  profit: number;
  /** Profit as a percentage of the set price, to one decimal place. */
  marginPercent: number;
}

const PERCENT_SCALE = 10;

/**
 * Round a percentage to one decimal place.
 *
 * Deliberately NOT `roundMoney`: that helper is the single source of *money*
 * rounding at two decimal places, and the margin percentage is a different
 * unit at a different precision. This is a display-precision step on a ratio,
 * not a second money-rounding implementation.
 */
function roundPercent(value: number): number {
  return Math.round(value * PERCENT_SCALE) / PERCENT_SCALE;
}

/**
 * Compute the bundle's four figures from its set price and component costs.
 *
 * - component cost = `Σ(unitCost × quantity)`, rounded as money
 * - profit         = `setPrice − componentCost`, rounded as money (may be negative)
 * - margin %       = `profit / setPrice × 100`, to one decimal place
 *
 * Every money figure goes through the shared `roundMoney` with the caller's
 * rounding mode, which is what makes a `HALF_EVEN`/`FLOOR` business agree
 * between the browser preview and the server response. An empty composition
 * sums to 0 rather than throwing, and a set price of 0 or less yields a margin
 * of 0 rather than `NaN`, `Infinity`, or a divide-by-zero.
 *
 * Pure: no I/O, no `Date`, no framework import.
 */
export function computeBundleMargin(
  input: BundleMarginInput,
  mode: RoundingMode = DEFAULT_ROUNDING_MODE,
): BundleFigureSet {
  const { setPrice, components } = input;

  const componentCost = roundMoney(
    components.reduce((sum, line) => sum + line.unitCost * line.quantity, 0),
    mode,
  );
  const profit = roundMoney(setPrice - componentCost, mode);

  // A bundle priced at zero (or below) has no revenue to take a percentage of.
  // Reporting 0 keeps the preview finite instead of surfacing NaN to a
  // merchant; the server is free to reject a zero set price separately.
  const marginPercent = setPrice > 0 ? roundPercent((profit / setPrice) * 100) : 0;

  return {
    componentCount: components.length,
    setPrice,
    componentCost,
    profit,
    marginPercent,
  };
}
