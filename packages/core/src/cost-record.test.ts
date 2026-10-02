import { describe, expect, it } from "vitest";
import { costRecordSchema } from "./cost-record.ts";

const usage = {
  providerName: "AWS",
  billingAccountId: "111111111111",
  chargePeriodStart: "2026-09-01T00:00:00Z",
  chargePeriodEnd: "2026-09-01T01:00:00Z",
  chargeCategory: "Usage",
  billingCurrency: "USD",
  billedCost: 0.011,
  effectiveCost: 0.011,
  serviceName: "Amazon Elastic Block Store",
};

const issuePaths = (input: unknown) =>
  costRecordSchema.safeParse(input).error?.issues.map((issue) => issue.path.join(".")) ?? [];

describe("costRecordSchema", () => {
  it("accepts the required FOCUS columns and defaults tags to none", () => {
    expect(costRecordSchema.parse(usage)).toEqual({ ...usage, tags: {} });
  });

  it("accepts the optional columns", () => {
    const full = {
      ...usage,
      subAccountId: "222222222222",
      chargeDescription: "$0.08 per GB-month of gp3 storage",
      listCost: 0.011,
      serviceCategory: "Storage",
      regionId: "us-east-1",
      resourceId: "vol-0abc",
      resourceType: "Volume",
      skuId: "ABC123",
      pricingCategory: "Standard",
      consumedQuantity: 0.1389,
      consumedUnit: "GB-Mo",
      commitmentDiscountId: "sp-1",
      tags: { team: "data" },
    };
    expect(costRecordSchema.parse(full)).toEqual(full);
  });

  it("accepts a negative cost, which is how a credit arrives", () => {
    const credit = { ...usage, chargeCategory: "Credit", billedCost: -5, effectiveCost: -5 };
    expect(costRecordSchema.parse(credit).billedCost).toBe(-5);
  });

  it("names the column that is wrong", () => {
    expect(issuePaths({ ...usage, chargeCategory: "Refund" })).toEqual(["chargeCategory"]);
    expect(issuePaths({ ...usage, billingCurrency: "usd" })).toEqual(["billingCurrency"]);
    expect(issuePaths({ ...usage, billedCost: Number.NaN })).toEqual(["billedCost"]);
    expect(issuePaths({ ...usage, chargePeriodStart: "2026-09-01" })).toEqual([
      "chargePeriodStart",
    ]);
    expect(issuePaths({ ...usage, serviceName: "" })).toEqual(["serviceName"]);
  });

  it("rejects a charge period that does not move forward", () => {
    expect(issuePaths({ ...usage, chargePeriodEnd: usage.chargePeriodStart })).toEqual([
      "chargePeriodEnd",
    ]);
  });
});
