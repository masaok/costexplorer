import { HOURS_PER_MONTH, sumUsd, type CostRecord } from "@costexplorer/core";

const MS_PER_HOUR = 3_600_000;

export type RunRate = {
  /** What the resource costs per 730-hour month at the rate it was charged in the export. */
  monthlyUsd: number;
  /** The usage charges the rate was computed from. */
  chargedUsd: number;
  /** The hours between the first and the last charge. */
  hours: number;
};

/**
 * The monthly cost of one resource, from what it was actually charged. Uses the amortized cost
 * of usage lines only, so a tax, a credit or a one-off purchase does not move the rate.
 * Returns `null` when the export has no usage charge for the resource.
 */
export function runRate(records: readonly CostRecord[], resourceId: string): RunRate | null {
  const usage = records.filter(
    (record) => record.resourceId === resourceId && record.chargeCategory === "Usage",
  );
  if (usage.length === 0) return null;

  const start = Math.min(...usage.map((record) => Date.parse(record.chargePeriodStart)));
  const end = Math.max(...usage.map((record) => Date.parse(record.chargePeriodEnd)));
  const hours = (end - start) / MS_PER_HOUR;
  const chargedUsd = sumUsd(usage.map((record) => record.effectiveCost));
  return { monthlyUsd: (chargedUsd / hours) * HOURS_PER_MONTH, chargedUsd, hours };
}
