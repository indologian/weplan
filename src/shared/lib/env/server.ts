import "server-only";

import { z } from "zod";
import { parsePublicEnv } from "./public";

const serverSecretSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

const midtransEnvSchema = z.enum(["sandbox", "production"]);

const midtransServerSchema = z.object({
  MIDTRANS_ENV: midtransEnvSchema,
  MIDTRANS_MERCHANT_ID: z.string().min(1),
  MIDTRANS_SERVER_KEY: z.string().min(1),
});

const redisSchema = z.object({
  REDIS_URL: z.string().url(),
  REDIS_TOKEN: z.string().min(1),
});

const sensitiveAuthSecretSchema = z.string().min(32);

export function getServerEnv() {
  return {
    ...parsePublicEnv({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }),
    ...serverSecretSchema.parse({
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    }),
  };
}

export function getMidtransEnv() {
  return midtransServerSchema.parse({
    MIDTRANS_ENV: process.env.MIDTRANS_ENV,
    MIDTRANS_MERCHANT_ID: process.env.MIDTRANS_MERCHANT_ID,
    MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
  });
}

export function getRedisEnv() {
  return redisSchema.parse({
    REDIS_URL: process.env.REDIS_URL,
    REDIS_TOKEN: process.env.REDIS_TOKEN,
  });
}

export function getSensitiveAuthHmacSecret(): string {
  return sensitiveAuthSecretSchema.parse(process.env.SENSITIVE_AUTH_HMAC_SECRET);
}

export function getTurnstileEnv() {
  return z.object({
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
    TURNSTILE_SECRET_KEY: z.string().min(1),
  }).parse({
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  });
}
