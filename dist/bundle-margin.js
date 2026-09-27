import { roundMoney, DEFAULT_ROUNDING_MODE } from "./money.js";
const PERCENT_SCALE = 10;
/**
 * Round a percentage to one decimal place.
 *
 * Deliberately NOT `roundMoney`: that helper is the single source of *money*
 * rounding at two decimal places, and the margin percentage is a different
 * unit at a different precision. This is a display-precision step on a ratio,
 * not a second money-rounding implementation.
 */
function roundPercent(value) {
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
export function computeBundleMargin(input, mode = DEFAULT_ROUNDING_MODE) {
    const { setPrice, components } = input;
    const componentCost = roundMoney(components.reduce((sum, line) => sum + line.unitCost * line.quantity, 0), mode);
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
//# sourceMappingURL=bundle-margin.js.map