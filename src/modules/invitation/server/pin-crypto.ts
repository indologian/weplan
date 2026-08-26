import "server-only";

import { z } from "zod";
import { getServerEnv } from "@/shared/lib/env/server";

const argon2idPhcPattern = /^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]{43}$/u;

const pinCryptoResponseSchema = z.discriminatedUnion("reused", [
  z.object({ reused: z.literal(true) }).strict(),
  z.object({ reused: z.literal(false), hash: z.string().regex(argon2idPhcPattern).max(512) }).strict(),
]);

export class PinCryptoError extends Error {
  constructor() {
    super("PIN crypto service is unavailable");
    this.name = "PinCryptoError";
  }
}

export async function hashPinWithHistoryCheck(
  pin: string,
  comparisonHashes: readonly string[],
): Promise<{ reused: true } | { reused: false; hash: string }> {
  const env = getServerEnv();
  const endpoint = new URL("/functions/v1/pin-crypto", env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SECRET_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({ pin, comparisonHashes }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) throw new PinCryptoError();
    return pinCryptoResponseSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof PinCryptoError) throw error;
    throw new PinCryptoError();
  }
}
