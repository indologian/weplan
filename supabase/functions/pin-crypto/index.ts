import { withSupabase } from "@supabase/server";
import { hashPinUnlessReused } from "./crypto.ts";
import { readBoundedJson } from "./request.ts";

type PinCryptoRequest = {
  pin: string;
  comparisonHashes: string[];
};

function isPinCryptoRequest(value: unknown): value is PinCryptoRequest {
  if (!value || typeof value !== "object") return false;
  if (!("pin" in value) || !("comparisonHashes" in value)) return false;
  return typeof value.pin === "string"
    && /^[0-9]{6,10}$/.test(value.pin)
    && Array.isArray(value.comparisonHashes)
    && value.comparisonHashes.length <= 4
    && value.comparisonHashes.every((hash) => typeof hash === "string" && hash.length <= 512);
}

const pinCryptoHandler = {
  fetch: withSupabase(
    { auth: "secret", cors: "disabled" },
    async (request) => {
      if (request.method !== "POST") {
        return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
      }

      let body: unknown;
      try {
        body = await readBoundedJson(request, 4_096);
      } catch {
        return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
      }

      if (!isPinCryptoRequest(body)) {
        return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
      }

      try {
        return Response.json(await hashPinUnlessReused(body.pin, body.comparisonHashes));
      } catch {
        return Response.json({ error: "CRYPTO_OPERATION_FAILED" }, { status: 500 });
      }
    },
  ),
};

export default pinCryptoHandler;
