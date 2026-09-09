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
 * Amounts are in the business base currency.
 *
 * These are pure functions: callers resolve Prisma Decimal columns to
 * `DecimalLike` (`toNumber()`) before passing them in. The backend
 * `ar.utils.ts` re-exports these under the same names; the aging helpers stay
 * backend-local.
 */
import { roundMoney } from "./money.js";

export type DecimalLike = { toNumber(): number };

/** Rounding modes mirror the shared money module (see money.ts). */
export type ArRoundingMode = "HALF_UP" | "HALF_EVEN" | "FLOOR" | "CEIL";

export interface SalePaymentInfo {
  amount: DecimalLike;
  /** `"ON_ACCOUNT"` marks an unpaid-at-creation credit tender (D-12). */
  method?: string | null;
}

export interface SaleCreditInfo {
  paymentMethod: string | null;
  baseTotalAmount: DecimalLike;
  fxRate: DecimalLike;
  payments: SalePaymentInfo[];
}

const ACCOUNT_METHOD = "ON_ACCOUNT";

export function saleCreditPortionBase(
  sale: SaleCreditInfo,
  roundingMode: ArRoundingMode = "HALF_UP",
): number {
  const total = sale.baseTotalAmount.toNumber();
  const rate = sale.fxRate.toNumber();

  const onAccount =
    sale.paymentMethod === ACCOUNT_METHOD ||
    sale.payments.some((p) => p.method === ACCOUNT_METHOD);

  const paidAtCreationBase = roundMoney(
    sale.payments
      // ON_ACCOUNT rows are credit, not collected tender.
      .filter((p) => p.method !== ACCOUNT_METHOD)
      .reduce((sum, p) => sum + p.amount.toNumber() * rate, 0),
    roundingMode,
  );

  if (sale.paymentMethod && !onAccount) {
    return 0;
  }

  return Math.max(0, Math.round((total - paidAtCreationBase) * 100) / 100);
}

/**
 * Outstanding balance of a sale = credit portion minus recorded AR
 * collections.
 */
export function saleOutstandingBase(
  sale: SaleCreditInfo,
  collections: { amount: DecimalLike }[],
  roundingMode: ArRoundingMode = "HALF_UP",
): number {
  const credit = saleCreditPortionBase(sale, roundingMode);

  const collected = collections.reduce(
    (sum, p) => sum + p.amount.toNumber(),
    0,
  );

  return Math.max(0, Math.round((credit - collected) * 100) / 100);
}