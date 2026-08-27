import "server-only";

import { Redis } from "@upstash/redis";
import { getRedisEnv } from "@/shared/lib/env/server";

let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    const env = getRedisEnv();
    redisInstance = new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN });
  }
  return redisInstance;
}

const INCIDENT_CLOSE_WINDOW_SECONDS = 60 * 60; // 1 hour

type IncidentState = {
  id: string;
  invitationId: string;
  startedAt: number;
  lastSuspiciousAt: number;
  alertSent: boolean;
};

function incidentKey(invitationId: string): string {
  return `pin:incident:${invitationId}`;
}

export async function createOrUpdateIncident(
  invitationId: string,
): Promise<{ isNew: boolean; shouldSendAlert: boolean }> {
  const redis = getRedis();
  const now = Math.floor(Date.now() / 1000);
  const key = incidentKey(invitationId);

  const existing = await redis.get<string>(key);

  if (!existing) {
    const incident: IncidentState = {
      id: `inc_${now}_${Math.random().toString(36).slice(2, 8)}`,
      invitationId,
      startedAt: now,
      lastSuspiciousAt: now,
      alertSent: true,
    };
    await redis.set(key, JSON.stringify(incident), { ex: INCIDENT_CLOSE_WINDOW_SECONDS * 2 });
    return { isNew: true, shouldSendAlert: true };
  }

  const state: IncidentState = JSON.parse(existing);
  state.lastSuspiciousAt = now;
  await redis.set(key, JSON.stringify(state), { ex: INCIDENT_CLOSE_WINDOW_SECONDS * 2 });

  return { isNew: false, shouldSendAlert: false };
}

export async function checkIncidentStatus(
  invitationId: string,
): Promise<{
  active: boolean;
  shouldClose: boolean;
  shouldSendRecovery: boolean;
} | null> {
  const redis = getRedis();
  const now = Math.floor(Date.now() / 1000);
  const key = incidentKey(invitationId);

  const existing = await redis.get<string>(key);
  if (!existing) return null;

  const state: IncidentState = JSON.parse(existing);
  const silenceDuration = now - state.lastSuspiciousAt;

  if (silenceDuration >= INCIDENT_CLOSE_WINDOW_SECONDS) {
    await redis.del(key);
    return {
      active: false,
      shouldClose: true,
      shouldSendRecovery: state.alertSent,
    };
  }

  return {
    active: true,
    shouldClose: false,
    shouldSendRecovery: false,
  };
}

export async function isIncidentActive(
  invitationId: string,
): Promise<boolean> {
  const redis = getRedis();
  const existing = await redis.get<string>(incidentKey(invitationId));
  return existing !== null;
}
