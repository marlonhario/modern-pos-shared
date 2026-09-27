import { describe, expect, it } from "vitest";

import { computeBundleMargin } from "../src/bundle-margin.js";
import { roundMoney } from "../src/money.js";

/**
 * Unit tests for the single-sourced bundle margin formula (D-06, D-07).
 *
 * The expected figures below are written out by hand from the 12-CONTEXT.md
 * worked example rather than imported from the implementation, so the test is
 * an independent oracle. The one deliberate exception is the rounding-mode
 * case, whose whole point is to prove the function agrees with `roundMoney`.
 */

/** Starter Pack = 2× Coffee Beans (cost 40) + 1× Mug (cost 60) → cost 140. */
const STARTER_PACK_COMPONENTS = [
  { quantity: 2, unitCost: 40 },
  { quantity: 1, unitCost: 60 },
];
const STARTER_PACK_SET_PRICE = 250;

describe("computeBundleMargin", () => {
  it("computes the Starter Pack figures: cost 140, profit 110, margin 44%", () => {
    const figures = computeBundleMargin({
      setPrice: STARTER_PACK_SET_PRICE,
      components: STARTER_PACK_COMPONENTS,
    });

    expect(figures.componentCount).toBe(2);
    expect(figures.setPrice).toBe(250);
    expect(figures.componentCost).toBe(140);
    expect(figures.profit).toBe(110);
    expect(figures.marginPercent).toBe(44);
  });

  it("reports a zero margin, not NaN, for a set price of zero", () => {
    const figures = computeBundleMargin({
      setPrice: 0,
      components: STARTER_PACK_COMPONENTS,
    });

    expect(figures.setPrice).toBe(0);
    expect(figures.componentCost).toBe(140);
    expect(figures.profit).toBe(-140);
    expect(figures.marginPercent).toBe(0);
    expect(Number.isNaN(figures.marginPercent)).toBe(false);
    expect(Number.isFinite(figures.marginPercent)).toBe(true);
  });

  it("reports a zero margin for a negative set price rather than a negative percentage", () => {
    const figures = computeBundleMargin({
      setPrice: -10,
      components: [{ quantity: 1, unitCost: 5 }],
    });

    expect(figures.profit).toBe(-15);
    expect(figures.marginPercent).toBe(0);
  });

  it("reports a negative profit and a negative margin for a loss-making bundle", () => {
    const figures = computeBundleMargin({
      setPrice: 100,
      components: STARTER_PACK_COMPONENTS,
    });

    expect(figures.componentCost).toBe(140);
    expect(figures.profit).toBe(-40);
    expect(figures.marginPercent).toBe(-40);
  });

  it("handles a single-component bundle", () => {
    const figures = computeBundleMargin({
      setPrice: 50,
      components: [{ quantity: 1, unitCost: 25 }],
    });

    expect(figures.componentCount).toBe(1);
    expect(figures.componentCost).toBe(25);
    expect(figures.profit).toBe(25);
    expect(figures.marginPercent).toBe(50);
  });

  it("treats an empty composition as zero cost instead of throwing", () => {
    const figures = computeBundleMargin({ setPrice: 250, components: [] });

    expect(figures.componentCount).toBe(0);
    expect(figures.componentCost).toBe(0);
    expect(figures.profit).toBe(250);
    expect(figures.marginPercent).toBe(100);
  });

  it("rounds the margin percentage to one decimal place", () => {
    const figures = computeBundleMargin({
      setPrice: 3,
      components: [{ quantity: 1, unitCost: 2 }],
    });

    expect(figures.profit).toBe(1);
    // 1 / 3 = 33.333…% — exactly the display precision the four-figure
    // summary shows, not a two-decimal money figure.
    expect(figures.marginPercent).toBe(33.3);
  });

  it("defaults to the shared HALF_UP money rounding mode", () => {
    const input = {
      setPrice: 1,
      components: [{ quantity: 1, unitCost: 0.135 }],
    };

    expect(computeBundleMargin(input)).toEqual(
      computeBundleMargin(input, "HALF_UP"),
    );
  });

  it("agrees with roundMoney under HALF_EVEN and FLOOR", () => {
    // 0.135 lands exactly on a half cent, so the two modes must disagree.
    // That is what stops this case passing against an implementation that
    // ignores the requested mode.
    const rawCost = 0.135;
    const setPrice = 1;
    const components = [{ quantity: 1, unitCost: rawCost }];

    const halfEven = computeBundleMargin({ setPrice, components }, "HALF_EVEN");
    const floor = computeBundleMargin({ setPrice, components }, "FLOOR");

    // Oracle: the same raw value through the shared money helper.
    expect(halfEven.componentCost).toBe(roundMoney(rawCost, "HALF_EVEN"));
    expect(floor.componentCost).toBe(roundMoney(rawCost, "FLOOR"));
    expect(halfEven.profit).toBe(
      roundMoney(setPrice - roundMoney(rawCost, "HALF_EVEN"), "HALF_EVEN"),
    );
    expect(floor.profit).toBe(
      roundMoney(setPrice - roundMoney(rawCost, "FLOOR"), "FLOOR"),
    );

    expect(halfEven.componentCost).toBe(0.14);
    expect(floor.componentCost).toBe(0.13);
    expect(halfEven.componentCost).not.toBe(floor.componentCost);
    expect(halfEven.profit).not.toBe(floor.profit);
  });
});
