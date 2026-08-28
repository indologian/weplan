import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMidtransEnvMock } = vi.hoisted(() => ({
  getMidtransEnvMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/shared/lib/env/server", () => ({
  getMidtransEnv: getMidtransEnvMock,
}));

import {
  MIDTRANS_REQUEST_TIMEOUT_MS,
  MidtransClientError,
  cancelMidtransTransaction,
  cancelSnapTransaction,
  createSnapTransaction,
  formatMidtransWibStartTime,
  getTransactionStatus,
  verifyNotificationSignature,
  type CreateSnapRequest,
} from "@/modules/payment/provider/midtrans/client";

const validStatusResponse = {
  status_code: "200",
  status_message: "Success, transaction is found",
  transaction_id: "provider-transaction-id",
  order_id: "order-1",
  gross_amount: "99000.00",
  currency: "IDR",
  merchant_id: "merchant-id",
  payment_type: "bank_transfer",
  transaction_time: "2026-08-28 10:00:00",
  transaction_status: "settlement",
  fraud_status: "accept",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Midtrans provider client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    getMidtransEnvMock.mockReset();
    getMidtransEnvMock.mockReturnValue({
      MIDTRANS_ENV: "sandbox",
      MIDTRANS_MERCHANT_ID: "merchant-id",
      MIDTRANS_SERVER_KEY: "Mid-server-test",
    });
  });

  it("uses the Snap host and hardened JSON request options for create", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      token: "snap-token",
      redirect_url: "https://app.sandbox.midtrans.com/snap/v4/redirect/token",
      provider_extra: "preserved",
    }));

    const startTime = formatMidtransWibStartTime(new Date("2026-08-28T03:00:00.000Z"));
    const payload: CreateSnapRequest = {
      transaction_details: { order_id: "order-1", gross_amount: 99_000 },
      expiry: { start_time: startTime, duration: 180, unit: "minutes" },
      page_expiry: { duration: 3, unit: "hours" },
    };

    const result = await createSnapTransaction(payload);

    expect(result).toMatchObject({
      token: "snap-token",
      provider_extra: "preserved",
    });
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0]!;
    const headers = options?.headers as Headers;
    expect(url).toBe("https://app.sandbox.midtrans.com/snap/v1/transactions");
    expect(options).toMatchObject({
      method: "POST",
      cache: "no-store",
      redirect: "error",
    });
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Cache-Control")).toBe("no-store");
    expect(headers.get("Authorization")).toBe(
      `Basic ${Buffer.from("Mid-server-test:").toString("base64")}`,
    );
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(options?.body))).toMatchObject({
      expiry: { start_time: "2026-08-28 10:00:00 +0700", unit: "minutes" },
      page_expiry: { duration: 3, unit: "hours" },
    });
    expect(MIDTRANS_REQUEST_TIMEOUT_MS).toBeLessThan(5_000);
  });

  it("uses the production Core API host and URL-encodes status identifiers", async () => {
    getMidtransEnvMock.mockReturnValue({
      MIDTRANS_ENV: "production",
      MIDTRANS_MERCHANT_ID: "merchant-id",
      MIDTRANS_SERVER_KEY: "Mid-server-production",
    });
    fetchMock.mockResolvedValueOnce(jsonResponse({
      ...validStatusResponse,
      provider_extension: { retained: true },
    }));

    const result = await getTransactionStatus("order/id #1");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.midtrans.com/v2/order%2Fid%20%231/status",
    );
    expect(result).toMatchObject({
      order_id: "order-1",
      provider_extension: { retained: true },
    });
  });

  it("uses the sandbox Core API host and URL-encodes cancel identifiers", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      status_code: "200",
      status_message: "Success, transaction is canceled",
      transaction_status: "cancel",
    }));

    const result = await cancelMidtransTransaction("transaction/id");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.sandbox.midtrans.com/v2/transaction%2Fid/cancel",
    );
    expect(result.status_code).toBe("200");
  });

  it("rejects an empty identifier before issuing a request", async () => {
    await expect(getTransactionStatus("")).rejects.toMatchObject({
      code: "INVALID_IDENTIFIER",
      retryable: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates successful Create Snap responses", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      token: "",
      redirect_url: "not-a-url",
    }));

    await expect(createSnapTransaction({
      transaction_details: { order_id: "order-1", gross_amount: 99_000 },
    })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      retryable: false,
    });
  });

  it("rejects fractional IDR from a status response instead of truncating it", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      ...validStatusResponse,
      gross_amount: "99000.50",
    }));

    await expect(getTransactionStatus("order-1")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      retryable: false,
    });
  });

  it.each([
    { status: 400, retryable: false },
    { status: 429, retryable: true },
    { status: 503, retryable: true },
  ])("classifies HTTP $status errors", async ({ status, retryable }) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      status_code: String(status),
      status_message: "Provider error",
    }, status));

    await expect(getTransactionStatus("order-1")).rejects.toMatchObject({
      code: "HTTP_ERROR",
      retryable,
      httpStatus: status,
      providerStatusCode: String(status),
    });
  });

  it("classifies timeout and network failures without retaining a provider body", async () => {
    const timeoutError = new Error("request timed out");
    timeoutError.name = "TimeoutError";
    fetchMock.mockRejectedValueOnce(timeoutError);

    await expect(getTransactionStatus("order-1")).rejects.toMatchObject({
      code: "TIMEOUT",
      retryable: true,
    });

    fetchMock.mockRejectedValueOnce(new Error("socket failure"));

    await expect(getTransactionStatus("order-1")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      retryable: true,
    });
  });

  it("fails closed for the unsupported Snap-token cancellation operation", async () => {
    await expect(cancelSnapTransaction("snap-token")).rejects.toMatchObject({
      code: "UNSUPPORTED_OPERATION",
      retryable: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("verifies valid signatures and safely rejects malformed signatures", () => {
    const orderId = "order-1";
    const statusCode = "200";
    const grossAmount = "99000.00";
    const serverKey = "Mid-server-test";
    const signature = crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");

    expect(verifyNotificationSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      signature,
    )).toBe(true);
    expect(verifyNotificationSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      signature.toUpperCase(),
    )).toBe(true);
    expect(() => verifyNotificationSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      "abc",
    )).not.toThrow();
    expect(verifyNotificationSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      "abc",
    )).toBe(false);
    expect(verifyNotificationSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      "z".repeat(128),
    )).toBe(false);
  });

  it("formats an instant as the exact Midtrans WIB start_time format", () => {
    expect(formatMidtransWibStartTime(
      new Date("2026-08-28T17:30:45.000Z"),
    )).toBe("2026-08-29 00:30:45 +0700");
    expect(() => formatMidtransWibStartTime(new Date("invalid"))).toThrow(RangeError);
  });

  it("exposes classified errors as MidtransClientError instances", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));

    try {
      await getTransactionStatus("order-1");
      throw new Error("Expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(MidtransClientError);
      expect(error).not.toHaveProperty("responseBody");
    }
  });
});
