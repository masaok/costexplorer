import type { CostRecord, Finding, Resource } from "@costexplorer/core";

/** Everything a scan knows. Adapters build it, and every analyzer reads the same one. */
export type ScanInput = {
  /** The moment the inventory was taken, ISO 8601. Rules measure age against this, not the clock. */
  asOf: string;
  costRecords: readonly CostRecord[];
  resources: readonly Resource[];
};

export type AnalyzerCategory = "idle" | "stale" | "rightsizing" | "pricing" | "network" | "anomaly";

/**
 * One waste rule. The metadata feeds the rule catalog, and `analyze` is a pure function of the
 * scan input, so a rule can be tested with a fixture and run anywhere.
 */
export type Analyzer = {
  /** Provider, service and rule, such as `aws.ebs.unattached`. Every finding carries it. */
  id: string;
  title: string;
  category: AnalyzerCategory;
  tier: "free" | "pro";
  /** What the rule looks for, in one sentence. */
  signal: string;
  /** What the finding tells the reader to do, in one sentence. */
  fix: string;
  analyze(input: ScanInput): Finding[];
};
