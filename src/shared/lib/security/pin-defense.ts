import "server-only";

import { Redis } from "@upstash/redis";
import { getRedisEnv } from "@/shared/lib/env/server";
import { pseudonymizeIp } from "@/shared/lib/rate-limit";

let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    const env = getRedisEnv();
    redisInstance = new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN });
  }
  return redisInstance;
}

const RISK_HISTORY_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const BLOCK_15_MIN_SECONDS = 15 * 60;
const BLOCK_1_HOUR_SECONDS = 60 * 60;
const INCIDENT_CLOSE_WINDOW_SECONDS = 60 * 60; // 1 hour no suspicious activity
const HEIGHTENED_ATTEMPT_WINDOW_SECONDS = 15 * 60;
const HEIGHTENED_MAX_ATTEMPTS = 2;

export type PinDefenseLevel = "normal" | "turnstile_required" | "blocked_15m" | "blocked_1h" | "heightened";

export type PinDefenseResult = {
  allowed: boolean;
  level: PinDefenseLevel;
  blockExpiresAt?: number;
  requiresTurnstile: boolean;
  incidentId?: string;
};

export type AttackAggregation = {
  totalFailures: number;
  uniqueIps: number;
  recentWindowSeconds: number;
};

function failureKey(invitationId: string, ipHash: string): string {
  return `pin:fail:${invitationId}:${ipHash}`;
}

function blockKey(invitationId: string, ipHash: string): string {
  return `pin:block:${invitationId}:${ipHash}`;
}

function invitationAggregateKey(invitationId: string): string {
  return `pin:agg:${invitationId}`;
}

function ipSetKey(invitationId: string): string {
  return `pin:ips:${invitationId}`;
}

function incidentKey(invitationId: string): string {
  return `pin:incident:${invitationId}`;
}

function heightenedKey(invitationId: string, ipHash: string): string {
  return `pin:heightened:${invitationId}:${ipHash}`;
}

export async function recordPinFailure(
  invitationId: string,
  ip: string,
): Promise<{ level: PinDefenseLevel; blockExpiresAt?: number }> {
  const redis = getRedis();
  const ipHash = pseudonymizeIp(ip);
  const now = Math.floor(Date.now() / 1000);

  const fKey = failureKey(invitationId, ipHash);
  const aggKey = invitationAggregateKey(invitationId);
  const ipsKey = ipSetKey(invitationId);

  const pipeline = redis.pipeline();
  pipeline.incr(fKey);
  pipeline.expire(fKey, RISK_HISTORY_TTL_SECONDS);
  pipeline.incr(aggKey);
  pipeline.expire(aggKey, RISK_HISTORY_TTL_SECONDS);
  pipeline.sadd(ipsKey, ipHash);
  pipeline.expire(ipsKey, RISK_HISTORY_TTL_SECONDS);

  const results = await pipeline.exec();
  const failureCount = (results?.[0] as number) ?? 1;
  const totalAgg = (results?.[2] as number) ?? 1;

  const level = classifyFailureLevel(failureCount);

  if (level === "blocked_15m") {
    await redis.set(blockKey(invitationId, ipHash), "15m", { ex: BLOCK_15_MIN_SECONDS });
  } else if (level === "blocked_1h") {
    await redis.set(blockKey(invitationId, ipHash), "1h", { ex: BLOCK_1_HOUR_SECONDS });
  }

  const uniqueIps = await redis.scard(ipsKey);
  const attackResult = await checkDistributedAttack(invitationId, totalAgg, uniqueIps ?? 0);

  if (attackResult.heightened) {
    await redis.set(heightenedKey(invitationId, ipHash), "1", { ex: RISK_HISTORY_TTL_SECONDS });
  }

  return {
    level: attackResult.heightened ? "heightened" : level,
    blockExpiresAt: level === "blocked_15m"
      ? now + BLOCK_15_MIN_SECONDS
      : level === "blocked_1h"
        ? now + BLOCK_1_HOUR_SECONDS
        : undefined,
  };
}

export async function checkPinDefense(
  invitationId: string,
  ip: string,
): Promise<PinDefenseResult> {
  const redis = getRedis();
  const ipHash = pseudonymizeIp(ip);
  const now = Math.floor(Date.now() / 1000);

  const blockValue = await redis.get<string>(blockKey(invitationId, ipHash));
  if (blockValue === "15m") {
    const ttl = await redis.ttl(blockKey(invitationId, ipHash));
    return {
      allowed: false,
      level: "blocked_15m",
      blockExpiresAt: now + ttl,
      requiresTurnstile: true,
    };
  }
  if (blockValue === "1h") {
    const ttl = await redis.ttl(blockKey(invitationId, ipHash));
    return {
      allowed: false,
      level: "blocked_1h",
      blockExpiresAt: now + ttl,
      requiresTurnstile: true,
    };
  }

  const failureCount = (await redis.get<number>(failureKey(invitationId, ipHash))) ?? 0;

  const isHeightened = await redis.get<string>(heightenedKey(invitationId, ipHash));
  if (isHeightened) {
    const attemptsInWindow = (await redis.get<number>(
      `pin:attempt:${invitationId}:${ipHash}:${Math.floor(now / HEIGHTENED_ATTEMPT_WINDOW_SECONDS)}`,
    )) ?? 0;
    if (attemptsInWindow >= HEIGHTENED_MAX_ATTEMPTS) {
      const blockTtl = await redis.ttl(heightenedKey(invitationId, ipHash));
      return {
        allowed: false,
        level: "heightened",
        blockExpiresAt: now + blockTtl,
        requiresTurnstile: true,
      };
    }
    return {
      allowed: true,
      level: "heightened",
      requiresTurnstile: true,
    };
  }

  if (failureCount >= 10) {
    return {
      allowed: true,
      level: "blocked_15m",
      requiresTurnstile: true,
    };
  }

  if (failureCount >= 5) {
    return {
      allowed: true,
      level: "turnstile_required",
      requiresTurnstile: true,
    };
  }

  return {
    allowed: true,
    level: "normal",
    requiresTurnstile: false,
  };
}

export async function clearPinBlockOnSuccess(
  invitationId: string,
  ip: string,
): Promise<void> {
  const redis = getRedis();
  const ipHash = pseudonymizeIp(ip);

  await redis.del(blockKey(invitationId, ipHash));
  await redis.del(heightenedKey(invitationId, ipHash));
}

export async function incrementHeightenedAttempt(
  invitationId: string,
  ip: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  const ipHash = pseudonymizeIp(ip);
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `pin:attempt:${invitationId}:${ipHash}:${Math.floor(now / HEIGHTENED_ATTEMPT_WINDOW_SECONDS)}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, HEIGHTENED_ATTEMPT_WINDOW_SECONDS);
  }

  return {
    allowed: count <= HEIGHTENED_MAX_ATTEMPTS,
    remaining: Math.max(0, HEIGHTENED_MAX_ATTEMPTS - count),
  };
}

async function checkDistributedAttack(
  invitationId: string,
  totalFailures: number,
  uniqueIps: number,
): Promise<{ heightened: boolean; incidentNeeded: boolean }> {
  if (totalFailures >= 50 && uniqueIps >= 10) {
    return { heightened: true, incidentNeeded: true };
  }
  if (totalFailures >= 20 && uniqueIps >= 5) {
    return { heightened: true, incidentNeeded: false };
  }
  return { heightened: false, incidentNeeded: false };
}

function classifyFailureLevel(count: number): PinDefenseLevel {
  if (count >= 20) return "blocked_1h";
  if (count >= 10) return "blocked_15m";
  if (count >= 5) return "turnstile_required";
  return "normal";
}
