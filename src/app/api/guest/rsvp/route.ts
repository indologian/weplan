import { NextResponse, type NextRequest } from "next/server";
import { submitRsvp, GuestError } from "@/modules/guest/server/actions";
import { checkRsvpRateLimit, extractIpFromHeaders } from "@/shared/lib/rate-limit";
import { verifyTurnstileToken } from "@/shared/lib/security/turnstile";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { verifyPrivateSessionFromCookie } from "@/modules/guest/server/pin-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { invitationId, name, phone, attendance, guestCount, wishMessage, turnstileToken, guestToken } = body;

    if (!invitationId || !name || !phone || !attendance) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 },
      );
    }

    const ip = extractIpFromHeaders(request.headers);
    const { data: invitation } = await createSupabaseServiceClient().from("invitations").select("is_private").eq("id", invitationId).maybeSingle();
    if (invitation?.is_private && !await verifyPrivateSessionFromCookie(invitationId)) {
      return NextResponse.json({ success:false, error:"Sesi undangan privat tidak valid." }, { status:403 });
    }

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
      guestToken: guestToken || undefined,
      editToken: request.cookies.get(`rsvp_edit_${invitationId}`)?.value,
    });
    const response = NextResponse.json({ success: true, data: { guestId: result.guestId } });
    if (result.editToken) response.cookies.set(`rsvp_edit_${invitationId}`, result.editToken, { httpOnly:true, secure:process.env.NODE_ENV==="production", sameSite:"lax", path:"/", maxAge:60*60*24*365 });
    return response;
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
