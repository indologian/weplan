import "server-only";

import crypto from "node:crypto";
import { getMidtransEnv } from "@/shared/lib/env/server";

const MIDTRANS_ENDPOINTS = {
  sandbox: "https://app.sandbox.midtrans.com",
  production: "https://app.midtrans.com",
} as const;

type MidtransConfig = {
  baseUrl: string;
  serverKey: string;
  merchantId: string;
};

function getConfig(): MidtransConfig {
  const env = getMidtransEnv();
  return {
    baseUrl: MIDTRANS_ENDPOINTS[env.MIDTRANS_ENV],
    serverKey: env.MIDTRANS_SERVER_KEY,
    merchantId: env.MIDTRANS_MERCHANT_ID,
  };
}

function authHeader(serverKey: string): string {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

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
    unit: "minute" | "hour" | "day";
  };
  callbacks?: {
    finish: string;
  };
};

export type CreateSnapResponse = {
  token: string;
  redirect_url: string;
};

export type MidtransStatusResponse = {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  currency?: string;
  merchant_id?: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  settlement_time?: string;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  expiry_time?: string;
};

export type MidtransErrorResponse = {
  status_code: string;
  status_message: string;
  error_messages?: string[];
};

export class MidtransClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: string,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "MidtransClientError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const config = getConfig();
  const url = `${config.baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(config.serverKey),
      ...options.headers,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new MidtransClientError(
      `Midtrans API error: ${response.status}`,
      String(response.status),
      body,
    );
  }

  return body as T;
}

export async function createSnapTransaction(
  payload: CreateSnapRequest,
): Promise<CreateSnapResponse> {
  return request<CreateSnapResponse>("/snap/v1/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTransactionStatus(
  orderId: string,
): Promise<MidtransStatusResponse> {
  return request<MidtransStatusResponse>(
    `/v2/${orderId}/status`,
  );
}

export async function cancelSnapTransaction(
  token: string,
): Promise<{ status_code: string; status_message: string }> {
  return request(`/snap/v1/transactions/${token}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function cancelMidtransTransaction(
  orderId: string,
): Promise<{ status_code: string; status_message: string }> {
  return request(`/v2/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string,
): boolean {
  const expectedSignature = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signatureKey, "hex"),
    Buffer.from(expectedSignature, "hex"),
  );
}
