import { describe, expect, it } from "vitest";
import { findingSchema, rankFindings, totalMonthlySavingUsd, type Finding } from "./finding.ts";

const finding = (overrides: Partial<Finding> = {}): Finding => ({
  analyzerId: "aws.ebs.unattached",
  resourceId: "vol-0abc",
  account: "111111111111",
  region: "us-east-1",
  monthlySavingUsd: 8,
  confidence: "high",
  evidence: { sizeGb: 100, daysUnattached: 21 },
  remediation: { cli: "aws ec2 delete-volume --volume-id vol-0abc" },
  ...overrides,
});

const issuePaths = (input: unknown) =>
  findingSchema.safeParse(input).error?.issues.map((issue) => issue.path.join(".")) ?? [];

describe("findingSchema", () => {
  it("accepts a finding and returns it unchanged", () => {
    expect(findingSchema.parse(finding())).toEqual(finding());
  });

  it("accepts a finding with no remediation snippet", () => {
    expect(findingSchema.parse(finding({ remediation: {} })).remediation).toEqual({});
  });

  it("rejects a saving that is negative or not a number", () => {
    expect(issuePaths(finding({ monthlySavingUsd: -1 }))).toEqual(["monthlySavingUsd"]);
    expect(issuePaths(finding({ monthlySavingUsd: Number.NaN }))).toEqual(["monthlySavingUsd"]);
  });

  it("rejects an analyzer id that is not provider.service.rule", () => {
    expect(issuePaths(finding({ analyzerId: "unattached" }))).toEqual(["analyzerId"]);
    expect(issuePaths(finding({ analyzerId: "AWS.EBS.Unattached" }))).toEqual(["analyzerId"]);
  });

  it("rejects an unknown confidence and an empty resource", () => {
    expect(issuePaths({ ...finding(), confidence: "certain" })).toEqual(["confidence"]);
    expect(issuePaths(finding({ resourceId: "" }))).toEqual(["resourceId"]);
  });
});

describe("rankFindings", () => {
  it("puts the largest saving first and leaves the input alone", () => {
    const input = [
      finding({ resourceId: "small", monthlySavingUsd: 3 }),
      finding({ resourceId: "large", monthlySavingUsd: 400 }),
      finding({ resourceId: "medium", monthlySavingUsd: 32.85 }),
    ];
    expect(rankFindings(input).map((f) => f.resourceId)).toEqual(["large", "medium", "small"]);
    expect(input.map((f) => f.resourceId)).toEqual(["small", "large", "medium"]);
  });

  it("breaks a tie by analyzer, then by resource", () => {
    const input = [
      finding({ analyzerId: "aws.ec2.eip-unused", resourceId: "b" }),
      finding({ analyzerId: "aws.ebs.unattached", resourceId: "b" }),
      finding({ analyzerId: "aws.ebs.unattached", resourceId: "a" }),
      finding({ analyzerId: "aws.ebs.unattached", resourceId: "a" }),
    ];
    expect(rankFindings(input).map((f) => `${f.analyzerId} ${f.resourceId}`)).toEqual([
      "aws.ebs.unattached a",
      "aws.ebs.unattached a",
      "aws.ebs.unattached b",
      "aws.ec2.eip-unused b",
    ]);
    expect(rankFindings(input.toReversed())).toEqual(rankFindings(input));
  });
});

describe("totalMonthlySavingUsd", () => {
  it("adds the savings without float drift", () => {
    const input = [finding({ monthlySavingUsd: 0.1 }), finding({ monthlySavingUsd: 0.2 })];
    expect(totalMonthlySavingUsd(input)).toBe(0.3);
    expect(totalMonthlySavingUsd([])).toBe(0);
  });
});
