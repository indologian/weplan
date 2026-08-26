import { describe, expect, it } from "vitest";
import { canTransition, assertValidTransition, InvalidStateTransitionError } from "@/modules/payment/state-machine";

describe("payment state machine", () => {
  describe("canTransition", () => {
    it("allows creating → awaiting_payment", () => {
      expect(canTransition("creating", "awaiting_payment")).toBe(true);
    });

    it("allows creating → provider_create_unknown", () => {
      expect(canTransition("creating", "provider_create_unknown")).toBe(true);
    });

    it("allows awaiting_payment → paid", () => {
      expect(canTransition("awaiting_payment", "paid")).toBe(true);
    });

    it("allows awaiting_payment → expired", () => {
      expect(canTransition("awaiting_payment", "expired")).toBe(true);
    });

    it("allows awaiting_payment → cancel_requested", () => {
      expect(canTransition("awaiting_payment", "cancel_requested")).toBe(true);
    });

    it("allows cancel_requested → cancelled", () => {
      expect(canTransition("cancel_requested", "cancelled")).toBe(true);
    });

    it("allows paid → partially_reversed", () => {
      expect(canTransition("paid", "partially_reversed")).toBe(true);
    });

    it("allows paid → reversed", () => {
      expect(canTransition("paid", "reversed")).toBe(true);
    });

    it("rejects paid → creating", () => {
      expect(canTransition("paid", "creating")).toBe(false);
    });

    it("rejects cancelled → paid", () => {
      expect(canTransition("cancelled", "paid")).toBe(false);
    });

    it("rejects expired → paid", () => {
      expect(canTransition("expired", "paid")).toBe(false);
    });

    it("rejects requires_review → anything", () => {
      expect(canTransition("requires_review", "paid")).toBe(false);
      expect(canTransition("requires_review", "cancelled")).toBe(false);
    });
  });

  describe("assertValidTransition", () => {
    it("throws InvalidStateTransitionError for invalid transitions", () => {
      expect(() => assertValidTransition("paid", "creating")).toThrow(InvalidStateTransitionError);
    });

    it("does not throw for valid transitions", () => {
      expect(() => assertValidTransition("creating", "awaiting_payment")).not.toThrow();
    });
  });
});
