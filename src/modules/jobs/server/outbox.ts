import "server-only";

import crypto from "node:crypto";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import type { OutboxEvent, JobHandler } from "../types";
import { MAX_RETRY_ATTEMPTS, LEASE_TIMEOUT_SECONDS, BACKOFF_BASE_MS, BACKOFF_MAX_MS } from "../types";

const DISPATCH_BATCH_SIZE = 10;

export class OutboxError extends Error {
  constructor(
    message: string,
    public readonly code: "DISPATCH_FAILED" | "NO_HANDLER" | "DATABASE_ERROR",
  ) {
    super(message);
    this.name = "OutboxError";
  }
}

export async function claimAndDispatchEvents(
  handlers: Record<string, JobHandler>,
): Promise<{ dispatched: number; failed: number }> {
  const supabase = createSupabaseServiceClient();
  const lockToken = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data: candidates, error: fetchError } = await supabase
    .from("outbox_events")
    .select("id, event_type, aggregate_type, aggregate_id, payload_version, payload, status, attempts, available_at, created_at")
    .eq("status", "pending")
    .lte("available_at", now)
    .order("available_at", { ascending: true })
    .limit(DISPATCH_BATCH_SIZE);

  if (fetchError) {
    throw new OutboxError("Failed to fetch pending events: " + fetchError.message, "DATABASE_ERROR");
  }

  if (!candidates || candidates.length === 0) {
    return { dispatched: 0, failed: 0 };
  }

  let dispatched = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const claimResult = await supabase
      .from("outbox_events")
      .update({
        status: "dispatching",
        locked_at: now,
        lock_token: lockToken,
        attempts: candidate.attempts + 1,
      })
      .eq("id", candidate.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (claimResult.error || !claimResult.data) {
      continue;
    }

    const handler = handlers[candidate.event_type];
    if (!handler) {
      await moveToFailed(supabase, candidate.id, "NO_HANDLER", `No handler for event type '${candidate.event_type}'`);
      failed++;
      continue;
    }

    try {
      const event: OutboxEvent = {
        id: candidate.id,
        eventType: candidate.event_type,
        aggregateType: candidate.aggregate_type,
        aggregateId: candidate.aggregate_id,
        payloadVersion: candidate.payload_version,
        payload: candidate.payload as Record<string, unknown>,
        status: "dispatching",
        attempts: candidate.attempts + 1,
        availableAt: candidate.available_at,
        lockedAt: now,
        lockToken,
        dispatchedAt: null,
        lastErrorCode: null,
        createdAt: candidate.created_at ?? now,
      };

      const result = await handler(event);

      if (result.success) {
        await supabase
          .from("outbox_events")
          .update({
            status: "dispatched",
            dispatched_at: new Date().toISOString(),
            locked_at: null,
            lock_token: null,
          })
          .eq("id", candidate.id);
        dispatched++;
      } else {
        await handleRetryableFailure(supabase, candidate.id, candidate.attempts + 1, result.error ?? "Unknown error");
        failed++;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Handler threw unexpected error";
      await handleRetryableFailure(supabase, candidate.id, candidate.attempts + 1, errorMsg);
      failed++;
    }
  }

  return { dispatched, failed };
}

async function handleRetryableFailure(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  eventId: string,
  attempts: number,
  errorCode: string,
): Promise<void> {
  if (attempts >= MAX_RETRY_ATTEMPTS) {
    await moveToFailed(supabase, eventId, errorCode, `Exceeded ${MAX_RETRY_ATTEMPTS} retry attempts`);
    return;
  }

  const backoffMs = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempts - 1), BACKOFF_MAX_MS);
  const jitterMs = Math.floor(Math.random() * 1000);
  const retryAt = new Date(Date.now() + backoffMs + jitterMs);

  await supabase
    .from("outbox_events")
    .update({
      status: "pending",
      locked_at: null,
      lock_token: null,
      available_at: retryAt.toISOString(),
      last_error_code: errorCode,
    })
    .eq("id", eventId);
}

async function moveToFailed(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  eventId: string,
  errorCode: string,
  errorSummary: string,
): Promise<void> {
  const now = new Date().toISOString();

  const { data: event } = await supabase
    .from("outbox_events")
    .select("id, event_type, aggregate_id, attempts")
    .eq("id", eventId)
    .maybeSingle();

  if (event) {
    await supabase.from("failed_jobs").insert({
      job_type: event.event_type,
      resource_id: event.aggregate_id,
      idempotency_key: `failed_${event.id}_${event.attempts}`,
      attempt_count: event.attempts,
      error_code: errorCode,
      error_summary: errorSummary,
      first_failed_at: now,
      last_failed_at: now,
    });
  }

  await supabase
    .from("outbox_events")
    .update({
      status: "failed",
      locked_at: null,
      lock_token: null,
      last_error_code: errorCode,
    })
    .eq("id", eventId);
}

export async function reclaimStaleLeases(): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const staleThreshold = new Date(Date.now() - LEASE_TIMEOUT_SECONDS * 1000).toISOString();

  const { data, error } = await supabase
    .from("outbox_events")
    .update({
      status: "pending",
      locked_at: null,
      lock_token: null,
    })
    .eq("status", "dispatching")
    .lt("locked_at", staleThreshold)
    .select("id");

  return data?.length ?? 0;
}

export async function insertOutboxEvent(
  eventType: string,
  aggregateType: string,
  aggregateId: string | null,
  payload: Record<string, unknown>,
): Promise<string> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("outbox_events")
    .insert({
      event_type: eventType,
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      payload_version: 1,
      payload,
      status: "pending",
      available_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new OutboxError("Failed to insert outbox event: " + error.message, "DATABASE_ERROR");
  return data?.id ?? "mock-id";
}
