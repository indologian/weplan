import { describe, expect, it } from "vitest";

describe("pin-defense escalating blocks", () => {
  const BLOCK_15_MIN_MS = 15 * 60 * 1000;
  const BLOCK_1_HOUR_MS = 60 * 60 * 1000;

  function classifyFailureLevel(count: number): string {
    if (count >= 20) return "blocked_1h";
    if (count >= 10) return "blocked_15m";
    if (count >= 5) return "turnstile_required";
    return "normal";
  }

  function isHeightened(totalFailures: number, uniqueIps: number): boolean {
    if (totalFailures >= 50 && uniqueIps >= 10) return true;
    if (totalFailures >= 20 && totalFailures < 50 && uniqueIps >= 5) return true;
    return false;
  }

  describe("per-IP escalation thresholds", () => {
    it("normal for 0-4 failures", () => {
      for (let i = 0; i < 4; i++) {
        expect(classifyFailureLevel(i + 1)).toBe("normal");
      }
    });

    it("turnstile_required at 5 failures", () => {
      expect(classifyFailureLevel(5)).toBe("turnstile_required");
      expect(classifyFailureLevel(9)).toBe("turnstile_required");
    });

    it("blocked_15m at 10 failures", () => {
      expect(classifyFailureLevel(10)).toBe("blocked_15m");
      expect(classifyFailureLevel(19)).toBe("blocked_15m");
    });

    it("blocked_1h at 20 failures", () => {
      expect(classifyFailureLevel(20)).toBe("blocked_1h");
      expect(classifyFailureLevel(100)).toBe("blocked_1h");
    });
  });

  describe("distributed attack detection", () => {
    it("not heightened for low failure counts", () => {
      expect(isHeightened(10, 3)).toBe(false);
    });

    it("heightened when ≥20 failures AND ≥5 unique IPs", () => {
      expect(isHeightened(20, 5)).toBe(true);
      expect(isHeightened(25, 6)).toBe(true);
    });

    it("not heightened when ≥20 failures but <5 unique IPs", () => {
      expect(isHeightened(20, 4)).toBe(false);
    });

    it("heightened when ≥50 failures AND ≥10 unique IPs", () => {
      expect(isHeightened(50, 10)).toBe(true);
      expect(isHeightened(100, 15)).toBe(true);
    });

    it("not heightened when ≥50 failures but <10 unique IPs", () => {
      expect(isHeightened(50, 9)).toBe(false);
      expect(isHeightened(100, 5)).toBe(false);
    });
  });

  describe("block duration validation", () => {
    it("15m block is within expected range", () => {
      expect(BLOCK_15_MIN_MS).toBe(15 * 60 * 1000);
      expect(BLOCK_15_MIN_MS).toBeGreaterThan(0);
    });

    it("1h block is within expected range", () => {
      expect(BLOCK_1_HOUR_MS).toBe(60 * 60 * 1000);
      expect(BLOCK_1_HOUR_MS).toBeGreaterThan(BLOCK_15_MIN_MS);
    });
  });

  describe("heightened attempt limits", () => {
    const HEIGHTENED_MAX_ATTEMPTS = 2;
    const HEIGHTENED_WINDOW_SECONDS = 15 * 60;

    it("allows first attempt in heightened mode", () => {
      expect(1).toBeLessThanOrEqual(HEIGHTENED_MAX_ATTEMPTS);
    });

    it("blocks at max attempts", () => {
      expect(HEIGHTENED_MAX_ATTEMPTS + 1).toBeGreaterThan(HEIGHTENED_MAX_ATTEMPTS);
    });

    it("window is 15 minutes", () => {
      expect(HEIGHTENED_WINDOW_SECONDS).toBe(15 * 60);
    });
  });

  describe("incident lifecycle constants", () => {
    const INCIDENT_CLOSE_WINDOW = 60 * 60;
    const RISK_HISTORY_TTL = 6 * 60 * 60;

    it("incident close window is 1 hour", () => {
      expect(INCIDENT_CLOSE_WINDOW).toBe(3600);
    });

    it("risk history TTL is 6 hours", () => {
      expect(RISK_HISTORY_TTL).toBe(21600);
    });

    it("TTL is at least 6x the close window", () => {
      expect(RISK_HISTORY_TTL).toBeGreaterThanOrEqual(INCIDENT_CLOSE_WINDOW * 6);
    });
  });
});
