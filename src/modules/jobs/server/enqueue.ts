import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import crypto from "node:crypto";
import type { EmailTemplate } from "@/modules/email/server/actions";

type SendEmailViaOutboxInput = {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
};

export async function enqueueEmailOutbox(input: SendEmailViaOutboxInput): Promise<string> {
  const supabase = createSupabaseServiceClient();
  const idempotencyKey = `email_${input.template}_${crypto.randomUUID()}`;

  const { data, error } = await supabase
    .from("outbox_events")
    .insert({
      event_type: "email",
      aggregate_type: "email_delivery",
      aggregate_id: null,
      payload_version: 1,
      payload: {
        to: input.to,
        template: input.template,
        idempotencyKey,
        data: input.data,
      },
      status: "pending",
      available_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error("Failed to enqueue email: " + error.message);
  return data.id;
}

export async function enqueuePaymentReceiptEmail(
  userEmail: string,
  invitationSlug: string,
  tierName: string,
  duration: string,
): Promise<string> {
  return enqueueEmailOutbox({
    to: userEmail,
    template: "payment_receipt",
    data: { invitationSlug, tierName, duration },
  });
}

export async function enqueuePaymentExpiredEmail(
  userEmail: string,
  invitationSlug: string,
): Promise<string> {
  return enqueueEmailOutbox({
    to: userEmail,
    template: "payment_expired",
    data: { invitationSlug },
  });
}

export async function enqueueMediaProcessing(mediaId: string): Promise<string> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("outbox_events")
    .insert({
      event_type: "process_media",
      aggregate_type: "media_asset",
      aggregate_id: mediaId,
      payload_version: 1,
      payload: { mediaId },
      status: "pending",
      available_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error("Failed to enqueue media processing: " + error.message);
  return data.id;
}
