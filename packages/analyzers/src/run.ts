import { findingSchema, rankFindings, type Finding } from "@costexplorer/core";
import type { Analyzer, ScanInput } from "./analyzer.ts";

export type AnalyzerError = { analyzerId: string; message: string };

export type ScanResult = {
  /** Every valid finding, largest saving first. */
  findings: Finding[];
  /** One entry per rule that threw or reported a malformed finding. Its findings are dropped. */
  errors: AnalyzerError[];
};

function findingsOf(analyzer: Analyzer, input: ScanInput): Finding[] {
  return analyzer.analyze(input).map((reported) => {
    const finding = findingSchema.parse(reported);
    if (finding.analyzerId !== analyzer.id) {
      throw new Error(`reported a finding as \`${finding.analyzerId}\``);
    }
    return finding;
  });
}

/**
 * Runs every rule over the same input. A rule that fails is reported and skipped, so one bad
 * rule does not cost the reader the findings of the others.
 */
export function runAnalyzers(analyzers: readonly Analyzer[], input: ScanInput): ScanResult {
  const ids = analyzers.map((analyzer) => analyzer.id);
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate) throw new Error(`Two analyzers share the id \`${duplicate}\``);

  const findings: Finding[] = [];
  const errors: AnalyzerError[] = [];
  for (const analyzer of analyzers) {
    try {
      findings.push(...findingsOf(analyzer, input));
    } catch (error) {
      errors.push({
        analyzerId: analyzer.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { findings: rankFindings(findings), errors };
}
