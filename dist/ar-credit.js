/**
 * Accounts-receivable credit-portion math (single source — MA-017).
 *
 * A sale's credit portion is the amount that was NOT tendered at point of
 * sale. It is reconstructed as follows:
 *
 *  - paymentMethod set (single POS method) → fully paid at creation → 0
 *  - split payments present → total minus the converted split-payment sum
 *  - neither → the full total (a pure credit sale)
 *
 * ON_ACCOUNT (D-12) is a credit tender: it records no collected money, so the
 * credit portion is the full total regardless of whether it was sent as the
 * single header method or as a `SalePayment` row with `method ===
 * "ON_ACCOUNT"`. Non-ON_ACCOUNT split rows still reduce the credit portion.
 *
 * LAYAWAY (D-09) is a deposit-based sale: the value on layaway is the full
 * total, and deposits are AR `Payment` rows (collections), never at-creation
 * `SalePayment` tender. The credit portion is therefore the FULL total — the
 * outstanding balance = total − deposits lives on the layaway, separate from
 * the customer's on-account credit balance.
 *
 * Amounts are in the business base currency.
 *
 * These are pure functions: callers resolve Prisma Decimal columns to
 * `DecimalLike` (`toNumber()`) before passing them in. The backend
 * `ar.utils.ts` re-exports these under the same names; the aging helpers stay
 * backend-local.
 */
import { roundMoney } from "./money.js";
const ACCOUNT_METHOD = "ON_ACCOUNT";
const LAYAWAY_STATUS = "LAYAWAY";
export function saleCreditPortionBase(sale, roundingMode = "HALF_UP") {
    const total = sale.baseTotalAmount.toNumber();
    const rate = sale.fxRate.toNumber();
    const onAccount = sale.paymentMethod === ACCOUNT_METHOD ||
        sale.payments.some((p) => p.method === ACCOUNT_METHOD);
    // LAYAWAY (D-09): the credit portion is the full total — a layaway's
    // outstanding balance = total − deposits, carried on the layaway surface
    // (never merged into the customer's on-account credit). Full-payment
    // creates complete the sale (DAT-020), and the completed row re-computes
    // through the default path below with the same result (outstanding = 0).
    if (sale.status === LAYAWAY_STATUS) {
        return total;
    }
    const paidAtCreationBase = roundMoney(sale.payments
        // ON_ACCOUNT rows are credit, not collected tender.
        .filter((p) => p.method !== ACCOUNT_METHOD)
        .reduce((sum, p) => sum + p.amount.toNumber() * rate, 0), roundingMode);
    if (sale.paymentMethod && !onAccount) {
        return 0;
    }
    return Math.max(0, Math.round((total - paidAtCreationBase) * 100) / 100);
}
/**
 * Outstanding balance of a sale = credit portion minus recorded AR
 * collections.
 */
export function saleOutstandingBase(sale, collections, roundingMode = "HALF_UP") {
    const credit = saleCreditPortionBase(sale, roundingMode);
    const collected = collections.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    return Math.max(0, Math.round((credit - collected) * 100) / 100);
}
//# sourceMappingURL=ar-credit.js.map