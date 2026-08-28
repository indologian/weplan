import { describe, expect, it } from "vitest";
import { evaluatePublishReadinessSnapshot } from "@/modules/invitation/publish-readiness";

const readySnapshot = {
  couple: { groom: { name: "A" }, bride: { name: "B" } },
  events: [{ title: "Akad", startsAt: "2026-08-26T02:00:00Z", timezone: "Asia/Jakarta" }],
  theme: { isActive: true, rendererKey: "fixture", rendererConfigValid: true },
  knownRendererKeys: new Set(["fixture"]),
  usage: { galleryItems: 0, bankAccounts: 1, videoEmbeds: 0, backgroundAudio: false },
  allowance: { galleryItems: 0, bankAccounts: 1, videoEmbeds: 0, audioEnabled: false },
  referencedMediaIds: [],
  readyMediaIds: new Set<string>(),
  isPrivate: false,
  hasPinCredential: false,
};

describe("publish readiness SSoT", () => {
  it("accepts the minimum canonical readiness baseline", () => {
    expect(evaluatePublishReadinessSnapshot(readySnapshot)).toEqual({ isReady: true, issues: [] });
  });

  it("returns typed issues for incomplete or unavailable resources", () => {
    const result = evaluatePublishReadinessSnapshot({
      ...readySnapshot,
      couple: { groom: { name: "" }, bride: {} },
      events: [{ title: "Draft" }],
      theme: { isActive: false, rendererKey: "missing", rendererConfigValid: true },
      usage: { galleryItems: 1, bankAccounts: 2, videoEmbeds: 1, backgroundAudio: true },
      referencedMediaIds: ["2fce4f09-b277-426d-b049-368712697097"],
      isPrivate: true,
    });

    expect(result.isReady).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "GROOM_NAME_REQUIRED",
      "BRIDE_NAME_REQUIRED",
      "PUBLISHABLE_EVENT_REQUIRED",
      "THEME_NOT_AVAILABLE",
      "GALLERY_LIMIT_EXCEEDED",
      "BANK_ACCOUNT_LIMIT_EXCEEDED",
      "VIDEO_LIMIT_EXCEEDED",
      "AUDIO_NOT_ALLOWED",
      "MEDIA_NOT_READY",
      "PIN_REQUIRED",
    ]));
    expect(result.issues.every((issue) => issue.path.length > 0 && issue.message.length > 0)).toBe(true);
  });
});
