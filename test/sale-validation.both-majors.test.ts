import { describe, expect, it, beforeAll } from "vitest";
import {
  saleDiscountSchema,
  taxAmountSchema,
  discountTypeSchema,
  discountAmountSchema,
  PRICE_MAX,
} from "../src/sale-validation.js";

/* eslint-disable @typescript-eslint/no-require-imports */
// zod v3 aliases — safeParse is on schema instances only (no static z.safeParse)
const zod3Schema = saleDiscountSchema;
const zod4Module: any = await import("zod4").then(
  (m) => (m as any).default ?? m,
);
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Dual-major round-trip test: the same shared schemas validate identically
 * under both zod v3.23.8 and zod v4.4.3.
 *
 * The schemas are built with whichever zod version the test resolver picks
 * (the "zod" devDep). We validate with the schema instance's .safeParse()
 * (works in both majors) AND with zod4's static z.safeParse() to prove the
 * schema travels across the major boundary (D-09/D-17/D-18).
 *
 * Cross-major-safe API subset exercised:
 * - z.number().min().max()
 * - z.enum()
 * - z.object()
 * - superRefine with ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...] })
 */

/** Validate using the schema's own .safeParse (works in both zod v3 and v4) */
function validate(schema: any, input: unknown) {
  return schema.safeParse(input);
}

/** Validate using zod4's static z.safeParse(schema, input) */
function validateZod4(schema: any, input: unknown) {
  return zod4Module.safeParse(schema, input);
}

interface DiscountFixture {
  name: string;
  input: unknown;
  expectSuccess: boolean;
}

const DISCOUNT_FIXTURES: DiscountFixture[] = [
  {
    name: "valid FIXED discount",
    input: { discountType: "FIXED", discountAmount: 50 },
    expectSuccess: true,
  },
  {
    name: "valid PERCENTAGE discount (within 0-100)",
    input: { discountType: "PERCENTAGE", discountAmount: 15 },
    expectSuccess: true,
  },
  {
    name: "valid PERCENTAGE discount at boundary 0",
    input: { discountType: "PERCENTAGE", discountAmount: 0 },
    expectSuccess: true,
  },
  {
    name: "valid PERCENTAGE discount at boundary 100",
    input: { discountType: "PERCENTAGE", discountAmount: 100 },
    expectSuccess: true,
  },
  {
    name: "PERCENTAGE > 100 rejected",
    input: { discountType: "PERCENTAGE", discountAmount: 101 },
    expectSuccess: false,
  },
  {
    name: "negative discountAmount rejected",
    input: { discountType: "FIXED", discountAmount: -1 },
    expectSuccess: false,
  },
  {
    name: "discountAmount > PRICE_MAX rejected",
    input: { discountType: "FIXED", discountAmount: PRICE_MAX + 1 },
    expectSuccess: false,
  },
  {
    name: "missing discountType rejected",
    input: { discountAmount: 50 },
    expectSuccess: false,
  },
  {
    name: "invalid discountType rejected",
    input: { discountType: "BOGO", discountAmount: 50 },
    expectSuccess: false,
  },
];

interface TaxFixture {
  name: string;
  input: unknown;
  expectSuccess: boolean;
}

const TAX_FIXTURES: TaxFixture[] = [
  { name: "valid taxAmount (zero)", input: 0, expectSuccess: true },
  { name: "valid taxAmount (positive)", input: 12.5, expectSuccess: true },
  { name: "negative taxAmount rejected", input: -5, expectSuccess: false },
  { name: "non-number taxAmount rejected", input: "abc", expectSuccess: false },
];

interface DiscountTypeFixture {
  name: string;
  input: unknown;
  expectSuccess: boolean;
}

const DISCOUNT_TYPE_FIXTURES: DiscountTypeFixture[] = [
  { name: "FIXED is valid", input: "FIXED", expectSuccess: true },
  { name: "PERCENTAGE is valid", input: "PERCENTAGE", expectSuccess: true },
  {
    name: "invalid type rejected",
    input: "BUY_ONE_GET_ONE",
    expectSuccess: false,
  },
];

describe("shared sale-validation dual-major parity", () => {
  describe("saleDiscountSchema", () => {
    for (const fixture of DISCOUNT_FIXTURES) {
      it(`${fixture.name} — schema instance safeParse`, () => {
        const result = validate(saleDiscountSchema, fixture.input);
        expect(result.success).toBe(fixture.expectSuccess);
      });

      it(`${fixture.name} — zod4 static safeParse`, () => {
        const result = validateZod4(saleDiscountSchema, fixture.input);
        expect(result.success).toBe(fixture.expectSuccess);
      });
    }

    it("schema instance and zod4 static produce identical outcomes for all discount fixtures", () => {
      for (const fixture of DISCOUNT_FIXTURES) {
        const rInst = validate(saleDiscountSchema, fixture.input);
        const rStatic = validateZod4(saleDiscountSchema, fixture.input);
        expect(rInst.success).toBe(rStatic.success);
        if (!rInst.success && !rStatic.success) {
          expect(rInst.error.issues.length).toBe(rStatic.error.issues.length);
        }
      }
    });
  });

  describe("taxAmountSchema", () => {
    for (const fixture of TAX_FIXTURES) {
      it(`${fixture.name} — schema instance safeParse`, () => {
        const result = validate(taxAmountSchema, fixture.input);
        expect(result.success).toBe(fixture.expectSuccess);
      });

      it(`${fixture.name} — zod4 static safeParse`, () => {
        const result = validateZod4(taxAmountSchema, fixture.input);
        expect(result.success).toBe(fixture.expectSuccess);
      });
    }

    it("schema instance and zod4 static produce identical outcomes for all tax fixtures", () => {
      for (const fixture of TAX_FIXTURES) {
        const rInst = validate(taxAmountSchema, fixture.input);
        const rStatic = validateZod4(taxAmountSchema, fixture.input);
        expect(rInst.success).toBe(rStatic.success);
      }
    });
  });

  describe("discountTypeSchema", () => {
    for (const fixture of DISCOUNT_TYPE_FIXTURES) {
      it(`${fixture.name} — schema instance safeParse`, () => {
        const result = validate(discountTypeSchema, fixture.input);
        expect(result.success).toBe(fixture.expectSuccess);
      });

      it(`${fixture.name} — zod4 static safeParse`, () => {
        const result = validateZod4(discountTypeSchema, fixture.input);
        expect(result.success).toBe(fixture.expectSuccess);
      });
    }
  });

  describe("discountAmountSchema", () => {
    it("accepts zero", () => {
      expect(validate(discountAmountSchema, 0).success).toBe(true);
      expect(validateZod4(discountAmountSchema, 0).success).toBe(true);
    });

    it("accepts PRICE_MAX", () => {
      expect(validate(discountAmountSchema, PRICE_MAX).success).toBe(true);
      expect(validateZod4(discountAmountSchema, PRICE_MAX).success).toBe(true);
    });

    it("rejects negative", () => {
      expect(validate(discountAmountSchema, -1).success).toBe(false);
      expect(validateZod4(discountAmountSchema, -1).success).toBe(false);
    });

    it("rejects above PRICE_MAX", () => {
      expect(validate(discountAmountSchema, PRICE_MAX + 1).success).toBe(
        false,
      );
      expect(validateZod4(discountAmountSchema, PRICE_MAX + 1).success).toBe(
        false,
      );
    });
  });
});
