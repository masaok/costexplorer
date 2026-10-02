import { z } from "zod";
import { sumUsd } from "./money.ts";

export const confidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidenceSchema>;

/**
 * What an analyzer reports: one resource, what it wastes each month and how to stop. This is the
 * public contract between the engine and everything that shows findings.
 */
export const findingSchema = z.object({
  /** Provider, service and rule, such as `aws.ebs.unattached`. */
  analyzerId: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9-]*)+$/),
  resourceId: z.string().min(1),
  account: z.string().min(1),
  region: z.string().min(1),
  /** A conservative estimate. When unsure, an analyzer reports the lower figure. */
  monthlySavingUsd: z.number().finite().nonnegative(),
  confidence: confidenceSchema,
  /** The facts the estimate rests on, so a reader can check the math. */
  evidence: z.record(z.string(), z.unknown()),
  remediation: z.object({
    cli: z.string().min(1).optional(),
    terraform: z.string().min(1).optional(),
    console: z.string().min(1).optional(),
  }),
});

export type Finding = z.infer<typeof findingSchema>;

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Largest saving first. Ties fall back to analyzer and resource so the same input always gives
 * the same order.
 */
export function rankFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) =>
      b.monthlySavingUsd - a.monthlySavingUsd ||
      byText(a.analyzerId, b.analyzerId) ||
      byText(a.resourceId, b.resourceId),
  );
}

export function totalMonthlySavingUsd(findings: readonly Finding[]): number {
  return sumUsd(findings.map((finding) => finding.monthlySavingUsd));
}
