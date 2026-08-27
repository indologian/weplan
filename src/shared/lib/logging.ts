import crypto from "node:crypto";

type LogLevel = "info" | "warn" | "error";

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  invitationId?: string;
  transactionId?: string;
  jobId?: string;
  duration?: number;
  error?: string;
  meta?: Record<string, unknown>;
};

const SENSITIVE_KEYS = new Set([
  "password", "pin", "token", "secret", "api_key", "apiKey",
  "server_key", "serverKey", "hmac", "hash", "signedUrl",
  "snap_token", "snapToken", "redirect_url", "redirectUrl",
]);

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) return "[REDACTED]";
  if (typeof value === "string" && value.length > 200) return value.substring(0, 200) + "...[truncated]";
  return value;
}

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = "[object]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.message,
  ];
  if (entry.requestId) parts.push(`req=${entry.requestId}`);
  if (entry.invitationId) parts.push(`inv=${entry.invitationId}`);
  if (entry.transactionId) parts.push(`tx=${entry.transactionId}`);
  if (entry.jobId) parts.push(`job=${entry.jobId}`);
  if (entry.duration !== undefined) parts.push(`${entry.duration}ms`);
  if (entry.error) parts.push(`err=${entry.error}`);
  return parts.join(" ");
}

export function createLogger(context?: { requestId?: string }) {
  const requestId = context?.requestId ?? crypto.randomUUID().substring(0, 8);

  function log(level: LogLevel, message: string, extra?: Partial<Omit<LogEntry, "timestamp" | "level" | "message">>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId,
      ...extra,
      meta: extra?.meta ? sanitizeMeta(extra.meta) : undefined,
    };

    const formatted = formatEntry(entry);

    switch (level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  return {
    info: (message: string, extra?: Partial<Omit<LogEntry, "timestamp" | "level" | "message">>) => log("info", message, extra),
    warn: (message: string, extra?: Partial<Omit<LogEntry, "timestamp" | "level" | "message">>) => log("warn", message, extra),
    error: (message: string, extra?: Partial<Omit<LogEntry, "timestamp" | "level" | "message">>) => log("error", message, extra),
    requestId,
  };
}
