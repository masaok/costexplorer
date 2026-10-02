import type { Finding } from "@costexplorer/core";
import { describe, expect, it } from "vitest";
import type { Analyzer } from "./analyzer.ts";
import { scan } from "./fixtures.ts";
import { runAnalyzers } from "./run.ts";

const finding = (analyzerId: string, monthlySavingUsd: number): Finding => ({
  analyzerId,
  resourceId: "res-1",
  account: "111111111111",
  region: "us-east-1",
  monthlySavingUsd,
  confidence: "high",
  evidence: {},
  remediation: {},
});

const rule = (id: string, analyze: Analyzer["analyze"]): Analyzer => ({
  id,
  title: id,
  category: "idle",
  tier: "free",
  signal: "A test rule.",
  fix: "Nothing.",
  analyze,
});

describe("runAnalyzers", () => {
  it("merges the findings of every rule, largest saving first", () => {
    const result = runAnalyzers(
      [
        rule("aws.test.small", () => [finding("aws.test.small", 3)]),
        rule("aws.test.large", () => [finding("aws.test.large", 400)]),
      ],
      scan([]),
    );
    expect(result.errors).toEqual([]);
    expect(result.findings.map((f) => f.analyzerId)).toEqual(["aws.test.large", "aws.test.small"]);
  });

  it("passes the same input to every rule", () => {
    const input = scan([]);
    const seen: unknown[] = [];
    const spy = (id: string) => rule(id, (given) => (seen.push(given), []));
    runAnalyzers([spy("aws.test.a"), spy("aws.test.b")], input);
    expect(seen).toEqual([input, input]);
  });

  it("reports a rule that throws and keeps the findings of the others", () => {
    const result = runAnalyzers(
      [
        rule("aws.test.broken", () => {
          throw new Error("no inventory");
        }),
        rule("aws.test.throws-text", () => {
          throw "plain text";
        }),
        rule("aws.test.fine", () => [finding("aws.test.fine", 5)]),
      ],
      scan([]),
    );
    expect(result.errors).toEqual([
      { analyzerId: "aws.test.broken", message: "no inventory" },
      { analyzerId: "aws.test.throws-text", message: "plain text" },
    ]);
    expect(result.findings.map((f) => f.analyzerId)).toEqual(["aws.test.fine"]);
  });

  it("drops every finding of a rule that reports a malformed one", () => {
    const result = runAnalyzers(
      [rule("aws.test.bad", () => [finding("aws.test.bad", 5), finding("aws.test.bad", -1)])],
      scan([]),
    );
    expect(result.findings).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain("monthlySavingUsd");
  });

  it("rejects a finding reported under another rule's id", () => {
    const result = runAnalyzers(
      [rule("aws.test.mine", () => [finding("aws.test.theirs", 5)])],
      scan([]),
    );
    expect(result.errors).toEqual([
      { analyzerId: "aws.test.mine", message: "reported a finding as `aws.test.theirs`" },
    ]);
  });

  it("refuses two rules with the same id", () => {
    const twice = [rule("aws.test.dup", () => []), rule("aws.test.dup", () => [])];
    expect(() => runAnalyzers(twice, scan([]))).toThrow(
      "Two analyzers share the id `aws.test.dup`",
    );
  });
});
