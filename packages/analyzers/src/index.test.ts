import { describe, expect, it } from "vitest";
import { ebsVolume, scan, usage } from "./fixtures.ts";
import { analyzers, runAnalyzers } from "./index.ts";

describe("the public rule set", () => {
  it("gives every rule a provider.service.rule id and catalog text", () => {
    for (const analyzer of analyzers) {
      expect(analyzer.id).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9-]*){2}$/);
      expect(analyzer.title).not.toBe("");
      expect(analyzer.signal).toMatch(/\.$/);
      expect(analyzer.fix).toMatch(/\.$/);
    }
  });

  it("runs clean on an empty scan", () => {
    expect(runAnalyzers(analyzers, scan([]))).toEqual({ findings: [], errors: [] });
  });

  it("finds the planted waste end to end", () => {
    const result = runAnalyzers(
      analyzers,
      scan(
        [ebsVolume("vol-idle"), ebsVolume("vol-busy", { state: "in-use" })],
        [usage("vol-idle", 0.24), usage("vol-busy", 0.24)],
      ),
    );
    expect(result.errors).toEqual([]);
    expect(result.findings.map((f) => [f.analyzerId, f.resourceId, f.monthlySavingUsd])).toEqual([
      ["aws.ebs.unattached", "vol-idle", 7.3],
    ]);
  });
});
