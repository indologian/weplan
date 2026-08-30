import { describe, expect, it } from "vitest";
import { projectInvitationWorkspaceState } from "@/modules/invitation/workspace-state";

const now = new Date("2026-08-30T10:00:00.000Z");

describe("invitation workspace state projection", () => {
  it("treats an elapsed entitlement as expired before cron updates the row", () => {
    const result = projectInvitationWorkspaceState({
      status: "published",
      entitlementTierId: "tier-1",
      expiresAt: "2026-08-30T09:59:59.000Z",
      deletedAt: null,
      now,
    });

    expect(result.effectiveLifecycle).toBe("expired");
    expect(result.editable).toBe(false);
    expect(result.availableActions).toEqual(["delete"]);
  });

  it("keeps payment state separate from lifecycle", () => {
    const result = projectInvitationWorkspaceState({
      status: "draft",
      entitlementTierId: null,
      expiresAt: null,
      deletedAt: null,
      latestTransaction: { type: "initial_publish", state: "awaiting_payment" },
      now,
    });

    expect(result.effectiveLifecycle).toBe("draft");
    expect(result.commercialUiState).toBe("pending_initial_publish");
    expect(result.availableActions).toEqual(["edit", "preview", "delete"]);
  });

  it("locks a soft-deleted invitation regardless of its stored status", () => {
    const result = projectInvitationWorkspaceState({
      status: "published",
      entitlementTierId: "tier-1",
      expiresAt: "2026-09-30T10:00:00.000Z",
      deletedAt: "2026-08-30T09:00:00.000Z",
      now,
    });

    expect(result.effectiveLifecycle).toBe("trashed");
    expect(result.availableActions).toEqual([]);
  });

  it("only exposes the public link for an effectively published invitation", () => {
    const result = projectInvitationWorkspaceState({
      status: "published",
      entitlementTierId: "tier-1",
      expiresAt: "2026-09-30T10:00:00.000Z",
      deletedAt: null,
      now,
    });

    expect(result.availableActions).toEqual(["edit", "preview", "view_public", "delete"]);
    expect(result.commercialUiState).toBe("entitlement_active");
  });

  it("projects provider uncertainty as payment review", () => {
    const result = projectInvitationWorkspaceState({
      status: "draft",
      entitlementTierId: null,
      expiresAt: null,
      deletedAt: null,
      latestTransaction: { type: "initial_publish", state: "provider_create_unknown" },
      now,
    });

    expect(result.commercialUiState).toBe("payment_review");
  });
});
