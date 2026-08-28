import { describe, expect, it } from "vitest";
import {
  isFundedSuccess,
  mapProviderStatusToPaymentState,
  mergeEntitlements,
  parseIdrAmount,
  type EntitlementSnapshot,
} from "@/modules/payment/types";

describe("payment types", () => {
  describe("isFundedSuccess", () => {
    it("returns true for settlement + 200", () => {
      expect(isFundedSuccess("settlement", "200")).toBe(true);
    });

    it("returns true for capture + accept + 200", () => {
      expect(isFundedSuccess("capture", "200", "accept")).toBe(true);
    });

    it("returns false for capture + challenge + 200", () => {
      expect(isFundedSuccess("capture", "200", "challenge")).toBe(false);
    });

    it("returns false for non-200 status code", () => {
      expect(isFundedSuccess("settlement", "404")).toBe(false);
    });

    it("returns false for pending status", () => {
      expect(isFundedSuccess("pending", "200")).toBe(false);
    });

    it("returns true for settlement without fraud_status", () => {
      expect(isFundedSuccess("settlement", "200")).toBe(true);
    });
  });

  describe("mapProviderStatusToPaymentState", () => {
    it("maps settlement to paid", () => {
      expect(mapProviderStatusToPaymentState("settlement")).toBe("paid");
    });

    it("maps capture+accept to paid", () => {
      expect(mapProviderStatusToPaymentState("capture", "accept")).toBe("paid");
    });

    it("maps capture+challenge to requires_review", () => {
      expect(mapProviderStatusToPaymentState("capture", "challenge")).toBe("requires_review");
    });

    it("maps pending to awaiting_payment", () => {
      expect(mapProviderStatusToPaymentState("pending")).toBe("awaiting_payment");
    });

    it("maps deny to failed", () => {
      expect(mapProviderStatusToPaymentState("deny")).toBe("failed");
    });

    it("maps cancel to cancelled", () => {
      expect(mapProviderStatusToPaymentState("cancel")).toBe("cancelled");
    });

    it("maps expire to expired", () => {
      expect(mapProviderStatusToPaymentState("expire")).toBe("expired");
    });

    it("maps a full refund to reversed", () => {
      expect(mapProviderStatusToPaymentState("refund")).toBe("reversed");
    });

    it("maps a partial refund to partially_reversed", () => {
      expect(mapProviderStatusToPaymentState("partial_refund")).toBe("partially_reversed");
    });

    it("maps unknown status to requires_review", () => {
      expect(mapProviderStatusToPaymentState("something_new")).toBe("requires_review");
    });
  });

  describe("mergeEntitlements", () => {
    const base: EntitlementSnapshot = {
      schema_version: 1,
      tier_code: "basic",
      duration_months: 6,
      gallery_limit: 5,
      video_limit: 0,
      bank_account_limit: 3,
      audio_enabled: false,
      audio_size_limit_mb: 0,
      watermark_enabled: true,
    };

    const premium: EntitlementSnapshot = {
      schema_version: 1,
      tier_code: "premium",
      duration_months: 6,
      gallery_limit: 8,
      video_limit: 1,
      bank_account_limit: 5,
      audio_enabled: true,
      audio_size_limit_mb: 10,
      watermark_enabled: false,
    };

    it("returns incoming when no existing", () => {
      expect(mergeEntitlements(null, premium)).toEqual(premium);
    });

    it("takes max of numeric limits", () => {
      const result = mergeEntitlements(base, premium);
      expect(result.gallery_limit).toBe(8);
      expect(result.video_limit).toBe(1);
      expect(result.bank_account_limit).toBe(5);
      expect(result.audio_size_limit_mb).toBe(10);
    });

    it("ORs positive capabilities", () => {
      const result = mergeEntitlements(base, premium);
      expect(result.audio_enabled).toBe(true);
    });

    it("ANDs negative capabilities (watermark)", () => {
      const result = mergeEntitlements(base, premium);
      expect(result.watermark_enabled).toBe(false);
    });

    it("keeps incoming tier_code", () => {
      const result = mergeEntitlements(base, premium);
      expect(result.tier_code).toBe("premium");
    });
  });

  describe("parseIdrAmount", () => {
    it.each([
      ["0", 0],
      ["99000", 99000],
      ["99000.00", 99000],
      ["00125.0000", 125],
      [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
    ])("parses exact IDR value %s", (input, expected) => {
      expect(parseIdrAmount(input)).toEqual({ ok: true, amountIdr: expected });
    });

    it.each(["", " 99000.00", "99000.00 ", "+99000", "-1", "1.", ".00", "1,000", "NaN"])(
      "rejects invalid decimal format %s",
      (input) => {
        expect(parseIdrAmount(input)).toMatchObject({
          ok: false,
          error: { code: "INVALID_FORMAT" },
        });
      },
    );

    it.each(["1.01", "99000.50", "0.0001"])(
      "rejects fractional IDR value %s",
      (input) => {
        expect(parseIdrAmount(input)).toMatchObject({
          ok: false,
          error: { code: "FRACTIONAL_IDR" },
        });
      },
    );

    it("rejects values outside the safe integer range without rounding", () => {
      expect(parseIdrAmount("9007199254740992.00")).toMatchObject({
        ok: false,
        error: { code: "OUT_OF_SAFE_RANGE" },
      });
    });
  });
});
