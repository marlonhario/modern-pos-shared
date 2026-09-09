export const DEFAULT_ROUNDING_MODE = "HALF_UP";
/**
 * Round a monetary value to 2 decimal places using the given mode.
 *
 * This is the single source of rounding truth for the whole POS. Both the
 * backend (`backend/src/common/money.ts`) and the frontend
 * (`frontend/src/lib/money.ts`) re-export this — no second implementation may
 * exist in either app package.
 */
export function roundMoney(amount, mode = DEFAULT_ROUNDING_MODE) {
    const scaled = amount * 100;
    let rounded;
    switch (mode) {
        case "HALF_EVEN": {
            const floored = Math.floor(scaled);
            const frac = scaled - floored;
            if (frac > 0.5) {
                rounded = floored + 1;
            }
            else if (frac < 0.5) {
                rounded = floored;
            }
            else {
                rounded = floored % 2 === 0 ? floored : floored + 1;
            }
            break;
        }
        case "FLOOR":
            rounded = Math.floor(scaled);
            break;
        case "CEIL":
            rounded = Math.ceil(scaled);
            break;
        default:
            rounded = Math.round(scaled);
    }
    return rounded / 100;
}
//# sourceMappingURL=money.js.map