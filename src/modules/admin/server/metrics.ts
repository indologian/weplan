import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";

type MetricsResult = {
  outboxPending: number;
  outboxFailed: number;
  failedJobs: number;
  scheduledJobRuns: number;
  emailPending: number;
  emailFailed: number;
  paymentPendingAge: number;
  mediaProcessingFailed: number;
  invitationCount: number;
  publishedCount: number;
  activeUsers: number;
};

export async function collectMetrics(): Promise<MetricsResult> {
  const supabase = createSupabaseServiceClient();

  const [
    outboxPending,
    outboxFailed,
    failedJobs,
    scheduledJobRuns,
    emailPending,
    emailFailed,
    paymentPending,
    mediaFailed,
    invitationCount,
    publishedCount,
    activeUsers,
  ] = await Promise.all([
    supabase.from("outbox_events").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("outbox_events").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("failed_jobs").select("id", { count: "exact", head: true }).is("resolved_at", null),
    supabase.from("scheduled_job_runs").select("id", { count: "exact", head: true }),
    supabase.from("email_deliveries").select("id", { count: "exact", head: true }).in("status", ["queued", "sending"]),
    supabase.from("email_deliveries").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("transactions").select("id, created_at", { count: "exact", head: true }).in("payment_state", ["creating", "provider_create_unknown", "awaiting_payment"]),
    supabase.from("media_assets").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("invitations").select("id", { count: "exact", head: true }),
    supabase.from("invitations").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("user_profiles").select("id", { count: "exact", head: true }),
  ]);

  let paymentPendingAge = 0;
  if (paymentPending.data && paymentPending.data.length > 0) {
    const oldest = paymentPending.data
      .map((r) => new Date(r.created_at).getTime())
      .sort((a, b) => a - b)[0];
    paymentPendingAge = Math.floor((Date.now() - oldest) / 1000);
  }

  return {
    outboxPending: outboxPending.count ?? 0,
    outboxFailed: outboxFailed.count ?? 0,
    failedJobs: failedJobs.count ?? 0,
    scheduledJobRuns: scheduledJobRuns.count ?? 0,
    emailPending: emailPending.count ?? 0,
    emailFailed: emailFailed.count ?? 0,
    paymentPendingAge,
    mediaProcessingFailed: mediaFailed.count ?? 0,
    invitationCount: invitationCount.count ?? 0,
    publishedCount: publishedCount.count ?? 0,
    activeUsers: activeUsers.count ?? 0,
  };
}
