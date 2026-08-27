import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { insertOutboxEvent } from "./outbox";

export async function runInvitationExpiry(): Promise<{ processed: number }> {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { data: expiredInvitations, error } = await supabase
    .from("invitations")
    .select("id, status")
    .in("status", ["draft", "published"])
    .not("entitlement_tier_id", "is", null)
    .not("expires_at", "is", null)
    .lte("expires_at", now);

  if (error || !expiredInvitations) return { processed: 0 };

  let processed = 0;
  for (const inv of expiredInvitations) {
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "expired", updated_at: now })
      .eq("id", inv.id)
      .in("status", ["draft", "published"]);

    if (!updateError) processed++;
  }

  return { processed };
}

export async function runDraftRetentionCleanup(): Promise<{ trashed: number }> {
  const supabase = createSupabaseServiceClient();
  const now = new Date();
  const graceDays = 30;
  const deleteThreshold = new Date(now.getTime() - graceDays * 24 * 60 * 60 * 1000);

  const { data: staleDrafts, error } = await supabase
    .from("invitations")
    .select("id, last_activity_at, paid_retention_until")
    .eq("status", "draft")
    .is("entitlement_tier_id", null)
    .not("status", "eq", "trashed");

  if (error || !staleDrafts) return { trashed: 0 };

  let trashed = 0;
  for (const draft of staleDrafts) {
    const effectiveRetention = draft.paid_retention_until
      ? new Date(Math.max(new Date(draft.last_activity_at).getTime() + 90 * 24 * 60 * 60 * 1000, new Date(draft.paid_retention_until).getTime()))
      : new Date(new Date(draft.last_activity_at).getTime() + 90 * 24 * 60 * 60 * 1000);

    if (effectiveRetention <= now) {
      const { error: trashError } = await supabase
        .from("invitations")
        .update({ status: "trashed", deleted_at: now.toISOString() })
        .eq("id", draft.id)
        .eq("status", "draft")
        .is("entitlement_tier_id", null);

      if (!trashError) trashed++;
    }
  }

  return { trashed };
}

export async function runExpiredTrashCleanup(): Promise<{ deleted: number }> {
  const supabase = createSupabaseServiceClient();
  const now = new Date();
  const deleteThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: oldTrash, error } = await supabase
    .from("invitations")
    .select("id")
    .eq("status", "trashed")
    .not("deleted_at", "is", null)
    .lte("deleted_at", deleteThreshold.toISOString());

  if (error || !oldTrash) return { deleted: 0 };

  let deleted = 0;
  for (const inv of oldTrash) {
    await supabase.storage.from("invitation_media").list(`${inv.id}`).then(({ data }) => {
      if (data) {
        const paths = data.map((f) => `${inv.id}/${f.name}`);
        return supabase.storage.from("invitation_media").remove(paths);
      }
    }).catch(() => {});

    const { error: delError } = await supabase
      .from("invitations")
      .delete()
      .eq("id", inv.id);

    if (!delError) deleted++;
  }

  return { deleted };
}

export async function runStaleMediaCleanup(): Promise<{ cleaned: number }> {
  const supabase = createSupabaseServiceClient();
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: staleMedia, error } = await supabase
    .from("media_assets")
    .select("id, quarantine_path")
    .in("status", ["pending_upload", "uploaded"])
    .lt("created_at", threshold);

  if (error || !staleMedia) return { cleaned: 0 };

  let cleaned = 0;
  for (const media of staleMedia) {
    if (media.quarantine_path) {
      await supabase.storage.from("invitation_upload_quarantine").remove([media.quarantine_path]).catch(() => {});
    }
    await supabase
      .from("media_assets")
      .update({ status: "deleted" })
      .eq("id", media.id);
    cleaned++;
  }

  return { cleaned };
}

export async function runPaymentReconciliation(): Promise<{ reconciled: number }> {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { data: pendingPayments, error } = await supabase
    .from("transactions")
    .select("id, payment_state, client_request_id")
    .in("payment_state", ["creating", "provider_create_unknown", "awaiting_payment", "cancel_requested"])
    .lte("updated_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

  if (error || !pendingPayments) return { reconciled: 0 };

  let reconciled = 0;
  for (const tx of pendingPayments) {
    await insertOutboxEvent(
      "payment_reconciliation",
      "transaction",
      tx.id,
      { transactionId: tx.id, currentState: tx.payment_state },
    );
    reconciled++;
  }

  return { reconciled };
}
