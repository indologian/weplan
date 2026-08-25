import { describe, expect, it } from "vitest";
import { invitationCreateOrSyncSchema } from "@/modules/invitation/schemas";

const baseInput = {
  clientRef: "7e66e3c1-595f-4fe3-940e-1085e717754f",
  themeId: "1762fcd3-b076-439a-bade-33743a51063f",
};

describe("invitation create-or-sync input", () => {
  it("accepts an incomplete draft event", () => {
    expect(invitationCreateOrSyncSchema.parse({
      ...baseInput,
      initialEventDraft: { title: "Akad" },
    }).initialEventDraft).toMatchObject({ title: "Akad", position: 0 });
  });

  it("rejects server-controlled fields", () => {
    expect(() => invitationCreateOrSyncSchema.parse({
      ...baseInput,
      slug: "client-controlled",
      status: "published",
      entitlementSnapshot: {},
    })).toThrow();
  });

  it("requires coordinates as a pair", () => {
    expect(() => invitationCreateOrSyncSchema.parse({
      ...baseInput,
      initialEventDraft: { latitude: -6.2 },
    })).toThrow();
  });
});
