import "server-only";

import crypto from "node:crypto";
import { z } from "zod";
import { getMidtransEnv } from "@/shared/lib/env/server";

const MIDTRANS_ENDPOINTS = {
  sandbox: {
    snap: "https://app.sandbox.midtrans.com",
    core: "https://api.sandbox.midtrans.com",
  },
  production: {
    snap: "https://app.midtrans.com",
    core: "https://api.midtrans.com",
  },
} as const;

export const MIDTRANS_REQUEST_TIMEOUT_MS = 4_000;

type MidtransApi = "snap" | "core";

type MidtransConfig = {
  snapBaseUrl: string;
  coreBaseUrl: string;
  serverKey: string;
};

function getConfig(): MidtransConfig {
  const env = getMidtransEnv();
  const endpoints = MIDTRANS_ENDPOINTS[env.MIDTRANS_ENV];

  return {
    snapBaseUrl: endpoints.snap,
    coreBaseUrl: endpoints.core,
    serverKey: env.MIDTRANS_SERVER_KEY,
  };
}

function authHeader(serverKey: string): string {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

export type MidtransExpiryUnit = "minute" | "hour" | "day";
export type MidtransExpiryUnitInput = MidtransExpiryUnit | `${MidtransExpiryUnit}s`;

export type CreateSnapRequest = {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  customer_details?: {
    first_name?: string;
    email?: string;
    phone?: string;
  };
  enabled_payments?: string[];
  credit_card?: {
    secure: boolean;
  };
  expiry?: {
    start_time?: string;
    duration: number;
    unit: MidtransExpiryUnitInput;
  };
  page_expiry?: {
    duration: number;
    unit: MidtransExpiryUnitInput;
  };
  callbacks?: {
    finish: string;
  };
};

const createSnapResponseSchema = z.object({
  token: z.string().min(1),
  redirect_url: z.url(),
}).passthrough();

const midtransStatusResponseSchema = z.object({
  status_code: z.string().regex(/^\d{3}$/),
  status_message: z.string().min(1),
  transaction_id: z.string().min(1),
  order_id: z.string().min(1),
  gross_amount: z.string().regex(/^(?:0|[1-9]\d*)\.00$/),
  currency: z.string().length(3).optional(),
  merchant_id: z.string().min(1).optional(),
  payment_type: z.string().min(1),
  transaction_time: z.string().min(1),
  transaction_status: z.string().min(1),
  fraud_status: z.string().min(1).optional(),
  settlement_time: z.string().min(1).optional(),
  va_numbers: z.array(z.object({
    bank: z.string().min(1),
    va_number: z.string().min(1),
  }).passthrough()).optional(),
  expiry_time: z.string().min(1).optional(),
}).passthrough();

const midtransCancelResponseSchema = z.object({
  status_code: z.string().min(1),
  status_message: z.string().min(1),
}).passthrough();

export type CreateSnapResponse = z.infer<typeof createSnapResponseSchema>;
export type MidtransStatusResponse = z.infer<typeof midtransStatusResponseSchema>;
export type MidtransCancelResponse = z.infer<typeof midtransCancelResponseSchema>;

export type MidtransErrorResponse = {
  status_code: string;
  status_message: string;
  error_messages?: string[];
};

export type MidtransClientErrorCode =
  | "HTTP_ERROR"
  | "INVALID_IDENTIFIER"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNSUPPORTED_OPERATION";

type MidtransClientErrorOptions = {
  code: MidtransClientErrorCode;
  retryable: boolean;
  httpStatus?: number;
  providerStatusCode?: string;
};

export class MidtransClientError extends Error {
  public readonly code: MidtransClientErrorCode;
  public readonly retryable: boolean;
  public readonly httpStatus?: number;
  public readonly providerStatusCode?: string;

  constructor(message: string, options: MidtransClientErrorOptions) {
    super(message);
    this.name = "MidtransClientError";
    this.code = options.code;
    this.retryable = options.retryable;
    this.httpStatus = options.httpStatus;
    this.providerStatusCode = options.providerStatusCode;
  }
}

function getProviderStatusCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("status_code" in body)) return undefined;
  const statusCode = (body as { status_code?: unknown }).status_code;
  return typeof statusCode === "string" ? statusCode : undefined;
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error
    && (error.name === "AbortError" || error.name === "TimeoutError");
}

function encodeIdentifier(identifier: string): string {
  if (typeof identifier !== "string" || identifier.length === 0) {
    throw new MidtransClientError("Midtrans identifier is required", {
      code: "INVALID_IDENTIFIER",
      retryable: false,
    });
  }

  return encodeURIComponent(identifier);
}

async function readResponseBody(response: Response): Promise<unknown> {
  let responseText: string;

  try {
    responseText = await response.text();
  } catch (error) {
    throw new MidtransClientError("Failed to read Midtrans response", {
      code: isTimeoutError(error) ? "TIMEOUT" : "NETWORK_ERROR",
      retryable: true,
      httpStatus: response.status,
    });
  }

  if (responseText.length === 0) return undefined;

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return undefined;
  }
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function request<T>(
  api: MidtransApi,
  path: string,
  responseSchema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const config = getConfig();
  const baseUrl = api === "snap" ? config.snapBaseUrl : config.coreBaseUrl;
  const url = `${baseUrl}${path}`;
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  headers.set("Authorization", authHeader(config.serverKey));

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(MIDTRANS_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new MidtransClientError(
      isTimeoutError(error) ? "Midtrans request timed out" : "Midtrans network request failed",
      {
        code: isTimeoutError(error) ? "TIMEOUT" : "NETWORK_ERROR",
        retryable: true,
      },
    );
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new MidtransClientError(`Midtrans API returned HTTP ${response.status}`, {
      code: "HTTP_ERROR",
      retryable: isRetryableHttpStatus(response.status),
      httpStatus: response.status,
      providerStatusCode: getProviderStatusCode(body),
    });
  }

  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    throw new MidtransClientError("Midtrans returned an invalid response", {
      code: "INVALID_RESPONSE",
      retryable: false,
      httpStatus: response.status,
      providerStatusCode: getProviderStatusCode(body),
    });
  }

  return parsed.data;
}

export async function createSnapTransaction(
  payload: CreateSnapRequest,
): Promise<CreateSnapResponse> {
  return request("snap", "/snap/v1/transactions", createSnapResponseSchema, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTransactionStatus(
  identifier: string,
): Promise<MidtransStatusResponse> {
  return request(
    "core",
    `/v2/${encodeIdentifier(identifier)}/status`,
    midtransStatusResponseSchema,
  );
}

export async function cancelMidtransTransaction(
  identifier: string,
): Promise<MidtransCancelResponse> {
  return request(
    "core",
    `/v2/${encodeIdentifier(identifier)}/cancel`,
    midtransCancelResponseSchema,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

/**
 * @deprecated Midtrans does not provide an official Snap-token cancellation API.
 * Retained temporarily so the existing out-of-scope payment action import fails closed.
 */
export async function cancelSnapTransaction(_token: string): Promise<never> {
  throw new MidtransClientError("Snap-token cancellation is not supported by Midtrans", {
    code: "UNSUPPORTED_OPERATION",
    retryable: false,
  });
}

export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string,
): boolean {
  if (
    typeof orderId !== "string"
    || typeof statusCode !== "string"
    || typeof grossAmount !== "string"
    || typeof serverKey !== "string"
    || typeof signatureKey !== "string"
    || orderId.length === 0
    || statusCode.length === 0
    || grossAmount.length === 0
    || serverKey.length === 0
    || !/^[a-fA-F0-9]{128}$/.test(signatureKey)
  ) {
    return false;
  }

  const expectedSignature = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  const actualBuffer = Buffer.from(signatureKey, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function padDatePart(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatMidtransWibStartTime(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError("A valid Date is required");
  }

  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1_000);
  const datePart = [
    wibDate.getUTCFullYear(),
    padDatePart(wibDate.getUTCMonth() + 1),
    padDatePart(wibDate.getUTCDate()),
  ].join("-");
  const timePart = [
    padDatePart(wibDate.getUTCHours()),
    padDatePart(wibDate.getUTCMinutes()),
    padDatePart(wibDate.getUTCSeconds()),
  ].join(":");

  return `${datePart} ${timePart} +0700`;
}
