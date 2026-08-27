import { NextResponse, type NextRequest } from "next/server";
import { getMidtransEnv } from "@/shared/lib/env/server";
import { verifyNotificationSignature } from "@/modules/payment/provider/midtrans/client";
import { processPaymentStatusAtomically } from "@/modules/payment/server/processing";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const env = getMidtransEnv();
    const signatureKey = body.signature_key as string;
    const orderId = body.order_id as string;
    const statusCode = body.status_code as string;
    const grossAmount = body.gross_amount as string;

    if (!signatureKey || !orderId || !statusCode || !grossAmount) {
      return NextResponse.json({ status: "error", message: "Missing required fields" }, { status: 400 });
    }

    const isValid = verifyNotificationSignature(orderId, statusCode, grossAmount, env.MIDTRANS_SERVER_KEY, signatureKey);
    if (!isValid) return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 403 });

    const result = await processPaymentStatusAtomically(orderId, "webhook", body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Webhook processing error:", error);
    if (error instanceof Error && error.message === "Status API unavailable") {
      return NextResponse.json({ status: "error", message: "Status API unavailable" }, { status: 503 });
    }
    if (error instanceof Error && (error.message === "Amount mismatch" || error.message === "Invalid currency" || error.message === "Merchant mismatch")) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
