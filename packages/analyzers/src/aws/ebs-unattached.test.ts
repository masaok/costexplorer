import { findingSchema } from "@costexplorer/core";
import { describe, expect, it } from "vitest";
import { daysBefore, ebsVolume, scan, usage } from "../fixtures.ts";
import { ebsUnattached } from "./ebs-unattached.ts";

const find = (...args: Parameters<typeof scan>) => ebsUnattached.analyze(scan(...args));

describe("aws.ebs.unattached", () => {
  it("reports a volume detached 21 days ago with what it costs a month", () => {
    const volume = ebsVolume("vol-idle", { unattachedSince: daysBefore(21) });
    const findings = find([volume], [usage("vol-idle", 0.24)]);

    expect(findings).toEqual([
      {
        analyzerId: "aws.ebs.unattached",
        resourceId: "vol-idle",
        account: "111111111111",
        region: "us-east-1",
        monthlySavingUsd: 7.3,
        confidence: "high",
        evidence: {
          sizeGb: 100,
          volumeType: "gp3",
          daysUnattached: 21,
          unattachedSinceKnown: true,
          chargedUsd: 0.24,
          chargedHours: 24,
          note: "A snapshot kept after the delete is billed separately and is not subtracted here.",
        },
        remediation: {
          cli: [
            'SNAPSHOT=$(aws ec2 create-snapshot --region us-east-1 --volume-id vol-idle --description "Final snapshot of vol-idle" --query SnapshotId --output text)',
            'aws ec2 wait snapshot-completed --region us-east-1 --snapshot-ids "$SNAPSHOT"',
            "aws ec2 delete-volume --region us-east-1 --volume-id vol-idle",
          ].join("\n"),
        },
      },
    ]);
    expect(findingSchema.safeParse(findings[0]).success).toBe(true);
  });

  it("rounds the saving down to the cent", () => {
    // 0.25 a day is 7.6041... a month.
    const findings = find([ebsVolume("vol-idle")], [usage("vol-idle", 0.25)]);
    expect(findings[0]?.monthlySavingUsd).toBe(7.6);
  });

  it("is only medium confidence when the detach time is unknown", () => {
    const findings = find([ebsVolume("vol-old")], [usage("vol-old", 0.24)]);
    expect(findings[0]).toMatchObject({
      confidence: "medium",
      evidence: { daysUnattached: 200, unattachedSinceKnown: false },
    });
  });

  it("reports no saving and low confidence when the export has no charge for the volume", () => {
    const findings = find([ebsVolume("vol-unbilled")], [usage("vol-other", 5)]);
    expect(findings[0]).toMatchObject({
      monthlySavingUsd: 0,
      confidence: "low",
      evidence: { chargedUsd: null, chargedHours: null },
    });
  });

  it("starts at 14 full days", () => {
    const at = (days: number) => ebsVolume(`vol-${days}`, { unattachedSince: daysBefore(days) });
    const findings = find([at(13.9), at(14), at(15)]);
    expect(findings.map((finding) => finding.resourceId)).toEqual(["vol-14", "vol-15"]);
  });

  it("leaves attached and transitional volumes alone", () => {
    const volumes = ["in-use", "creating", "deleting", "deleted", "error"].map((state) =>
      ebsVolume(`vol-${state}`, { state }),
    );
    expect(find(volumes)).toEqual([]);
  });

  it("uses the volume's own region in the commands", () => {
    const findings = find([ebsVolume("vol-eu", { region: "eu-west-1" })]);
    expect(findings[0]?.region).toBe("eu-west-1");
    expect(findings[0]?.remediation.cli).toContain("delete-volume --region eu-west-1");
  });
});
