import { describe, expect, it } from "vitest";
import {
  editorContentAutosaveSchema,
  editorEventReorderSchema,
  editorEventSaveSchema,
  editorUpdatePrivacySchema,
} from "@/modules/invitation/schemas";

const invitationId = "7e66e3c1-595f-4fe3-940e-1085e717754f";

describe("canonical editor input", () => {
  it("accepts canonical JSONB keys and incomplete draft content", () => {
    const result = editorContentAutosaveSchema.parse({
      invitationId,
      expectedVersion: 1,
      loveStory: [{
        id: "1762fcd3-b076-439a-bade-33743a51063f",
        date: "Agustus 2026",
        body: "Pertama bertemu.",
      }],
      bankAccounts: [{
        id: "2fce4f09-b277-426d-b049-368712697097",
        bankName: "",
        accountNumber: "",
        accountHolder: "",
      }],
      settings: {
        openingText: "Bismillah",
        sectionVisibility: { gallery: false },
      },
    });

    expect(result.loveStory?.[0]).toHaveProperty("body", "Pertama bertemu.");
  });

  it("rejects renderer-invented legacy aliases", () => {
    expect(() => editorContentAutosaveSchema.parse({
      invitationId,
      expectedVersion: 1,
      loveStory: [{ id: "1762fcd3-b076-439a-bade-33743a51063f", dateText: "2026" }],
      settings: { musicUrl: "https://example.test/audio.mp3", hideGallery: true },
    })).toThrow();
  });

  it("validates IANA timezone and matching ISO offset", () => {
    expect(editorEventSaveSchema.safeParse({
      invitationId,
      expectedVersion: 1,
      data: {
        title: "Akad",
        startsAt: "2026-08-26T09:00:00+07:00",
        timezone: "Asia/Jakarta",
      },
    }).success).toBe(true);

    expect(editorEventSaveSchema.safeParse({
      invitationId,
      expectedVersion: 1,
      data: {
        startsAt: "2026-08-26T09:00:00Z",
        timezone: "Asia/Jakarta",
      },
    }).success).toBe(false);
  });

  it("rejects duplicate reorder identities before reaching SQL", () => {
    const eventId = "1762fcd3-b076-439a-bade-33743a51063f";
    expect(editorEventReorderSchema.safeParse({
      invitationId,
      expectedVersion: 1,
      eventIds: [eventId, eventId],
    }).success).toBe(false);
  });
});

describe("private invitation PIN policy", () => {
  it.each(["1234", "12345", "12345678901", "abcdef"])("rejects invalid PIN %s", (pin) => {
    expect(editorUpdatePrivacySchema.safeParse({ invitationId, expectedVersion: 1, isPrivate: true, pin }).success)
      .toBe(false);
  });

  it.each(["000000", "123456", "654321", "121212", "112233"])("rejects weak PIN %s", (pin) => {
    expect(editorUpdatePrivacySchema.safeParse({ invitationId, expectedVersion: 1, isPrivate: true, pin }).success)
      .toBe(false);
  });

  it("allows reuse intent without sending a PIN and accepts a strong new PIN", () => {
    expect(editorUpdatePrivacySchema.safeParse({ invitationId, expectedVersion: 1, isPrivate: true }).success)
      .toBe(true);
    expect(editorUpdatePrivacySchema.safeParse({ invitationId, expectedVersion: 1, isPrivate: true, pin: "839204" }).success)
      .toBe(true);
  });

  it("allows PIN rotation while the invitation remains public", () => {
    expect(editorUpdatePrivacySchema.safeParse({
      invitationId,
      expectedVersion: 1,
      isPrivate: false,
      pin: "839204",
    }).success).toBe(true);
  });
});
