import { argon2Verify } from "hash-wasm";
import { hashPinUnlessReused } from "./crypto.ts";
import { readBoundedJson } from "./request.ts";

Deno.test("creates an Argon2id PHC hash and verifies it", async () => {
  const result = await hashPinUnlessReused("839204", []);
  if (result.reused || !result.hash.startsWith("$argon2id$")) {
    throw new Error("Expected a new Argon2id hash");
  }
  if (!await argon2Verify({ password: "839204", hash: result.hash })) {
    throw new Error("Generated hash did not verify");
  }
});

Deno.test("detects reuse against current or historical hashes", async () => {
  const first = await hashPinUnlessReused("839204", []);
  if (first.reused) throw new Error("Expected a new hash");

  const result = await hashPinUnlessReused("839204", [first.hash]);
  if (!result.reused || "hash" in result) {
    throw new Error("Expected reuse without returning a replacement hash");
  }
});

Deno.test("rejects a streamed request body above the byte limit", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    body: JSON.stringify({ pin: "839204", comparisonHashes: [], padding: "x".repeat(4_096) }),
  });

  let rejected = false;
  try {
    await readBoundedJson(request, 4_096);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Expected oversized body to be rejected");
});
