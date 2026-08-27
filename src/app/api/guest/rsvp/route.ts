import { NextResponse, type NextRequest } from "next/server";
import { submitRsvp, GuestError } from "@/modules/guest/server/actions";
import { checkRsvpRateLimit, extractIpFromHeaders } from "@/shared/lib/rate-limit";
import { verifyTurnstileToken } from "@/shared/lib/security/turnstile";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { invitationId, name, phone, attendance, guestCount, wishMessage, turnstileToken } = body;

    if (!invitationId || !name || !phone || !attendance) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 },
      );
    }

    const ip = extractIpFromHeaders(request.headers);

    const rateLimitResult = await checkRsvpRateLimit(invitationId, ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many submissions. Please try again later.",
          retryAfterMs: rateLimitResult.resetMs,
        },
        { status: 429 },
      );
    }

    if (turnstileToken) {
      const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileResult.success) {
        return NextResponse.json(
          { success: false, error: turnstileResult.error ?? "Verification failed." },
          { status: 403 },
        );
      }
    }

    const result = await submitRsvp({
      invitationId,
      name,
      phone,
      attendance,
      guestCount: guestCount ?? 1,
      wishMessage: wishMessage || undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof GuestError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan." },
      { status: 500 },
    );
  }
}
