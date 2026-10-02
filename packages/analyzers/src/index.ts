import type { Analyzer } from "./analyzer.ts";
import { ebsUnattached } from "./aws/ebs-unattached.ts";

export type { Analyzer, AnalyzerCategory, ScanInput } from "./analyzer.ts";
export { runAnalyzers, type AnalyzerError, type ScanResult } from "./run.ts";
export { runRate, type RunRate } from "./run-rate.ts";

/** Every public rule, in catalog order. */
export const analyzers: readonly Analyzer[] = [ebsUnattached];
