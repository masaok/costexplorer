import { z } from "zod";

const name = z.string().min(1);
const instant = z.iso.datetime({ offset: true });

/**
 * A resource as the provider's inventory API describes it, at the moment of the scan. Cost
 * records say what was charged, and resources say what exists and what state it is in. An
 * analyzer usually needs both.
 */
export const ebsVolumeSchema = z.object({
  type: z.literal("aws.ebs.volume"),
  /** The id as it appears in `CostRecord.resourceId`, such as `vol-0abc`. */
  id: name,
  account: name,
  region: name,
  sizeGb: z.number().positive(),
  volumeType: name,
  state: z.enum(["creating", "available", "in-use", "deleting", "deleted", "error"]),
  createdAt: instant,
  /** When the last attachment ended. The inventory API does not report it, so it is often absent. */
  unattachedSince: instant.optional(),
  tags: z.record(z.string(), z.string()).default({}),
});
export type EbsVolume = z.infer<typeof ebsVolumeSchema>;

/** Every resource type an analyzer reads. Add a member here with the first rule that needs it. */
export const resourceSchema = z.discriminatedUnion("type", [ebsVolumeSchema]);
export type Resource = z.infer<typeof resourceSchema>;
