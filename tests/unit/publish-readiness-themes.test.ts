import { describe, expect, it } from "vitest";
import { evaluatePublishReadinessSnapshot } from "@/modules/invitation/publish-readiness";

describe("publish readiness with themes", () => {
  const baseSnapshot = {
    couple: { groom: { name: "Ahmad" }, bride: { name: "Siti" } },
    events: [
      { title: "Akad Nikah", startsAt: "2026-10-15T08:00:00+07:00", timezone: "Asia/Jakarta" },
    ],
    usage: { galleryItems: 0, bankAccounts: 1, videoEmbeds: 0, backgroundAudio: false },
    allowance: { galleryItems: 10, bankAccounts: 5, videoEmbeds: 1, audioEnabled: true },
    referencedMediaIds: [],
    readyMediaIds: new Set<string>(),
    isPrivate: false,
    hasPinCredential: false,
  };

  it("passes readiness with a known renderer key", () => {
    const result = evaluatePublishReadinessSnapshot({
      ...baseSnapshot,
      theme: {
        isActive: true,
        rendererKey: "modern-editorial-ivory",
        rendererConfigValid: true,
      },
      knownRendererKeys: new Set([
        "_baseline",
        "modern-editorial-ivory",
        "romantic-floral-watercolor",
        "javanese-heritage",
        "luxury-midnight",
      ]),
    });

    expect(result.isReady).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("fails with unknown renderer key", () => {
    const result = evaluatePublishReadinessSnapshot({
      ...baseSnapshot,
      theme: {
        isActive: true,
        rendererKey: "unknown-theme",
        rendererConfigValid: true,
      },
      knownRendererKeys: new Set([
        "_baseline",
        "modern-editorial-ivory",
        "romantic-floral-watercolor",
        "javanese-heritage",
        "luxury-midnight",
      ]),
    });

    expect(result.isReady).toBe(false);
    expect(result.issues.some((i) => i.code === "THEME_NOT_AVAILABLE")).toBe(true);
  });

  it("fails with inactive theme", () => {
    const result = evaluatePublishReadinessSnapshot({
      ...baseSnapshot,
      theme: {
        isActive: false,
        rendererKey: "modern-editorial-ivory",
        rendererConfigValid: true,
      },
      knownRendererKeys: new Set(["modern-editorial-ivory"]),
    });

    expect(result.isReady).toBe(false);
    expect(result.issues.some((i) => i.code === "THEME_NOT_AVAILABLE")).toBe(true);
  });

  it("passes readiness for each launch theme", () => {
    const launchThemes = [
      "modern-editorial-ivory",
      "romantic-floral-watercolor",
      "javanese-heritage",
      "luxury-midnight",
    ];

    for (const rendererKey of launchThemes) {
      const result = evaluatePublishReadinessSnapshot({
        ...baseSnapshot,
        theme: {
          isActive: true,
          rendererKey,
          rendererConfigValid: true,
        },
        knownRendererKeys: new Set(launchThemes),
      });

      expect(result.isReady).toBe(true);
    }
  });
});
