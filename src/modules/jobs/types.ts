export type OutboxEvent = {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string | null;
  payloadVersion: number;
  payload: Record<string, unknown>;
  status: "pending" | "dispatching" | "dispatched" | "failed";
  attempts: number;
  availableAt: string;
  lockedAt: string | null;
  lockToken: string | null;
  dispatchedAt: string | null;
  lastErrorCode: string | null;
  createdAt: string;
};

export type FailedJob = {
  id: string;
  jobType: string;
  resourceId: string | null;
  idempotencyKey: string;
  attemptCount: number;
  errorCode: string | null;
  errorSummary: string | null;
  firstFailedAt: string;
  lastFailedAt: string;
  resolvedAt: string | null;
  createdAt: string;
};

export type ScheduledJobRun = {
  id: string;
  jobName: string;
  startedAt: string;
  completedAt: string | null;
  status: "running" | "succeeded" | "failed";
  processedCount: number;
  failedCount: number;
  errorSummary: string | null;
};

export type JobHandler = (
  event: OutboxEvent,
) => Promise<{ success: boolean; error?: string }>;

export const MAX_RETRY_ATTEMPTS = 5;
export const LEASE_TIMEOUT_SECONDS = 5 * 60; // 5 minutes
export const BACKOFF_BASE_MS = 30_000; // 30 seconds
export const BACKOFF_MAX_MS = 30 * 60 * 1000; // 30 minutes
