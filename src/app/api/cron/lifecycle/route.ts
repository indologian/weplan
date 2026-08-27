import { NextResponse } from "next/server";
import { runInvitationExpiry, runDraftRetentionCleanup, runExpiredTrashCleanup, runStaleMediaCleanup, runPaymentReconciliation } from "@/modules/jobs/server/lifecycle";

export async function GET(): Promise<NextResponse> {
  try {
    const results = await Promise.allSettled([
      runInvitationExpiry(),
      runDraftRetentionCleanup(),
      runExpiredTrashCleanup(),
      runStaleMediaCleanup(),
      runPaymentReconciliation(),
    ]);

    const response = {
      expiry: results[0].status === "fulfilled" ? results[0].value : { processed: 0, error: "failed" },
      draftRetention: results[1].status === "fulfilled" ? results[1].value : { trashed: 0, error: "failed" },
      trashCleanup: results[2].status === "fulfilled" ? results[2].value : { deleted: 0, error: "failed" },
      staleMedia: results[3].status === "fulfilled" ? results[3].value : { cleaned: 0, error: "failed" },
      reconciliation: results[4].status === "fulfilled" ? results[4].value : { reconciled: 0, error: "failed" },
    };

    return NextResponse.json({ success: true, ...response });
  } catch (error) {
    console.error("[CRON] lifecycle error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lifecycle job failed." },
      { status: 500 },
    );
  }
}
