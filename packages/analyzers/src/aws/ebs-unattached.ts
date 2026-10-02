import { floorToCents, type Finding } from "@costexplorer/core";
import type { Analyzer } from "../analyzer.ts";
import { runRate } from "../run-rate.ts";

const ID = "aws.ebs.unattached";
const MS_PER_DAY = 86_400_000;
const MIN_DAYS_UNATTACHED = 14;

export const ebsUnattached: Analyzer = {
  id: ID,
  title: "Unattached EBS volumes",
  category: "idle",
  tier: "free",
  signal: `An EBS volume has been attached to no instance for ${MIN_DAYS_UNATTACHED} days or more.`,
  fix: "Snapshot the volume if the data matters, then delete it.",

  analyze({ asOf, costRecords, resources }) {
    const findings: Finding[] = [];
    for (const volume of resources) {
      if (volume.type !== "aws.ebs.volume" || volume.state !== "available") continue;

      // The inventory API does not say when a volume was detached. Without that, the creation
      // time is the only bound, and the volume may have been in use until yesterday.
      const since = volume.unattachedSince ?? volume.createdAt;
      const daysUnattached = Math.floor((Date.parse(asOf) - Date.parse(since)) / MS_PER_DAY);
      if (daysUnattached < MIN_DAYS_UNATTACHED) continue;

      const rate = runRate(costRecords, volume.id);
      const at = `--region ${volume.region}`;
      findings.push({
        analyzerId: ID,
        resourceId: volume.id,
        account: volume.account,
        region: volume.region,
        monthlySavingUsd: rate ? floorToCents(rate.monthlyUsd) : 0,
        confidence: !rate ? "low" : volume.unattachedSince ? "high" : "medium",
        evidence: {
          sizeGb: volume.sizeGb,
          volumeType: volume.volumeType,
          daysUnattached,
          unattachedSinceKnown: volume.unattachedSince !== undefined,
          chargedUsd: rate?.chargedUsd ?? null,
          chargedHours: rate?.hours ?? null,
          note: "A snapshot kept after the delete is billed separately and is not subtracted here.",
        },
        remediation: {
          cli: [
            `SNAPSHOT=$(aws ec2 create-snapshot ${at} --volume-id ${volume.id} --description "Final snapshot of ${volume.id}" --query SnapshotId --output text)`,
            `aws ec2 wait snapshot-completed ${at} --snapshot-ids "$SNAPSHOT"`,
            `aws ec2 delete-volume ${at} --volume-id ${volume.id}`,
          ].join("\n"),
        },
      });
    }
    return findings;
  },
};
