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
    /**
     * Sale status — `"LAYAWAY"` routes the credit portion to the full total
     * (D-09); absent/null falls through to the default reconstruction.
     */
    status?: string | null;
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