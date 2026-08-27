import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as dispatchGET } from "@/app/api/cron/dispatch/route";
import { GET as lifecycleGET } from "@/app/api/cron/lifecycle/route";
import { GET as metricsGET } from "@/app/api/admin/metrics/route";
import { POST as resendPOST } from "@/app/api/webhooks/resend/route";

vi.mock("server-only", () => ({}));

vi.mock("@/shared/lib/env/server", () => ({
  getServerEnv: () => ({
    CRON_SECRET: "mock-cron-secret",
    ADMIN_SECRET: "mock-admin-secret",
  }),
  getResendEnv: () => ({
    RESEND_API_KEY: "mock",
    RESEND_WEBHOOK_SECRET: "mock-resend-secret",
  }),
}));

// Mock modules so we don't actually run jobs/metrics during tests
vi.mock("@/modules/jobs/server/outbox", () => ({
  claimAndDispatchEvents: vi.fn().mockResolvedValue({ dispatched: 0, failed: 0 }),
  reclaimStaleLeases: vi.fn().mockResolvedValue(0),
}));
vi.mock("@/modules/jobs/server/lifecycle", () => ({
  runInvitationExpiry: vi.fn().mockResolvedValue({ processed: 0 }),
  runDraftRetentionCleanup: vi.fn().mockResolvedValue({ trashed: 0 }),
  runExpiredTrashCleanup: vi.fn().mockResolvedValue({ deleted: 0 }),
  runStaleMediaCleanup: vi.fn().mockResolvedValue({ cleaned: 0 }),
  runPaymentReconciliation: vi.fn().mockResolvedValue({ reconciled: 0 }),
}));
vi.mock("@/modules/admin/server/metrics", () => ({
  collectMetrics: vi.fn().mockResolvedValue({ outboxPending: 0, failedJobs: 0, paymentPendingAge: 0, emailFailed: 0, mediaProcessingFailed: 0 }),
}));

describe("Operational Endpoint Security", () => {
  describe("Cron Endpoints", () => {
    it("rejects dispatch requests without auth", async () => {
      const req = new NextRequest("http://localhost/api/cron/dispatch");
      const res = await dispatchGET(req);
      expect(res.status).toBe(401);
    });

    it("rejects dispatch requests with invalid token", async () => {
      const req = new NextRequest("http://localhost/api/cron/dispatch", {
        headers: { authorization: "Bearer invalid-secret" }
      });
      const res = await dispatchGET(req);
      expect(res.status).toBe(401);
    });

    it("rejects lifecycle requests without auth", async () => {
      const req = new NextRequest("http://localhost/api/cron/lifecycle");
      const res = await lifecycleGET(req);
      expect(res.status).toBe(401);
    });
  });

  describe("Admin Metrics Endpoint", () => {
    it("rejects requests without auth", async () => {
      const req = new NextRequest("http://localhost/api/admin/metrics");
      const res = await metricsGET(req);
      expect(res.status).toBe(401);
    });

    it("rejects requests with invalid token", async () => {
      const req = new NextRequest("http://localhost/api/admin/metrics", {
        headers: { authorization: "Bearer invalid-admin-secret" }
      });
      const res = await metricsGET(req);
      expect(res.status).toBe(401);
    });
  });

  describe("Resend Webhook", () => {
    it("rejects webhook without signature when secret is configured", async () => {
      const req = new NextRequest("http://localhost/api/webhooks/resend", {
        method: "POST",
        body: JSON.stringify({ type: "test" }),
      });
      // no resend-signature header
      const res = await resendPOST(req);
      expect(res.status).toBe(401);
      
      const json = await res.json();
      expect(json.error).toBe("Missing signature");
    });
    
    it("rejects webhook with invalid signature", async () => {
      const req = new NextRequest("http://localhost/api/webhooks/resend", {
        method: "POST",
        body: JSON.stringify({ type: "test" }),
        headers: { "resend-signature": "bad-signature" },
      });
      const res = await resendPOST(req);
      expect(res.status).toBe(401);
      
      const json = await res.json();
      expect(json.error).toBe("Invalid signature");
    });
  });
});
