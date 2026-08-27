import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import crypto from "node:crypto";
import { getRedisEnv } from "@/shared/lib/env/server";

let redisInstance: Redis | null = null;
let pinLimiterInstance: Ratelimit | null = null;
let rsvpLimiterInstance: Ratelimit | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    const env = getRedisEnv();
    redisInstance = new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN });
  }
  return redisInstance;
}

function getPinLimiter(): Ratelimit {
  if (!pinLimiterInstance) {
    pinLimiterInstance = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "10 m"),
      analytics: true,
      prefix: "rl:pin",
    });
  }
  return pinLimiterInstance;
}

function getRsvpLimiter(): Ratelimit {
  if (!rsvpLimiterInstance) {
    rsvpLimiterInstance = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "rl:rsvp",
    });
  }
  return rsvpLimiterInstance;
}

const ipHmacSecret = process.env.RATE_LIMIT_HMAC_SECRET ?? "";

export function pseudonymizeIp(ip: string): string {
  if (!ip) return "unknown";
  return crypto.createHmac("sha256", ipHmacSecret).update(ip).digest("hex");
}

export function extractIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? headers.get("x-real-ip")
    ?? "unknown"
  );
}

export async function checkPinRateLimit(
  invitationId: string,
  ip: string,
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const limiter = getPinLimiter();
  const key = `${invitationId}:${pseudonymizeIp(ip)}`;
  const result = await limiter.limit(key);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetMs: result.reset - Date.now(),
  };
}

export async function checkRsvpRateLimit(
  invitationId: string,
  ip: string,
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const limiter = getRsvpLimiter();
  const key = `${invitationId}:${pseudonymizeIp(ip)}`;
  const result = await limiter.limit(key);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetMs: result.reset - Date.now(),
  };
}
