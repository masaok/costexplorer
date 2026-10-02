import { describe, expect, it } from "vitest";
import { floorToCents, HOURS_PER_MONTH, monthlyFromHourly, sumUsd } from "./money.ts";

describe("sumUsd", () => {
  it("adds sub-cent amounts without float drift", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(sumUsd([0.1, 0.2])).toBe(0.3);
    expect(sumUsd(Array.from({ length: 10_000 }, () => 0.0001))).toBe(1);
  });

  it("returns zero for no amounts and keeps credits negative", () => {
    expect(sumUsd([])).toBe(0);
    expect(sumUsd([10, -2.5])).toBe(7.5);
  });

  it("rejects a value that is not a dollar amount", () => {
    expect(() => sumUsd([1, Number.NaN])).toThrow(RangeError);
    expect(() => sumUsd([Number.POSITIVE_INFINITY])).toThrow("Not a dollar amount: Infinity");
  });
});

describe("monthlyFromHourly", () => {
  it("prices a month at 730 hours", () => {
    expect(HOURS_PER_MONTH).toBe(730);
    expect(monthlyFromHourly(0.005)).toBe(3.65);
    expect(monthlyFromHourly(0.045)).toBe(32.85);
  });
});

describe("floorToCents", () => {
  it("rounds a saving down, never up", () => {
    expect(floorToCents(12.349)).toBe(12.34);
    expect(floorToCents(12.999999)).toBe(12.99);
  });

  it("keeps an amount that is already whole cents", () => {
    // 0.29 * 100 is 28.999999999999996 in floating point.
    expect(floorToCents(0.29)).toBe(0.29);
    expect(floorToCents(8)).toBe(8);
  });
});
