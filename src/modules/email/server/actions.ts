import "server-only";

import { Resend } from "resend";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { getResendEnv } from "@/shared/lib/env/server";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const env = getResendEnv();
    resendInstance = new Resend(env.RESEND_API_KEY);
  }
  return resendInstance;
}

export type EmailTemplate =
  | "payment_receipt"
  | "payment_expired"
  | "security_alert"
  | "invitation_reminder"
  | "renewal_reminder";

const FROM_ADDRESS = "Weplan <noreply@weplan.app>";

type SendEmailInput = {
  to: string;
  template: EmailTemplate;
  idempotencyKey: string;
  data: Record<string, unknown>;
};

type EmailSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

function getSubject(template: EmailTemplate): string {
  const subjects: Record<EmailTemplate, string> = {
    payment_receipt: "Bukti Pembayaran Weplan",
    payment_expired: "Pembayaran Weplan Kedaluwarsa",
    security_alert: "Peringatan Keamanan Akun Weplan",
    invitation_reminder: "Pengingat Undangan Weplan",
    renewal_reminder: "Pengingat Perpanjangan Weplan",
  };
  return subjects[template];
}

function getHtmlContent(template: EmailTemplate, data: Record<string, unknown>): string {
  const appName = "Weplan";
  const appUrl = (data.appUrl as string) ?? "https://weplan.app";

  switch (template) {
    case "payment_receipt":
      return `
        <h2>Pembayaran Berhasil</h2>
        <p>Terima kasih! Pembayaran Anda untuk undangan <strong>${data.invitationSlug ?? ""}</strong> telah berhasil diproses.</p>
        <p>Paket: <strong>${data.tierName ?? ""}</strong></p>
        <p>Durasi: <strong>${data.duration ?? ""}</strong></p>
        <p>Silakan kunjungi dashboard Anda untuk mempublish undangan.</p>
        <p><a href="${appUrl}/dashboard">Buka Dashboard</a></p>
      `;
    case "payment_expired":
      return `
        <h2>Pembayaran Kedaluwarsa</h2>
        <p>Pembayaran untuk undangan <strong>${data.invitationSlug ?? ""}</strong> telah kedaluwarsa.</p>
        <p>Anda dapat membuat checkout baru kapan saja dari dashboard.</p>
        <p><a href="${appUrl}/dashboard">Buka Dashboard</a></p>
      `;
    case "security_alert":
      return `
        <h2>Peringatan Keamanan</h2>
        <p>${data.message ?? "Aktivitas mencurigakan terdeteksi pada akun Anda."}</p>
        <p>Jika Anda tidak mengenali aktivitas ini, segera ubah PIN undangan Anda.</p>
      `;
    case "invitation_reminder":
      return `
        <h2>Pengingat Undangan</h2>
        <p>Undangan <strong>${data.invitationSlug ?? ""}</strong> Anda akan kedaluwarsa dalam ${data.daysUntilExpiry ?? ""} hari.</p>
        <p>Silakan perpanjang atau publish undangan Anda.</p>
        <p><a href="${appUrl}/dashboard">Buka Dashboard</a></p>
      `;
    case "renewal_reminder":
      return `
        <h2>Pengingat Perpanjangan</h2>
        <p>Undangan <strong>${data.invitationSlug ?? ""}</strong> akan kedaluwarsa dalam ${data.daysUntilExpiry ?? ""} hari.</p>
        <p>Perpanjang sekarang untuk menjaga undangan Anda tetap aktif.</p>
        <p><a href="${appUrl}/dashboard">Buka Dashboard</a></p>
      `;
    default:
      return `<p>${appName}</p>`;
  }
}

export async function sendEmail(input: SendEmailInput): Promise<EmailSendResult> {
  const supabase = createSupabaseServiceClient();

  const { data: existingDelivery } = await supabase
    .from("email_deliveries")
    .select("id, status")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existingDelivery) {
    if (existingDelivery.status === "sent" || existingDelivery.status === "delivered") {
      return { success: true, messageId: existingDelivery.id };
    }
    if (existingDelivery.status === "bounced" || existingDelivery.status === "complained") {
      return { success: false, error: "Email suppressed due to previous bounce/complaint." };
    }
  }

  const { error: insertError } = await supabase
    .from("email_deliveries")
    .insert({
      template_code: input.template,
      template_version: 1,
      idempotency_key: input.idempotencyKey,
      status: "sending",
      sent_at: new Date().toISOString(),
    });

  if (insertError) {
    return { success: false, error: "Failed to record email delivery." };
  }

  try {
    const resend = getResend();
    const { data: emailResult, error: resendError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [input.to],
      subject: getSubject(input.template),
      html: getHtmlContent(input.template, input.data),
    });

    if (resendError) {
      await supabase
        .from("email_deliveries")
        .update({ status: "failed", failed_at: new Date().toISOString() })
        .eq("idempotency_key", input.idempotencyKey);

      return { success: false, error: resendError.message };
    }

    await supabase
      .from("email_deliveries")
      .update({
        status: "sent",
        provider_message_id: emailResult?.id ?? null,
      })
      .eq("idempotency_key", input.idempotencyKey);

    return { success: true, messageId: emailResult?.id ?? undefined };
  } catch (error) {
    await supabase
      .from("email_deliveries")
      .update({ status: "failed", failed_at: new Date().toISOString() })
      .eq("idempotency_key", input.idempotencyKey);

    return { success: false, error: error instanceof Error ? error.message : "Email send failed." };
  }
}

export async function processEmailBounce(
  idempotencyKey: string,
  status: "bounced" | "complained",
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  await supabase
    .from("email_deliveries")
    .update({ status, failed_at: new Date().toISOString() })
    .eq("idempotency_key", idempotencyKey);
}
