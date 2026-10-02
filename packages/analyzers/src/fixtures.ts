import {
  costRecordSchema,
  resourceSchema,
  type CostRecord,
  type Resource,
} from "@costexplorer/core";
import type { ScanInput } from "./analyzer.ts";

/** The scan moment every fixture is measured against. */
export const AS_OF = "2026-09-30T00:00:00Z";

export function daysBefore(days: number, asOf = AS_OF): string {
  return new Date(Date.parse(asOf) - days * 86_400_000).toISOString();
}

/** One day of usage for a resource, ending at the scan moment unless a period is given. */
export function usage(resourceId: string, effectiveCost: number, overrides = {}): CostRecord {
  return costRecordSchema.parse({
    providerName: "AWS",
    billingAccountId: "111111111111",
    chargePeriodStart: daysBefore(1),
    chargePeriodEnd: AS_OF,
    chargeCategory: "Usage",
    billingCurrency: "USD",
    billedCost: effectiveCost,
    effectiveCost,
    serviceName: "Amazon Elastic Block Store",
    resourceId,
    ...overrides,
  });
}

export function ebsVolume(id: string, overrides = {}): Resource {
  return resourceSchema.parse({
    type: "aws.ebs.volume",
    id,
    account: "111111111111",
    region: "us-east-1",
    sizeGb: 100,
    volumeType: "gp3",
    state: "available",
    createdAt: daysBefore(200),
    ...overrides,
  });
}

export function scan(resources: Resource[], costRecords: CostRecord[] = []): ScanInput {
  return { asOf: AS_OF, resources, costRecords };
}
