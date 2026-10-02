import { describe, expect, it } from "vitest";
import { daysBefore, usage } from "./fixtures.ts";
import { runRate } from "./run-rate.ts";

describe("runRate", () => {
  it("scales what a resource was charged to a 730-hour month", () => {
    expect(runRate([usage("vol-1", 0.24)], "vol-1")).toEqual({
      monthlyUsd: 7.3,
      chargedUsd: 0.24,
      hours: 24,
    });
  });

  it("counts an hour once when several line items cover it", () => {
    const records = [usage("vol-1", 0.24), usage("vol-1", 0.12, { skuId: "iops" })];
    expect(runRate(records, "vol-1")).toMatchObject({ chargedUsd: 0.36, hours: 24 });
  });

  it("spans from the first charge to the last", () => {
    const records = [
      usage("vol-1", 0.24, { chargePeriodStart: daysBefore(3), chargePeriodEnd: daysBefore(2) }),
      usage("vol-1", 0.24),
    ];
    expect(runRate(records, "vol-1")).toMatchObject({ chargedUsd: 0.48, hours: 72 });
  });

  it("ignores other resources and charges that are not usage", () => {
    const records = [
      usage("vol-1", 0.24),
      usage("vol-2", 99),
      usage("vol-1", -0.2, { chargeCategory: "Credit" }),
      usage("vol-1", 0.02, { chargeCategory: "Tax" }),
    ];
    expect(runRate(records, "vol-1")?.chargedUsd).toBe(0.24);
  });

  it("returns null when the export has no usage charge for the resource", () => {
    expect(runRate([usage("vol-2", 1)], "vol-1")).toBeNull();
    expect(runRate([usage("vol-1", -1, { chargeCategory: "Credit" })], "vol-1")).toBeNull();
  });
});
