export type DecimalLike = {
    toNumber(): number;
};
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
export declare function saleCreditPortionBase(sale: SaleCreditInfo, roundingMode?: ArRoundingMode): number;
/**
 * Outstanding balance of a sale = credit portion minus recorded AR
 * collections.
 */
export declare function saleOutstandingBase(sale: SaleCreditInfo, collections: {
    amount: DecimalLike;
}[], roundingMode?: ArRoundingMode): number;
//# sourceMappingURL=ar-credit.d.ts.map