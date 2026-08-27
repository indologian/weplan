import { NextResponse, type NextRequest } from "next/server";
import { processEmailBounce } from "@/modules/email/server/actions";
import { getResendEnv } from "@/shared/lib/env/server";
import crypto from "node:crypto";

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const expectedHmac = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedHmac, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text();
    const signature = request.headers.get("resend-signature") ?? "";

    let env;
    try {
      env = getResendEnv();
    } catch {
      return NextResponse.json({ received: true });
    }

    if (env.RESEND_WEBHOOK_SECRET && signature) {
      if (!verifyWebhookSignature(body, signature, env.RESEND_WEBHOOK_SECRET)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    const { type, data } = payload;

    if (type === "email.bounced" || type === "email.complained") {
      const idempotencyKey = `resend_${data?.email_id ?? "unknown"}`;
      const status = type === "email.bounced" ? "bounced" : "complained";
      await processEmailBounce(idempotencyKey, status);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Resend error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
