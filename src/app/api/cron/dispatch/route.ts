import { NextResponse, type NextRequest } from "next/server";
import { claimAndDispatchEvents, reclaimStaleLeases } from "@/modules/jobs/server/outbox";
import { runInvitationExpiry } from "@/modules/jobs/server/lifecycle";
import { sendEmail } from "@/modules/email/server/actions";
import { getServerEnv } from "@/shared/lib/env/server";
import crypto from "crypto";
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
    
    const { createSupabaseServiceClient } = await import("@/shared/lib/supabase/service-client");
    const { processPaymentStatusAtomically } = await import("@/modules/payment/server/processing");
    
    const supabase = createSupabaseServiceClient();
    const { data: attempt } = await supabase
      .from("payment_attempts")
      .select("order_id")
      .eq("transaction_id", transactionId)
      .order("attempt_no", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!attempt?.order_id) return { success: false, error: "No attempts found" };

    try {
      await processPaymentStatusAtomically(attempt.order_id, "status_poll");
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Reconciliation failed" };
    }
  },
  process_media: async (event) => {
    const { mediaId } = event.payload as { mediaId: string };
    if (!mediaId) return { success: false, error: "Missing mediaId" };
    const { processUploadedMedia } = await import("@/modules/storage/server/processing");
    const result = await processUploadedMedia(mediaId);
    return { success: result.success, error: result.error };
  },
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("authorization");
    const env = getServerEnv();
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const expected = crypto.createHash('sha256').update(env.CRON_SECRET).digest();
    const actual = crypto.createHash('sha256').update(token).digest();
    
    if (!crypto.timingSafeEqual(actual, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
