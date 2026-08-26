import { argon2id, argon2Verify } from "hash-wasm";

export const ARGON2ID_PARAMETERS = Object.freeze({
  parallelism: 1,
  iterations: 2,
  memorySize: 19_456,
  hashLength: 32,
});

export type PinCryptoResult = { reused: true } | { reused: false; hash: string };

export async function hashPinUnlessReused(
  pin: string,
  comparisonHashes: readonly string[],
): Promise<PinCryptoResult> {
  for (const hash of comparisonHashes) {
    if (!hash.startsWith("$argon2id$")) throw new Error("Unsupported stored PIN hash");
    if (await argon2Verify({ password: pin, hash })) return { reused: true };
  }

  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = await argon2id({
    password: pin,
    salt,
    ...ARGON2ID_PARAMETERS,
    outputType: "encoded",
  });
  return { reused: false, hash };
}
