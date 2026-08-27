import { NextResponse } from "next/server";
import { claimAndDispatchEvents, reclaimStaleLeases } from "@/modules/jobs/server/outbox";
import { runInvitationExpiry } from "@/modules/jobs/server/lifecycle";
import { sendEmail } from "@/modules/email/server/actions";
import type { JobHandler } from "@/modules/jobs/types";

const jobHandlers: Record<string, JobHandler> = {
  email: async (event) => {
    const { to, template, idempotencyKey, data } = event.payload as {
      to: string;
      template: string;
      idempotencyKey: string;
      data: Record<string, unknown>;
    };
    if (!to || !template || !idempotencyKey) return { success: false, error: "Missing email fields" };
    const result = await sendEmail({ to, template: template as never, idempotencyKey, data: data ?? {} });
    return { success: result.success, error: result.error };
  },
  payment_reconciliation: async (event) => {
    const { transactionId } = event.payload as { transactionId: string };
    if (!transactionId) return { success: false, error: "Missing transactionId" };
    return { success: true };
  },
};

export async function GET(): Promise<NextResponse> {
  try {
    const reclaimed = await reclaimStaleLeases();
    const { dispatched, failed } = await claimAndDispatchEvents(jobHandlers);
    const expiry = await runInvitationExpiry().catch(() => ({ processed: 0 }));

    return NextResponse.json({
      success: true,
      reclaimed,
      dispatched,
      failed,
      expiryProcessed: expiry.processed,
    });
  } catch (error) {
    console.error("[CRON] dispatch error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Dispatch failed." },
      { status: 500 },
    );
  }
}
