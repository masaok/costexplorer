import { describe, expect, it } from "vitest";
import { resourceSchema } from "./resource.ts";

const volume = {
  type: "aws.ebs.volume",
  id: "vol-0abc",
  account: "111111111111",
  region: "us-east-1",
  sizeGb: 100,
  volumeType: "gp3",
  state: "available",
  createdAt: "2026-06-01T00:00:00Z",
};

describe("resourceSchema", () => {
  it("accepts an EBS volume and defaults tags to none", () => {
    expect(resourceSchema.parse(volume)).toEqual({ ...volume, tags: {} });
  });

  it("rejects a resource type no analyzer reads", () => {
    expect(resourceSchema.safeParse({ ...volume, type: "aws.ec2.instance" }).success).toBe(false);
  });

  it("rejects a volume with no size or an unknown state", () => {
    expect(resourceSchema.safeParse({ ...volume, sizeGb: 0 }).success).toBe(false);
    expect(resourceSchema.safeParse({ ...volume, state: "detached" }).success).toBe(false);
  });
});
